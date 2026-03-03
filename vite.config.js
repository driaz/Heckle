import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  assetsInclude: ['**/*.glb', '**/*.gltf'],
  resolve: {
    dedupe: ['react', 'react-dom', 'three', '@react-three/fiber', '@react-three/drei', '@react-three/rapier'],
    alias: {
      // Stub leva to avoid React 19 hook incompatibility from ecctrl's dependency
      leva: path.resolve(__dirname, 'src/lib/leva-stub.js'),
    },
  },
})
