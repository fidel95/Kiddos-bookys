import * as THREE from "three";
import { G, cheeks, eyes, getDotTexture, group, part, toon } from "./kit";

/**
 * Cute characters built from primitives. Every model stands on y = 0 and faces the camera (+z).
 * `update` drives the character's own idle animation (tail wags, wing flaps); the stage adds
 * placement, bobbing, pop-up transitions and tap reactions on wrapper groups around `model`.
 */
export interface Actor {
  model: THREE.Group;
  update?: (t: number) => void;
  /** Placed in the air instead of on the ground. */
  flying?: boolean;
  /** Rough height, used for spacing and for where tap sparkles appear. */
  height: number;
}

export type CharacterKind =
  | "fox"
  | "bunny"
  | "owl"
  | "deer"
  | "puppy"
  | "kitten"
  | "bear"
  | "bird"
  | "fish"
  | "whale"
  | "turtle"
  | "dino"
  | "dragon"
  | "unicorn"
  | "rocket"
  | "car"
  | "train"
  | "butterfly"
  | "wisp";

const S = Math.sin;
const PI = Math.PI;

function legs(color: number, points: Array<[number, number]>, height: number, radius: number) {
  const g = group();
  for (const [x, z] of points) {
    g.add(part(G.cylinder(), toon(color), { pos: [x, height / 2, z], scale: [radius, height, radius] }));
  }
  return g;
}

function fox(): Actor {
  const orange = toon(0xf5893a);
  const cream = toon(0xfff3e0);
  const dark = toon(0x3b2416);
  const body = part(G.sphere(), orange, { pos: [0, 0.55, 0], scale: [0.42, 0.4, 0.52] });
  const belly = part(G.sphere(), cream, { pos: [0, 0.5, 0.2], scale: [0.3, 0.3, 0.36] });
  const head = group(
    part(G.sphere(), orange, { scale: [0.4, 0.36, 0.36] }),
    part(G.cone(), cream, { pos: [0, -0.09, 0.33], rot: [PI / 2, 0, 0], scale: [0.15, 0.3, 0.13] }),
    part(G.sphere(), dark, { pos: [0, -0.09, 0.49], scale: 0.055 }),
    eyes(0.075, 0.15, [0, 0.06, 0.28]),
    cheeks(0.07, 0.25, [0, -0.08, 0.26])
  );
  for (const s of [-1, 1]) {
    head.add(part(G.cone(), orange, { pos: [s * 0.2, 0.34, -0.02], rot: [0, 0, -s * 0.3], scale: [0.13, 0.32, 0.1] }));
    head.add(part(G.cone(), cream, { pos: [s * 0.19, 0.32, 0.04], rot: [0, 0, -s * 0.3], scale: [0.07, 0.2, 0.04] }));
  }
  head.position.set(0, 1.02, 0.22);
  const tail = group(
    part(G.sphere(), orange, { pos: [0, 0.28, 0], scale: [0.17, 0.38, 0.17] }),
    part(G.sphere(), cream, { pos: [0, 0.6, 0], scale: [0.13, 0.15, 0.13] })
  );
  tail.position.set(0, 0.55, -0.45);
  tail.rotation.x = -0.7;
  const model = group(
    body,
    belly,
    head,
    tail,
    legs(0x3b2416, [[-0.2, 0.25], [0.2, 0.25], [-0.2, -0.22], [0.2, -0.22]], 0.3, 0.07)
  );
  return {
    model,
    height: 1.4,
    update: (t) => {
      tail.rotation.z = S(t * 5) * 0.45;
      head.rotation.y = S(t * 0.8) * 0.3;
      head.rotation.z = S(t * 1.3) * 0.06;
    },
  };
}

function bunny(): Actor {
  const fur = toon(0xf4f1f8);
  const pink = toon(0xffb3c8);
  const body = part(G.sphere(), fur, { pos: [0, 0.45, 0], scale: [0.4, 0.42, 0.4] });
  const ears = group();
  for (const s of [-1, 1]) {
    const ear = group(
      part(G.sphere(), fur, { pos: [0, 0.35, 0], scale: [0.1, 0.38, 0.07] }),
      part(G.sphere(), pink, { pos: [0, 0.35, 0.04], scale: [0.055, 0.28, 0.04] })
    );
    ear.position.set(s * 0.13, 0.22, 0);
    ear.rotation.z = -s * 0.15;
    ears.add(ear);
  }
  const head = group(
    part(G.sphere(), fur, { scale: [0.34, 0.3, 0.3] }),
    eyes(0.07, 0.13, [0, 0.05, 0.24]),
    cheeks(0.06, 0.2, [0, -0.07, 0.24]),
    part(G.sphere(), pink, { pos: [0, -0.03, 0.3], scale: [0.05, 0.035, 0.03] }),
    ears
  );
  head.position.set(0, 0.95, 0.08);
  const model = group(
    body,
    head,
    part(G.sphere(), toon(0xffffff), { pos: [0, 0.35, -0.4], scale: 0.13 }),
    part(G.sphere(), fur, { pos: [-0.18, 0.08, 0.22], scale: [0.12, 0.08, 0.2] }),
    part(G.sphere(), fur, { pos: [0.18, 0.08, 0.22], scale: [0.12, 0.08, 0.2] })
  );
  return {
    model,
    height: 1.5,
    update: (t) => {
      const hop = Math.max(0, S(t * 3.2));
      model.position.y = hop * hop * 0.25;
      ears.children.forEach((ear, i) => (ear.rotation.x = S(t * 3.2 + i) * 0.15 - hop * 0.2));
    },
  };
}

