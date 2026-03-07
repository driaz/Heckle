import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RigidBody, BallCollider } from '@react-three/rapier'
import { COLORS } from '../../config/level'

const TWO_PI = Math.PI * 2

const PENDULUMS = [
  { pivot: [0, 5, 75], armLength: 3.5, maxAngle: 0.7, period: 2.5, phase: 0 },
  { pivot: [0, 5, 78.5], armLength: 4.0, maxAngle: 0.8, period: 2.0, phase: 0 },
  { pivot: [0, 5, 82], armLength: 3.5, maxAngle: 0.7, period: 2.5, phase: 1.2 },
]

function Pendulum({ pivot, armLength, maxAngle, period, phase }) {
  const groupRef = useRef()
  const bobBodyRef = useRef()

  useFrame((state) => {
    const angle = maxAngle * Math.sin(state.clock.elapsedTime * (TWO_PI / period) + phase)

    // Rotate visual group
    if (groupRef.current) {
      groupRef.current.rotation.z = angle
    }

    // Update bob collider position
    if (bobBodyRef.current) {
      const bobX = pivot[0] + armLength * Math.sin(angle)
      const bobY = pivot[1] - armLength * Math.cos(angle)
      bobBodyRef.current.setNextKinematicTranslation({ x: bobX, y: bobY, z: pivot[2] })
    }
  })

  return (
    <>
      {/* Visual pendulum (arm + bob) */}
      <group position={pivot} ref={groupRef}>
        {/* Arm */}
        <mesh position={[0, -armLength / 2, 0]} castShadow>
          <boxGeometry args={[0.15, armLength, 0.15]} />
          <meshStandardMaterial color={COLORS.pendulum} roughness={0.65} metalness={0.05} />
        </mesh>
        {/* Bob visual */}
        <mesh position={[0, -armLength, 0]} castShadow>
          <sphereGeometry args={[0.6, 12, 12]} />
          <meshStandardMaterial color={COLORS.danger} roughness={0.65} metalness={0.05} />
        </mesh>
      </group>

      {/* Bob physics collider (separate kinematic body) */}
      <RigidBody
        ref={bobBodyRef}
        type="kinematicPosition"
        position={[pivot[0], pivot[1] - armLength, pivot[2]]}
        colliders={false}
      >
        <BallCollider args={[0.6]} />
      </RigidBody>
    </>
  )
}

export default function SwingingPendulums() {
  return (
    <>
      {/* Bridge walkway */}
      <RigidBody type="fixed" position={[0, 0.8, 78.5]} colliders="cuboid">
        <mesh castShadow receiveShadow>
          <boxGeometry args={[3, 0.3, 12]} />
          <meshStandardMaterial color={COLORS.crystalGround} roughness={0.65} metalness={0.05} />
        </mesh>
      </RigidBody>

      {/* Pendulums */}
      {PENDULUMS.map((p, i) => (
        <Pendulum key={i} {...p} />
      ))}
    </>
  )
}
