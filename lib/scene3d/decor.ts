import * as THREE from "three";
import { G, eyes, group, part, pick, range, toon, type Rng } from "./kit";

/**
 * Scenery pieces. Like characters, each stands on y = 0 so it can "pop up" from the page.
 * Every piece carries a `userData.tag` ("tree", "moon", "barn"…) so "find it" challenges
 * can ask a child to tap it.
 */
export interface Decor {
  object: THREE.Object3D;
  update?: (t: number) => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function tagged<A extends any[]>(tag: string, build: (...args: A) => Decor): (...args: A) => Decor {
  return (...args) => {
    const decor = build(...args);
    decor.object.userData.tag = tag;
    return decor;
  };
}

const S = Math.sin;
const PI = Math.PI;

function roundTreeBase(rng: Rng): Decor {
  const leaf = pick(rng, [0x4cc26b, 0x5fd17a, 0x3fae5e, 0x7bd88f]);
  const h = range(rng, 1.2, 1.8);
  const crown = group(
    part(G.blob(), toon(leaf), { pos: [0, 0, 0], scale: [0.95, 0.85, 0.95] }),
    part(G.blob(), toon(leaf), { pos: [0.5, -0.2, 0.2], scale: 0.55 }),
    part(G.blob(), toon(leaf), { pos: [-0.45, -0.15, 0.1], scale: 0.6 })
  );
  crown.position.y = h + 0.6;
  if (rng() < 0.4) {
    for (let i = 0; i < 3; i++) {
      const a = rng() * PI * 2;
      crown.add(part(G.sphere(), toon(0xff5d5d), { pos: [Math.cos(a) * 0.8, range(rng, -0.3, 0.3), Math.sin(a) * 0.8], scale: 0.1 }));
    }
  }
  const phase = rng() * 10;
  return {
    object: group(part(G.cylinder(), toon(0x8b5a34), { pos: [0, h / 2, 0], scale: [0.16, h, 0.16] }), crown),
    update: (t) => (crown.rotation.z = S(t * 0.8 + phase) * 0.04),
  };
}

function pineTreeBase(rng: Rng, snowy = false): Decor {
  const color = pick(rng, [0x2f9e5b, 0x3aa865, 0x278c50]);
  const h = range(rng, 0.9, 1.3);
  const tree = group(part(G.cylinder(), toon(0x7a4b2a), { pos: [0, 0.25, 0], scale: [0.14, 0.5, 0.14] }));
  for (let i = 0; i < 3; i++) {
    const w = (1 - i * 0.25) * h;
    tree.add(part(G.cone(), toon(color), { pos: [0, 0.7 + i * 0.55 * h, 0], scale: [w * 0.8, w * 1.1, w * 0.8] }));
    if (snowy) {
      tree.add(part(G.cone(), toon(0xffffff), { pos: [0, 0.95 + i * 0.55 * h, 0], scale: [w * 0.35, w * 0.45, w * 0.35] }));
    }
  }
  return { object: tree };
}

function palmTreeBase(rng: Rng): Decor {
  const h = range(rng, 1.8, 2.6);
  const trunk = group();
  for (let i = 0; i < 6; i++) {
    trunk.add(part(G.cylinder(), toon(i % 2 ? 0xb9824f : 0xa06d3f), { pos: [i * 0.04, (i + 0.5) * (h / 6), 0], scale: [0.14 - i * 0.01, h / 6, 0.14 - i * 0.01] }));
  }
  const top = group();
  top.position.set(0.25, h, 0);
  for (let i = 0; i < 6; i++) {
    const frond = group(part(G.sphere(), toon(0x49b85c), { pos: [0.55, 0, 0], scale: [0.6, 0.06, 0.18] }));
    frond.rotation.set(0, (i / 6) * PI * 2, -0.35);
    top.add(frond);
  }
  top.add(part(G.sphere(), toon(0x7a4b2a), { pos: [0.1, -0.1, 0.1], scale: 0.1 }));
  top.add(part(G.sphere(), toon(0x7a4b2a), { pos: [-0.08, -0.1, 0.05], scale: 0.1 }));
  const phase = rng() * 10;
  return { object: group(trunk, top), update: (t) => (top.rotation.z = S(t * 0.9 + phase) * 0.06) };
}

function mushroomBase(rng: Rng, glow = 0): Decor {
  const cap = pick(rng, [0xff5d5d, 0xff8fab, 0xb18cff, 0x6ec6ff]);
  const s = range(rng, 0.5, 0.9);
  const m = group(
    part(G.cylinder(), toon(0xfff3e0), { pos: [0, 0.2 * s, 0], scale: [0.12 * s, 0.4 * s, 0.12 * s] }),
    part(G.hemisphere(), toon(cap, glow), { pos: [0, 0.38 * s, 0], scale: [0.35 * s, 0.28 * s, 0.35 * s] })
  );
  for (const [x, z] of [[0.15, 0.2], [-0.18, 0.12], [0.02, 0.3]]) {
    m.add(part(G.sphere(), toon(0xffffff), { pos: [x * s, 0.55 * s, z * s], scale: 0.05 * s, shadow: false }));
  }
  return { object: m };
}

function flowerBase(rng: Rng): Decor {
  const petal = toon(pick(rng, [0xff8fab, 0xffd166, 0xb18cff, 0xff6b6b, 0x6ec6ff, 0xffffff]));
  const h = range(rng, 0.3, 0.55);
  const head = group(part(G.sphere(), toon(0xffc93c), { scale: [0.08, 0.08, 0.05] }));
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * PI * 2;
    head.add(part(G.sphere(), petal, { pos: [Math.cos(a) * 0.1, Math.sin(a) * 0.1, -0.01], scale: [0.07, 0.07, 0.03], shadow: false }));
  }
  head.position.y = h;
  head.rotation.x = -0.3;
  const phase = rng() * 10;
  return {
    object: group(part(G.cylinder(), toon(0x49b85c), { pos: [0, h / 2, 0], scale: [0.02, h, 0.02], shadow: false }), head),
    update: (t) => (head.rotation.z = S(t * 1.5 + phase) * 0.2),
  };
}