function owl(): Actor {
  const brown = toon(0x9a6a44);
  const tan = toon(0xf1d6a8);
  const orange = toon(0xffa62b);
  const wings = [-1, 1].map((s) => {
    const wing = group(part(G.sphere(), toon(0x7d5234), { pos: [0, -0.2, 0], scale: [0.12, 0.35, 0.28] }));
    wing.position.set(s * 0.42, 0.85, 0);
    return wing;
  });
  const top = group(
    part(G.sphere(), tan, { pos: [-0.16, 0, 0.3], scale: [0.17, 0.17, 0.08] }),
    part(G.sphere(), tan, { pos: [0.16, 0, 0.3], scale: [0.17, 0.17, 0.08] }),
    eyes(0.1, 0.16, [0, 0, 0.33]),
    part(G.cone(), orange, { pos: [0, -0.14, 0.38], rot: [PI * 0.62, 0, 0], scale: [0.06, 0.14, 0.06] }),
    part(G.cone(), brown, { pos: [-0.26, 0.28, 0], rot: [0, 0, 0.4], scale: [0.08, 0.22, 0.08] }),
    part(G.cone(), brown, { pos: [0.26, 0.28, 0], rot: [0, 0, -0.4], scale: [0.08, 0.22, 0.08] })
  );
  top.position.set(0, 1.0, 0);
  const model = group(
    part(G.sphere(), brown, { pos: [0, 0.75, 0], scale: [0.44, 0.6, 0.4] }),
    part(G.sphere(), tan, { pos: [0, 0.6, 0.2], scale: [0.3, 0.38, 0.25] }),
    top,
    ...wings,
    part(G.sphere(), orange, { pos: [-0.14, 0.12, 0.18], scale: [0.1, 0.05, 0.14] }),
    part(G.sphere(), orange, { pos: [0.14, 0.12, 0.18], scale: [0.1, 0.05, 0.14] })
  );
  return {
    model,
    height: 1.4,
    update: (t) => {
      top.rotation.z = S(t * 0.9) * 0.2;
      top.rotation.y = S(t * 0.45) * 0.4;
      wings.forEach((w, i) => (w.rotation.z = (i ? -1 : 1) * (0.1 + Math.max(0, S(t * 2.2)) * 0.35)));
    },
  };
}

function deer(): Actor {
  const tan = toon(0xc98a52);
  const cream = toon(0xfff1dc);
  const antler = toon(0x6e4a2c);
  const head = group(
    part(G.sphere(), tan, { scale: [0.26, 0.26, 0.28] }),
    part(G.sphere(), cream, { pos: [0, -0.08, 0.2], scale: [0.14, 0.12, 0.14] }),
    part(G.sphere(), toon(0x2b1b12), { pos: [0, -0.06, 0.33], scale: 0.05 }),
    eyes(0.06, 0.12, [0, 0.06, 0.2]),
    cheeks(0.05, 0.18, [0, -0.06, 0.18])
  );
  for (const s of [-1, 1]) {
    head.add(part(G.sphere(), tan, { pos: [s * 0.28, 0.12, -0.02], rot: [0, 0, -s * 0.6], scale: [0.14, 0.07, 0.05] }));
    head.add(part(G.cylinder(), antler, { pos: [s * 0.12, 0.35, -0.05], rot: [0, 0, -s * 0.25], scale: [0.025, 0.3, 0.025] }));
    head.add(part(G.cylinder(), antler, { pos: [s * 0.2, 0.4, -0.05], rot: [0, 0, -s * 0.9], scale: [0.022, 0.16, 0.022] }));
  }
  head.position.set(0, 1.62, 0.42);
  const model = group(
    part(G.sphere(), tan, { pos: [0, 0.95, 0], scale: [0.34, 0.32, 0.55] }),
    part(G.cylinder(), tan, { pos: [0, 1.3, 0.35], rot: [0.35, 0, 0], scale: [0.12, 0.45, 0.12] }),
    head,
    part(G.sphere(), cream, { pos: [0, 1.0, -0.55], scale: [0.1, 0.12, 0.08] }),
    ...[[-0.15, 1.2, 0.05], [0.12, 1.22, -0.15], [0.05, 1.23, 0.2]].map((p) =>
      part(G.sphere(), cream, { pos: p as [number, number, number], scale: 0.05, shadow: false })
    ),
    legs(0x9c6a3e, [[-0.18, 0.32], [0.18, 0.32], [-0.18, -0.32], [0.18, -0.32]], 0.75, 0.06)
  );
  return {
    model,
    height: 2.1,
    update: (t) => {
      head.rotation.x = S(t * 0.6) * 0.15;
      head.rotation.y = S(t * 0.4) * 0.35;
    },
  };
}

