import { create } from 'zustand'
import { Room, RoomEvent, Track } from 'livekit-client'
import { eventBus, EventType } from './events'
import narratorSpeech from './narratorSpeech'
import useGameStore from '../stores/gameStore'

/**
 * v2 narrator: joins a LiveKit room where the narrator agent runs, sends it short game events
 * over a data channel, and receives the avatar's video and voice.
 *
 * The agent decides what to say and never talks over itself (it merges or drops events that
 * arrive while it is busy), so this side just reports what happened. The player's mic is
 * published too, once they start the game and allow it, so they can talk back.
 * The agent ignores the mic while the narrator is speaking.
 *
 * One avatar session lasts under 5 minutes (a Runway limit). When it ends, the agent leaves and
 * we join a fresh room for a new session, but only while someone is actually playing.
 */

const TOKEN_URL = '/api/livekit-token'
const EVENT_TOPIC = 'heckle.event'
const AVATAR_TIMEOUT_MS = 25000   // give up on a session whose avatar never shows
const RENEW_DELAY_MS = 3000       // let the old avatar session close before asking for a new one
const RENEW_CHECK_MS = 5000
const AWAY_AFTER_IDLE_MS = 45000  // standing still this recently = nobody is playing
const MAX_FAILURES = 2            // sessions in a row without an avatar before giving up
const RAPID_DEATH_S = 5
const FIRST_STALL_S = 20          // then each report needs double the previous duration

// status: 'off' | 'connecting' | 'live' | 'resting' (between sessions) | 'failed'
// mic: 'off' | 'on' | 'blocked' (no permission or no device)
export const useNarratorStore = create(() => ({
  status: 'off',
  videoTrack: null,
  speaking: false,
  mic: 'off',
}))
const setState = (patch) => useNarratorStore.setState(patch)

let room = null
let generation = 0      // bumped whenever a session starts or ends; stale callbacks check it
let failures = 0
let avatarTimer = null
let renewTimer = null
let stopListening = null
let micWanted = true      // the player's choice; kept across sessions

// ── Session lifecycle ─────────────────────────────────────────

async function connect() {
  const gen = ++generation
  setState({ status: 'connecting', videoTrack: null })
  try {
    const res = await fetch(TOKEN_URL, { method: 'POST' })
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({}))
      failures = MAX_FAILURES // misconfiguration; retrying won't help
      throw new Error(error || `${TOKEN_URL} returned ${res.status}`)
    }
    const { url, token } = await res.json()
    if (gen !== generation) return

    const r = new Room()
    room = r
    const end = (why) => endSession(gen, why)
    r.on(RoomEvent.TrackSubscribed, (track) => {
      if (gen !== generation) return
      if (track.kind === Track.Kind.Video) {
        clearTimeout(avatarTimer)
        failures = 0
        setState({ status: 'live', videoTrack: track })
      } else {
        document.body.appendChild(track.attach())
      }
    })
    r.on(RoomEvent.TrackUnsubscribed, (track) => {
      track.detach().forEach((el) => el.remove())
    })
    r.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
      if (gen === generation) setSpeaking(speakers.some((p) => p !== r.localParticipant))
    })
    // The agent and its avatar leave together when the session is over.
    r.on(RoomEvent.ParticipantDisconnected, () => end('narrator left'))
    r.on(RoomEvent.Disconnected, () => end('disconnected'))

    await r.connect(url, token)
    if (gen !== generation) return r.disconnect()
    if (useGameStore.getState().started) {
      r.startAudio().catch(() => {})
      applyMic()
    }
    avatarTimer = setTimeout(() => end('no avatar video'), AVATAR_TIMEOUT_MS)
  } catch (err) {
    console.warn('[LiveKitNarrator] Could not connect:', err.message)
    endSession(gen, 'connect failed')
  }
}

function endSession(gen, why) {
  if (gen !== generation) return
  generation++
  clearTimeout(avatarTimer)
  if (useNarratorStore.getState().status !== 'live') failures++
  console.log('[LiveKitNarrator] Session ended:', why)

  const r = room
  room = null
  if (r) {
    for (const p of r.remoteParticipants.values()) {
      for (const pub of p.trackPublications.values()) {
        pub.track?.detach().forEach((el) => el.remove())
      }
    }
    r.disconnect()
  }
  setSpeaking(false)

  if (failures >= MAX_FAILURES) {
    console.warn('[LiveKitNarrator] Giving up; playing without the narrator.')
    setState({ status: 'failed', videoTrack: null })
    return
  }
  setState({ status: 'resting', videoTrack: null })
  clearTimeout(renewTimer)
  renewTimer = setTimeout(renewIfPlaying, RENEW_DELAY_MS)
}

let lastIdleAt = 0

