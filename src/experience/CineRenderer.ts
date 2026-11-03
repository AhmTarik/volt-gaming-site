/**
 * Full-screen WebGL renderer for the scroll film. Draws one scene, or a transition
 * between two, from still photos. The two transitions copy the moves in the
 * reference video:
 *  - warp: a whip-pan that tears the frame into horizontal light streaks
 *  - dive: the camera pushes in, the room turns into a glowing edge "x-ray",
 *          and a portal opens onto the next room
 */

const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const FRAG = `
precision highp float;
varying vec2 vUv;

uniform sampler2D uA;
uniform sampler2D uB;
uniform vec2 uRes;
uniform float uAspA;
uniform float uAspB;
uniform float uZA;
uniform float uZB;
uniform vec2 uFA;
uniform vec2 uFB;
uniform float uP;
uniform float uMode;
uniform float uTime;
uniform float uVel;
uniform float uSpdA;
uniform float uSpdB;
uniform float uReduce;
uniform float uFade;

#define PI 3.14159265

float hash(float n) { return fract(sin(n * 127.1) * 43758.5453); }
float hash2(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
float luma(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }

// Screen uv -> image uv: "object-fit: cover", then zoom toward a focal point.
// pull: extra 0..1 bias that centres the focal point regardless of zoom.
vec2 coverUvP(vec2 uv, float asp, float zoom, vec2 focal, float pull) {
  float r = uRes.x / uRes.y;
  vec2 ext = r > asp ? vec2(1.0, asp / r) : vec2(r / asp, 1.0);
  ext /= zoom;
  vec2 c = mix(vec2(0.5), focal, max(clamp(1.0 - 1.0 / zoom, 0.0, 1.0), pull));
  c = clamp(c, ext * 0.5, 1.0 - ext * 0.5);
  return c + (uv - 0.5) * ext;
}

vec2 coverUv(vec2 uv, float asp, float zoom, vec2 focal) {
  return coverUvP(uv, asp, zoom, focal, 0.0);
}

vec3 tex(sampler2D t, vec2 uv, float asp, float z, vec2 f) {
  return texture2D(t, coverUv(uv, asp, z, f)).rgb;
}

// Same, with red and blue pulled apart horizontally.
vec3 texCA(sampler2D t, vec2 uv, float asp, float z, vec2 f, float ca) {
  return vec3(
    texture2D(t, coverUv(uv + vec2(ca, 0.0), asp, z, f)).r,
    texture2D(t, coverUv(uv, asp, z, f)).g,
    texture2D(t, coverUv(uv - vec2(ca, 0.0), asp, z, f)).b
  );
}

vec3 speedLines(vec2 uv, float amt) {
  if (amt <= 0.0) return vec3(0.0);
  vec2 d = uv - vec2(0.5, 0.6);
  d.x *= uRes.x / uRes.y;
  float a = atan(d.y, d.x);
  float r = length(d);
  float id = floor(a * 70.0 / PI);
  float n = hash(id);
  float line = step(0.8, n) * pow(fract(r * 1.2 - uTime * (1.2 + n * 2.5) + n * 10.0), 8.0);
  line *= smoothstep(0.3, 0.9, r);
  return vec3(0.75, 0.9, 1.0) * line * amt * 0.55;
}

vec3 warp(vec2 uv) {
  float p = uP;
  float s = sin(PI * p);
  float row = floor(uv.y * 54.0);
  float h1 = hash(row + 1.0);
  float h2 = hash(row * 3.7 + 11.0);

  // Each band switches to the next scene at a slightly different moment.
  float k = smoothstep(0.0, 1.0, clamp((p - 0.5 + (h1 - 0.5) * 0.4) / 0.16 + 0.5, 0.0, 1.0));

  float jitter = s * (h2 - 0.5) * 0.12;
  float offA = -p * p * 0.55 - jitter;
  float offB = (1.0 - p) * (1.0 - p) * 0.55 - jitter;
  float len = s * (0.06 + 0.22 * h2);
  float ca = s * 0.014;

  vec3 a = vec3(0.0);
  vec3 b = vec3(0.0);
  for (int i = 0; i < 10; i++) {
    float t = float(i) / 9.0 - 0.5;
    vec2 o = vec2(t * len, 0.0);
    if (k < 0.999) a += texCA(uA, uv + o + vec2(offA, 0.0), uAspA, uZA * (1.0 + p * 0.12), uFA, ca);
    if (k > 0.001) b += texCA(uB, uv + o + vec2(offB, 0.0), uAspB, uZB * (1.0 + (1.0 - p) * 0.12), uFB, ca);
  }
  vec3 col = mix(a, b, k) / 10.0;

  // Thin neon glints racing through the streaks.
  float fine = floor(uv.y * 220.0);
  float g = step(0.93, hash(fine * 7.3 + 3.0));
  float gx = fract(uv.x * 0.6 + hash(fine) * 3.0 - p * 2.4);
  vec3 glint = mix(vec3(0.2, 0.9, 1.0), vec3(1.0, 0.3, 0.9), hash(fine + 9.0));
  col += g * s * glint * smoothstep(0.0, 0.7, gx) * smoothstep(1.0, 0.9, gx) * 0.9;

  col *= 1.0 + s * 0.3;
  return col;
}

vec3 dive(vec2 uv) {
  float p = uP;
  float s = sin(PI * p);
  vec2 c = vec2(0.5);
  vec2 aspect = vec2(uRes.x / uRes.y, 1.0);

  // Push into scene A with a radial zoom blur.
  float zA = uZA * (1.0 + pow(p, 1.5) * 2.4);
  float bl = s * 0.2;
  vec3 a = vec3(0.0);
  for (int i = 0; i < 9; i++) {
    float t = float(i) / 8.0;
    vec2 q = c + (uv - c) * (1.0 - bl * t);
    a += texCA(uA, q, uAspA, zA, uFA, s * 0.006);
  }
  a /= 9.0;

  // X-ray: the room collapses to its glowing edges.
  float xr = smoothstep(0.1, 0.42, p);
  if (xr > 0.0) {
    vec2 e = 2.0 / uRes;
    float gx = luma(tex(uA, uv + vec2(e.x, 0.0), uAspA, zA, uFA)) - luma(tex(uA, uv - vec2(e.x, 0.0), uAspA, zA, uFA));
    float gy = luma(tex(uA, uv + vec2(0.0, e.y), uAspA, zA, uFA)) - luma(tex(uA, uv - vec2(0.0, e.y), uAspA, zA, uFA));
    float edge = clamp(length(vec2(gx, gy)) * 5.0, 0.0, 1.0);
    vec3 xray = vec3(0.15, 0.85, 1.0) * edge * 1.7 + a * vec3(0.08, 0.12, 0.2) + vec3(0.0, 0.03, 0.07);
    float sweep = smoothstep(0.012, 0.0, abs(uv.y - (1.0 - fract(p * 1.8))));
    xray += vec3(0.4, 0.95, 1.0) * sweep * 0.7;
    a = mix(a, xray, xr);
  }

  // Portal onto scene B.
  vec2 d = (uv - c) * aspect;
  float r = length(d);
  float ang = atan(d.y, d.x);
  float open = smoothstep(0.4, 0.97, p);
  float wob = (0.018 * sin(ang * 7.0 + uTime * 3.0) + 0.01 * sin(ang * 13.0 - uTime * 5.0)) * (1.0 - open);
  float R = pow(open, 1.35) * 1.3 + wob * step(0.0001, open);
  float inside = (1.0 - smoothstep(R - 0.012, R + 0.012, r)) * step(0.0001, open);

  vec3 b = vec3(0.0);
  if (inside > 0.0) {
    float zB = uZB * (1.0 + (1.0 - p) * 0.55);
    float bb = (1.0 - p) * 0.14;
    for (int i = 0; i < 6; i++) {
      float t = float(i) / 5.0;
      vec2 q = c + (uv - c) * (1.0 - bb * t);
      b += texture2D(uB, coverUvP(q, uAspB, zB, uFB, (1.0 - p) * 0.95)).rgb;
    }
    b /= 6.0;
  }

  vec3 col = mix(a, b, inside);
  float ring = exp(-pow((r - R) * 38.0, 2.0)) * step(0.0001, open) * (1.0 - smoothstep(0.88, 1.0, p));
  vec3 ringCol = mix(vec3(0.2, 0.9, 1.0), vec3(1.0, 0.25, 0.85), 0.5 + 0.5 * sin(ang * 2.0 + uTime * 1.5));
  col += ring * ringCol * 1.6;
  col *= 1.0 + s * 0.15;
  return col;
}

void main() {
  vec2 uv = vUv;
  vec3 col;
  float ca = clamp(uVel * 0.005, -0.012, 0.012);

  if (uP <= 0.0001) {
    col = texCA(uA, uv, uAspA, uZA * (1.0 + abs(uVel) * 0.006), uFA, ca);
    col += speedLines(uv, uSpdA);
  } else if (uReduce > 0.5) {
    col = mix(tex(uA, uv, uAspA, uZA, uFA), tex(uB, uv, uAspB, uZB, uFB), smoothstep(0.0, 1.0, uP));
  } else {
    col = uMode < 0.5 ? warp(uv) : dive(uv);
    col += speedLines(uv, mix(uSpdA, uSpdB, uP));
  }

  // Lens: vignette, grain, faint scanlines.
  vec2 v = (uv - 0.5) * vec2(uRes.x / uRes.y, 1.0);
  col *= 1.0 - dot(v, v) * 0.5;
  col += (hash2(uv * uRes + fract(uTime * 7.0) * 100.0) - 0.5) * 0.05;
  col *= 0.975 + 0.025 * sin(uv.y * uRes.y * 1.4);

  gl_FragColor = vec4(col * uFade, 1.0);
}`;

