import { Sky, Cloud } from '@react-three/drei'

export default function Atmosphere() {
  return (
    <>
      <Sky sunPosition={[100, 20, 100]} />
      <Cloud opacity={0.4} speed={0.3} width={20} depth={3} segments={20} position={[0, 15, -10]} />
      <Cloud opacity={0.3} speed={0.2} width={15} depth={2} segments={15} position={[-15, 12, 5]} />
      <fog attach="fog" args={['#c8e8ff', 30, 100]} />
      <ambientLight intensity={0.5} color="#ffeedd" />
      <directionalLight
        castShadow
        position={[10, 15, 8]}
        intensity={1.2}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />
      <hemisphereLight args={['#87ceeb', '#5b8c5a', 0.3]} />
    </>
  )
}
