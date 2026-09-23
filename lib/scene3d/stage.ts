import * as THREE from "three";
import { buildCharacter, charactersFromTags } from "./characters";
import { G, getDotTexture, hashString, part, pick, range, seededRandom, toon, type Rng } from "./kit";
import { worldFor, type Environment, type ParticleKind } from "./worlds";

/**
 * A pop-up-book stage: each story page is a little 3D diorama. On page turns the old diorama
 * folds flat and shrinks away while the new one pops up out of the page, the sky blends to the
 * new theme and the camera swoops. Kids can tap characters to make them jump.
 */

export interface SceneSpec {
  illustrationId: string;
  sceneTags: string[];
  /** Stable per page, so the same page always builds the same layout. */
  seed: string;
}

export type TapTarget = "character" | "decor" | "ground";

export interface StageOptions {
  reducedMotion: boolean;
  onTap?: (target: TapTarget) => void;
}

interface Item {
  holder: THREE.Group;
  actor: THREE.Group;
  kind: "ground" | "decor" | "character";
  baseScale: number;
  delay: number;
  exitDelay: number;
  update?: (t: number) => void;
  flying: boolean;
  phase: number;
  height: number;
  reactStart: number;
}

interface World {
  id: string;
  root: THREE.Group;
  items: Item[];
  particles: Particles;
  bornAt: number;
  leavingAt: number | null;
  camYaw: number;
}

const POP_DURATION = 0.7;
const EXIT_DURATION = 0.45;
const ENV_BLEND = 0.9;
const CAMERA_MOVE = 1.3;
const CAMERA_TARGET = new THREE.Vector3(0, 1.5, 0);

const CHARACTER_SLOTS: Array<Array<[number, number]>> = [
  [[0, 1.8]],
  [[-1.5, 1.6], [1.5, 1.9]],
  [[-2.3, 1.2], [0, 2.2], [2.3, 1.2]],
];

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const easeOutBack = (x: number) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
};
const easeInBack = (x: number) => 2.70158 * x * x * x - 1.70158 * x * x;
const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);
const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

class Particles {
  readonly points: THREE.Points;
  private readonly base: Float32Array;
  private readonly baseColors: Float32Array;
  private readonly phase: Float32Array;

