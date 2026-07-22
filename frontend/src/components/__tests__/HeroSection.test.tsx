import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import HeroSection from "../HeroSection";

const { navigateMock } = vi.hoisted(() => ({
  navigateMock: vi.fn(),
}));

vi.mock("react-router-dom", async () => {
  const actual =
    await vi.importActual<typeof import("react-router-dom")>(
      "react-router-dom"
    );

  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock("../HomeBlocks", () => ({
  default: () => <div data-testid="home-blocks" />,
}));

describe("HeroSection", () => {
  beforeEach(() => {
    navigateMock.mockClear();
  });

  it("renders the home page hero content", () => {
    render(
      <HeroSection
        difficultyIndex={0}
        onDifficultyChange={vi.fn()}
      />
    );

    expect(screen.getByText(/spatial/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /start game/i }))
      .toBeInTheDocument();
    expect(screen.getByTestId("home-blocks")).toBeInTheDocument();
  });

  it("navigates to the game page when Start Game is clicked", async () => {
    const user = userEvent.setup();

    render(
      <HeroSection
        difficultyIndex={0}
        onDifficultyChange={vi.fn()}
      />
    );

    await user.click(screen.getByRole("button", { name: /start game/i }));

    expect(navigateMock).toHaveBeenCalledWith("/game");
  });

  it("marks the Start Game button as the special start-game sound target", () => {
    render(
      <HeroSection
        difficultyIndex={0}
        onDifficultyChange={vi.fn()}
      />
    );

    const startButton = screen.getByRole("button", {
      name: /start game/i,
    });

    expect(startButton).toHaveAttribute("data-sound", "start-game");
    expect(startButton).toHaveAttribute("data-tutorial", "start-game");
  });
});