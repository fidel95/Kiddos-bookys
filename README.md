# Kiddos Bookys

Made-up bilingual storybooks for kids — generated on demand in English and Spanish, read aloud with word-by-word highlighting.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Try the sample story from the home page — no API key needed for that.

To generate new AI stories, add your Anthropic API key to `.env.local`:

```
ANTHROPIC_API_KEY=sk-ant-...
```

## How it works

- **Reading**: `/story/[id]` renders a page-by-page bilingual reader with browser text-to-speech (`lib/tts.ts`) and live word highlighting, in English or Spanish.
- **Library**: stories are saved to the browser's `localStorage` (`lib/storyStorage.ts`) — no account or backend database.
- **Generation**: `/create` posts to `app/api/generate-story/route.ts`, which calls the Claude API server-side (so the API key never reaches the browser) and returns a structured bilingual story matching the schema in `lib/storyPrompt.ts`.
- **Illustrations**: every page gets its own live 3D pop-up diorama built with three.js (`lib/scene3d/`), all made from primitives, so no image-generation API or 3D model files are needed. A "director" (`director.ts`) reads the page's scene tags and English text and plans the picture:
  - the world (`worlds.ts`, matched via `lib/matchIllustration.ts`) and the time of day or weather: morning, sunset, night, rain or snow (`moods.ts`)
  - landmarks such as a pond, campfire, treasure, treehouse, lighthouse, party or shooting star (`landmarks.ts`)
  - who is there (`characters.ts`), including the story's recurring hero, learned from phrases like "a fox named Nino"
  - what each character is doing: sleeping, running, hopping, dancing, waving, looking up or cheering
  - a camera shot (wide, close-up, low, bird's-eye or side) that doesn't repeat from the previous page

  The stage (`stage.ts`) pops the scenery up out of the page on each turn, flies the camera to the new shot, and blends the lighting. A bloom pass makes lights, fireflies and magic glow. It steps down to no bloom, then no shadows, if a device can't hold ~30fps; add `?quality=high` to the URL to keep full quality. Kids can tap characters to make them jump. three.js is loaded lazily; the SVGs in `public/illustrations/` are used for library covers, while the 3D scene loads, and as the fallback when WebGL isn't available.
- **Page turns**: the text card flips like a paper page, words hop in one by one, and pages can be turned by swiping or with the arrow keys. Sound effects are synthesized with Web Audio (`lib/sfx.ts`). All motion is toned down under `prefers-reduced-motion`.

See `types/story.ts` for the full data model.
