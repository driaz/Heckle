import { Sky } from '@react-three/drei'

/* ── Cartoon cloud — overlapping white spheres, always pure white ── */
function CartoonCloud({ position, scale = 1 }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[2, 12, 12]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      <mesh position={[1.8, 0.3, 0.2]}>
        <sphereGeometry args={[1.6, 12, 12]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      <mesh position={[-1.6, 0.2, -0.3]}>
        <sphereGeometry args={[1.7, 12, 12]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0.5, 0.6, 0.1]}>
        <sphereGeometry args={[1.4, 12, 12]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
    </group>
  )
}

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

      {/* Cartoon clouds — meshBasicMaterial so they're always pure white */}
      <CartoonCloud position={[12, 22, 20]} scale={1.2} />
      <CartoonCloud position={[-18, 20, 50]} scale={1.0} />
      <CartoonCloud position={[15, 24, 85]} scale={0.9} />
      <CartoonCloud position={[-12, 21, 115]} scale={1.1} />
      <CartoonCloud position={[8, 25, 140]} scale={0.8} />

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
