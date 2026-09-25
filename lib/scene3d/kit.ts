import * as THREE from "three";

/**
 * Small toolkit for building cute low-poly models out of primitives.
 * Geometries and materials are cached and shared across every scene, so they are never disposed per-world.
 */

export type Vec3 = [number, number, number];

let gradientMap: THREE.DataTexture | null = null;

function getGradientMap(): THREE.DataTexture {
  if (!gradientMap) {
    const tones = new Uint8Array([110, 190, 255]);
    gradientMap = new THREE.DataTexture(tones, tones.length, 1, THREE.RedFormat);
    gradientMap.minFilter = THREE.NearestFilter;
    gradientMap.magFilter = THREE.NearestFilter;
    gradientMap.needsUpdate = true;
  }
  return gradientMap;
}

const materialCache = new Map<string, THREE.Material>();

/** Cartoon-shaded material. `glow` makes it self-lit (for lights, eyes, windows). */
export function toon(color: THREE.ColorRepresentation, glow = 0): THREE.Material {
  const key = `${new THREE.Color(color).getHexString()}:${glow}`;
  let mat = materialCache.get(key);
  if (!mat) {
    const c = new THREE.Color(color);
    mat = new THREE.MeshToonMaterial({
      color: c,
      gradientMap: getGradientMap(),
      emissive: glow > 0 ? c : new THREE.Color(0x000000),
      emissiveIntensity: glow,
    });
    materialCache.set(key, mat);
  }
  return mat;
}

const geometryCache = new Map<string, THREE.BufferGeometry>();

function cachedGeometry(key: string, make: () => THREE.BufferGeometry): THREE.BufferGeometry {
  let geom = geometryCache.get(key);
  if (!geom) {
    geom = make();
    geometryCache.set(key, geom);
  }
  return geom;
}

/** Unit-sized shared geometries; size them with the mesh scale. */
export const G = {
  sphere: () => cachedGeometry("sphere", () => new THREE.SphereGeometry(1, 24, 16)),
  blob: () => cachedGeometry("blob", () => new THREE.IcosahedronGeometry(1, 1)),
  rock: () => cachedGeometry("rock", () => new THREE.DodecahedronGeometry(1, 0)),
  box: () => cachedGeometry("box", () => new THREE.BoxGeometry(1, 1, 1)),
  cone: () => cachedGeometry("cone", () => new THREE.ConeGeometry(1, 1, 18)),
  pyramid: () => cachedGeometry("pyramid", () => new THREE.ConeGeometry(1, 1, 4)),
  cylinder: () => cachedGeometry("cylinder", () => new THREE.CylinderGeometry(1, 1, 1, 18)),
  hemisphere: () =>
    cachedGeometry("hemisphere", () => new THREE.SphereGeometry(1, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2)),
  disc: () => cachedGeometry("disc", () => new THREE.CircleGeometry(1, 40)),
  torus: (tube: number, arc = Math.PI * 2) =>
    cachedGeometry(`torus:${tube}:${arc}`, () => new THREE.TorusGeometry(1, tube, 10, 32, arc)),
};

export interface PartOptions {
  pos?: Vec3;
  scale?: Vec3 | number;
  rot?: Vec3;
  shadow?: boolean;
}

/** One primitive mesh, positioned/scaled/rotated in its parent's space. */
export function part(
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  { pos = [0, 0, 0], scale = 1, rot = [0, 0, 0], shadow = true }: PartOptions = {}
): THREE.Mesh {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(...pos);
  if (typeof scale === "number") mesh.scale.setScalar(scale);
  else mesh.scale.set(...scale);
  mesh.rotation.set(...rot);
  mesh.castShadow = shadow;
  mesh.receiveShadow = true;
  return mesh;
}

export function group(...children: THREE.Object3D[]): THREE.Group {
  const g = new THREE.Group();
  if (children.length) g.add(...children);
  return g;
}

/** A pair of big shiny cartoon eyes, facing +z, centered on x = 0. */
export function eyes(size: number, spacing: number, pos: Vec3, pupil: THREE.ColorRepresentation = 0x2b1b12) {
  const g = new THREE.Group();
  g.position.set(...pos);
  for (const side of [-1, 1]) {
    const x = side * spacing;
    g.add(part(G.sphere(), toon(0xffffff), { pos: [x, 0, 0], scale: size, shadow: false }));
    g.add(part(G.sphere(), toon(pupil), { pos: [x, 0, size * 0.55], scale: size * 0.62, shadow: false }));
    g.add(
      part(G.sphere(), toon(0xffffff, 0.8), {
        pos: [x + size * 0.22, size * 0.25, size * 1.05],
        scale: size * 0.2,
        shadow: false,
      })
    );
  }
  return g;
}

/** Rosy cheeks — the fastest way to make anything look friendly. */
export function cheeks(size: number, spacing: number, pos: Vec3) {
  const g = new THREE.Group();
  g.position.set(...pos);
  for (const side of [-1, 1]) {
    g.add(
      part(G.sphere(), toon(0xff8fab), {
        pos: [side * spacing, 0, 0],
        scale: [size, size * 0.6, size * 0.4],
        shadow: false,
      })
    );
  }
  return g;
}

/** Deterministic PRNG so the same page always builds the same diorama. */
export function seededRandom(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Rng = ReturnType<typeof seededRandom>;

export function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function pick<T>(rng: Rng, items: readonly T[]): T {
  return items[Math.floor(rng() * items.length)];
}

export function range(rng: Rng, min: number, max: number): number {
  return min + rng() * (max - min);
}

let dotTexture: THREE.Texture | null = null;

/** Soft round sprite used by every particle system. */
export function getDotTexture(): THREE.Texture {
  if (!dotTexture) {
    const size = 64;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    grad.addColorStop(0, "rgba(255,255,255,1)");
    grad.addColorStop(0.35, "rgba(255,255,255,0.9)");
    grad.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    dotTexture = new THREE.CanvasTexture(canvas);
  }
  return dotTexture;
}

let streakTexture: THREE.Texture | null = null;

/** A soft vertical streak, so point particles read as falling rain. */
export function getStreakTexture(): THREE.Texture {
  if (!streakTexture) {
    const size = 64;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    const grad = ctx.createLinearGradient(0, 0, 0, size);
    grad.addColorStop(0, "rgba(255,255,255,0)");
    grad.addColorStop(0.5, "rgba(255,255,255,0.9)");
    grad.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(size / 2 - 2, 0, 4, size);
    streakTexture = new THREE.CanvasTexture(canvas);
  }
  return streakTexture;
}

let zTexture: THREE.Texture | null = null;

/** A chunky "Z" for sleeping characters. */
export function getZTexture(): THREE.Texture {
  if (!zTexture) {
    const size = 64;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    ctx.font = "bold 52px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineWidth = 8;
    ctx.strokeStyle = "#6a4fc9";
    ctx.strokeText("Z", size / 2, size / 2 + 2);
    ctx.fillStyle = "#ffffff";
    ctx.fillText("Z", size / 2, size / 2 + 2);
    zTexture = new THREE.CanvasTexture(canvas);
  }
  return zTexture;
}
