import * as THREE from "three";
import type { LandmarkKind } from "./director";
import * as D from "./decor";
import type { Decor } from "./decor";
import { G, group, part, pick, range, toon, type Rng } from "./kit";

/**
 * Set pieces that make a page's picture about *that* page: the pond, the campfire, the treasure.
 * Anything that should glow uses a strong emissive so the bloom pass picks it up.
 */
export interface Landmark {
  decor: Decor;
  /** back = behind the characters, side = beside them, sky = up high, ground = flat under everyone. */
  spot: "back" | "side" | "sky" | "ground";
  /** Scenery within this radius of the landmark is removed so it doesn't poke through. */
  clear: number;
  scale?: number;
}

const S = Math.sin;
const PI = Math.PI;

/** A see-through material owned by one mesh (so it can fade on its own); disposed with the world. */
function ownMaterial<T extends THREE.Material>(mesh: THREE.Mesh, material: T): T {
  mesh.material = material;
  mesh.userData.disposable = true;
  mesh.userData.ownGeometry = false;
  return material;
}

function pond(rng: Rng): Decor {
  const water = part(G.disc(), toon(0x4fc3f7, 0.25), { pos: [0, 0.03, 0], rot: [-PI / 2, 0, 0], scale: [1.7, 1.2, 1], shadow: false });
  const ripple = part(G.torus(0.04), toon(0xffffff), { pos: [0, 0.05, 0], rot: [PI / 2, 0, 0], shadow: false });
  const rippleMat = ownMaterial(ripple, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 }));
  const g = group(water, ripple);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * PI * 2;
    g.add(part(G.rock(), toon(pick(rng, [0xb0a8c0, 0xc4bdd1, 0x9f98b0])), { pos: [Math.cos(a) * 1.75, 0.08, Math.sin(a) * 1.25], scale: range(rng, 0.14, 0.24), rot: [rng(), rng(), rng()] }));
  }
  const pads = [0, 1, 2].map((i) => {
    const pad = group(part(G.cylinder(), toon(0x5fd17a), { scale: [0.28, 0.02, 0.28], shadow: false }));
    if (i === 0) pad.add(part(G.sphere(), toon(0xff8fab, 0.4), { pos: [0, 0.08, 0], scale: [0.1, 0.07, 0.1], shadow: false }));
    pad.position.set(range(rng, -0.9, 0.9), 0.05, range(rng, -0.6, 0.6));
    g.add(pad);
    return pad;
  });
  for (const [x, z] of [[-1.5, -0.7], [-1.35, -0.9], [1.4, -0.8]]) {
    g.add(part(G.cylinder(), toon(0x49b85c), { pos: [x, 0.4, z], scale: [0.025, 0.8, 0.025] }));
    g.add(part(G.cylinder(), toon(0x8b5a34), { pos: [x, 0.75, z], scale: [0.05, 0.2, 0.05] }));
  }
  return {
    object: g,
    update: (t) => {
      const k = (t * 0.5) % 1;
      ripple.scale.set(0.2 + k * 1.2, 0.15 + k * 0.85, 1);
      rippleMat.opacity = 0.6 * (1 - k);
      pads.forEach((p, i) => (p.rotation.y = S(t * 0.3 + i) * 0.4));
    },
  };
}

