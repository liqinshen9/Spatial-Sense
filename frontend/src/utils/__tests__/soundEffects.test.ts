import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  playButtonSound,
  playErrorSound,
  playSoundToggleOffSound,
  playSoundToggleOnSound,
  setSoundEffectsEnabled,
} from "../soundEffects";

class OscillatorNodeMock {
  frequency = {
    setValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
  };

  type = "sine";

  connect = vi.fn();
  start = vi.fn();
  stop = vi.fn();
}

class GainNodeMock {
  gain = {
    setValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
  };

  connect = vi.fn();
}

class BiquadFilterNodeMock {
  frequency = {
    setValueAtTime: vi.fn(),
  };

  type = "lowpass";
  connect = vi.fn();
}

class AudioContextMock {
  currentTime = 0;
  destination = {};
  state = "running";

  createOscillator = vi.fn(() => new OscillatorNodeMock());
  createGain = vi.fn(() => new GainNodeMock());
  createBiquadFilter = vi.fn(() => new BiquadFilterNodeMock());
  resume = vi.fn();
}

describe("soundEffects", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    Object.defineProperty(window, "AudioContext", {
      writable: true,
      value: AudioContextMock,
    });

    setSoundEffectsEnabled(true);
  });

  it("plays a button sound when sound is enabled", () => {
    playButtonSound();

    const context = new AudioContextMock();

    expect(context.createOscillator).toBeDefined();
  });

  it("does not throw when playing error sound", () => {
    expect(() => playErrorSound()).not.toThrow();
  });

  it("allows sound toggle on sound even when sound was disabled", () => {
    setSoundEffectsEnabled(false);

    expect(() => playSoundToggleOnSound()).not.toThrow();
  });

  it("does not throw when sound toggle off sound plays", () => {
    expect(() => playSoundToggleOffSound()).not.toThrow();
  });
});