function sunflowerBase(rng: Rng): Decor {
  const h = range(rng, 1.0, 1.5);
  const head = group(part(G.cylinder(), toon(0x7a4b2a), { rot: [PI / 2, 0, 0], scale: [0.16, 0.06, 0.16] }));
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * PI * 2;
    head.add(part(G.sphere(), toon(0xffc93c), { pos: [Math.cos(a) * 0.24, Math.sin(a) * 0.24, 0], scale: [0.11, 0.05, 0.03], rot: [0, 0, a], shadow: false }));
  }
  head.position.y = h;
  const phase = rng() * 10;
  return {
    object: group(
      part(G.cylinder(), toon(0x49b85c), { pos: [0, h / 2, 0], scale: [0.035, h, 0.035] }),
      part(G.sphere(), toon(0x49b85c), { pos: [0.1, h * 0.5, 0], scale: [0.12, 0.04, 0.07], rot: [0, 0, 0.4] }),
      head
    ),
    update: (t) => (head.rotation.z = S(t + phase) * 0.1),
  };
}

function bushBase(rng: Rng, color = 0x4cc26b): Decor {
  const s = range(rng, 0.4, 0.7);
  return {
    object: group(
      part(G.blob(), toon(color), { pos: [0, s * 0.6, 0], scale: s }),
      part(G.blob(), toon(color), { pos: [s * 0.7, s * 0.45, 0], scale: s * 0.7 }),
      part(G.blob(), toon(color), { pos: [-s * 0.7, s * 0.45, 0], scale: s * 0.7 })
    ),
  };
}

function rockBase(rng: Rng, color = 0xb0a8c0): Decor {
  const s = range(rng, 0.25, 0.55);
  return { object: group(part(G.rock(), toon(color), { pos: [0, s * 0.5, 0], scale: [s, s * 0.8, s], rot: [rng(), rng(), rng()] })) };
}

function cloudBase(rng: Rng, color = 0xffffff): Decor {
  const c = group();
  const n = 3 + Math.floor(rng() * 3);
  for (let i = 0; i < n; i++) {
    c.add(part(G.sphere(), toon(color, 0.15), { pos: [(i - (n - 1) / 2) * 0.55, S(i * 2.1) * 0.15, 0], scale: range(rng, 0.45, 0.7), shadow: false }));
  }
  const speed = range(rng, 0.15, 0.3);
  const phase = rng() * 10;
  return { object: c, update: (t) => (c.position.x = S(t * speed * 0.3 + phase) * 1.5) };
}

