import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Leaderboard from "../Leaderboard";
import { renderWithRouter } from "../../test/renderWithRouter";
import { getScoresByDifficulty } from "../../api/scores";
import type { AuthUser } from "../../types/auth";
import type { ScoreRanking } from "../../types/score";

vi.mock("../../api/scores", () => ({
  getScoresByDifficulty: vi.fn(),
}));

vi.mock("../BlockLoading", () => ({
  default: () => <div>Loading leaderboard...</div>,
}));

const mockCurrentUser: AuthUser = {
  id: 1,
  name: "Li",
  email: "li@example.com",
  avatarUrl: null,
  createdAt: "2026-01-01T00:00:00Z",
};

const mockScores: ScoreRanking[] = [
  {
    id: 1,
    rank: 1,
    userId: 1,
    username: "Li",
    avatarUrl: null,
    difficulty: "easy",
    elapsedMilliseconds: 12345,
    time: "00:12.34",
    createdAt: "2026-01-01T00:00:00Z",
  },
  {
    id: 2,
    rank: 2,
    userId: 2,
    username: "Alex",
    avatarUrl: null,
    difficulty: "easy",
    elapsedMilliseconds: 20000,
    time: "00:20.00",
    createdAt: "2026-01-01T00:00:00Z",
  },
];

describe("Leaderboard", () => {
  beforeEach(() => {
    vi.mocked(getScoresByDifficulty).mockResolvedValue(mockScores);
  });

  it("loads and displays leaderboard scores", async () => {
    renderWithRouter(
      <Leaderboard
        currentUser={mockCurrentUser}
        onOpenProfileModal={vi.fn()}
      />,
      "/leaderboard?difficulty=easy"
    );

    expect(screen.getByText(/loading leaderboard/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Li")).toBeInTheDocument();
    });

    expect(screen.getByText("Alex")).toBeInTheDocument();
    expect(screen.getByText("00:12.34")).toBeInTheDocument();
    expect(screen.getByText("00:20.00")).toBeInTheDocument();
  });

  it("reloads scores when the difficulty tab changes", async () => {
    const user = userEvent.setup();

    renderWithRouter(
      <Leaderboard
        currentUser={mockCurrentUser}
        onOpenProfileModal={vi.fn()}
      />,
      "/leaderboard?difficulty=easy"
    );

    await waitFor(() => {
      expect(getScoresByDifficulty).toHaveBeenCalledWith("easy");
    });

    await user.click(screen.getByRole("button", { name: /medium/i }));

    await waitFor(() => {
      expect(getScoresByDifficulty).toHaveBeenCalledWith("medium");
    });
  });

  it("keeps the highlighted score id when switching difficulty tabs", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter
        initialEntries={["/leaderboard?difficulty=easy&highlightScoreId=1"]}
      >
        <Leaderboard
          currentUser={mockCurrentUser}
          onOpenProfileModal={vi.fn()}
        />
        <LocationSearch />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Li")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /medium/i }));

    expect(screen.getByTestId("location-search")).toHaveTextContent(
      "difficulty=medium"
    );
    expect(screen.getByTestId("location-search")).toHaveTextContent(
      "highlightScoreId=1"
    );

    await user.click(screen.getByRole("button", { name: /easy/i }));

    expect(screen.getByTestId("location-search")).toHaveTextContent(
      "difficulty=easy"
    );
    expect(screen.getByTestId("location-search")).toHaveTextContent(
      "highlightScoreId=1"
    );
  });

  it("opens profile only for the current user's row", async () => {
    const user = userEvent.setup();
    const onOpenProfileModal = vi.fn();

    renderWithRouter(
      <Leaderboard
        currentUser={mockCurrentUser}
        onOpenProfileModal={onOpenProfileModal}
      />,
      "/leaderboard?difficulty=easy"
    );

    await waitFor(() => {
      expect(screen.getByText("Li")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /open account settings/i }));

    expect(onOpenProfileModal).toHaveBeenCalled();
  });

  it("uses the latest current user avatar for the current leaderboard row", async () => {
    vi.mocked(getScoresByDifficulty).mockResolvedValue([
      {
        ...mockScores[0],
        avatarUrl: "/uploads/avatars/old.png",
      },
    ]);

    renderWithRouter(
      <Leaderboard
        currentUser={{
          ...mockCurrentUser,
          avatarUrl: "/uploads/avatars/new.png",
        }}
        onOpenProfileModal={vi.fn()}
      />,
      "/leaderboard?difficulty=easy"
    );

    const avatar = await screen.findByAltText("Li's avatar");

    expect(avatar).toHaveAttribute(
      "src",
      "http://localhost:5000/uploads/avatars/new.png"
    );
  });
});

function LocationSearch() {
  const location = useLocation();

  return <div data-testid="location-search">{location.search}</div>;
}
