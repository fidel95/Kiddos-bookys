import type { Story, StoredStory, StoryLibrary } from "@/types/story";

const STORAGE_KEY = "kiddos-bookys:library";

function readLibrary(): StoryLibrary {
  if (typeof window === "undefined") return { stories: [] };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { stories: [] };
    const parsed = JSON.parse(raw) as StoryLibrary;
    return { stories: parsed.stories ?? [] };
  } catch {
    return { stories: [] };
  }
}

function writeLibrary(library: StoryLibrary): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(library));
}

export function getAllStories(): StoredStory[] {
  return readLibrary().stories.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function getStoryById(id: string): StoredStory | undefined {
  return readLibrary().stories.find((s) => s.id === id);
}

export function saveStory(story: Story): StoredStory {
  const library = readLibrary();
  const stored: StoredStory = { ...story, isFavorite: false };
  library.stories = [stored, ...library.stories.filter((s) => s.id !== story.id)];
  writeLibrary(library);
  return stored;
}

export function toggleFavorite(id: string): void {
  const library = readLibrary();
  library.stories = library.stories.map((s) =>
    s.id === id ? { ...s, isFavorite: !s.isFavorite } : s
  );
  writeLibrary(library);
}

export function markLastRead(id: string): void {
  const library = readLibrary();
  library.stories = library.stories.map((s) =>
    s.id === id ? { ...s, lastReadAt: new Date().toISOString() } : s
  );
  writeLibrary(library);
}

export function deleteStory(id: string): void {
  const library = readLibrary();
  library.stories = library.stories.filter((s) => s.id !== id);
  writeLibrary(library);
}
