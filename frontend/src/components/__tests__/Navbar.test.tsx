import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import Navbar from "../Navbar";
import { renderWithRouter } from "../../test/renderWithRouter";
import type { AuthUser } from "../../types/auth";

const currentUser: AuthUser = {
  id: 1,
  name: "Li",
  email: "li@example.com",
  avatarUrl: null,
  createdAt: "2026-01-01T00:00:00Z",
};

describe("Navbar", () => {
  it("calls navigation and global control handlers", async () => {
    const user = userEvent.setup();
    const props = createNavbarProps();

    renderWithRouter(<Navbar {...props} />);

    await user.click(screen.getByRole("link", { name: /^home$/i }));
    await user.click(screen.getByRole("link", { name: /^leaderboard$/i }));
    await user.click(screen.getByRole("button", { name: /turn sound off/i }));
    await user.click(screen.getByRole("button", { name: /toggle theme/i }));
    await user.click(screen.getByRole("button", { name: /^tutorial$/i }));
    await user.click(screen.getByRole("button", { name: /^login$/i }));

    expect(props.onNavigateRequest).toHaveBeenNthCalledWith(1, "/");
    expect(props.onNavigateRequest).toHaveBeenNthCalledWith(2, "/leaderboard");
    expect(props.onToggleSound).toHaveBeenCalledTimes(1);
    expect(props.onToggleTheme).toHaveBeenCalledTimes(1);
    expect(props.onStartTutorial).toHaveBeenCalledTimes(1);
    expect(props.onLoginClick).toHaveBeenCalledTimes(1);
  });

  it("shows logged-in account controls and opens profile/logout actions", async () => {
    const user = userEvent.setup();
    const props = createNavbarProps({ currentUser });

    renderWithRouter(<Navbar {...props} />);

    expect(screen.getByText(/hello,/i)).toBeInTheDocument();
    expect(screen.getByText("Li")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^login$/i }))
      .not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: /open account settings/i })
    );
    await user.click(screen.getByRole("button", { name: /^logout$/i }));

    expect(props.onProfileClick).toHaveBeenCalledTimes(1);
    expect(props.onLogout).toHaveBeenCalledTimes(1);
  });

  it("uses a tight tutorial target on the Tutorial text", () => {
    renderWithRouter(<Navbar {...createNavbarProps()} />);

    const tutorialButton = screen.getByRole("button", { name: /^tutorial$/i });
    const tutorialTarget = screen.getByText(/^tutorial$/i, {
      selector: "[data-tutorial]",
    });

    expect(tutorialButton).not.toHaveAttribute("data-tutorial");
    expect(tutorialTarget).toHaveAttribute("data-tutorial", "tutorial-button");
  });

  it("disables page navigation and login while tutorial is active", async () => {
    const user = userEvent.setup();
    const props = createNavbarProps({ isTutorialActive: true });

    renderWithRouter(<Navbar {...props} />);

    expect(screen.getByRole("link", { name: /^home$/i }))
      .toHaveAttribute("aria-disabled", "true");
    expect(screen.getByRole("link", { name: /^leaderboard$/i }))
      .toHaveAttribute("aria-disabled", "true");
    expect(screen.getByRole("button", { name: /^login$/i })).toBeDisabled();

    await user.click(screen.getByRole("link", { name: /^home$/i }));
    await user.click(screen.getByRole("link", { name: /^leaderboard$/i }));
    await user.click(screen.getByRole("button", { name: /^login$/i }));

    expect(props.onNavigateRequest).not.toHaveBeenCalled();
    expect(props.onLoginClick).not.toHaveBeenCalled();
  });
});

function createNavbarProps(overrides: Partial<Parameters<typeof Navbar>[0]> = {}) {
  return {
    isDarkMode: false,
    isSoundEnabled: true,
    currentUser: null,
    onToggleTheme: vi.fn(),
    onToggleSound: vi.fn(),
    onLoginClick: vi.fn(),
    onLogout: vi.fn(),
    onNavigateRequest: vi.fn(),
    onProfileClick: vi.fn(),
    onStartTutorial: vi.fn(),
    ...overrides,
  };
}
