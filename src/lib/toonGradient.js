import { DataTexture, NearestFilter, RedFormat } from 'three'

/**
 * 3-step gradient map for MeshToonMaterial.
 * Creates sharp cel-shading transitions instead of smooth gradients.
 * Steps: shadow (0.30) → mid (0.60) → lit (1.0)
 */
const data = new Uint8Array([76, 153, 255])
const gradientMap = new DataTexture(data, 3, 1, RedFormat)
gradientMap.magFilter = NearestFilter
gradientMap.minFilter = NearestFilter
gradientMap.generateMipmaps = false
gradientMap.needsUpdate = true

export default gradientMap
