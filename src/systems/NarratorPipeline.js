import NarratorLLM from './NarratorLLM'
import NarratorTTS from './NarratorTTS'
import NarratorSTT from './NarratorSTT'
import useGameStore from '../stores/gameStore'

const SYSTEM_PROMPT = `You are the narrator of a platformer called Heckle. You watch the player and heckle them live. You can also hear the player talking.

WHEN REACTING TO GAME EVENTS (falls, star collections, idle):
- ONE sentence only. Never two. Make it count.
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
- Weave in game state to roast harder ("big talk for someone who's died 6 times").

ALWAYS:
- Your tone is dry and unimpressed, not cheerful. You sound like a bored commentator who's seen it all, not an excited game show host. Think deadpan standup comedian, not children's TV presenter.
- When you're impressed, it should sound reluctant — like it physically pains you to admit they did something right.
- You're the friend who roasts hardest but cheers loudest when they succeed.
- No filler words to start sentences. Hit hard immediately.
- Never explain the game or give advice. You're a commentator, not a guide.`

let speechStartListeners = []
let speechEndListeners = []

// Conversation state
let inConversation = false
let conversationCooldownTimer = null
const CONVERSATION_COOLDOWN_MS = 5000

function onSpeechStart(cb) { if (cb) speechStartListeners.push(cb) }
function onSpeechEnd(cb) { if (cb) speechEndListeners.push(cb) }
function offSpeechStart(cb) { speechStartListeners = speechStartListeners.filter(x => x !== cb) }
function offSpeechEnd(cb) { speechEndListeners = speechEndListeners.filter(x => x !== cb) }

function isInConversation() { return inConversation }
function isPlayerSpeaking() { return NarratorSTT.isPlayerSpeaking() }

async function init() {
  // Wire TTS audio events to pipeline speech events
  NarratorTTS.onAudioStart(() => {
    speechStartListeners.forEach(cb => cb())
    // Mute STT mic while narrator is speaking (echo prevention)
    NarratorSTT.setMuted(true)
  })
  NarratorTTS.onAudioEnd(() => {
    speechEndListeners.forEach(cb => cb())
    // Unmute STT mic after narrator finishes
    NarratorSTT.setMuted(false)
  })

  // Wire STT transcripts to conversation handler
  NarratorSTT.onTranscript(handlePlayerSpeech)

  // TTS connects lazily on first speak() — no eager connection needed
  // (ElevenLabs times out the WS after 20s without text input)

  // Dev console helper
  window.heckleSetProvider = (provider) => {
    NarratorLLM.setProvider(provider)
    console.log('[Pipeline] Provider set to:', provider)
  }

  // Auto-start mic — browser will prompt for permission on first load
  try {
    await startListening()
  } catch (err) {
    console.warn('[Pipeline] Mic auto-start failed (user may have denied):', err.message)
  }

  console.log('[Pipeline] Initialized')
}

function handlePlayerSpeech(transcript) {
  console.log('[Pipeline] Player said:', transcript)

  // Enter conversation mode — pauses game event narration
  inConversation = true
  clearTimeout(conversationCooldownTimer)

  // Build prompt with game context
  const store = useGameStore.getState()
  const sessionTime = Math.floor((Date.now() - store.sessionStart) / 1000)
  const context = `[Session: ${sessionTime}s, Stars: ${store.starsCollected.size}/${store.totalStars}, Deaths: ${store.deathCount}]`

  const prompt = `${context} The player said: "${transcript}". Respond to what they said. You can reference the current game state.`

  // Send through the LLM → TTS pipeline
  narrate(prompt).then(() => {
    // After narrator finishes responding, start cooldown before resuming events
    conversationCooldownTimer = setTimeout(() => {
      inConversation = false
      console.log('[Pipeline] Conversation cooldown ended, resuming events')
    }, CONVERSATION_COOLDOWN_MS)
  })
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

async function startListening() {
  await NarratorSTT.startListening()
  useGameStore.getState().setMicActive(true)
}

function stopListening() {
  NarratorSTT.stopListening()
  useGameStore.getState().setMicActive(false)
}

function stop() {
  NarratorTTS.stop()
}

function disconnect() {
  stopListening()
  NarratorTTS.disconnect()
  clearTimeout(conversationCooldownTimer)
  inConversation = false
}

function setProvider(provider) {
  NarratorLLM.setProvider(provider)
}

export default {
  init, narrate, stop, disconnect, setProvider,
  onSpeechStart, onSpeechEnd, offSpeechStart, offSpeechEnd,
  startListening, stopListening, isInConversation, isPlayerSpeaking,
}
