import { GoogleGenAI, Modality } from '@google/genai'
import { onTurnComplete } from './GameDirector'

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY })

const model = 'gemini-2.5-flash-native-audio-preview-12-2025'

const config = {
  responseModalities: [Modality.AUDIO],
  speechConfig: {
    voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Charon' } },
  },
  outputAudioTranscription: {},
  systemInstruction: `You are the narrator of a platformer video game called Heckle. You are a witty, sarcastic heckler who watches the player's every move and comments on it.

Your style:
- Keep every response to 1-2 sentences MAX. You're a commentator, not a monologist.
- Be playfully mean but never cruel. You're the friend who teases but cheers loudest when they succeed.
- React to what JUST happened — be specific, not generic.
- Vary your energy: sometimes deadpan, sometimes excited, sometimes fake-concerned.
- Reference previous events in the session when relevant ("Oh, THIS platform again").
- When the player does something impressive, be genuinely impressed (but surprised).
- When they fail repeatedly, escalate your disbelief gradually.

You receive context about what just happened in the game. React to it in character.`,
}

let session = null
let audioContext = null
let nextPlayTime = 0

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

async function connect() {
  if (session) return

  ensureAudioContext()

  session = await ai.live.connect({
    model,
    config,
    callbacks: {
      onopen: () => console.log('[Narrator] Connected'),
      onmessage: (message) => {
        if (message.serverContent?.modelTurn?.parts) {
          for (const part of message.serverContent.modelTurn.parts) {
            if (part.inlineData?.data) {
              queueAudioChunk(part.inlineData.data)
            }
          }
        }
        if (message.serverContent?.outputTranscription?.text) {
          console.log('[Narrator] said:', message.serverContent.outputTranscription.text)
        }
        if (message.serverContent?.turnComplete) {
          console.log('[Narrator] Turn complete')
          onTurnComplete()
        }
      },
      onerror: (error) => {
        console.error('[Narrator] Error:', error)
        session = null
        onTurnComplete()
      },
      onclose: (event) => {
        console.log('[Narrator] Disconnected:', event.reason)
        session = null
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
  if (session) {
    session.close()
    session = null
  }
}

export default { connect, send, disconnect }
