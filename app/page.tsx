"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { STORIES } from "@/data/stories";
import { getProgress, toggleFavorite, type Progress } from "@/lib/progress";
import BookCard from "@/components/BookCard";
import Mascot from "@/components/Mascot";

export default function Home() {
  const [progress, setProgress] = useState<Progress>({ stars: {}, stickers: [], favorites: [] });
  const [onlyFavorites, setOnlyFavorites] = useState(false);

  useEffect(() => {
    // localStorage is unavailable during SSR; load after mount to avoid a hydration mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProgress(getProgress());
  }, []);

  const shown = onlyFavorites ? STORIES.filter((s) => progress.favorites.includes(s.id)) : STORIES;

  return (
    <div className="flex-1 flex flex-col items-center gap-6 p-4 sm:p-6 max-w-5xl mx-auto w-full">
      <div className="flex flex-col items-center gap-2 text-center mt-2">
        <Mascot mood="happy" size="lg" />
        <h1 className="text-3xl sm:text-4xl font-extrabold text-purple-900">Kiddos Bookys</h1>
        <p className="text-lg text-purple-500 max-w-md">
          Pick a story, find the hidden friends, and collect stickers! · ¡Elige un cuento y gana calcomanías!
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/stickers"
          className="rounded-full bg-amber-100 border-2 border-amber-300 px-4 py-2 font-extrabold text-purple-900 active:scale-95 transition-transform"
        >
          🌟 {progress.stickers.length}/{STORIES.length} stickers
        </Link>
        <button
          type="button"
          onClick={() => setOnlyFavorites((v) => !v)}
          aria-pressed={onlyFavorites}
          className={`rounded-full border-2 px-4 py-2 font-extrabold text-purple-900 active:scale-95 transition-transform ${
            onlyFavorites ? "bg-pink-200 border-pink-400" : "bg-white border-pink-200"
          }`}
        >
          {onlyFavorites ? "❤️ Favorites" : "🤍 Favorites"}
        </button>
      </div>

      {shown.length === 0 ? (
        <Mascot mood="thinking" message="Tap 🤍 on a book to make it a favorite! · ¡Toca 🤍 en un libro!" />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 w-full">
          {shown.map((story, i) => (
            <BookCard
              key={story.id}
              story={story}
              index={i}
              stars={progress.stars[story.id]}
              hasSticker={progress.stickers.includes(story.id)}
              isFavorite={progress.favorites.includes(story.id)}
              onToggleFavorite={() => setProgress(toggleFavorite(story.id))}
            />
          ))}
        </div>
      )}
    </div>
  );
}
