import { ShaderMaterial, type Texture } from "three";

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/**
 * Emissive display. Two textures with a ragged wipe + slice-glitch transition, a faint
 * scanline/refresh sweep, and a modest gain (~0.85) so only the brightest UI pixels just clear the 0.6 bloom threshold.
 */
const fragmentShader = /* glsl */ `
  uniform sampler2D uA;
  uniform sampler2D uB;
  uniform float uMix;
  uniform float uTime;
  uniform float uGain;
  uniform float uScan;
  uniform float uGlitch;
  varying vec2 vUv;

  float hash(float n) { return fract(sin(n * 91.3458) * 47453.5453); }

  void main() {
    vec2 uv = vUv;
    float row = floor(uv.y * 36.0);
    float act = step(0.001, uMix) * step(uMix, 0.999);
    float amp = sin(uMix * 3.14159) * uGlitch * act;
    float off = (hash(row + floor(uTime * 14.0)) - 0.5) * 0.06 * amp;
    vec2 suv = vec2(clamp(uv.x + off, 0.0, 1.0), uv.y);

    vec3 a = texture2D(uA, suv).rgb;
    vec3 b = texture2D(uB, suv).rgb;

    float pos = uv.x * 0.92 + hash(row) * 0.08;
    float front = uMix * 1.12 - 0.06;
    float m = 1.0 - smoothstep(front - 0.035, front, pos);
    vec3 c = mix(a, b, m);

    float edge = exp(-pow((pos - front) * 55.0, 2.0)) * act;
    c += vec3(0.0, 0.94, 1.0) * edge * 1.6;

    float lines = 0.5 + 0.5 * sin(uv.y * 900.0);
    c *= 1.0 - uScan * 0.16 * lines;
    float sweep = smoothstep(0.0, 0.5, 1.0 - abs(fract(uTime * 0.07) * 1.4 - 0.2 - uv.y) * 6.0);
    c *= 1.0 + uScan * 0.10 * sweep;

    gl_FragColor = vec4(c * uGain, 1.0);
    #include <colorspace_fragment>
  }
`;

export const createScreenMaterial = (a: Texture, b: Texture = a, gain = 0.85, scan = 1) =>
  new ShaderMaterial({
    uniforms: {
      uA: { value: a },
      uB: { value: b },
      uMix: { value: 0 },
      uTime: { value: 0 },
      uGain: { value: gain },
      uScan: { value: scan },
      uGlitch: { value: 1 },
    },
    vertexShader,
    fragmentShader,
    toneMapped: false,
  });
