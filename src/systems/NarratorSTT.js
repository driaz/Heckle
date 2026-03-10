const MODEL_ID = 'scribe_v2_realtime'
const BASE_URL = 'wss://api.elevenlabs.io/v1/speech-to-text/realtime'

const MIN_WORDS = 3
const MIN_CHARS = 10

let ws = null
let micStream = null
let micContext = null
let micProcessor = null
let micSource = null
let transcriptCallback = null
let muted = false
let listening = false
let reconnecting = false
let lastPartialTime = 0
const SPEAKING_THRESHOLD_MS = 2000

function onTranscript(cb) { transcriptCallback = cb }
function isListening() { return listening }
function isPlayerSpeaking() { return Date.now() - lastPartialTime < SPEAKING_THRESHOLD_MS }
function setMuted(val) {
  const prev = muted
  muted = val
  if (prev !== val) console.log('[STT] Muted:', val)
}

async function fetchToken() {
  const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY
  const res = await fetch('https://api.elevenlabs.io/v1/single-use-token/realtime_scribe', {
    method: 'POST',
    headers: { 'xi-api-key': apiKey },
  })
  if (!res.ok) throw new Error(`Token fetch failed: ${res.status}`)
  const data = await res.json()
  return data.token
}

function buildUrl(token) {
  const params = new URLSearchParams({
    model_id: MODEL_ID,
    language_code: 'en',
    commit_strategy: 'vad',
    vad_silence_threshold_secs: '1.5',
    enable_logging: 'false',
    token,
  })
  return `${BASE_URL}?${params}`
}

function float32ToBase64Int16(float32Array) {
  const int16Array = new Int16Array(float32Array.length)
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]))
    int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7fff
  }
  const bytes = new Uint8Array(int16Array.buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

function isSubstantialTranscript(text) {
  if (!text) return false
  const trimmed = text.trim()
  if (trimmed.length < MIN_CHARS) return false
  if (trimmed.split(/\s+/).length < MIN_WORDS) return false
  return true
}

async function connectWebSocket() {
  const token = await fetchToken()
  console.log('[STT] Token acquired')

  return new Promise((resolve, reject) => {
    ws = new WebSocket(buildUrl(token))

    ws.onopen = () => {
      console.log('[STT] Connected')
      resolve()
    }

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)

      if (data.message_type === 'session_started') {
        console.log('[STT] Session started:', data.session_id)
      }

      if (data.message_type === 'committed_transcript') {
        const text = data.text?.trim()
        if (!text) return // Skip empty transcripts entirely

        if (!isSubstantialTranscript(text)) {
          console.log('[STT] Ignoring short transcript:', text)
          return
        }

        console.log('[STT] Transcript:', text)
        transcriptCallback?.(text)
      }

      if (data.message_type === 'partial_transcript' && data.text?.trim()) {
        lastPartialTime = Date.now()
        console.log('[STT] Partial:', data.text)
      }

      if (data.message_type?.includes('error') || data.error) {
        console.error('[STT] Server error:', data.message_type, data.error || data)
      }
    }

    ws.onerror = (err) => {
      console.error('[STT] WebSocket error:', err)
      reject(err)
    }

    ws.onclose = (event) => {
      console.log('[STT] WebSocket closed, code:', event.code, 'reason:', event.reason)
      ws = null

      // Auto-reconnect if we're still supposed to be listening
      if (listening && !reconnecting) {
        reconnecting = true
        console.log('[STT] Auto-reconnecting...')
        connectWebSocket()
          .then(() => { reconnecting = false })
          .catch((err) => {
            console.error('[STT] Reconnect failed:', err.message)
            reconnecting = false
          })
      }
    }
  })
}

async function startListening() {
  if (listening) return

  // Get mic
  micStream = await navigator.mediaDevices.getUserMedia({
    audio: {
      channelCount: 1,
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
  })

  // Use default sample rate, resample to 16kHz ourselves
  micContext = new AudioContext()
  if (micContext.state === 'suspended') {
    await micContext.resume()
  }
  console.log('[STT] AudioContext state:', micContext.state, 'sampleRate:', micContext.sampleRate)

  micSource = micContext.createMediaStreamSource(micStream)
  micProcessor = micContext.createScriptProcessor(4096, 1, 1)

  // Connect STT WebSocket
  await connectWebSocket()

  // Stream mic audio to STT — resample from native rate to 16kHz
  const nativeSampleRate = micContext.sampleRate
  let chunkCount = 0

  micProcessor.onaudioprocess = (e) => {
    if (muted) return
    if (!ws || ws.readyState !== WebSocket.OPEN) return

    const inputData = e.inputBuffer.getChannelData(0)

    // Resample from native rate to 16kHz
    const ratio = 16000 / nativeSampleRate
    const outputLength = Math.round(inputData.length * ratio)
    const resampled = new Float32Array(outputLength)
    for (let i = 0; i < outputLength; i++) {
      const srcIndex = i / ratio
      const srcFloor = Math.floor(srcIndex)
      const srcCeil = Math.min(srcFloor + 1, inputData.length - 1)
      const frac = srcIndex - srcFloor
      resampled[i] = inputData[srcFloor] * (1 - frac) + inputData[srcCeil] * frac
    }

    const base64 = float32ToBase64Int16(resampled)

    chunkCount++
    if (chunkCount % 50 === 1) {
      let maxVal = 0
      for (let i = 0; i < resampled.length; i++) {
        const abs = Math.abs(resampled[i])
        if (abs > maxVal) maxVal = abs
      }
      console.log('[STT] Sending chunk #' + chunkCount, 'peak:', maxVal.toFixed(4))
    }

    ws.send(JSON.stringify({
      message_type: 'input_audio_chunk',
      audio_base_64: base64,
      commit: false,
      sample_rate: 16000,
    }))
  }

  micSource.connect(micProcessor)
  micProcessor.connect(micContext.destination)

  listening = true
  console.log('[STT] Listening')
}

function stopListening() {
  listening = false

  if (micProcessor) { micProcessor.disconnect(); micProcessor = null }
  if (micSource) { micSource.disconnect(); micSource = null }
  if (micContext) { micContext.close(); micContext = null }
  if (micStream) { micStream.getTracks().forEach(t => t.stop()); micStream = null }
  if (ws) { ws.close(); ws = null }

  console.log('[STT] Stopped')
}

function isMuted() { return muted }

export default { startListening, stopListening, onTranscript, isListening, isPlayerSpeaking, isMuted, setMuted }
