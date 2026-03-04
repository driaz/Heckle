import { useEffect, useRef, useCallback } from 'react'
import { useFrame } from '@react-three/fiber'

const DEADZONE = 0.15

const applyDeadzone = (value, threshold = DEADZONE) =>
  Math.abs(value) < threshold ? 0 : value

// Button indices → key codes (standard mapping)
const BUTTON_MAP = [
  { index: 0, code: 'Space' },      // Cross (X) → jump
  { index: 4, code: 'ShiftLeft' },  // L1 → sprint
]

export default function GamepadController() {
  const activeKeys = useRef(new Set())

  function pressKey(code) {
    if (!activeKeys.current.has(code)) {
      activeKeys.current.add(code)
      document.dispatchEvent(new KeyboardEvent('keydown', { code, bubbles: true }))
    }
  }

  function releaseKey(code) {
    if (activeKeys.current.has(code)) {
      activeKeys.current.delete(code)
      document.dispatchEvent(new KeyboardEvent('keyup', { code, bubbles: true }))
    }
  }

  const releaseAll = useCallback(() => {
    for (const code of activeKeys.current) {
      document.dispatchEvent(new KeyboardEvent('keyup', { code, bubbles: true }))
    }
    activeKeys.current.clear()
  }, [])

  // Log connection / disconnection; release all keys on disconnect
  useEffect(() => {
    const onConnect = (e) =>
      console.log(`Gamepad connected: ${e.gamepad.id}`)
    const onDisconnect = (e) => {
      console.log(`Gamepad disconnected: ${e.gamepad.id}`)
      releaseAll()
    }

    window.addEventListener('gamepadconnected', onConnect)
    window.addEventListener('gamepaddisconnected', onDisconnect)
    return () => {
      window.removeEventListener('gamepadconnected', onConnect)
      window.removeEventListener('gamepaddisconnected', onDisconnect)
      releaseAll()
    }
  }, [releaseAll])

  useFrame(() => {
    const gamepads = navigator.getGamepads()
    let gp = null
    for (let i = 0; i < gamepads.length; i++) {
      if (gamepads[i] && gamepads[i].mapping === 'standard') {
        gp = gamepads[i]
        break
      }
    }
    if (!gp) return

    // --- Axes (left stick) ---
    const lx = applyDeadzone(gp.axes[0])
    const ly = applyDeadzone(gp.axes[1])

    // Left / right
    if (lx < -DEADZONE) pressKey('KeyA'); else releaseKey('KeyA')
    if (lx > DEADZONE)  pressKey('KeyD'); else releaseKey('KeyD')

    // Forward / back
    if (ly < -DEADZONE) pressKey('KeyW'); else releaseKey('KeyW')
    if (ly > DEADZONE)  pressKey('KeyS'); else releaseKey('KeyS')

    // --- Buttons ---
    for (const { index, code } of BUTTON_MAP) {
      if (gp.buttons[index].pressed) pressKey(code)
      else releaseKey(code)
    }
  })

  return null
}
