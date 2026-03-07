import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RigidBody, CuboidCollider } from '@react-three/rapier'
import { COLORS } from '../../config/level'
import { ecctrlRef } from '../../lib/ecctrlRef'

const CONVEYORS = [
  { pos: [0, 1.0, 91], size: [4, 0.3, 4], pushX: -3.5 },
  { pos: [0, 1.2, 96], size: [4, 0.3, 4], pushX: 4.0 },
  { pos: [0, 1.4, 100], size: [3.5, 0.3, 3.5], pushX: -5.0 },
]

function ConveyorPlatform({ pos, size, pushX }) {
  const onConveyorRef = useRef(false)

  useFrame((_, delta) => {
    if (!onConveyorRef.current) return
    const player = ecctrlRef.current?.group
    if (!player) return
    player.applyImpulse({ x: pushX * delta, y: 0, z: 0 }, true)
  })

  return (
    <RigidBody type="fixed" position={pos} colliders="cuboid">
      <mesh castShadow receiveShadow>
        <boxGeometry args={size} />
        <meshStandardMaterial color={COLORS.conveyor} roughness={0.65} metalness={0.05} />
      </mesh>
      {/* Directional stripes */}
      {[-1.2, -0.4, 0.4, 1.2].map((offset, i) => (
        <mesh key={i} position={[pushX > 0 ? offset : -offset, 0.16, 0]}>
          <boxGeometry args={[0.12, 0.02, size[2] * 0.8]} />
          <meshStandardMaterial color="#5a9fd4" roughness={0.65} metalness={0.05} />
        </mesh>
      ))}
      {/* Sensor to detect player standing on conveyor */}
      <CuboidCollider
        args={[size[0] / 2, 0.5, size[2] / 2]}
        position={[0, 0.5, 0]}
        sensor
        onIntersectionEnter={() => { onConveyorRef.current = true }}
        onIntersectionExit={() => { onConveyorRef.current = false }}
      />
    </RigidBody>
  )
}

export default function ConveyorPlatforms() {
  return (
    <>
      {CONVEYORS.map((conv, i) => (
        <ConveyorPlatform key={i} {...conv} />
      ))}
    </>
  )
}
