import { Sky, Cloud } from '@react-three/drei'

export default function Atmosphere() {
  return (
    <>
      {/* Vivid cyan-blue sky — Fall Guys cheerful, not overcast */}
      <Sky
        sunPosition={[100, 40, 100]}
        rayleigh={0.5}
        turbidity={2}
        mieCoefficient={0.005}
        mieDirectionalG={0.8}
      />
      <Cloud color="#FFFFFF" opacity={0.6} speed={0.3} width={20} depth={1.5} segments={12} position={[0, 22, 30]} />
      <Cloud color="#FFFFFF" opacity={0.55} speed={0.2} width={15} depth={1.5} segments={10} position={[-15, 20, 80]} />
      <Cloud color="#FFFFFF" opacity={0.6} speed={0.25} width={18} depth={1.5} segments={12} position={[10, 24, 120]} />

      {/* Fog — bright blue tint, matching the sky */}
      <fog attach="fog" args={['#c0e8ff', 80, 220]} />

      {/* Bright ambient — nothing goes dark */}
      <ambientLight intensity={0.85} color="#ffffff" />

      {/* Warm directional sun, soft shadows */}
      <directionalLight
        castShadow
        position={[10, 30, 8]}
        intensity={1.1}
        color="#fff8ee"
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={200}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={140}
        shadow-camera-bottom={-10}
        shadow-bias={-0.0005}
      />

      {/* Hemisphere fill — bright sky blue from above, white from below */}
      <hemisphereLight args={['#88d0f0', '#ffffff', 0.6]} />

      {/* Ground plane far below the course — bright green distant grass */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -20, 65]} receiveShadow>
        <planeGeometry args={[400, 400]} />
        <meshStandardMaterial color="#50E850" roughness={0.9} metalness={0} />
      </mesh>
    </>
  )
}
