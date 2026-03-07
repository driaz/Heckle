// ── Color Palette ──────────────────────────────────────────────
export const COLORS = {
  // Section 1: Green Meadows — candy spring greens and sunshine yellow
  meadowGround: '#58D858',
  meadowPlatform: '#78F078',
  meadowAccent: '#FFE030',
  meadowLight: '#90F090',

  // Section 2: Crystal Gauntlet — sky blue and bubblegum purple
  crystalGround: '#5CB8FF',
  crystalPlatform: '#C85CFF',
  crystalAccent: '#78D8FF',
  crystalLight: '#E088FF',

  // Section 3: Lava Peaks — cherry red, iPod-nano orange, sunshine amber
  lavaGround: '#FF6872',
  lavaPlatform: '#FF9500',
  lavaAccent: '#FFBE30',
  lavaLight: '#FF7880',

  // Goal
  goalGold: '#FFE030',
  goalWhite: '#FFFFFF',

  // Shared
  star: '#FFE040',
  fog: '#c0e8ff',
  bouncy: '#FF68A8',
  danger: '#FF5070',
  enemy: '#C8A882',
  conveyor: '#50D0FF',
  pendulum: '#98B8D0',
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
  { pos: [0, 1.5, 111], size: [3, 0.3, 2], color: COLORS.lavaGround },            // Before Slime Gauntlet
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
