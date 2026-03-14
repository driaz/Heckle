# Heckle

A browser-based 3D platformer with a real-time AI narrator that watches you play, roasts your failures, celebrates your wins, and talks back when you trash talk it.

## Demo

[![Heckle Demo](https://img.youtube.com/vi/RHcEM3dn2ro/maxresdefault.jpg)](https://www.youtube.com/watch?v=RHcEM3dn2ro)

## What is this?

Heckle is a proof of concept exploring AI-driven interactive narration in games. The game itself is a colorful obstacle course (think Fall Guys meets Astro Bot), but the real star is the narrator: an AI character that delivers context-aware, genuinely funny commentary in real time using voice synthesis.

The narrator knows where you are, what you're doing, how many times you've died, and which obstacle keeps killing you. It has opinions about all of it.

You can also talk back. Say "that wasn't my fault" after dying, and the narrator will respond to your excuse with full awareness of your game state ("Big talk for someone who's died six times on The Wobbly Bridge").

## Tech Stack

| Layer | Tech | Purpose |
|-------|------|---------|
| Build | Vite + React | Dev server, HMR, bundling |
| 3D Rendering | Three.js via @react-three/fiber | WebGL rendering |
| Helpers | @react-three/drei | Sky, Environment, fog, etc. |
| Physics | @react-three/rapier | Collision, gravity, rigid bodies |
| Character | ecctrl | Third-person controller with animations |
| State | zustand | Lightweight state management |
| LLM (Text Gen) | Anthropic Claude / Google Gemini | Narrator comedy writing |
| TTS (Voice) | ElevenLabs Flash v2.5 | Voice synthesis via WebSocket |
| STT (Voice Input) | Web Speech API | Player speech recognition |

## Architecture

```
Game Events (fall, collect, idle, hazard)
    |
    v
Game Director (decides WHEN to speak, enriches context)
    |
    v
NarratorLLM (Claude or Gemini -- generates text, model-agnostic)
    |
    v  [streaming tokens]
NarratorTTS (ElevenLabs WebSocket -- converts to speech)
    |
    v
Speaker (Web Audio API)

Player Mic (Web Speech API) --> transcript --> NarratorLLM (with game context) --> TTS
```

The LLM layer is model-agnostic. Switch between Claude and Gemini from the browser console:

```js
heckleSetProvider('claude')  // or 'gemini'
```

## The Level

A linear obstacle course with 3 themed sections, 10 collectible stars, and a goal area:

- **Green Meadows** (Z: 0-42) -- The Wobbly Bridge, Bouncy Meadow, Spinning Lily Pads
- **Crystal Gauntlet** (Z: 42-86) -- Vanishing Steps, The Gauntlet (sweeping walls), Pendulum Alley
- **Lava Peaks** (Z: 86-131) -- Conveyor Crush, Rising Pillars, The Slime Gauntlet, Goal Area

Every obstacle has a name and description that the narrator uses for context-aware commentary.

## Setup

```bash
git clone https://github.com/driaz/heckle.git
cd heckle
npm install
```

Create a `.env` file in the project root:

```
VITE_ANTHROPIC_API_KEY=your_key_here
VITE_GEMINI_API_KEY=your_key_here
VITE_ELEVENLABS_API_KEY=your_key_here
```

You need at least one LLM key (Anthropic or Google) and an ElevenLabs key for voice.

```bash
npm run dev
```

Open http://localhost:5173 in Chrome. Gamepad supported (tested with DualShock 4).

## Controls

| Input | Action |
|-------|--------|
| WASD / Left Stick | Move |
| Space / A Button | Jump |
| Mic (browser permission) | Talk to the narrator |

## Key Design Decisions

| Decision | Choice | Why |
|----------|--------|-----|
| LLM for text, ElevenLabs for voice | Decoupled pipeline | Smarter model writes funnier jokes. Better voice delivers them. Worth the ~650ms vs Gemini Live's ~300ms. |
| Web Speech API for STT | Replaced ElevenLabs Scribe | 59 lines vs 228. More reliable, no WebSocket drops mid-sentence. Free. |
| Model-agnostic LLM layer | Claude and Gemini swappable | A/B test comedy quality without touching the pipeline. |
| Named obstacle areas | Z-coordinate lookup | Linear level makes position-to-area mapping trivial. Narrator says "The Wobbly Bridge" not "position 14." |
| Streaming LLM to TTS | Tokens pipe directly to ElevenLabs | Audio starts before the full sentence is generated. LLM outpaces speech. |
| Mic muting during narration | Echo prevention | Simple and effective. Player speech after narration gets combined context. |

## What I Learned

* **Comedy quality comes from the model, not the pipeline.** Gemini Live was faster but Claude writes funnier lines. A joke that lands at 650ms beats a flat quip at 300ms.
* **Voice quality is the multiplier.** The same text sounds dramatically different through ElevenLabs vs Gemini's native audio. Punctuation in the text (ellipses, dashes) acts as stage direction for the TTS.
* **Context is everything.** "You fell" is not funny. "You fell off The Wobbly Bridge for the fourth time" is. Named areas and rich event data are what make the narrator feel aware.
* **Bidirectional audio is the future.** The turn-taking problem (narrator talks over player) is the hardest UX challenge. Native bidirectional streams (Gemini Live) solve it elegantly. Decoupled pipelines require manual orchestration that never feels as natural.
* **Web Speech API is underrated.** For a demo, it's more reliable than paid STT services with zero cost and zero dependencies.
* **System prompts that write for voice delivery matter.** "Use rhetorical questions, dramatic pauses via punctuation, put the punch word at the end" -- these instructions make the TTS output sound like a performance, not a reading.

## Project Structure

```
src/
  components/       # React components (HUD, Character, Stars, etc.)
  systems/           # Non-React modules
    GameDirector.js  # Decides when to narrate, builds prompts
    NarratorLLM.js   # Model-agnostic text generation (Claude/Gemini)
    NarratorTTS.js   # ElevenLabs WebSocket TTS
    NarratorSTT.js   # Web Speech API voice input
    NarratorPipeline.js  # Orchestrates LLM + TTS + STT
    events.js        # Event bus
  stores/
    gameStore.js     # Zustand store (game state, session memory)
  config/
    level.js         # Level layout, obstacle names, area descriptions
```

## Credits

* Character: Mixamo (Ty)
* Background music: SUNO
* Built with Claude Code + Claude (Anthropic), with Gemini (Google) for A/B testing
* Voice: ElevenLabs

## Author

Daniel Riaz -- [github.com/driaz](https://github.com/driaz)
