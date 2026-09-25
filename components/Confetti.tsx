const COLORS = ["#ff6b6b", "#ffd166", "#7bd88f", "#6ec6ff", "#b18cff", "#ff9ce6"];
const PIECES = 48;

/** Deterministic pseudo-random in [0, 1) so the layout is stable across renders. */
function rand(i: number, salt: number) {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/** A one-shot shower of confetti for finishing a book. Purely decorative. */
export default function Confetti() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-50" aria-hidden>
      {Array.from({ length: PIECES }, (_, i) => {
        const round = rand(i, 5) < 0.3;
        return (
          <span
            key={i}
            className="confetti-piece"
            style={{
              left: `${rand(i, 1) * 100}%`,
              width: round ? 12 : 8 + rand(i, 2) * 6,
              height: round ? 12 : 14 + rand(i, 3) * 8,
              borderRadius: round ? "9999px" : "3px",
              background: COLORS[i % COLORS.length],
              animationDelay: `${rand(i, 4) * 0.9}s`,
              animationDuration: `${2.4 + rand(i, 6) * 1.8}s`,
              ["--drift" as string]: `${(rand(i, 7) - 0.5) * 160}px`,
              ["--spin" as string]: `${360 + rand(i, 8) * 720}deg`,
            }}
          />
        );
      })}
    </div>
  );
}
