import { eventBus } from './events'
import narratorPipeline from './NarratorPipeline'
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
  const mem = store.sessionMemory

  const baseContext = `[Session: ${sessionTime}s, Stars: ${store.starsCollected.size}/${store.totalStars}, Deaths: ${store.deathCount}]`

  // Build memory context — only include what's relevant to THIS event
  let memoryContext = ''

  switch (event.type) {
    case 'fall': {
      const area = event.area || 'unknown area'
      if (event.area) {
        const spotCount = mem.troubleSpots[event.area] || 0
        if (spotCount >= 3) {
          memoryContext = ` [RECURRING: Player has fallen from ${event.area} ${spotCount} times this session.]`
        }
      }
      if (mem.deathStreak >= 3) {
        memoryContext += ` [STREAK: ${mem.deathStreak} deaths in a row without collecting a star.]`
      }
      if (event.rapidDeath) {
        return `${baseContext}${memoryContext} RAPID DEATH — fell off ${area} again only ${event.timeSinceLastDeath.toFixed(1)}s after the last death. Fall #${event.fallCount}.`
      }
      if (event.fallCount === 1) {
        return `${baseContext} First death of the session at ${area}.`
      }
      return `${baseContext}${memoryContext} Fell off ${area}. Death #${event.fallCount}.`
    }

    case 'collect': {
      const area = event.area ? ` in ${event.area}` : ''
      if (event.isLast) {
        const deathsItTook = store.deathCount
        return `${baseContext} FINAL STAR${area} — all ${event.totalStars} collected! It took ${deathsItTook} deaths to get here.`
      }
      if (mem.bestDeathStreak >= 3) {
        memoryContext = ` [Player just broke a ${mem.bestDeathStreak}-death streak by finally collecting a star.]`
      }
      if (event.totalCollected === 1) {
        return `${baseContext}${memoryContext} Collected their first star${area}. Only ${event.totalStars - 1} to go.`
      }
      return `${baseContext}${memoryContext} Star ${event.totalCollected}/${event.totalStars} collected${area}.`
    }

    case 'idle': {
      const area = event.area ? ` at ${event.area}` : ''
      if (store.deathCount > 5 && event.duration > 10) {
        memoryContext = ` [Player has died ${store.deathCount} times and is now just standing still. Probably frustrated.]`
      }
      if (event.duration > 30) {
        return `${baseContext}${memoryContext} Standing still for ${Math.floor(event.duration)} seconds${area}.`
      }
      return `${baseContext}${memoryContext} Idle for ${Math.floor(event.duration)} seconds${area}.`
    }

    case 'respawn': {
      if (mem.bestDeathStreak >= 5) {
        memoryContext = ` [Worst streak this session: ${mem.bestDeathStreak} deaths in a row.]`
      }
      return `${baseContext}${memoryContext} Respawned after death #${event.deathCount}.`
    }

    case 'hazard_death': {
      const area = event.area ? ` at ${event.area}` : ''
      if (event.hazardSpecificCount >= 3) {
        memoryContext = ` [NEMESIS: Player has been killed by "${event.hazardName}" ${event.hazardSpecificCount} times now.]`
      }
      if (mem.deathStreak >= 3) {
        memoryContext += ` [STREAK: ${mem.deathStreak} deaths in a row.]`
      }
      return `${baseContext}${memoryContext} Killed by "${event.hazardName}"${area}. Death #${event.deathCount}.`
    }

    case 'enemy_kill': {
      return `${baseContext} Stomped a ${event.enemyName}! Kill #${event.totalKills}.`
    }

    case 'goal_reached': {
      const mins = Math.floor(event.sessionTime / 60)
      const secs = event.sessionTime % 60
      return `${baseContext} COURSE COMPLETE! Finished in ${mins}m ${secs}s with ${event.starsCollected}/${event.totalStars} stars and ${event.deathCount} deaths. ${event.enemiesKilled} enemies defeated.`
    }

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

  // Skip events while player is in conversation with narrator
  if (narratorPipeline.isInConversation()) {
    console.log('[GameDirector] Skip: in conversation mode')
    return false
  }

  // Don't start narrating while the player is mid-sentence
  if (narratorPipeline.isPlayerSpeaking()) {
    console.log('[GameDirector] Skip: player is speaking')
    return false
  }

  if (now - lastNarrationTime < MIN_GAP_MS) {
    console.log('[GameDirector] Skip: too soon since last narration')
    return false
  }

  // Always narrate these
  if (event.type === 'hazard_death') return true
  if (event.type === 'enemy_kill') return true
  if (event.type === 'goal_reached') return true
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

  narratorPipeline.narrate(prompt)
}

function start() {
  if (unsubscribe) return
  console.log('[GameDirector] Started')
  unsubscribe = eventBus.onAny(handleEvent)

  narratorPipeline.onSpeechEnd(() => {
    isSpeaking = false
  })

  narratorPipeline.init().catch(err => {
    console.error('[GameDirector] Pipeline init error:', err)
  })
}

function stop() {
  if (unsubscribe) {
    unsubscribe()
    unsubscribe = null
  }
  narratorPipeline.disconnect()
  console.log('[GameDirector] Stopped')
}

export default { start, stop }
