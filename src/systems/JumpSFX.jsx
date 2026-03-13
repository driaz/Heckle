import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGame } from 'ecctrl'
import SFX from './SFX'

export default function JumpSFX() {
  const prevAnim = useRef(null)

  useFrame(() => {
    const curAnim = useGame.getState().curAnimation
    if (curAnim === 'Jump_Start' && prevAnim.current !== 'Jump_Start') {
      SFX.playJump()
    }
    prevAnim.current = curAnim
  })

  return null
}
