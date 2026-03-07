import useGameStore from '../stores/gameStore'

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

  return (
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
      {micActive && (
        <div style={pillStyle}>
          🎤
        </div>
      )}
    </div>
  )
}
