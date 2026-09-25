import * as THREE from "three";
import type { Mood } from "./director";
import type { Environment, ParticleKind } from "./worlds";

/** Everything about a page's lighting and atmosphere: the world's base look with the mood applied. */
export interface Look {
  skyTop: number;
  skyBottom: number;
  hemiSky: number;
  hemiGround: number;
  hemiIntensity: number;
  sunColor: number;
  sunIntensity: number;
  sunPosition: [number, number, number];
  ground: number;
  particles: ParticleKind[];
  night: boolean;
  /** How strongly glowing things bloom. Night scenes glow the most. */
  bloom: number;
}

const DAY_SUN: [number, number, number] = [6, 12, 8];

function mix(a: number, b: number, t: number): number {
  return new THREE.Color(a).lerp(new THREE.Color(b), t).getHex();
}

export function lookFor(env: Environment, mood: Mood, world: string, sparkle: boolean): Look {
  const base: Look = { ...env, sunPosition: DAY_SUN, particles: [env.particles], night: world === "night", bloom: 0.2 };
  if (world === "night" || world === "space") base.bloom = 0.8;
  if (world === "magic") base.bloom = 0.35;
  if (world === "space") return base;

  let look = base;
  switch (mood) {
    case "morning":
      look = {
        ...base,
        skyTop: 0x8fc9ff,
        skyBottom: 0xffd9c2,
        hemiSky: 0xfff0e6,
        sunColor: 0xffc7a0,
        sunIntensity: 2.1,
        sunPosition: [-11, 5, 7],
        bloom: 0.25,
      };
      break;
    case "sunset":
      look = {
        ...base,
        skyTop: 0x5b4b9e,
        skyBottom: 0xff9a5c,
        hemiSky: 0xffc49a,
        hemiGround: 0x6a4a6a,
        hemiIntensity: 1.2,
        sunColor: 0xff9a5c,
        sunIntensity: 2.3,
        sunPosition: [10, 4, 5],
        bloom: 0.6,
      };
      break;
    case "night":
      look =
        world === "ocean"
          ? {
              ...base,
              skyTop: 0x02132e,
              skyBottom: 0x0b4d7a,
              hemiSky: 0x5f8fff,
              hemiGround: 0x0a2440,
              hemiIntensity: 1.0,
              sunColor: 0x8fb4ff,
              sunIntensity: 1.0,
              particles: ["bubbles", "fireflies"],
              night: true,
              bloom: 0.9,
            }
          : {
              ...base,
              skyTop: 0x0a1033,
              skyBottom: 0x2c3a7a,
              hemiSky: 0x7f95ff,
              hemiGround: 0x1a2340,
              hemiIntensity: 1.0,
              sunColor: 0x9fb4ff,
              sunIntensity: 1.2,
              sunPosition: [-6, 10, 6],
              particles: ["stars", "fireflies"],
              night: true,
              bloom: 0.9,
            };
      break;
    case "rain":
      look = {
        ...base,
        skyTop: 0x71849e,
        skyBottom: 0xc5cfdb,
        hemiSky: 0xd5deea,
        hemiIntensity: 1.4,
        sunColor: 0xdfe6f0,
        sunIntensity: 1.0,
        bloom: 0,
        ground: mix(env.ground, 0x5f8f6a, 0.3),
        particles: ["rain"],
      };
      break;
    case "snow":
      look = {
        ...base,
        skyTop: 0xa9c7e8,
        skyBottom: 0xf0f6ff,
        hemiSky: 0xf2f6ff,
        hemiGround: 0xb8c6de,
        hemiIntensity: 1.2,
        sunColor: 0xfff8f0,
        sunIntensity: 1.5,
        ground: mix(env.ground, 0xf4f8ff, 0.7),
        particles: ["snow"],
        bloom: 0,
      };
      break;
  }
  if (sparkle && !look.particles.includes("fireflies") && !look.particles.includes("sparkles")) {
    look = { ...look, particles: [...look.particles, look.night ? "fireflies" : "sparkles"] };
  }
  return look;
}
