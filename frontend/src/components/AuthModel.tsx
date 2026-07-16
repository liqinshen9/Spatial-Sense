import { useMemo, useState } from "react";
import type { CompletedScore } from "./GamePage";
import type { AuthUser } from "../types/auth";
import { loginUser, registerUser, type ApiError } from "../api/auth";
import { playButtonSound, playErrorSound } from "../utils/soundEffects";

type AuthModalProps = {
  pendingScore: CompletedScore | null;
  onClose: () => void;
  onAuthenticated: (user: AuthUser) => void | Promise<void>;
};

type AuthMode = "login" | "register";

function AuthModal({ pendingScore, onClose, onAuthenticated }: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>("login");

  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [name, setName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [shouldShake, setShouldShake] = useState(false);

  const title = mode === "login" ? "Welcome Back" : "Join Spatial Sense";

  const helperText = useMemo(() => {
    if (!pendingScore) return "";

    return `Your final time is ${pendingScore.formattedTime}. ${
      mode === "login" ? "Log in" : "Create an account"
    } to save your score.`;
  }, [mode, pendingScore]);

  const loginUsernameMissing =
    hasSubmitted && mode === "login" && usernameOrEmail.trim().length === 0;

  const loginPasswordMissing =
    hasSubmitted && mode === "login" && loginPassword.trim().length === 0;

  const registerNameMissing =
    hasSubmitted && mode === "register" && name.trim().length === 0;

  const registerEmailMissing =
    hasSubmitted && mode === "register" && registerEmail.trim().length === 0;

  const registerPasswordMissing =
    hasSubmitted && mode === "register" && registerPassword.trim().length === 0;

  const confirmPasswordMissing =
    hasSubmitted && mode === "register" && confirmPassword.trim().length === 0;

  function triggerError(errorMessage: string) {
    playErrorSound();

    setMessage(errorMessage);
    setShouldShake(false);

    window.setTimeout(() => {
      setShouldShake(true);
    }, 10);
  }

  function getInputClass(hasError: boolean) {
    return `mt-3 w-full rounded-xl border ${
      hasError ? "border-[var(--color-error-border)] text-[var(--color-error-border)]" : "border-[var(--color-nav-border)]"
    } bg-[var(--color-leaderboard-row)] px-4 py-3 text-base font-bold text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-primary)] placeholder:opacity-45 focus:border-[var(--color-emphasis)]`;
  }

  function switchToRegister() {
    const value = usernameOrEmail.trim();

    if (value.includes("@")) {
      setRegisterEmail(value);
    } else {
      setName(value);
    }

    setMessage("");
    setHasSubmitted(false);
    setShouldShake(false);
    setMode("register");
  }

  function switchToLogin() {
    setMessage("");
    setHasSubmitted(false);
    setShouldShake(false);
    setMode("login");
  }

  function handleAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setAvatarFile(file);
    setMessage("");
  }

  async function handleLoginSubmit() {
    setHasSubmitted(true);

    if (
      usernameOrEmail.trim().length === 0 ||
      loginPassword.trim().length === 0
    ) {
      triggerError("Please enter your username/email and password.");
      return;
    }

    playButtonSound();

    try {
      setIsSubmitting(true);
      setMessage("");

      const user = await loginUser({
        usernameOrEmail: usernameOrEmail.trim(),
        password: loginPassword,
      });

      await onAuthenticated(user);
    } catch (error) {
      const apiError = error as ApiError;

      if (apiError.status === 404) {
        switchToRegister();
        triggerError("User not found. Please register first.");
        return;
      }

      triggerError(apiError.message || "Login failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRegisterSubmit() {
    setHasSubmitted(true);

    if (
      name.trim().length === 0 ||
      registerEmail.trim().length === 0 ||
      registerPassword.trim().length === 0 ||
      confirmPassword.trim().length === 0
    ) {
      triggerError("Please complete all sign up fields.");
      return;
    }

    if (registerPassword !== confirmPassword) {
      triggerError("Passwords do not match.");
      return;
    }

    playButtonSound();

    try {
      setIsSubmitting(true);
      setMessage("");

      await registerUser({
        name: name.trim(),
        email: registerEmail.trim(),
        password: registerPassword,
        avatar: avatarFile,
      });

      setUsernameOrEmail(registerEmail.trim());
      setLoginPassword("");
      setName("");
      setRegisterEmail("");
      setRegisterPassword("");
      setConfirmPassword("");
      setAvatarFile(null);

      setMode("login");
      setHasSubmitted(false);
      setShouldShake(false);
      setMessage("Account created. Please log in to save your score.");
    } catch (error) {
      const apiError = error as ApiError;
      triggerError(apiError.message || "Sign up failed.");
    } finally {
      setIsSubmitting(false);
    }
  }
  return (
    <div className="fixed inset-0 z-[60] overflow-hidden bg-[var(--color-nav-bg)] px-5 py-6 backdrop-blur-sm">
      <div className="flex min-h-full items-start justify-center sm:items-center">
        <div
          onAnimationEnd={() => setShouldShake(false)}
          style={
            shouldShake
              ? { animation: "difficulty-shake 0.38s ease-in-out" }
              : undefined
          }
          className="pretty-scrollbar game-complete-card relative max-h-[calc(100vh-48px)] w-full max-w-[430px] overflow-y-auto overscroll-contain rounded-[28px] border border-[var(--color-nav-border)] p-7 shadow-2xl sm:max-w-[720px] sm:p-8"
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute right-5 top-5 grid h-10 w-10 place-items-center rounded-full bg-[var(--color-leaderboard-row)] text-[var(--color-text-primary)] transition hover:text-[var(--color-emphasis)]"
            aria-label="Close"
          >
            <span className="block -translate-y-[1px] text-2xl leading-none">
              ×
            </span>
          </button>

          <h2 className="text-center text-2xl font-black text-[var(--color-text-primary)] sm:text-3xl">
            {title}
          </h2>

          <div className="mt-7 h-px w-full bg-[var(--color-nav-border)]" />

          {helperText && (
            <p className="mt-5 text-center text-sm font-bold text-[var(--color-text-primary)] opacity-75">
              {helperText}
            </p>
          )}

          {message && (
            <p className="mt-5 rounded-xl border border-[var(--color-nav-border)] bg-[var(--color-leaderboard-row)] px-4 py-3 text-center text-sm font-bold text-[var(--color-emphasis)]">
              {message}
            </p>
          )}

          {mode === "login" ? (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void handleLoginSubmit();
              }}
              noValidate
              className="mt-7 space-y-5"
            >
              <label className="block">
                <span className="text-sm font-black text-[var(--color-text-primary)]">
                  Username or Email
                </span>

                <input
                  value={usernameOrEmail}
                  onChange={(event) => setUsernameOrEmail(event.target.value)}
                  type="text"
                  placeholder="Enter your username or email"
                  className={getInputClass(loginUsernameMissing)}
                />
              </label>

              <label className="block">
                <span className="text-sm font-black text-[var(--color-text-primary)]">
                  Password
                </span>

                <input
                  value={loginPassword}
                  onChange={(event) => setLoginPassword(event.target.value)}
                  type="password"
                  placeholder="Enter your password"
                  className={getInputClass(loginPasswordMissing)}
                />
              </label>

              <button
                type="submit"
                data-sound="off"
                disabled={isSubmitting}
                className="w-full rounded-xl bg-[var(--color-emphasis)] px-4 py-3 text-base font-black text-[var(--color-emphasis-contrast)] transition hover:bg-[var(--color-emphasis-hover)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {pendingScore ? "Log In and Save" : "Log In"}
              </button>

              <div className="border-t border-[var(--color-nav-border)] pt-5 text-center text-sm font-bold text-[var(--color-text-primary)] opacity-80">
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  onClick={switchToRegister}
                  className="font-black text-[var(--color-emphasis)] underline"
                >
                  Sign up here
                </button>
              </div>
            </form>
          ) : (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void handleRegisterSubmit();
              }}
              noValidate
              className="mt-7 space-y-5"
            >
              <label className="block">
                <span className="text-sm font-black text-[var(--color-text-primary)]">
                  Username
                </span>

                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  type="text"
                  placeholder="Choose a username"
                  className={getInputClass(registerNameMissing)}
                />
              </label>

              <label className="block">
                <span className="text-sm font-black text-[var(--color-text-primary)]">
                  Email
                </span>

                <input
                  value={registerEmail}
                  onChange={(event) => setRegisterEmail(event.target.value)}
                  type="email"
                  placeholder="Enter your email"
                  className={getInputClass(registerEmailMissing)}
                />
              </label>

              <label className="block">
                <span className="text-sm font-black text-[var(--color-text-primary)]">
                  Password
                </span>

                <input
                  value={registerPassword}
                  onChange={(event) => setRegisterPassword(event.target.value)}
                  type="password"
                  placeholder="Create a password"
                  className={getInputClass(registerPasswordMissing)}
                />
              </label>

              <label className="block">
                <span className="text-sm font-black text-[var(--color-text-primary)]">
                  Confirm Password
                </span>

                <input
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  type="password"
                  placeholder="Confirm your password"
                  className={getInputClass(confirmPasswordMissing)}
                />
              </label>

              <label className="block">
                <span className="text-sm font-black text-[var(--color-text-primary)]">
                  Avatar Optional
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
                data-sound="off"
                disabled={isSubmitting}
                className="w-full rounded-xl bg-[var(--color-emphasis)] px-4 py-3 text-base font-black text-[var(--color-emphasis-contrast)] transition hover:bg-[var(--color-emphasis-hover)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Create Account
              </button>

              <div className="border-t border-[var(--color-nav-border)] pt-5 text-center text-sm font-bold text-[var(--color-text-primary)] opacity-80">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={switchToLogin}
                  className="font-black text-[var(--color-emphasis)] underline"
                >
                  Log in here
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default AuthModal;