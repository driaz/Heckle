import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RigidBody, CuboidCollider } from '@react-three/rapier'
import { Sparkles } from '@react-three/drei'
import { STARS, COLORS } from '../config/level'
import useGameStore from '../stores/gameStore'
import SFX from '../systems/SFX'

function Star({ position, index }) {
  const groupRef = useRef()
  const collected = useGameStore((s) => s.starsCollected.has(index))
  const collectStar = useGameStore((s) => s.collectStar)

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.02
      groupRef.current.position.y =
        position[1] + Math.sin(state.clock.elapsedTime * 2 + index) * 0.15
    }
  })

  if (collected) return null

  return (
    <RigidBody
      type="fixed"
      position={position}
      colliders={false}
    >
      <CuboidCollider
        args={[0.5, 0.5, 0.5]}
        sensor
        onIntersectionEnter={() => { collectStar(index); SFX.playStarChime() }}
      />
      <group ref={groupRef}>
        {/* Gold octahedron */}
        <mesh castShadow>
          <octahedronGeometry args={[0.3, 0]} />
          <meshStandardMaterial
            color={COLORS.star}
            emissive={COLORS.star}
            emissiveIntensity={0.4}
            roughness={0.65}
            metalness={0.05}
          />
        </mesh>
        {/* Outer glow */}
        <mesh>
          <octahedronGeometry args={[0.45, 0]} />
          <meshBasicMaterial
            color={COLORS.star}
            transparent
            opacity={0.15}
          />
        </mesh>
        {/* Sparkle particles */}
        <Sparkles count={8} size={2} scale={1.2} speed={0.4} color={COLORS.star} />
      </group>
    </RigidBody>
  )
}

export default function Stars() {
  return (
    <>
      {STARS.map((pos, i) => (
        <Star key={i} position={pos} index={i} />
      ))}
    </>
  )
}
