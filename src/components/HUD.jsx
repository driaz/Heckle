import { useState } from 'react'
import useGameStore from '../stores/gameStore'
import NarratorPipeline from '../systems/NarratorPipeline'

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

const TEST_PROMPT =
  '[Stars: 2/8, Deaths: 4, Streak: 3] The player just fell off the spinning platforms section for the 4th time. Same spot as last 3 falls. React with escalating disbelief.'

export default function HUD() {
  const count = useGameStore((s) => s.starsCollected.size)
  const total = useGameStore((s) => s.totalStars)
  const falls = useGameStore((s) => s.fallCount)
  const micActive = useGameStore((s) => s.micActive)
  const goalReached = useGameStore((s) => s.goalReached)

  const [pipelineReady, setPipelineReady] = useState(false)
  const [provider, setProvider] = useState('claude')
  const [testing, setTesting] = useState(false)

  async function handleTest() {
    if (testing) return
    setTesting(true)
    try {
      if (!pipelineReady) {
        await NarratorPipeline.init()
        setPipelineReady(true)
      }
      await NarratorPipeline.narrate(TEST_PROMPT)
    } catch (err) {
      console.error('[Test] Error:', err)
    }
    setTesting(false)
  }

  function handleToggle() {
    const next = provider === 'claude' ? 'gemini' : 'claude'
    setProvider(next)
    NarratorPipeline.setProvider(next)
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
        {micActive && (
          <div style={pillStyle}>
            🎤
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

      {/* Test controls - bottom right */}
      <div
        style={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          zIndex: 20,
          userSelect: 'none',
        }}
      >
        <button
          onClick={handleToggle}
          style={{
            ...pillStyle,
            cursor: 'pointer',
            border: 'none',
            fontSize: 14,
            textAlign: 'center',
          }}
        >
          {provider === 'claude' ? 'Claude' : 'Gemini'}
        </button>
        <button
          onClick={handleTest}
          disabled={testing}
          style={{
            ...pillStyle,
            cursor: testing ? 'wait' : 'pointer',
            border: 'none',
            fontSize: 14,
            opacity: testing ? 0.6 : 1,
            textAlign: 'center',
          }}
        >
          {testing ? 'Speaking...' : 'Test Narrator'}
        </button>
      </div>
    </>
  )
}