function campfire(): Decor {
  const flames = [
    part(G.cone(), toon(0xff7a1a, 2.2), { pos: [0, 0.45, 0], scale: [0.3, 0.7, 0.3], shadow: false }),
    part(G.cone(), toon(0xffc93c, 2.6), { pos: [0.05, 0.4, 0.05], scale: [0.18, 0.5, 0.18], shadow: false }),
    part(G.cone(), toon(0xfff3a0, 3), { pos: [-0.03, 0.32, 0], scale: [0.09, 0.3, 0.09], shadow: false }),
  ];
  const g = group(
    part(G.cylinder(), toon(0x7a4b2a), { pos: [0, 0.12, 0], rot: [0, 0.5, PI / 2], scale: [0.09, 0.8, 0.09] }),
    part(G.cylinder(), toon(0x8b5a34), { pos: [0, 0.12, 0], rot: [0, -0.7, PI / 2], scale: [0.09, 0.8, 0.09] }),
    ...flames
  );
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * PI * 2;
    g.add(part(G.rock(), toon(0x9f98b0), { pos: [Math.cos(a) * 0.55, 0.08, Math.sin(a) * 0.55], scale: 0.13 }));
  }
  // Two logs to sit on.
  g.add(part(G.cylinder(), toon(0x8b5a34), { pos: [-1.1, 0.15, 0.3], rot: [PI / 2, 0.5, 0], scale: [0.16, 0.8, 0.16] }));
  g.add(part(G.cylinder(), toon(0x8b5a34), { pos: [1.1, 0.15, 0.2], rot: [PI / 2, -0.4, 0], scale: [0.16, 0.8, 0.16] }));
  return {
    object: g,
    update: (t) =>
      flames.forEach((f, i) => {
        const base = [0.7, 0.5, 0.3][i];
        f.scale.y = base * (0.85 + S(t * (11 + i * 3)) * 0.12 + S(t * 7.3 + i) * 0.08);
        f.rotation.y = t * (1 + i);
      }),
  };
}

function treasure(rng: Rng): Decor {
  const wood = toon(0x9c5f2e);
  const gold = toon(0xffc93c, 0.9);
  const lid = group(
    part(G.box(), wood, { pos: [0, 0.12, -0.3], scale: [1.0, 0.24, 0.62] }),
    part(G.box(), gold, { pos: [0, 0.12, -0.3], scale: [0.12, 0.26, 0.64] })
  );
  lid.position.set(0, 0.55, 0.3);
  lid.rotation.x = -1.1;
  const gems = [0xff5d8f, 0x6ec6ff, 0x7bd88f, 0xb18cff].map((c, i) =>
    part(G.pyramid(), toon(c, 1.4), { pos: [-0.3 + i * 0.2, 0.62, (i % 2) * 0.1 - 0.05], scale: [0.08, 0.14, 0.08], shadow: false })
  );
  const g = group(
    part(G.box(), wood, { pos: [0, 0.28, 0], scale: [1.0, 0.56, 0.6] }),
    part(G.box(), gold, { pos: [0, 0.28, 0], scale: [1.02, 0.08, 0.62] }),
    part(G.box(), gold, { pos: [0, 0.45, 0.31], scale: [0.14, 0.16, 0.02] }),
    part(G.sphere(), gold, { pos: [0, 0.58, 0], scale: [0.45, 0.08, 0.26], shadow: false }),
    lid,
    ...gems
  );
  for (let i = 0; i < 7; i++) {
    g.add(part(G.cylinder(), gold, { pos: [range(rng, -0.9, 0.9), 0.03, range(rng, 0.4, 0.9)], rot: [range(rng, -0.3, 0.3), 0, 0], scale: [0.09, 0.03, 0.09], shadow: false }));
  }
  return {
    object: g,
    update: (t) => gems.forEach((gem, i) => {
      gem.rotation.y = t * 1.5 + i;
      gem.position.y = 0.66 + S(t * 2 + i) * 0.05;
    }),
  };
}

