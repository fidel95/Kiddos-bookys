"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Language, Story } from "@/types/story";
import { tokenizeWords } from "@/lib/words";
import { cancelSpeech, pauseSpeech, resumeSpeech, speakSentence } from "@/lib/tts";
import { illustrationSrc, matchIllustration } from "@/lib/matchIllustration";
import { getStoryById, markLastRead, saveStory, toggleFavorite } from "@/lib/storyStorage";
import NarrationControls from "@/components/NarrationControls";
import LanguageToggle from "@/components/LanguageToggle";
import Mascot from "@/components/Mascot";

export default function StoryReader({
  story,
  initialMode,
}: {
  story: Story;
  initialMode: "preview" | "library";
}) {
  const router = useRouter();
  const [pageIdx, setPageIdx] = useState(0);
  const [sentenceIdx, setSentenceIdx] = useState(0);
  const [wordIdx, setWordIdx] = useState(0);
  const [language, setLanguage] = useState<Language>("en");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showEnd, setShowEnd] = useState(false);
  const [status, setStatus] = useState<"preview" | "saved">(
    initialMode === "library" ? "saved" : "preview"
  );
  const [isFavorite, setIsFavorite] = useState(false);
  const playTokenRef = useRef(0);

  const page = story.pages[pageIdx];
  const isLastPage = pageIdx === story.pages.length - 1;

  useEffect(() => {
    if (initialMode === "library") {
      // localStorage is unavailable during SSR; load after mount to avoid a hydration mismatch.
      const stored = getStoryById(story.id);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsFavorite(stored?.isFavorite ?? false);
      markLastRead(story.id);
    }
  }, [initialMode, story.id]);

  useEffect(() => {
    return () => {
      playTokenRef.current += 1;
      cancelSpeech();
    };
  }, []);

  function playSentence(targetPageIdx: number, targetSentenceIdx: number, lang: Language) {
    const targetPage = story.pages[targetPageIdx];
    playTokenRef.current += 1;
    const token = playTokenRef.current;

    if (!targetPage || targetSentenceIdx >= targetPage.sentences.length) {
      setIsPlaying(false);
      setIsPaused(false);
      if (targetPageIdx === story.pages.length - 1) setShowEnd(true);
      return;
    }

    cancelSpeech();
    setSentenceIdx(targetSentenceIdx);
    setWordIdx(0);
    setIsPlaying(true);
    setIsPaused(false);

    speakSentence(targetPage.sentences[targetSentenceIdx][lang], lang, {
      onWordBoundary: (idx) => {
        if (playTokenRef.current === token) setWordIdx(idx);
      },
      onEnd: () => {
        if (playTokenRef.current === token) playSentence(targetPageIdx, targetSentenceIdx + 1, lang);
      },
    });
  }

  function stopNarration() {
    playTokenRef.current += 1;
    cancelSpeech();
    setIsPlaying(false);
    setIsPaused(false);
  }

  function handlePlayPause() {
    if (!isPlaying) {
      playSentence(pageIdx, sentenceIdx, language);
    } else if (!isPaused) {
      pauseSpeech();
      setIsPaused(true);
    } else {
      resumeSpeech();
      setIsPaused(false);
    }
  }

  function handleReplay() {
    playSentence(pageIdx, 0, language);
  }

  function goToPage(nextIdx: number) {
    stopNarration();
    setPageIdx(nextIdx);
    setSentenceIdx(0);
    setWordIdx(0);
  }

  function handleNext() {
    if (isLastPage) {
      stopNarration();
      setShowEnd(true);
      return;
    }
    goToPage(pageIdx + 1);
  }

  function handlePrev() {
    if (pageIdx === 0) return;
    goToPage(pageIdx - 1);
  }

  function handleLanguageChange(lang: Language) {
    const wasActivelyPlaying = isPlaying && !isPaused;
    setLanguage(lang);
    stopNarration();
    if (wasActivelyPlaying) {
      playSentence(pageIdx, sentenceIdx, lang);
    }
  }

  function handleReadAgain() {
    setShowEnd(false);
    goToPage(0);
  }

  function handleSave() {
    saveStory(story);
    toggleFavorite(story.id);
    setIsFavorite(true);
    setStatus("saved");
  }

  function handleToggleFavorite() {
    toggleFavorite(story.id);
    setIsFavorite((f) => !f);
  }

  if (showEnd) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-6 p-6 text-center">
        <Mascot mood="celebrating" size="lg" />
        <div>
          <p className="text-2xl font-bold text-purple-900">The End!</p>
          <p className="text-lg text-purple-500">¡El Fin!</p>
        </div>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button
            type="button"
            onClick={handleReadAgain}
            className="min-h-[64px] rounded-2xl bg-amber-100 text-lg font-bold text-purple-900 active:scale-95 transition-transform"
          >
            🔁 Read Again
          </button>
          {status === "preview" ? (
            <button
              type="button"
              onClick={handleSave}
              className="min-h-[64px] rounded-2xl bg-amber-400 text-lg font-bold text-purple-900 active:scale-95 transition-transform"
            >
              💾 Save to My Storybooks
            </button>
          ) : (
            <button
              type="button"
              onClick={handleToggleFavorite}
              className="min-h-[64px] rounded-2xl bg-amber-400 text-lg font-bold text-purple-900 active:scale-95 transition-transform"
            >
              {isFavorite ? "⭐ Favorited!" : "☆ Add to Favorites"}
            </button>
          )}
          <button
            type="button"
            onClick={() => router.push("/create")}
            className="min-h-[64px] rounded-2xl bg-purple-100 text-lg font-bold text-purple-900 active:scale-95 transition-transform"
          >
            ✨ New Story
          </button>
          <button
            type="button"
            onClick={() => router.push("/library")}
            className="min-h-[64px] rounded-2xl bg-purple-100 text-lg font-bold text-purple-900 active:scale-95 transition-transform"
          >
            📚 My Storybooks
          </button>
        </div>
      </div>
    );
  }

  const illustrationId = page.illustrationId ?? matchIllustration(page.sceneTags);

  return (
    <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full p-4 gap-4">
      <div className="text-center">
        <p className="text-xl font-extrabold text-purple-900 leading-tight">{story.title.en}</p>
        <p className="text-sm font-semibold text-purple-400">{story.title.es}</p>
      </div>

      <div className="rounded-3xl overflow-hidden shadow-lg border-4 border-white bg-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={illustrationSrc(illustrationId)} alt="" className="w-full h-56 sm:h-72 object-cover" />
      </div>

      <div className="flex-1 bg-white rounded-3xl shadow p-5 text-xl sm:text-2xl leading-relaxed font-medium text-purple-900">
        {page.sentences.map((sentence, sIdx) => {
          const words = tokenizeWords(sentence[language]);
          return (
            <span key={sIdx} className="mr-2 inline">
              {words.map((w, wIdx) => {
                const isActive = isPlaying && sIdx === sentenceIdx && wIdx === wordIdx;
                return (
                  <span
                    key={wIdx}
                    className={isActive ? "bg-amber-300 rounded px-1 -mx-1" : ""}
                  >
                    {w.text}{" "}
                  </span>
                );
              })}
            </span>
          );
        })}
      </div>

      <div className="flex justify-center gap-1.5">
        {story.pages.map((p, i) => (
          <button
            key={p.pageNumber}
            type="button"
            aria-label={`Go to page ${i + 1}`}
            onClick={() => goToPage(i)}
            className={`w-3.5 h-3.5 rounded-full transition-colors ${
              i === pageIdx ? "bg-amber-400" : "bg-amber-100"
            }`}
          />
        ))}
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handlePrev}
          disabled={pageIdx === 0}
          aria-label="Previous page"
          className="min-w-[64px] min-h-[64px] rounded-full bg-purple-100 text-3xl flex items-center justify-center disabled:opacity-30 active:scale-90 transition-transform"
        >
          ⬅️
        </button>
        <NarrationControls isPlaying={isPlaying && !isPaused} onPlayPause={handlePlayPause} onReplay={handleReplay} />
        <button
          type="button"
          onClick={handleNext}
          aria-label="Next page"
          className="min-w-[64px] min-h-[64px] rounded-full bg-purple-100 text-3xl flex items-center justify-center active:scale-90 transition-transform"
        >
          ➡️
        </button>
      </div>

      <div className="flex justify-center">
        <LanguageToggle language={language} onChange={handleLanguageChange} />
      </div>
    </div>
  );
}
