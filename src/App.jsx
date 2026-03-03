import { Suspense, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { KeyboardControls } from '@react-three/drei'
import { Physics } from '@react-three/rapier'
import Ecctrl from 'ecctrl'
import { keyboardMap } from './config/controls'
import { playerPosition } from './lib/playerPosition'
import IsometricCamera from './components/IsometricCamera'
import Atmosphere from './components/Atmosphere'
import Platforms from './components/Platforms'

function Player() {
  const ecctrlRef = useRef()

  useFrame(() => {
    if (ecctrlRef.current) {
      const pos = ecctrlRef.current.group.translation()
      playerPosition.set(pos.x, pos.y, pos.z)
    }
  })

  return (
    <Ecctrl
      ref={ecctrlRef}
      capsuleHalfHeight={0.35}
      capsuleRadius={0.3}
      floatHeight={0.1}
      maxVelLimit={5}
      jumpVel={4}
      sprintMult={1.6}
      position={[0, 2, 0]}
      camInitDir={{ x: 0, y: -3 * Math.PI / 4 }}
      disableFollowCam
      disableFollowCamPos={{ x: 15, y: 15, z: 15 }}
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
        camera={{ position: [15, 15, 15], fov: 35 }}
      >
        <Suspense fallback={null}>
          <Physics gravity={[0, -9.81, 0]}>
            <Platforms />
            <Player />
            <IsometricCamera />
            <Atmosphere />
          </Physics>
        </Suspense>
      </Canvas>
    </KeyboardControls>
  )
}

export default App
