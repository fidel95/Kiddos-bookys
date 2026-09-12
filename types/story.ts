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

export interface Page {
  pageNumber: number;
  sentences: Sentence[];
  sceneTags: string[];
  illustrationId?: string;
}

export interface QuizQuestion {
  question: Bilingual;
  choices: Bilingual[];
  answerIndex: number;
}

export interface Story {
  id: string;
  createdAt: string;
  title: Bilingual;
  childName?: string;
  theme: string;
  ageRange: AgeRange;
  pages: Page[];
  quiz?: QuizQuestion[];
}

export interface StoredStory extends Story {
  isFavorite: boolean;
  lastReadAt?: string;
}

export interface StoryLibrary {
  stories: StoredStory[];
}