function treehouse(night: boolean): Decor {
  const leaf = toon(0x4cc26b);
  const window = toon(0xfff3a0, night ? 2 : 0.2);
  return {
    object: group(
      part(G.cylinder(), toon(0x8b5a34), { pos: [0, 1.6, 0], scale: [0.45, 3.2, 0.45] }),
      part(G.blob(), leaf, { pos: [0, 4.2, -0.3], scale: [2.0, 1.4, 1.7] }),
      part(G.blob(), toon(0x3fae5e), { pos: [1.3, 3.8, -0.2], scale: 1.0 }),
      part(G.blob(), toon(0x5fd17a), { pos: [-1.3, 3.9, -0.1], scale: 1.1 }),
      part(G.box(), toon(0xc98a52), { pos: [0, 2.3, 0.25], scale: [1.9, 0.12, 1.4] }),
      part(G.box(), toon(0xffe0b5), { pos: [0, 2.85, 0.25], scale: [1.3, 1.0, 1.0] }),
      part(G.pyramid(), toon(0xff6b6b), { pos: [0, 3.65, 0.25], rot: [0, PI / 4, 0], scale: [1.1, 0.7, 1.1] }),
      part(G.box(), window, { pos: [-0.3, 2.9, 0.76], scale: [0.3, 0.3, 0.02], shadow: false }),
      part(G.box(), toon(0x8b5a34), { pos: [0.3, 2.75, 0.76], scale: [0.3, 0.6, 0.02], shadow: false }),
      part(G.cylinder(), toon(0xb07a4a), { pos: [0.55, 1.15, 1.0], rot: [0.12, 0, 0], scale: [0.04, 2.3, 0.04] }),
      part(G.cylinder(), toon(0xb07a4a), { pos: [0.95, 1.15, 1.0], rot: [0.12, 0, 0], scale: [0.04, 2.3, 0.04] }),
      ...[0.3, 0.8, 1.3, 1.8].map((y) =>
        part(G.box(), toon(0xb07a4a), { pos: [0.75, y, 1.0 - (y - 1.15) * 0.12], scale: [0.4, 0.05, 0.06] })
      )
    ),
  };
}

function cave(): Decor {
  const crystals = [0x9be7ff, 0xff9ce6, 0xc3a6ff].map((c, i) =>
    part(G.pyramid(), toon(c, 1.3), { pos: [-0.9 + i * 0.9, 0.3, 1.25 + (i % 2) * 0.1], rot: [0, i, (i - 1) * 0.3], scale: [0.12, 0.6, 0.12], shadow: false })
  );
  crystals.forEach((c) => (c.userData.tag = "crystal"));
  return {
    object: group(
      part(G.blob(), toon(0x9d93b5), { pos: [0, 0.9, 0], scale: [2.4, 1.9, 1.6] }),
      part(G.blob(), toon(0x8a80a3), { pos: [1.6, 0.6, 0.2], scale: [1.2, 1.1, 1.1] }),
      part(G.blob(), toon(0xaaa0c2), { pos: [-1.7, 0.5, 0.3], scale: [1.0, 0.9, 1.0] }),
      part(G.disc(), toon(0x1e1830), { pos: [0, 0.75, 1.52], scale: [0.85, 0.95, 1], shadow: false }),
      ...crystals
    ),
    update: (t) => crystals.forEach((c, i) => (c.scale.y = 0.6 + S(t * 2 + i) * 0.05)),
  };
}

function bridge(): Decor {
  const water = part(G.box(), toon(0x4fc3f7, 0.25), { pos: [0, 0.03, 0], scale: [40, 0.04, 1.8], shadow: false });
  const sparkles = [0, 1, 2, 3, 4, 5].map((i) =>
    part(G.box(), toon(0xffffff, 0.6), { pos: [-6 + i * 2.4, 0.06, (i % 2) * 0.5 - 0.25], scale: [0.5, 0.01, 0.05], shadow: false })
  );
  const g = group(water, ...sparkles);
  for (let i = 0; i < 9; i++) {
    const x = -1.4 + i * 0.35;
    const y = 0.15 + Math.cos(((i - 4) / 4) * (PI / 2)) * 0.45;
    g.add(part(G.box(), toon(i % 2 ? 0xc98a52 : 0xb07a4a), { pos: [x, y, 0], rot: [0, 0, -(i - 4) * 0.12], scale: [0.33, 0.08, 1.1] }));
    if (i % 2 === 0) {
      for (const z of [-0.5, 0.5]) g.add(part(G.cylinder(), toon(0x8b5a34), { pos: [x, y + 0.3, z], scale: [0.04, 0.6, 0.04] }));
    }
  }
  for (const z of [-0.5, 0.5]) {
    g.add(part(G.torus(0.02, PI), toon(0x8b5a34), { pos: [0, 0.35, z], scale: [1.45, 0.6, 1], shadow: false }));
  }
  return {
    object: g,
    update: (t) => sparkles.forEach((s, i) => (s.position.x = ((((-6 + i * 2.4 + t * 0.8) % 14) + 14) % 14) - 7)),
  };
}

