import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { RigidBody, CuboidCollider } from '@react-three/rapier'
import { COLORS, CHECKPOINTS } from '../config/level'
import { ecctrlRef } from '../lib/ecctrlRef'
import useGameStore from '../stores/gameStore'

const SLIME_CONFIGS = [
  { id: 'slime-1', startPos: [0, 1.85, 114.5], axis: 'z', min: 113, max: 116, speed: 1.5 },
  { id: 'slime-2', startPos: [3, 1.85, 118], axis: 'x', min: 1.5, max: 4.5, speed: 2.0 },
  { id: 'slime-3', startPos: [0, 1.85, 121.5], axis: 'z', min: 120, max: 123, speed: 2.5 },
]

const PATH_SEGMENTS = [
  { pos: [0, 1.5, 114.5], size: [3, 0.3, 4], color: COLORS.lavaGround },
  { pos: [3, 1.5, 118], size: [3, 0.3, 4], color: COLORS.lavaPlatform },
  { pos: [0, 1.5, 121.5], size: [3, 0.3, 4], color: COLORS.lavaGround },
  // Connecting bridges (raised slightly to avoid z-fighting with main segments)
  { pos: [1.5, 1.55, 116.25], size: [3, 0.3, 1.5], color: COLORS.lavaPlatform },
  { pos: [1.5, 1.55, 119.75], size: [3, 0.3, 1.5], color: COLORS.lavaPlatform },
]

function getCheckpointSpawn(playerZ) {
  const sorted = [...CHECKPOINTS].sort((a, b) => b.z - a.z)
  const cp = sorted.find((c) => playerZ >= c.z - 5) || CHECKPOINTS[0]
  return cp.spawn
}

function Slime({ config }) {
  const bodyRef = useRef()
  const [alive, setAlive] = useState(true)
  const dirRef = useRef(1)
  const posRef = useRef([...config.startPos])

  const axisIdx = config.axis === 'x' ? 0 : 2

  useFrame((_, delta) => {
    if (!alive || !bodyRef.current) return

    posRef.current[axisIdx] += config.speed * delta * dirRef.current

    if (posRef.current[axisIdx] > config.max) {
      posRef.current[axisIdx] = config.max
      dirRef.current = -1
    } else if (posRef.current[axisIdx] < config.min) {
      posRef.current[axisIdx] = config.min
      dirRef.current = 1
    }

    bodyRef.current.setNextKinematicTranslation({
      x: posRef.current[0],
      y: posRef.current[1],
      z: posRef.current[2],
    })
  })

  const handleContact = () => {
    if (!alive) return
    const player = ecctrlRef.current?.group
    if (!player || !bodyRef.current) return

    const playerPos = player.translation()
    const playerVel = player.linvel()
    const enemyPos = bodyRef.current.translation()

    const playerBottom = playerPos.y - 0.65
    const enemyTop = enemyPos.y + 0.2

    if (playerBottom > enemyTop - 0.1 && playerVel.y < -1) {
      // Stomp kill
      setAlive(false)
      useGameStore.getState().recordEnemyKill('Slime')
      player.setLinvel({ x: playerVel.x, y: 5, z: playerVel.z }, true)
    } else {
      // Side contact — player dies
      const store = useGameStore.getState()
      store.recordHazardDeath('Slime', playerPos)
      store.recordRespawn()
      const spawn = getCheckpointSpawn(playerPos.z)
      player.setTranslation({ x: spawn[0], y: spawn[1], z: spawn[2] }, true)
      player.setLinvel({ x: 0, y: 0, z: 0 }, true)
      player.setAngvel({ x: 0, y: 0, z: 0 }, true)
    }
  }

  if (!alive) return null

  return (
    <RigidBody
      ref={bodyRef}
      type="kinematicPosition"
      position={config.startPos}
      colliders={false}
    >
      <CuboidCollider args={[0.35, 0.2, 0.35]} sensor onIntersectionEnter={handleContact} />
      {/* Body (squashed sphere) */}
      <group scale={[1, 0.6, 1]}>
        <mesh castShadow>
          <sphereGeometry args={[0.4, 10, 10]} />
          <meshStandardMaterial color={COLORS.enemy} roughness={0.65} metalness={0.05} />
        </mesh>
      </group>
      {/* Eyes */}
      <mesh position={[0.12, 0.15, 0.3]}>
        <sphereGeometry args={[0.08, 6, 6]} />
        <meshBasicMaterial color="white" />
      </mesh>
      <mesh position={[-0.12, 0.15, 0.3]}>
        <sphereGeometry args={[0.08, 6, 6]} />
        <meshBasicMaterial color="white" />
      </mesh>
      {/* Pupils */}
      <mesh position={[0.12, 0.15, 0.37]}>
        <sphereGeometry args={[0.04, 4, 4]} />
        <meshBasicMaterial color="black" />
      </mesh>
      <mesh position={[-0.12, 0.15, 0.37]}>
        <sphereGeometry args={[0.04, 4, 4]} />
        <meshBasicMaterial color="black" />
      </mesh>
    </RigidBody>
  )
}

export default function Enemies() {
  return (
    <>
      {/* Path segments */}
      {PATH_SEGMENTS.map((seg, i) => (
        <RigidBody key={`seg-${i}`} type="fixed" position={seg.pos} colliders="cuboid">
          <mesh castShadow receiveShadow>
            <boxGeometry args={seg.size} />
            <meshStandardMaterial color={seg.color} roughness={0.65} metalness={0.05} />
          </mesh>
        </RigidBody>
      ))}

      {/* Slime enemies */}
      {SLIME_CONFIGS.map((config) => (
        <Slime key={config.id} config={config} />
      ))}
    </>
  )
}
