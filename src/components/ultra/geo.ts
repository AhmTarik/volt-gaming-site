import {
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  Color,
  CylinderGeometry,
  Euler,
  Matrix4,
  Quaternion,
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

/**
 * Bakes many primitives into ONE vertex-coloured BufferGeometry so a whole assembly is a single
 * draw call per material. Everything is normalised to non-indexed (position, normal, uv, color).
 */
export class GeoBuilder {
  private geos: BufferGeometry[] = [];

  add(source: BufferGeometry, o: PartOpts = {}) {
    const geo = source.index ? source.toNonIndexed() : source;
    if (geo !== source) source.dispose();
    const m = new Matrix4().compose(
      new Vector3(...(o.pos ?? [0, 0, 0])),
      new Quaternion().setFromEuler(new Euler(...(o.rot ?? [0, 0, 0]))),
      new Vector3(...(o.scale ?? [1, 1, 1])),
    );
    geo.applyMatrix4(m);
    const c = o.color instanceof Color ? o.color : new Color(o.color ?? "#ffffff");
    const n = geo.attributes.position.count;
    const arr = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      arr[i * 3] = c.r;
      arr[i * 3 + 1] = c.g;
      arr[i * 3 + 2] = c.b;
    }
    geo.setAttribute("color", new BufferAttribute(arr, 3));
    // keep only the attributes every part shares
    for (const k of Object.keys(geo.attributes)) {
      if (!["position", "normal", "uv", "color"].includes(k)) geo.deleteAttribute(k);
    }
    if (!geo.attributes.uv) {
      geo.setAttribute("uv", new BufferAttribute(new Float32Array(n * 2), 2));
    }
    this.geos.push(geo);
    return this;
  }

  box(w: number, h: number, d: number, o?: PartOpts) {
    return this.add(new BoxGeometry(w, h, d), o);
  }

  rbox(w: number, h: number, d: number, r: number, o?: PartOpts, seg = 3) {
    const radius = Math.min(r, Math.min(w, h, d) / 2 - 0.0005);
    return this.add(new RoundedBoxGeometry(w, h, d, seg, radius), o);
  }

  /** Cylinder along Y by default. */
  cyl(rTop: number, rBottom: number, h: number, o?: PartOpts, seg = 28) {
    return this.add(new CylinderGeometry(rTop, rBottom, h, seg), o);
  }

  torus(r: number, tube: number, o?: PartOpts, radial = 8, tubular = 40) {
    return this.add(new TorusGeometry(r, tube, radial, tubular), o);
  }

  build(): BufferGeometry {
    if (!this.geos.length) return new BufferGeometry();
    const g = mergeGeometries(this.geos, false);
    this.geos.forEach((x) => x.dispose());
    this.geos = [];
    if (!g) throw new Error("GeoBuilder: nothing to merge");
    g.computeBoundingSphere();
    return g;
  }
}

/** Memoise a lazily-built resource at module scope (shared by every mount). */
export const once = <T>(fn: () => T): (() => T) => {
  let v: T | undefined;
  return () => (v ??= fn());
};

/** HDR colour helper: `hdr("#00b4ff", 3)` blooms. */
export const hdr = (c: ColorRepresentation, gain: number) => new Color(c).multiplyScalar(gain);
