import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RigidBody } from '@react-three/rapier'
import { COLORS } from '../../config/level'

const STEPS = [
  { pos: [0, 0.8, 48.5], size: [2.5, 0.4, 2.5], color: COLORS.crystalPlatform, stagger: 0 },
  { pos: [-1, 1.0, 51], size: [2.5, 0.4, 2.5], color: COLORS.crystalLight, stagger: 0.9 },
  { pos: [1, 1.1, 53], size: [2.5, 0.4, 2.5], color: COLORS.crystalPlatform, stagger: 1.8 },
  { pos: [-0.5, 1.0, 55.5], size: [2.5, 0.4, 2.5], color: COLORS.crystalLight, stagger: 2.7 },
  { pos: [0.5, 0.9, 57.5], size: [2.5, 0.4, 2.5], color: COLORS.crystalPlatform, stagger: 3.6 },
]

const CYCLE = 4.5
const VISIBLE_DURATION = 3.0

function VanishingStep({ pos, size, color, stagger }) {
  const bodyRef = useRef()
  const meshRef = useRef()
  const matRef = useRef()

  useFrame((state) => {
    if (!bodyRef.current || !meshRef.current) return

    const phase = (state.clock.elapsedTime + stagger) % CYCLE
    const shouldBeVisible = phase < VISIBLE_DURATION

    meshRef.current.visible = shouldBeVisible
    bodyRef.current.setEnabled(shouldBeVisible)

    if (matRef.current) {
      if (shouldBeVisible && phase > VISIBLE_DURATION - 0.5) {
        matRef.current.transparent = true
        matRef.current.opacity = 0.4 + 0.6 * Math.abs(Math.sin((phase - (VISIBLE_DURATION - 0.5)) * 20))
      } else {
        matRef.current.transparent = false
        matRef.current.opacity = 1
      }
    }
  })

  return (
    <RigidBody ref={bodyRef} type="fixed" position={pos} colliders="cuboid">
      <mesh ref={meshRef} castShadow receiveShadow>
        <boxGeometry args={size} />
        <meshStandardMaterial ref={matRef} color={color} roughness={0.65} metalness={0.05} />
      </mesh>
    </RigidBody>
  )
}

export default function VanishingSteps() {
  return (
    <>
      {STEPS.map((step, i) => (
        <VanishingStep key={i} {...step} />
      ))}
    </>
  )
}