function puppy(): Actor {
  const fur = toon(0xe8c48e);
  const brown = toon(0x8a5a36);
  const tail = group(part(G.sphere(), fur, { pos: [0, 0.18, 0], scale: [0.07, 0.2, 0.07] }));
  tail.position.set(0, 0.6, -0.4);
  tail.rotation.x = -0.6;
  const ears = [-1, 1].map((s) => {
    const ear = group(part(G.sphere(), brown, { pos: [0, -0.18, 0], scale: [0.1, 0.22, 0.08] }));
    ear.position.set(s * 0.3, 0.1, 0);
    return ear;
  });
  const head = group(
    part(G.sphere(), fur, { scale: [0.36, 0.33, 0.33] }),
    part(G.sphere(), toon(0xfff3e0), { pos: [0, -0.1, 0.24], scale: [0.18, 0.13, 0.13] }),
    part(G.sphere(), toon(0x2b1b12), { pos: [0, -0.04, 0.37], scale: [0.07, 0.05, 0.05] }),
    part(G.sphere(), toon(0xff6f91), { pos: [0, -0.2, 0.3], scale: [0.06, 0.07, 0.03] }),
    part(G.sphere(), brown, { pos: [0.15, 0.1, 0.22], scale: [0.12, 0.12, 0.06], shadow: false }),
    eyes(0.07, 0.14, [0, 0.07, 0.27]),
    ...ears
  );
  head.position.set(0, 0.98, 0.25);
  const model = group(
    part(G.sphere(), fur, { pos: [0, 0.52, 0], scale: [0.38, 0.36, 0.48] }),
    part(G.sphere(), brown, { pos: [-0.15, 0.7, -0.1], scale: [0.2, 0.15, 0.2], shadow: false }),
    head,
    tail,
    legs(0xe8c48e, [[-0.2, 0.25], [0.2, 0.25], [-0.2, -0.25], [0.2, -0.25]], 0.32, 0.09)
  );
  return {
    model,
    height: 1.4,
    update: (t) => {
      tail.rotation.z = S(t * 12) * 0.6;
      head.rotation.z = S(t * 1.1) * 0.12;
      ears.forEach((e, i) => (e.rotation.z = S(t * 3 + i) * 0.15));
    },
  };
}

function kitten(): Actor {
  const fur = toon(0xffb266);
  const stripe = toon(0xe0823a);
  const tail = group(
    part(G.torus(0.22, PI * 1.1), fur, { rot: [0, PI / 2, 0], scale: [0.3, 0.3, 0.3] })
  );
  tail.position.set(0, 0.55, -0.55);
  const head = group(
    part(G.sphere(), fur, { scale: [0.36, 0.31, 0.31] }),
    part(G.sphere(), toon(0xfff3e0), { pos: [0, -0.1, 0.22], scale: [0.15, 0.1, 0.1] }),
    part(G.sphere(), toon(0xff7aa2), { pos: [0, -0.06, 0.31], scale: [0.04, 0.03, 0.03] }),
    eyes(0.075, 0.14, [0, 0.06, 0.25], 0x1f6b3a),
    cheeks(0.06, 0.22, [0, -0.08, 0.24]),
    part(G.pyramid(), fur, { pos: [-0.2, 0.3, 0], rot: [0, PI / 4, 0.25], scale: [0.12, 0.22, 0.12] }),
    part(G.pyramid(), fur, { pos: [0.2, 0.3, 0], rot: [0, PI / 4, -0.25], scale: [0.12, 0.22, 0.12] }),
    part(G.box(), stripe, { pos: [0, 0.27, 0.05], scale: [0.06, 0.06, 0.2], shadow: false })
  );
  head.position.set(0, 0.95, 0.18);
  const model = group(
    part(G.sphere(), fur, { pos: [0, 0.48, 0], scale: [0.34, 0.34, 0.45] }),
    part(G.box(), stripe, { pos: [0, 0.8, -0.05], scale: [0.3, 0.04, 0.08], shadow: false }),
    part(G.box(), stripe, { pos: [0, 0.78, -0.22], scale: [0.28, 0.04, 0.08], shadow: false }),
    head,
    tail,
    legs(0xffb266, [[-0.17, 0.25], [0.17, 0.25], [-0.17, -0.25], [0.17, -0.25]], 0.25, 0.08)
  );
  return {
    model,
    height: 1.3,
    update: (t) => {
      tail.rotation.z = S(t * 1.6) * 0.35;
      head.rotation.z = S(t * 0.7) * 0.18;
    },
  };
}

