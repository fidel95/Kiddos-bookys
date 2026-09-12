"use client";

import { useState } from "react";
import StoryCreateForm, { type StoryCreateInput } from "@/components/StoryCreateForm";
import LoadingStory from "@/components/LoadingStory";
import StoryReader from "@/components/StoryReader";
import Mascot from "@/components/Mascot";
import { generateStory, StoryGenerationError } from "@/lib/generateStory";
import type { Story } from "@/types/story";

type ViewState = { status: "form" } | { status: "loading" } | { status: "error"; message: string } | { status: "reading"; story: Story };

export default function CreatePage() {
  const [view, setView] = useState<ViewState>({ status: "form" });

  async function handleSubmit(input: StoryCreateInput) {
    setView({ status: "loading" });
    try {
      const story = await generateStory(input);
      setView({ status: "reading", story });
    } catch (error) {
      const message = error instanceof StoryGenerationError ? error.message : "Something went wrong. Let's try again!";
      setView({ status: "error", message });
    }
  }

  if (view.status === "loading") return <LoadingStory />;

  if (view.status === "reading") return <StoryReader key={view.story.id} story={view.story} initialMode="preview" />;

  if (view.status === "error") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-6 p-6 text-center">
        <Mascot mood="thinking" message={view.message} />
        <button
          type="button"
          onClick={() => setView({ status: "form" })}
          className="min-h-[64px] px-8 rounded-2xl bg-amber-400 text-lg font-bold text-purple-900 active:scale-95 transition-transform"
        >
          🔁 Try Again
        </button>
      </div>
    );
  }

  return <StoryCreateForm onSubmit={handleSubmit} />;
}
