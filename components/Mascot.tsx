const MOOD_EMOJI: Record<string, string> = {
  happy: "🦊",
  sleepy: "😴",
  thinking: "🤔",
  celebrating: "🎉",
};

export default function Mascot({
  mood = "happy",
  message,
  size = "md",
}: {
  mood?: "happy" | "sleepy" | "thinking" | "celebrating";
  message?: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClass = size === "lg" ? "text-8xl" : size === "sm" ? "text-4xl" : "text-6xl";

  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <span className={`${sizeClass} animate-bounce-in`} aria-hidden>
        {MOOD_EMOJI[mood]}
      </span>
      {message ? (
        <p className="text-lg sm:text-xl font-semibold text-purple-900 max-w-xs">{message}</p>
      ) : null}
    </div>
  );
}