function boat(): Decor {
  const sail = part(G.pyramid(), toon(0xffffff), { pos: [0.1, 1.2, 0], rot: [0, PI / 4, 0], scale: [0.55, 1.2, 0.04] });
  const g = group(
    part(G.hemisphere(), toon(0xff6b6b), { pos: [0, 0.45, 0], rot: [PI, 0, 0], scale: [1.1, 0.45, 0.5] }),
    part(G.cylinder(), toon(0xfff3e0), { pos: [0, 0.45, 0], scale: [1.1, 0.06, 0.5] }),
    part(G.cylinder(), toon(0x8b5a34), { pos: [0, 1.15, 0], scale: [0.04, 1.5, 0.04] }),
    sail,
    part(G.box(), toon(0x6ec6ff), { pos: [0, 1.95, 0], scale: [0.3, 0.16, 0.02] })
  );
  return { object: g, update: (t) => (g.rotation.z = S(t * 1.1) * 0.06) };
}

function lighthouse(night: boolean): Decor {
  const beamMesh = part(G.cone(), toon(0xfff3a0), { pos: [0, 0, 2.2], rot: [-PI / 2, 0, 0], scale: [0.7, 4.4, 0.7], shadow: false });
  ownMaterial(beamMesh, new THREE.MeshBasicMaterial({ color: 0xfff3a0, transparent: true, opacity: night ? 0.3 : 0.12, depthWrite: false }));
  const beam = group(beamMesh);
  beam.position.y = 3.25;
  const g = group(
    part(G.cylinder(), toon(0xb0a8c0), { pos: [0, 0.2, 0], scale: [0.9, 0.4, 0.9] }),
    ...[0, 1, 2, 3].map((i) =>
      part(G.cylinder(), toon(i % 2 ? 0xffffff : 0xff5d5d), { pos: [0, 0.65 + i * 0.6, 0], scale: [0.62 - i * 0.07, 0.6, 0.62 - i * 0.07] })
    ),
    part(G.cylinder(), toon(0x3a3f55), { pos: [0, 3.0, 0], scale: [0.5, 0.1, 0.5] }),
    part(G.cylinder(), toon(0xfff3a0, 2.5), { pos: [0, 3.25, 0], scale: [0.3, 0.4, 0.3], shadow: false }),
    part(G.cone(), toon(0xff5d5d), { pos: [0, 3.7, 0], scale: [0.45, 0.5, 0.45] }),
    beam
  );
  return { object: g, update: (t) => (beam.rotation.y = t * 0.9) };
}

