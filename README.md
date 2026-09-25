# Kiddos Bookys

Ten interactive 3D picture books for kids, in English and Spanish, read aloud with word-by-word highlighting. No account, API key or internet connection needed once installed.

## Getting Started

You need [Node.js](https://nodejs.org) 20 or newer.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and pick a story.

## What kids can do

- **Read along** in English or Spanish. Tap ▶️ to hear the page read aloud with each word highlighted, and switch languages anytime.
- **Find it!** Every page asks the child to find something in the 3D picture ("Find the sleepy owl!", "Tap the treasure!"). Tapping it earns a ⭐. Near misses count, and if a child is stuck, the target hops and sparkles as a hint.
- **Tap anything:** characters jump and spin, scenery wiggles.
- **Quiz:** a three-question picture quiz after each story, read aloud. Each first-try answer earns a ⭐.
- **Stickers:** finishing a story earns its sticker for the sticker book (🌟 in the menu). The shelf remembers each book's best stars and favorites (❤️). Progress is saved in the browser.

## The stories

All stories live in `data/stories.ts`:

| Story | Hero | World |
| --- | --- | --- |
| Nino and the Forest of Light | 🦊 fox | forest, day to night |
| Rosie the Rocket | 🚀 rocket | outer space |
| Coral the Sea Turtle | 🐢 turtle | under the sea |
| Rex's Birthday Party | 🦕 dinosaur | jungle with a volcano |
| Tootle the Brave Little Train | 🚂 train | town in the rain |
| Stella and the Rainbow Castle | 🦄 unicorn | magic land |
| Olive the Night Owl | 🦉 owl | nighttime village |
| Biscuit's Muddy Farm Day | 🐶 puppy | farm |
| Bruno's Snowy Adventure | 🐻 bear | snowy mountains |
| Flutter's Garden Picnic | 🦋 butterfly | sunny meadow |

To add a story, add an entry to `STORIES`. Each page's words drive its picture, so:
- name the hero ("a fox named Nino")
- mention the time of day or weather ("at night", "rain", "snow", "at sunset")
- mention places and things ("pond", "campfire", "treasure", "castle", "bed")
- use action verbs ("hopped", "danced", "fell asleep")

A page's `find.target` can be a character (`"owl"`), a landmark (`"treasure"`) or a scenery tag (`"mushroom"`, `"moon"`, `"tree"`). The director makes sure it's in the picture.

## How it works

- **3D pictures** (`lib/scene3d/`): every page is a live three.js pop-up diorama built from simple shapes, with no model files. `director.ts` reads each page and plans its picture:
  - world, time of day and weather (`worlds.ts`, `moods.ts`)
  - landmarks (`landmarks.ts`)
  - characters and what they're doing (`characters.ts`)
  - a camera shot that keeps the "find it" target in frame

  `stage.ts` renders it. Scenery pops up out of the page on each turn, the camera flies to the new shot, and the lighting blends. A bloom pass makes lights and magic glow. On slow devices it drops the glow, then the shadows, automatically; add `?quality=high` to the URL to keep full quality. three.js is loaded lazily; the SVGs in `public/illustrations/` show while it loads and are the fallback when WebGL isn't available.
- **Page turns:** the text card flips like paper, words hop in, and pages turn with a swipe or the arrow keys. Sound effects are synthesized with Web Audio (`lib/sfx.ts`). All motion is reduced under `prefers-reduced-motion`.
- **Reading aloud** uses the browser's built-in speech (`lib/tts.ts`).
- **Progress** (stars, stickers, favorites) is stored in `localStorage` (`lib/progress.ts`).

See `types/story.ts` for the data model.