export interface FrameState {
  a: number;
  b: number;
  p: number;
  mode: "warp" | "dive";
  zoomA: number;
  zoomB: number;
  velocity: number;
  time: number;
  speedA: number;
  speedB: number;
  /** Fades the whole frame in from black (0..1). */
  fade: number;
}

interface SceneTexture {
  tex: WebGLTexture;
  aspect: number;
  focal: [number, number];
}

export class CineRenderer {
  private gl: WebGLRenderingContext;
  private program: WebGLProgram;
  private uniforms: Record<string, WebGLUniformLocation | null> = {};
  private scenes: SceneTexture[] = [];
  private reduce: boolean;
  readonly ready: Promise<void>;

  static supported(canvas: HTMLCanvasElement) {
    return !!canvas.getContext("webgl", { antialias: false });
  }

  constructor(
    private canvas: HTMLCanvasElement,
    sources: { image: string; focal: [number, number] }[],
    opts: { reduceMotion: boolean; onProgress?: (loaded: number, total: number) => void },
  ) {
    const gl = canvas.getContext("webgl", { antialias: false, alpha: false, premultipliedAlpha: false });
    if (!gl) throw new Error("WebGL unavailable");
    this.gl = gl;
    this.reduce = opts.reduceMotion;
    this.program = this.link();
    gl.useProgram(this.program);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(this.program, "aPos");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    for (const name of [
      "uA", "uB", "uRes", "uAspA", "uAspB", "uZA", "uZB", "uFA", "uFB", "uP", "uMode",
      "uTime", "uVel", "uSpdA", "uSpdB", "uReduce", "uFade",
    ]) {
      this.uniforms[name] = gl.getUniformLocation(this.program, name);
    }
    gl.uniform1i(this.uniforms.uA, 0);
    gl.uniform1i(this.uniforms.uB, 1);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

    let loaded = 0;
    this.ready = Promise.all(
      sources.map((s, i) =>
        this.load(s.image).then((img) => {
          this.scenes[i] = {
            tex: this.upload(img),
            aspect: img.naturalWidth / img.naturalHeight,
            // Image coords are top-left origin; the texture is flipped.
            focal: [s.focal[0], 1 - s.focal[1]],
          };
          opts.onProgress?.(++loaded, sources.length);
        }),
      ),
    ).then(() => undefined);

    this.resize();
  }

