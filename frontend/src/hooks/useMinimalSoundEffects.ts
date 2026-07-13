import { useEffect } from "react";
import {
  playButtonSound,
  playSliderSound,
  playStartGameSound,
  setSoundEffectsEnabled,
} from "../utils/soundEffects";

export function useMinimalSoundEffects(isSoundEnabled: boolean) {
  useEffect(() => {
    setSoundEffectsEnabled(isSoundEnabled);
  }, [isSoundEnabled]);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      const target = event.target as HTMLElement | null;

      if (!target) return;

      if (target.closest("[data-sound='off']")) {
        return;
      }

      if (target.closest("[data-sound='start-game']")) {
        playStartGameSound();
        return;
      }

      const sliderElement = target.closest(
        "input[type='range'], [role='slider'], [data-sound='slider']"
      );

      if (sliderElement) {
        playSliderSound();
        return;
      }

      const clickableElement = target.closest(
        "button, a, input[type='button'], input[type='submit'], input[type='file'], label[data-sound-click], [data-sound-click]"
      );

      if (!clickableElement) {
        return;
      }

      if (
        clickableElement instanceof HTMLButtonElement ||
        clickableElement instanceof HTMLInputElement
      ) {
        if (clickableElement.disabled) {
          return;
        }
      }

      playButtonSound();
    }

    window.addEventListener("pointerdown", handlePointerDown, {
      capture: true,
    });

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown, {
        capture: true,
      });
    };
  }, []);
}