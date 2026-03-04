import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { ecctrlRef } from '../lib/ecctrlRef'
import useGameStore from '../stores/gameStore'

const MOVE_THRESHOLD = 0.1
const IDLE_TRIGGER = 8        // seconds before first idle event
const IDLE_ESCALATE_MIN = 10  // min seconds between subsequent idle events
const IDLE_ESCALATE_MAX = 15  // max seconds between subsequent idle events

export default function IdleDetector() {
  const lastPos = useRef(null)
  const idleStart = useRef(null)
  const lastIdleEvent = useRef(null)

  useFrame(() => {
    const body = ecctrlRef.current?.group
    if (!body) return

    const pos = body.translation()

    if (lastPos.current) {
      const dx = pos.x - lastPos.current.x
      const dy = pos.y - lastPos.current.y
      const dz = pos.z - lastPos.current.z
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)

      if (dist > MOVE_THRESHOLD) {
        // Player moved — reset
        idleStart.current = null
        lastIdleEvent.current = null
      } else {
        const now = performance.now() / 1000

        if (idleStart.current === null) {
          idleStart.current = now
        }

        const idleDuration = now - idleStart.current

        if (idleDuration >= IDLE_TRIGGER) {
          const sinceLastEvent = lastIdleEvent.current
            ? now - lastIdleEvent.current
            : Infinity
          const threshold = lastIdleEvent.current === null
            ? 0
            : IDLE_ESCALATE_MIN + Math.random() * (IDLE_ESCALATE_MAX - IDLE_ESCALATE_MIN)

          if (sinceLastEvent >= threshold) {
            useGameStore.getState().recordIdle(idleDuration, pos)
            lastIdleEvent.current = now
          }
        }
      }
    }

    lastPos.current = { x: pos.x, y: pos.y, z: pos.z }
  })

  return null
}
