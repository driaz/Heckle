import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RigidBody } from '@react-three/rapier'
import { COLORS } from '../../config/level'

const TWO_PI = Math.PI * 2

const WALLS = [
  { z: 62, height: 2, period: 3.0, phase: 0 },
  { z: 66, height: 2, period: 2.5, phase: Math.PI },
  { z: 70, height: 2.5, period: 2.0, phase: 0 },
]

function PusherWall({ z, height, period, phase }) {
  const bodyRef = useRef()
  const baseY = 0.8 + height / 2

  useFrame((state) => {
    if (!bodyRef.current) return
    const x = 4 * Math.sin(state.clock.elapsedTime * (TWO_PI / period) + phase)
    bodyRef.current.setNextKinematicTranslation({ x, y: baseY, z })
  })

  return (
    <RigidBody ref={bodyRef} type="kinematicPosition" position={[0, baseY, z]} colliders="cuboid">
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1.5, height, 0.5]} />
        <meshStandardMaterial color={COLORS.crystalAccent} roughness={0.65} metalness={0.05} />
      </mesh>
    </RigidBody>
  )
}

export default function MovingPushers() {
  return (
    <>
      {/* Walkway */}
      <RigidBody type="fixed" position={[0, 0.8, 66]} colliders="cuboid">
        <mesh castShadow receiveShadow>
          <boxGeometry args={[3, 0.3, 10]} />
          <meshStandardMaterial color={COLORS.crystalGround} roughness={0.65} metalness={0.05} />
        </mesh>
      </RigidBody>

      {/* Pusher walls */}
      {WALLS.map((wall, i) => (
        <PusherWall key={i} {...wall} />
      ))}
    </>
  )
}
