import type { CharacterKind } from "./characters";
import * as D from "./decor";
import type { Decor } from "./decor";
import { G, group, part, pick, range, toon, type Rng } from "./kit";

export type ParticleKind = "fireflies" | "stars" | "bubbles" | "sparkles" | "pollen";

export interface Environment {
  skyTop: number;
  skyBottom: number;
  ground: number;
  hemiSky: number;
  hemiGround: number;
  hemiIntensity: number;
  sunColor: number;
  sunIntensity: number;
  particles: ParticleKind;
}

/** A piece of scenery placed in the world. */
export interface Placement {
  decor: Decor;
  x: number;
  y?: number;
  z: number;
  rotY?: number;
  scale?: number;
}

export interface WorldDef {
  env: Environment;
  /** Who shows up when the page's tags don't name anyone. */
  heroes: CharacterKind[];
  decor: (rng: Rng) => Placement[];
}

/** Random spot in the back/side ring of the diorama, keeping the front-center stage clear for characters. */
function ringSpot(rng: Rng, minR = 4, maxR = 11): { x: number; z: number } {
  for (let i = 0; i < 20; i++) {
    const a = range(rng, Math.PI * 0.05, Math.PI * 0.95);
    const r = range(rng, minR, maxR);
    const x = Math.cos(a) * r * 1.3;
    const z = -Math.sin(a) * r + 3;
    if (Math.abs(x) > 3.2 || z < -1) return { x, z };
  }
  return { x: pick(rng, [-1, 1]) * range(rng, 4, 8), z: range(rng, -6, -2) };
}

/** Small things scattered near the front edges, framing the characters. */
function frontSpot(rng: Rng): { x: number; z: number } {
  const side = rng() < 0.5 ? -1 : 1;
  return { x: side * range(rng, 2.8, 5.5), z: range(rng, 0.5, 4) };
}

function scatter(rng: Rng, count: number, make: (rng: Rng) => Decor, spot = ringSpot): Placement[] {
  return Array.from({ length: count }, () => ({ decor: make(rng), ...spot(rng), rotY: range(rng, -0.6, 0.6) }));
}

function skyPieces(rng: Rng, count: number, make: (rng: Rng) => Decor, yMin = 3.8, yMax = 5.4): Placement[] {
  return Array.from({ length: count }, (_, i) => ({
    decor: make(rng),
    x: (i - (count - 1) / 2) * range(rng, 4, 6),
    y: range(rng, yMin, yMax),
    z: range(rng, -11, -7),
  }));
}

