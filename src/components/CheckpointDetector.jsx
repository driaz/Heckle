import { useFrame } from '@react-three/fiber'
import { ecctrlRef } from '../lib/ecctrlRef'
import { CHECKPOINTS } from '../config/level'
import useGameStore from '../stores/gameStore'

/** Records the first time the player stands on each checkpoint pad. */
export default function CheckpointDetector() {
  useFrame(() => {
    const body = ecctrlRef.current?.group
    if (!body) return
    const pos = body.translation()
    const { checkpointsReached, recordCheckpoint } = useGameStore.getState()

    CHECKPOINTS.forEach((cp, i) => {
      if (checkpointsReached.has(i)) return
      // on the pad, not falling past it
      if (pos.z >= cp.z - 1.5 && pos.y > cp.spawn[1] - 1.5) recordCheckpoint(i)
    })
  })

  return null
}
