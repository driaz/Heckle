import { randomUUID } from 'node:crypto'
import { AccessToken, TrackSource } from 'livekit-server-sdk'
import { getLevelGuide } from '../src/config/level.js'

const PATH = '/api/livekit-token'

/**
 * Vite plugin: serves POST /api/livekit-token from the dev and preview servers.
 * The token is signed here with LIVEKIT_API_KEY / LIVEKIT_API_SECRET, which never reach the
 * browser. Each call names a fresh room, so each call gets its own narrator session.
 */
export default function livekitToken(env) {
  async function handle(req, res, next) {
    if (req.url.split('?')[0] !== PATH) return next()
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Cache-Control', 'no-store')
    if (req.method !== 'POST') {
      res.statusCode = 405
      return res.end(JSON.stringify({ error: 'POST only' }))
    }
    const { LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET } = env
    if (!LIVEKIT_URL || !LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
      res.statusCode = 503
      return res.end(JSON.stringify({ error: 'LIVEKIT_URL, LIVEKIT_API_KEY and LIVEKIT_API_SECRET are not all set' }))
    }
    const id = randomUUID().slice(0, 8)
    const token = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity: `player-${id}`,
      ttl: '10m', // time allowed to join, not the session length
      metadata: getLevelGuide(), // the narrator reads the level description from here
    })
    // Watch, send events, and publish the mic so the narrator can hear the player. Nothing else.
    token.addGrant({
      room: `heckle-${id}`,
      roomJoin: true,
      canSubscribe: true,
      canPublish: true,
      canPublishSources: [TrackSource.MICROPHONE],
      canPublishData: true,
    })
    res.end(JSON.stringify({ url: LIVEKIT_URL, token: await token.toJwt() }))
  }

  return {
    name: 'heckle-livekit-token',
    configureServer: (server) => { server.middlewares.use(handle) },
    configurePreviewServer: (server) => { server.middlewares.use(handle) },
  }
}
