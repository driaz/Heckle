import React from 'react'
import { useGraph } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { SkeletonUtils } from 'three-stdlib'

export default function CharacterModel(props) {
  const { scene } = useGLTF('/models/character.glb')
  const clone = React.useMemo(() => SkeletonUtils.clone(scene), [scene])
  const { nodes, materials } = useGraph(clone)

  return (
    <group {...props} dispose={null}>
      <group name="Scene">
        <group name="Armature" rotation={[Math.PI / 2, 0, 0]} scale={0.01}>
          <primitive object={nodes.mixamorigHips} />
          <skinnedMesh castShadow name="Boy01_Hair_Geo" geometry={nodes.Boy01_Hair_Geo.geometry} material={materials.Boy01_Hair_MAT} skeleton={nodes.Boy01_Hair_Geo.skeleton} />
          <skinnedMesh castShadow name="Boy01_Hands_Geo" geometry={nodes.Boy01_Hands_Geo.geometry} material={materials.Boy01_Hands_MAT} skeleton={nodes.Boy01_Hands_Geo.skeleton} />
          <skinnedMesh castShadow name="Boy01_Head_Geo" geometry={nodes.Boy01_Head_Geo.geometry} material={materials.Boy01_Head_MAT} skeleton={nodes.Boy01_Head_Geo.skeleton} />
          <skinnedMesh castShadow name="Boy01_LowerBody_Geo" geometry={nodes.Boy01_LowerBody_Geo.geometry} material={materials.Boy01_LowerBody_MAT} skeleton={nodes.Boy01_LowerBody_Geo.skeleton} />
          <skinnedMesh castShadow name="Boy01_Scarf_Geo" geometry={nodes.Boy01_Scarf_Geo.geometry} material={materials.Boy01_Scarf_MAT} skeleton={nodes.Boy01_Scarf_Geo.skeleton} />
          <skinnedMesh castShadow name="Boy01_Shoes_Geo" geometry={nodes.Boy01_Shoes_Geo.geometry} material={materials.Boy01_Shoes_MAT} skeleton={nodes.Boy01_Shoes_Geo.skeleton} />
          <skinnedMesh castShadow name="Boy01_UpperBody_Geo" geometry={nodes.Boy01_UpperBody_Geo.geometry} material={materials.Boy01_UpperBody_MAT} skeleton={nodes.Boy01_UpperBody_Geo.skeleton} />
        </group>
      </group>
    </group>
  )
}

useGLTF.preload('/models/character.glb')