function sunBase(): Decor {
  const rays = group();
  for (let i = 0; i < 10; i++) {
    const ray = group(part(G.cone(), toon(0xffd166, 0.9), { pos: [0, 1.25, 0], scale: [0.14, 0.4, 0.06], shadow: false }));
    ray.rotation.z = (i / 10) * PI * 2;
    rays.add(ray);
  }
  const face = group(
    part(G.sphere(), toon(0xffe066, 0.9), { scale: 0.9, shadow: false }),
    eyes(0.09, 0.25, [0, 0.12, 0.82]),
    part(G.torus(0.15, PI), toon(0xe07a1f), { pos: [0, -0.15, 0.86], rot: [0, 0, PI], scale: 0.2, shadow: false })
  );
  const object = group(rays, face);
  object.userData.isSun = true; // hidden on rainy, sunset and night pages
  return { object, update: (t) => (rays.rotation.z = t * 0.3) };
}

function moonBase(): Decor {
  const m = group(
    part(G.sphere(), toon(0xfff6c8, 1.5), { scale: 1.1, shadow: false }),
    part(G.sphere(), toon(0xe9dc9c, 0.6), { pos: [0.35, 0.3, 0.9], scale: [0.2, 0.2, 0.1], shadow: false }),
    part(G.sphere(), toon(0xe9dc9c, 0.6), { pos: [-0.4, -0.25, 0.92], scale: [0.14, 0.14, 0.08], shadow: false }),
    // Sleepy closed eyes
    part(G.torus(0.2, PI), toon(0x7a6a3a), { pos: [-0.3, 0.05, 1.05], scale: 0.12, shadow: false }),
    part(G.torus(0.2, PI), toon(0x7a6a3a), { pos: [0.1, 0.05, 1.08], scale: 0.12, shadow: false })
  );
  return { object: m, update: (t) => (m.rotation.z = S(t * 0.4) * 0.08) };
}

function mountainBase(rng: Rng, color = 0x8fa8d8): Decor {
  const h = range(rng, 3, 5.5);
  const w = h * range(rng, 0.7, 0.95);
  return {
    object: group(
      part(G.cone(), toon(color), { pos: [0, h / 2, 0], scale: [w, h, w] }),
      part(G.cone(), toon(0xffffff), { pos: [0, h * 0.86, 0], scale: [w * 0.3, h * 0.29, w * 0.3] })
    ),
  };
}

export function hill(rng: Rng, color: number): Decor {
  const r = range(rng, 2.5, 4.5);
  return { object: group(part(G.sphere(), toon(color), { pos: [0, 0, 0], scale: [r, r * 0.45, r * 0.8] })) };
}

function houseBase(glowWindows = false): Decor {
  const win = toon(0xfff3a0, glowWindows ? 2 : 0.1);
  return {
    object: group(
      part(G.box(), toon(0xffe0b5), { pos: [0, 0.6, 0], scale: [1.4, 1.2, 1.2] }),
      part(G.pyramid(), toon(0xff6b6b), { pos: [0, 1.6, 0], rot: [0, PI / 4, 0], scale: [1.15, 0.8, 1.15] }),
      part(G.box(), toon(0x8b5a34), { pos: [0, 0.35, 0.61], scale: [0.35, 0.7, 0.02] }),
      part(G.box(), win, { pos: [-0.45, 0.75, 0.61], scale: [0.3, 0.3, 0.02], shadow: false }),
      part(G.box(), win, { pos: [0.45, 0.75, 0.61], scale: [0.3, 0.3, 0.02], shadow: false }),
      part(G.box(), toon(0xb05a5a), { pos: [0.4, 1.8, -0.2], scale: [0.2, 0.5, 0.2] })
    ),
  };
}

