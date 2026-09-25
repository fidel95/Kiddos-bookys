import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { buildCharacter } from "./characters";
import * as D from "./decor";
import type { Action, ScenePlan, Shot } from "./director";
import { G, getDotTexture, getStreakTexture, getZTexture, hashString, part, pick, range, seededRandom, toon, type Rng } from "./kit";
import { buildLandmark } from "./landmarks";
import { lookFor, type Look } from "./moods";
import { worldFor, type ParticleKind, type Placement } from "./worlds";

/**
 * A pop-up-book stage: each story page is a little 3D diorama planned by the director
 * (world, mood, landmarks, cast and camera shot). On page turns the old diorama folds flat
 * while the new one pops up out of the page, the light shifts to the new time of day and
 * the camera flies to the new shot. Kids can tap characters to make them jump.
 */

export type TapTarget = "character" | "decor" | "ground";

export interface StageOptions {
  reducedMotion: boolean;
  /** Skip the automatic quality drop on slow devices (used for testing). */
  forceHighQuality?: boolean;
  /** `tags` names what was tapped ("fox", "moon", "treasure"…) for "find it" challenges. */
  onTap?: (target: TapTarget, tags: string[]) => void;
}

interface Item {
  holder: THREE.Group;
  actor: THREE.Group;
  kind: "ground" | "decor" | "character";
  base: THREE.Vector3;
  baseScale: number;
  delay: number;
  exitDelay: number;
  update?: (t: number) => void;
  flying: boolean;
  action: Action;
  phase: number;
  height: number;
  reactStart: number;
  /** The character or landmark kind, if this is one. */
  ownTag?: string;
  /** Everything findable in this item: its own tag plus scenery tags inside it. */
  tags: Set<string>;
  zs?: THREE.Sprite[];
}

interface World {
  id: string;
  groundColor: number;
  root: THREE.Group;
  items: Item[];
  particles: Particles[];
  bornAt: number;
  leavingAt: number | null;
}

interface ShotPose {
  target: THREE.Vector3;
  yaw: number;
  radius: number;
  height: number;
}

const POP_DURATION = 0.7;
const EXIT_DURATION = 0.45;
const LOOK_BLEND = 1.1;
const CAMERA_MOVE = 1.6;

/** Character spots; index 0 (the hero) always gets the most prominent one. */
const CAST_SLOTS: Array<Array<[number, number]>> = [
  [[0, 1.8]],
  [[-1.4, 1.8], [1.5, 1.6]],
  [[0, 2.2], [-2.3, 1.2], [2.3, 1.2]],
  [[-0.95, 2.2], [0.95, 2.2], [-2.8, 0.9], [2.8, 0.9]],
];

/** Scenery that's small enough to need a boost when it's the "find it" target. */
const SMALL_TARGETS = new Set([
  "mushroom", "flower", "crystal", "shell", "seaweed", "hay", "star", "planet", "coral", "rock",
  "fern", "bush", "trafficLight", "treasure", "campfire", "shootingStar", "moon", "sun",
]);

const LANDMARK_SPOTS = {
  back: [{ x: 0, z: -2.8, rotY: 0 }, { x: -4.6, z: -3.4, rotY: 0.35 }],
  side: [{ x: 3.9, z: -0.6, rotY: -0.4 }, { x: -3.9, z: -0.6, rotY: 0.4 }],
  sky: [{ x: 0, y: 4.8, z: -8 }, { x: 3.5, y: 4.2, z: -7 }],
};

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const lerp = THREE.MathUtils.lerp;
const easeOutBack = (x: number) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
};
const easeInBack = (x: number) => 2.70158 * x * x * x - 1.70158 * x * x;
const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);
const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

/** `boost` pushes glowing particles past 1.0 so the bloom pass makes them shine. */
const PARTICLE_CONFIG: Record<ParticleKind, { count: number; size: number; colors: number[]; glow: boolean; boost: number }> = {
  stars: { count: 280, size: 0.7, colors: [0xffffff, 0xfff3c4, 0xc9d6ff], glow: true, boost: 1.4 },
  fireflies: { count: 70, size: 0.4, colors: [0xfff27a, 0xd9ff7a], glow: true, boost: 2.2 },
  bubbles: { count: 80, size: 0.28, colors: [0xdffaff, 0xb8f0ff], glow: true, boost: 1 },
  sparkles: { count: 110, size: 0.3, colors: [0xff9ce6, 0xffe066, 0x9be7ff, 0xc3a6ff], glow: true, boost: 1.5 },
  pollen: { count: 60, size: 0.16, colors: [0xffffff, 0xfff3c4], glow: true, boost: 1 },
  rain: { count: 520, size: 0.7, colors: [0xeef4ff, 0xd6e4f7], glow: false, boost: 1 },
  snow: { count: 260, size: 0.17, colors: [0xffffff], glow: false, boost: 1 },
};

class Particles {
  readonly points: THREE.Points;
  private readonly base: Float32Array;
  private readonly baseColors: Float32Array;
  private readonly phase: Float32Array;
  private readonly maxOpacity: number;

