"use client";

export default function NarrationControls({
  isPlaying,
  onPlayPause,
  onReplay,
}: {
  isPlaying: boolean;
  onPlayPause: () => void;
  onReplay: () => void;
}) {
  return (
    <div className="flex items-center justify-center gap-4">
      <button
        type="button"
        onClick={onReplay}
        aria-label="Replay page"
        className="min-w-[64px] min-h-[64px] rounded-full bg-amber-100 text-3xl flex items-center justify-center active:scale-90 transition-transform"
      >
        🔁
      </button>
      <button
        type="button"
        onClick={onPlayPause}
        aria-label={isPlaying ? "Pause" : "Play"}
        className="min-w-[84px] min-h-[84px] rounded-full bg-amber-400 text-4xl flex items-center justify-center shadow-lg active:scale-90 transition-transform"
      >
        {isPlaying ? "⏸️" : "▶️"}
      </button>
    </div>
  );
}
