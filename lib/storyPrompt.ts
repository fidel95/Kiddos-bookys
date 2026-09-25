import { z } from "zod";
import type { AgeRange } from "@/types/story";

export const BilingualSchema = z.object({
  en: z.string(),
  es: z.string(),
});

export const GeneratedPageSchema = z.object({
  sentences: z.array(BilingualSchema).min(1).max(4),
  sceneTags: z.array(z.string()).min(1).max(8),
});

export const GeneratedStorySchema = z.object({
  title: BilingualSchema,
  pages: z.array(GeneratedPageSchema).min(5).max(10),
});

export type GeneratedStory = z.infer<typeof GeneratedStorySchema>;

interface AgeProfile {
  pageCount: string;
  sentenceGuidance: string;
  vocabGuidance: string;
}

const AGE_PROFILES: Record<AgeRange, AgeProfile> = {
  "3-5": {
    pageCount: "5 to 6",
    sentenceGuidance: "1 to 2 very short sentences per page",
    vocabGuidance: "extremely simple words a toddler knows, repetition is welcome and encouraged",
  },
  "6-8": {
    pageCount: "7 to 8",
    sentenceGuidance: "2 to 3 short sentences per page",
    vocabGuidance: "simple everyday words, early-reader sentence structure",
  },
  "9-12": {
    pageCount: "8 to 10",
    sentenceGuidance: "2 to 4 sentences per page",
    vocabGuidance: "richer vocabulary and slightly longer sentences, still clear and age-appropriate",
  },
};

export function buildSystemPrompt(ageRange: AgeRange): string {
  const profile = AGE_PROFILES[ageRange];
  return `You are a warm, imaginative children's book author who writes original, wholesome bilingual picture books for a family app used by young kids.

Hard rules, no exceptions:
- Vocabulary and sentence length must fit a child aged ${ageRange}: use ${profile.vocabGuidance}.
- Absolutely no violence, danger, scary content, mature themes, or sadness that isn't gently resolved. Keep the tone positive, warm, and encouraging.
- Do not collect or invent sensitive personal details about the child beyond the first name you're given. Never mention a last name, address, school, or any other identifying detail.
- Never use existing copyrighted or trademarked characters, franchises, or brands. Every character and setting must be original.
- Be culturally respectful and inclusive.
- Write ${profile.pageCount} pages, with ${profile.sentenceGuidance}.
- Every single sentence must be provided in BOTH English ("en") and Spanish ("es"), and the two must be faithful, natural translations of each other — not just two different sentences on the same topic. This bilingual pairing is the entire point of the story, so translation quality matters as much as story quality.
- For each page, include 3 to 8 short lowercase "sceneTags" in English describing what to illustrate — not a prose description, just simple one-word tags. Cover: the setting (e.g. "forest", "ocean", "space", "farm", "castle"), every character on the page (e.g. "fox", "owl", "dragon"), the time of day or weather when it matters (e.g. "morning", "sunset", "night", "rain", "snow"), any key object or place (e.g. "pond", "campfire", "treasure", "bridge", "cake", "treehouse") and what the characters are doing (e.g. "sleep", "dance", "run", "wave"). Vary these from page to page so each picture is different.
- Give the story a title in both English and Spanish.`;
}

export function buildUserPrompt(input: { childName?: string; theme: string; ageRange: AgeRange }): string {
  const namePart = input.childName
    ? `The main character should be inspired by a child named ${input.childName} (use that name for the character).`
    : "Invent a friendly original main character.";

  return `Write a brand-new, original bilingual (English/Spanish) picture book story.

Theme or topic: ${input.theme}
${namePart}
Target age range: ${input.ageRange}

Follow all the rules from the system prompt exactly.`;
}
