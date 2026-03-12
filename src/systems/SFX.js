let audioContext = null

function ensureContext() {
  if (!audioContext) {
    audioContext = new AudioContext()
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume()
  }
  return audioContext
}

function playStarChime() {
  const ctx = ensureContext()
  const now = ctx.currentTime
  const volume = 0.15

  // First tone: C5 (523Hz)
  const osc1 = ctx.createOscillator()
  const gain1 = ctx.createGain()
  osc1.type = 'sine'
  osc1.frequency.value = 523
  gain1.gain.setValueAtTime(volume, now)
  gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.1)
  osc1.connect(gain1)
  gain1.connect(ctx.destination)
  osc1.start(now)
  osc1.stop(now + 0.1)

  // Second tone: E5 (659Hz) — rising major third
  const osc2 = ctx.createOscillator()
  const gain2 = ctx.createGain()
  osc2.type = 'sine'
  osc2.frequency.value = 659
  gain2.gain.setValueAtTime(volume, now + 0.08)
  gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.18)
  osc2.connect(gain2)
  gain2.connect(ctx.destination)
  osc2.start(now + 0.08)
  osc2.stop(now + 0.18)
}

export default { playStarChime }
