import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import TutorialOverlay, { type TutorialStep } from "../TutorialOverlay";

vi.mock("@react-three/fiber", () => ({
  Canvas: () => <div data-testid="mock-canvas" />,
}));

describe("TutorialOverlay", () => {
  beforeEach(() => {
    Object.defineProperty(window.HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: vi.fn(),
    });

    Object.defineProperty(window, "requestAnimationFrame", {
      configurable: true,
      value: (callback: FrameRequestCallback) => {
        callback(0);
        return 1;
      },
    });
  });

  afterEach(() => {
    document.body.innerHTML = "";
    vi.clearAllMocks();
  });

  it("shows a normal tutorial step and calls Next", async () => {
    const user = userEvent.setup();
    const onNext = vi.fn();

    createTutorialTarget("start-game");

    const steps: TutorialStep[] = [
      {
        route: "/",
        target: "start-game",
        title: "Start Game",
        description: "Click this button to start the game.",
      },
      {
        route: "/game",
        target: "target-block",
        title: "Target Block",
        description: "Match your block to this target.",
      },
    ];

    render(
      <TutorialOverlay
        steps={steps}
        currentStepIndex={0}
        onNext={onNext}
        onBack={vi.fn()}
        onSkip={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Start Game")).toBeInTheDocument();
    });

    expect(
      screen.getByText("Click this button to start the game.")
    ).toBeInTheDocument();

    expect(screen.getByText("Step 1 of 2")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^next$/i }));

    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it("disables Back on the first step and calls Exit", async () => {
    const user = userEvent.setup();
    const onSkip = vi.fn();

    createTutorialTarget("difficulty-selector");

    const steps: TutorialStep[] = [
      {
        route: "/",
        target: "difficulty-selector",
        title: "Choose Difficulty",
        description: "Choose Easy, Medium, or Difficult.",
      },
    ];

    render(
      <TutorialOverlay
        steps={steps}
        currentStepIndex={0}
        onNext={vi.fn()}
        onBack={vi.fn()}
        onSkip={onSkip}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Choose Difficulty")).toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: /^back$/i })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: /^exit$/i }));

    expect(onSkip).toHaveBeenCalledTimes(1);
  });

  it("shows the rotation demo tutorial modal", () => {
    const steps: TutorialStep[] = [
      {
        route: "/game",
        target: "rotation-axis-buttons",
        title: "How to Play?",
        description:
          "This example shows how a 90° rotation around the Y axis changes the block.",
        visual: "rotation-demo",
      },
    ];

    render(
      <TutorialOverlay
        steps={steps}
        currentStepIndex={0}
        onNext={vi.fn()}
        onBack={vi.fn()}
        onSkip={vi.fn()}
      />
    );

    expect(screen.getByText("How to Play?")).toBeInTheDocument();
    expect(
      screen.getByText("Recreate target object by manipulating current object.")
    ).toBeInTheDocument();

    expect(screen.getByText("Current")).toBeInTheDocument();
    expect(screen.getByText("Target")).toBeInTheDocument();

    expect(screen.getByText("Rotation Step")).toBeInTheDocument();
    expect(screen.getByText("Rotate Y")).toBeInTheDocument();

    expect(screen.getAllByTestId("mock-canvas")).toHaveLength(2);
    expect(screen.getByRole("button", { name: /^finish$/i }))
      .toBeInTheDocument();
  });

  it("calls Finish, Back, and Exit from the rotation demo modal", async () => {
    const user = userEvent.setup();

    const onNext = vi.fn();
    const onBack = vi.fn();
    const onSkip = vi.fn();

    const steps: TutorialStep[] = [
      {
        route: "/game",
        target: "rotation-axis-buttons",
        title: "How to Play?",
        description:
          "This example shows how a 90° rotation around the Y axis changes the block.",
        visual: "rotation-demo",
      },
    ];

    render(
      <TutorialOverlay
        steps={steps}
        currentStepIndex={0}
        onNext={onNext}
        onBack={onBack}
        onSkip={onSkip}
      />
    );

    await user.click(screen.getByRole("button", { name: /^back$/i }));
    expect(onBack).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: /^finish$/i }));
    expect(onNext).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: /^exit$/i }));
    expect(onSkip).toHaveBeenCalledTimes(1);
  });
});

function createTutorialTarget(targetName: string) {
  const element = document.createElement("button");

  element.setAttribute("data-tutorial", targetName);
  element.textContent = `Mock target: ${targetName}`;

  Object.defineProperty(element, "getBoundingClientRect", {
    configurable: true,
    value: () => ({
      x: 100,
      y: 100,
      top: 100,
      left: 100,
      right: 260,
      bottom: 160,
      width: 160,
      height: 60,
      toJSON: () => {},
    }),
  });

  document.body.appendChild(element);

  return element;
}