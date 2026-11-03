import {
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  Color,
  CylinderGeometry,
  Euler,
  Matrix4,
  Quaternion,
  SphereGeometry,
  TorusGeometry,
  Vector3,
  type ColorRepresentation,
} from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

export type V3 = [number, number, number];

export interface PartOpts {
  pos?: V3;
  rot?: V3;
  scale?: V3;
  color?: ColorRepresentation;
}

const Z_AXIS = new Vector3(0, 0, 1);

/**
 * Bakes many primitives into ONE vertex-coloured BufferGeometry, so a whole desk, tower or
 * aluminium frame is a single draw call. Parts are normalised to non-indexed so mixed primitives merge.
 */
export class GeoBuilder {
  private geos: BufferGeometry[] = [];
  private base = new Matrix4();

  /** Apply a parent transform to everything added inside `fn` (e.g. a tilted pedal plate). */
  withBase(pos: V3, rot: V3, fn: () => void) {
    const prev = this.base;
    const m = new Matrix4().compose(
      new Vector3(...pos),
      new Quaternion().setFromEuler(new Euler(...rot)),
      new Vector3(1, 1, 1),
    );
    this.base = prev.clone().multiply(m);
    fn();
    this.base = prev;
  }

  add(source: BufferGeometry, o: PartOpts = {}) {
    // RoundedBoxGeometry is non-indexed while Box/Cylinder/Torus are indexed; merging needs one kind.
    let geo = source;
    if (geo.index) {
      geo = geo.toNonIndexed();
      source.dispose();
    }
    const m = new Matrix4().compose(
      new Vector3(...(o.pos ?? [0, 0, 0])),
      new Quaternion().setFromEuler(new Euler(...(o.rot ?? [0, 0, 0]))),
      new Vector3(...(o.scale ?? [1, 1, 1])),
    );
    geo.applyMatrix4(this.base.clone().multiply(m));
    const c = new Color(o.color ?? "#ffffff");
    const n = geo.attributes.position.count;
    const arr = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      arr[i * 3] = c.r;
      arr[i * 3 + 1] = c.g;
      arr[i * 3 + 2] = c.b;
    }
    geo.setAttribute("color", new BufferAttribute(arr, 3));
    this.geos.push(geo);
    return this;
  }

  box(w: number, h: number, d: number, o?: PartOpts) {
    return this.add(new BoxGeometry(w, h, d), o);
  }

  rbox(w: number, h: number, d: number, r: number, o?: PartOpts, seg = 2) {
    const radius = Math.min(r, Math.min(w, h, d) / 2 - 0.0005);
    return this.add(new RoundedBoxGeometry(w, h, d, seg, radius), o);
  }

  /** Cylinder along Y by default. */
  cyl(rTop: number, rBottom: number, h: number, o?: PartOpts, seg = 18) {
    return this.add(new CylinderGeometry(rTop, rBottom, h, seg), o);
  }

  torus(r: number, tube: number, o?: PartOpts, radial = 8, tubular = 32) {
    return this.add(new TorusGeometry(r, tube, radial, tubular), o);
  }

  sphere(r: number, o?: PartOpts) {
    return this.add(new SphereGeometry(r, 16, 12), o);
  }

  /** A box of square-ish section running between two points. */
  strut(a: V3, b: V3, thickness: number, color?: ColorRepresentation) {
    const from = new Vector3(...a);
    const to = new Vector3(...b);
    const dir = to.clone().sub(from);
    const len = dir.length();
    const q = new Quaternion().setFromUnitVectors(Z_AXIS, dir.normalize());
    const e = new Euler().setFromQuaternion(q);
    const mid = from.add(to).multiplyScalar(0.5);
    return this.box(thickness, thickness, len, { pos: [mid.x, mid.y, mid.z], rot: [e.x, e.y, e.z], color });
  }

  /**
   * T-slot aluminium extrusion approximation: a box plus a dark groove strip down the middle of
   * each long face. Axis-aligned only (the groove is what sells "profile" from a distance).
   */
  profile(size: V3, pos: V3, color: ColorRepresentation = "#9aa1af", groove: ColorRepresentation = "#12141b") {
    const [sx, sy, sz] = size;
    this.box(sx, sy, sz, { pos, color });
    const along = sx >= sy && sx >= sz ? 0 : sy >= sz ? 1 : 2;
    const e = 0.0015; // groove protrudes a hair so it never z-fights
    const w = 0.013;
    const [px, py, pz] = pos;
    const strips: Array<[V3, V3]> = [];
    if (along === 2) {
      strips.push([[w, e * 2, sz - 0.004], [px, py + sy / 2, pz]], [[w, e * 2, sz - 0.004], [px, py - sy / 2, pz]]);
      strips.push([[e * 2, w, sz - 0.004], [px + sx / 2, py, pz]], [[e * 2, w, sz - 0.004], [px - sx / 2, py, pz]]);
    } else if (along === 0) {
      strips.push([[sx - 0.004, e * 2, w], [px, py + sy / 2, pz]], [[sx - 0.004, e * 2, w], [px, py - sy / 2, pz]]);
      strips.push([[sx - 0.004, w, e * 2], [px, py, pz + sz / 2]], [[sx - 0.004, w, e * 2], [px, py, pz - sz / 2]]);
    } else {
      strips.push([[e * 2, sy - 0.004, w], [px + sx / 2, py, pz]], [[e * 2, sy - 0.004, w], [px - sx / 2, py, pz]]);
      strips.push([[w, sy - 0.004, e * 2], [px, py, pz + sz / 2]], [[w, sy - 0.004, e * 2], [px, py, pz - sz / 2]]);
    }
    for (const [s, p] of strips) this.box(s[0], s[1], s[2], { pos: p, color: groove });
    return this;
  }

  build(): BufferGeometry {
    const g = mergeGeometries(this.geos, false);
    this.geos.forEach((x) => x.dispose());
    this.geos = [];
    if (!g) throw new Error("GeoBuilder: nothing to merge");
    g.computeBoundingSphere();
    g.computeBoundingBox();
    return g;
  }
}

/** Memoise a lazily-built resource at module scope (geometries/materials shared by all instances). */
export const once = <T>(fn: () => T): (() => T) => {
  let v: T | undefined;
  return () => (v ??= fn());
};

export const lerpColor = (a: ColorRepresentation, b: ColorRepresentation, t: number) =>
  new Color(a).lerp(new Color(b), t);
