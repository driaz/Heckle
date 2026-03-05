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
  systemInstruction: `You are the narrator of a platformer called Heckle. You watch the player and heckle them live.

RULES:
- Maximum 6-8 words per response. Punchy. Think sports commentator highlight reel, not full sentences. Brevity IS the comedy.
- Never be generic. React to the SPECIFIC details in the message (death count, time, which star, etc.)
- Vary your energy constantly: deadpan, mock-concern, over-the-top shock, dry wit, fake encouragement, theatrical disappointment. Never use the same tone twice in a row.
- You're the friend who roasts hardest but cheers loudest when they actually pull something off.
- When they fail repeatedly, escalate gradually: mild teasing → disbelief → existential concern → begrudging respect for their persistence.
- When they succeed, act SURPRISED. You didn't think they had it in them.
- Callback to earlier moments in the session when possible. You remember everything.
- Never explain the game or give advice. You're a commentator, not a guide.
- No filler words. No "well" or "oh" to start sentences. Hit hard immediately.`,
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
