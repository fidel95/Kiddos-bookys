"use client";

import { Fragment, useEffect, useEffectEvent, useMemo, useRef, useState, type TouchEvent } from "react";
import { useRouter } from "next/navigation";
import type { Language, Story } from "@/types/story";
import { tokenizeWords } from "@/lib/words";
import { cancelSpeech, pauseSpeech, resumeSpeech, speakSentence } from "@/lib/tts";
import { planStory } from "@/lib/scene3d/director";
import { getStoryById, markLastRead, saveStory, toggleFavorite } from "@/lib/storyStorage";
import NarrationControls from "@/components/NarrationControls";
import LanguageToggle from "@/components/LanguageToggle";
import Mascot from "@/components/Mascot";
import StoryScene from "@/components/StoryScene";
import Confetti from "@/components/Confetti";
import { playFanfare, playPageTurn } from "@/lib/sfx";

const SWIPE_MIN_PX = 60;

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
  const [direction, setDirection] = useState<1 | -1>(1);
  const playTokenRef = useRef(0);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const page = story.pages[pageIdx];
  const scenePlans = useMemo(() => planStory(story), [story]);
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
      if (targetPageIdx === story.pages.length - 1) finishBook();
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

  function finishBook() {
    setShowEnd(true);
    playFanfare();
  }

  function goToPage(nextIdx: number) {
    stopNarration();
    if (nextIdx !== pageIdx) {
      setDirection(nextIdx > pageIdx ? 1 : -1);
      playPageTurn();
    }
    setPageIdx(nextIdx);
    setSentenceIdx(0);
    setWordIdx(0);
  }

  function handleNext() {
    if (isLastPage) {
      stopNarration();
      finishBook();
      return;
    }
    goToPage(pageIdx + 1);
  }

  function handlePrev() {
    if (pageIdx === 0) return;
    goToPage(pageIdx - 1);
  }

  const handleKey = useEffectEvent((e: KeyboardEvent) => {
    if (showEnd || e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
    if (e.key === "ArrowRight") handleNext();
    else if (e.key === "ArrowLeft") handlePrev();
  });

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => handleKey(e);
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function handleTouchStart(e: TouchEvent) {
    const touch = e.touches[0];
    touchStartRef.current = touch ? { x: touch.clientX, y: touch.clientY } : null;
  }

  function handleTouchEnd(e: TouchEvent) {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    const touch = e.changedTouches[0];
    if (!start || !touch) return;
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    // Only clearly horizontal swipes turn the page, so vertical scrolling still works.
    if (Math.abs(dx) < SWIPE_MIN_PX || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    if (dx < 0) handleNext();
    else handlePrev();
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
        <Confetti />
        <Mascot mood="celebrating" size="lg" />
        <div>
          <p className="text-4xl font-extrabold text-purple-900" aria-label="The End!">
            {Array.from("The End!").map((ch, i) => (
              <span key={i} className="letter-hop" style={{ animationDelay: `${i * 0.08}s` }} aria-hidden>
                {ch === " " ? "\u00a0" : ch}
              </span>
            ))}
          </p>
          <p className="text-xl font-semibold text-purple-500 mt-1">¡El Fin!</p>
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

  let wordCounter = 0;

  return (
    <div
      className="flex-1 flex flex-col max-w-2xl mx-auto w-full p-4 gap-4"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="text-center">
        <p className="text-xl font-extrabold text-purple-900 leading-tight">{story.title.en}</p>
        <p className="text-sm font-semibold text-purple-400">{story.title.es}</p>
      </div>

      <StoryScene plan={scenePlans[pageIdx]} direction={direction} />

      <div
        key={pageIdx}
        className={`flex-1 bg-white rounded-3xl shadow p-5 text-xl sm:text-2xl leading-relaxed font-medium text-purple-900 ${
          direction === 1 ? "page-turn-next" : "page-turn-prev"
        }`}
      >
        {page.sentences.map((sentence, sIdx) => {
          const words = tokenizeWords(sentence[language]);
          return (
            // Keyed by language so switching languages makes the words hop in again.
            <span key={`${language}-${sIdx}`} className="mr-2 inline">
              {words.map((w, wIdx) => {
                const isActive = isPlaying && sIdx === sentenceIdx && wIdx === wordIdx;
                const delay = Math.min(wordCounter++ * 0.045, 1.2) + 0.25;
                return (
                  <Fragment key={wIdx}>
                    <span className="word-pop" style={{ animationDelay: `${delay}s` }}>
                      <span className={isActive ? "word-active bg-amber-300 rounded-lg px-1 -mx-1" : ""}>
                        {w.text}
                      </span>
                    </span>{" "}
                  </Fragment>
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
            className={`h-3.5 rounded-full transition-all duration-300 ${
              i === pageIdx ? "w-8 bg-amber-400" : i < pageIdx ? "w-3.5 bg-amber-300" : "w-3.5 bg-amber-100"
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
