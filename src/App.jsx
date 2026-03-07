import { Suspense, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { KeyboardControls, useGLTF } from '@react-three/drei'
import { Physics } from '@react-three/rapier'
import Ecctrl, { EcctrlAnimation } from 'ecctrl'
import { keyboardMap } from './config/controls'
import { ecctrlRef } from './lib/ecctrlRef'
import Atmosphere from './components/Atmosphere'
import ObstacleCourse from './components/ObstacleCourse'
import SceneDressing from './components/SceneDressing'
import Stars from './components/Stars'
import FallDetector from './components/FallDetector'
import CharacterModel from './components/CharacterModel'
import PostProcessing from './components/PostProcessing'
import HUD from './components/HUD'
import GamepadController from './systems/GamepadController'
import AudioManager from './systems/AudioManager'
import IdleDetector from './systems/IdleDetector'
import GameDirectorManager from './systems/GameDirectorManager'

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

/**
 * Strips root-bone position tracks from Mixamo animations.
 * Mixamo bakes world-space translation into the Hips bone, which fights
 * with ecctrl's physics-based positioning and causes visible snap-back.
 * Mutates the cached useGLTF data BEFORE EcctrlAnimation reads it.
 */
function StripRootMotion({ url }) {
  const { animations } = useGLTF(url)
  const stripped = useRef(false)
  if (!stripped.current) {
    animations.forEach((clip) => {
      clip.tracks = clip.tracks.filter(
        (t) => !(t.name.includes('.position') && t.name.includes('Hips'))
      )
    })
    stripped.current = true
  }
  return null
}

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
      <StripRootMotion url={characterURL} />
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
            <ObstacleCourse />
            <Player />
            <Stars />
            <FallDetector />
            <IdleDetector />
            <Atmosphere />
          </Physics>
          <SceneDressing />
          <PostProcessing />
        </Suspense>
      </Canvas>
      <HUD />
      <AudioManager />
      <GameDirectorManager />
    </KeyboardControls>
  )
}

export default App
