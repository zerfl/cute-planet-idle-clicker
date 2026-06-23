/**
 * Web Audio API synthesizer for adorable game-feel sound effects & a cosy procedural backing track.
 * By using raw AudioNodes, we do not require any static weight or network assets!
 */

export type MusicStyleId = "classic" | "rainy" | "space" | "chiptune" | "zen";

export interface MusicStyleDef {
  id: MusicStyleId;
  name: string;
  emoji: string;
  description: string;
}

export const MUSIC_STYLES: MusicStyleDef[] = [
  {
    id: "classic",
    name: "Gemütlicher Klassiker",
    emoji: "🌸",
    description: "Warme, entspannende Jazz-Akkorde für kuscheliges Wohlfühlen.",
  },
  {
    id: "rainy",
    name: "Regnerisches Café",
    emoji: "☕🌧️",
    description: "Sanfte Melodien untermalt von echtem, gemütlichem Regenrauschen.",
  },
  {
    id: "space",
    name: "Kosmischer Traum",
    emoji: "🌌",
    description: "Tiefe, schwebende Sphärenklänge für traumfeste Sternenwanderer.",
  },
  {
    id: "chiptune",
    name: "Retro Pixel-Lofi",
    emoji: "🎮",
    description: "Süßer 8-Bit Lofi-Charme mit nostalgischen Konsolen-Keys.",
  },
  {
    id: "zen",
    name: "Heilender Buddha-Garten",
    emoji: "🍃",
    description: "Reine Natur-Harmonien und tiefe, meditative Glocken-Chimes.",
  },
];

let sharedCtx: AudioContext | null = null;
let bMusicGain: GainNode | null = null;
let sfxGain: GainNode | null = null;

let isMuted = false;
let musicVolume = 0.35; // default cozy low volume
let musicPlaying = false;
let currentStyle: MusicStyleId = "chiptune";

let nextChordTimeout: any = null;
let currentChordIndex = 0;

let rainSource: AudioBufferSourceNode | null = null;
let rainGain: GainNode | null = null;

// Different lush chords for each style (Hz)
const CHORD_PRESETS: Record<MusicStyleId, number[][]> = {
  classic: [
    [110.0, 220.0, 277.18, 329.63, 415.3, 493.88], // Amaj9 (Warm & cuddly)
    [130.81, 246.94, 329.63, 415.3, 493.88, 622.25], // C#m7 (Starry)
    [92.5, 185.0, 220.0, 277.18, 329.63, 415.3], // F#m9 (Introspective)
    [123.47, 246.94, 293.66, 369.99, 440.0, 554.37], // Bm11 (Calming)
  ],
  rainy: [
    [110.0, 220.0, 277.18, 329.63, 415.3, 493.88], // Amaj9
    [92.5, 185.0, 220.0, 277.18, 329.63, 415.3], // F#m9
    [146.83, 293.66, 369.99, 440.0, 554.37, 659.25], // Dmaj9 (Sheltering)
    [164.81, 329.63, 392.0, 440.0, 587.33, 659.25], // E7sus4 (Raindrops)
  ],
  space: [
    [130.81, 196.0, 246.94, 329.63, 392.0, 493.88], // Cmaj9 (Celestial depth)
    [110.0, 164.81, 220.0, 261.63, 329.63, 392.0], // Am9 (Cosmo floating)
    [87.31, 130.81, 174.61, 220.0, 261.63, 349.23], // Fmaj7/A
    [98.0, 146.83, 196.0, 246.94, 293.66, 392.0], // G6 (Universal)
  ],
  chiptune: [
    [130.81, 174.61, 220.0, 261.63, 329.63], // Am7 / F chord sweep
    [146.83, 196.0, 246.94, 293.66, 349.23], // G7 chord sweep
    [130.81, 164.81, 220.0, 261.63], // Am
    [164.81, 220.0, 261.63, 329.63], // C/E arcade nostalgic
  ],
  zen: [
    [174.61, 220.0, 261.63, 349.23, 440.0], // Fmaj7 (Forest ground)
    [130.81, 164.81, 196.0, 261.63, 329.63], // Cmaj7 (Deep stillness)
    [196.0, 246.94, 293.66, 392.0, 493.88], // Gmaj (Warm sunbeams)
    [146.83, 196.0, 220.0, 293.66, 369.99], // D7 (Gentle resolve)
  ],
};

