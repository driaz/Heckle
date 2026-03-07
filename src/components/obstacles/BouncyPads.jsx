import { RigidBody, CuboidCollider } from '@react-three/rapier'
import { COLORS } from '../../config/level'
import { ecctrlRef } from '../../lib/ecctrlRef'

const PADS = [
  { position: [0, -0.1, 24], size: [2.5, 0.2, 2.5] },
  { position: [-1, 0.3, 27], size: [2.5, 0.2, 2.5] },
  { position: [1, 0.7, 30], size: [2.5, 0.2, 2.5] },
]

function BouncePad({ position, size }) {
  const handleBounce = () => {
    if (!ecctrlRef.current?.group) return
    const vel = ecctrlRef.current.group.linvel()
    if (vel.y < -0.5) {
      ecctrlRef.current.group.setLinvel({ x: vel.x, y: 8, z: vel.z }, true)
    }
  }

  return (
    <RigidBody type="fixed" position={position} colliders="cuboid">
      <mesh castShadow receiveShadow>
        <boxGeometry args={size} />
        <meshStandardMaterial color={COLORS.bouncy} roughness={0.65} metalness={0.05} />
      </mesh>
      <CuboidCollider
        args={[1.2, 0.3, 1.2]}
        position={[0, 0.3, 0]}
        sensor
        onIntersectionEnter={handleBounce}
      />
    </RigidBody>
  )
}

export default function BouncyPads() {
  return (
    <>
      {PADS.map((pad, i) => (
        <BouncePad key={i} position={pad.position} size={pad.size} />
      ))}
    </>
  )
}