function barnBase(): Decor {
  const red = toon(0xe0524f);
  return {
    object: group(
      part(G.box(), red, { pos: [0, 0.9, 0], scale: [2.0, 1.8, 1.6] }),
      part(G.pyramid(), toon(0x8b3a3a), { pos: [0, 2.3, 0], rot: [0, PI / 4, 0], scale: [1.6, 1.0, 1.6] }),
      part(G.box(), toon(0xffffff), { pos: [0, 0.6, 0.81], scale: [0.9, 1.2, 0.02] }),
      part(G.box(), red, { pos: [0, 0.6, 0.82], scale: [0.75, 1.05, 0.02], shadow: false }),
      part(G.box(), toon(0xffffff), { pos: [0, 0.6, 0.83], rot: [0, 0, 0.9], scale: [1.3, 0.08, 0.02], shadow: false }),
      part(G.box(), toon(0xffffff), { pos: [0, 0.6, 0.83], rot: [0, 0, -0.9], scale: [1.3, 0.08, 0.02], shadow: false }),
      part(G.box(), toon(0xfff3a0, 0.3), { pos: [0, 1.55, 0.81], scale: [0.4, 0.4, 0.02], shadow: false })
    ),
  };
}

function fenceBase(length: number): Decor {
  const f = group();
  const wood = toon(0xf1d6a8);
  const posts = Math.max(2, Math.round(length / 0.7));
  for (let i = 0; i < posts; i++) {
    f.add(part(G.box(), wood, { pos: [-length / 2 + (i * length) / (posts - 1), 0.35, 0], scale: [0.1, 0.7, 0.1] }));
  }
  f.add(part(G.box(), wood, { pos: [0, 0.5, 0], scale: [length, 0.08, 0.05] }));
  f.add(part(G.box(), wood, { pos: [0, 0.25, 0], scale: [length, 0.08, 0.05] }));
  return { object: f };
}

function hayBaleBase(): Decor {
  return {
    object: group(
      part(G.cylinder(), toon(0xf2c65b), { pos: [0, 0.35, 0], rot: [0, 0, PI / 2], scale: [0.35, 0.7, 0.35] }),
      part(G.torus(0.08), toon(0xd9a93a), { pos: [0.36, 0.35, 0], rot: [0, PI / 2, 0], scale: 0.22, shadow: false })
    ),
  };
}

function castleBase(): Decor {
  const wall = toon(0xf3e8ff);
  const roof = toon(0xb18cff);
  const c = group(
    part(G.box(), wall, { pos: [0, 1.0, 0], scale: [2.6, 2.0, 1.4] }),
    part(G.box(), toon(0x8b5a34), { pos: [0, 0.5, 0.71], scale: [0.6, 1.0, 0.02] }),
    part(G.cylinder(), toon(0xffd166), { pos: [0, 1.0, 0.715], rot: [PI / 2, 0, 0], scale: [0.3, 0.02, 0.3], shadow: false })
  );
  const flags: THREE.Object3D[] = [];
  for (const [x, h] of [[-1.4, 3.0], [1.4, 3.0], [0, 3.6]]) {
    c.add(part(G.cylinder(), wall, { pos: [x, h / 2, x === 0 ? -0.3 : 0], scale: [0.45, h, 0.45] }));
    c.add(part(G.cone(), roof, { pos: [x, h + 0.55, x === 0 ? -0.3 : 0], scale: [0.6, 1.1, 0.6] }));
    c.add(part(G.box(), toon(0x6ec6ff, 0.5), { pos: [x, h - 0.7, (x === 0 ? -0.3 : 0) + 0.44], scale: [0.18, 0.35, 0.02], shadow: false }));
    const flag = part(G.box(), toon(0xff7ac6), { pos: [x + 0.2, h + 1.25, x === 0 ? -0.3 : 0], scale: [0.35, 0.18, 0.02], shadow: false });
    c.add(flag);
    flags.push(flag);
  }
  return { object: c, update: (t) => flags.forEach((f, i) => (f.rotation.y = S(t * 3 + i) * 0.4)) };
}

function rainbowBase(): Decor {
  const r = group();
  [0xff6b6b, 0xffb347, 0xffe066, 0x7bd88f, 0x6ec6ff, 0xb18cff].forEach((c, i) => {
    r.add(part(G.torus(0.06, PI), toon(c, 0.35), { scale: 3.2 - i * 0.2, shadow: false }));
  });
  return { object: r };
}

function crystalBase(rng: Rng): Decor {
  const color = pick(rng, [0x9be7ff, 0xff9ce6, 0xc3a6ff, 0x9dffc9]);
  const c = group();
  for (let i = 0; i < 3; i++) {
    const h = range(rng, 0.5, 1.1);
    c.add(part(G.pyramid(), toon(color, 1.1), { pos: [(i - 1) * 0.18, h / 2, (i % 2) * 0.1], rot: [0, rng(), (i - 1) * 0.3], scale: [0.14, h, 0.14] }));
  }
  const phase = rng() * 10;
  return { object: c, update: (t) => (c.position.y = 0.1 + S(t * 1.5 + phase) * 0.1) };
}

