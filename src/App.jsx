import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { KeyboardControls } from '@react-three/drei'
import { Physics, RigidBody } from '@react-three/rapier'
import Ecctrl from 'ecctrl'
import { keyboardMap } from './config/controls'

function Ground() {
  return (
    <RigidBody type="fixed">
      <mesh position={[0, -0.5, 0]} receiveShadow>
        <boxGeometry args={[8, 1, 8]} />
        <meshToonMaterial color="#5b8c5a" />
      </mesh>
    </RigidBody>
  )
}

function Player() {
  return (
    <Ecctrl
      capsuleHalfHeight={0.35}
      capsuleRadius={0.3}
      floatHeight={0.1}
      maxVelLimit={5}
      jumpVel={4}
      sprintMult={1.6}
      position={[0, 2, 0]}
      disableFollowCam
      disableFollowCamPos={{ x: 10, y: 10, z: 10 }}
      disableFollowCamTarget={{ x: 0, y: 0, z: 0 }}
    >
      {/* Placeholder character — capsule with eyes */}
      <group>
        <mesh castShadow position={[0, 0.3, 0]}>
          <capsuleGeometry args={[0.3, 0.5, 8, 16]} />
          <meshToonMaterial color="#e07050" />
        </mesh>
        {/* Eyes */}
        <mesh position={[0.12, 0.55, 0.25]}>
          <sphereGeometry args={[0.06]} />
          <meshBasicMaterial color="white" />
        </mesh>
        <mesh position={[-0.12, 0.55, 0.25]}>
          <sphereGeometry args={[0.06]} />
          <meshBasicMaterial color="white" />
        </mesh>
        {/* Pupils */}
        <mesh position={[0.12, 0.55, 0.3]}>
          <sphereGeometry args={[0.03]} />
          <meshBasicMaterial color="#222" />
        </mesh>
        <mesh position={[-0.12, 0.55, 0.3]}>
          <sphereGeometry args={[0.03]} />
          <meshBasicMaterial color="#222" />
        </mesh>
      </group>
    </Ecctrl>
  )
}

function App() {
  return (
    <KeyboardControls map={keyboardMap}>
      <Canvas
        shadows
        camera={{ position: [10, 10, 10], fov: 35 }}
      >
        <Suspense fallback={null}>
          <Physics gravity={[0, -9.81, 0]}>
            <Ground />
            <Player />
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 15, 8]} intensity={1.2} castShadow />
          </Physics>
        </Suspense>
      </Canvas>
    </KeyboardControls>
  )
}

export default App