  constructor(
    private readonly kind: ParticleKind,
    rng: Rng
  ) {
    const config = {
      stars: { count: 260, size: 0.7, colors: [0xffffff, 0xfff3c4, 0xc9d6ff] },
      fireflies: { count: 55, size: 0.35, colors: [0xfff27a, 0xd9ff7a] },
      bubbles: { count: 80, size: 0.28, colors: [0xdffaff, 0xb8f0ff] },
      sparkles: { count: 110, size: 0.3, colors: [0xff9ce6, 0xffe066, 0x9be7ff, 0xc3a6ff] },
      pollen: { count: 60, size: 0.16, colors: [0xffffff, 0xfff3c4] },
    }[kind];

    const count = config.count;
    this.base = new Float32Array(count * 3);
    this.baseColors = new Float32Array(count * 3);
    this.phase = new Float32Array(count);
    const color = new THREE.Color();
    for (let i = 0; i < count; i++) {
      if (kind === "stars") {
        // Spread across the upper sky dome.
        const theta = rng() * Math.PI * 2;
        const y = range(rng, 0.08, 1);
        const r = range(rng, 38, 50);
        const flat = Math.sqrt(1 - y * y);
        this.base.set([Math.cos(theta) * flat * r, y * r, Math.sin(theta) * flat * r], i * 3);
      } else {
        this.base.set([range(rng, -11, 11), range(rng, 0.2, 7), range(rng, -10, 5)], i * 3);
      }
      color.set(pick(rng, config.colors));
      this.baseColors.set([color.r, color.g, color.b], i * 3);
      this.phase[i] = rng() * Math.PI * 2;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(this.base.slice(), 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(this.baseColors.slice(), 3));
    const material = new THREE.PointsMaterial({
      size: config.size,
      map: getDotTexture(),
      vertexColors: true,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      fog: kind !== "stars",
    });
    this.points = new THREE.Points(geometry, material);
    this.points.frustumCulled = false;
  }

  set opacity(value: number) {
    (this.points.material as THREE.PointsMaterial).opacity = value * (this.kind === "pollen" ? 0.6 : 1);
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

  constructor(origin: THREE.Vector3) {
    const count = 28;
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
        size: 0.32,
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

interface Mood {
  skyTop: THREE.Color;
  skyBottom: THREE.Color;
  hemiSky: THREE.Color;
  hemiGround: THREE.Color;
  hemiIntensity: number;
  sunColor: THREE.Color;
  sunIntensity: number;
}

function moodFromEnv(env: Environment): Mood {
  return {
    skyTop: new THREE.Color(env.skyTop),
    skyBottom: new THREE.Color(env.skyBottom),
    hemiSky: new THREE.Color(env.hemiSky),
    hemiGround: new THREE.Color(env.hemiGround),
    hemiIntensity: env.hemiIntensity,
    sunColor: new THREE.Color(env.sunColor),
    sunIntensity: env.sunIntensity,
  };
}

function cloneMood(m: Mood): Mood {
  return {
    skyTop: m.skyTop.clone(),
    skyBottom: m.skyBottom.clone(),
    hemiSky: m.hemiSky.clone(),
    hemiGround: m.hemiGround.clone(),
    hemiIntensity: m.hemiIntensity,
    sunColor: m.sunColor.clone(),
    sunIntensity: m.sunIntensity,
  };
}

function disposeTree(root: THREE.Object3D) {
  root.traverse((obj) => {
    if (!obj.userData.disposable) return;
    const mesh = obj as THREE.Mesh;
    mesh.geometry?.dispose();
    (mesh.material as THREE.Material | undefined)?.dispose();
  });
}

export class Stage {
  private readonly renderer: THREE.WebGLRenderer;
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

  private mood: Mood | null = null;
  private moodFrom: Mood | null = null;
  private moodTo: Mood | null = null;
  private moodStart = 0;

  private camYawFrom = 0;
  private camYawTo = 0;
  private camMoveStart = -Infinity;
  private camDirection = 1;

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
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "default" });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    const canvas = this.renderer.domElement;
    canvas.style.display = "block";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.touchAction = "pan-y";
    canvas.style.cursor = "pointer";
    container.appendChild(canvas);

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

    this.sun.position.set(6, 12, 8);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(1024, 1024);
    const sc = this.sun.shadow.camera;
    sc.left = -12;
    sc.right = 12;
    sc.top = 12;
    sc.bottom = -8;
    sc.near = 1;
    sc.far = 40;
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
  show(spec: SceneSpec, direction: 1 | -1 = 1) {
    const def = worldFor(spec.illustrationId);
    const rng = seededRandom(hashString(spec.seed));
    const previous = this.current;
    const root = new THREE.Group();
    const items: Item[] = [];

    // Same theme as before? Keep the ground in place so only the scenery re-pops.
    const keptGround =
      previous && previous.id === spec.illustrationId ? previous.items.find((i) => i.kind === "ground") : undefined;
    if (keptGround && previous) {
      previous.items = previous.items.filter((i) => i !== keptGround);
      keptGround.delay = -Infinity; // already fully grown; don't pop it again
      root.add(keptGround.holder);
      items.push(keptGround);
    } else {
      const ground = new THREE.Group();
      ground.add(
        part(G.disc(), toon(def.env.ground), { rot: [-Math.PI / 2, 0, 0], scale: 17, shadow: false }),
        // The diorama's "page thickness", tucked just under the top so the two never z-fight.
        part(G.cylinder(), toon(new THREE.Color(def.env.ground).multiplyScalar(0.75)), {
          pos: [0, -0.52, 0],
          scale: [17, 1, 17],
          shadow: false,
        })
      );
      items.push(this.addItem(root, ground, { kind: "ground", delay: 0, x: 0, z: 0 }));
    }

    for (const placement of def.decor(rng)) {
      const dist = Math.hypot(placement.x, placement.z);
      const item = this.addItem(root, placement.decor.object, {
        kind: "decor",
        delay: 0.08 + dist * 0.025 + rng() * 0.12,
        x: placement.x,
        y: placement.y ?? 0,
        z: placement.z,
        rotY: placement.rotY ?? 0,
        scale: placement.scale ?? 1,
      });
      item.update = placement.decor.update;
      items.push(item);
    }

    const kinds = charactersFromTags(spec.sceneTags).slice(0, 3);
    if (kinds.length === 0) kinds.push(pick(rng, def.heroes));
    const slots = CHARACTER_SLOTS[kinds.length - 1];
    kinds.forEach((kind, i) => {
      const actor = buildCharacter(kind);
      const [x, z] = slots[i];
      const y = actor.flying ? Math.min(2.4, Math.max(0.8, 2.6 - actor.height * 0.6)) : 0;
      const item = this.addItem(root, actor.model, {
        kind: "character",
        delay: 0.5 + i * 0.14,
        x,
        y,
        z,
        rotY: -x * 0.12,
        scale: 1.3 * Math.min(1.5, Math.max(0.95, 1.8 / actor.height)),
      });
      item.update = actor.update;
      item.flying = !!actor.flying;
      item.height = actor.height;
      items.push(item);
    });

    const particles = new Particles(def.env.particles, rng);
    this.scene.add(root, particles.points);

    if (previous) {
      previous.leavingAt = this.time;
      previous.items.forEach((item) => {
        item.exitDelay = item.kind === "ground" ? 0.15 : Math.random() * 0.15;
      });
      this.leaving.push(previous);
    }

    const world: World = {
      id: spec.illustrationId,
      root,
      items,
      particles,
      bornAt: this.time,
      leavingAt: null,
      camYaw: range(rng, -0.25, 0.25),
    };
    this.current = world;

    const target = moodFromEnv(def.env);
    this.moodFrom = this.mood ? cloneMood(this.mood) : cloneMood(target);
    this.moodTo = target;
    this.moodStart = this.time;
    if (!this.mood) this.mood = cloneMood(target);

    this.camYawFrom = previous ? this.currentYawBase() : world.camYaw;
    this.camYawTo = world.camYaw;
    this.camMoveStart = previous ? this.time : -Infinity;
    this.camDirection = direction;

    if (!this.running) this.renderFrame(0);
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
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    canvas.remove();
  }

  private addItem(
    root: THREE.Group,
    object: THREE.Object3D,
    o: { kind: Item["kind"]; delay: number; x: number; y?: number; z: number; rotY?: number; scale?: number }
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
      baseScale: o.scale ?? 1,
      delay: this.options.reducedMotion ? 0 : o.delay,
      exitDelay: 0,
      flying: false,
      phase: Math.random() * Math.PI * 2,
      height: 1,
      reactStart: -Infinity,
    };
    holder.userData.item = item;
    return item;
  }

  private disposeWorld(world: World) {
    this.scene.remove(world.root, world.particles.points);
    world.particles.dispose();
    disposeTree(world.root);
  }

  private currentYawBase(): number {
    const k = this.cameraProgress();
    return THREE.MathUtils.lerp(this.camYawFrom, this.camYawTo, easeInOut(k));
  }

  private cameraProgress(): number {
    if (this.options.reducedMotion) return 1;
    return clamp01((this.time - this.camMoveStart) / CAMERA_MOVE);
  }

  private resize() {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h, false);
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
    const dt = Math.min((now - this.lastFrame) / 1000, 0.05);
    this.lastFrame = now;
    this.renderFrame(dt);
  };

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

