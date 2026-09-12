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
    <div className="relative bg-white rounded-3xl shadow-md overflow-hidden border-4 border-amber-100 flex flex-col">
      <Link href={`/story/${story.id}`} className="block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={cover} alt="" className="w-full h-36 object-cover" />
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
