"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { StoredStory } from "@/types/story";
import { deleteStory, getAllStories, toggleFavorite } from "@/lib/storyStorage";
import StoryCard from "@/components/StoryCard";
import Mascot from "@/components/Mascot";

export default function LibraryPage() {
  const [stories, setStories] = useState<StoredStory[] | null>(null);

  useEffect(() => {
    // localStorage is unavailable during SSR; load after mount to avoid a hydration mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStories(getAllStories());
  }, []);

  function handleToggleFavorite(id: string) {
    toggleFavorite(id);
    setStories(getAllStories());
  }

  function handleDelete(id: string) {
    deleteStory(id);
    setStories(getAllStories());
  }

  if (stories === null) return null;

  if (stories.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-6 p-6 text-center">
        <Mascot mood="sleepy" message="No storybooks yet! Let's make your first one." />
        <Link
          href="/create"
          className="min-h-[64px] px-8 rounded-2xl bg-amber-400 text-lg font-bold text-purple-900 flex items-center justify-center active:scale-95 transition-transform"
        >
          ✨ Create a Storybook
        </Link>
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-4xl mx-auto w-full p-4">
      <h1 className="text-2xl font-bold text-purple-900 mb-4 text-center">📚 My Storybooks</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {stories.map((story) => (
          <StoryCard
            key={story.id}
            story={story}
            onToggleFavorite={handleToggleFavorite}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </div>
  );
}
