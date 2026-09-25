"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import type { Stage, TapTarget } from "@/lib/scene3d/stage";
import type { ScenePlan } from "@/lib/scene3d/director";
import type { FindChallenge, Language } from "@/types/story";
import { illustrationSrc } from "@/lib/matchIllustration";
import { playBoing, playFound, playPop } from "@/lib/sfx";

const FIRST_HINT_MS = 8000;
const HINT_EVERY_MS = 7000;

/**
 * The page's illustration: a live 3D pop-up diorama (three.js, loaded lazily so it stays out of the
 * main bundle). The flat SVG shows while it loads, and stays as the fallback if WebGL isn't available.
 * Also runs the page's "find it" challenge: tap the right thing to earn a star.
 */
export default function StoryScene({
  plan,
  direction,
  find,
  found,
  language,
  onFound,
}: {
  plan: ScenePlan;
  direction: 1 | -1;
  find?: FindChallenge;
  found: boolean;
  language: Language;
  onFound: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Stage | null>(null);
  const planRef = useRef(plan);
  const [status, setStatus] = useState<"loading" | "ready" | "failed">("loading");
  // Which targets the current picture actually contains, so we never ask for something missing.
  const [available, setAvailable] = useState<string[]>([]);
  const [wrongTap, setWrongTap] = useState(0);

  const challenge = status === "ready" && find && available.includes(find.target) ? find : undefined;

  const handleTap = useEffectEvent((kind: TapTarget, tags: string[]) => {
    if (challenge && !found && tags.includes(challenge.target)) {
      stageRef.current?.celebrate(challenge.target);
      playFound();
      onFound();
      return;
    }
    if (kind === "character") playBoing();
    else playPop();
    if (challenge && !found) setWrongTap((n) => n + 1);
  });

  const showPlan = useEffectEvent((stage: Stage, next: ScenePlan, dir: 1 | -1) => {
    setAvailable(stage.show(next, dir));
  });

  useEffect(() => {
    let cancelled = false;
    let stage: Stage | null = null;
    import("@/lib/scene3d/stage")
      .then(({ Stage: StageClass }) => {
        if (cancelled || !containerRef.current) return;
        try {
          stage = new StageClass(containerRef.current, {
            reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
            // ?quality=high keeps bloom and shadows on even if the device looks slow.
            forceHighQuality: new URLSearchParams(window.location.search).get("quality") === "high",
            onTap: (kind, tags) => handleTap(kind, tags),
          });
        } catch {
          // No WebGL (old device, disabled GPU) — the SVG illustration stays up.
          setStatus("failed");
          return;
        }
        stageRef.current = stage;
        showPlan(stage, planRef.current, 1);
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("failed");
      });
    return () => {
      cancelled = true;
      stage?.dispose();
      stageRef.current = null;
    };
  }, []);

  useEffect(() => {
    planRef.current = plan;
    if (stageRef.current) showPlan(stageRef.current, plan, direction);
  }, [plan, direction]);

  // Stuck? After a while the target hops and sparkles to help.
  const target = challenge && !found ? challenge.target : null;
  useEffect(() => {
    if (!target) return;
    let interval: ReturnType<typeof setInterval> | undefined;
    const first = setTimeout(() => {
      stageRef.current?.nudge(target);
      interval = setInterval(() => stageRef.current?.nudge(target), HINT_EVERY_MS);
    }, FIRST_HINT_MS);
    return () => {
      clearTimeout(first);
      if (interval) clearInterval(interval);
    };
  }, [target, plan]);

  const other: Language = language === "en" ? "es" : "en";

  return (
    <div className="relative w-full h-64 sm:h-80 rounded-3xl overflow-hidden shadow-lg border-4 border-white bg-sky-100 scene-frame">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={illustrationSrc(plan.world)}
        alt=""
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
          status === "ready" ? "opacity-0" : "opacity-100"
        }`}
      />
      <div ref={containerRef} className="absolute inset-0" aria-hidden />
      {challenge ? (
        <div
          key={`${plan.seed}-${found}-${wrongTap}`}
          role="status"
          className={`pointer-events-none absolute top-3 left-1/2 -translate-x-1/2 max-w-[92%] rounded-2xl px-4 py-1.5 text-center shadow-lg ${
            found ? "bg-emerald-400 text-white animate-found" : `bg-white/95 text-purple-900 ${wrongTap ? "animate-shake" : "animate-hint"}`
          }`}
        >
          <p className="text-sm sm:text-base font-extrabold leading-tight whitespace-nowrap">
            {found ? "⭐ You found it! · ¡Lo encontraste!" : `🔍 ${challenge.prompt[language]}`}
          </p>
          {!found ? <p className="text-xs font-semibold opacity-60 leading-tight">{challenge.prompt[other]}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
