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
}))

export default useGameStore
