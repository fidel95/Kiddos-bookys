"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { StoredStory } from "@/types/story";
import { getAllStories } from "@/lib/storyStorage";
import StoryCard from "@/components/StoryCard";
import { deleteStory, toggleFavorite } from "@/lib/storyStorage";
import Mascot from "@/components/Mascot";

export default function Home() {
  const [stories, setStories] = useState<StoredStory[]>([]);

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

  return (
    <div className="flex-1 flex flex-col items-center gap-8 p-6 max-w-4xl mx-auto w-full">
      <div className="flex flex-col items-center gap-3 text-center mt-4">
        <Mascot mood="happy" size="lg" />
        <h1 className="text-3xl sm:text-4xl font-extrabold text-purple-900">Kiddos Bookys</h1>
        <p className="text-lg text-purple-500 max-w-sm">
          Made-up storybooks, just for you — read aloud in English and Spanish!
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
        <Link
          href="/create"
          className="flex-1 min-h-[72px] rounded-2xl bg-amber-400 text-xl font-bold text-purple-900 flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform"
        >
          ✨ New Storybook
        </Link>
        <Link
          href="/story/sample-fox-forest"
          className="flex-1 min-h-[72px] rounded-2xl bg-purple-100 text-lg font-bold text-purple-900 flex items-center justify-center gap-2 active:scale-95 transition-transform"
        >
          📖 Try a Sample
        </Link>
      </div>

      {stories.length > 0 ? (
        <div className="w-full">
          <h2 className="text-xl font-bold text-purple-900 mb-3">Your Storybooks</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {stories.slice(0, 6).map((story) => (
              <StoryCard
                key={story.id}
                story={story}
                onToggleFavorite={handleToggleFavorite}
                onDelete={handleDelete}
              />
            ))}
          </div>
          {stories.length > 6 ? (
            <div className="text-center mt-3">
              <Link href="/library" className="font-semibold text-purple-600 underline">
                See all storybooks →
              </Link>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
