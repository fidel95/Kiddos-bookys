"use client";

import { useState } from "react";
import type { AgeRange } from "@/types/story";
import ParentGate from "@/components/ParentGate";

const THEME_PRESETS = ["Animals", "Space", "Ocean", "Dinosaurs", "Magic", "Vehicles"];
const AGE_OPTIONS: { value: AgeRange; label: string }[] = [
  { value: "3-5", label: "3-5 years" },
  { value: "6-8", label: "6-8 years" },
  { value: "9-12", label: "9-12 years" },
];

export interface StoryCreateInput {
  childName?: string;
  theme: string;
  ageRange: AgeRange;
}

export default function StoryCreateForm({ onSubmit }: { onSubmit: (input: StoryCreateInput) => void }) {
  const [childName, setChildName] = useState("");
  const [theme, setTheme] = useState("");
  const [ageRange, setAgeRange] = useState<AgeRange>("3-5");

  const canSubmit = theme.trim().length > 0;

  function handleApprove() {
    onSubmit({ childName: childName.trim() || undefined, theme: theme.trim(), ageRange });
  }

  return (
    <div className="flex-1 flex flex-col gap-6 max-w-lg mx-auto w-full p-4">
      <h1 className="text-2xl font-bold text-purple-900 text-center">✨ Make a New Storybook</h1>

      <div>
        <label className="block text-lg font-semibold text-purple-900 mb-1">Kid&apos;s name (optional)</label>
        <input
          type="text"
          value={childName}
          onChange={(e) => setChildName(e.target.value)}
          placeholder="e.g. Mia"
          maxLength={30}
          className="w-full min-h-[56px] text-lg border-4 border-amber-200 rounded-2xl px-4 focus:outline-none focus:border-amber-400"
        />
      </div>

      <div>
        <label className="block text-lg font-semibold text-purple-900 mb-1">What should the story be about?</label>
        <input
          type="text"
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          placeholder="e.g. a brave little dragon"
          maxLength={80}
          className="w-full min-h-[56px] text-lg border-4 border-amber-200 rounded-2xl px-4 focus:outline-none focus:border-amber-400"
        />
        <div className="flex flex-wrap gap-2 mt-2">
          {THEME_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setTheme(preset)}
              className="min-h-[44px] px-4 rounded-full bg-purple-100 font-semibold text-purple-900 active:scale-95 transition-transform"
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-lg font-semibold text-purple-900 mb-2">Age</label>
        <div className="flex gap-2">
          {AGE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setAgeRange(option.value)}
              className={`flex-1 min-h-[56px] rounded-2xl font-bold transition-colors ${
                ageRange === option.value ? "bg-amber-400 text-purple-900" : "bg-amber-50 text-purple-400"
              }`}
              aria-pressed={ageRange === option.value}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {canSubmit ? (
        <ParentGate
          onApprove={handleApprove}
          triggerLabel="✨ Make My Story!"
          triggerClassName="min-h-[72px] rounded-2xl bg-amber-400 text-xl font-bold text-purple-900 shadow-lg active:scale-95 transition-transform"
        />
      ) : (
        <button
          type="button"
          disabled
          className="min-h-[72px] rounded-2xl bg-amber-100 text-xl font-bold text-purple-400 opacity-70"
        >
          Type a story idea first!
        </button>
      )}
    </div>
  );
}
