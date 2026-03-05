import { eventBus } from './events'
import narratorVoice from './NarratorVoice'
import useGameStore from '../stores/gameStore'

const MIN_GAP_MS = 4000

let unsubscribe = null
let lastNarrationTime = 0
let isSpeaking = false
let firstFallSeen = false
let firstIdleSeen = false

function buildPrompt(event) {
  const store = useGameStore.getState()
  const sessionTime = Math.floor((Date.now() - store.sessionStart) / 1000)

  const context = `[Session: ${sessionTime}s, Stars: ${store.starsCollected.size}/${store.totalStars}, Deaths: ${store.deathCount}]`

  switch (event.type) {
    case 'fall':
      if (event.rapidDeath) {
        return `${context} RAPID DEATH — fell again only ${event.timeSinceLastDeath.toFixed(1)}s after the last death. Fall #${event.fallCount}. They're spiraling.`
      }
      if (event.fallCount === 1) {
        return `${context} First death of the session. They just walked right off.`
      }
      if (event.fallCount >= 5) {
        return `${context} Fall #${event.fallCount}. This is getting absurd.`
      }
      return `${context} Fell off a platform. Death #${event.fallCount}.`

    case 'collect':
      if (event.isLast) {
        return `${context} FINAL STAR COLLECTED — all ${event.totalStars} stars! They actually did it.`
      }
      if (event.totalCollected === 1) {
        return `${context} Collected their first star. Only ${event.totalStars - 1} to go.`
      }
      return `${context} Star ${event.totalCollected}/${event.totalStars} collected.`

    case 'idle':
      if (event.duration > 30) {
        return `${context} Standing still for ${Math.floor(event.duration)} seconds. That's genuinely concerning.`
      }
      return `${context} Idle for ${Math.floor(event.duration)} seconds.`

    case 'respawn':
      if (event.deathCount >= 5) {
        return `${context} Respawned. Death #${event.deathCount}. They keep coming back.`
      }
      return `${context} Respawned after death #${event.deathCount}.`

    default:
      return null
  }
}

function shouldNarrate(event) {
  const now = Date.now()

  if (isSpeaking) {
    console.log('[GameDirector] Skip: narrator still speaking')
    return false
  }

  if (now - lastNarrationTime < MIN_GAP_MS) {
    console.log('[GameDirector] Skip: too soon since last narration')
    return false
  }

  // Always narrate
  if (event.type === 'fall' && event.fallCount === 1) {
    firstFallSeen = true
    return true
  }
  if (event.type === 'fall' && event.rapidDeath) return true
  if (event.type === 'collect' && event.isLast) return true
  if (event.type === 'idle' && !firstIdleSeen) {
    firstIdleSeen = true
    return true
  }

  // Sometimes narrate (50% chance)
  if (event.type === 'fall') return Math.random() < 0.5
  if (event.type === 'collect') return Math.random() < 0.5
  if (event.type === 'idle') return Math.random() < 0.5

  // Skip respawn (fall already covers deaths) and unknown types
  return false
}

function handleEvent(event) {
  console.log('[GameDirector] Event received:', event.type, event)

  if (!shouldNarrate(event)) return

  const prompt = buildPrompt(event)
  if (!prompt) return

  console.log('[GameDirector] Narrating:', prompt)
  lastNarrationTime = Date.now()
  isSpeaking = true

  narratorVoice.send(prompt)
}

export function onTurnComplete() {
  isSpeaking = false
}

function start() {
  if (unsubscribe) return
  console.log('[GameDirector] Started')
  unsubscribe = eventBus.onAny(handleEvent)
  narratorVoice.connect()
}

function stop() {
  if (unsubscribe) {
    unsubscribe()
    unsubscribe = null
  }
  narratorVoice.disconnect()
  console.log('[GameDirector] Stopped')
}

export default { start, stop }
