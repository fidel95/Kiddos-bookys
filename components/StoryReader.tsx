"use client";

import { Fragment, useEffect, useEffectEvent, useMemo, useRef, useState, type TouchEvent } from "react";
import Link from "next/link";
import type { Language, Story } from "@/types/story";
import { tokenizeWords } from "@/lib/words";
import { cancelSpeech, pauseSpeech, resumeSpeech, speakSentence } from "@/lib/tts";
import { planStory } from "@/lib/scene3d/director";
import { recordFinish } from "@/lib/progress";
import NarrationControls from "@/components/NarrationControls";
import LanguageToggle from "@/components/LanguageToggle";
import StoryScene from "@/components/StoryScene";
import StoryQuiz from "@/components/StoryQuiz";
import Confetti from "@/components/Confetti";
import { playFanfare, playPageTurn } from "@/lib/sfx";

const SWIPE_MIN_PX = 60;

type Phase = "reading" | "quiz" | "end";

export default function StoryReader({ story }: { story: Story }) {
  const [phase, setPhase] = useState<Phase>("reading");
  const [pageIdx, setPageIdx] = useState(0);
  const [sentenceIdx, setSentenceIdx] = useState(0);
  const [wordIdx, setWordIdx] = useState(0);
  const [language, setLanguage] = useState<Language>("en");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [found, setFound] = useState<boolean[]>(() => story.pages.map(() => false));
  const [quizStars, setQuizStars] = useState(0);
  const playTokenRef = useRef(0);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const page = story.pages[pageIdx];
  const scenePlans = useMemo(() => planStory(story), [story]);
  const isLastPage = pageIdx === story.pages.length - 1;
  const findStars = found.filter(Boolean).length;
  const stars = findStars + quizStars;
  const maxStars = story.pages.filter((p) => p.find).length + story.quiz.length;

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
    if (nextIdx !== pageIdx) {
      setDirection(nextIdx > pageIdx ? 1 : -1);
      playPageTurn();
    }
    setPageIdx(nextIdx);
    setSentenceIdx(0);
    setWordIdx(0);
  }

  function handleNext() {
    if (phase !== "reading") return;
    if (isLastPage) {
      stopNarration();
      playPageTurn();
      setPhase("quiz");
      return;
    }
    goToPage(pageIdx + 1);
  }

  function handlePrev() {
    if (phase !== "reading" || pageIdx === 0) return;
    goToPage(pageIdx - 1);
  }

  function handleFound() {
    setFound((f) => f.map((v, i) => (i === pageIdx ? true : v)));
  }

  function handleQuizDone(firstTryCorrect: number) {
    setQuizStars(firstTryCorrect);
    recordFinish(story.id, findStars + firstTryCorrect);
    setPhase("end");
    playFanfare();
  }

  function handleReadAgain() {
    setFound(story.pages.map(() => false));
    setQuizStars(0);
    setPhase("reading");
    setDirection(1);
    setPageIdx(0);
    setSentenceIdx(0);
    setWordIdx(0);
  }

  const handleKey = useEffectEvent((e: KeyboardEvent) => {
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

  const header = (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xl font-extrabold text-purple-900 leading-tight">{story.title[language]}</p>
        <p className="text-sm font-semibold text-purple-400">{story.title[language === "en" ? "es" : "en"]}</p>
      </div>
      <div
        key={stars}
        className="shrink-0 rounded-full bg-amber-100 border-2 border-amber-300 px-3 py-1 text-lg font-extrabold text-purple-900 animate-found"
        aria-label={`${stars} stars`}
      >
        ⭐ {stars}
      </div>
    </div>
  );

  if (phase === "quiz") {
    return (
      <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full p-4 gap-2">
        {header}
        <StoryQuiz questions={story.quiz} language={language} onDone={handleQuizDone} />
        <div className="flex justify-center pb-2">
          <LanguageToggle language={language} onChange={setLanguage} />
        </div>
      </div>
    );
  }

  if (phase === "end") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-5 p-6 text-center">
        <Confetti />
        <p className="text-4xl font-extrabold text-purple-900" aria-label="The End!">
          {Array.from("The End!").map((ch, i) => (
            <span key={i} className="letter-hop" style={{ animationDelay: `${i * 0.08}s` }} aria-hidden>
              {ch === " " ? " " : ch}
            </span>
          ))}
        </p>
        <p className="text-xl font-semibold text-purple-500 -mt-3">¡El Fin!</p>

        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-amber-200 blur-2xl opacity-70 animate-pulse" aria-hidden />
          <div
            className="relative w-40 h-40 rounded-full border-8 border-white shadow-xl flex items-center justify-center animate-sticker"
            style={{ background: story.color }}
          >
            <span className="text-8xl leading-none" aria-hidden>
              {story.sticker}
            </span>
          </div>
        </div>
        <div>
          <p className="text-2xl font-extrabold text-purple-900">You earned a sticker!</p>
          <p className="text-lg font-semibold text-purple-500">¡Ganaste una calcomanía!</p>
        </div>
        <p className="text-2xl font-extrabold text-purple-900">
          ⭐ {stars} <span className="text-purple-400 text-lg">/ {maxStars}</span>
        </p>

        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button
            type="button"
            onClick={handleReadAgain}
            className="min-h-[64px] rounded-2xl bg-amber-100 text-lg font-bold text-purple-900 active:scale-95 transition-transform"
          >
            🔁 Read Again · Leer otra vez
          </button>
          <Link
            href="/"
            className="min-h-[64px] rounded-2xl bg-amber-400 text-lg font-bold text-purple-900 flex items-center justify-center active:scale-95 transition-transform"
          >
            📚 More Stories · Más cuentos
          </Link>
          <Link
            href="/stickers"
            className="min-h-[64px] rounded-2xl bg-purple-100 text-lg font-bold text-purple-900 flex items-center justify-center active:scale-95 transition-transform"
          >
            🌟 My Stickers · Mis calcomanías
          </Link>
        </div>
      </div>
    );
  }

  let wordCounter = 0;
  const pageFound = found[pageIdx];

  return (
    <div
      className="flex-1 flex flex-col max-w-2xl mx-auto w-full p-4 gap-4"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {header}

      <StoryScene
        plan={scenePlans[pageIdx]}
        direction={direction}
        find={page.find}
        found={pageFound}
        language={language}
        onFound={handleFound}
      />

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

      <div className="flex justify-center items-center gap-1.5">
        {story.pages.map((p, i) => (
          <button
            key={p.pageNumber}
            type="button"
            aria-label={`Go to page ${i + 1}`}
            onClick={() => goToPage(i)}
            className={`h-4 rounded-full transition-all duration-300 flex items-center justify-center text-[10px] ${
              i === pageIdx ? "w-9 bg-amber-400" : found[i] ? "w-4 bg-emerald-300" : i < pageIdx ? "w-4 bg-amber-300" : "w-4 bg-amber-100"
            }`}
          >
            {found[i] ? "⭐" : null}
          </button>
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
          aria-label={isLastPage ? "Go to the quiz" : "Next page"}
          className={`min-w-[64px] min-h-[64px] rounded-full text-3xl flex items-center justify-center active:scale-90 transition-transform ${
            pageFound ? "bg-amber-300 animate-nudge" : "bg-purple-100"
          }`}
        >
          {isLastPage ? "🏁" : "➡️"}
        </button>
      </div>

      <div className="flex justify-center">
        <LanguageToggle language={language} onChange={handleLanguageChange} />
      </div>
    </div>
  );
}