function bear(): Actor {
  const fur = toon(0xa0673d);
  const light = toon(0xe7c49a);
  const head = group(
    part(G.sphere(), fur, { scale: [0.42, 0.38, 0.38] }),
    part(G.sphere(), light, { pos: [0, -0.1, 0.28], scale: [0.18, 0.14, 0.14] }),
    part(G.sphere(), toon(0x2b1b12), { pos: [0, -0.04, 0.42], scale: [0.07, 0.05, 0.05] }),
    eyes(0.07, 0.16, [0, 0.08, 0.3]),
    cheeks(0.07, 0.25, [0, -0.08, 0.28]),
    part(G.sphere(), fur, { pos: [-0.3, 0.3, 0], scale: [0.13, 0.13, 0.08] }),
    part(G.sphere(), fur, { pos: [0.3, 0.3, 0], scale: [0.13, 0.13, 0.08] }),
    part(G.sphere(), light, { pos: [-0.3, 0.3, 0.05], scale: [0.07, 0.07, 0.05], shadow: false }),
    part(G.sphere(), light, { pos: [0.3, 0.3, 0.05], scale: [0.07, 0.07, 0.05], shadow: false })
  );
  head.position.set(0, 1.35, 0.05);
  const arms = [-1, 1].map((s) => {
    const arm = group(part(G.sphere(), fur, { pos: [0, -0.2, 0], scale: [0.13, 0.28, 0.13] }));
    arm.position.set(s * 0.45, 0.95, 0.1);
    arm.rotation.z = s * 0.4;
    return arm;
  });
  const model = group(
    part(G.sphere(), fur, { pos: [0, 0.65, 0], scale: [0.5, 0.58, 0.45] }),
    part(G.sphere(), light, { pos: [0, 0.6, 0.25], scale: [0.32, 0.38, 0.25] }),
    head,
    ...arms,
    part(G.sphere(), fur, { pos: [-0.25, 0.12, 0.15], scale: [0.16, 0.12, 0.2] }),
    part(G.sphere(), fur, { pos: [0.25, 0.12, 0.15], scale: [0.16, 0.12, 0.2] })
  );
  return {
    model,
    height: 1.8,
    update: (t) => {
      head.rotation.z = S(t * 0.8) * 0.1;
      arms[1].rotation.z = -0.4 - Math.max(0, S(t * 1.5)) * 1.6; // waving hello
    },
  };
}

function bird(): Actor {
  const blue = toon(0x4fb3ff);
  const wings = [-1, 1].map((s) => {
    const wing = group(part(G.sphere(), toon(0x2d8bd9), { pos: [s * 0.2, 0, 0], scale: [0.22, 0.05, 0.14] }));
    wing.position.set(s * 0.15, 0.05, 0);
    return wing;
  });
  const body = group(
    part(G.sphere(), blue, { scale: [0.24, 0.22, 0.26] }),
    part(G.sphere(), toon(0xfff3c4), { pos: [0, -0.05, 0.12], scale: [0.16, 0.14, 0.14] }),
    part(G.cone(), toon(0xffa62b), { pos: [0, 0.02, 0.28], rot: [PI / 2, 0, 0], scale: [0.06, 0.12, 0.06] }),
    eyes(0.05, 0.1, [0, 0.08, 0.19]),
    part(G.cone(), toon(0x2d8bd9), { pos: [0, 0.05, -0.28], rot: [-PI / 2 - 0.3, 0, 0], scale: [0.08, 0.16, 0.04] }),
    ...wings
  );
  const model = group(body);
  return {
    model,
    height: 0.5,
    flying: true,
    update: (t) => {
      wings.forEach((w, i) => (w.rotation.z = (i ? -1 : 1) * S(t * 16) * 0.7));
      body.position.set(S(t * 0.6) * 1.2, S(t * 1.8) * 0.2, Math.cos(t * 0.6) * 0.5);
      body.rotation.y = Math.cos(t * 0.6) * 1.2;
    },
  };
}

function fish(): Actor {
  const color = toon(0xffa04d, 0.2);
  const fin = toon(0xffd166, 0.15);
  const tail = group(part(G.cone(), fin, { pos: [-0.14, 0, 0], rot: [0, 0, PI / 2], scale: [0.2, 0.28, 0.06] }));
  tail.position.set(-0.38, 0, 0);
  const body = group(
    part(G.sphere(), color, { scale: [0.42, 0.3, 0.2] }),
    part(G.cone(), fin, { pos: [0, 0.3, 0], rot: [0, 0, -0.4], scale: [0.14, 0.18, 0.04] }),
    eyes(0.07, 0.07, [0.22, 0.07, 0.13]),
    tail
  );
  body.rotation.y = -0.4;
  const model = group(body);
  return {
    model,
    height: 0.6,
    flying: true,
    update: (t) => {
      tail.rotation.y = S(t * 8) * 0.5;
      body.position.set(S(t * 0.5) * 0.8, S(t * 1.3) * 0.15, 0);
      body.rotation.y = Math.cos(t * 0.5) > 0 ? -0.4 : PI + 0.4;
    },
  };
}

