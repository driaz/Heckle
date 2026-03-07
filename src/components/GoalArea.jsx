import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RigidBody, CuboidCollider } from '@react-three/rapier'
import { Sparkles } from '@react-three/drei'
import { COLORS } from '../config/level'
import useGameStore from '../stores/gameStore'

export default function GoalArea() {
  const starRef = useRef()
  const goalReached = useGameStore((s) => s.goalReached)

  useFrame(() => {
    if (starRef.current) {
      starRef.current.rotation.y += 0.01
    }
  })

  const handleGoal = () => {
    useGameStore.getState().recordGoalReached()
  }

  return (
    <>
      {/* Goal platform */}
      <RigidBody type="fixed" position={[0, 1.8, 131]} colliders="cuboid">
        <mesh castShadow receiveShadow>
          <boxGeometry args={[8, 0.6, 8]} />
          <meshStandardMaterial color={COLORS.goalGold} roughness={0.65} metalness={0.05} />
        </mesh>
      </RigidBody>

      {/* Corner pillars */}
      {[[-3, 128], [3, 128], [-3, 134], [3, 134]].map(([x, z], i) => (
        <mesh key={i} position={[x, 3.3, z]} castShadow>
          <cylinderGeometry args={[0.3, 0.3, 3, 8]} />
          <meshStandardMaterial color={COLORS.goalWhite} roughness={0.65} metalness={0.05} />
        </mesh>
      ))}

      {/* Arch top bar */}
      <mesh position={[0, 4.8, 128]} castShadow>
        <boxGeometry args={[6.6, 0.3, 0.3]} />
        <meshStandardMaterial color={COLORS.goalGold} roughness={0.65} metalness={0.05} />
      </mesh>

      {/* Decorative spinning star */}
      <mesh ref={starRef} position={[0, 5.5, 131]}>
        <octahedronGeometry args={[0.8]} />
        <meshStandardMaterial
          color={COLORS.goalGold}
          emissive={COLORS.goalGold}
          emissiveIntensity={0.5}
          roughness={0.65}
          metalness={0.05}
        />
      </mesh>

      {/* Ambient sparkles around the goal */}
      <Sparkles
        count={30}
        size={3}
        scale={[8, 6, 8]}
        speed={0.5}
        color={COLORS.goalGold}
        position={[0, 4, 131]}
      />

      {/* Celebration confetti burst when goal is reached */}
      {goalReached && (
        <Sparkles
          count={100}
          size={5}
          scale={[12, 10, 12]}
          speed={2}
          color="#FFFF00"
          position={[0, 5, 131]}
        />
      )}

      {/* Goal trigger sensor */}
      <RigidBody type="fixed" position={[0, 3, 131]} colliders={false}>
        <CuboidCollider args={[3, 2, 3]} sensor onIntersectionEnter={handleGoal} />
      </RigidBody>
    </>
  )
}
