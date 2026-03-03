// Stub for leva to avoid React 19 hook incompatibility.
// ecctrl calls useControls even when debug=false, so we return a no-op.
export function useControls(_name, _schema, _options) {
  return {}
}

export function button() {}
export function folder() {}
export function monitor() {}

export function Leva() {
  return null
}