function whale(): Actor {
  const blue = toon(0x5b8def);
  const belly = toon(0xdce9ff);
  const tail = group(
    part(G.cylinder(), blue, { pos: [0, 0.2, 0], scale: [0.12, 0.4, 0.12] }),
    part(G.sphere(), blue, { pos: [-0.18, 0.42, 0], rot: [0, 0, 0.5], scale: [0.24, 0.07, 0.12] }),
    part(G.sphere(), blue, { pos: [0.18, 0.42, 0], rot: [0, 0, -0.5], scale: [0.24, 0.07, 0.12] })
  );
  tail.position.set(0, 0.9, -0.85);
  tail.rotation.x = -0.9;
  const model = group(
    part(G.sphere(), blue, { pos: [0, 0.75, 0], scale: [0.85, 0.65, 1.0] }),
    part(G.sphere(), belly, { pos: [0, 0.55, 0.35], scale: [0.65, 0.4, 0.65] }),
    eyes(0.09, 0.42, [0, 0.9, 0.78]),
    cheeks(0.09, 0.55, [0, 0.72, 0.72]),
    part(G.torus(0.12, PI), toon(0x2b1b12), { pos: [0, 0.68, 0.95], rot: [0, 0, PI], scale: 0.12, shadow: false }),
    part(G.sphere(), blue, { pos: [-0.8, 0.5, 0.15], rot: [0, 0, 0.7], scale: [0.3, 0.07, 0.16] }),
    part(G.sphere(), blue, { pos: [0.8, 0.5, 0.15], rot: [0, 0, -0.7], scale: [0.3, 0.07, 0.16] }),
    tail
  );
  return {
    model,
    height: 1.6,
    flying: true,
    update: (t) => {
      tail.rotation.x = -0.9 + S(t * 1.5) * 0.3;
      model.rotation.z = S(t * 0.7) * 0.06;
    },
  };
}

function turtle(): Actor {
  const skin = toon(0x9be07a);
  const shell = toon(0x3f9d5a);
  const head = group(part(G.sphere(), skin, { scale: [0.2, 0.18, 0.2] }), eyes(0.05, 0.09, [0, 0.05, 0.15]));
  head.position.set(0, 0.35, 0.55);
  const model = group(
    part(G.hemisphere(), shell, { pos: [0, 0.2, 0], scale: [0.55, 0.45, 0.6] }),
    part(G.cylinder(), toon(0xe6d27a), { pos: [0, 0.2, 0], scale: [0.57, 0.06, 0.62] }),
    ...[[0, 0.62, 0], [-0.27, 0.45, 0.15], [0.27, 0.45, 0.15], [0, 0.45, -0.3]].map((p) =>
      part(G.sphere(), toon(0x2f7c45), { pos: p as [number, number, number], scale: [0.14, 0.05, 0.14], shadow: false })
    ),
    head,
    ...[[-0.38, 0.4], [0.38, 0.4], [-0.38, -0.35], [0.38, -0.35]].map(([x, z]) =>
      part(G.sphere(), skin, { pos: [x, 0.12, z], scale: [0.14, 0.1, 0.14] })
    )
  );
  return {
    model,
    height: 0.9,
    update: (t) => {
      head.position.z = 0.55 + S(t * 1.2) * 0.06;
      head.rotation.y = S(t * 0.7) * 0.4;
    },
  };
}

function dino(): Actor {
  const green = toon(0x6fcf6b);
  const spikes = toon(0xffb347);
  const neck = group(
    part(G.cylinder(), green, { pos: [0, 0.45, 0], scale: [0.16, 0.9, 0.16] }),
    part(G.sphere(), green, { pos: [0, 0.95, 0.12], scale: [0.26, 0.22, 0.3] }),
    eyes(0.07, 0.13, [0, 1.02, 0.34]),
    cheeks(0.06, 0.2, [0, 0.9, 0.34]),
    part(G.torus(0.14, PI), toon(0x2b1b12), { pos: [0, 0.9, 0.41], rot: [0, 0, PI], scale: 0.08, shadow: false })
  );
  neck.position.set(0, 1.0, 0.45);
  neck.rotation.x = 0.25;
  const tail = group(part(G.cone(), green, { pos: [0, 0, -0.5], rot: [-PI / 2, 0, 0], scale: [0.22, 1.1, 0.22] }));
  tail.position.set(0, 0.8, -0.45);
  const model = group(
    part(G.sphere(), green, { pos: [0, 0.85, 0], scale: [0.55, 0.45, 0.7] }),
    part(G.sphere(), toon(0xc9f2a8), { pos: [0, 0.72, 0.2], scale: [0.4, 0.3, 0.5] }),
    ...[0.35, 0.05, -0.25, -0.55].map((z, i) =>
      part(G.cone(), spikes, { pos: [0, 1.28 - i * 0.03, z], scale: [0.09, 0.2, 0.09] })
    ),
    neck,
    tail,
    legs(0x5ab657, [[-0.3, 0.35], [0.3, 0.35], [-0.3, -0.3], [0.3, -0.3]], 0.5, 0.14)
  );
  return {
    model,
    height: 2.4,
    update: (t) => {
      neck.rotation.z = S(t * 0.8) * 0.15;
      neck.rotation.x = 0.25 + S(t * 0.5) * 0.1;
      tail.rotation.y = S(t * 1.4) * 0.35;
    },
  };
}

