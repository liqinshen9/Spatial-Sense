import { useEffect, useState } from "react";
import type { AuthUser } from "../types/auth";
import {
  deleteUserAccount,
  updateUserAvatar,
  type ApiError,
} from "../api/users";
import { API_BASE_URL } from "../api/config";
import { playWarningSound } from "../utils/soundEffects";

type ProfileModalProps = {
  currentUser: AuthUser;
  onClose: () => void;
  onUserUpdated: (user: AuthUser) => void;
  onAccountDeleted: () => void;
};

function getAvatarSrc(avatarUrl: string | null) {
  if (!avatarUrl) return "";

  if (avatarUrl.startsWith("http")) {
    return avatarUrl;
  }

  return `${API_BASE_URL}${avatarUrl}`;
}

function ProfileModal({
  currentUser,
  onClose,
  onUserUpdated,
  onAccountDeleted,
}: ProfileModalProps) {
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const currentAvatarSrc = avatarPreviewUrl || getAvatarSrc(currentUser.avatarUrl);

  useEffect(() => {
    return () => {
      if (avatarPreviewUrl) {
        URL.revokeObjectURL(avatarPreviewUrl);
      }
    };
  }, [avatarPreviewUrl]);

  function handleAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;

    if (avatarPreviewUrl) {
      URL.revokeObjectURL(avatarPreviewUrl);
    }

    setAvatarFile(file);
    setAvatarPreviewUrl(file ? URL.createObjectURL(file) : "");
    setMessage("");
  }

  async function handleUpdateAvatar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!avatarFile) {
      setMessage("Please choose an avatar image.");
      return;
    }

    try {
      setIsSubmitting(true);
      setMessage("");

      const updatedUser = await updateUserAvatar(currentUser.id, avatarFile);

      onUserUpdated(updatedUser);
      setAvatarFile(null);
      setAvatarPreviewUrl("");
      setMessage("Avatar updated.");
    } catch (error) {
      const apiError = error as ApiError;
      setMessage(apiError.message || "Failed to update avatar.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteAccount() {
    playWarningSound();

    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      setMessage("Are you sure? This will delete your account and scores.");
      return;
    }

    try {
      setIsDeleting(true);
      setMessage("");

      await deleteUserAccount(currentUser.id);
      onAccountDeleted();
    } catch (error) {
      const apiError = error as ApiError;
      setMessage(apiError.message || "Failed to delete account.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[var(--color-nav-bg)] px-5 backdrop-blur-sm">
      <div className="game-complete-card relative w-full max-w-[430px] rounded-[28px] border border-[var(--color-nav-border)] p-7 shadow-2xl sm:max-w-[620px] sm:p-8">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-leaderboard-row)] text-2xl text-[var(--color-text-primary)] transition hover:text-[var(--color-emphasis)]"
          aria-label="Close profile modal"
        >
          ×
        </button>

        <h2 className="text-center text-2xl font-black text-[var(--color-text-primary)] sm:text-3xl">
          My Profile
        </h2>

        <div className="mt-7 h-px w-full bg-[var(--color-nav-border)]" />

        <div className="mt-6 flex flex-col items-center">
          {currentAvatarSrc ? (
            <img
              src={currentAvatarSrc}
              alt={`${currentUser.name}'s avatar`}
              className="h-24 w-24 rounded-full border-2 border-[var(--color-emphasis)] object-cover"
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-[var(--color-emphasis)] bg-[var(--color-leaderboard-row)] text-4xl font-black text-[var(--color-emphasis)]">
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
          )}

          <p className="mt-4 text-lg font-black text-[var(--color-text-primary)]">
            {currentUser.name}
          </p>

          <p className="mt-1 text-sm font-bold text-[var(--color-text-primary)] opacity-70">
            {currentUser.email}
          </p>
        </div>

        {message && (
          <p className="mt-5 rounded-xl border border-[var(--color-nav-border)] bg-[var(--color-leaderboard-row)] px-4 py-3 text-center text-sm font-bold text-[var(--color-emphasis)]">
            {message}
          </p>
        )}

        <form onSubmit={handleUpdateAvatar} className="mt-7 space-y-5">
          <label className="block">
            <span className="text-sm font-black text-[var(--color-text-primary)]">
              Change Avatar
            </span>

            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="mt-3 w-full rounded-xl border border-[var(--color-nav-border)] bg-[var(--color-leaderboard-row)] px-4 py-3 text-sm font-bold text-[var(--color-text-primary)] file:mr-4 file:rounded-lg file:border-0 file:bg-[var(--color-emphasis)] file:px-4 file:py-2 file:font-black file:text-[var(--color-emphasis-contrast)]"
            />
          </label>

          <button
            type="submit"
            disabled={isSubmitting || !avatarFile}
            className="w-full rounded-xl bg-[var(--color-emphasis)] px-4 py-3 text-base font-black text-[var(--color-emphasis-contrast)] transition hover:bg-[var(--color-emphasis-hover)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Saving..." : "Save Avatar"}
          </button>
        </form>

        <div className="mt-7 border-t border-[var(--color-nav-border)] pt-5">
          {showDeleteConfirm && (
            <button
              type="button"
              onClick={() => {
                setShowDeleteConfirm(false);
                setMessage("");
              }}
              className="mb-3 w-full rounded-xl border border-[var(--color-nav-border)] px-4 py-3 text-sm font-black text-[var(--color-text-primary)] transition hover:border-[var(--color-emphasis)] hover:text-[var(--color-emphasis)]"
            >
              Cancel Delete
            </button>
          )}

          <button
            type="button"
            data-sound="off"
            onClick={handleDeleteAccount}
            disabled={isDeleting}
            className="w-full rounded-xl border border-[var(--color-error-border)] px-4 py-3 text-sm font-black text-[var(--color-error-border)] transition hover:bg-[var(--color-error-border)] hover:text-[var(--color-error-contrast)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isDeleting
              ? "Deleting..."
              : showDeleteConfirm
                ? "Yes, Delete My Account"
                : "Delete Account"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProfileModal;
