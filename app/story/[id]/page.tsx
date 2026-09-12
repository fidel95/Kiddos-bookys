"use client";

import { use, useEffect, useState } from "react";
import type { Story } from "@/types/story";
import { getStoryById } from "@/lib/storyStorage";
import StoryReader from "@/components/StoryReader";
import Mascot from "@/components/Mascot";
import sampleFoxForest from "@/data/sampleStories/fox-forest.json";

const BUNDLED_SAMPLES: Record<string, Story> = {
  "sample-fox-forest": sampleFoxForest as Story,
};

export default function StoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [story, setStory] = useState<Story | null | undefined>(undefined);
  const [mode, setMode] = useState<"preview" | "library">("preview");

  useEffect(() => {
    // localStorage is unavailable during SSR; load after mount to avoid a hydration mismatch.
    /* eslint-disable react-hooks/set-state-in-effect */
    const stored = getStoryById(id);
    if (stored) {
      setStory(stored);
      setMode("library");
      return;
    }
    const bundled = BUNDLED_SAMPLES[id];
    if (bundled) {
      setStory(bundled);
      setMode("preview");
      return;
    }
    setStory(null);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [id]);

  if (story === undefined) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <Mascot mood="sleepy" message="Loading your storybook..." />
      </div>
    );
  }

  if (story === null) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <Mascot mood="thinking" message="We couldn't find that storybook." />
      </div>
    );
  }

  return <StoryReader key={story.id} story={story} initialMode={mode} />;
}
