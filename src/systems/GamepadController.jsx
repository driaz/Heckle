import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useJoystickControls } from 'ecctrl'
import { ecctrlRef } from '../lib/ecctrlRef'

const DEADZONE = 0.15
const CAM_SENSITIVITY = 0.03

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
    const rawLX = gp.axes[0]
    const rawLY = gp.axes[1]
    const lx = Math.abs(rawLX) < DEADZONE ? 0 : rawLX
    const ly = Math.abs(rawLY) < DEADZONE ? 0 : -rawLY // invert Y: gamepad down=+1, ecctrl expects up=+1

    if (Math.abs(lx) > 0 || Math.abs(ly) > 0) {
      // Stick is outside deadzone — compute distance and angle
      const dist = Math.min(Math.sqrt(lx * lx + ly * ly), 1)
      let angle = Math.atan2(ly, lx)
      if (angle < 0) angle += 2 * Math.PI
      const isRunning = gp.buttons[4]?.pressed || false // L1 = sprint
      setJoystick(dist, angle, isRunning)
    } else {
      // Stick is at rest — always reset
      resetJoystick()
    }

    // --- Right stick → camera orbit via ecctrl ref ---
    // rotateCamera(pitchDelta, yawDelta) where:
    //   pitch = followCam.rotation.x (vertical, clamped to cam limits)
    //   yaw   = pivot.rotation.y (horizontal orbit)
    const rawRX = gp.axes[2]
    const rawRY = gp.axes[3]
    const rx = Math.abs(rawRX) < DEADZONE ? 0 : rawRX
    const ry = Math.abs(rawRY) < DEADZONE ? 0 : rawRY

    if ((Math.abs(rx) > 0 || Math.abs(ry) > 0) && ecctrlRef.current) {
      ecctrlRef.current.rotateCamera(
        ry * CAM_SENSITIVITY,  // pitch: stick up (negative) → look up
        -rx * CAM_SENSITIVITY  // yaw: stick right (positive) → orbit right (negative rotation.y)
      )
    }

    // --- Jump: Cross (button 0) → button1 (completely independent of sticks) ---
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
