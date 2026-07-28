import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useMinimalSoundEffects } from "../useMinimalSoundEffects";
import {
  playButtonSound,
  playSliderSound,
  playStartGameSound,
  setSoundEffectsEnabled,
  unlockSoundEffects,
} from "../../utils/soundEffects";

vi.mock("../../utils/soundEffects", () => ({
  playButtonSound: vi.fn(),
  playSliderSound: vi.fn(),
  playStartGameSound: vi.fn(),
  setSoundEffectsEnabled: vi.fn(),
  unlockSoundEffects: vi.fn(),
}));

describe("useMinimalSoundEffects", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("syncs the enabled flag with sound effects", () => {
    const { rerender } = render(<SoundHarness isSoundEnabled />);

    expect(setSoundEffectsEnabled).toHaveBeenCalledWith(true);

    rerender(<SoundHarness isSoundEnabled={false} />);

    expect(setSoundEffectsEnabled).toHaveBeenCalledWith(false);
  });

  it("plays specialized sounds for start-game and slider targets", () => {
    render(<SoundHarness isSoundEnabled />);

    fireEvent.pointerDown(screen.getByRole("button", { name: /start/i }));
    fireEvent.pointerDown(screen.getByRole("slider", { name: /difficulty/i }));

    expect(playStartGameSound).toHaveBeenCalledTimes(1);
    expect(playSliderSound).toHaveBeenCalledTimes(1);
    expect(playButtonSound).not.toHaveBeenCalled();
  });

  it("plays button sounds but ignores disabled and sound-off targets", () => {
    render(<SoundHarness isSoundEnabled />);

    fireEvent.pointerDown(screen.getByRole("button", { name: /^plain$/i }));
    fireEvent.pointerDown(screen.getByRole("button", { name: /disabled/i }));
    fireEvent.pointerDown(screen.getByRole("button", { name: /quiet/i }));

    expect(playButtonSound).toHaveBeenCalledTimes(1);
  });

  it("unlocks sound effects on mobile touch before playback", () => {
    render(<SoundHarness isSoundEnabled />);

    fireEvent.touchStart(screen.getByRole("button", { name: /^plain$/i }));

    expect(unlockSoundEffects).toHaveBeenCalledTimes(1);
    expect(playButtonSound).not.toHaveBeenCalled();
  });

  it("plays button sounds on mobile touch end", () => {
    render(<SoundHarness isSoundEnabled />);

    fireEvent.touchEnd(screen.getByRole("button", { name: /^plain$/i }));

    expect(unlockSoundEffects).toHaveBeenCalledTimes(1);
    expect(playButtonSound).toHaveBeenCalledTimes(1);
  });
});

function SoundHarness({ isSoundEnabled }: { isSoundEnabled: boolean }) {
  useMinimalSoundEffects(isSoundEnabled);

  return (
    <div>
      <button type="button" data-sound="start-game">
        Start
      </button>
      <input aria-label="Difficulty" type="range" />
      <button type="button">Plain</button>
      <button type="button" disabled>
        Disabled
      </button>
      <button type="button" data-sound="off">
        Quiet
      </button>
    </div>
  );
}
