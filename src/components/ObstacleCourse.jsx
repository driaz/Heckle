import { RigidBody } from '@react-three/rapier'
import { PLATFORMS } from '../config/level'
import WobblyBridge from './obstacles/WobblyBridge'
import BouncyPads from './obstacles/BouncyPads'
import SpinningPlatforms from './obstacles/SpinningPlatforms'
import VanishingSteps from './obstacles/VanishingSteps'
import MovingPushers from './obstacles/MovingPushers'
import SwingingPendulums from './obstacles/SwingingPendulums'
import ConveyorPlatforms from './obstacles/ConveyorPlatforms'
import RisingPillars from './obstacles/RisingPillars'
import Enemies from './Enemies'
import GoalArea from './GoalArea'

function StaticPlatforms() {
  return (
    <>
      {PLATFORMS.map((p, i) => (
        <RigidBody key={i} type="fixed" position={p.pos} colliders="cuboid">
          <mesh castShadow receiveShadow>
            <boxGeometry args={p.size} />
            <meshStandardMaterial color={p.color} roughness={0.65} metalness={0.05} />
          </mesh>
        </RigidBody>
      ))}
    </>
  )
}

export default function ObstacleCourse() {
  return (
    <>
      {/* Static ground plates and transition pads */}
      <StaticPlatforms />

      {/* Section 1: Green Meadows */}
      <WobblyBridge />
      <BouncyPads />
      <SpinningPlatforms />

      {/* Section 2: Crystal Gauntlet */}
      <VanishingSteps />
      <MovingPushers />
      <SwingingPendulums />

      {/* Section 3: Lava Peaks */}
      <ConveyorPlatforms />
      <RisingPillars />
      <Enemies />

      {/* Goal */}
      <GoalArea />
    </>
  )
}
