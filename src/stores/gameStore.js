import { create } from 'zustand'
import { STARS } from '../config/level'

const useGameStore = create((set) => ({
  starsCollected: new Set(),
  totalStars: STARS.length,

  collectStar: (index) =>
    set((state) => {
      if (state.starsCollected.has(index)) return state
      const next = new Set(state.starsCollected)
      next.add(index)
      return { starsCollected: next }
    }),

  fallCount: 0,
  recordFall: () => set((state) => ({ fallCount: state.fallCount + 1 })),
}))

export default useGameStore
