/**
 * Tiny synthesized sound effects (no audio files). Kept quiet so they never drown out narration.
 * Browsers only allow audio after a user gesture, which every caller here already is.
 */

let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function tone(freqFrom: number, freqTo: number, duration: number, volume: number, type: OscillatorType, delay = 0) {
  const ac = audio();
  if (!ac) return;
  const start = ac.currentTime + delay;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freqFrom, start);
  osc.frequency.exponentialRampToValueAtTime(freqTo, start + duration);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain).connect(ac.destination);
  osc.start(start);
  osc.stop(start + duration + 0.05);
}

/** Springy "boing" for tapping a character. */
export function playBoing() {
  tone(260, 720, 0.28, 0.12, "sine");
  tone(520, 1100, 0.18, 0.04, "triangle", 0.05);
}

/** Soft "tick" for tapping scenery. */
export function playPop() {
  tone(600, 900, 0.09, 0.07, "triangle");
}

/** Papery whoosh for turning a page. */
export function playPageTurn() {
  const ac = audio();
  if (!ac) return;
  const duration = 0.35;
  const buffer = ac.createBuffer(1, Math.floor(ac.sampleRate * duration), ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.sin((Math.PI * i) / data.length);
  const src = ac.createBufferSource();
  src.buffer = buffer;
  const filter = ac.createBiquadFilter();
  filter.type = "bandpass";
  filter.Q.value = 0.8;
  filter.frequency.setValueAtTime(900, ac.currentTime);
  filter.frequency.exponentialRampToValueAtTime(3200, ac.currentTime + duration);
  const gain = ac.createGain();
  gain.gain.value = 0.09;
  src.connect(filter).connect(gain).connect(ac.destination);
  src.start();
}

/** Rising sparkle arpeggio for finishing a book. */
export function playFanfare() {
  [523, 659, 784, 1047].forEach((f, i) => tone(f, f * 1.01, 0.3, 0.08, "triangle", i * 0.11));
}
