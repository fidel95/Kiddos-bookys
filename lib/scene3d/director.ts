import type { Page, Story } from "@/types/story";
import { matchIllustration } from "@/lib/matchIllustration";
import type { CharacterKind } from "./characters";

/**
 * The "director" reads each page (scene tags + the English text) and decides what its picture
 * should show: which world, what time of day / weather, which landmark, who is there, what they
 * are doing, and which camera shot to use. It deliberately doesn't import three.js so it can run
 * in the main bundle; the 3D stage only receives the finished plan.
 */

export type Mood = "day" | "morning" | "sunset" | "night" | "rain" | "snow";

export type Action = "idle" | "hop" | "run" | "dance" | "sleep" | "wave" | "fly" | "lookUp" | "cheer";

export type LandmarkKind =
  | "pond"
  | "campfire"
  | "treasure"
  | "treehouse"
  | "cave"
  | "bridge"
  | "boat"
  | "lighthouse"
  | "party"
  | "shootingStar"
  | "snowman"
  | "flowerPatch"
  | "playground"
  | "bed"
  | "house"
  | "castle"
  | "rainbow"
  | "balloon"
  | "mountain"
  | "volcano"
  | "tent"
  | "path";

export type Shot = "wide" | "close" | "low" | "high" | "side";

export interface CastMember {
  kind: CharacterKind;
  action: Action;
}

export interface ScenePlan {
  world: string;
  mood: Mood;
  cast: CastMember[];
  landmarks: LandmarkKind[];
  shot: Shot;
  /** Extra fireflies/sparkles because the text mentions them. */
  sparkle: boolean;
  /** Stable per page, so the same page always builds the same layout. */
  seed: string;
}

const CHARACTER_WORDS: Record<string, CharacterKind> = {
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
  doggy: "puppy",
  kitten: "kitten",
  cat: "kitten",
  kitty: "kitten",
  bear: "bear",
  teddy: "bear",
  cub: "bear",
  bird: "bird",
  parrot: "bird",
  duck: "bird",
  duckling: "bird",
  robin: "bird",
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
  light: "wisp",
  fairy: "wisp",
  glow: "wisp",
  sprite: "wisp",
};

const ACTION_WORDS: Record<string, Action> = {};
function actionWords(action: Action, words: string) {
  for (const w of words.split(" ")) ACTION_WORDS[w] = action;
}
actionWords("hop", "hop hopped hopping skip skipped skipping jump jumped jumping bounce bounced bouncing leap leaped leapt");
actionWords("run", "run ran running race raced racing chase chased trot trotted rush rushed dash dashed zoom zoomed hurry hurried");
actionWords("dance", "dance danced dancing twirl twirled spin spun sing sang singing play played playing");
actionWords("sleep", "sleep sleeping slept sleepy nap napping asleep snore snoring yawn yawned dream dreaming dreamed");
actionWords("wave", "wave waved waving hello hi greet greeted goodbye bye");
actionWords("fly", "fly flew flying soar soared float floated glide glided swim swam swimming");
actionWords("lookUp", "look looked saw see gazed gaze wonder wondered wish wished found discover discovered spotted noticed");
actionWords("cheer", "laugh laughed giggle giggled cheer cheered happy happily smile smiled hooray yay celebrate celebrated hug hugged");

const LANDMARK_WORDS: Record<string, LandmarkKind> = {};
function landmarkWords(kind: LandmarkKind, words: string) {
  for (const w of words.split(" ")) LANDMARK_WORDS[w] = kind;
}
landmarkWords("pond", "pond lake frog frogs lily");
landmarkWords("bridge", "river stream bridge creek");
landmarkWords("campfire", "campfire fire camp camping marshmallow marshmallows");
landmarkWords("treasure", "treasure gold chest coin coins jewel jewels gem gems pirate");
landmarkWords("treehouse", "treehouse");
landmarkWords("cave", "cave cavern tunnel");
landmarkWords("boat", "boat sail sailboat ship raft");
landmarkWords("lighthouse", "lighthouse beach shore seaside");
landmarkWords("party", "party birthday cake celebration picnic cupcake cupcakes feast");
landmarkWords("shootingStar", "wish wished shooting comet");
landmarkWords("snowman", "snowman snowmen");
landmarkWords("flowerPatch", "flower flowers garden bloom blossom blossoms tulip tulips rose roses daisy daisies");
landmarkWords("playground", "playground park swing swings slide");
landmarkWords("bed", "bed pajamas pillow blanket tucked");
landmarkWords("house", "home house cottage village");
landmarkWords("castle", "castle palace princess prince king queen kingdom tower");
landmarkWords("rainbow", "rainbow");
landmarkWords("balloon", "balloon balloons");
landmarkWords("mountain", "mountain mountains climb climbed peak");
landmarkWords("volcano", "volcano");
landmarkWords("tent", "tent");
landmarkWords("path", "explore explored exploring path trail follow followed journey walk walked adventure map");

