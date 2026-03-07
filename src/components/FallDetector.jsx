import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { ecctrlRef } from '../lib/ecctrlRef'
import { RESPAWN_HEIGHT, CHECKPOINTS } from '../config/level'
import useGameStore from '../stores/gameStore'

const COOLDOWN_MS = 1000

function getCheckpointSpawn(playerZ) {
  const sorted = [...CHECKPOINTS].sort((a, b) => b.z - a.z)
  const cp = sorted.find((c) => playerZ >= c.z - 5) || CHECKPOINTS[0]
  return cp.spawn
}

export default function FallDetector() {
  const lastRespawn = useRef(0)

  useFrame(() => {
    const body = ecctrlRef.current?.group
    if (!body) return

    const pos = body.translation()
    if (pos.y < RESPAWN_HEIGHT) {
      const now = performance.now()
      if (now - lastRespawn.current < COOLDOWN_MS) return
      lastRespawn.current = now

      const store = useGameStore.getState()
      store.recordFall(pos)
      store.recordRespawn()

      const spawn = getCheckpointSpawn(pos.z)
      body.setTranslation(
        { x: spawn[0], y: spawn[1], z: spawn[2] },
        true
      )
      body.setLinvel({ x: 0, y: 0, z: 0 }, true)
      body.setAngvel({ x: 0, y: 0, z: 0 }, true)
    }
  })

  return null
}