function dragon(): Actor {
  const purple = toon(0xa37bff);
  const belly = toon(0xffe29a);
  const wings = [-1, 1].map((s) => {
    const wing = group(
      part(G.pyramid(), toon(0xff7ac6), { pos: [s * 0.45, 0, 0], rot: [PI / 2, 0, -s * PI / 2], scale: [0.35, 0.8, 0.04] })
    );
    wing.position.set(s * 0.2, 0.95, -0.1);
    return wing;
  });
  const head = group(
    part(G.sphere(), purple, { scale: [0.32, 0.28, 0.32] }),
    part(G.sphere(), purple, { pos: [0, -0.06, 0.22], scale: [0.2, 0.15, 0.18] }),
    eyes(0.07, 0.13, [0, 0.07, 0.24]),
    cheeks(0.06, 0.22, [0, -0.06, 0.24]),
    part(G.cone(), belly, { pos: [-0.15, 0.3, -0.05], rot: [-0.3, 0, 0.2], scale: [0.05, 0.2, 0.05] }),
    part(G.cone(), belly, { pos: [0.15, 0.3, -0.05], rot: [-0.3, 0, -0.2], scale: [0.05, 0.2, 0.05] })
  );
  head.position.set(0, 1.35, 0.3);
  const model = group(
    part(G.sphere(), purple, { pos: [0, 0.8, 0], scale: [0.42, 0.48, 0.45] }),
    part(G.sphere(), belly, { pos: [0, 0.72, 0.22], scale: [0.3, 0.36, 0.28] }),
    part(G.cone(), purple, { pos: [0, 0.55, -0.6], rot: [-PI / 2 - 0.4, 0, 0], scale: [0.14, 0.7, 0.14] }),
    head,
    ...wings
  );
  return {
    model,
    height: 1.7,
    flying: true,
    update: (t) => {
      wings.forEach((w, i) => (w.rotation.y = (i ? -1 : 1) * S(t * 6) * 0.6));
      model.position.y = S(t * 3) * 0.15;
      head.rotation.y = S(t * 0.7) * 0.3;
    },
  };
}

function unicorn(): Actor {
  const white = toon(0xfdfbff);
  const rainbow = [0xff6b6b, 0xffb347, 0xffe066, 0x7bd88f, 0x6ec6ff, 0xb18cff].map((c) => toon(c));
  const head = group(
    part(G.sphere(), white, { scale: [0.26, 0.28, 0.34] }),
    part(G.sphere(), toon(0xffd6e7), { pos: [0, -0.1, 0.24], scale: [0.17, 0.14, 0.14] }),
    eyes(0.065, 0.13, [0, 0.06, 0.22], 0x6a3fb5),
    cheeks(0.06, 0.18, [0, -0.06, 0.22]),
    part(G.cone(), toon(0xffd166, 0.25), { pos: [0, 0.4, 0.05], rot: [0.3, 0, 0], scale: [0.06, 0.4, 0.06] }),
    part(G.cone(), white, { pos: [-0.14, 0.28, -0.08], scale: [0.06, 0.16, 0.05] }),
    part(G.cone(), white, { pos: [0.14, 0.28, -0.08], scale: [0.06, 0.16, 0.05] })
  );
  head.position.set(0, 1.72, 0.52);
  const mane = group(
    ...rainbow.map((m, i) => part(G.sphere(), m, { pos: [0, 1.85 - i * 0.11, 0.28 - i * 0.07], scale: [0.09, 0.1, 0.09] }))
  );
  const tail = group(
    ...rainbow.map((m, i) => part(G.sphere(), m, { pos: [0, -i * 0.1, -i * 0.06], scale: [0.1, 0.1, 0.1] }))
  );
  tail.position.set(0, 1.1, -0.6);
  const model = group(
    part(G.sphere(), white, { pos: [0, 1.0, 0], scale: [0.36, 0.34, 0.58] }),
    part(G.cylinder(), white, { pos: [0, 1.4, 0.38], rot: [0.45, 0, 0], scale: [0.14, 0.5, 0.14] }),
    head,
    mane,
    tail,
    legs(0xefe9ff, [[-0.18, 0.32], [0.18, 0.32], [-0.18, -0.32], [0.18, -0.32]], 0.8, 0.07)
  );
  return {
    model,
    height: 2.2,
    update: (t) => {
      head.rotation.x = S(t * 0.9) * 0.12;
      tail.rotation.x = S(t * 2.5) * 0.3;
      tail.rotation.z = S(t * 1.2) * 0.2;
    },
  };
}

