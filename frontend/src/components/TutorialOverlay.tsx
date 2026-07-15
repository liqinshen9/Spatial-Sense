import { useEffect, useMemo, useRef, useState } from "react";

export type TutorialStep = {
  route: string;
  target: string;
  title: string;
  description: string;
};

type TutorialOverlayProps = {
  steps: TutorialStep[];
  currentStepIndex: number;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
};

type HighlightRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

type TooltipSize = {
  width: number;
  height: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function TutorialOverlay({
  steps,
  currentStepIndex,
  onNext,
  onBack,
  onSkip,
}: TutorialOverlayProps) {
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const hasScrolledToTargetRef = useRef(false);

  const [highlightRect, setHighlightRect] = useState<HighlightRect | null>(
    null
  );

  const [isTargetReady, setIsTargetReady] = useState(false);

  const [tooltipSize, setTooltipSize] = useState<TooltipSize>({
    width: 340,
    height: 230,
  });

  const safeStepIndex = clamp(
    currentStepIndex,
    0,
    Math.max(steps.length - 1, 0)
  );

  const currentStep = steps[safeStepIndex];
  const isLastStep = safeStepIndex === steps.length - 1;

  useEffect(() => {
    if (!currentStep) return;

    let isCancelled = false;
    let retryCount = 0;
    const retryTimeouts: number[] = [];

    hasScrolledToTargetRef.current = false;
    setIsTargetReady(false);

    function updateHighlight() {
      if (isCancelled || !currentStep) return;

      const targetElements = Array.from(
  document.querySelectorAll(`[data-tutorial="${currentStep.target}"]`)
);

const targetElement = targetElements.find((element) => {
  if (!(element instanceof HTMLElement)) return false;

  const rect = element.getBoundingClientRect();
  const style = window.getComputedStyle(element);

  return (
    rect.width > 0 &&
    rect.height > 0 &&
    style.display !== "none" &&
    style.visibility !== "hidden" &&
    style.opacity !== "0"
  );
});

if (!(targetElement instanceof HTMLElement)) {
  retryCount++;

  if (retryCount < 30) {
    const retryTimeout = window.setTimeout(updateHighlight, 80);
    retryTimeouts.push(retryTimeout);
  }

  return;
}
      if (!hasScrolledToTargetRef.current) {
        hasScrolledToTargetRef.current = true;

        const isMobile = window.innerWidth < 1024;
        const shouldJumpDirectlyToReset =
            isMobile && currentStep.target === "reset-button";

        targetElement.scrollIntoView({
            block: "center",
            inline: "center",
            behavior: shouldJumpDirectlyToReset ? "auto" : "smooth",
        });
        }

      window.requestAnimationFrame(() => {
        if (isCancelled) return;

        const rect = targetElement.getBoundingClientRect();
        const padding = 8;

        setHighlightRect({
          top: rect.top - padding,
          left: rect.left - padding,
          width: rect.width + padding * 2,
          height: rect.height + padding * 2,
        });

        setIsTargetReady(true);
      });
    }

    const firstTimeout = window.setTimeout(updateHighlight, 80);
    const secondTimeout = window.setTimeout(updateHighlight, 260);
    const thirdTimeout = window.setTimeout(updateHighlight, 520);
    const fourthTimeout = window.setTimeout(updateHighlight, 900);

    function handleResizeOrScroll() {
      updateHighlight();
    }

    window.addEventListener("resize", handleResizeOrScroll);
    window.addEventListener("scroll", handleResizeOrScroll, true);

    return () => {
      isCancelled = true;

      window.clearTimeout(firstTimeout);
      window.clearTimeout(secondTimeout);
      window.clearTimeout(thirdTimeout);
      window.clearTimeout(fourthTimeout);

      retryTimeouts.forEach((timeout) => {
        window.clearTimeout(timeout);
      });

      window.removeEventListener("resize", handleResizeOrScroll);
      window.removeEventListener("scroll", handleResizeOrScroll, true);
    };
  }, [currentStep]);

  useEffect(() => {
    function updateTooltipSize() {
      if (!tooltipRef.current) return;

      const rect = tooltipRef.current.getBoundingClientRect();

      setTooltipSize({
        width: rect.width || 340,
        height: rect.height || 230,
      });
    }

    updateTooltipSize();

    const timeout = window.setTimeout(updateTooltipSize, 80);

    window.addEventListener("resize", updateTooltipSize);

    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener("resize", updateTooltipSize);
    };
  }, [currentStep, highlightRect]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onSkip();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onSkip]);

  const tooltipStyle = useMemo(() => {
  if (!highlightRect || !currentStep) {
    return {
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
    };
  }

  const tooltipWidth = tooltipSize.width;
  const tooltipHeight = tooltipSize.height;
  const margin = 18;
  const screenPadding = 16;

  const maxTop = Math.max(
    screenPadding,
    window.innerHeight - tooltipHeight - screenPadding
  );

  const isMobile = window.innerWidth < 1024;

  const shouldPreferLeftSide =
    currentStep.target === "rotation-step-buttons" ||
    currentStep.target === "rotation-axis-buttons";

  if (shouldPreferLeftSide) {
    const leftSideLeft = highlightRect.left - tooltipWidth - margin;
    const rightSideLeft = highlightRect.left + highlightRect.width + margin;

    const canShowLeft = leftSideLeft >= screenPadding;
    const canShowRight =
      rightSideLeft + tooltipWidth <= window.innerWidth - screenPadding;

    if (canShowLeft || canShowRight) {
      return {
        top: clamp(
          highlightRect.top + highlightRect.height / 2 - tooltipHeight / 2,
          screenPadding,
          maxTop
        ),
        left: canShowLeft ? leftSideLeft : rightSideLeft,
        transform: "none",
      };
    }
  }

  if (currentStep.target === "timer-panel" && isMobile) {
    const belowTargetTop = highlightRect.top + highlightRect.height + margin;
    const lowerScreenTop = window.innerHeight * 0.48;

    const top = clamp(
      Math.max(belowTargetTop, lowerScreenTop),
      screenPadding,
      maxTop
    );

    const left = clamp(
      highlightRect.left + highlightRect.width / 2 - tooltipWidth / 2,
      screenPadding,
      window.innerWidth - tooltipWidth - screenPadding
    );

    return {
      top,
      left,
      transform: "none",
    };
  }

  const canShowBelow =
    highlightRect.top + highlightRect.height + tooltipHeight + margin <
    window.innerHeight - screenPadding;

  const preferredTop = canShowBelow
    ? highlightRect.top + highlightRect.height + margin
    : highlightRect.top - tooltipHeight - margin;

  const top = clamp(preferredTop, screenPadding, maxTop);

  const left = clamp(
    highlightRect.left + highlightRect.width / 2 - tooltipWidth / 2,
    screenPadding,
    window.innerWidth - tooltipWidth - screenPadding
  );

  return {
    top,
    left,
    transform: "none",
  };
}, [highlightRect, currentStep, tooltipSize]);

  if (!currentStep) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-[90]">
      {highlightRect && (
        <div
          className={`pointer-events-none fixed rounded-2xl border-2 border-[var(--color-emphasis)] bg-[var(--color-emphasis)]/10 shadow-[0_0_24px_var(--color-emphasis)] transition-all duration-500 ease-out ${
            isTargetReady ? "opacity-100" : "opacity-0"
          }`}
          style={{
            top: highlightRect.top,
            left: highlightRect.left,
            width: highlightRect.width,
            height: highlightRect.height,
          }}
        />
      )}

      <div
        ref={tooltipRef}
        className={`pretty-scrollbar pointer-events-auto fixed max-h-[calc(100vh-32px)] w-[calc(100vw-32px)] max-w-[340px] overflow-y-auto rounded-3xl border border-[var(--color-nav-border)] bg-[var(--color-bg-primary)]/95 p-5 text-[var(--color-text-primary)] shadow-2xl transition-all duration-500 ease-out ${
          isTargetReady || highlightRect ? "opacity-100" : "opacity-0"
        }`}
        style={tooltipStyle}
      >
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--color-emphasis)]">
          Step {safeStepIndex + 1} of {steps.length}
        </p>

        <h2 className="mt-3 text-xl font-black">{currentStep.title}</h2>

        <p className="mt-3 text-sm font-bold leading-6 opacity-75">
          {currentStep.description}
        </p>

        <div className="mt-5 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onSkip}
            className="rounded-xl border border-[var(--color-nav-border)] px-4 py-2 text-sm font-black text-[var(--color-text-primary)] transition hover:border-[var(--color-emphasis)] hover:text-[var(--color-emphasis)]"
          >
            Skip
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onBack}
              disabled={safeStepIndex === 0}
              className="rounded-xl border border-[var(--color-nav-border)] px-4 py-2 text-sm font-black text-[var(--color-text-primary)] transition hover:border-[var(--color-emphasis)] hover:text-[var(--color-emphasis)] disabled:cursor-not-allowed disabled:opacity-35"
            >
              Back
            </button>

            <button
              type="button"
              onClick={onNext}
              className="rounded-xl bg-[var(--color-emphasis)] px-4 py-2 text-sm font-black text-[var(--color-emphasis-contrast)] transition hover:bg-[var(--color-emphasis-hover)]"
            >
              {isLastStep ? "Finish" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TutorialOverlay;