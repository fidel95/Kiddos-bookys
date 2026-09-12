export interface Word {
  text: string;
  start: number;
  end: number;
}

/** Splits text into words with character offsets, for mapping TTS boundary events to word indices. */
export function tokenizeWords(text: string): Word[] {
  const words: Word[] = [];
  const regex = /\S+/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    words.push({ text: match[0], start: match.index, end: match.index + match[0].length });
  }
  return words;
}

/** Finds the index of the word containing (or nearest after) the given character offset. */
export function wordIndexAtCharIndex(words: Word[], charIndex: number): number {
  for (let i = 0; i < words.length; i++) {
    if (charIndex >= words[i].start && charIndex < words[i].end) return i;
  }
  for (let i = 0; i < words.length; i++) {
    if (words[i].start >= charIndex) return i;
  }
  return words.length > 0 ? words.length - 1 : -1;
}