const MOOD_WORDS: Array<[Mood, string[]]> = [
  ["snow", ["snow", "snowy", "snowing", "snowflake", "snowflakes", "snowman", "winter", "icy", "frozen", "sled"]],
  ["rain", ["rain", "rainy", "raining", "storm", "stormy", "puddle", "puddles", "umbrella", "drizzle"]],
  ["night", ["night", "nighttime", "midnight", "moon", "moonlight", "moonlit", "bedtime", "stars", "starry", "dark", "goodnight"]],
  ["sunset", ["sunset", "evening", "dusk", "twilight"]],
  ["morning", ["morning", "sunrise", "dawn", "breakfast", "woke", "wake"]],
];

const GROUP_WORDS = new Set(["they", "everyone", "everybody", "together", "all", "friends", "we"]);
const SPARKLE_WORDS = new Set(["firefly", "fireflies", "sparkle", "sparkles", "sparkly", "glitter", "twinkle", "twinkled", "magic"]);

function words(text: string): string[] {
  return text.toLowerCase().match(/[a-z]+/g) ?? [];
}

/** "owls" → "owl", "puppies" → "puppy", "foxes" → "fox". */
function singular(word: string): string[] {
  const out = [word];
  if (word.endsWith("ies")) out.push(word.slice(0, -3) + "y");
  if (word.endsWith("es")) out.push(word.slice(0, -2));
  if (word.endsWith("s")) out.push(word.slice(0, -1));
  return out;
}

function characterOf(word: string, names: Map<string, CharacterKind>): { kind: CharacterKind; plural: boolean } | null {
  const named = names.get(word);
  if (named) return { kind: named, plural: false };
  for (const w of singular(word)) {
    const kind = CHARACTER_WORDS[w];
    if (kind) return { kind, plural: w !== word };
  }
  return null;
}

function pageText(page: Page): string[] {
  return page.sentences.map((s) => s.en);
}

/** "a little fox named Nino" → Nino is the fox, so later "Nino hopped" makes the fox hop. */
function learnNames(story: Story): Map<string, CharacterKind> {
  const names = new Map<string, CharacterKind>();
  for (const page of story.pages) {
    for (const sentence of pageText(page)) {
      for (const match of sentence.matchAll(/\b([A-Za-z]+)\s+(?:named|called)\s+([A-Z][a-z]+)/g)) {
        const found = characterOf(match[1].toLowerCase(), names);
        if (found) names.set(match[2].toLowerCase(), found.kind);
      }
    }
  }
  return names;
}

function charactersOnPage(page: Page, names: Map<string, CharacterKind>) {
  const found: Array<{ kind: CharacterKind; plural: boolean }> = [];
  const all = [...page.sceneTags.flatMap(words), ...pageText(page).flatMap(words)];
  for (const w of all) {
    const c = characterOf(w, names);
    if (!c) continue;
    const existing = found.find((f) => f.kind === c.kind);
    if (existing) existing.plural ||= c.plural;
    else found.push(c);
  }
  return found;
}

/** The character who shows up on the most pages is the story's hero, and appears throughout. */
function findProtagonist(story: Story, names: Map<string, CharacterKind>): CharacterKind | null {
  const counts = new Map<CharacterKind, number>();
  const order: CharacterKind[] = [];
  for (const page of story.pages) {
    for (const { kind } of charactersOnPage(page, names)) {
      if (!counts.has(kind)) order.push(kind);
      counts.set(kind, (counts.get(kind) ?? 0) + 1);
    }
  }
  const named = [...names.values()][0];
  if (named) return named;
  let best: CharacterKind | null = null;
  for (const kind of order) if (!best || (counts.get(kind) ?? 0) > (counts.get(best) ?? 0)) best = kind;
  // Only a character who is really in much of the story gets to follow the reader page to page.
  const needed = Math.max(2, Math.ceil(story.pages.length * 0.4));
  return best && (counts.get(best) ?? 0) >= needed ? best : null;
}

function pickMood(tags: string[], text: string[], world: string): Mood {
  if (world === "space") return "day";
  if (world === "night") return "night";
  const fromWords = (ws: string[]) => MOOD_WORDS.find(([, cues]) => ws.some((w) => cues.includes(w)))?.[0];
  const mood = fromWords(tags.flatMap(words)) ?? fromWords(text.flatMap(words)) ?? "day";
  if (world === "ocean" && (mood === "rain" || mood === "snow")) return "day";
  return mood;
}

/** Tags like "night" name a time of day, not a place — prefer a real setting when one is tagged too. */
function pickWorld(page: Page): string {
  if (page.illustrationId) return page.illustrationId;
  const world = matchIllustration(page.sceneTags);
  if (world !== "night") return world;
  const withoutNight = matchIllustration(page.sceneTags.filter((t) => !/night|moon|star|sleep|dream|bedtime/.test(t)));
  return withoutNight === "generic" ? "night" : withoutNight;
}

