import NarratorLLM from './NarratorLLM'
import NarratorTTS from './NarratorTTS'

const SYSTEM_PROMPT = `You are the narrator of a platformer called Heckle. You watch the player and heckle them live. You can also hear the player talking.

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
- Your tone is dry and unimpressed, not cheerful. You sound like a bored commentator who's seen it all, not an excited game show host. Think deadpan standup comedian, not children's TV presenter.
- When you're impressed, it should sound reluctant — like it physically pains you to admit they did something right.
- You're the friend who roasts hardest but cheers loudest when they succeed.
- No filler words to start sentences. Hit hard immediately.
- Never explain the game or give advice. You're a commentator, not a guide.`

let speechStartListeners = []
let speechEndListeners = []

function onSpeechStart(cb) { if (cb) speechStartListeners.push(cb) }
function onSpeechEnd(cb) { if (cb) speechEndListeners.push(cb) }
function offSpeechStart(cb) { speechStartListeners = speechStartListeners.filter(x => x !== cb) }
function offSpeechEnd(cb) { speechEndListeners = speechEndListeners.filter(x => x !== cb) }

async function init() {
  // Wire TTS audio events to pipeline speech events
  NarratorTTS.onAudioStart(() => speechStartListeners.forEach(cb => cb()))
  NarratorTTS.onAudioEnd(() => speechEndListeners.forEach(cb => cb()))

  // TTS connects lazily on first speak() — no eager connection needed
  // (ElevenLabs times out the WS after 20s without text input)

  // Dev console helper
  window.heckleSetProvider = (provider) => {
    NarratorLLM.setProvider(provider)
    console.log('[Pipeline] Provider set to:', provider)
  }

  console.log('[Pipeline] Initialized')
}

async function narrate(prompt) {
  console.log('[Pipeline] Narrating:', prompt)
  try {
    const textStream = NarratorLLM.generate(prompt, SYSTEM_PROMPT)
    await NarratorTTS.speak(textStream)
  } catch (err) {
    console.error('[Pipeline] Narration error:', err)
    // Fire speech end to reset state
    speechEndListeners.forEach(cb => cb())
  }
}

function stop() {
  NarratorTTS.stop()
}

function disconnect() {
  NarratorTTS.disconnect()
}

function setProvider(provider) {
  NarratorLLM.setProvider(provider)
}

export default { init, narrate, stop, disconnect, setProvider, onSpeechStart, onSpeechEnd, offSpeechStart, offSpeechEnd }
