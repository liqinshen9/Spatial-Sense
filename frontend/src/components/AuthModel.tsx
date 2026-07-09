import type { CompletedScore } from "./GamePage";

type AuthModalProps = {
  pendingScore: CompletedScore | null;
  onClose: () => void;
};

function AuthModal({ pendingScore, onClose }: AuthModalProps) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-6">
      <div className="w-full max-w-[430px] rounded-[28px] bg-[var(--color-leaderboard-card)] p-8 shadow-2xl">
        <h2 className="text-center text-3xl font-black text-[var(--color-text-primary)]">
          Log in
        </h2>

        {pendingScore && (
          <p className="mt-4 text-center text-sm font-bold text-[var(--color-text-primary)] opacity-70">
            Your final time is{" "}
            <span className="text-[var(--color-emphasis)]">
              {pendingScore.formattedTime}
            </span>
            . Log in to save your score.
          </p>
        )}

        <div className="mt-7 space-y-4">
          <input
            type="email"
            placeholder="Email"
            className="w-full rounded-xl border border-[var(--color-nav-border)] bg-[var(--color-leaderboard-row)] px-4 py-3 text-base font-bold text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-primary)] placeholder:opacity-45 focus:border-[var(--color-emphasis)]"
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full rounded-xl border border-[var(--color-nav-border)] bg-[var(--color-leaderboard-row)] px-4 py-3 text-base font-bold text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-primary)] placeholder:opacity-45 focus:border-[var(--color-emphasis)]"
          />
        </div>

        <div className="mt-7 flex gap-3">
          <button
            type="button"
            className="flex-1 rounded-xl bg-[var(--color-emphasis)] px-4 py-3 text-base font-black text-[var(--color-emphasis-contrast)] transition hover:scale-[1.02]"
          >
            Log in and Save
          </button>

          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-[var(--color-nav-border)] bg-[var(--color-leaderboard-row)] px-4 py-3 text-base font-black text-[var(--color-text-primary)] transition hover:border-[var(--color-emphasis)] hover:text-[var(--color-emphasis)]"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default AuthModal;