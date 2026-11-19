import path from 'path'
import process from 'node:process'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import livekitToken from './server/livekitToken.js'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  // LIVEKIT_* come from .env or the shell; without the VITE_ prefix they stay out of the bundle
  plugins: [react(), livekitToken(loadEnv(mode, process.cwd(), 'LIVEKIT_'))],
  assetsInclude: ['**/*.glb', '**/*.gltf'],
  resolve: {
    dedupe: ['react', 'react-dom', 'three', '@react-three/fiber', '@react-three/drei', '@react-three/rapier'],
    alias: {
      // Stub leva to avoid React 19 hook incompatibility from ecctrl's dependency
      leva: path.resolve(__dirname, 'src/lib/leva-stub.js'),
    },
  },
}))