function planetBase(rng: Rng, radius: number): Decor {
  const color = pick(rng, [0xff9e6b, 0x6ec6ff, 0xb18cff, 0x7bd88f, 0xffd166]);
  const p = group(part(G.sphere(), toon(color, 0.25), { scale: radius, shadow: false }));
  const ring = part(G.torus(0.06), toon(0xfff3c4, 0.3), { rot: [PI / 2.4, 0.2, 0], scale: radius * 1.6, shadow: false });
  if (rng() < 0.7) p.add(ring);
  return { object: p, update: (t) => (p.rotation.y = t * 0.2) };
}

export function crater(rng: Rng): Decor {
  const r = range(rng, 0.4, 0.9);
  return {
    object: group(
      part(G.torus(0.3), toon(0x9d95c2), { pos: [0, 0.02, 0], rot: [PI / 2, 0, 0], scale: [r, r, r * 0.5] }),
      part(G.disc(), toon(0x8a82b0), { pos: [0, 0.01, 0], rot: [-PI / 2, 0, 0], scale: r, shadow: false })
    ),
  };
}

function seaweedBase(rng: Rng): Decor {
  const color = pick(rng, [0x3fbf7f, 0x2fa36b, 0x6bd49a]);
  const segs: THREE.Object3D[] = [];
  let parent: THREE.Object3D = group();
  const root = parent;
  const n = 4 + Math.floor(rng() * 3);
  for (let i = 0; i < n; i++) {
    const seg = group(part(G.sphere(), toon(color), { pos: [0, 0.2, 0], scale: [0.1, 0.25, 0.06] }));
    seg.position.y = i === 0 ? 0 : 0.36;
    parent.add(seg);
    segs.push(seg);
    parent = seg;
  }
  const phase = rng() * 10;
  return { object: root, update: (t) => segs.forEach((s, i) => (s.rotation.z = S(t * 1.2 + phase + i * 0.5) * 0.18)) };
}

function coralBase(rng: Rng): Decor {
  const color = toon(pick(rng, [0xff7aa2, 0xff9e6b, 0xb18cff, 0xffd166]));
  const c = group(part(G.cylinder(), color, { pos: [0, 0.3, 0], scale: [0.09, 0.6, 0.09] }));
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * PI * 2 + rng();
    const h = range(rng, 0.3, 0.6);
    c.add(part(G.cylinder(), color, { pos: [Math.cos(a) * 0.15, 0.5 + h / 2, Math.sin(a) * 0.15], rot: [Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5], scale: [0.06, h, 0.06] }));
    c.add(part(G.sphere(), color, { pos: [Math.cos(a) * 0.32, 0.55 + h, Math.sin(a) * 0.32], scale: 0.08 }));
  }
  return { object: c };
}

function shellBase(rng: Rng): Decor {
  const color = pick(rng, [0xffc2d1, 0xffe0b5, 0xfff3e0]);
  return { object: group(part(G.hemisphere(), toon(color), { pos: [0, 0, 0], scale: [0.2, 0.12, 0.22], rot: [0, rng() * PI, 0] })) };
}

function volcanoBase(): Decor {
  const puffs = [0, 1, 2, 3].map(() => part(G.sphere(), toon(0xe6e1f0), { scale: 0.4, shadow: false }));
  return {
    object: group(
      part(G.cone(), toon(0x9c7b6b), { pos: [0, 1.8, 0], scale: [2.6, 3.6, 2.6] }),
      part(G.cylinder(), toon(0xff7043, 0.6), { pos: [0, 3.55, 0], scale: [0.55, 0.15, 0.55], shadow: false }),
      part(G.cone(), toon(0xff8a50, 0.4), { pos: [0.3, 3.0, 0.9], rot: [0.3, 0, -0.1], scale: [0.25, 1.2, 0.1], shadow: false }),
      ...puffs
    ),
    update: (t) =>
      puffs.forEach((p, i) => {
        const k = (t * 0.25 + i / puffs.length) % 1;
        p.position.set(S(k * 4 + i) * 0.4, 3.8 + k * 2.5, 0);
        p.scale.setScalar(0.3 + k * 0.7);
      }),
  };
}

