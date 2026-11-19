// Which narrator runs:
//   'livekit' (default): v2, the avatar narrator that runs as a LiveKit agent
//   'v1': the original in-browser narrator (LLM + ElevenLabs + mic)
// Set VITE_NARRATOR in .env, or override per page load with ?narrator=v1
const choice =
  new URLSearchParams(window.location.search).get('narrator') ||
  import.meta.env.VITE_NARRATOR ||
  'livekit'

export const NARRATOR = choice === 'v1' ? 'v1' : 'livekit'
