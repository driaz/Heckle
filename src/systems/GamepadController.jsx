import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'

const DEADZONE = 0.15

const applyDeadzone = (value, threshold = DEADZONE) =>
  Math.abs(value) < threshold ? 0 : value

// Axis directions → key codes
const AXIS_MAP = [
  { axis: 0, dir: -1, code: 'KeyA' },   // left stick left → A
  { axis: 0, dir: 1, code: 'KeyD' },    // left stick right → D
  { axis: 1, dir: -1, code: 'KeyW' },   // left stick up → W
  { axis: 1, dir: 1, code: 'KeyS' },    // left stick down → S
]

// Button indices → key codes (standard mapping)
const BUTTON_MAP = [
  { index: 0, code: 'Space' },      // Cross (X) → jump
  { index: 4, code: 'ShiftLeft' },  // L1 → sprint
]

function dispatch(type, code) {
  document.dispatchEvent(new KeyboardEvent(type, { code, bubbles: true }))
}

export default function GamepadController() {
  const axisState = useRef({})   // 'KeyW' → true/false
  const buttonState = useRef({}) // 'Space' → true/false

  // Log connection / disconnection
  useEffect(() => {
    const onConnect = (e) =>
      console.log(`Gamepad connected: ${e.gamepad.id}`)
    const onDisconnect = (e) =>
      console.log(`Gamepad disconnected: ${e.gamepad.id}`)

    window.addEventListener('gamepadconnected', onConnect)
    window.addEventListener('gamepaddisconnected', onDisconnect)
    return () => {
      window.removeEventListener('gamepadconnected', onConnect)
      window.removeEventListener('gamepaddisconnected', onDisconnect)
    }
  }, [])

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
    for (const { axis, dir, code } of AXIS_MAP) {
      const raw = applyDeadzone(gp.axes[axis])
      const active = dir < 0 ? raw < -DEADZONE : raw > DEADZONE
      const prev = !!axisState.current[code]

      if (active && !prev) {
        dispatch('keydown', code)
        axisState.current[code] = true
      } else if (!active && prev) {
        dispatch('keyup', code)
        axisState.current[code] = false
      }
    }

    // --- Buttons ---
    for (const { index, code } of BUTTON_MAP) {
      const active = gp.buttons[index].pressed
      const prev = !!buttonState.current[code]

      if (active && !prev) {
        dispatch('keydown', code)
        buttonState.current[code] = true
      } else if (!active && prev) {
        dispatch('keyup', code)
        buttonState.current[code] = false
      }
    }
  })

  return null
}