  constructor(
    private readonly kind: ParticleKind,
    rng: Rng
  ) {
    const config = PARTICLE_CONFIG[kind];
    const count = config.count;
    this.base = new Float32Array(count * 3);
    this.baseColors = new Float32Array(count * 3);
    this.phase = new Float32Array(count);
    const color = new THREE.Color();
    for (let i = 0; i < count; i++) {
      if (kind === "stars") {
        // Spread across the upper sky dome.
        const theta = rng() * Math.PI * 2;
        const y = range(rng, 0.06, 1);
        const r = range(rng, 38, 50);
        const flat = Math.sqrt(1 - y * y);
        this.base.set([Math.cos(theta) * flat * r, y * r, Math.sin(theta) * flat * r], i * 3);
      } else if (kind === "rain" || kind === "snow") {
        this.base.set([range(rng, -12, 12), range(rng, 0, 9), range(rng, -10, 7)], i * 3);
      } else {
        this.base.set([range(rng, -11, 11), range(rng, 0.2, 7), range(rng, -10, 5)], i * 3);
      }
      color.set(pick(rng, config.colors)).multiplyScalar(config.boost);
      this.baseColors.set([color.r, color.g, color.b], i * 3);
      this.phase[i] = rng() * Math.PI * 2;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(this.base.slice(), 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(this.baseColors.slice(), 3));
    this.maxOpacity = kind === "pollen" ? 0.6 : 1;
    const material = new THREE.PointsMaterial({
      size: config.size,
      map: kind === "rain" ? getStreakTexture() : getDotTexture(),
      vertexColors: true,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: config.glow ? THREE.AdditiveBlending : THREE.NormalBlending,
      fog: kind !== "stars",
    });
    this.points = new THREE.Points(geometry, material);
    this.points.frustumCulled = false;
  }

  set opacity(value: number) {
    (this.points.material as THREE.PointsMaterial).opacity = value * this.maxOpacity;
  }

  update(t: number) {
    const pos = this.points.geometry.getAttribute("position") as THREE.BufferAttribute;
    const col = this.points.geometry.getAttribute("color") as THREE.BufferAttribute;
    const p = pos.array as Float32Array;
    const c = col.array as Float32Array;
    const n = this.phase.length;
    for (let i = 0; i < n; i++) {
      const ph = this.phase[i];
      const bx = this.base[i * 3];
      const by = this.base[i * 3 + 1];
      const bz = this.base[i * 3 + 2];
      let twinkle = 1;
      switch (this.kind) {
        case "stars":
          twinkle = 0.45 + 0.55 * Math.abs(Math.sin(t * 1.3 + ph));
          break;
        case "fireflies":
          p[i * 3] = bx + Math.sin(t * 0.5 + ph) * 0.8;
          p[i * 3 + 1] = (by % 4) + 0.3 + Math.sin(t * 0.8 + ph * 2) * 0.4;
          p[i * 3 + 2] = bz + Math.cos(t * 0.4 + ph) * 0.8;
          twinkle = Math.max(0, Math.sin(t * 2 + ph * 3));
          break;
        case "bubbles":
          p[i * 3] = bx + Math.sin(t * 2 + ph) * 0.15;
          p[i * 3 + 1] = (by + t * (0.5 + (ph % 1) * 0.6)) % 8;
          p[i * 3 + 2] = bz;
          break;
        case "sparkles":
          p[i * 3] = bx + Math.sin(t * 0.6 + ph) * 0.3;
          p[i * 3 + 1] = (by + t * 0.25) % 7;
          p[i * 3 + 2] = bz;
          twinkle = 0.25 + 0.75 * Math.abs(Math.sin(t * 2.5 + ph));
          break;
        case "pollen":
          p[i * 3] = bx + Math.sin(t * 0.3 + ph) * 1.2;
          p[i * 3 + 1] = (by % 5) + Math.sin(t * 0.5 + ph) * 0.5;
          p[i * 3 + 2] = bz + Math.cos(t * 0.25 + ph) * 0.6;
          break;
        case "rain":
          p[i * 3] = bx - ((by - t * 11) % 9) * 0.05;
          p[i * 3 + 1] = (((by - t * 11) % 9) + 9) % 9;
          break;
        case "snow":
          p[i * 3] = bx + Math.sin(t * 0.7 + ph) * 0.6;
          p[i * 3 + 1] = (((by - t * (0.5 + (ph % 1) * 0.4)) % 9) + 9) % 9;
          p[i * 3 + 2] = bz + Math.cos(t * 0.5 + ph) * 0.3;
          break;
      }
      c[i * 3] = this.baseColors[i * 3] * twinkle;
      c[i * 3 + 1] = this.baseColors[i * 3 + 1] * twinkle;
      c[i * 3 + 2] = this.baseColors[i * 3 + 2] * twinkle;
    }
    pos.needsUpdate = true;
    col.needsUpdate = true;
  }

  dispose() {
    this.points.geometry.dispose();
    (this.points.material as THREE.Material).dispose();
  }
}

/** A one-shot fountain of rainbow sparkles where a kid tapped. */
class Burst {
  readonly points: THREE.Points;
  private readonly velocity: Float32Array;
  age = 0;