function party(rng: Rng): Decor {
  const flames = [-0.15, 0, 0.15].map((x) =>
    part(G.sphere(), toon(0xffc93c, 2.5), { pos: [x, 1.55, 0], scale: [0.04, 0.07, 0.04], shadow: false })
  );
  const balloons = [0xff6b6b, 0x6ec6ff, 0xffd166, 0xb18cff].map((c, i) => {
    const b = group(
      part(G.sphere(), toon(c, 0.2), { pos: [0, 0, 0], scale: [0.25, 0.3, 0.25] }),
      part(G.cylinder(), toon(0xffffff), { pos: [0, -0.8, 0], scale: [0.008, 1.1, 0.008], shadow: false })
    );
    b.position.set(i < 2 ? -1.7 + i * 0.3 : 1.5 + (i - 2) * 0.35, 2.1 + (i % 2) * 0.3, -0.2);
    return b;
  });
  const g = group(
    part(G.cylinder(), toon(0xffffff), { pos: [0, 0.75, 0], scale: [0.9, 0.06, 0.9] }),
    part(G.cylinder(), toon(0xb07a4a), { pos: [0, 0.37, 0], scale: [0.08, 0.72, 0.08] }),
    part(G.cylinder(), toon(0xffb3c8), { pos: [0, 0.95, 0], scale: [0.5, 0.35, 0.5] }),
    part(G.cylinder(), toon(0xfff3e0), { pos: [0, 1.25, 0], scale: [0.34, 0.28, 0.34] }),
    part(G.sphere(), toon(0xff5d5d), { pos: [0, 1.42, 0], scale: 0.07 }),
    ...[-0.15, 0, 0.15].map((x) => part(G.cylinder(), toon(0x9be7ff), { pos: [x, 1.46, 0], scale: [0.02, 0.14, 0.02], shadow: false })),
    ...flames,
    ...balloons
  );
  // Bunting between two poles.
  for (const x of [-2.3, 2.3]) g.add(part(G.cylinder(), toon(0xf1d6a8), { pos: [x, 1.1, -0.8], scale: [0.04, 2.2, 0.04] }));
  for (let i = 0; i < 9; i++) {
    const x = -2.0 + i * 0.5;
    const sag = Math.cos(((i - 4) / 4) * (PI / 2)) * 0.35;
    g.add(part(G.pyramid(), toon(pick(rng, [0xff6b6b, 0xffd166, 0x6ec6ff, 0x7bd88f, 0xff9ce6])), { pos: [x, 2.0 - sag, -0.8], rot: [PI, 0, 0], scale: [0.18, 0.3, 0.03], shadow: false }));
  }
  return {
    object: g,
    update: (t) => {
      flames.forEach((f, i) => (f.scale.y = 0.07 + S(t * 12 + i) * 0.015));
      balloons.forEach((b, i) => {
        b.position.y = 2.1 + (i % 2) * 0.3 + S(t * 1.2 + i) * 0.12;
        b.rotation.z = S(t + i) * 0.1;
      });
    },
  };
}

function shootingStar(): Decor {
  const star = D.star(() => 0.2).object;
  star.scale.setScalar(2.2);
  star.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) (o as THREE.Mesh).material = toon(0xfff3a0, 2.5);
  });
  const tail = part(G.cone(), toon(0xffffff), { pos: [-1.2, 0.5, 0], rot: [0, 0, PI / 2 + 0.4], scale: [0.18, 2.4, 0.18], shadow: false });
  const tailMat = ownMaterial(tail, new THREE.MeshBasicMaterial({ color: 0xfff6c8, transparent: true, opacity: 0.7, depthWrite: false }));
  const mover = group(star, tail);
  return {
    object: group(mover),
    update: (t) => {
      const k = (t / 4.5) % 1;
      mover.position.set(-5 + k * 10, 1.2 - k * 2.4, 0);
      const fade = k < 0.1 ? k / 0.1 : k > 0.85 ? (1 - k) / 0.15 : 1;
      mover.scale.setScalar(Math.max(0.001, fade));
      tailMat.opacity = 0.7 * fade;
    },
  };
}

