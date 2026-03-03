export const COLORS = {
  ground: '#5b8c5a',
  platform: '#7eb77f',
  platformAlt: '#a3c9a8',
  accent: '#f0c674',
  star: '#ffd700',
  fog: '#c8e8ff',
}

export const PLATFORMS = [
  // === Starting island (home base) ===
  { pos: [0, -0.5, 0], size: [8, 1, 8], color: COLORS.ground },

  // === Stepping stone path (climbs upward, heading screen-left / +Z) ===
  { pos: [-3, 0.5, 5], size: [3, 0.6, 3], color: COLORS.platform },
  { pos: [-5, 1.8, 8], size: [2.5, 0.6, 2.5], color: COLORS.platformAlt },
  { pos: [-3, 3.0, 11], size: [2.5, 0.6, 2.5], color: COLORS.platform },
  { pos: [-1, 4.2, 14], size: [2, 0.6, 2], color: COLORS.platformAlt },
  { pos: [1, 5.5, 17], size: [2.5, 0.6, 2.5], color: COLORS.platform },

  // === Upper plateau (goal area) ===
  { pos: [0, 6.5, 21], size: [6, 0.8, 6], color: COLORS.accent },

  // === Side path (branches right / +X, stays low, easier jumps) ===
  { pos: [5, 0, 1], size: [3, 0.6, 3], color: COLORS.platformAlt },
  { pos: [9, 0.5, 0], size: [2.5, 0.6, 2.5], color: COLORS.platform },
  { pos: [12, 1.0, -2], size: [2.5, 0.6, 2.5], color: COLORS.platformAlt },
  { pos: [15, 1.5, 0], size: [3, 0.6, 3], color: COLORS.platform },
  { pos: [18, 2.0, 2], size: [4, 0.8, 4], color: COLORS.accent },
]
