import { useEffect, useRef } from 'react'
import liveKitNarrator, { useNarratorStore } from '../systems/LiveKitNarrator'
import useGameStore from '../stores/gameStore'

/**
 * The narrator's avatar, bottom-right, with a mic button on its corner.
 * Hidden whenever there is no video to show.
 */
export default function NarratorOverlay() {
  const videoTrack = useNarratorStore((s) => s.videoTrack)
  const speaking = useNarratorStore((s) => s.speaking)
  const mic = useNarratorStore((s) => s.mic)
  const started = useGameStore((s) => s.started)
  const videoRef = useRef(null)

  useEffect(() => {
    const el = videoRef.current
    if (!videoTrack || !el) return
    videoTrack.attach(el)
    return () => { videoTrack.detach(el) }
  }, [videoTrack])

  return (
    <div
      style={{
        position: 'fixed',
        right: 16,
        bottom: 16,
        width: 'min(220px, 30vw)',
        zIndex: 20,
        opacity: videoTrack ? 1 : 0,
        transition: 'opacity 0.4s',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          borderRadius: 16,
          overflow: 'hidden',
          background: '#000',
          boxShadow: speaking
            ? '0 0 0 3px #FFFF00, 0 8px 24px rgba(0,0,0,0.4)'
            : '0 0 0 2px rgba(255,255,255,0.6), 0 8px 24px rgba(0,0,0,0.4)',
          transition: 'box-shadow 0.2s',
        }}
      >
        <video
          ref={videoRef}
          muted
          playsInline
          style={{ display: 'block', width: '100%', maxHeight: '40vh', objectFit: 'cover' }}
        />
      </div>

      {/* Mic: red while the narrator can hear the player */}
      {videoTrack && started && (
        <button
          onClick={(e) => {
            e.currentTarget.blur() // keep Space for jumping, not for this button
            liveKitNarrator.toggleMic()
          }}
          title={
            mic === 'on'
              ? 'The narrator can hear you. Click to mute.'
              : mic === 'blocked'
                ? 'Mic unavailable. Allow it in the browser, then click to retry.'
                : 'Mic muted. Click to talk to the narrator.'
          }
          style={{
            position: 'absolute',
            top: -14,
            left: -14,
            width: 40,
            height: 40,
            borderRadius: '50%',
            border: 'none',
            background: mic === 'on' ? 'rgba(220, 38, 38, 0.9)' : 'rgba(0,0,0,0.6)',
            color: 'white',
            fontSize: 18,
            cursor: 'pointer',
            pointerEvents: 'auto',
            opacity: mic === 'on' ? 1 : 0.75,
            textDecoration: mic === 'on' ? 'none' : 'line-through',
            transition: 'background 0.2s',
          }}
        >
          🎤
        </button>
      )}
    </div>
  )
}