    this.blendMood(t);
    this.moveCamera(t);
    this.renderer.render(this.scene, this.camera);
  }

  private animateEntering(world: World, t: number, idleT: number) {
    const age = t - world.bornAt;
    const reduced = this.options.reducedMotion;
    world.particles.opacity = reduced ? 1 : clamp01((age - 0.3) / 0.8);
    world.particles.update(idleT);
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
    world.particles.opacity = 1 - clamp01(age / 0.4);
    world.particles.update(idleT);
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
    let lift = 0;
    let spin = 0;
    let squash = 0;
    let wobble = 0;
    if (react < 1) {
      if (item.kind === "character") {
        const p = react;
        lift = Math.sin(Math.PI * p) * 1.2;
        spin = easeInOut(p) * Math.PI * 2;
        squash = Math.sin(Math.PI * p * 2) * 0.12;
      } else if (item.kind === "decor" && react < 0.8) {
        const p = react / 0.8;
        wobble = Math.sin(p * Math.PI * 6) * 0.15 * (1 - p);
        squash = Math.sin(p * Math.PI * 4) * 0.1 * (1 - p);
      }
    }
    const bob = item.kind === "character" && item.flying ? Math.sin(idleT * 1.4 + item.phase) * 0.15 : 0;
    const breathe = item.kind === "character" ? Math.sin(idleT * 2.2 + item.phase) * 0.02 : 0;
    actor.position.y = bob + lift;
    actor.rotation.y = spin;
    actor.rotation.z = wobble;
    actor.scale.set(1 - squash * 0.5, 1 + squash + breathe, 1 - squash * 0.5);
  }

  private blendMood(t: number) {
    if (!this.mood || !this.moodFrom || !this.moodTo) return;
    const k = this.options.reducedMotion ? 1 : easeInOut(clamp01((t - this.moodStart) / ENV_BLEND));
    const { mood, moodFrom: a, moodTo: b } = this;
    mood.skyTop.lerpColors(a.skyTop, b.skyTop, k);
    mood.skyBottom.lerpColors(a.skyBottom, b.skyBottom, k);
    mood.hemiSky.lerpColors(a.hemiSky, b.hemiSky, k);
    mood.hemiGround.lerpColors(a.hemiGround, b.hemiGround, k);
    mood.sunColor.lerpColors(a.sunColor, b.sunColor, k);
    mood.hemiIntensity = THREE.MathUtils.lerp(a.hemiIntensity, b.hemiIntensity, k);
    mood.sunIntensity = THREE.MathUtils.lerp(a.sunIntensity, b.sunIntensity, k);

    this.skyUniforms.topColor.value.copy(mood.skyTop);
    this.skyUniforms.bottomColor.value.copy(mood.skyBottom);
    this.fog.color.copy(mood.skyBottom);
    this.hemi.color.copy(mood.hemiSky);
    this.hemi.groundColor.copy(mood.hemiGround);
    this.hemi.intensity = mood.hemiIntensity;
    this.sun.color.copy(mood.sunColor);
    this.sun.intensity = mood.sunIntensity;
  }

  private moveCamera(t: number) {
    const reduced = this.options.reducedMotion;
    const k = this.cameraProgress();
    const e = easeInOut(k);
    const swoop = Math.sin(Math.PI * e);

    this.pointerSmoothed.lerp(this.pointer, reduced ? 1 : 0.05);
    const aspect = this.camera.aspect || 1.6;
    // Narrow (phone) frames pull back a little so the characters still fit.
    const fit = Math.min(1.35, Math.max(1, 1.6 / aspect));

    let yaw = THREE.MathUtils.lerp(this.camYawFrom, this.camYawTo, e) + this.camDirection * swoop * 0.3;
    let radius = 9 * fit + swoop * 1.8;
    let height = 2.9 + swoop * 1.0;
    if (!reduced) {
      yaw += Math.sin(t * 0.17) * 0.05 + this.pointerSmoothed.x * 0.12;
      height += this.pointerSmoothed.y * 0.6;
      radius += Math.sin(t * 0.23) * 0.2;
    }
    this.camera.position.set(Math.sin(yaw) * radius, CAMERA_TARGET.y + height, Math.cos(yaw) * radius);
    this.camera.lookAt(CAMERA_TARGET);
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

  private handleTap(ndc: THREE.Vector2) {
    const world = this.current;
    if (!world) return;
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
      this.options.onTap?.(item.kind);
      return;
    }
  }

  private spawnBurst(origin: THREE.Vector3) {
    const burst = new Burst(origin);
    this.bursts.push(burst);
    this.scene.add(burst.points);
  }

  private readonly handleVisibility = () => {
    this.pageVisible = document.visibilityState !== "hidden";
    this.updateRunning();
  };
}