// Pentatonic warm chime-bell frequencies (C5 - E6)
const PENTATONIC_BELLS = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66, 1318.51];

export function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!sharedCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return null;
    sharedCtx = new AudioContextClass();

    // Create gain control node for sound effects (clicks etc)
    sfxGain = sharedCtx.createGain();
    sfxGain.connect(sharedCtx.destination);
    sfxGain.gain.setValueAtTime(isMuted ? 0 : 0.8, sharedCtx.currentTime);

    // Create gain control node for background music
    bMusicGain = sharedCtx.createGain();
    bMusicGain.connect(sharedCtx.destination);
    bMusicGain.gain.setValueAtTime(isMuted ? 0 : musicVolume, sharedCtx.currentTime);
  }
  return sharedCtx;
}

export function setMuted(muted: boolean) {
  isMuted = muted;
  if (sfxGain) {
    sfxGain.gain.setValueAtTime(muted ? 0 : 0.8, sharedCtx ? sharedCtx.currentTime : 0);
  }
  if (bMusicGain) {
    bMusicGain.gain.setValueAtTime(muted ? 0 : musicVolume, sharedCtx ? sharedCtx.currentTime : 0);
  }
  if (rainGain) {
    rainGain.gain.setValueAtTime(
      muted ? 0 : musicVolume * 0.45,
      sharedCtx ? sharedCtx.currentTime : 0,
    );
  }
}

export function getMuted() {
  return isMuted;
}

export function getMusicVolume() {
  return musicVolume;
}

export function setMusicVolume(vol: number) {
  musicVolume = vol;
  if (bMusicGain && !isMuted) {
    bMusicGain.gain.setValueAtTime(musicVolume, sharedCtx ? sharedCtx.currentTime : 0);
  }
  if (rainGain && !isMuted) {
    rainGain.gain.setValueAtTime(musicVolume * 0.45, sharedCtx ? sharedCtx.currentTime : 0);
  }
}

export function isMusicPlaying() {
  return musicPlaying;
}

export function getMusicStyle(): MusicStyleId {
  return currentStyle;
}

export function setMusicStyle(style: MusicStyleId) {
  currentStyle = style;
  localStorage.setItem("cute_planet_music_style", style);

  // Instantly handle rain transitions if the soundtrack is playing
  if (musicPlaying) {
    if (style === "rainy") {
      startRain();
    } else {
      stopRain();
    }
  }
}

/**
 * Sweeps frequency of an oscillator to create high-quality chimes/pops.
 */
