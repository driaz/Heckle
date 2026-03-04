/**
 * Shared ref for the ecctrl character controller instance.
 * Assigned by the Player component, consumed by GamepadController
 * to call rotateCamera() for right stick camera orbit.
 */
export const ecctrlRef = { current: null }
