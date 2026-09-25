"use client";

import { useEffect, useRef, useState } from "react";
import type { Stage } from "@/lib/scene3d/stage";
import type { ScenePlan } from "@/lib/scene3d/director";
import { illustrationSrc } from "@/lib/matchIllustration";
import { playBoing, playPop } from "@/lib/sfx";

/**
 * The page's illustration: a live 3D pop-up diorama (three.js, loaded lazily so it stays out of the
 * main bundle). The flat SVG shows while it loads, and stays as the fallback if WebGL isn't available.
 */
export default function StoryScene({ plan, direction }: { plan: ScenePlan; direction: 1 | -1 }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Stage | null>(null);
  const planRef = useRef(plan);
  const [status, setStatus] = useState<"loading" | "ready" | "failed">("loading");
  const [showHint, setShowHint] = useState(true);

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
            onTap: (target) => {
              if (target === "character") playBoing();
              else playPop();
              setShowHint(false);
            },
          });
        } catch {
          // No WebGL (old device, disabled GPU) — the SVG illustration stays up.
          setStatus("failed");
          return;
        }
        stageRef.current = stage;
        stage.show(planRef.current, 1);
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
    stageRef.current?.show(plan, direction);
  }, [plan, direction]);

  useEffect(() => {
    if (status !== "ready") return;
    const timer = setTimeout(() => setShowHint(false), 6000);
    return () => clearTimeout(timer);
  }, [status]);

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
      {status === "ready" && showHint ? (
        <div className="pointer-events-none absolute top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-white/90 px-4 py-1.5 text-sm font-bold text-purple-800 shadow animate-hint">
          👆 Tap the characters! · ¡Tócalos!
        </div>
      ) : null}
    </div>
  );
}
