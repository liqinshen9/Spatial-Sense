import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import ConfirmModal from "../ConfirmModal";

describe("ConfirmModal", () => {
  it("renders default button labels and calls both actions", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    const onConfirm = vi.fn();

    render(
      <ConfirmModal
        title="Leave game?"
        message="Your progress will be lost."
        onCancel={onCancel}
        onConfirm={onConfirm}
      />
    );

    expect(screen.getByRole("heading", { name: /leave game/i }))
      .toBeInTheDocument();
    expect(screen.getByText(/your progress will be lost/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^cancel$/i }));
    await user.click(screen.getByRole("button", { name: /^confirm$/i }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("supports custom button labels", () => {
    render(
      <ConfirmModal
        title="Reset puzzle?"
        message="Start over from the original block."
        cancelText="Keep Playing"
        confirmText="Reset"
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
      />
    );

    expect(screen.getByRole("button", { name: /keep playing/i }))
      .toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^reset$/i }))
      .toBeInTheDocument();
  });
});
