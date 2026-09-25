"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { STORIES } from "@/data/stories";
import { getProgress } from "@/lib/progress";
import Mascot from "@/components/Mascot";

export default function StickersPage() {
  const [earned, setEarned] = useState<string[] | null>(null);

  useEffect(() => {
    // localStorage is unavailable during SSR; load after mount to avoid a hydration mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEarned(getProgress().stickers);
  }, []);

  if (earned === null) return null;
  const all = earned.length === STORIES.length;

  return (
    <div className="flex-1 flex flex-col items-center gap-6 p-4 sm:p-6 max-w-4xl mx-auto w-full">
      <div className="text-center">
        <h1 className="text-3xl font-extrabold text-purple-900">🌟 My Sticker Book</h1>
        <p className="text-lg font-semibold text-purple-500">Mi álbum de calcomanías</p>
        <p className="mt-2 text-xl font-extrabold text-purple-900">
          {earned.length} / {STORIES.length}
        </p>
      </div>

      {all ? <Mascot mood="celebrating" message="You collected them all! · ¡Las tienes todas!" /> : null}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 w-full">
        {STORIES.map((story, i) => {
          const has = earned.includes(story.id);
          return (
            <Link
              key={story.id}
              href={`/story/${story.id}`}
              className="flex flex-col items-center gap-2 rounded-3xl bg-white p-4 shadow border-4 border-dashed text-center animate-bounce-in active:scale-95 transition-transform hover:-translate-y-1"
              style={{ animationDelay: `${i * 0.05}s`, borderColor: has ? story.color : "#e9e3f5" }}
            >
              <div
                className={`w-20 h-20 rounded-full flex items-center justify-center text-5xl border-4 border-white shadow-md ${
                  has ? "animate-wiggle" : "grayscale opacity-40"
                }`}
                style={{ background: has ? story.color : "#ddd6ee", animationDelay: `${i * 0.3}s` }}
                aria-hidden
              >
                {has ? story.sticker : "?"}
              </div>
              <p className="text-sm font-extrabold text-purple-900 leading-tight">{story.title.en}</p>
              <p className="text-xs font-semibold text-purple-400 leading-tight">
                {has ? story.title.es : "Read to earn! · ¡Léelo!"}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
