const VOICE_ID = 'R9RRuF6DvYcB09peYxfT'
const MODEL_ID = 'eleven_flash_v2_5'
const WS_URL = `wss://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}/stream-input?model_id=${MODEL_ID}&output_format=pcm_24000`

let ws = null
let audioContext = null
let nextPlayTime = 0
let stopping = false

// Speech event tracking
let audioStartCallback = null
let audioEndCallback = null
let speechStarted = false
let flushed = false
let speechEndTimer = null

function onAudioStart(cb) { audioStartCallback = cb }
function onAudioEnd(cb) { audioEndCallback = cb }

function ensureAudioContext() {
  if (!audioContext) {
    audioContext = new AudioContext({ sampleRate: 24000 })
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume()
  }
}

function scheduleSpeechEnd() {
  clearTimeout(speechEndTimer)
  if (!speechStarted) return

  const remaining = audioContext
    ? Math.max(0, (nextPlayTime - audioContext.currentTime) * 1000)
    : 0

  speechEndTimer = setTimeout(() => {
    if (speechStarted) {
      speechStarted = false
      flushed = false
      audioEndCallback?.()
    }
  }, remaining + 200)
}

function openWebSocket() {
  return new Promise((resolve, reject) => {
    ws = new WebSocket(WS_URL)

    ws.onopen = () => {
      // BOS message: voice settings + auth
      ws.send(JSON.stringify({
        text: ' ',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
        xi_api_key: import.meta.env.VITE_ELEVENLABS_API_KEY,
      }))

      console.log('[TTS] Connected')
      resolve()
    }

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.audio) {
        queueAudioChunk(data.audio)
      }
      if (data.error) {
        console.error('[TTS] Server error:', data.error, data.message)
      }
    }

    ws.onerror = (err) => {
      console.error('[TTS] WebSocket error:', err)
      reject(err)
    }

    ws.onclose = (event) => {
      console.log('[TTS] WebSocket closed, code:', event.code, 'reason:', event.reason)
      ws = null
    }
  })
}

function queueAudioChunk(base64Data) {
  if (stopping) return
  ensureAudioContext()

  // Fire speech start on first audio chunk
  if (!speechStarted) {
    speechStarted = true
    audioStartCallback?.()
  }

  const binaryString = atob(base64Data)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }

  // ElevenLabs pcm_24000 = signed 16-bit LE PCM at 24kHz
  const int16Array = new Int16Array(bytes.buffer)
  const float32Array = new Float32Array(int16Array.length)
  for (let i = 0; i < int16Array.length; i++) {
    float32Array[i] = int16Array[i] / 32768
  }

  const buffer = audioContext.createBuffer(1, float32Array.length, 24000)
  buffer.getChannelData(0).set(float32Array)

  const source = audioContext.createBufferSource()
  source.buffer = buffer
  source.connect(audioContext.destination)

  const now = audioContext.currentTime
  const startTime = Math.max(now, nextPlayTime)
  source.start(startTime)
  nextPlayTime = startTime + buffer.duration

  // If flush was already sent, reschedule speech end with updated playback time
  if (flushed) scheduleSpeechEnd()
}

async function connect() {
  ensureAudioContext()
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    await openWebSocket()
  }
}

async function speak(textStream) {
  // Reconnect if WS was closed (e.g. 20s idle timeout)
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    await openWebSocket()
  }

  stopping = false
  flushed = false
  speechStarted = false
  nextPlayTime = 0
  clearTimeout(speechEndTimer)

  for await (const chunk of textStream) {
    if (stopping) break
    if (chunk && ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        text: chunk,
        try_trigger_generation: true,
      }))
    } else if (chunk) {
      console.warn('[TTS] WS not open, dropping chunk. State:', ws?.readyState)
    }
  }

  // Flush remaining buffered text
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      text: '',
      flush: true,
    }))
  } else {
    console.warn('[TTS] WS not open for flush. State:', ws?.readyState)
  }

  // Mark flush sent — audio chunks may still arrive from ElevenLabs
  flushed = true
  if (speechStarted) scheduleSpeechEnd()
}

function stop() {
  stopping = true
  nextPlayTime = 0
  clearTimeout(speechEndTimer)
  if (speechStarted) {
    speechStarted = false
    flushed = false
    audioEndCallback?.()
  }
}

function disconnect() {
  stop()
  if (ws) {
    ws.close()
    ws = null
  }
  if (audioContext) {
    audioContext.close()
    audioContext = null
  }
}

export default { connect, speak, stop, disconnect, onAudioStart, onAudioEnd }
