import { useEffect } from "react";
import {
  playButtonSound,
  playSliderSound,
  playStartGameSound,
  setSoundEffectsEnabled,
  unlockSoundEffects,
} from "../utils/soundEffects";

export function useMinimalSoundEffects(isSoundEnabled: boolean) {
  useEffect(() => {
    setSoundEffectsEnabled(isSoundEnabled);
  }, [isSoundEnabled]);

  useEffect(() => {
    let lastTouchPlaybackAt = 0;

    function playSoundForTarget(target: HTMLElement | null) {
      if (!target) return;

      void unlockSoundEffects();

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

    function handlePointerDown(event: PointerEvent) {
      if (event.pointerType === "touch") {
        void unlockSoundEffects();
        return;
      }

      playSoundForTarget(event.target as HTMLElement | null);
    }

    function handleTouchStart() {
      void unlockSoundEffects();
    }

    function handleTouchEnd(event: TouchEvent) {
      const now = performance.now();

      if (now - lastTouchPlaybackAt < 120) {
        return;
      }

      lastTouchPlaybackAt = now;
      playSoundForTarget(event.target as HTMLElement | null);
    }

    function handleClick(event: MouseEvent) {
      if ("PointerEvent" in window) {
        return;
      }

      playSoundForTarget(event.target as HTMLElement | null);
    }

    window.addEventListener("pointerdown", handlePointerDown, {
      capture: true,
    });
    window.addEventListener("touchstart", handleTouchStart, {
      capture: true,
      passive: true,
    });
    window.addEventListener("touchend", handleTouchEnd, {
      capture: true,
      passive: true,
    });
    window.addEventListener("click", handleClick, {
      capture: true,
    });

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown, {
        capture: true,
      });
      window.removeEventListener("touchstart", handleTouchStart, {
        capture: true,
      });
      window.removeEventListener("touchend", handleTouchEnd, {
        capture: true,
      });
      window.removeEventListener("click", handleClick, {
        capture: true,
      });
    };
  }, []);
}
