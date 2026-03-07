import { Effect, BlendFunction, EffectAttribute } from 'postprocessing'
import { Uniform, Vector2 } from 'three'

const fragmentShader = /* glsl */ `
uniform vec2 texelSize;
uniform float thickness;

void mainImage(const in vec4 inputColor, const in vec2 uv, const in float depth, out vec4 outputColor) {
  vec2 s = texelSize * thickness;

  // Sobel edge detection on depth buffer (8 neighbor samples)
  float d_tl = texture2D(depthBuffer, uv + vec2(-s.x,  s.y)).r;
  float d_t  = texture2D(depthBuffer, uv + vec2( 0.0,  s.y)).r;
  float d_tr = texture2D(depthBuffer, uv + vec2( s.x,  s.y)).r;
  float d_l  = texture2D(depthBuffer, uv + vec2(-s.x,  0.0)).r;
  float d_r  = texture2D(depthBuffer, uv + vec2( s.x,  0.0)).r;
  float d_bl = texture2D(depthBuffer, uv + vec2(-s.x, -s.y)).r;
  float d_b  = texture2D(depthBuffer, uv + vec2( 0.0, -s.y)).r;
  float d_br = texture2D(depthBuffer, uv + vec2( s.x, -s.y)).r;

  // Sobel gradient
  float gx = d_tl + 2.0 * d_l + d_bl - d_tr - 2.0 * d_r - d_br;
  float gy = d_tl + 2.0 * d_t + d_tr - d_bl - 2.0 * d_b - d_br;
  float edge = sqrt(gx * gx + gy * gy);

  // Smooth threshold — strong edges become fully opaque
  edge = smoothstep(0.0008, 0.003, edge);

  // Warm dark brown outline (not pure black, matches a hand-drawn look)
  vec3 outlineColor = vec3(0.12, 0.08, 0.05);
  outputColor = vec4(mix(inputColor.rgb, outlineColor, edge), inputColor.a);
}
`

export class CelOutlineEffect extends Effect {
  constructor({ thickness = 1.5 } = {}) {
    super('CelOutlineEffect', fragmentShader, {
      blendFunction: BlendFunction.NORMAL,
      attributes: EffectAttribute.DEPTH,
      uniforms: new Map([
        ['texelSize', new Uniform(new Vector2())],
        ['thickness', new Uniform(thickness)],
      ]),
    })
  }

  setSize(width, height) {
    this.uniforms.get('texelSize').value.set(1 / width, 1 / height)
  }
}