function snowman(): Decor {
  const white = toon(0xffffff);
  const coal = toon(0x2b2b35);
  const scarf = toon(0xff5d5d);
  const arms = [-1, 1].map((s) => part(G.cylinder(), toon(0x7a4b2a), { pos: [s * 0.55, 1.2, 0], rot: [0, 0, -s * 1.0], scale: [0.03, 0.7, 0.03] }));
  return {
    object: group(
      part(G.sphere(), white, { pos: [0, 0.45, 0], scale: 0.5 }),
      part(G.sphere(), white, { pos: [0, 1.15, 0], scale: 0.38 }),
      part(G.sphere(), white, { pos: [0, 1.7, 0], scale: 0.28 }),
      part(G.torus(0.25), scarf, { pos: [0, 1.46, 0], rot: [PI / 2, 0, 0], scale: 0.26 }),
      part(G.box(), scarf, { pos: [0.15, 1.3, 0.25], rot: [0, 0, 0.2], scale: [0.1, 0.35, 0.05] }),
      part(G.cone(), toon(0xff8a3d), { pos: [0, 1.7, 0.36], rot: [PI / 2, 0, 0], scale: [0.05, 0.25, 0.05] }),
      part(G.sphere(), coal, { pos: [-0.1, 1.8, 0.24], scale: 0.035 }),
      part(G.sphere(), coal, { pos: [0.1, 1.8, 0.24], scale: 0.035 }),
      ...[1.25, 1.1, 0.95].map((y) => part(G.sphere(), coal, { pos: [0, y, 0.37], scale: 0.035 })),
      part(G.cylinder(), coal, { pos: [0, 1.95, 0], scale: [0.3, 0.04, 0.3] }),
      part(G.cylinder(), coal, { pos: [0, 2.1, 0], scale: [0.2, 0.3, 0.2] }),
      ...arms
    ),
    update: (t) => (arms[1].rotation.z = -1.0 - Math.max(0, S(t * 2)) * 0.6),
  };
}

function flowerPatch(rng: Rng): Decor {
  const g = group();
  const flowers: Decor[] = [];
  for (let i = 0; i < 22; i++) {
    const f = D.flower(rng);
    const a = rng() * PI * 2;
    const r = Math.sqrt(rng()) * 1.4;
    f.object.position.set(Math.cos(a) * r, 0, Math.sin(a) * r * 0.8);
    f.object.scale.setScalar(range(rng, 1.2, 1.8));
    g.add(f.object);
    flowers.push(f);
  }
  return { object: g, update: (t) => flowers.forEach((f) => f.update?.(t)) };
}

function playground(): Decor {
  const frame = toon(0x6ec6ff);
  const seats = [-0.45, 0.45].map((x) => {
    const swing = group(
      part(G.cylinder(), toon(0xcccccc), { pos: [-0.15, -0.6, 0], scale: [0.012, 1.2, 0.012], shadow: false }),
      part(G.cylinder(), toon(0xcccccc), { pos: [0.15, -0.6, 0], scale: [0.012, 1.2, 0.012], shadow: false }),
      part(G.box(), toon(0xff6b6b), { pos: [0, -1.2, 0], scale: [0.4, 0.05, 0.22] })
    );
    swing.position.set(x - 1.2, 1.8, 0);
    return swing;
  });
  return {
    object: group(
      // Swing set
      ...[-2.2, -0.2].flatMap((x) => [
        part(G.cylinder(), frame, { pos: [x, 0.9, 0.35], rot: [-0.35, 0, 0], scale: [0.05, 1.9, 0.05] }),
        part(G.cylinder(), frame, { pos: [x, 0.9, -0.35], rot: [0.35, 0, 0], scale: [0.05, 1.9, 0.05] }),
      ]),
      part(G.cylinder(), frame, { pos: [-1.2, 1.8, 0], rot: [0, 0, PI / 2], scale: [0.05, 2.1, 0.05] }),
      ...seats,
      // Slide
      part(G.box(), toon(0xffd166), { pos: [1.3, 1.1, 0], scale: [0.7, 0.08, 0.7] }),
      ...[[1.0, -0.3], [1.6, -0.3], [1.0, 0.3], [1.6, 0.3]].map(([x, z]) =>
        part(G.cylinder(), toon(0xff9ce6), { pos: [x, 0.55, z], scale: [0.04, 1.1, 0.04] })
      ),
      part(G.box(), toon(0x7bd88f), { pos: [2.25, 0.6, 0], rot: [0, 0, -0.55], scale: [1.4, 0.06, 0.5] })
    ),
    update: (t) => seats.forEach((s, i) => (s.rotation.x = S(t * 1.8 + i * 1.3) * 0.5)),
  };
}

