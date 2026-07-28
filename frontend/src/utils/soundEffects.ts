let audioContext: AudioContext | null = null;
let soundEnabled = true;
let lastUiSoundPlayedAt = 0;
let isAudioUnlocked = false;

type AudioContextConstructor = typeof AudioContext;

type ToneOptions = {
  startFrequency: number;
  endFrequency: number;
  volume: number;
  duration: number;
  delay?: number;
  type?: OscillatorType;
  ignoreEnabled?: boolean;
};

function getAudioContext() {
  if (audioContext) {
    return audioContext;
  }

  const AudioContextClass =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: AudioContextConstructor })
      .webkitAudioContext;

  if (!AudioContextClass) {
    return null;
  }

  audioContext = new AudioContextClass();
  return audioContext;
}

export function setSoundEffectsEnabled(isEnabled: boolean) {
  soundEnabled = isEnabled;
}

export function unlockSoundEffects() {
  const context = getAudioContext();

  if (!context) {
    return;
  }

  if (context.state === "suspended") {
    void context.resume();
  }

  if (isAudioUnlocked) {
    return;
  }

  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const now = context.currentTime;

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.01);

  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(now);
  oscillator.stop(now + 0.01);

  isAudioUnlocked = true;
}

function playTone({
  startFrequency,
  endFrequency,
  volume,
  duration,
  delay = 0,
  type = "sine",
  ignoreEnabled = false,
}: ToneOptions) {
  if (!soundEnabled && !ignoreEnabled) {
    return;
  }

  const context = getAudioContext();

  if (!context) {
    return;
  }

  if (context.state === "suspended") {
    void context.resume();
  }

  const now = context.currentTime + delay;

  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const filter = context.createBiquadFilter();

  oscillator.type = type;

  oscillator.frequency.setValueAtTime(startFrequency, now);
  oscillator.frequency.exponentialRampToValueAtTime(
    endFrequency,
    now + duration
  );

  filter.type = "lowpass";
  filter.frequency.setValueAtTime(1700, now);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(volume, now + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  oscillator.connect(filter);
  filter.connect(gain);
  gain.connect(context.destination);

  oscillator.start(now);
  oscillator.stop(now + duration);
}

function canPlayUiSound() {
  const now = performance.now();

  if (now - lastUiSoundPlayedAt < 35) {
    return false;
  }

  lastUiSoundPlayedAt = now;
  return true;
}

export function playButtonSound() {
  if (!canPlayUiSound()) return;

  playTone({
    startFrequency: 520,
    endFrequency: 390,
    volume: 0.03,
    duration: 0.05,
    type: "sine",
  });
}

export function playSliderSound() {
  if (!canPlayUiSound()) return;

  playTone({
    startFrequency: 360,
    endFrequency: 470,
    volume: 0.025,
    duration: 0.045,
    type: "sine",
  });
}

export function playStartGameSound() {
  playTone({
    startFrequency: 260,
    endFrequency: 520,
    volume: 0.035,
    duration: 0.08,
    type: "triangle",
  });

  playTone({
    startFrequency: 660,
    endFrequency: 920,
    volume: 0.025,
    duration: 0.09,
    delay: 0.06,
    type: "sine",
  });
}

export function playPuzzleSolvedSound() {
  playTone({
    startFrequency: 520,
    endFrequency: 720,
    volume: 0.03,
    duration: 0.07,
    type: "sine",
  });

  playTone({
    startFrequency: 780,
    endFrequency: 980,
    volume: 0.022,
    duration: 0.075,
    delay: 0.055,
    type: "triangle",
  });
}

export function playGameCompleteSound() {
  playTone({
    startFrequency: 420,
    endFrequency: 620,
    volume: 0.032,
    duration: 0.07,
    type: "triangle",
  });

  playTone({
    startFrequency: 620,
    endFrequency: 840,
    volume: 0.026,
    duration: 0.08,
    delay: 0.06,
    type: "sine",
  });

  playTone({
    startFrequency: 840,
    endFrequency: 1100,
    volume: 0.022,
    duration: 0.09,
    delay: 0.13,
    type: "sine",
  });
}

export function playErrorSound() {
  playTone({
    startFrequency: 220,
    endFrequency: 165,
    volume: 0.035,
    duration: 0.08,
    type: "triangle",
  });

  playTone({
    startFrequency: 180,
    endFrequency: 140,
    volume: 0.025,
    duration: 0.07,
    delay: 0.075,
    type: "sine",
  });
}

export function playWarningSound() {
  playTone({
    startFrequency: 300,
    endFrequency: 220,
    volume: 0.035,
    duration: 0.075,
    type: "triangle",
  });

  playTone({
    startFrequency: 260,
    endFrequency: 190,
    volume: 0.025,
    duration: 0.075,
    delay: 0.07,
    type: "sine",
  });
}

export function playSoundToggleOnSound() {
  playTone({
    startFrequency: 440,
    endFrequency: 660,
    volume: 0.032,
    duration: 0.07,
    type: "sine",
    ignoreEnabled: true,
  });
}

export function playSoundToggleOffSound() {
  playTone({
    startFrequency: 520,
    endFrequency: 300,
    volume: 0.028,
    duration: 0.06,
    type: "sine",
  });
}
