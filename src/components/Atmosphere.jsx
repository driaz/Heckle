import { Sky, Cloud } from '@react-three/drei'

export default function Atmosphere() {
  return (
    <>
      <Sky sunPosition={[100, 20, 100]} />
      <Cloud opacity={0.4} speed={0.3} width={20} depth={3} segments={20} position={[0, 20, 30]} />
      <Cloud opacity={0.3} speed={0.2} width={15} depth={2} segments={15} position={[-15, 18, 80]} />
      <Cloud opacity={0.35} speed={0.25} width={18} depth={2.5} segments={18} position={[10, 22, 120]} />

      {/* Light fog — near-white, pushed far so nothing looks muddy */}
      <fog attach="fog" args={['#e8f4ff', 60, 200]} />

      {/* Bright ambient — nothing goes dark */}
      <ambientLight intensity={0.8} color="#ffffff" />

      {/* Slightly warm directional sun, soft shadows */}
      <directionalLight
        castShadow
        position={[10, 20, 8]}
        intensity={1.0}
        color="#fff5e6"
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={200}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={140}
        shadow-camera-bottom={-10}
        shadow-bias={-0.0005}
      />

      {/* Hemisphere fill — white from below, not green */}
      <hemisphereLight args={['#87ceeb', '#ffffff', 0.5]} />
    </>
  )
}
