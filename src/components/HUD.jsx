import useGameStore from '../stores/gameStore'
import narratorPipeline from '../systems/NarratorPipeline'

const pillStyle = {
  background: 'rgba(0,0,0,0.5)',
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
  borderRadius: 8,
  padding: '8px 16px',
  color: 'white',
  fontFamily: 'system-ui, sans-serif',
  fontSize: 18,
  fontWeight: 600,
}

export default function HUD() {
  const count = useGameStore((s) => s.starsCollected.size)
  const total = useGameStore((s) => s.totalStars)
  const falls = useGameStore((s) => s.fallCount)
  const micActive = useGameStore((s) => s.micActive)
  const goalReached = useGameStore((s) => s.goalReached)

  async function handleMicToggle() {
    if (micActive) {
      narratorPipeline.stopListening()
    } else {
      try {
        await narratorPipeline.startListening()
      } catch (err) {
        console.error('[HUD] Mic error:', err)
      }
    }
  }

  return (
    <>
      {/* Game HUD - top left */}
      <div
        style={{
          position: 'fixed',
          top: 16,
          left: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          pointerEvents: 'none',
          zIndex: 10,
          userSelect: 'none',
        }}
      >
        <div style={pillStyle}>
          ⭐ {count} / {total}
        </div>
        {falls > 0 && (
          <div style={pillStyle}>
            💀 {falls}
          </div>
        )}
        {goalReached && (
          <div
            style={{
              ...pillStyle,
              background: 'rgba(255, 215, 0, 0.8)',
              fontSize: 22,
              textAlign: 'center',
            }}
          >
            Course Complete!
          </div>
        )}
      </div>

      {/* Mic toggle - bottom right */}
      <button
        onClick={handleMicToggle}
        style={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          zIndex: 20,
          width: 48,
          height: 48,
          borderRadius: '50%',
          border: 'none',
          background: micActive ? 'rgba(220, 38, 38, 0.8)' : 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          color: 'white',
          fontSize: 22,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          userSelect: 'none',
          transition: 'background 0.2s',
          animation: micActive ? 'mic-pulse 2s ease-in-out infinite' : 'none',
        }}
      >
        🎤
      </button>

      {/* Mic pulse animation */}
      {micActive && (
        <style>{`
          @keyframes mic-pulse {
            0%, 100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.4); }
            50% { box-shadow: 0 0 0 10px rgba(220, 38, 38, 0); }
          }
        `}</style>
      )}
    </>
  )
}
