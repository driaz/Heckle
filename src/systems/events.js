export const EventType = {
  FALL: 'fall',
  COLLECT: 'collect',
  IDLE: 'idle',
  JUMP: 'jump',
  RESPAWN: 'respawn',
  ENEMY_KILL: 'enemy_kill',
  HAZARD_DEATH: 'hazard_death',
  GOAL_REACHED: 'goal_reached',
}

const PRIORITY = {
  [EventType.GOAL_REACHED]: 5,
  [EventType.HAZARD_DEATH]: 4,
  [EventType.ENEMY_KILL]: 3,
  [EventType.FALL]: 3,
  [EventType.COLLECT]: 2,
  [EventType.RESPAWN]: 2,
  [EventType.IDLE]: 1,
  [EventType.JUMP]: 0,
}

const COOLDOWN = {
  [EventType.FALL]: 3000,
  [EventType.COLLECT]: 1000,
  [EventType.IDLE]: 15000,
  [EventType.JUMP]: 10000,
  [EventType.RESPAWN]: 2000,
  [EventType.HAZARD_DEATH]: 3000,
  [EventType.ENEMY_KILL]: 2000,
  [EventType.GOAL_REACHED]: 0,
}

class EventBus {
  constructor() {
    this._listeners = {}    // eventType → Set<callback>
    this._anyListeners = new Set()
    this._lastEmit = {}     // eventType → timestamp
  }

  on(eventType, callback) {
    if (!this._listeners[eventType]) {
      this._listeners[eventType] = new Set()
    }
    this._listeners[eventType].add(callback)
    return () => this._listeners[eventType].delete(callback)
  }

  onAny(callback) {
    this._anyListeners.add(callback)
    return () => this._anyListeners.delete(callback)
  }

  emit(event) {
    const now = Date.now()
    const cooldown = COOLDOWN[event.type] ?? 0

    if (cooldown > 0) {
      const last = this._lastEmit[event.type] ?? 0
      if (now - last < cooldown) return false
    }

    this._lastEmit[event.type] = now

    const enriched = {
      ...event,
      timestamp: event.timestamp ?? now,
      priority: PRIORITY[event.type] ?? 0,
    }

    const typed = this._listeners[event.type]
    if (typed) {
      for (const cb of typed) cb(enriched)
    }
    for (const cb of this._anyListeners) cb(enriched)

    return true
  }
}

export const eventBus = new EventBus()
