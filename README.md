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
- **Illustrations**: pages are illustrated by matching AI-generated scene tags against a small curated set of local SVGs (`lib/matchIllustration.ts`, `public/illustrations/`) — no image-generation API required.

See `types/story.ts` for the full data model.