function fernBase(rng: Rng): Decor {
  const f = group();
  for (let i = 0; i < 5; i++) {
    const leaf = group(part(G.sphere(), toon(0x3fae5e), { pos: [0, 0.4, 0], scale: [0.1, 0.45, 0.04] }));
    leaf.rotation.set(0, (i / 5) * PI * 2, 0.6);
    f.add(leaf);
  }
  f.scale.setScalar(range(rng, 0.8, 1.3));
  return { object: f };
}

export function road(width: number): Decor {
  const r = group(part(G.box(), toon(0x6b6f80), { pos: [0, 0.02, 0], scale: [width, 0.04, 1.6], shadow: false }));
  const dashes: THREE.Object3D[] = [];
  for (let x = -width / 2; x < width / 2; x += 1.2) {
    const d = part(G.box(), toon(0xffffff), { pos: [x, 0.05, 0], scale: [0.6, 0.01, 0.1], shadow: false });
    dashes.push(d);
    r.add(d);
  }
  return {
    object: r,
    // Dashes scroll by, so the whole scene feels like it's driving along.
    update: (t) => dashes.forEach((d, i) => (d.position.x = ((((-width / 2 + i * 1.2 - t * 1.5) % width) + width) % width) - width / 2)),
  };
}

function buildingBase(rng: Rng): Decor {
  const color = pick(rng, [0xffb3c8, 0xffe066, 0x9be7ff, 0xc3a6ff, 0xa6f0c6]);
  const h = range(rng, 1.8, 3.6);
  const b = group(part(G.box(), toon(color), { pos: [0, h / 2, 0], scale: [1.2, h, 1.0] }));
  for (let y = 0.5; y < h - 0.3; y += 0.6) {
    for (const x of [-0.3, 0.3]) {
      b.add(part(G.box(), toon(0xfff3a0, rng() < 0.5 ? 0.6 : 0.05), { pos: [x, y, 0.51], scale: [0.25, 0.3, 0.02], shadow: false }));
    }
  }
  b.add(part(G.box(), toon(0xffffff), { pos: [0, h + 0.05, 0], scale: [1.3, 0.1, 1.1] }));
  return { object: b };
}

function trafficLightBase(): Decor {
  const lamps = [0xff5d5d, 0xffd166, 0x7bd88f].map((c, i) =>
    part(G.sphere(), toon(c, 0.1), { pos: [0, 1.75 - i * 0.22, 0.1], scale: 0.08, shadow: false })
  );
  const lit = [0xff5d5d, 0xffd166, 0x7bd88f].map((c) => toon(c, 1));
  const dim = [0xff5d5d, 0xffd166, 0x7bd88f].map((c) => toon(c, 0.05));
  return {
    object: group(
      part(G.cylinder(), toon(0x4a4f63), { pos: [0, 0.8, 0], scale: [0.05, 1.6, 0.05] }),
      part(G.box(), toon(0x4a4f63), { pos: [0, 1.53, 0], scale: [0.25, 0.7, 0.18] }),
      ...lamps
    ),
    update: (t) => {
      const on = Math.floor(t / 1.5) % 3;
      lamps.forEach((l, i) => (l.material = i === on ? lit[i] : dim[i]));
    },
  };
}

function tentBase(): Decor {
  return {
    object: group(
      part(G.pyramid(), toon(0xff8a50), { pos: [0, 0.6, 0], rot: [0, PI / 4, 0], scale: [1.0, 1.2, 1.0] }),
      part(G.pyramid(), toon(0x7a4b2a), { pos: [0, 0.35, 0.18], rot: [0, PI / 4, 0], scale: [0.4, 0.7, 0.4], shadow: false }),
      part(G.cylinder(), toon(0x7a4b2a), { pos: [0, 1.25, 0], scale: [0.03, 0.3, 0.03] })
    ),
  };
}

function flagBase(rng: Rng): Decor {
  const cloth = part(G.box(), toon(pick(rng, [0xff5d5d, 0xffd166, 0x6ec6ff])), { pos: [0.25, 1.35, 0], scale: [0.5, 0.3, 0.02] });
  return {
    object: group(part(G.cylinder(), toon(0xdddddd), { pos: [0, 0.8, 0], scale: [0.03, 1.6, 0.03] }), cloth),
    update: (t) => (cloth.rotation.y = S(t * 4) * 0.3),
  };
}