// A new session costs avatar time, so only start one for a player who is there.
function renewIfPlaying() {
  if (useNarratorStore.getState().status !== 'resting') return
  const game = useGameStore.getState()
  const retrying = failures > 0 // the first session never showed an avatar; try once more
  const playing =
    game.started &&
    !game.goalReached &&
    document.visibilityState === 'visible' &&
    Date.now() - lastIdleAt > AWAY_AFTER_IDLE_MS
  if (retrying || playing) connect()
}

// The mic only opens after the start click, so the permission prompt follows a user gesture.
async function applyMic() {
  const r = room
  if (!r || !useGameStore.getState().started) return
  try {
    await r.localParticipant.setMicrophoneEnabled(micWanted)
    if (r === room) setState({ mic: micWanted ? 'on' : 'off' })
  } catch (err) {
    console.warn('[LiveKitNarrator] Mic unavailable:', err.message)
    setState({ mic: 'blocked' })
  }
}

function toggleMic() {
  micWanted = useNarratorStore.getState().mic !== 'on'
  return applyMic()
}

function setSpeaking(speaking) {
  if (speaking === useNarratorStore.getState().speaking) return
  setState({ speaking })
  if (speaking) narratorSpeech.start()
  else narratorSpeech.end()
}

// ── Game events → narrator ────────────────────────────────────

function send(payload) {
  if (!payload || !room || !useGameStore.getState().started) return
  // The agent itself, not the avatar worker that publishes on its behalf
  const agent = [...room.remoteParticipants.values()].find(
    (p) => p.isAgent && !p.attributes['lk.publish_on_behalf']
  )
  if (!agent) return
  console.log('[LiveKitNarrator] →', payload)
  room.localParticipant
    .publishData(new TextEncoder().encode(JSON.stringify(payload)), {
      reliable: true,
      topic: EVENT_TOPIC,
      destinationIdentities: [agent.identity],
    })
    .catch((err) => console.warn('[LiveKitNarrator] Send failed:', err.message))
}

const deathsAt = {}
let lastDeathAt = 0
let lastIdleDuration = 0
let nextStallAt = FIRST_STALL_S

function death(event, cause) {
  const now = Date.now()
  const gap = (now - lastDeathAt) / 1000
  lastDeathAt = now
  const spot = event.area || 'unknown'
  deathsAt[spot] = (deathsAt[spot] || 0) + 1
  return {
    t: 'death',
    cause,
    at: event.area || undefined,
    n: event.deathCount,
    here: deathsAt[spot],
    gap: gap < RAPID_DEATH_S ? Math.round(gap * 10) / 10 : undefined,
  }
}

/** The short message the narrator gets for a game event, or null if it isn't told about it. */
export function payloadFor(event) {
  switch (event.type) {
    case EventType.FALL:
      return death(event, 'fall')
    case EventType.HAZARD_DEATH:
      return death(event, event.hazardName)
    case EventType.IDLE: {
      lastIdleAt = Date.now()
      // Durations restart when the player moves; report a stall at 20 s, then 40 s, 80 s...
      if (event.duration < lastIdleDuration) nextStallAt = FIRST_STALL_S
      lastIdleDuration = event.duration
      if (event.duration < nextStallAt) return null
      nextStallAt = event.duration * 2
      return { t: 'stall', at: event.area || undefined, secs: Math.round(event.duration) }
    }
    case EventType.CHECKPOINT:
      return { t: 'checkpoint', name: event.name, n: event.deathCount, secs: event.sessionTime }
    case EventType.GOAL_REACHED:
      return {
        t: 'finish',
        n: event.deathCount,
        secs: event.sessionTime,
        stars: `${event.starsCollected}/${event.totalStars}`,
      }
    default:
      return null
  }
}

// ── Public ────────────────────────────────────────────────────

/** Call once at page load: the avatar takes ~6 s to appear, so it warms up behind the start overlay. */
function start() {
  if (stopListening) return
  const offBus = eventBus.onAny((event) => send(payloadFor(event)))
  // The start click is the user gesture browsers require before audio may play.
  const offStore = useGameStore.subscribe((state, prev) => {
    if (state.started && !prev.started) {
      room?.startAudio().catch(() => {})
      applyMic()
      renewIfPlaying()
    }
  })
  const interval = setInterval(renewIfPlaying, RENEW_CHECK_MS)
  window.addEventListener('pagehide', stop)
  stopListening = () => {
    offBus()
    offStore()
    clearInterval(interval)
    window.removeEventListener('pagehide', stop)
  }
  connect()
}

function stop() {
  stopListening?.()
  stopListening = null
  clearTimeout(renewTimer)
  failures = MAX_FAILURES
  endSession(generation, 'stopped')
  setState({ status: 'off' })
}

if (import.meta.hot) import.meta.hot.dispose(stop)

export default { start, stop, toggleMic }
