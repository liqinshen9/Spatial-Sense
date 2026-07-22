import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ProfileModal from "../ProfileModal";
import { deleteUserAccount, updateUserAvatar } from "../../api/users";
import type { AuthUser } from "../../types/auth";

vi.mock("../../api/users", () => ({
  updateUserAvatar: vi.fn(),
  deleteUserAccount: vi.fn(),
}));

vi.mock("../../utils/soundEffects", () => ({
  playWarningSound: vi.fn(),
}));

const currentUser: AuthUser = {
  id: 7,
  name: "Li",
  email: "li@example.com",
  avatarUrl: null,
  createdAt: "2026-01-01T00:00:00Z",
};

describe("ProfileModal", () => {
  beforeEach(() => {
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn(() => "blob:avatar-preview"),
      revokeObjectURL: vi.fn(),
    });
  });

  it("renders profile details and closes from the close button", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    renderProfileModal({ onClose });

    expect(screen.getByRole("heading", { name: /my profile/i }))
      .toBeInTheDocument();
    expect(screen.getByText("Li")).toBeInTheDocument();
    expect(screen.getByText("li@example.com")).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: /close profile modal/i })
    );

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("uploads a selected avatar and reports the updated user", async () => {
    const user = userEvent.setup();
    const onUserUpdated = vi.fn();
    const updatedUser = {
      ...currentUser,
      avatarUrl: "/avatars/li.png",
    };

    vi.mocked(updateUserAvatar).mockResolvedValue(updatedUser);

    renderProfileModal({ onUserUpdated });

    const avatarFile = new File(["avatar"], "avatar.png", {
      type: "image/png",
    });

    await user.upload(screen.getByLabelText(/change avatar/i), avatarFile);
    await user.click(screen.getByRole("button", { name: /save avatar/i }));

    await waitFor(() => {
      expect(updateUserAvatar).toHaveBeenCalledWith(currentUser.id, avatarFile);
    });

    expect(onUserUpdated).toHaveBeenCalledWith(updatedUser);
    expect(screen.getByText(/avatar updated/i)).toBeInTheDocument();
  });

  it("requires a second delete click before deleting the account", async () => {
    const user = userEvent.setup();
    const onAccountDeleted = vi.fn();

    vi.mocked(deleteUserAccount).mockResolvedValue(undefined);

    renderProfileModal({ onAccountDeleted });

    await user.click(screen.getByRole("button", { name: /^delete account$/i }));

    expect(deleteUserAccount).not.toHaveBeenCalled();
    expect(screen.getByText(/this will delete your account and scores/i))
      .toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: /yes, delete my account/i })
    );

    await waitFor(() => {
      expect(deleteUserAccount).toHaveBeenCalledWith(currentUser.id);
    });

    expect(onAccountDeleted).toHaveBeenCalledTimes(1);
  });
});

function renderProfileModal({
  onClose = vi.fn(),
  onUserUpdated = vi.fn(),
  onAccountDeleted = vi.fn(),
}: {
  onClose?: () => void;
  onUserUpdated?: (user: AuthUser) => void;
  onAccountDeleted?: () => void;
} = {}) {
  return render(
    <ProfileModal
      currentUser={currentUser}
      onClose={onClose}
      onUserUpdated={onUserUpdated}
      onAccountDeleted={onAccountDeleted}
    />
  );
}
