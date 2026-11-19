import { useEffect, useRef } from 'react'
import { useNarratorStore } from '../systems/LiveKitNarrator'

/** The narrator's avatar, bottom-right. Hidden whenever there is no video to show. */
export default function NarratorOverlay() {
  const videoTrack = useNarratorStore((s) => s.videoTrack)
  const speaking = useNarratorStore((s) => s.speaking)
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
        borderRadius: 16,
        overflow: 'hidden',
        background: '#000',
        boxShadow: speaking
          ? '0 0 0 3px #FFFF00, 0 8px 24px rgba(0,0,0,0.4)'
          : '0 0 0 2px rgba(255,255,255,0.6), 0 8px 24px rgba(0,0,0,0.4)',
        opacity: videoTrack ? 1 : 0,
        transition: 'opacity 0.4s, box-shadow 0.2s',
        pointerEvents: 'none',
      }}
    >
      <video
        ref={videoRef}
        muted
        playsInline
        style={{ display: 'block', width: '100%', maxHeight: '40vh', objectFit: 'cover' }}
      />
    </div>
  )
}
