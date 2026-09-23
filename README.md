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
- **Illustrations**: each page's AI-generated scene tags pick a theme (`lib/matchIllustration.ts`). The reader turns that into a live 3D pop-up diorama built with three.js (`lib/scene3d/`): a themed world (`worlds.ts`), scenery (`decor.ts`) and characters summoned by tags like "fox", "dragon" or "rocket" (`characters.ts`), all made from primitives, so no image-generation API or 3D model files are needed. Scenery folds up out of the page on each page turn, and kids can tap characters to make them jump. three.js is loaded lazily; the SVGs in `public/illustrations/` are used for library covers, while the 3D scene loads, and as the fallback when WebGL isn't available.
- **Page turns**: the text card flips like a paper page, words hop in one by one, and pages can be turned by swiping or with the arrow keys. Sound effects are synthesized with Web Audio (`lib/sfx.ts`). All motion is toned down under `prefers-reduced-motion`.

See `types/story.ts` for the full data model.