function pickLandmarks(page: Page): LandmarkKind[] {
  const found: LandmarkKind[] = [];
  for (const w of [...page.sceneTags.flatMap(words), ...pageText(page).flatMap(words)]) {
    const kind = LANDMARK_WORDS[w];
    if (kind && !found.includes(kind)) found.push(kind);
  }
  // A wish under the stars wants a shooting star, so it goes first; a plain path is the
  // least specific, so it only shows up when nothing more interesting is mentioned.
  const rank = (k: LandmarkKind) => (k === "shootingStar" ? 0 : k === "path" ? 2 : 1);
  found.sort((a, b) => rank(a) - rank(b));
  return found.slice(0, 2);
}

function assignActions(page: Page, cast: CastMember[], names: Map<string, CharacterKind>) {
  const give = (action: Action, kind?: CharacterKind) => {
    const targets = kind ? cast.filter((c) => c.kind === kind) : cast;
    const open = targets.filter((c) => c.action === "idle");
    if (kind) open.forEach((c) => (c.action = action));
    else if (open[0]) open[0].action = action;
  };
  const sentences = pageText(page).map(words);

  // Pass 1: "sleepy owls", "dancing bunny" — the word right after the action names who.
  for (const ws of sentences) {
    ws.forEach((w, i) => {
      const action = ACTION_WORDS[w];
      const next = ws[i + 1] && characterOf(ws[i + 1], names);
      if (action && next) give(action, next.kind);
    });
  }
  // Pass 2: "Nino hopped" — the last character mentioned before the verb does it;
  // "they ran" — everyone does; otherwise the hero does.
  for (const ws of sentences) {
    const group = ws.some((w) => GROUP_WORDS.has(w));
    let subject: CharacterKind | null = null;
    for (const w of ws) {
      const c = characterOf(w, names);
      if (c) subject = c.kind;
      const action = ACTION_WORDS[w];
      if (!action) continue;
      if (group) cast.filter((m) => m.action === "idle").forEach((m) => (m.action = action));
      else if (subject && cast.some((m) => m.kind === subject && m.action === "idle")) give(action, subject);
      else give(action);
    }
  }
}

const SHOT_CYCLE: Shot[] = ["side", "close", "low", "high", "wide"];

function pickShot(plan: Omit<ScenePlan, "shot">, pageIndex: number, previous: Shot | null): Shot {
  let shot: Shot;
  const hero = plan.cast[0];
  if (pageIndex === 0) shot = "wide";
  else if (plan.mood === "rain" || plan.mood === "snow") shot = "wide"; // show the sky it's falling from
  else if (plan.cast.some((c) => c.action === "sleep")) shot = "high";
  else if (plan.landmarks.includes("shootingStar") || hero?.action === "lookUp") shot = "low";
  else if (plan.cast.length <= 2 && hero && ["hop", "cheer", "dance", "wave"].includes(hero.action)) shot = "close";
  else if (plan.landmarks.length > 0) shot = "side";
  else if (plan.cast.length >= 3) shot = "wide";
  else shot = SHOT_CYCLE[pageIndex % SHOT_CYCLE.length];
  if (shot === previous) shot = SHOT_CYCLE[(SHOT_CYCLE.indexOf(shot) + 1) % SHOT_CYCLE.length];
  return shot;
}

/** Plans every page of a story at once, so consecutive pages can avoid repeating a shot. */
export function planStory(story: Story): ScenePlan[] {
  const names = learnNames(story);
  const protagonist = findProtagonist(story, names);
  let previousShot: Shot | null = null;

  return story.pages.map((page, pageIndex) => {
    const text = pageText(page);
    const allWords = [...page.sceneTags.flatMap(words), ...text.flatMap(words)];
    const world = pickWorld(page);

    const found = charactersOnPage(page, names);
    if (protagonist && !found.some((f) => f.kind === protagonist)) found.unshift({ kind: protagonist, plural: false });
    else if (protagonist) found.sort((a, b) => Number(b.kind === protagonist) - Number(a.kind === protagonist));
    const cast: CastMember[] = [];
    for (const f of found) if (cast.length < 4) cast.push({ kind: f.kind, action: "idle" });
    // Plural animals ("owls") bring a friend along, space permitting.
    for (const f of found) if (f.plural && cast.length < 4) cast.push({ kind: f.kind, action: "idle" });

    assignActions(page, cast, names);
    if (pageIndex === 0 && cast[0]?.action === "idle") cast[0].action = "wave";

    const base = {
      world,
      mood: pickMood(page.sceneTags, text, world),
      cast,
      landmarks: pickLandmarks(page),
      sparkle: allWords.some((w) => SPARKLE_WORDS.has(w)),
      seed: `${story.id}:${page.pageNumber}`,
    };
    const shot = pickShot(base, pageIndex, previousShot);
    previousShot = shot;
    return { ...base, shot };
  });
}