export const WORLDS: Record<string, WorldDef> = {
  forest: {
    env: {
      skyTop: 0x7cc8ff,
      skyBottom: 0xe3f7e8,
      ground: 0x78c96a,
      hemiSky: 0xd8f3ff,
      hemiGround: 0x5a9e4c,
      hemiIntensity: 1.6,
      sunColor: 0xfff1d0,
      sunIntensity: 2.2,
      particles: "pollen",
    },
    heroes: ["fox", "bunny", "owl", "deer"],
    decor: (rng) => [
      ...scatter(rng, 9, D.roundTree),
      ...scatter(rng, 6, (r) => D.pineTree(r)),
      ...scatter(rng, 4, (r) => D.mushroom(r), frontSpot),
      ...scatter(rng, 6, D.flower, frontSpot),
      ...scatter(rng, 2, (r) => D.bush(r), frontSpot),
      ...skyPieces(rng, 3, (r) => D.cloud(r)),
    ],
  },
  animals: {
    env: {
      skyTop: 0x6ec6ff,
      skyBottom: 0xfff4d6,
      ground: 0x98dd6f,
      hemiSky: 0xe0f4ff,
      hemiGround: 0x6aa84f,
      hemiIntensity: 1.6,
      sunColor: 0xfff0c8,
      sunIntensity: 2.4,
      particles: "pollen",
    },
    heroes: ["bunny", "puppy", "kitten"],
    decor: (rng) => [
      { decor: D.barn(), x: range(rng, -6, -4), z: -4, rotY: 0.35 },
      { decor: D.fence(5), x: range(rng, 2, 4), z: -1.5, rotY: -0.15 },
      { decor: D.fence(4), x: -3.5, z: 1.5, rotY: 0.6 },
      ...scatter(rng, 3, () => D.hayBale()),
      ...scatter(rng, 5, D.sunflower, frontSpot),
      ...scatter(rng, 5, D.flower, frontSpot),
      ...scatter(rng, 4, D.roundTree),
      { decor: D.sun(), x: 6, y: 5.4, z: -13 },
      ...skyPieces(rng, 2, (r) => D.cloud(r)),
    ],
  },
  space: {
    env: {
      skyTop: 0x0b0a2a,
      skyBottom: 0x3a2a82,
      ground: 0xc8c2e6,
      hemiSky: 0xb9a8ff,
      hemiGround: 0x3a2a82,
      hemiIntensity: 1.3,
      sunColor: 0xe6e0ff,
      sunIntensity: 2.4,
      particles: "stars",
    },
    heroes: ["rocket"],
    decor: (rng) => [
      ...scatter(rng, 8, D.crater),
      ...scatter(rng, 3, D.crater, frontSpot),
      ...scatter(rng, 5, (r) => D.rock(r, 0xa29bc9)),
      ...scatter(rng, 3, D.crystal, frontSpot),
      { decor: D.planet(rng, 1.6), x: -6, y: 4.6, z: -11 },
      { decor: D.planet(rng, 0.8), x: 4.5, y: 5.2, z: -10 },
      { decor: D.planet(rng, 0.5), x: 7.5, y: 3.4, z: -8 },
      ...skyPieces(rng, 4, D.star, 3, 4.8),
    ],
  },
  ocean: {
    env: {
      skyTop: 0x0a6fb8,
      skyBottom: 0x6fd6f0,
      ground: 0xf3d9a4,
      hemiSky: 0x9eeaff,
      hemiGround: 0x2a7fb0,
      hemiIntensity: 1.7,
      sunColor: 0xd6fbff,
      sunIntensity: 1.8,
      particles: "bubbles",
    },
    heroes: ["fish", "whale", "turtle"],
    decor: (rng) => [
      ...scatter(rng, 10, D.seaweed),
      ...scatter(rng, 7, D.coral),
      ...scatter(rng, 3, D.seaweed, frontSpot),
      ...scatter(rng, 3, D.coral, frontSpot),
      ...scatter(rng, 4, D.shell, frontSpot),
      ...scatter(rng, 4, (r) => D.rock(r, 0x8fb8c9)),
    ],
  },
  dinosaurs: {
    env: {
      skyTop: 0xffb56b,
      skyBottom: 0xfff0cc,
      ground: 0x8cc665,
      hemiSky: 0xfff0d0,
      hemiGround: 0x6a8f3a,
      hemiIntensity: 1.6,
      sunColor: 0xffe2b0,
      sunIntensity: 2.4,
      particles: "pollen",
    },
    heroes: ["dino"],
    decor: (rng) => [
      { decor: D.volcano(), x: range(rng, -5, 5), z: -11 },
      ...scatter(rng, 7, D.palmTree),
      ...scatter(rng, 5, D.fern, frontSpot),
      ...scatter(rng, 4, (r) => D.rock(r, 0xb59f8a)),
      ...scatter(rng, 3, D.fern),
      ...skyPieces(rng, 2, (r) => D.cloud(r, 0xfff3e0)),
    ],
  },
  vehicles: {
    env: {
      skyTop: 0x5bb8ff,
      skyBottom: 0xe8f7ff,
      ground: 0x9ad97a,
      hemiSky: 0xe0f4ff,
      hemiGround: 0x6aa84f,
      hemiIntensity: 1.6,
      sunColor: 0xfff4dc,
      sunIntensity: 2.4,
      particles: "pollen",
    },
    heroes: ["car", "train"],
    decor: (rng) => [
      { decor: D.road(30), x: 0, z: 1.8 },
      ...Array.from({ length: 6 }, (_, i) => ({ decor: D.building(rng), x: -7.5 + i * 3 + range(rng, -0.4, 0.4), z: range(rng, -7, -5) })),
      { decor: D.trafficLight(), x: 3.2, z: 0.4, rotY: -0.3 },
      ...scatter(rng, 4, D.roundTree, (r) => ({ x: pick(r, [-1, 1]) * range(r, 4, 7), z: range(r, -3, -1) })),
      ...scatter(rng, 4, D.flower, (r) => ({ x: pick(r, [-1, 1]) * range(r, 2, 5), z: range(r, 3.2, 4.5) })),
      ...skyPieces(rng, 3, (r) => D.cloud(r)),
      { decor: D.sun(), x: -7, y: 5.4, z: -13 },
    ],
  },
  magic: {
    env: {
      skyTop: 0x9a7bff,
      skyBottom: 0xffd6f5,
      ground: 0xa8ebc0,
      hemiSky: 0xffe6ff,
      hemiGround: 0x8a6bd8,
      hemiIntensity: 1.7,
      sunColor: 0xfff0ff,
      sunIntensity: 2.2,
      particles: "sparkles",
    },
    heroes: ["unicorn", "dragon", "wisp"],
    decor: (rng) => [
      { decor: D.castle(), x: range(rng, -2, 2), z: -8 },
      { decor: D.rainbow(), x: range(rng, 3, 6), y: 0, z: -12 },
      ...scatter(rng, 5, D.crystal),
      ...scatter(rng, 4, (r) => D.mushroom(r, 0.35), frontSpot),
      ...scatter(rng, 4, D.flower, frontSpot),
      ...scatter(rng, 4, D.roundTree, (r) => ringSpot(r, 6, 11)),
      ...skyPieces(rng, 3, D.star, 3.5, 5),
      ...skyPieces(rng, 2, (r) => D.cloud(r, 0xfff0fb)),
    ],
  },
  night: {
    env: {
      skyTop: 0x0d1542,
      skyBottom: 0x4a5aa8,
      ground: 0x4f8f74,
      hemiSky: 0x8fa6ff,
      hemiGround: 0x1d3a3a,
      hemiIntensity: 1.3,
      sunColor: 0xc6d4ff,
      sunIntensity: 1.6,
      particles: "fireflies",
    },
    heroes: ["owl", "bunny"],
    decor: (rng) => [
      { decor: D.moon(), x: range(rng, 4, 7), y: 5.2, z: -13 },
      { decor: D.house(true), x: range(rng, -6, -4), z: -4, rotY: 0.4 },
      ...scatter(rng, 9, (r) => D.pineTree(r)),
      ...scatter(rng, 4, (r) => D.bush(r, 0x2f7a55), frontSpot),
      ...scatter(rng, 3, (r) => D.mushroom(r, 0.5), frontSpot),
      ...skyPieces(rng, 4, D.star, 3.8, 5.4),
    ],
  },
  adventure: {
    env: {
      skyTop: 0x6ec2ff,
      skyBottom: 0xfff0c2,
      ground: 0x9fd67c,
      hemiSky: 0xe0f4ff,
      hemiGround: 0x7a9e4c,
      hemiIntensity: 1.6,
      sunColor: 0xfff0d0,
      sunIntensity: 2.4,
      particles: "pollen",
    },
    heroes: ["bear", "fox", "puppy"],
    decor: (rng) => [
      { decor: D.mountain(rng), x: -5, z: -12 },
      { decor: D.mountain(rng, 0x9bb5e0), x: 1, z: -14 },
      { decor: D.mountain(rng), x: 7, z: -11 },
      { decor: D.tent(), x: range(rng, -5, -3.5), z: -1, rotY: 0.4 },
      { decor: D.flag(rng), x: range(rng, 3.5, 5), z: -0.5 },
      { decor: D.signpost(), x: -3.4, z: 2.2, rotY: 0.3 },
      { decor: D.balloon(rng), x: range(rng, 3, 6), y: 3.2, z: -6 },
      ...Array.from({ length: 7 }, (_, i) => ({
        decor: { object: group(part(G.disc(), toon(0xe8cf98), { rot: [-Math.PI / 2, 0, 0], scale: 0.45, shadow: false })) },
        x: Math.sin(i * 0.9) * 1.2,
        y: 0.01,
        z: -1 - i * 1.3,
      })),
      ...scatter(rng, 5, (r) => D.pineTree(r)),
      ...scatter(rng, 3, (r) => D.rock(r)),
      ...scatter(rng, 4, D.flower, frontSpot),
      ...skyPieces(rng, 2, (r) => D.cloud(r)),
    ],
  },
  generic: {
    env: {
      skyTop: 0x7cc8ff,
      skyBottom: 0xfff4e0,
      ground: 0x9be07a,
      hemiSky: 0xe0f4ff,
      hemiGround: 0x6aa84f,
      hemiIntensity: 1.6,
      sunColor: 0xfff0d0,
      sunIntensity: 2.4,
      particles: "pollen",
    },
    heroes: ["bunny", "butterfly", "bird", "kitten"],
    decor: (rng) => [
      { decor: D.sun(), x: -6, y: 5.4, z: -13 },
      { decor: D.rainbow(), x: range(rng, 2, 5), y: 0, z: -13 },
      ...Array.from({ length: 4 }, (_, i) => ({ decor: D.hill(rng, i % 2 ? 0x8ad36b : 0x7cc862), x: -9 + i * 6, z: -12 })),
      ...scatter(rng, 5, D.roundTree),
      ...scatter(rng, 8, D.flower, frontSpot),
      ...scatter(rng, 2, (r) => D.bush(r), frontSpot),
      ...skyPieces(rng, 3, (r) => D.cloud(r)),
    ],
  },
};

export function worldFor(illustrationId: string): WorldDef {
  return WORLDS[illustrationId] ?? WORLDS.generic;
}