function rocket(): Actor {
  const red = toon(0xff5d5d);
  const flame = group(
    part(G.cone(), toon(0xffb347, 1), { pos: [0, -0.3, 0], rot: [PI, 0, 0], scale: [0.2, 0.55, 0.2], shadow: false }),
    part(G.cone(), toon(0xfff3a0, 1), { pos: [0, -0.2, 0], rot: [PI, 0, 0], scale: [0.11, 0.35, 0.11], shadow: false })
  );
  flame.position.y = 0.3;
  const fins = [0, (PI * 2) / 3, (PI * 4) / 3].map((a) => {
    const fin = group(part(G.box(), red, { pos: [0.3, 0, 0], scale: [0.25, 0.4, 0.05] }));
    fin.rotation.y = a + PI / 2;
    fin.position.y = 0.55;
    return fin;
  });
  const ship = group(
    part(G.cylinder(), toon(0xf6f4ff), { pos: [0, 1.1, 0], scale: [0.3, 1.1, 0.3] }),
    part(G.cone(), red, { pos: [0, 1.95, 0], scale: [0.3, 0.6, 0.3] }),
    part(G.cylinder(), red, { pos: [0, 0.55, 0], scale: [0.32, 0.1, 0.32] }),
    part(G.torus(0.2), toon(0xb8c1d9), { pos: [0, 1.3, 0.28], scale: 0.14 }),
    part(G.sphere(), toon(0x7fd6ff, 0.35), { pos: [0, 1.3, 0.26], scale: [0.12, 0.12, 0.06] }),
    ...fins,
    flame
  );
  const model = group(ship);
  return {
    model,
    height: 2.4,
    flying: true,
    update: (t) => {
      flame.scale.set(1, 0.8 + S(t * 30) * 0.2 + S(t * 13) * 0.1, 1);
      ship.rotation.z = S(t * 0.8) * 0.12;
      ship.rotation.y = t * 0.4;
    },
  };
}

function car(): Actor {
  const paint = toon(0xff5d73);
  const wheels = [[-0.45, 0.35], [0.45, 0.35], [-0.45, -0.35], [0.45, -0.35]].map(([x, z]) =>
    part(G.cylinder(), toon(0x2f2f3a), { pos: [x, 0.2, z], rot: [PI / 2, 0, 0], scale: [0.2, 0.14, 0.2] })
  );
  const body = group(
    part(G.box(), paint, { pos: [0, 0.42, 0], scale: [1.35, 0.35, 0.72] }),
    part(G.box(), paint, { pos: [-0.08, 0.72, 0], scale: [0.75, 0.3, 0.66] }),
    part(G.box(), toon(0xbfe9ff, 0.2), { pos: [-0.08, 0.73, 0.335], scale: [0.62, 0.22, 0.01], shadow: false }),
    part(G.box(), toon(0xbfe9ff, 0.2), { pos: [-0.08, 0.73, -0.335], scale: [0.62, 0.22, 0.01], shadow: false }),
    part(G.sphere(), toon(0xfff3a0, 0.9), { pos: [0.68, 0.45, 0.22], scale: [0.03, 0.07, 0.07], shadow: false }),
    part(G.sphere(), toon(0xfff3a0, 0.9), { pos: [0.68, 0.45, -0.22], scale: [0.03, 0.07, 0.07], shadow: false }),
    eyes(0.08, 0.15, [0.35, 0.72, 0.33])
  );
  body.rotation.y = 0;
  const model = group(body, ...wheels);
  model.rotation.y = -0.35;
  return {
    model,
    height: 1.0,
    update: (t) => {
      wheels.forEach((w) => (w.rotation.y = t * 8));
      body.position.y = Math.abs(S(t * 9)) * 0.04;
    },
  };
}

function train(): Actor {
  const red = toon(0xff6b6b);
  const blue = toon(0x5b8def);
  const puffs = [0, 1, 2].map(() => part(G.sphere(), toon(0xffffff), { scale: 0.15, shadow: false }));
  const wheels = [-0.55, -0.1, 0.35, 0.75].flatMap((x) =>
    [0.3, -0.3].map((z) =>
      part(G.cylinder(), toon(0x2f2f3a), { pos: [x, 0.18, z], rot: [PI / 2, 0, 0], scale: [0.17, 0.08, 0.17] })
    )
  );
  const model = group(
    part(G.box(), blue, { pos: [-0.45, 0.75, 0], scale: [0.55, 0.8, 0.62] }),
    part(G.box(), red, { pos: [-0.45, 1.2, 0], scale: [0.7, 0.1, 0.72] }),
    part(G.box(), toon(0xfff3a0, 0.4), { pos: [-0.45, 0.85, 0.315], scale: [0.3, 0.25, 0.01], shadow: false }),
    part(G.cylinder(), red, { pos: [0.3, 0.6, 0], rot: [0, 0, PI / 2], scale: [0.3, 0.95, 0.3] }),
    part(G.cylinder(), toon(0x2f2f3a), { pos: [0.55, 1.0, 0], scale: [0.09, 0.35, 0.09] }),
    part(G.sphere(), toon(0xffd166, 0.8), { pos: [0.78, 0.65, 0], scale: [0.03, 0.12, 0.12], shadow: false }),
    part(G.box(), toon(0xffd166), { pos: [0.1, 0.32, 0], scale: [1.7, 0.1, 0.5] }),
    eyes(0.08, 0.14, [0.3, 0.68, 0.3]),
    ...wheels,
    ...puffs
  );
  model.rotation.y = -0.3;
  return {
    model,
    height: 1.4,
    update: (t) => {
      wheels.forEach((w) => (w.rotation.y = t * 6));
      puffs.forEach((p, i) => {
        const k = (t * 0.6 + i / 3) % 1;
        p.position.set(0.55 - k * 0.5, 1.2 + k * 0.9, 0);
        p.scale.setScalar(0.1 + k * 0.25);
      });
    },
  };
}

