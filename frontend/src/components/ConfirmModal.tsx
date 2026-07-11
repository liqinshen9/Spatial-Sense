type ConfirmModalProps = {
  title: string;
  message: string;
  cancelText?: string;
  confirmText?: string;
  onCancel: () => void;
  onConfirm: () => void;
};

function ConfirmModal({
  title,
  message,
  cancelText = "Cancel",
  confirmText = "Confirm",
  onCancel,
  onConfirm,
}: ConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4 backdrop-blur-sm">
      <div className="game-complete-card w-full max-w-xl rounded-3xl border border-[var(--color-nav-border)] p-6 shadow-2xl sm:p-8">
        <h2 className="text-center text-2xl font-black text-[var(--color-text-primary)] sm:text-3xl">
          {title}
        </h2>

        <div className="my-6 h-px w-full bg-[var(--color-nav-border)]" />

        <div className="rounded-2xl border border-[var(--color-nav-border)] bg-[var(--color-active-bg)] px-5 py-5 text-center">
          <p className="text-base font-black leading-relaxed text-[var(--color-emphasis)] sm:text-lg">
            {message}
          </p>
        </div>

        <div className="mt-8 flex justify-end gap-4">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-[var(--color-nav-border)] px-6 py-3 text-sm font-black text-[var(--color-text-primary)] transition hover:border-[var(--color-emphasis)] hover:text-[var(--color-emphasis)]"
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className="rounded-xl bg-[var(--color-emphasis)] px-6 py-3 text-sm font-black text-[var(--color-emphasis-contrast)] transition hover:bg-[var(--color-emphasis-hover)]"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;