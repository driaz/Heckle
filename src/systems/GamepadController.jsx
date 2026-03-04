import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useJoystickControls } from 'ecctrl'

const DEADZONE = 0.15

/**
 * Resets all gamepad-driven input in ecctrl's joystick store.
 * Safe to call from anywhere — uses zustand's static setState.
 */
const resetInput = () =>
  useJoystickControls.setState({
    curJoystickDis: 0,
    curJoystickAng: 0,
    curRunState: false,
    curButton1Pressed: false,
  })

export default function GamepadController() {
  // Grab stable references to store actions (won't cause re-renders)
  const setJoystick = useJoystickControls((s) => s.setJoystick)
  const resetJoystick = useJoystickControls((s) => s.resetJoystick)
  const pressButton1 = useJoystickControls((s) => s.pressButton1)

  const jumpWasPressed = useRef(false)
  const hadGamepad = useRef(false)

  useEffect(() => {
    // stopImmediatePropagation prevents ecctrl's built-in gamepad handler
    // from activating. Ecctrl's handler has NO deadzone (triggers on any
    // non-zero axis value), which causes drift from physical stick noise.
    // Our handler registered first (earlier in the component tree) takes
    // full control with proper deadzone filtering.
    const onConnect = (e) => {
      e.stopImmediatePropagation()
      console.log(`Gamepad connected: ${e.gamepad.id}`)
    }
    const onDisconnect = (e) => {
      e.stopImmediatePropagation()
      console.log(`Gamepad disconnected: ${e.gamepad.id}`)
      resetInput()
      hadGamepad.current = false
      jumpWasPressed.current = false
    }

    window.addEventListener('gamepadconnected', onConnect)
    window.addEventListener('gamepaddisconnected', onDisconnect)
    return () => {
      window.removeEventListener('gamepadconnected', onConnect)
      window.removeEventListener('gamepaddisconnected', onDisconnect)
      resetInput()
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

    if (!gp) {
      // Gamepad disappeared without disconnect event — clean up
      if (hadGamepad.current) {
        resetInput()
        hadGamepad.current = false
        jumpWasPressed.current = false
      }
      return
    }
    hadGamepad.current = true

    // --- Left stick → ecctrl joystick store ---
    // Apply deadzone per-axis first, then compute polar coordinates
    const rawX = gp.axes[0]
    const rawY = gp.axes[1]
    const x = Math.abs(rawX) < DEADZONE ? 0 : rawX
    const y = Math.abs(rawY) < DEADZONE ? 0 : -rawY // invert Y: gamepad down=+1, ecctrl expects up=+1

    if (Math.abs(x) > 0 || Math.abs(y) > 0) {
      // Stick is outside deadzone — compute distance and angle
      const dist = Math.min(Math.sqrt(x * x + y * y), 1)
      let angle = Math.atan2(y, x)
      if (angle < 0) angle += 2 * Math.PI
      const isRunning = gp.buttons[4]?.pressed || false // L1 = sprint
      setJoystick(dist, angle, isRunning)
    } else {
      // Stick is at rest — always reset
      resetJoystick()
    }

    // --- Jump: Cross (button 0) → button1 (completely independent of stick) ---
    const jumpPressed = gp.buttons[0]?.pressed || false
    if (jumpPressed && !jumpWasPressed.current) {
      pressButton1()
    } else if (!jumpPressed && jumpWasPressed.current) {
      // No individual releaseButton1() in the store — use setState directly
      useJoystickControls.setState({ curButton1Pressed: false })
    }
    jumpWasPressed.current = jumpPressed
  })

  return null
}
