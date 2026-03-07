import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RigidBody } from '@react-three/rapier'
import { Quaternion, Euler } from 'three'
import { COLORS } from '../../config/level'

const _quat = new Quaternion()
const _euler = new Euler()

export default function WobblyBridge() {
  const bridgeRef = useRef()

  useFrame((state) => {
    if (!bridgeRef.current) return
    const tilt = Math.sin(state.clock.elapsedTime * 1.2) * 0.08
    _euler.set(tilt, 0, 0)
    _quat.setFromEuler(_euler)
    bridgeRef.current.setNextKinematicRotation(_quat)
  })

  return (
    <RigidBody
      ref={bridgeRef}
      type="kinematicPosition"
      position={[0, 0, 14]}
      colliders="cuboid"
    >
      <mesh castShadow receiveShadow>
        <boxGeometry args={[3, 0.3, 10]} />
        <meshStandardMaterial color={COLORS.meadowAccent} roughness={0.65} metalness={0.05} />
      </mesh>
      <mesh position={[-1.4, 0.35, 0]} castShadow>
        <boxGeometry args={[0.1, 0.4, 10]} />
        <meshStandardMaterial color={COLORS.meadowLight} roughness={0.65} metalness={0.05} />
      </mesh>
      <mesh position={[1.4, 0.35, 0]} castShadow>
        <boxGeometry args={[0.1, 0.4, 10]} />
        <meshStandardMaterial color={COLORS.meadowLight} roughness={0.65} metalness={0.05} />
      </mesh>
    </RigidBody>
  )
}