  private compile(type: number, src: string) {
    const gl = this.gl;
    const sh = gl.createShader(type)!;
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      throw new Error(gl.getShaderInfoLog(sh) ?? "shader compile failed");
    }
    return sh;
  }

  private link() {
    const gl = this.gl;
    const p = gl.createProgram()!;
    gl.attachShader(p, this.compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(p, this.compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(p) ?? "program link failed");
    }
    return p;
  }

  private load(src: string) {
    return new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.decoding = "async";
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load ${src}`));
      img.src = src;
    });
  }

  private upload(img: HTMLImageElement) {
    const gl = this.gl;
    const tex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
    return tex;
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const w = Math.round(this.canvas.clientWidth * dpr);
    const h = Math.round(this.canvas.clientHeight * dpr);
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
    this.gl.viewport(0, 0, w, h);
  }

  render(f: FrameState) {
    const A = this.scenes[f.a];
    const B = this.scenes[f.b] ?? A;
    if (!A) return;
    const gl = this.gl;
    const u = this.uniforms;

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, A.tex);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, B.tex);

    gl.uniform2f(u.uRes, this.canvas.width, this.canvas.height);
    gl.uniform1f(u.uAspA, A.aspect);
    gl.uniform1f(u.uAspB, B.aspect);
    gl.uniform1f(u.uZA, f.zoomA);
    gl.uniform1f(u.uZB, f.zoomB);
    gl.uniform2f(u.uFA, A.focal[0], A.focal[1]);
    gl.uniform2f(u.uFB, B.focal[0], B.focal[1]);
    gl.uniform1f(u.uP, f.p);
    gl.uniform1f(u.uMode, f.mode === "warp" ? 0 : 1);
    gl.uniform1f(u.uTime, f.time);
    gl.uniform1f(u.uVel, this.reduce ? 0 : f.velocity);
    gl.uniform1f(u.uSpdA, this.reduce ? 0 : f.speedA);
    gl.uniform1f(u.uSpdB, this.reduce ? 0 : f.speedB);
    gl.uniform1f(u.uReduce, this.reduce ? 1 : 0);
    gl.uniform1f(u.uFade, f.fade);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  dispose() {
    const gl = this.gl;
    this.scenes.forEach((s) => s && gl.deleteTexture(s.tex));
    gl.deleteProgram(this.program);
    gl.getExtension("WEBGL_lose_context")?.loseContext();
  }
}