function butterfly(): Actor {
  const colors = [0xff7ac6, 0xffd166];
  const wings = [-1, 1].map((s) => {
    const wing = group(
      part(G.sphere(), toon(colors[0]), { pos: [s * 0.22, 0.08, 0], scale: [0.22, 0.2, 0.02] }),
      part(G.sphere(), toon(colors[1]), { pos: [s * 0.17, -0.14, 0], scale: [0.14, 0.13, 0.02] }),
      part(G.sphere(), toon(0xffffff), { pos: [s * 0.25, 0.1, 0.02], scale: [0.07, 0.07, 0.01], shadow: false })
    );
    return wing;
  });
  const body = group(
    part(G.sphere(), toon(0x4a3b6b), { scale: [0.05, 0.22, 0.05] }),
    eyes(0.035, 0.04, [0, 0.2, 0.04]),
    ...wings
  );
  const model = group(body);
  return {
    model,
    height: 0.5,
    flying: true,
    update: (t) => {
      const flap = S(t * 14) * 0.9;
      wings[0].rotation.y = flap;
      wings[1].rotation.y = -flap;
      body.position.set(S(t * 0.7) * 0.9, S(t * 1.4) * 0.3, S(t * 0.35) * 0.4);
    },
  };
}

function wisp(): Actor {
  const glow = part(G.sphere(), toon(0xffe27a, 1.1), { scale: 0.3, shadow: false });
  const halo = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: getDotTexture(),
      color: 0xfff2a8,
      transparent: true,
      opacity: 0.7,
      depthWrite: false,
    })
  );
  halo.scale.setScalar(1.3);
  halo.userData.disposable = true;
  const face = group(eyes(0.06, 0.1, [0, 0.05, 0.25]), cheeks(0.05, 0.17, [0, -0.06, 0.25]));
  const light = new THREE.PointLight(0xffd966, 3, 5, 1.5);
  const body = group(glow, halo, face, light);
  const model = group(body);
  return {
    model,
    height: 0.6,
    flying: true,
    update: (t) => {
      body.position.set(S(t * 0.9) * 0.4, S(t * 1.7) * 0.25, 0);
      halo.scale.setScalar(1.2 + S(t * 4) * 0.15);
      light.intensity = 2.5 + S(t * 4) * 0.6;
    },
  };
}

const BUILDERS: Record<CharacterKind, () => Actor> = {
  fox,
  bunny,
  owl,
  deer,
  puppy,
  kitten,
  bear,
  bird,
  fish,
  whale,
  turtle,
  dino,
  dragon,
  unicorn,
  rocket,
  car,
  train,
  butterfly,
  wisp,
};

export function buildCharacter(kind: CharacterKind): Actor {
  return BUILDERS[kind]();
}

/** Scene-tag words that summon a character onto the page. */
const TAG_TO_CHARACTER: Record<string, CharacterKind> = {
  fox: "fox",
  bunny: "bunny",
  rabbit: "bunny",
  hare: "bunny",
  owl: "owl",
  deer: "deer",
  fawn: "deer",
  reindeer: "deer",
  puppy: "puppy",
  dog: "puppy",
  kitten: "kitten",
  cat: "kitten",
  kitty: "kitten",
  bear: "bear",
  teddy: "bear",
  bird: "bird",
  parrot: "bird",
  duck: "bird",
  fish: "fish",
  goldfish: "fish",
  whale: "whale",
  dolphin: "whale",
  turtle: "turtle",
  tortoise: "turtle",
  dinosaur: "dino",
  dino: "dino",
  dragon: "dragon",
  unicorn: "unicorn",
  horse: "unicorn",
  pony: "unicorn",
  rocket: "rocket",
  spaceship: "rocket",
  car: "car",
  truck: "car",
  bus: "car",
  train: "train",
  butterfly: "butterfly",
  butterflies: "butterfly",
  light: "wisp",
  fairy: "wisp",
  firefly: "wisp",
  glow: "wisp",
  sparkle: "wisp",
};

export function charactersFromTags(tags: string[]): CharacterKind[] {
  const found: CharacterKind[] = [];
  for (const raw of tags) {
    for (const word of raw.toLowerCase().split(/[^a-z]+/)) {
      if (!word) continue;
      const kind = TAG_TO_CHARACTER[word] ?? TAG_TO_CHARACTER[word.replace(/(es|s)$/, "")];
      if (kind && !found.includes(kind)) found.push(kind);
    }
  }
  return found;
}
