import { useRef } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { playerPosition } from '../lib/playerPosition'

const OFFSET = new THREE.Vector3(15, 15, 15)
const LOOK_UP = new THREE.Vector3(0, 1, 0) // look at body, not feet

export default function IsometricCamera() {
  const { camera } = useThree()
  const targetPos = useRef(new THREE.Vector3())
  const lookTarget = useRef(new THREE.Vector3())

  useFrame((_, delta) => {
    // Target position = player + offset
    targetPos.current.copy(playerPosition).add(OFFSET)

    // Smooth follow via exponential lerp
    const smoothing = 1 - Math.exp(-4 * delta)
    camera.position.lerp(targetPos.current, smoothing)

    // Look at the player (slightly above feet)
    lookTarget.current.copy(playerPosition).add(LOOK_UP)
    camera.lookAt(lookTarget.current)
  })

  return null
}
