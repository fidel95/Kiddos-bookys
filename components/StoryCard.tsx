"use client";

import Link from "next/link";
import type { StoredStory } from "@/types/story";
import { illustrationSrc, matchIllustration } from "@/lib/matchIllustration";
import ParentGate from "@/components/ParentGate";

export default function StoryCard({
  story,
  onToggleFavorite,
  onDelete,
}: {
  story: StoredStory;
  onToggleFavorite: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const firstPage = story.pages[0];
  const cover = illustrationSrc(firstPage?.illustrationId ?? matchIllustration(firstPage?.sceneTags ?? []));

  return (
    <div className="group relative bg-white rounded-3xl shadow-md overflow-hidden border-4 border-amber-100 flex flex-col animate-bounce-in transition-transform duration-300 hover:-translate-y-1 hover:-rotate-1 hover:shadow-xl">
      <Link href={`/story/${story.id}`} className="block">
        <div className="relative overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={cover}
            alt=""
            className="w-full h-36 object-cover transition-transform duration-500 group-hover:scale-110"
          />
          {/* Book spine shading */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-4 bg-gradient-to-r from-black/20 to-transparent" />
        </div>
        <div className="p-3">
          <p className="font-bold text-purple-900 leading-tight">{story.title.en}</p>
          <p className="text-sm text-purple-500">{story.title.es}</p>
        </div>
      </Link>
      <div className="flex items-center justify-between px-3 pb-3">
        <button
          type="button"
          onClick={() => onToggleFavorite(story.id)}
          aria-label={story.isFavorite ? "Remove favorite" : "Add favorite"}
          className="text-2xl min-w-[48px] min-h-[48px] flex items-center justify-center active:scale-90 transition-transform"
        >
          {story.isFavorite ? "⭐" : "☆"}
        </button>
        <ParentGate
          onApprove={() => onDelete(story.id)}
          triggerLabel="🗑️"
          triggerClassName="text-2xl min-w-[48px] min-h-[48px] flex items-center justify-center active:scale-90 transition-transform"
        />
      </div>
    </div>
  );
}
