import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { Physics, RigidBody } from '@react-three/rapier'

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

function App() {
  return (
    <Canvas
      shadows
      camera={{ position: [10, 10, 10], fov: 35 }}
    >
      <Suspense fallback={null}>
        <Physics gravity={[0, -9.81, 0]}>
          <Ground />
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 15, 8]} intensity={1.2} castShadow />
        </Physics>
      </Suspense>
    </Canvas>
  )
}

export default App
