/**
 * The child's progress, kept in this browser only: best stars per story, earned stickers and
 * favorite books. Every access is guarded — private windows or blocked storage just start fresh.
 */

export interface Progress {
  /** Best star count ever earned per story id. */
  stars: Record<string, number>;
  /** Story ids whose sticker has been earned. */
  stickers: string[];
  favorites: string[];
}

const KEY = "kiddos-bookys:progress";
const EMPTY: Progress = { stars: {}, stickers: [], favorites: [] };

export function getProgress(): Progress {
  if (typeof window === "undefined") return EMPTY;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(KEY) ?? "null") as Partial<Progress> | null;
    return {
      stars: parsed?.stars ?? {},
      stickers: parsed?.stickers ?? [],
      favorites: parsed?.favorites ?? [],
    };
  } catch {
    return EMPTY;
  }
}

function save(progress: Progress): Progress {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(progress));
  } catch {
    // Storage unavailable: progress lasts for this visit only.
  }
  return progress;
}

/** Records a finished read-through: keeps the best star count and awards the sticker. */
export function recordFinish(storyId: string, stars: number): Progress {
  const p = getProgress();
  return save({
    ...p,
    stars: { ...p.stars, [storyId]: Math.max(stars, p.stars[storyId] ?? 0) },
    stickers: p.stickers.includes(storyId) ? p.stickers : [...p.stickers, storyId],
  });
}

export function toggleFavorite(storyId: string): Progress {
  const p = getProgress();
  const favorites = p.favorites.includes(storyId)
    ? p.favorites.filter((id) => id !== storyId)
    : [...p.favorites, storyId];
  return save({ ...p, favorites });
}
