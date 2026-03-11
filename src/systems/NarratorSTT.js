const MIN_WORDS = 3
const MIN_CHARS = 10
const SPEAKING_THRESHOLD_MS = 2000

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

let recognition = null
let transcriptCallback = null
let muted = false
let listening = false
let lastPartialTime = 0

function onTranscript(cb) { transcriptCallback = cb }
function isListening() { return listening }
function isPlayerSpeaking() { return Date.now() - lastPartialTime < SPEAKING_THRESHOLD_MS }
function isMuted() { return muted }

function setMuted(val) {
  const prev = muted
  muted = val
  if (prev !== val) {
    console.log('[STT] Muted:', val)
    if (!recognition || !listening) return
    if (val) {
      // Stop recognition while muted (prevents picking up narrator audio)
      recognition.stop()
    } else {
      // Restart recognition after unmute
      try { recognition.start() } catch (e) { /* already started */ }
    }
  }
}

function isSubstantialTranscript(text) {
  if (!text) return false
  const trimmed = text.trim()
  if (trimmed.length < MIN_CHARS) return false
  if (trimmed.split(/\s+/).length < MIN_WORDS) return false
  return true
}

async function startListening() {
  if (listening) return
  if (!SpeechRecognition) {
    throw new Error('SpeechRecognition not supported in this browser')
  }

  recognition = new SpeechRecognition()
  recognition.continuous = true
  recognition.interimResults = true
  recognition.lang = 'en-US'

  recognition.onresult = (event) => {
    // Process only the latest result
    const result = event.results[event.results.length - 1]
    const text = result[0].transcript.trim()

    if (!text) return

    if (!result.isFinal) {
      // Interim (partial) result
      lastPartialTime = Date.now()
      console.log('[STT] Partial:', text)
    } else {
      // Final (committed) result
      if (!isSubstantialTranscript(text)) {
        console.log('[STT] Ignoring short transcript:', text)
        return
      }
      console.log('[STT] Transcript:', text)
      transcriptCallback?.(text)
    }
  }

  recognition.onerror = (event) => {
    // 'no-speech' and 'aborted' are normal — don't log as errors
    if (event.error === 'no-speech' || event.error === 'aborted') return
    console.error('[STT] Error:', event.error)
  }

  recognition.onend = () => {
    // Auto-restart if we're still supposed to be listening and not muted
    if (listening && !muted) {
      console.log('[STT] Auto-restarting...')
      try { recognition.start() } catch (e) { /* already started */ }
    }
  }

  recognition.start()
  listening = true
  console.log('[STT] Listening (Web Speech API)')
}

function stopListening() {
  listening = false
  if (recognition) {
    recognition.stop()
    recognition = null
  }
  console.log('[STT] Stopped')
}

export default { startListening, stopListening, onTranscript, isListening, isPlayerSpeaking, isMuted, setMuted }
