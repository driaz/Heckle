import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RigidBody } from '@react-three/rapier'
import { COLORS } from '../../config/level'

const PILLARS = [
  { x: -1.5, z: 103, phase: 0 },
  { x: 1.5, z: 103, phase: 1.5 },
  { x: -1.5, z: 106, phase: 1.0 },
  { x: 1.5, z: 106, phase: 2.5 },
  { x: -1.5, z: 109, phase: 0.5 },
  { x: 1.5, z: 109, phase: 2.0 },
]

const CYCLE = 3.0
const UP_Y = 1.5
const DOWN_Y = -1.5
const RADIUS = 1.2
const HEIGHT = 0.5

function RisingPillar({ x, z, phase }) {
  const bodyRef = useRef()

  useFrame((state) => {
    if (!bodyRef.current) return

    const t = (state.clock.elapsedTime + phase) % CYCLE
    const normalized = t / CYCLE

    // Piecewise motion: 0-0.5 up, 0.5-0.83 stay up, 0.83-1.0 down (stay down briefly)
    let y
    if (normalized < 0.17) {
      // Rising (0 to 0.17)
      const progress = normalized / 0.17
      const smooth = progress * progress * (3 - 2 * progress) // smoothstep
      y = DOWN_Y + (UP_Y - DOWN_Y) * smooth
    } else if (normalized < 0.67) {
      // Staying up (0.17 to 0.67)
      y = UP_Y
    } else if (normalized < 0.83) {
      // Falling (0.67 to 0.83)
      const progress = (normalized - 0.67) / 0.16
      const smooth = progress * progress * (3 - 2 * progress)
      y = UP_Y - (UP_Y - DOWN_Y) * smooth
    } else {
      // Staying down (0.83 to 1.0)
      y = DOWN_Y
    }

    bodyRef.current.setNextKinematicTranslation({ x, y, z })
  })

  return (
    <RigidBody ref={bodyRef} type="kinematicPosition" position={[x, DOWN_Y, z]} colliders="hull">
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[RADIUS, RADIUS, HEIGHT, 16]} />
        <meshStandardMaterial color={COLORS.lavaPlatform} roughness={0.65} metalness={0.05} />
      </mesh>
    </RigidBody>
  )
}

export default function RisingPillars() {
  return (
    <>
      {PILLARS.map((pillar, i) => (
        <RisingPillar key={i} {...pillar} />
      ))}
    </>
  )
}
