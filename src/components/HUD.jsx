import useGameStore from '../stores/gameStore'

export default function HUD() {
  const count = useGameStore((s) => s.starsCollected.size)
  const total = useGameStore((s) => s.totalStars)

  return (
    <div
      style={{
        position: 'fixed',
        top: 16,
        left: 16,
        background: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        borderRadius: 8,
        padding: '8px 16px',
        color: 'white',
        fontFamily: 'system-ui, sans-serif',
        fontSize: 18,
        fontWeight: 600,
        pointerEvents: 'none',
        zIndex: 10,
        userSelect: 'none',
      }}
    >
      ⭐ {count} / {total}
    </div>
  )
}