  constructor(origin: THREE.Vector3, count: number) {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    this.velocity = new Float32Array(count * 3);
    const color = new THREE.Color();
    const palette = [0xff6b6b, 0xffd166, 0x7bd88f, 0x6ec6ff, 0xb18cff, 0xff9ce6];
    for (let i = 0; i < count; i++) {
      positions.set([origin.x, origin.y, origin.z], i * 3);
      const a = Math.random() * Math.PI * 2;
      const up = 2 + Math.random() * 3;
      const out = 1 + Math.random() * 2;
      this.velocity.set([Math.cos(a) * out, up, Math.sin(a) * out], i * 3);
      color.set(palette[i % palette.length]);
      colors.set([color.r, color.g, color.b], i * 3);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    this.points = new THREE.Points(
      geometry,
      new THREE.PointsMaterial({
        size: 0.36,
        map: getDotTexture(),
        vertexColors: true,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    );
    this.points.frustumCulled = false;
  }

  /** Returns false once the burst has faded out. */
  update(dt: number): boolean {
    this.age += dt;
    const pos = this.points.geometry.getAttribute("position") as THREE.BufferAttribute;
    const p = pos.array as Float32Array;
    for (let i = 0; i < p.length; i += 3) {
      this.velocity[i + 1] -= 7 * dt;
      p[i] += this.velocity[i] * dt;
      p[i + 1] += this.velocity[i + 1] * dt;
      p[i + 2] += this.velocity[i + 2] * dt;
    }
    pos.needsUpdate = true;
    (this.points.material as THREE.PointsMaterial).opacity = 1 - clamp01((this.age - 0.4) / 0.6);
    return this.age < 1;
  }

  dispose() {
    this.points.geometry.dispose();
    (this.points.material as THREE.Material).dispose();
  }
}

const SKY_VERTEX = /* glsl */ `
  varying vec3 vWorldPosition;
  void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

const SKY_FRAGMENT = /* glsl */ `
  uniform vec3 topColor;
  uniform vec3 bottomColor;
  varying vec3 vWorldPosition;
  void main() {
    float h = normalize(vWorldPosition).y;
    gl_FragColor = vec4(mix(bottomColor, topColor, smoothstep(-0.02, 0.55, h)), 1.0);
    #include <colorspace_fragment>
  }
`;

/** The blendable part of a Look, as three.js values. */
interface Atmosphere {
  skyTop: THREE.Color;
  skyBottom: THREE.Color;
  hemiSky: THREE.Color;
  hemiGround: THREE.Color;
  hemiIntensity: number;
  sunColor: THREE.Color;
  sunIntensity: number;
  sunPosition: THREE.Vector3;
  bloom: number;
}

function atmosphereOf(look: Look): Atmosphere {
  return {
    skyTop: new THREE.Color(look.skyTop),
    skyBottom: new THREE.Color(look.skyBottom),
    hemiSky: new THREE.Color(look.hemiSky),
    hemiGround: new THREE.Color(look.hemiGround),
    hemiIntensity: look.hemiIntensity,
    sunColor: new THREE.Color(look.sunColor),
    sunIntensity: look.sunIntensity,
    sunPosition: new THREE.Vector3(...look.sunPosition),
    bloom: look.bloom,
  };
}

function cloneAtmosphere(a: Atmosphere): Atmosphere {
  return {
    ...a,
    skyTop: a.skyTop.clone(),
    skyBottom: a.skyBottom.clone(),
    hemiSky: a.hemiSky.clone(),
    hemiGround: a.hemiGround.clone(),
    sunColor: a.sunColor.clone(),
    sunPosition: a.sunPosition.clone(),
  };
}

function disposeTree(root: THREE.Object3D) {
  root.traverse((obj) => {
    if (!obj.userData.disposable) return;
    const mesh = obj as THREE.Mesh;
    // Some meshes own only their material and borrow a shared, cached geometry.
    if (obj.userData.ownGeometry !== false) mesh.geometry?.dispose();
    (mesh.material as THREE.Material | undefined)?.dispose();
  });
}

function poseFor(shot: Shot, rng: Rng, hero: { position: THREE.Vector3; height: number } | null): ShotPose {
  const side = rng() < 0.5 ? -1 : 1;
  switch (shot) {
    case "close": {
      const target = hero
        ? hero.position.clone().add(new THREE.Vector3(0, hero.height * 0.5, 0))
        : new THREE.Vector3(0, 1.2, 1.8);
      return { target, yaw: side * range(rng, 0.15, 0.4), radius: 5.6, height: 0.8 };
    }
    case "low":
      return { target: new THREE.Vector3(0, 2.7, 0), yaw: side * range(rng, 0.4, 0.6), radius: 7.6, height: -1.95 };
    case "high":
      return { target: new THREE.Vector3(0, 0.4, 0.8), yaw: side * range(rng, 0.1, 0.35), radius: 5.2, height: 8.6 };
    case "side":
      return { target: new THREE.Vector3(0, 1.3, 0.6), yaw: side * range(rng, 0.7, 0.95), radius: 8.2, height: 2.3 };
    case "wide":
    default:
      return { target: new THREE.Vector3(0, 1.5, 0), yaw: side * range(rng, 0, 0.25), radius: 9, height: 2.9 };
  }
}

export class Stage {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly composer: EffectComposer;
  private readonly bloomPass: UnrealBloomPass;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(42, 1, 0.1, 200);
  private readonly skyUniforms = {
    topColor: { value: new THREE.Color() },
    bottomColor: { value: new THREE.Color() },
  };
  private readonly fog = new THREE.Fog(0xffffff, 18, 44);
  private readonly hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1.5);
  private readonly sun = new THREE.DirectionalLight(0xffffff, 2);
  private readonly raycaster = new THREE.Raycaster();

  private current: World | null = null;
  private leaving: World[] = [];
  private bursts: Burst[] = [];

  private atmosphere: Atmosphere | null = null;
  private atmosphereFrom: Atmosphere | null = null;
  private atmosphereTo: Atmosphere | null = null;
  private atmosphereStart = 0;

  private poseFrom: ShotPose | null = null;
  private poseTo: ShotPose | null = null;
  private camMoveStart = -Infinity;
  private camDirection = 1;

  /** 2 = bloom + shadows, 1 = shadows only, 0 = neither at 1x resolution. */
  private quality = 2;
  private perfFrames = 0;
  private perfTime = 0;

  private time = 0;
  private lastFrame = 0;
  private pointer = new THREE.Vector2();
  private pointerSmoothed = new THREE.Vector2();
  private pointerDown: { x: number; y: number; t: number } | null = null;
  private onScreen = true;
  private pageVisible = true;
  private running = false;

  private readonly resizeObserver: ResizeObserver;
  private readonly intersectionObserver: IntersectionObserver;

  constructor(
    private readonly container: HTMLElement,
    private readonly options: StageOptions
  ) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(this.pixelRatio());
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    const canvas = this.renderer.domElement;
    canvas.style.display = "block";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.touchAction = "pan-y";
    canvas.style.cursor = "pointer";
    container.appendChild(canvas);

    // Bloom makes lanterns, fireflies, the moon and magic actually glow. Rendered into a
    // multisampled HDR target so edges stay smooth and bright things can exceed 1.0.
    const target = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 });
    this.composer = new EffectComposer(this.renderer, target);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    // Threshold above 1: only HDR-bright things (strong emissives) bloom, never a pale sky.
    // Sunlit white surfaces can also pass 1, which is why daytime moods keep the strength low.
    this.bloomPass = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.5, 0.5, 1.05);
    this.composer.addPass(this.bloomPass);
    this.composer.addPass(new OutputPass());

    this.scene.fog = this.fog;
    const sky = new THREE.Mesh(
      new THREE.SphereGeometry(90, 32, 16),
      new THREE.ShaderMaterial({
        uniforms: this.skyUniforms,
        vertexShader: SKY_VERTEX,
        fragmentShader: SKY_FRAGMENT,
        side: THREE.BackSide,
        depthWrite: false,
      })
    );
    sky.userData.disposable = true;
    this.scene.add(sky);

    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(1024, 1024);
    const sc = this.sun.shadow.camera;
    sc.left = -13;
    sc.right = 13;
    sc.top = 13;
    sc.bottom = -9;
    sc.near = 1;
    sc.far = 45;
    this.sun.shadow.bias = -0.0008;
    this.sun.shadow.normalBias = 0.02;
    this.scene.add(this.hemi, this.sun);

    canvas.addEventListener("pointerdown", this.handlePointerDown);
    canvas.addEventListener("pointerup", this.handlePointerUp);
    canvas.addEventListener("pointermove", this.handlePointerMove);
    canvas.addEventListener("pointerleave", this.handlePointerLeave);
    document.addEventListener("visibilitychange", this.handleVisibility);

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(container);
    this.intersectionObserver = new IntersectionObserver(([entry]) => {
      this.onScreen = entry?.isIntersecting ?? true;
      this.updateRunning();
    });
    this.intersectionObserver.observe(container);
    this.resize();
    this.updateRunning();
  }

  /** Swap to a new page's diorama. `direction` is +1 for forward page turns, -1 for back. */
  show(plan: ScenePlan, direction: 1 | -1 = 1): string[] {
    const def = worldFor(plan.world);
    const rng = seededRandom(hashString(plan.seed));
    const look = lookFor(def.env, plan.mood, plan.world, plan.sparkle);
    const previous = this.current;
    const root = new THREE.Group();
    const items: Item[] = [];

    // Same world and ground as before? Keep the ground in place so only the scenery re-pops.
    const keptGround =
      previous && previous.id === plan.world && previous.groundColor === look.ground
        ? previous.items.find((i) => i.kind === "ground")
        : undefined;
    if (keptGround && previous) {
      previous.items = previous.items.filter((i) => i !== keptGround);
      keptGround.delay = -Infinity; // already fully grown; don't pop it again
      root.add(keptGround.holder);
      items.push(keptGround);
    } else {
      const ground = new THREE.Group();
      ground.add(
        part(G.disc(), toon(look.ground), { rot: [-Math.PI / 2, 0, 0], scale: 17, shadow: false }),
        // The diorama's "page thickness", tucked just under the top so the two never z-fight.
        part(G.cylinder(), toon(new THREE.Color(look.ground).multiplyScalar(0.75)), {
          pos: [0, -0.52, 0],
          scale: [17, 1, 17],
          shadow: false,
        })
      );
      items.push(this.addItem(root, ground, { kind: "ground", delay: 0, x: 0, z: 0 }));
    }

    // Landmarks: the page's set pieces.
    const landmarkPlacements: Array<Placement & { clear: number; bridge: boolean; bed: boolean; kind: string }> = [];
    const used = { back: 0, side: 0, sky: 0 };
    for (const kind of plan.landmarks) {
      if (def.includes?.includes(kind)) continue;
      const landmark = buildLandmark(kind, rng, look.night);
      let spot: { x: number; y?: number; z: number; rotY?: number };
      if (landmark.spot === "ground") spot = { x: 0, z: 0 };
      else spot = LANDMARK_SPOTS[landmark.spot][Math.min(used[landmark.spot]++, 1)];
      landmarkPlacements.push({
        decor: landmark.decor,
        ...spot,
        scale: landmark.scale,
        clear: landmark.clear,
        bridge: kind === "bridge",
        bed: kind === "bed",
        kind,
      });
    }
    // Night pages get a moon (unless the world already has one or is underwater/in space).
    const extras: Placement[] = [];
    if (look.night && !["night", "ocean", "space"].includes(plan.world)) {
      extras.push({ decor: D.moon(), x: range(rng, 4, 7), y: 5.2, z: -13 });
    }
    if (plan.mood === "rain") {
      for (let i = 0; i < 4; i++) extras.push({ decor: D.cloud(rng, 0x9aa6b8), x: -7 + i * 4.5, y: range(rng, 4.2, 5.4), z: range(rng, -10, -7) });
    }

    const blocked = (x: number, z: number, y = 0) =>
      y < 2 &&
      landmarkPlacements.some((l) =>
        l.bridge ? Math.abs(z - l.z) < 1.6 : l.clear > 0 && Math.hypot(x - l.x, z - l.z) < l.clear
      );
    const sunny = plan.mood === "day" || plan.mood === "morning";
    const scenery = def.decor(rng).filter((p) => !blocked(p.x, p.z, p.y) && (sunny || !p.decor.object.userData.isSun));

    for (const placement of [...scenery, ...extras, ...landmarkPlacements]) {
      const isLandmark = landmarkPlacements.includes(placement as (typeof landmarkPlacements)[number]);
      const dist = Math.hypot(placement.x, placement.z);
      const item = this.addItem(root, placement.decor.object, {
        kind: "decor",
        tag: isLandmark ? (placement as (typeof landmarkPlacements)[number]).kind : undefined,
        delay: isLandmark ? 0.3 : 0.08 + dist * 0.025 + rng() * 0.12,
        x: placement.x,
        y: placement.y ?? 0,
        z: placement.z,
        rotY: placement.rotY ?? 0,
        scale: placement.scale ?? 1,
      });
      item.update = placement.decor.update;
      items.push(item);
    }

    // Cast: who's on this page and what they're doing.
    const cast = plan.cast.length ? plan.cast : [{ kind: pick(rng, def.heroes), action: "idle" as Action }];
    let slots = CAST_SLOTS[cast.length - 1];
    // A lone hero steps aside so a house or castle behind them stays in view.
    if (cast.length === 1 && landmarkPlacements.some((l) => l.z < -2 && (l.y ?? 0) < 2)) slots = [[-1.3, 1.8]];
    const bed = landmarkPlacements.find((l) => l.bed);
    let bedTaken = false;
    let hero: { position: THREE.Vector3; height: number } | null = null;
    for (const [i, member] of cast.entries()) {
      const actor = buildCharacter(member.kind);
      let [x, z] = slots[i];
      const flying = !!actor.flying;
      let y = flying ? Math.min(2.4, Math.max(0.8, 2.6 - actor.height * 0.6)) : 0;
      let scale = 1.3 * Math.min(1.5, Math.max(0.95, 1.8 / actor.height));
      let rotY = -x * 0.12;
      // A sleepyhead goes in the bed, head on the pillow.
      if (bed && !bedTaken && !flying && member.action === "sleep") {
        bedTaken = true;
        [x, y, z] = [bed.x, 0.62, bed.z];
        rotY = (bed.rotY ?? 0) - Math.PI / 2;
        scale *= 0.6;
      }
      const item = this.addItem(root, actor.model, { kind: "character", tag: member.kind, delay: 0.5 + i * 0.14, x, y, z, rotY, scale });
      item.update = actor.update;
      item.flying = flying;
      item.height = actor.height;
      // Flying characters can't lie down, so they just drift.
      item.action = flying && member.action === "sleep" ? "idle" : member.action;
      if (item.action === "sleep") item.zs = this.addZs(item);
      items.push(item);
      if (i === 0) hero = { position: new THREE.Vector3(x, y, z), height: actor.height * scale };
    }

    // The thing to find should be easy to spot: small pieces grow while they're the target.
    const findItems = plan.find ? items.filter((i) => i.tags.has(plan.find!) && i.kind !== "ground") : [];
    if (plan.find && SMALL_TARGETS.has(plan.find)) findItems.forEach((i) => (i.baseScale *= 1.7));

    const particles = look.particles.map((kind) => new Particles(kind, rng));
    this.scene.add(root, ...particles.map((p) => p.points));

    if (previous) {
      previous.leavingAt = this.time;
      previous.items.forEach((item) => {
        item.exitDelay = item.kind === "ground" ? 0.15 : Math.random() * 0.15;
      });
      this.leaving.push(previous);
    }

    this.current = {
      id: plan.world,
      groundColor: look.ground,
      root,
      items,
      particles,
      bornAt: this.time,
      leavingAt: null,
    };

    const target = atmosphereOf(look);
    this.atmosphereFrom = this.atmosphere ? cloneAtmosphere(this.atmosphere) : cloneAtmosphere(target);
    this.atmosphereTo = target;
    this.atmosphereStart = this.time;
    if (!this.atmosphere) this.atmosphere = cloneAtmosphere(target);

    const pose = poseFor(plan.shot, rng, hero);
    // Lean the shot toward what the child is asked to find, so it's well inside the frame.
    const focusItems = findItems.filter((i) => i.kind !== "character");
    if (focusItems.length) {
      const nearest = focusItems.reduce((a, b) => (Math.abs(a.base.x) < Math.abs(b.base.x) ? a : b));
      pose.target.x = lerp(pose.target.x, nearest.base.x, 0.55);
      if (plan.shot === "low") pose.yaw *= 0.3;
      if (nearest.base.y > 2) pose.target.y = lerp(pose.target.y, nearest.base.y, 0.25);
    }
    this.poseFrom = previous && this.poseTo ? this.currentPose() : pose;
    this.poseTo = pose;
    this.camMoveStart = previous ? this.time : -Infinity;
    this.camDirection = direction;

    if (!this.running) this.renderFrame(0);
    return [...new Set(items.flatMap((i) => [...i.tags]))];
  }

  /** A gentle hint: everything matching `tag` hops or wiggles, with a small sparkle. */
  nudge(tag: string) {
    for (const item of this.matching(tag)) {
      item.reactStart = this.time;
      this.spawnBurst(this.topOf(item), 12);
    }
  }

  /** "You found it!" — a big sparkle fountain over everything matching `tag`. */
  celebrate(tag: string) {
    for (const item of this.matching(tag)) {
      item.reactStart = this.time;
      this.spawnBurst(this.topOf(item), 60);
    }
  }

  private matching(tag: string): Item[] {
    return this.current?.items.filter((i) => i.tags.has(tag) && i.holder.visible) ?? [];
  }

  private topOf(item: Item): THREE.Vector3 {
    const box = new THREE.Box3().setFromObject(item.holder);
    return new THREE.Vector3((box.min.x + box.max.x) / 2, box.max.y + 0.2, (box.min.z + box.max.z) / 2);
  }

  dispose() {
    this.renderer.setAnimationLoop(null);
    this.resizeObserver.disconnect();
    this.intersectionObserver.disconnect();
    document.removeEventListener("visibilitychange", this.handleVisibility);
    const canvas = this.renderer.domElement;
    canvas.removeEventListener("pointerdown", this.handlePointerDown);
    canvas.removeEventListener("pointerup", this.handlePointerUp);
    canvas.removeEventListener("pointermove", this.handlePointerMove);
    canvas.removeEventListener("pointerleave", this.handlePointerLeave);
    for (const world of [...this.leaving, ...(this.current ? [this.current] : [])]) this.disposeWorld(world);
    this.bursts.forEach((b) => b.dispose());
    disposeTree(this.scene);
    this.composer.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    canvas.remove();
  }

  private pixelRatio() {
    const cap = this.quality === 0 ? 1 : this.quality === 1 ? 1.5 : 1.75;
    return Math.min(window.devicePixelRatio || 1, cap);
  }

  private addItem(
    root: THREE.Group,
    object: THREE.Object3D,
    o: { kind: Item["kind"]; tag?: string; delay: number; x: number; y?: number; z: number; rotY?: number; scale?: number }
  ): Item {
    const actor = new THREE.Group();
    actor.add(object);
    const holder = new THREE.Group();
    holder.add(actor);
    holder.position.set(o.x, o.y ?? 0, o.z);
    holder.rotation.y = o.rotY ?? 0;
    holder.visible = false;
    root.add(holder);
    const item: Item = {
      holder,
      actor,
      kind: o.kind,
      base: holder.position.clone(),
      baseScale: o.scale ?? 1,
      delay: this.options.reducedMotion ? 0 : o.delay,
      exitDelay: 0,
      flying: false,
      action: "idle",
      phase: Math.random() * Math.PI * 2,
      height: 1,
      reactStart: -Infinity,
      ownTag: o.tag,
      tags: new Set(o.tag ? [o.tag] : []),
    };
    object.traverse((child) => {
      if (typeof child.userData.tag === "string") item.tags.add(child.userData.tag);
    });
    holder.userData.item = item;
    return item;
  }

  /** Little "Z"s that float up from a sleeping character. */
  private addZs(item: Item): THREE.Sprite[] {
    return [0, 1, 2].map(() => {
      const z = new THREE.Sprite(
        new THREE.SpriteMaterial({ map: getZTexture(), transparent: true, depthWrite: false })
      );
      z.userData.disposable = true;
      z.userData.ownGeometry = false;
      z.raycast = () => {}; // taps go through to the sleeper
      item.holder.add(z);
      return z;
    });
  }

  private disposeWorld(world: World) {
    this.scene.remove(world.root, ...world.particles.map((p) => p.points));
    world.particles.forEach((p) => p.dispose());
    disposeTree(world.root);
  }

  private cameraProgress(): number {
    if (this.options.reducedMotion) return 1;
    return clamp01((this.time - this.camMoveStart) / CAMERA_MOVE);
  }

  private currentPose(): ShotPose {
    const a = this.poseFrom!;
    const b = this.poseTo!;
    const e = easeInOut(this.cameraProgress());
    return {
      target: a.target.clone().lerp(b.target, e),
      yaw: lerp(a.yaw, b.yaw, e),
      radius: lerp(a.radius, b.radius, e),
      height: lerp(a.height, b.height, e),
    };
  }

  private resize() {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    if (!w || !h) return;
    const ratio = this.pixelRatio();
    this.renderer.setPixelRatio(ratio);
    this.renderer.setSize(w, h, false);
    this.composer.setPixelRatio(ratio);
    this.composer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    if (!this.running) this.renderFrame(0);
  }

  private updateRunning() {
    const shouldRun = this.onScreen && this.pageVisible;
    if (shouldRun === this.running) return;
    this.running = shouldRun;
    this.lastFrame = performance.now();
    this.renderer.setAnimationLoop(shouldRun ? this.tick : null);
  }

  private readonly tick = () => {
    const now = performance.now();
    const rawDt = (now - this.lastFrame) / 1000;
    this.lastFrame = now;
    this.watchPerformance(rawDt);
    this.renderFrame(Math.min(rawDt, 0.05));
  };

  /** Steps quality down if the device can't keep up (~30fps), so older tablets stay smooth. */
  private watchPerformance(dt: number) {
    if (this.options.forceHighQuality || this.quality === 0) return;
    if (this.time < 1.5 || dt > 0.5) return; // skip warm-up and returning from a hidden tab
    this.perfFrames++;
    this.perfTime += dt;
    if (this.perfFrames < 90) return;
    const average = this.perfTime / this.perfFrames;
    this.perfFrames = 0;
    this.perfTime = 0;
    if (average < 1 / 30) return;
    this.quality--;
    if (this.quality === 0) {
      this.renderer.shadowMap.enabled = false;
      this.sun.castShadow = false;
    }
    this.resize();
  }

  private renderFrame(dt: number) {
    this.time += dt;
    const t = this.time;
    const reduced = this.options.reducedMotion;
    const idleT = reduced ? t * 0.35 : t;

    if (this.current) this.animateEntering(this.current, t, idleT);
    this.leaving = this.leaving.filter((world) => {
      const done = this.animateLeaving(world, t, idleT);
      if (done) this.disposeWorld(world);
      return !done;
    });

    this.bursts = this.bursts.filter((burst) => {
      const alive = burst.update(dt);
      if (!alive) {
        this.scene.remove(burst.points);
        burst.dispose();
      }
      return alive;
    });

    this.blendAtmosphere(t);
    this.moveCamera(t);
    if (this.quality === 2) this.composer.render(dt);
    else this.renderer.render(this.scene, this.camera);
  }

  private animateEntering(world: World, t: number, idleT: number) {
    const age = t - world.bornAt;
    const reduced = this.options.reducedMotion;
    const fade = reduced ? 1 : clamp01((age - 0.3) / 0.8);
    world.particles.forEach((p) => {
      p.opacity = fade;
      p.update(idleT);
    });
    for (const item of world.items) {
      const p = reduced ? 1 : clamp01((age - 0.15 - item.delay) / POP_DURATION);
      this.setScale(item, easeOutBack(p));
      // Fold up from lying flat on the page, like a pop-up book.
      item.holder.rotation.x = item.kind === "ground" ? 0 : -(1 - easeOutCubic(p)) * (Math.PI / 2);
      this.animateItem(item, t, idleT);
    }
  }

  private animateLeaving(world: World, t: number, idleT: number): boolean {
    const age = t - (world.leavingAt ?? t);
    if (this.options.reducedMotion) return true;
    world.particles.forEach((p) => {
      p.opacity = 1 - clamp01(age / 0.4);
      p.update(idleT);
    });
    // Sink the old ground slightly so it never fights the new one.
    world.root.position.y = -0.03 - clamp01(age / 0.8) * 0.4;
    let done = true;
    for (const item of world.items) {
      const p = clamp01((age - item.exitDelay) / EXIT_DURATION);
      if (p < 1) done = false;
      this.setScale(item, 1 - easeInBack(p));
      item.holder.rotation.x = item.kind === "ground" ? 0 : -easeInBack(p) * (Math.PI / 2);
      this.animateItem(item, t, idleT);
    }
    return done;
  }

  private setScale(item: Item, s: number) {
    const scale = Math.max(0.0001, s * item.baseScale);
    item.holder.scale.setScalar(scale);
    item.holder.visible = s > 0.001;
  }

  private animateItem(item: Item, t: number, idleT: number) {
    item.update?.(idleT);
    const actor = item.actor;
    const react = t - item.reactStart;
    const ph = item.phase;

    let lift = 0;
    let spin = 0;
    let squash = 0;
    let tiltZ = 0;
    let tiltX = 0;
    let yaw = 0;
    item.holder.position.copy(item.base);

    if (item.kind === "character") {
      switch (item.action) {
        case "hop": {
          const h = Math.abs(Math.sin(idleT * 4.5 + ph));
          lift = h * 0.55;
          squash = h < 0.25 ? (0.25 - h) * 0.5 : 0;
          break;
        }
        case "run": {
          const a = idleT * 1.3 + ph;
          item.holder.position.x += Math.sin(a) * 1.3;
          item.holder.position.z += Math.cos(a) * 0.5;
          yaw = Math.atan2(Math.cos(a) * 1.3, -Math.sin(a) * 0.5) - item.holder.rotation.y;
          lift = Math.abs(Math.sin(idleT * 10 + ph)) * 0.15;
          tiltX = 0.12;
          break;
        }
        case "dance":
          yaw = idleT * 3 + ph;
          lift = Math.abs(Math.sin(idleT * 6 + ph)) * 0.18;
          tiltZ = Math.sin(idleT * 3 + ph) * 0.15;
          break;
        case "sleep":
          tiltZ = Math.PI / 2 - 0.2;
          lift = 0.36;
          squash = -Math.sin(idleT * 1.4 + ph) * 0.03;
          break;
        case "wave":
          tiltZ = Math.sin(idleT * 3.5 + ph) * 0.2;
          break;
        case "fly":
          lift = 1.0 + Math.sin(idleT * 1.6 + ph) * 0.25;
          tiltZ = Math.sin(idleT * 1.2 + ph) * 0.15;
          break;
        case "lookUp":
          tiltX = -0.3 + Math.sin(idleT + ph) * 0.05;
          break;
        case "cheer": {
          const h = Math.abs(Math.sin(idleT * 7 + ph));
          lift = h * 0.35;
          squash = h < 0.25 ? (0.25 - h) * 0.4 : 0;
          break;
        }
        default:
          break;
      }
      if (item.flying) lift += Math.sin(idleT * 1.4 + ph) * 0.15;
      if (item.action !== "sleep") squash -= Math.sin(idleT * 2.2 + ph) * 0.02; // breathing
    }

    if (react < 1) {
      if (item.kind === "character") {
        lift += Math.sin(Math.PI * react) * 1.2;
        spin = easeInOut(react) * Math.PI * 2;
        squash += Math.sin(Math.PI * react * 2) * 0.12;
      } else if (item.kind === "decor" && react < 0.8) {
        const p = react / 0.8;
        tiltZ += Math.sin(p * Math.PI * 6) * 0.15 * (1 - p);
        squash += Math.sin(p * Math.PI * 4) * 0.1 * (1 - p);
      }
    }

    actor.position.y = lift;
    actor.rotation.set(tiltX, yaw + spin, tiltZ);
    actor.scale.set(1 - squash * 0.5, 1 + squash, 1 - squash * 0.5);

    if (item.zs) {
      item.zs.forEach((z, i) => {
        const k = (idleT * 0.35 + i / 3) % 1;
        z.position.set(-item.height * 0.45 + k * 0.5, 0.6 + k * 1.3, 0.2);
        z.scale.setScalar(0.22 + k * 0.25);
        (z.material as THREE.SpriteMaterial).opacity = Math.sin(Math.PI * k);
      });
    }
  }

  private blendAtmosphere(t: number) {
    if (!this.atmosphere || !this.atmosphereFrom || !this.atmosphereTo) return;
    const k = this.options.reducedMotion ? 1 : easeInOut(clamp01((t - this.atmosphereStart) / LOOK_BLEND));
    const { atmosphere: now, atmosphereFrom: a, atmosphereTo: b } = this;
    now.skyTop.lerpColors(a.skyTop, b.skyTop, k);
    now.skyBottom.lerpColors(a.skyBottom, b.skyBottom, k);
    now.hemiSky.lerpColors(a.hemiSky, b.hemiSky, k);
    now.hemiGround.lerpColors(a.hemiGround, b.hemiGround, k);
    now.sunColor.lerpColors(a.sunColor, b.sunColor, k);
    now.sunPosition.lerpVectors(a.sunPosition, b.sunPosition, k);
    now.hemiIntensity = lerp(a.hemiIntensity, b.hemiIntensity, k);
    now.sunIntensity = lerp(a.sunIntensity, b.sunIntensity, k);
    now.bloom = lerp(a.bloom, b.bloom, k);

    this.skyUniforms.topColor.value.copy(now.skyTop);
    this.skyUniforms.bottomColor.value.copy(now.skyBottom);
    this.fog.color.copy(now.skyBottom);
    this.hemi.color.copy(now.hemiSky);
    this.hemi.groundColor.copy(now.hemiGround);
    this.hemi.intensity = now.hemiIntensity;
    this.sun.color.copy(now.sunColor);
    this.sun.intensity = now.sunIntensity;
    this.sun.position.copy(now.sunPosition);
    this.bloomPass.strength = now.bloom;
  }

  private moveCamera(t: number) {
    if (!this.poseTo || !this.poseFrom) return;
    const reduced = this.options.reducedMotion;
    const e = easeInOut(this.cameraProgress());
    const swoop = Math.sin(Math.PI * e);
    const pose = this.currentPose();

    this.pointerSmoothed.lerp(this.pointer, reduced ? 1 : 0.05);
    const aspect = this.camera.aspect || 1.6;
    // Narrow (phone) frames pull back a little so the characters still fit.
    const fit = Math.min(1.35, Math.max(1, 1.6 / aspect));

    let yaw = pose.yaw + this.camDirection * swoop * 0.3;
    let radius = pose.radius * fit + swoop * 1.8;
    let height = pose.height + swoop * 1.0;
    if (!reduced) {
      yaw += Math.sin(t * 0.17) * 0.05 + this.pointerSmoothed.x * 0.12;
      height += this.pointerSmoothed.y * 0.6;
      radius += Math.sin(t * 0.23) * 0.2;
    }
    const target = pose.target;
    this.camera.position.set(
      target.x + Math.sin(yaw) * radius,
      Math.max(0.35, target.y + height),
      target.z + Math.cos(yaw) * radius
    );
    this.camera.lookAt(target);
  }

  private setPointerFromEvent(e: PointerEvent) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    return new THREE.Vector2(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
  }

  private readonly handlePointerMove = (e: PointerEvent) => {
    if (e.pointerType === "mouse") this.pointer.copy(this.setPointerFromEvent(e));
  };

  private readonly handlePointerLeave = () => {
    this.pointer.set(0, 0);
  };

  private readonly handlePointerDown = (e: PointerEvent) => {
    this.pointerDown = { x: e.clientX, y: e.clientY, t: performance.now() };
  };

  private readonly handlePointerUp = (e: PointerEvent) => {
    const down = this.pointerDown;
    this.pointerDown = null;
    // Ignore drags and swipes — those turn pages.
    if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 12 || performance.now() - down.t > 600) return;
    this.handleTap(this.setPointerFromEvent(e));
  };

  /**
   * Tags of everything drawn within a finger's width of the tap. Little kids don't tap precisely,
   * so "find it" counts a near miss.
   */
  private tagsNear(ndc: THREE.Vector2): string[] {
    const world = this.current;
    if (!world) return [];
    const canvas = this.renderer.domElement;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    const px = ((ndc.x + 1) / 2) * w;
    const py = ((1 - ndc.y) / 2) * h;
    const slack = Math.max(30, Math.min(w, h) * 0.08);
    const tags = new Set<string>();
    const box = new THREE.Box3();
    const corner = new THREE.Vector3();
    for (const item of world.items) {
      if (item.kind === "ground" || !item.holder.visible || item.tags.size === 0) continue;
      box.setFromObject(item.holder);
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (let c = 0; c < 8; c++) {
        corner.set(c & 1 ? box.max.x : box.min.x, c & 2 ? box.max.y : box.min.y, c & 4 ? box.max.z : box.min.z);
        corner.project(this.camera);
        if (corner.z > 1) continue; // behind the camera
        const sx = ((corner.x + 1) / 2) * w;
        const sy = ((1 - corner.y) / 2) * h;
        minX = Math.min(minX, sx);
        maxX = Math.max(maxX, sx);
        minY = Math.min(minY, sy);
        maxY = Math.max(maxY, sy);
      }
      if (px >= minX - slack && px <= maxX + slack && py >= minY - slack && py <= maxY + slack) {
        item.tags.forEach((t) => tags.add(t));
      }
    }
    return [...tags];
  }

  private handleTap(ndc: THREE.Vector2) {
    const world = this.current;
    if (!world) return;
    const near = this.tagsNear(ndc);
    this.raycaster.setFromCamera(ndc, this.camera);
    const hits = this.raycaster.intersectObject(world.root, true);
    for (const hit of hits) {
      let obj: THREE.Object3D | null = hit.object;
      while (obj && !obj.userData.item) obj = obj.parent;
      const item = obj?.userData.item as Item | undefined;
      if (!item) continue;
      if (item.kind !== "ground" && this.time - item.reactStart > 0.6) item.reactStart = this.time;
      const origin =
        item.kind === "character"
          ? item.holder.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, item.height * item.baseScale, 0))
          : hit.point.clone().add(new THREE.Vector3(0, 0.2, 0));
      this.spawnBurst(origin);
      // The item's own tag (character or landmark kind), plus scenery tags on the tapped part's
      // way up — so tapping a crystal at the cave's mouth counts as both "cave" and "crystal".
      const tags = new Set(item.ownTag ? [item.ownTag] : []);
      for (let o: THREE.Object3D | null = hit.object; o && o !== item.holder; o = o.parent) {
        if (typeof o.userData.tag === "string") tags.add(o.userData.tag);
      }
      near.forEach((t) => tags.add(t));
      this.options.onTap?.(item.kind, [...tags]);
      return;
    }
    // Tapped the sky: nothing was hit, but something findable may be close by.
    this.options.onTap?.("ground", near);
  }

  private spawnBurst(origin: THREE.Vector3, count = 32) {
    const burst = new Burst(origin, count);
    this.bursts.push(burst);
    this.scene.add(burst.points);
  }

  private readonly handleVisibility = () => {
    this.pageVisible = document.visibilityState !== "hidden";
    this.updateRunning();
  };
}
