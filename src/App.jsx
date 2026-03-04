import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { KeyboardControls } from '@react-three/drei'
import { Physics } from '@react-three/rapier'
import Ecctrl, { EcctrlAnimation } from 'ecctrl'
import { keyboardMap } from './config/controls'
import { ecctrlRef } from './lib/ecctrlRef'
import Atmosphere from './components/Atmosphere'
import Platforms from './components/Platforms'
import Stars from './components/Stars'
import FallDetector from './components/FallDetector'
import CharacterModel from './components/CharacterModel'
import HUD from './components/HUD'
import GamepadController from './systems/GamepadController'

const animationSet = {
  idle: 'Idle',
  walk: 'Walk',
  run: 'Run',
  jump: 'Jump_Start',
  jumpIdle: 'Jump_Idle',
  jumpLand: 'Jump_Land',
  fall: 'Fall',
}

const characterURL = '/models/character.glb'

function Player() {
  return (
    <Ecctrl
      ref={ecctrlRef}
      animated
      capsuleHalfHeight={0.35}
      capsuleRadius={0.3}
      floatHeight={0.1}
      maxVelLimit={5}
      jumpVel={4}
      sprintMult={1.6}
      position={[0, 2, 0]}
      camInitDis={-12}
      camMinDis={-15}
      camMaxDis={-8}
      camInitDir={{ x: 0.3, y: 0 }}
    >
      <EcctrlAnimation animationSet={animationSet} characterURL={characterURL}>
        <CharacterModel position={[0, -0.75, 0]} />
      </EcctrlAnimation>
    </Ecctrl>
  )
}

function App() {
  return (
    <KeyboardControls map={keyboardMap}>
      <Canvas shadows camera={{ fov: 45 }}>
        <Suspense fallback={null}>
          <GamepadController />
          <Physics gravity={[0, -9.81, 0]} timeStep={1 / 60} interpolate>
            <Platforms />
            <Player />
            <Stars />
            <FallDetector />
            <Atmosphere />
          </Physics>
        </Suspense>
      </Canvas>
      <HUD />
    </KeyboardControls>
  )
}

export default App
