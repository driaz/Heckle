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
- Never explain the game or give advice. You're a commentator, not a guide.

DELIVERY:
- Write lines that SOUND funny spoken aloud, not just read funny.
- Use rhetorical questions. "Four deaths and we're calling this a strategy?"
- Use dramatic pauses via punctuation. Ellipses, dashes, and commas control the voice's pacing. "That was... wow. That was something."
- Use emphasis through word choice, not caps. Put the punch word at the END of the sentence where the voice naturally stresses it.
- Vary sentence length. A long observation followed by a short punch. "After watching you attempt that jump six times in a row, I'm starting to think the platform is winning." Then next time just: "Seven."
- Use specific numbers and details. "Twelve seconds of standing still" is funnier than "standing still for a while."
- Fake concern is your best tool. "Should I call someone?" beats "you're bad at this."
- Occasionally address the player directly. "You know that ledge isn't going anywhere, right?"`

let speechStartListeners = []
let speechEndListeners = []

// Conversation state
let inConversation = false
let conversationCooldownTimer = null
const CONVERSATION_COOLDOWN_MS = 5000

// Event context — for combined prompts when player responds to narration
let lastEventPrompt = null
let lastEventEndTime = 0
let lastNarrationSource = null // 'event' | 'speech'

// Is TTS audio currently playing?
let isSpeechActive = false

// Queued player speech — fires after current narration ends
let pendingFollowUp = null
const EVENT_CONTEXT_WINDOW_MS = 5000

function onSpeechStart(cb) { if (cb) speechStartListeners.push(cb) }
function onSpeechEnd(cb) { if (cb) speechEndListeners.push(cb) }
function offSpeechStart(cb) { speechStartListeners = speechStartListeners.filter(x => x !== cb) }
function offSpeechEnd(cb) { speechEndListeners = speechEndListeners.filter(x => x !== cb) }

function isInConversation() { return inConversation }
function isPlayerSpeaking() { return NarratorSTT.isPlayerSpeaking() }

function startConversationCooldown() {
  conversationCooldownTimer = setTimeout(() => {
    inConversation = false
    console.log('[Pipeline] Conversation cooldown ended, resuming events')
  }, CONVERSATION_COOLDOWN_MS)
}

async function init() {
  // Wire TTS audio events to pipeline speech events
  NarratorTTS.onAudioStart(() => {
    isSpeechActive = true
    speechStartListeners.forEach(cb => cb())
    // Mute STT mic while narrator is speaking (echo prevention)
    NarratorSTT.setMuted(true)
  })
  NarratorTTS.onAudioEnd(() => {
    if (lastNarrationSource === 'event') {
      lastEventEndTime = Date.now()
    }
    isSpeechActive = false

    speechEndListeners.forEach(cb => cb())
    // Unmute STT mic after narrator finishes
    NarratorSTT.setMuted(false)

    // Fire queued player response now that narration is done
    if (pendingFollowUp) {
      const prompt = pendingFollowUp
      pendingFollowUp = null
      console.log('[Pipeline] Firing queued player response')
      narrate(prompt, 'speech').then(startConversationCooldown)
    }
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

  // Check if player is responding to a recent event narration
  const hasRecentEvent = lastEventPrompt && (
    isSpeechActive || (Date.now() - lastEventEndTime < EVENT_CONTEXT_WINDOW_MS)
  )

  let prompt
  if (hasRecentEvent) {
    prompt = `${context} You just commented on: "${lastEventPrompt}". The player responded: "${transcript}". Reply to what they said. One sentence.`
    console.log('[Pipeline] Combined prompt (player responding to event narration)')
  } else {
    prompt = `${context} The player said: "${transcript}". Respond to what they said. You can reference the current game state.`
  }

  if (isSpeechActive) {
    // Queue — only keep the latest, fires when current narration ends
    console.log('[Pipeline] Queuing player response (narrator still speaking)')
    pendingFollowUp = prompt
  } else {
    // Send immediately
    narrate(prompt, 'speech').then(startConversationCooldown)
  }
}

async function narrate(prompt, source = 'event') {
  lastNarrationSource = source
  if (source === 'event') {
    lastEventPrompt = prompt
  }

  console.log('[Pipeline] Narrating:', prompt)
  try {
    const rawStream = NarratorLLM.generate(prompt, SYSTEM_PROMPT)
    let fullText = ''

    async function* cleanStream() {
      for await (const chunk of rawStream) {
        if (!chunk) continue
        // Strip markdown formatting, emoji, and repeated special chars
        const cleaned = chunk
          .replace(/[*_`~\[\]#>]/g, '')          // markdown symbols
          .replace(/\p{Emoji_Presentation}/gu, '') // emoji
          .replace(/[^\w\s.,!?''"""';\-:…—]/g, '') // non-speech symbols
          .replace(/([^\w\s])\1{2,}/g, '$1')       // repeated special chars
        fullText += cleaned
        if (cleaned) yield cleaned
      }
      console.log('[Pipeline] Narrator text:', fullText)
    }

    await NarratorTTS.speak(cleanStream())
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
  pendingFollowUp = null
}

function setProvider(provider) {
  NarratorLLM.setProvider(provider)
}

export default {
  init, narrate, stop, disconnect, setProvider,
  onSpeechStart, onSpeechEnd, offSpeechStart, offSpeechEnd,
  startListening, stopListening, isInConversation, isPlayerSpeaking,
}
