export type Language = "en" | "es";

export type AgeRange = "3-5" | "6-8" | "9-12";

export interface Bilingual {
  en: string;
  es: string;
}

export interface Sentence {
  en: string;
  es: string;
}

/**
 * A "find it" challenge: the child taps `target` in the 3D picture to earn a star.
 * `target` is a character (e.g. "owl"), a landmark (e.g. "treasure") or a scenery tag
 * (e.g. "mushroom", "moon") — see `lib/scene3d/`.
 */
export interface FindChallenge {
  target: string;
  prompt: Bilingual;
}

export interface Page {
  pageNumber: number;
  sentences: Sentence[];
  sceneTags: string[];
  illustrationId?: string;
  find?: FindChallenge;
}

export interface QuizChoice {
  emoji: string;
  label: Bilingual;
}

export interface QuizQuestion {
  question: Bilingual;
  choices: QuizChoice[];
  answerIndex: number;
}

export interface Story {
  id: string;
  title: Bilingual;
  /** Emoji sticker earned for finishing the story. */
  sticker: string;
  /** Tailwind-free hex accent for the book cover. */
  color: string;
  theme: string;
  ageRange: AgeRange;
  pages: Page[];
  quiz: QuizQuestion[];
}
