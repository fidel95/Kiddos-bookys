import manifest from "@/data/illustrations/manifest.json";

interface IllustrationEntry {
  id: string;
  file: string;
  tags: string[];
}

const entries = manifest as IllustrationEntry[];
const FALLBACK_ID = "generic";

/** Picks the local illustration whose tags best overlap the page's sceneTags. */
export function matchIllustration(sceneTags: string[]): string {
  const normalizedTags = sceneTags.map((t) => t.toLowerCase().trim());
  let bestId = FALLBACK_ID;
  let bestScore = 0;

  for (const entry of entries) {
    if (entry.id === FALLBACK_ID) continue;
    const score = entry.tags.filter((tag) =>
      normalizedTags.some((t) => t.includes(tag) || tag.includes(t))
    ).length;
    if (score > bestScore) {
      bestScore = score;
      bestId = entry.id;
    }
  }
  return bestId;
}

export function illustrationSrc(illustrationId: string | undefined): string {
  const entry = entries.find((e) => e.id === illustrationId) ?? entries.find((e) => e.id === FALLBACK_ID);
  return `/illustrations/${entry?.file ?? "generic.svg"}`;
}
