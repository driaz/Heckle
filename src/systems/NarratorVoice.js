import { GoogleGenAI, Modality } from '@google/genai'
import { onTurnComplete, setPlayerSpeaking, setPlayerNotSpeaking } from './GameDirector'
import useGameStore from '../stores/gameStore'

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY })

const model = 'gemini-2.5-flash-native-audio-preview-12-2025'

const config = {
  responseModalities: [Modality.AUDIO],
  speechConfig: {
    voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Charon' } },
  },
  inputAudioTranscription: {},
  outputAudioTranscription: {},
  systemInstruction: `You are the narrator of a platformer called Heckle. You watch the player and heckle them live. You can also hear the player talking.

WHEN REACTING TO GAME EVENTS (falls, star collections, idle):
- Maximum 6-8 words. Punchy. Like a sports commentator highlight reel.
- Never be generic. React to the specific details.
- Vary your energy: deadpan, mock-concern, shock, dry wit, theatrical disappointment.
- Escalate gradually on repeated failures.

WHEN THE PLAYER TALKS TO YOU:
- Be conversational. 1-2 sentences is fine.
- Actually respond to what they said — acknowledge their words, clap back, banter.
- Stay in character — you're still a sarcastic heckler, but you're having a conversation now.
- If they're complaining about the game, be playfully unsympathetic.
- If they're trash-talking you, give it right back.
- If they say something funny, you can laugh or acknowledge it before roasting them.
- You remember everything that happened this session — reference it.

ALWAYS:
- You're the friend who roasts hardest but cheers loudest when they succeed.
- No filler words to start sentences. Hit hard immediately.
- Never explain the game or give advice. You're a commentator, not a guide.`,
}

let session = null
let audioContext = null
let nextPlayTime = 0
let speechStartCallback = null
let speechEndCallback = null
let turnSpeechStarted = false

// Mic state
let micStream = null
let micProcessor = null
let micSource = null
let micContext = null

function onSpeechStart(cb) { speechStartCallback = cb }
function onSpeechEnd(cb) { speechEndCallback = cb }

function ensureAudioContext() {
  if (!audioContext) {
    audioContext = new AudioContext({ sampleRate: 24000 })
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume()
  }
}

function queueAudioChunk(base64Data) {
  const binaryString = atob(base64Data)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }

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

async function startMic() {
  if (!session) return
  if (micStream) return

  try {
    micStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        sampleRate: 16000,
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    })

    // Create a separate AudioContext at 16kHz for mic capture
    micContext = new AudioContext({ sampleRate: 16000 })
    micSource = micContext.createMediaStreamSource(micStream)

    // ScriptProcessorNode: 4096 samples, mono in, zero out
    micProcessor = micContext.createScriptProcessor(4096, 1, 1)

    micProcessor.onaudioprocess = (e) => {
      // Echo prevention: skip sending mic data while narrator is speaking
      if (turnSpeechStarted) return
      if (!session) return

      const inputData = e.inputBuffer.getChannelData(0)
      const base64 = float32ToBase64Int16(inputData)

      session.sendRealtimeInput({
        audio: {
          data: base64,
          mimeType: 'audio/pcm;rate=16000',
        },
      })
    }

    micSource.connect(micProcessor)
    micProcessor.connect(micContext.destination)

    useGameStore.getState().setMicActive(true)
    console.log('[Narrator] Mic active')
  } catch (err) {
    console.log('[Narrator] Mic permission denied or unavailable:', err.message)
    micStream = null
  }
}

function stopMic() {
  if (micProcessor) {
    micProcessor.disconnect()
    micProcessor = null
  }
  if (micSource) {
    micSource.disconnect()
    micSource = null
  }
  if (micContext) {
    micContext.close()
    micContext = null
  }
  if (micStream) {
    micStream.getTracks().forEach((t) => t.stop())
    micStream = null
  }
  useGameStore.getState().setMicActive(false)
}

async function connect() {
  if (session) return

  ensureAudioContext()

  session = await ai.live.connect({
    model,
    config,
    callbacks: {
      onopen: () => {
        console.log('[Narrator] Connected')
        startMic()
      },
      onmessage: (message) => {
        if (message.serverContent?.modelTurn?.parts) {
          for (const part of message.serverContent.modelTurn.parts) {
            if (part.inlineData?.data) {
              if (!turnSpeechStarted) {
                turnSpeechStarted = true
                speechStartCallback?.()
              }
              queueAudioChunk(part.inlineData.data)
            }
          }
        }
        if (message.serverContent?.inputTranscription?.text) {
          console.log('[Player] said:', message.serverContent.inputTranscription.text)
          setPlayerSpeaking()
        }
        if (message.serverContent?.outputTranscription?.text) {
          console.log('[Narrator] said:', message.serverContent.outputTranscription.text)
        }
        if (message.serverContent?.turnComplete) {
          console.log('[Narrator] Turn complete')
          turnSpeechStarted = false
          speechEndCallback?.()
          setPlayerNotSpeaking()
          onTurnComplete()
        }
      },
      onerror: (error) => {
        console.error('[Narrator] Error:', error)
        session = null
        turnSpeechStarted = false
        speechEndCallback?.()
        onTurnComplete()
      },
      onclose: (event) => {
        console.log('[Narrator] Disconnected:', event.reason)
        session = null
        turnSpeechStarted = false
        speechEndCallback?.()
        onTurnComplete()
      },
    },
  })
}

async function send(text) {
  if (!session) await connect()
  nextPlayTime = 0
  session.sendClientContent({ turns: [{ role: 'user', parts: [{ text }] }], turnComplete: true })
  console.log('[Narrator] Sent:', text)
}

function disconnect() {
  stopMic()
  if (session) {
    session.close()
    session = null
  }
}

export default { connect, send, disconnect, onSpeechStart, onSpeechEnd, startMic, stopMic }
