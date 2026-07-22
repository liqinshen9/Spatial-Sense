import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import DifficultySelector from "../DifficultySelector";

describe("DifficultySelector", () => {
  it("shows the current difficulty label and message", () => {
    render(
      <DifficultySelector
        difficultyIndex={0}
        onDifficultyChange={vi.fn()}
      />
    );

    expect(screen.getByText("Easy")).toBeInTheDocument();
    expect(screen.getByText("No judgement")).toBeInTheDocument();
  });

  it("calls onDifficultyChange when the slider changes", () => {
    const onDifficultyChange = vi.fn();

    render(
      <DifficultySelector
        difficultyIndex={0}
        onDifficultyChange={onDifficultyChange}
      />
    );

    const slider = screen.getByRole("slider", {
      name: /select difficulty/i,
    });

    fireEvent.change(slider, {
      target: { value: "2" },
    });

    expect(onDifficultyChange).toHaveBeenCalledWith(2);
  });

  it("does not allow difficulty changes during the tutorial", () => {
    const onDifficultyChange = vi.fn();

    render(
      <DifficultySelector
        difficultyIndex={2}
        onDifficultyChange={onDifficultyChange}
        isTutorialActive
      />
    );

    const slider = screen.getByRole("slider", {
      name: /select difficulty/i,
    });

    expect(slider).toBeDisabled();

    fireEvent.change(slider, {
      target: { value: "0" },
    });

    expect(onDifficultyChange).not.toHaveBeenCalled();
  });
});