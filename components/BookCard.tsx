"use client";

import Link from "next/link";
import type { Story } from "@/types/story";
import { illustrationSrc } from "@/lib/matchIllustration";

/** A storybook on the shelf: cover picture, hero sticker, title, and the child's best stars. */
export default function BookCard({
  story,
  index,
  stars,
  hasSticker,
  isFavorite,
  onToggleFavorite,
}: {
  story: Story;
  index: number;
  stars: number | undefined;
  hasSticker: boolean;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}) {
  const cover = illustrationSrc(story.pages[0]?.illustrationId);
  const maxStars = story.pages.filter((p) => p.find).length + story.quiz.length;

  return (
    <div
      className="group relative animate-bounce-in"
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      <Link
        href={`/story/${story.id}`}
        className="block rounded-3xl overflow-hidden bg-white shadow-md border-4 transition-transform duration-300 hover:-translate-y-1.5 hover:-rotate-1 hover:shadow-xl active:scale-95"
        style={{ borderColor: story.color }}
      >
        <div className="relative overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={cover}
            alt=""
            className="w-full h-32 sm:h-36 object-cover transition-transform duration-500 group-hover:scale-110"
          />
          {/* Book spine shading */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-4 bg-gradient-to-r from-black/25 to-transparent" />
          <div
            className="absolute -bottom-5 right-3 w-14 h-14 rounded-full border-4 border-white shadow-lg flex items-center justify-center text-3xl transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110"
            style={{ background: story.color }}
            aria-hidden
          >
            {story.sticker}
          </div>
        </div>
        <div className="p-3 pt-4">
          <p className="font-extrabold text-purple-900 leading-tight pr-12">{story.title.en}</p>
          <p className="text-sm font-semibold text-purple-400 leading-tight">{story.title.es}</p>
          <p className="mt-2 text-sm font-bold text-purple-900 h-5">
            {stars !== undefined ? (
              <>
                ⭐ {stars}/{maxStars} {hasSticker ? <span className="ml-1">· ✅</span> : null}
              </>
            ) : (
              <span className="text-amber-600">✨ New! · ¡Nuevo!</span>
            )}
          </p>
        </div>
      </Link>
      <button
        type="button"
        onClick={onToggleFavorite}
        aria-label={isFavorite ? `Remove ${story.title.en} from favorites` : `Add ${story.title.en} to favorites`}
        aria-pressed={isFavorite}
        className="absolute top-2 left-2 w-11 h-11 rounded-full bg-white/90 shadow flex items-center justify-center text-2xl active:scale-90 transition-transform"
      >
        {isFavorite ? "❤️" : "🤍"}
      </button>
    </div>
  );
}
