const MODEL_ID = 'scribe_v2_realtime'
const BASE_URL = 'wss://api.elevenlabs.io/v1/speech-to-text/realtime'

let ws = null
let micStream = null
let micContext = null
let micProcessor = null
let micSource = null
let transcriptCallback = null
let muted = false
let listening = false

function onTranscript(cb) { transcriptCallback = cb }
function isListening() { return listening }
function setMuted(val) { muted = val }

function buildUrl() {
  const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY
  const params = new URLSearchParams({
    model_id: MODEL_ID,
    audio_format: 'pcm_16000',
    language_code: 'en',
    commit_strategy: 'vad',
    vad_silence_threshold_secs: '1.5',
    enable_logging: 'false',
    xi_api_key: apiKey,
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

async function startListening() {
  if (listening) return

  // Get mic
  micStream = await navigator.mediaDevices.getUserMedia({
    audio: {
      sampleRate: 16000,
      channelCount: 1,
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
  })

  // AudioContext at 16kHz for mic capture
  micContext = new AudioContext({ sampleRate: 16000 })
  micSource = micContext.createMediaStreamSource(micStream)
  micProcessor = micContext.createScriptProcessor(4096, 1, 1)

  // Connect STT WebSocket
  await new Promise((resolve, reject) => {
    ws = new WebSocket(buildUrl())

    ws.onopen = () => {
      console.log('[STT] Connected')
      resolve()
    }

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)

      if (data.message_type === 'session_started') {
        console.log('[STT] Session started:', data.session_id)
      }

      // Only fire on committed (final) transcripts, not partials
      if (data.message_type === 'committed_transcript' && data.text?.trim()) {
        console.log('[STT] Transcript:', data.text)
        transcriptCallback?.(data.text.trim())
      }

      if (data.message_type === 'partial_transcript' && data.text?.trim()) {
        console.log('[STT] Partial:', data.text)
      }

      // Handle errors
      if (data.message_type?.includes('error') || data.error) {
        console.error('[STT] Server error:', data.message_type, data.error)
      }
    }

    ws.onerror = (err) => {
      console.error('[STT] WebSocket error:', err)
      reject(err)
    }

    ws.onclose = (event) => {
      console.log('[STT] WebSocket closed, code:', event.code, 'reason:', event.reason)
      ws = null
    }
  })

  // Stream mic audio to STT
  micProcessor.onaudioprocess = (e) => {
    if (muted) return
    if (!ws || ws.readyState !== WebSocket.OPEN) return

    const inputData = e.inputBuffer.getChannelData(0)
    const base64 = float32ToBase64Int16(inputData)

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

export default { startListening, stopListening, onTranscript, isListening, setMuted }
