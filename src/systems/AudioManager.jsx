import { useEffect, useRef, useState, useCallback } from 'react'

const MUSIC_URL = '/audio/Sunny Steps.mp3'
const MUSIC_VOLUME = 0.3

/**
 * Handles all game audio. Renders a "click to start" overlay until the
 * first user gesture (click / keypress / gamepad), then starts looping
 * background music. Sits outside <Canvas> — pure HTML5 Audio.
 */
export default function AudioManager() {
  const musicRef = useRef(null)
  const [started, setStarted] = useState(false)

  // Create the Audio element once
  useEffect(() => {
    const music = new Audio(MUSIC_URL)
    music.loop = true
    music.volume = MUSIC_VOLUME
    music.preload = 'auto'
    musicRef.current = music

    return () => {
      music.pause()
      music.src = ''
      musicRef.current = null
    }
  }, [])

  // Start playback on first user gesture
  const startAudio = useCallback(() => {
    if (started) return
    setStarted(true)

    const music = musicRef.current
    if (music) {
      music.play().catch(() => {
        // Extremely rare: gesture still not trusted. Silently retry on
        // next interaction — the overlay is already dismissed so the
        // user will click/tap again naturally.
      })
    }
  }, [started])

  // Listen for any user gesture (click, key, gamepad)
  useEffect(() => {
    if (started) return

    const handler = () => startAudio()

    window.addEventListener('click', handler, { once: true })
    window.addEventListener('keydown', handler, { once: true })
    window.addEventListener('pointerdown', handler, { once: true })

    // Gamepad doesn't fire DOM events on button press, but
    // gamepadconnected counts as a gesture in most browsers
    window.addEventListener('gamepadconnected', handler, { once: true })

    return () => {
      window.removeEventListener('click', handler)
      window.removeEventListener('keydown', handler)
      window.removeEventListener('pointerdown', handler)
      window.removeEventListener('gamepadconnected', handler)
    }
  }, [started, startAudio])

  // "Click to start" overlay — dismissed on first interaction
  if (started) return null

  return (
    <div
      onClick={startAudio}
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        pointerEvents: 'auto',
        cursor: 'pointer',
      }}
    >
      <div
        style={{
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          borderRadius: 12,
          padding: '16px 32px',
          color: 'white',
          fontFamily: 'system-ui, sans-serif',
          fontSize: 20,
          fontWeight: 600,
          userSelect: 'none',
        }}
      >
        Click to start
      </div>
    </div>
  )
}
