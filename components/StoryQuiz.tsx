"use client";

import { useEffect, useRef, useState } from "react";
import type { Language, QuizQuestion } from "@/types/story";
import { cancelSpeech, speakSentence } from "@/lib/tts";
import { playFound, playTryAgain } from "@/lib/sfx";
import Mascot from "@/components/Mascot";

const NEXT_DELAY_MS = 1400;

/**
 * A short picture quiz after the story. Questions are read aloud; wrong answers get a gentle
 * "try again", and every answer right on the first try earns a star.
 */
export default function StoryQuiz({
  questions,
  language,
  onDone,
}: {
  questions: QuizQuestion[];
  language: Language;
  onDone: (firstTryCorrect: number) => void;
}) {
  const [index, setIndex] = useState(0);
  const [wrong, setWrong] = useState<number[]>([]);
  const [solved, setSolved] = useState(false);
  const scoreRef = useRef(0);
  const question = questions[index];
  const other: Language = language === "en" ? "es" : "en";

  useEffect(() => {
    const handle = speakSentence(question.question[language], language, { onWordBoundary: () => {}, onEnd: () => {} });
    return () => handle.cancel();
  }, [question, language]);

  useEffect(() => () => cancelSpeech(), []);

  function speakAgain() {
    cancelSpeech();
    speakSentence(question.question[language], language, { onWordBoundary: () => {}, onEnd: () => {} });
  }

  function choose(choiceIdx: number) {
    if (solved || wrong.includes(choiceIdx)) return;
    if (choiceIdx !== question.answerIndex) {
      playTryAgain();
      setWrong((w) => [...w, choiceIdx]);
      return;
    }
    playFound();
    if (wrong.length === 0) scoreRef.current += 1;
    setSolved(true);
    setTimeout(() => {
      if (index + 1 >= questions.length) {
        onDone(scoreRef.current);
        return;
      }
      setIndex(index + 1);
      setWrong([]);
      setSolved(false);
    }, NEXT_DELAY_MS);
  }

  return (
    <div className="flex-1 flex flex-col items-center gap-5 p-4 sm:p-6 max-w-2xl mx-auto w-full">
      <div className="flex flex-col items-center text-center gap-1">
        <Mascot mood={solved ? "celebrating" : "thinking"} size="md" />
        <p className="text-2xl font-extrabold text-purple-900">Quiz time! · ¡Hora de preguntas!</p>
        <div className="flex gap-2 mt-1" aria-label={`Question ${index + 1} of ${questions.length}`}>
          {questions.map((_, i) => (
            <span
              key={i}
              className={`h-3 rounded-full transition-all duration-300 ${
                i === index ? "w-8 bg-amber-400" : i < index ? "w-3 bg-emerald-400" : "w-3 bg-amber-100"
              }`}
            />
          ))}
        </div>
      </div>

      <div key={index} className="w-full bg-white rounded-3xl shadow p-5 text-center page-turn-next">
        <p className="text-2xl sm:text-3xl font-extrabold text-purple-900 leading-snug">{question.question[language]}</p>
        <p className="text-base font-semibold text-purple-400 mt-1">{question.question[other]}</p>
        <button
          type="button"
          onClick={speakAgain}
          className="mt-3 rounded-full bg-amber-100 px-4 py-2 text-sm font-bold text-purple-900 active:scale-95 transition-transform"
        >
          🔊 Hear it again · Escuchar otra vez
        </button>
      </div>

      <div key={`choices-${index}`} className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
        {question.choices.map((choice, i) => {
          const isWrong = wrong.includes(i);
          const isRight = solved && i === question.answerIndex;
          return (
            <button
              key={`${index}-${i}`}
              type="button"
              onClick={() => choose(i)}
              disabled={isWrong}
              style={{ animationDelay: `${0.15 + i * 0.1}s` }}
              className={`animate-bounce-in flex sm:flex-col items-center gap-3 sm:gap-1 rounded-3xl border-4 p-4 min-h-[88px] text-left sm:text-center transition-all active:scale-95 ${
                isRight
                  ? "bg-emerald-100 border-emerald-400 animate-found"
                  : isWrong
                    ? "bg-gray-100 border-gray-200 opacity-50 animate-shake"
                    : "bg-white border-amber-200 hover:border-amber-400 hover:-translate-y-1 shadow"
              }`}
            >
              <span className="text-5xl sm:text-6xl leading-none" aria-hidden>
                {choice.emoji}
              </span>
              <span>
                <span className="block text-lg font-extrabold text-purple-900 leading-tight">{choice.label[language]}</span>
                <span className="block text-sm font-semibold text-purple-400 leading-tight">{choice.label[other]}</span>
              </span>
            </button>
          );
        })}
      </div>

      <p className="h-7 text-lg font-bold text-center" aria-live="polite">
        {solved ? (
          <span className="text-emerald-600">{wrong.length === 0 ? "⭐ Great job! · ¡Muy bien!" : "✅ You got it! · ¡Lo lograste!"}</span>
        ) : wrong.length > 0 ? (
          <span className="text-purple-500">🤔 Try again! · ¡Inténtalo otra vez!</span>
        ) : null}
      </p>
    </div>
  );
}