function balloonBase(rng: Rng): Decor {
  const color = pick(rng, [0xff6b6b, 0xffb347, 0x6ec6ff, 0xb18cff]);
  const b = group(
    part(G.sphere(), toon(color), { pos: [0, 1.0, 0], scale: [0.7, 0.8, 0.7] }),
    part(G.sphere(), toon(0xffffff), { pos: [0, 1.0, 0], scale: [0.71, 0.2, 0.71], shadow: false }),
    part(G.cylinder(), toon(0x8b5a34), { pos: [0, 0, 0], scale: [0.22, 0.25, 0.22] })
  );
  const phase = rng() * 10;
  return { object: b, update: (t) => (b.position.y = S(t * 0.6 + phase) * 0.3) };
}

function signpostBase(): Decor {
  return {
    object: group(
      part(G.cylinder(), toon(0x8b5a34), { pos: [0, 0.6, 0], scale: [0.05, 1.2, 0.05] }),
      part(G.box(), toon(0xf1d6a8), { pos: [0.2, 1.0, 0.05], rot: [0, 0, 0.1], scale: [0.6, 0.18, 0.04] }),
      part(G.box(), toon(0xf1d6a8), { pos: [-0.2, 0.7, 0.05], rot: [0, 0, -0.1], scale: [0.55, 0.16, 0.04] })
    ),
  };
}

function starBase(rng: Rng): Decor {
  const s = group();
  const color = toon(pick(rng, [0xffe066, 0xfff3a0, 0xffb3e6]), 1.5);
  for (let i = 0; i < 5; i++) {
    const arm = group(part(G.cone(), color, { pos: [0, 0.2, 0], scale: [0.1, 0.3, 0.06], shadow: false }));
    arm.rotation.z = (i / 5) * PI * 2;
    s.add(arm);
  }
  s.add(part(G.sphere(), color, { scale: [0.14, 0.14, 0.07], shadow: false }));
  const phase = rng() * 10;
  return {
    object: s,
    update: (t) => {
      s.rotation.y = S(t + phase) * 0.6;
      s.position.y = S(t * 1.2 + phase) * 0.15;
    },
  };
}

function lilypadBase(rng: Rng): Decor {
  return {
    object: group(
      part(G.cylinder(), toon(0x5fd17a), { pos: [0, 0.02, 0], scale: [range(rng, 0.3, 0.5), 0.03, range(rng, 0.3, 0.5)], shadow: false })
    ),
  };
}

export const roundTree = tagged("tree", roundTreeBase);
export const pineTree = tagged("tree", pineTreeBase);
export const palmTree = tagged("tree", palmTreeBase);
export const mushroom = tagged("mushroom", mushroomBase);
export const flower = tagged("flower", flowerBase);
export const sunflower = tagged("flower", sunflowerBase);
export const bush = tagged("bush", bushBase);
export const rock = tagged("rock", rockBase);
export const cloud = tagged("cloud", cloudBase);
export const sun = tagged("sun", sunBase);
export const moon = tagged("moon", moonBase);
export const mountain = tagged("mountain", mountainBase);
export const house = tagged("house", houseBase);
export const barn = tagged("barn", barnBase);
export const fence = tagged("fence", fenceBase);
export const hayBale = tagged("hay", hayBaleBase);
export const castle = tagged("castle", castleBase);
export const rainbow = tagged("rainbow", rainbowBase);
export const crystal = tagged("crystal", crystalBase);
export const planet = tagged("planet", planetBase);
export const seaweed = tagged("seaweed", seaweedBase);
export const coral = tagged("coral", coralBase);
export const shell = tagged("shell", shellBase);
export const volcano = tagged("volcano", volcanoBase);
export const fern = tagged("fern", fernBase);
export const building = tagged("building", buildingBase);
export const trafficLight = tagged("trafficLight", trafficLightBase);
export const tent = tagged("tent", tentBase);
export const flag = tagged("flag", flagBase);
export const balloon = tagged("balloon", balloonBase);
export const signpost = tagged("signpost", signpostBase);
export const star = tagged("star", starBase);
export const lilypad = tagged("lilypad", lilypadBase);
