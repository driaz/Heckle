let audioContext = null
let jumpBuffer = null
let chimeBuffer = null

function ensureContext() {
  if (!audioContext) {
    audioContext = new AudioContext()
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume()
  }
  return audioContext
}

async function loadBuffer(url) {
  const ctx = ensureContext()
  const res = await fetch(url)
  const arrayBuffer = await res.arrayBuffer()
  return ctx.decodeAudioData(arrayBuffer)
}

async function init() {
  try {
    const [jump, chime] = await Promise.all([
      loadBuffer('/audio/jump.wav'),
      loadBuffer('/audio/chime.wav'),
    ])
    jumpBuffer = jump
    chimeBuffer = chime
    console.log('[SFX] Loaded jump and chime audio')
  } catch (err) {
    console.error('[SFX] Failed to load audio:', err)
  }
}

function play(buffer, volume = 0.3) {
  if (!buffer) return
  const ctx = ensureContext()
  const source = ctx.createBufferSource()
  const gain = ctx.createGain()
  gain.gain.value = volume
  source.buffer = buffer
  source.connect(gain)
  gain.connect(ctx.destination)
  source.start()
}

function playJump() {
  play(jumpBuffer, 0.25)
}

function playStarChime() {
  play(chimeBuffer, 0.21)
}

export default { init, playJump, playStarChime }
