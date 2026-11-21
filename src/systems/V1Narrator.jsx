import { useEffect } from 'react'
import GameDirectorManager from './GameDirectorManager'
import narratorPipeline from './NarratorPipeline'
import narratorSpeech from './narratorSpeech'
import useGameStore from '../stores/gameStore'

/**
 * The original narrator: LLM and ElevenLabs called from the browser, plus the mic.
 * Loaded only when the narrator flag is 'v1' (see config/narrator.js).
 */
export default function V1Narrator() {
  const micActive = useGameStore((s) => s.micActive)

  useEffect(() => {
    narratorPipeline.onSpeechStart(narratorSpeech.start)
    narratorPipeline.onSpeechEnd(narratorSpeech.end)
    return () => {
      narratorPipeline.offSpeechStart(narratorSpeech.start)
      narratorPipeline.offSpeechEnd(narratorSpeech.end)
    }
  }, [])

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
      <GameDirectorManager />

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
