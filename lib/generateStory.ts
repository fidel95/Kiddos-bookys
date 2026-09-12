import { v4 as uuidv4 } from "uuid";
import type { AgeRange, Bilingual, Page, Story } from "@/types/story";

export interface GenerateStoryInput {
  childName?: string;
  theme: string;
  ageRange: AgeRange;
}

interface GenerateStoryResponse {
  title: Bilingual;
  childName?: string;
  theme: string;
  ageRange: AgeRange;
  pages: Page[];
}

export class StoryGenerationError extends Error {}

export async function generateStory(input: GenerateStoryInput): Promise<Story> {
  const res = await fetch("/api/generate-story", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const data = await res.json().catch(() => null);

  if (!res.ok || !data) {
    throw new StoryGenerationError(data?.friendly ?? "Something went wrong. Let's try again!");
  }

  const generated = data as GenerateStoryResponse;

  return {
    id: uuidv4(),
    createdAt: new Date().toISOString(),
    title: generated.title,
    childName: generated.childName,
    theme: generated.theme,
    ageRange: generated.ageRange,
    pages: generated.pages,
  };
}
