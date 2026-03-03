import { RigidBody } from '@react-three/rapier'
import { PLATFORMS } from '../config/level'

export default function Platforms() {
  return (
    <>
      {PLATFORMS.map((p, i) => (
        <RigidBody key={i} type="fixed" position={p.pos} colliders="cuboid">
          <mesh castShadow receiveShadow>
            <boxGeometry args={p.size} />
            <meshToonMaterial color={p.color} />
          </mesh>
        </RigidBody>
      ))}
    </>
  )
}
