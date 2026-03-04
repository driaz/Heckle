import { create } from 'zustand'
import { STARS } from '../config/level'
import { eventBus, EventType } from '../systems/events'

const useGameStore = create((set, get) => ({
  starsCollected: new Set(),
  totalStars: STARS.length,
  fallCount: 0,
  deathCount: 0,
  lastDeathTime: null,
  sessionStart: Date.now(),
  events: [],

  collectStar: (index) =>
    set((state) => {
      if (state.starsCollected.has(index)) return state
      const next = new Set(state.starsCollected)
      next.add(index)
      const totalCollected = next.size

      const event = {
        type: EventType.COLLECT,
        timestamp: Date.now(),
        starIndex: index,
        totalCollected,
        totalStars: state.totalStars,
        isLast: totalCollected === state.totalStars,
      }

      if (eventBus.emit(event)) {
        console.log('[EVENT]', event)
        return { starsCollected: next, events: [...state.events, event] }
      }
      return { starsCollected: next }
    }),

  recordFall: (position) =>
    set((state) => {
      const now = Date.now()
      const newFallCount = state.fallCount + 1
      const newDeathCount = state.deathCount + 1
      const timeSinceLastDeath = state.lastDeathTime
        ? (now - state.lastDeathTime) / 1000
        : null

      const event = {
        type: EventType.FALL,
        timestamp: now,
        position: position ? [position.x, position.y, position.z] : null,
        fallCount: newFallCount,
        deathCount: newDeathCount,
        timeSinceLastDeath,
        rapidDeath: timeSinceLastDeath !== null && timeSinceLastDeath < 5,
      }

      const base = {
        fallCount: newFallCount,
        deathCount: newDeathCount,
        lastDeathTime: now,
      }

      if (eventBus.emit(event)) {
        console.log('[EVENT]', event)
        return { ...base, events: [...state.events, event] }
      }
      return base
    }),

  recordRespawn: () =>
    set((state) => {
      const event = {
        type: EventType.RESPAWN,
        timestamp: Date.now(),
        deathCount: state.deathCount,
        starsCollected: state.starsCollected.size,
      }

      if (eventBus.emit(event)) {
        console.log('[EVENT]', event)
        return { events: [...state.events, event] }
      }
      return {}
    }),

  recordIdle: (duration, position) =>
    set((state) => {
      const event = {
        type: EventType.IDLE,
        timestamp: Date.now(),
        duration,
        position: position ? [position.x, position.y, position.z] : null,
      }

      if (eventBus.emit(event)) {
        console.log('[EVENT]', event)
        return { events: [...state.events, event] }
      }
      return {}
    }),

  consumeEvents: () => {
    const events = get().events
    set({ events: [] })
    return events
  },
}))

export default useGameStore
