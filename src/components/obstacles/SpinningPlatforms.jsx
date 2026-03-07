import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RigidBody } from '@react-three/rapier'
import { Quaternion, Euler } from 'three'
import { COLORS } from '../../config/level'

const PADS = [
  { position: [0, 0.2, 33], radius: 2.0, height: 0.4, speed: 0.8, color: COLORS.meadowLight },
  { position: [-1.5, 0.4, 36.5], radius: 1.5, height: 0.4, speed: -1.2, color: COLORS.meadowPlatform },
  { position: [1, 0.3, 39.5], radius: 1.8, height: 0.4, speed: 1.0, color: COLORS.meadowLight },
]

function SpinningPad({ position, radius, height, speed, color }) {
  const bodyRef = useRef()
  const angleRef = useRef(0)
  const quat = useRef(new Quaternion())
  const euler = useRef(new Euler())

  useFrame((_, delta) => {
    if (!bodyRef.current) return
    angleRef.current += speed * delta
    euler.current.set(0, angleRef.current, 0)
    quat.current.setFromEuler(euler.current)
    bodyRef.current.setNextKinematicRotation(quat.current)
  })

  return (
    <RigidBody ref={bodyRef} type="kinematicPosition" position={position} colliders="hull">
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[radius, radius, height, 16]} />
        <meshStandardMaterial color={color} roughness={0.65} metalness={0.05} />
      </mesh>
    </RigidBody>
  )
}

export default function SpinningPlatforms() {
  return (
    <>
      {PADS.map((pad, i) => (
        <SpinningPad key={i} {...pad} />
      ))}
    </>
  )
}
