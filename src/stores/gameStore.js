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
  micActive: false,
  setMicActive: (val) => set({ micActive: val }),
  sessionMemory: {
    troubleSpots: {},
    longestIdleDuration: 0,
    fastestStarCollect: null,
    lastStarTime: null,
    deathStreak: 0,
    bestDeathStreak: 0,
    hasCompletedAllStars: false,
    significantMoments: [],
  },

  collectStar: (index) =>
    set((state) => {
      if (state.starsCollected.has(index)) return state
      const now = Date.now()
      const next = new Set(state.starsCollected)
      next.add(index)
      const totalCollected = next.size

      const event = {
        type: EventType.COLLECT,
        timestamp: now,
        starIndex: index,
        totalCollected,
        totalStars: state.totalStars,
        isLast: totalCollected === state.totalStars,
      }

      // Update session memory
      const mem = { ...state.sessionMemory }
      mem.deathStreak = 0

      if (mem.lastStarTime) {
        const gap = (now - mem.lastStarTime) / 1000
        if (mem.fastestStarCollect === null || gap < mem.fastestStarCollect) {
          mem.fastestStarCollect = gap
        }
      }
      mem.lastStarTime = now

      if (totalCollected === state.totalStars) {
        mem.hasCompletedAllStars = true
        mem.significantMoments = [
          ...mem.significantMoments,
          `Player collected all ${state.totalStars} stars after ${state.deathCount} deaths`,
        ]
      }

      if (eventBus.emit(event)) {
        console.log('[EVENT]', event)
        return { starsCollected: next, sessionMemory: mem, events: [...state.events, event] }
      }
      return { starsCollected: next, sessionMemory: mem }
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

      // Update session memory
      const mem = { ...state.sessionMemory }
      mem.troubleSpots = { ...mem.troubleSpots }
      mem.deathStreak = mem.deathStreak + 1
      if (mem.deathStreak > mem.bestDeathStreak) {
        mem.bestDeathStreak = mem.deathStreak
      }

      if (position) {
        const posKey = `${Math.round(position.x)},${Math.round(position.y)},${Math.round(position.z)}`
        mem.troubleSpots[posKey] = (mem.troubleSpots[posKey] || 0) + 1
        if (mem.troubleSpots[posKey] >= 3) {
          const count = mem.troubleSpots[posKey]
          mem.significantMoments = [
            ...mem.significantMoments,
            `Player has fallen from the area near [${posKey}] ${count} times`,
          ]
        }
      }

      const base = {
        fallCount: newFallCount,
        deathCount: newDeathCount,
        lastDeathTime: now,
        sessionMemory: mem,
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

      // Update session memory
      const mem = { ...state.sessionMemory }
      if (duration > mem.longestIdleDuration) {
        mem.longestIdleDuration = duration
      }

      if (eventBus.emit(event)) {
        console.log('[EVENT]', event)
        return { sessionMemory: mem, events: [...state.events, event] }
      }
      return { sessionMemory: mem }
    }),

  consumeEvents: () => {
    const events = get().events
    set({ events: [] })
    return events
  },
}))

export default useGameStore