function playTone({
  startFreq,
  endFreq,
  duration,
  type = "sine",
  gainStart = 0.15,
  swell = false,
}: {
  startFreq: number;
  endFreq: number;
  duration: number;
  type?: OscillatorType;
  gainStart?: number;
  swell?: boolean;
}) {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx || !sfxGain) return;

  // Auto resume if context is suspended (browser autoplay safeguards)
  if (ctx.state === "suspended") {
    ctx.resume();
  }

  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(startFreq, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(endFreq, ctx.currentTime + duration);

  if (swell) {
    gainNode.gain.setValueAtTime(0.01, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(gainStart, ctx.currentTime + duration * 0.15);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  } else {
    gainNode.gain.setValueAtTime(gainStart, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  }

  osc.connect(gainNode);
  gainNode.connect(sfxGain);

  osc.start();
  osc.stop(ctx.currentTime + duration);
}

// 1. Cute bubble pop for planet clicks
export function playPop() {
  playTone({
    startFreq: 400,
    endFreq: 950,
    duration: 0.08,
    type: "sine",
    gainStart: 0.13,
  });
}

// 2. Ascending cute arpeggio for pet buying
export function playBuy() {
  const notes = [261.63, 329.63, 392.0, 523.25]; // C4, E4, G4, C5
  notes.forEach((freq, index) => {
    setTimeout(() => {
      playTone({
        startFreq: freq,
        endFreq: freq * 1.05,
        duration: 0.14,
        type: "sine",
        gainStart: 0.1,
      });
    }, index * 75);
  });
}

// 3. Magical sparkle sweep for upgrades
export function playUpgrade() {
  const startFreq = 620;
  playTone({
    startFreq: startFreq,
    endFreq: startFreq * 2.1,
    duration: 0.32,
    type: "triangle",
    gainStart: 0.07,
    swell: true,
  });

  setTimeout(() => {
    playTone({
      startFreq: startFreq * 1.25,
      endFreq: startFreq * 2.5,
      duration: 0.28,
      type: "sine",
      gainStart: 0.04,
    });
  }, 45);
}

// 4. Soft wooden-chime click for automatic star tapping
export function playTick() {
  playTone({
    startFreq: 330,
    endFreq: 160,
    duration: 0.03,
    type: "triangle",
    gainStart: 0.05,
  });
}

// 5. Bright chord sparkle for a gorgeous Level Up celebration
export function playLevelUp() {
  const baseFreqs = [329.63, 440.0, 554.37, 659.25, 880.0]; // E4, A4, C#5, E5, A5 (Joyful A Major)
  baseFreqs.forEach((freq, idx) => {
    setTimeout(() => {
      playTone({
        startFreq: freq,
        endFreq: freq * 1.15,
        duration: 0.55,
        type: "sine",
        gainStart: 0.06,
      });
    }, idx * 55);
  });
}

/**
 * -------------------------------------------------------------
 * PROCEDURAL LOFI COZY BACKGROUND MUSIC ENGINE
 * -------------------------------------------------------------
 */

export function startBackgroundMusic() {
  if (musicPlaying) return;
  musicPlaying = true;

  // Initialize context and node tree
  getAudioContext();

  if (currentStyle === "rainy") {
    startRain();
  }

  playMusicStep();
}

export function stopBackgroundMusic() {
  musicPlaying = false;
  if (nextChordTimeout) {
    clearTimeout(nextChordTimeout);
    nextChordTimeout = null;
  }
  stopRain();
}

/**
 * Synthesis of Procedural Cozy Rain Waves.
 * Generates soft white noise with cozy lowpass filter envelopes for zero asset weight.
 */
function startRain() {
  if (rainSource) return; // already active
  const ctx = getAudioContext();
  if (!ctx || !bMusicGain) return;

  try {
    const bufferSize = ctx.sampleRate * 2; // 2 seconds of noise buffer
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    rainSource = ctx.createBufferSource();
    rainSource.buffer = buffer;
    rainSource.loop = true;

    // Filter to roll off sharp treble, creating cozy room-rain atmosphere
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = "lowpass";
    lowpass.frequency.setValueAtTime(450, ctx.currentTime);

    // Filter to warm up lower end rain rumble gently
    const warmer = ctx.createBiquadFilter();
    warmer.type = "peaking";
    warmer.frequency.setValueAtTime(120, ctx.currentTime);
    warmer.Q.setValueAtTime(1.0, ctx.currentTime);
    warmer.gain.setValueAtTime(6, ctx.currentTime);

    rainGain = ctx.createGain();
    rainGain.gain.setValueAtTime(isMuted ? 0 : musicVolume * 0.45, ctx.currentTime);

    rainSource.connect(lowpass);
    lowpass.connect(warmer);
    warmer.connect(rainGain);
    rainGain.connect(bMusicGain);

    rainSource.start();
  } catch (err) {
    console.warn("Could not synth procedural rain: ", err);
  }
}

function stopRain() {
  if (rainSource) {
    try {
      rainSource.stop();
    } catch (e) {}
    rainSource.disconnect();
    rainSource = null;
  }
  if (rainGain) {
    rainGain.disconnect();
    rainGain = null;
  }
}

function playMusicStep() {
  if (!musicPlaying) return;

  const ctx = getAudioContext();
  if (!ctx || !bMusicGain) {
    nextChordTimeout = setTimeout(playMusicStep, 1000);
    return;
  }

  // Handle browser safety blocks
  if (ctx.state === "suspended") {
    nextChordTimeout = setTimeout(playMusicStep, 1000);
    return;
  }

  // Get chords corresponding to style
  const styleChords = CHORD_PRESETS[currentStyle] || CHORD_PRESETS.classic;
  const currentNotes = styleChords[currentChordIndex % styleChords.length];

  let type: OscillatorType = "sine";
  let padDelayMs = 140;
  let nextTriggerMs = 5800; // time space between chord turns
  let padVolume = 0.08;
  let bellVolume = 0.055;

  // Custom parameters based on active Lofi Style preset
  if (currentStyle === "chiptune") {
    type = "triangle"; // retro vibe
    padDelayMs = 110;
    nextTriggerMs = 4500; // chipper tempo
    padVolume = 0.045; // softer since triangles are crisp
    bellVolume = 0.04;
  } else if (currentStyle === "space") {
    nextTriggerMs = 7400; // slower and ambient
    padVolume = 0.09;
    bellVolume = 0.07;
  } else if (currentStyle === "zen") {
    nextTriggerMs = 6600;
    padVolume = 0.07;
    bellVolume = 0.065;
  } else if (currentStyle === "rainy") {
    nextTriggerMs = 6200;
    padVolume = 0.075;
  }

  // Play chords slowly (Rhodes arpeggio spread)
  currentNotes.forEach((freq, idx) => {
    setTimeout(() => {
      if (!musicPlaying) return;
      playCozyPadNode(freq, type, padVolume);
    }, idx * padDelayMs);
  });

  // Occasionally sprinkle peaceful cozy random chime bells
  const bellCount = 1 + Math.floor(Math.random() * 2);
  for (let b = 0; b < bellCount; b++) {
    const delayMs = 1800 + Math.random() * 2500;
    setTimeout(() => {
      if (!musicPlaying) return;
      const rBellFreq = PENTATONIC_BELLS[Math.floor(Math.random() * PENTATONIC_BELLS.length)];
      playCozyBellNode(rBellFreq, type === "triangle" ? "triangle" : "sine", bellVolume);
    }, delayMs);
  }

  // Advance to next index
  currentChordIndex = (currentChordIndex + 1) % styleChords.length;

  nextChordTimeout = setTimeout(playMusicStep, nextTriggerMs);
}

// Renders a soft pad note with cozy swelling and smooth release curves
function playCozyPadNode(freq: number, type: OscillatorType = "sine", volume: number = 0.08) {
  const ctx = getAudioContext();
  if (!ctx || !bMusicGain || isMuted) return;

  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);

  const noteDuration = currentStyle === "space" ? 5.8 : 4.8;

  // Smooth pad fading attack & slow sweet decay
  gainNode.gain.setValueAtTime(0.001, ctx.currentTime);
  gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + 1.2);
  gainNode.gain.setValueAtTime(volume, ctx.currentTime + 2.4);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + noteDuration);

  osc.connect(gainNode);
  gainNode.connect(bMusicGain);

  osc.start();
  osc.stop(ctx.currentTime + noteDuration);
}

// Shiny organic bell chime note with custom types
function playCozyBellNode(freq: number, type: OscillatorType = "sine", volume: number = 0.05) {
  const ctx = getAudioContext();
  if (!ctx || !bMusicGain || isMuted) return;

  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);

  const bellDuration = currentStyle === "space" ? 2.6 : 1.8;

  // Immediate peak striking sound, then sweet warm log-decay
  gainNode.gain.setValueAtTime(volume, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + bellDuration);

  osc.connect(gainNode);
  gainNode.connect(bMusicGain);

  osc.start();
  osc.stop(ctx.currentTime + bellDuration);
}
