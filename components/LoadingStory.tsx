"use client";

import { useEffect, useState } from "react";
import Mascot from "@/components/Mascot";

const TIPS = [
  "Picking a magic word...",
  "Buscando una palabra mágica...",
  "Drawing the forest...",
  "Dibujando el bosque...",
  "Sprinkling in some adventure...",
  "Añadiendo un poco de aventura...",
];

export default function LoadingStory() {
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTipIndex((i) => (i + 1) % TIPS.length), 1600);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6 p-6">
      <Mascot mood="thinking" size="lg" />
      <p className="text-lg font-semibold text-purple-700 text-center">{TIPS[tipIndex]}</p>
    </div>
  );
}
