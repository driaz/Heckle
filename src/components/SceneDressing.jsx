import { DoubleSide } from 'three'
import { COLORS } from '../config/level'

/* ── Reusable pieces ───────────────────────────────────────────── */

function SectionGate({ position, pillarColor, beamColor }) {
  return (
    <group position={position}>
      {/* Left pillar */}
      <mesh position={[-3.5, 1.5, 0]} castShadow>
        <boxGeometry args={[0.5, 3, 0.5]} />
        <meshStandardMaterial color={pillarColor} roughness={0.65} metalness={0.05} />
      </mesh>
      {/* Right pillar */}
      <mesh position={[3.5, 1.5, 0]} castShadow>
        <boxGeometry args={[0.5, 3, 0.5]} />
        <meshStandardMaterial color={pillarColor} roughness={0.65} metalness={0.05} />
      </mesh>
      {/* Top beam */}
      <mesh position={[0, 3.2, 0]} castShadow>
        <boxGeometry args={[7.5, 0.4, 0.5]} />
        <meshStandardMaterial color={beamColor} roughness={0.65} metalness={0.05} />
      </mesh>
      {/* Decorative spheres on top of pillars */}
      <mesh position={[-3.5, 3.2, 0]}>
        <sphereGeometry args={[0.3, 8, 8]} />
        <meshStandardMaterial
          color={beamColor}
          emissive={beamColor}
          emissiveIntensity={0.3}
          roughness={0.65}
          metalness={0.05}
        />
      </mesh>
      <mesh position={[3.5, 3.2, 0]}>
        <sphereGeometry args={[0.3, 8, 8]} />
        <meshStandardMaterial
          color={beamColor}
          emissive={beamColor}
          emissiveIntensity={0.3}
          roughness={0.65}
          metalness={0.05}
        />
      </mesh>
    </group>
  )
}

function FlagPost({ position, flagColor, height = 2.5 }) {
  return (
    <group position={position}>
      {/* Post */}
      <mesh castShadow>
        <cylinderGeometry args={[0.05, 0.07, height, 6]} />
        <meshStandardMaterial color="#8B7355" roughness={0.65} metalness={0.05} />
      </mesh>
      {/* Rectangular pennant */}
      <mesh position={[0.3, height * 0.35, 0]} rotation={[0, 0, 0.15]}>
        <planeGeometry args={[0.6, 0.35]} />
        <meshStandardMaterial
          color={flagColor}
          side={DoubleSide}
          roughness={0.65}
          metalness={0.05}
        />
      </mesh>
    </group>
  )
}

function Bush({ position, scale = 1 }) {
  return (
    <group position={position}>
      <mesh castShadow>
        <sphereGeometry args={[0.35 * scale, 7, 6]} />
        <meshStandardMaterial color="#4a7a48" roughness={0.65} metalness={0.05} />
      </mesh>
      <mesh
        position={[0.2 * scale, 0.15 * scale, 0.1 * scale]}
        castShadow
      >
        <sphereGeometry args={[0.25 * scale, 6, 5]} />
        <meshStandardMaterial color="#5a8c5a" roughness={0.65} metalness={0.05} />
      </mesh>
    </group>
  )
}

function Rock({ position, scale = 1, rotation = [0.3, 0.5, 0.1] }) {
  return (
    <mesh position={position} rotation={rotation} castShadow>
      <dodecahedronGeometry args={[0.3 * scale, 0]} />
      <meshStandardMaterial color="#8a8078" roughness={0.65} metalness={0.05} />
    </mesh>
  )
}

/* ── Main component ────────────────────────────────────────────── */

export default function SceneDressing() {
  return (
    <>
      {/* ─── Section gates / archways ─── */}

      {/* Crystal Gauntlet entrance */}
      <SectionGate
        position={[0, 0.5, 43.5]}
        pillarColor={COLORS.crystalGround}
        beamColor={COLORS.crystalAccent}
      />
      {/* Lava Peaks entrance */}
      <SectionGate
        position={[0, 0.8, 87.5]}
        pillarColor={COLORS.lavaGround}
        beamColor={COLORS.lavaAccent}
      />

      {/* ─── Flag posts ─── */}

      {/* Start area */}
      <FlagPost position={[-3.5, 0, 1]} flagColor={COLORS.meadowAccent} />
      <FlagPost position={[3.5, 0, 1]} flagColor={COLORS.meadowAccent} />
      <FlagPost position={[-3.5, 0, -2]} flagColor={COLORS.meadowPlatform} />
      <FlagPost position={[3.5, 0, -2]} flagColor={COLORS.meadowPlatform} />

      {/* Crystal section */}
      <FlagPost position={[-2.5, 0.5, 44]} flagColor={COLORS.crystalLight} height={2} />
      <FlagPost position={[2.5, 0.5, 44]} flagColor={COLORS.crystalLight} height={2} />

      {/* Lava section */}
      <FlagPost position={[-2.5, 0.8, 88]} flagColor={COLORS.lavaAccent} height={2} />
      <FlagPost position={[2.5, 0.8, 88]} flagColor={COLORS.lavaAccent} height={2} />

      {/* Goal approach */}
      <FlagPost position={[-2, 1.5, 127]} flagColor={COLORS.goalGold} height={3} />
      <FlagPost position={[2, 1.5, 127]} flagColor={COLORS.goalGold} height={3} />

      {/* ─── Bushes (meadow section scatter) ─── */}
      <Bush position={[-3, -0.2, 3]} />
      <Bush position={[3.5, -0.2, -1]} scale={0.8} />
      <Bush position={[-2, -0.2, -3]} scale={1.2} />
      <Bush position={[4, -0.1, 5]} scale={0.7} />
      <Bush position={[-3.5, -0.2, 22]} scale={0.9} />

      {/* ─── Rocks (lava section scatter) ─── */}
      <Rock position={[-3.5, 0.8, 88]} scale={1.2} />
      <Rock position={[3, 0.8, 91]} scale={0.8} rotation={[0.5, 0.2, 0.3]} />
      <Rock position={[-3, 1.0, 102]} scale={1.0} />
      <Rock position={[3.5, 1.2, 108]} scale={0.9} rotation={[0.1, 0.8, 0.2]} />
      <Rock position={[-3, 1.3, 114]} scale={1.1} rotation={[0.4, 0.1, 0.6]} />
    </>
  )
}
