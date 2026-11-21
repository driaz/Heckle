// Whichever narrator is running reports here when it starts and stops talking,
// so the rest of the game (music ducking) doesn't care which one it is.
const listeners = { start: new Set(), end: new Set() }
let speaking = false

function set(next) {
  if (next === speaking) return
  speaking = next
  for (const cb of listeners[next ? 'start' : 'end']) cb()
}

export default {
  start: () => set(true),
  end: () => set(false),
  onStart: (cb) => { listeners.start.add(cb); return () => listeners.start.delete(cb) },
  onEnd: (cb) => { listeners.end.add(cb); return () => listeners.end.delete(cb) },
}