function bed(night: boolean): Decor {
  return {
    object: group(
      part(G.box(), toon(0xc98a52), { pos: [0, 0.25, 0], scale: [1.1, 0.3, 1.8] }),
      part(G.box(), toon(0xc98a52), { pos: [0, 0.55, -0.9], scale: [1.1, 0.9, 0.1] }),
      part(G.box(), toon(0xffffff), { pos: [0, 0.45, 0], scale: [1.0, 0.14, 1.7] }),
      part(G.box(), toon(0x8fb8ff), { pos: [0, 0.54, 0.25], scale: [1.04, 0.1, 1.2] }),
      part(G.box(), toon(0xffe066), { pos: [0, 0.6, 0.25], scale: [0.14, 0.02, 1.2], shadow: false }),
      part(G.sphere(), toon(0xffffff), { pos: [0, 0.6, -0.6], scale: [0.35, 0.1, 0.2] }),
      // Night stand + lamp
      part(G.box(), toon(0xb07a4a), { pos: [0.9, 0.3, -0.6], scale: [0.4, 0.6, 0.4] }),
      part(G.cylinder(), toon(0xffe0b5), { pos: [0.9, 0.7, -0.6], scale: [0.03, 0.2, 0.03] }),
      part(G.cone(), toon(0xfff3a0, night ? 2.2 : 0.4), { pos: [0.9, 0.88, -0.6], scale: [0.18, 0.2, 0.18], shadow: false })
    ),
  };
}

function path(rng: Rng): Decor {
  const g = group();
  for (let i = 0; i < 9; i++) {
    g.add(
      part(G.cylinder(), toon(pick(rng, [0xe8cf98, 0xf1dcae, 0xdcc08a])), {
        pos: [Math.sin(i * 0.8) * 1.0, 0.02, 3.5 - i * 1.2],
        scale: [range(rng, 0.35, 0.5), 0.03, range(rng, 0.3, 0.4)],
        shadow: false,
      })
    );
  }
  return { object: g };
}

export function buildLandmark(kind: LandmarkKind, rng: Rng, night: boolean): Landmark {
  switch (kind) {
    case "pond":
      return { decor: pond(rng), spot: "side", clear: 2.6, scale: 1.3 };
    case "campfire":
      return { decor: campfire(), spot: "side", clear: 1.6 };
    case "treasure":
      return { decor: treasure(rng), spot: "side", clear: 1.4 };
    case "treehouse":
      return { decor: treehouse(night), spot: "back", clear: 2.6 };
    case "cave":
      return { decor: cave(), spot: "back", clear: 2.8 };
    case "bridge":
      return { decor: bridge(), spot: "back", clear: 1.6 };
    case "boat":
      return { decor: boat(), spot: "side", clear: 1.4 };
    case "lighthouse":
      return { decor: lighthouse(night), spot: "back", clear: 1.8 };
    case "party":
      return { decor: party(rng), spot: "back", clear: 2.6 };
    case "shootingStar":
      return { decor: shootingStar(), spot: "sky", clear: 0 };
    case "snowman":
      return { decor: snowman(), spot: "side", clear: 1.2 };
    case "flowerPatch":
      return { decor: flowerPatch(rng), spot: "side", clear: 1.6 };
    case "playground":
      return { decor: playground(), spot: "back", clear: 3 };
    case "bed":
      return { decor: bed(night), spot: "side", clear: 1.5 };
    case "house":
      return { decor: D.house(night), spot: "back", clear: 2.2 };
    case "castle":
      return { decor: D.castle(), spot: "back", clear: 3.2, scale: 0.75 };
    case "rainbow":
      return { decor: D.rainbow(), spot: "sky", clear: 0 };
    case "balloon":
      return { decor: D.balloon(rng), spot: "sky", clear: 0 };
    case "mountain":
      return { decor: D.mountain(rng), spot: "back", clear: 3.5, scale: 0.8 };
    case "volcano":
      return { decor: D.volcano(), spot: "back", clear: 3.5, scale: 0.7 };
    case "tent":
      return { decor: D.tent(), spot: "side", clear: 1.4, scale: 1.3 };
    case "path":
      return { decor: path(rng), spot: "ground", clear: 0 };
  }
}
