// ── Color Palette ──────────────────────────────────────────────
export const COLORS = {
  // Section 1: Green Meadows — vivid greens and sunny yellow
  meadowGround: '#4CAF50',
  meadowPlatform: '#66BB6A',
  meadowAccent: '#FFD54F',
  meadowLight: '#81C784',

  // Section 2: Crystal Gauntlet — bright blue and vivid purple
  crystalGround: '#42A5F5',
  crystalPlatform: '#AB47BC',
  crystalAccent: '#4FC3F7',
  crystalLight: '#CE93D8',

  // Section 3: Lava Peaks — bold red, electric orange, vivid amber
  lavaGround: '#EF5350',
  lavaPlatform: '#FF9800',
  lavaAccent: '#FFC107',
  lavaLight: '#FF5252',

  // Goal
  goalGold: '#FFD700',
  goalWhite: '#FFFFFF',

  // Shared
  star: '#FFD700',
  fog: '#e8f4ff',
  bouncy: '#FF4081',
  danger: '#FF1744',
  enemy: '#8D6E63',
  conveyor: '#29B6F6',
  pendulum: '#78909C',
}

// ── Static Platforms (ground plates, transition pads, walkways) ─
export const PLATFORMS = [
  // Section 1: Green Meadows
  { pos: [0, -0.5, 0], size: [8, 1, 8], color: COLORS.meadowGround },            // Start island
  { pos: [0, -0.2, 6], size: [3, 0.5, 3], color: COLORS.meadowPlatform },         // Approach to Wobbly Bridge
  { pos: [0, -0.2, 21], size: [4, 0.5, 3], color: COLORS.meadowPlatform },        // Landing after Wobbly Bridge
  // (Bouncy Meadow pads are dynamic — in BouncyPads.jsx)
  // (Spinning Lily Pads are dynamic — in SpinningPlatforms.jsx)

  // Section 2: Crystal Gauntlet (transition pad)
  { pos: [0, 0.5, 42], size: [5, 0.6, 4], color: COLORS.crystalGround },          // Section 2 start
  { pos: [0, 0.5, 46], size: [3, 0.5, 2], color: COLORS.crystalPlatform },        // Before Vanishing Steps
  // (Vanishing Steps are dynamic — in VanishingSteps.jsx)
  { pos: [0, 0.8, 60], size: [3, 0.3, 2], color: COLORS.crystalPlatform },        // Before The Gauntlet
  // Gauntlet walkway is in MovingPushers.jsx
  { pos: [0, 0.8, 73], size: [3, 0.3, 2], color: COLORS.crystalPlatform },        // Before Pendulum Alley
  // Pendulum bridge is in SwingingPendulums.jsx

  // Section 3: Lava Peaks (transition pad)
  { pos: [0, 0.8, 86], size: [5, 0.6, 3], color: COLORS.lavaGround },             // Section 3 start
  { pos: [0, 0.8, 89], size: [3, 0.3, 2], color: COLORS.lavaPlatform },           // Before Conveyor Crush
  // Conveyors are in ConveyorPlatforms.jsx
  // Rising Pillars are in RisingPillars.jsx
  { pos: [0, 1.2, 101], size: [3, 0.3, 2], color: COLORS.lavaPlatform },          // Before Rising Pillars
  { pos: [0, 1.5, 113], size: [3, 0.3, 2], color: COLORS.lavaGround },            // Before Slime Gauntlet
  // Slime path segments are in Enemies.jsx

  // Goal approach
  { pos: [0, 1.5, 126], size: [4, 0.3, 3], color: COLORS.lavaAccent },            // Before goal
]

// ── Star Positions (10 total) ──────────────────────────────────
export const STARS = [
  [2, 1.5, 2],         // 0: Start island (free)
  [0, 1.5, 14],        // 1: Wobbly Bridge center
  [0, 3.5, 27],        // 2: Above Bouncy Meadow (must bounce)
  [0, 2.5, 53],        // 3: Vanishing Steps center
  [0, 2.5, 66],        // 4: Gauntlet center
  [0, 2.0, 72],        // 5: Gauntlet exit
  [0, 2.5, 78.5],      // 6: Pendulum Alley center
  [-1.5, 2.5, 96],     // 7: Conveyor Crush off-center
  [0, 3.5, 106],       // 8: Rising Pillars center
  [3, 3.0, 118],       // 9: Slime Gauntlet (guarded)
]

// ── Respawn ────────────────────────────────────────────────────
export const RESPAWN_HEIGHT = -10
export const SPAWN_POINT = [0, 2, 0]

export const CHECKPOINTS = [
  { z: 0, spawn: [0, 2, 0] },
  { z: 42, spawn: [0, 2.5, 42] },
  { z: 86, spawn: [0, 2.5, 86] },
]

// ── Obstacle Names (for narrator) ─────────────────────────────
export const OBSTACLE_NAMES = {
  wobblyBridge: 'The Wobbly Bridge',
  bouncyMeadow: 'Bouncy Meadow',
  spinningLilyPads: 'Spinning Lily Pads',
  vanishingSteps: 'Vanishing Steps',
  theGauntlet: 'The Gauntlet',
  pendulumAlley: 'Pendulum Alley',
  conveyorCrush: 'Conveyor Crush',
  risingPillars: 'Rising Pillars',
  slimeGauntlet: 'The Slime Gauntlet',
}
