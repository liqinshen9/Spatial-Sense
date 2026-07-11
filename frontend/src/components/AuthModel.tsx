import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import type { CompletedScore } from "./GamePage";
import type { AuthUser } from "../types/auth";
import { loginUser, registerUser, type ApiError } from "../api/auth";

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

  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const title = mode === "login" ? "Welcome Back" : "Join Spatial Sense";

  const helperText = useMemo(() => {
    if (!pendingScore) return "";

    return `Your final time is ${pendingScore.formattedTime}. ${
      mode === "login" ? "Log in" : "Create an account"
    } to save your score.`;
  }, [mode, pendingScore]);

  function switchToRegister() {
    const value = usernameOrEmail.trim();

    if (value.includes("@")) {
      setRegisterEmail(value);
    } else {
      setName(value);
    }

    setMessage("");
    setMode("register");
  }

  function switchToLogin() {
    setMessage("");
    setMode("login");
  }

  async function handleLoginSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setIsSubmitting(true);
      setMessage("");

      const user = await loginUser({
        usernameOrEmail,
        password: loginPassword,
      });

      await onAuthenticated(user);
    } catch (error) {
      const apiError = error as ApiError;

      if (apiError.status === 404) {
        switchToRegister();
        setMessage("User not found. Please register first.");
        return;
      }

      setMessage(apiError.message || "Login failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRegisterSubmit(event: FormEvent<HTMLFormElement>) {
  event.preventDefault();

  if (registerPassword !== confirmPassword) {
    setMessage("Passwords do not match.");
    return;
  }

  try {
    setIsSubmitting(true);
    setMessage("");

    await registerUser({
      name,
      email: registerEmail,
      password: registerPassword,
    });

    setUsernameOrEmail(registerEmail);
    setLoginPassword("");
    setRegisterPassword("");
    setConfirmPassword("");

    setMode("login");
    setMessage("Account created. Please log in to save your score.");
  } catch (error) {
    const apiError = error as ApiError;
    setMessage(apiError.message || "Sign up failed.");
  } finally {
    setIsSubmitting(false);
  }
}

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[var(--color-nav-bg)] px-5 backdrop-blur-sm">
      <div className="game-complete-card relative w-full max-w-[430px] rounded-[28px] border border-[var(--color-nav-border)] p-7 shadow-2xl sm:max-w-[720px] sm:p-8">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-leaderboard-row)] text-2xl text-[var(--color-text-primary)] transition hover:text-[var(--color-emphasis)]"
          aria-label="Close"
        >
          ×
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
          <form onSubmit={handleLoginSubmit} className="mt-7 space-y-5">
            <label className="block">
              <span className="text-sm font-black text-[var(--color-text-primary)]">
                Username or Email
              </span>

              <input
                value={usernameOrEmail}
                onChange={(event) => setUsernameOrEmail(event.target.value)}
                type="text"
                placeholder="Enter your username or email"
                className="mt-3 w-full rounded-xl border border-[var(--color-nav-border)] bg-[var(--color-leaderboard-row)] px-4 py-3 text-base font-bold text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-primary)] placeholder:opacity-45 focus:border-[var(--color-emphasis)]"
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
                className="mt-3 w-full rounded-xl border border-[var(--color-nav-border)] bg-[var(--color-leaderboard-row)] px-4 py-3 text-base font-bold text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-primary)] placeholder:opacity-45 focus:border-[var(--color-emphasis)]"
              />
            </label>

            <button
              type="submit"
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
          <form onSubmit={handleRegisterSubmit} className="mt-7 space-y-5">
            <label className="block">
              <span className="text-sm font-black text-[var(--color-text-primary)]">
                Username
              </span>

              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                type="text"
                placeholder="Choose a username"
                className="mt-3 w-full rounded-xl border border-[var(--color-nav-border)] bg-[var(--color-leaderboard-row)] px-4 py-3 text-base font-bold text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-primary)] placeholder:opacity-45 focus:border-[var(--color-emphasis)]"
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
                className="mt-3 w-full rounded-xl border border-[var(--color-nav-border)] bg-[var(--color-leaderboard-row)] px-4 py-3 text-base font-bold text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-primary)] placeholder:opacity-45 focus:border-[var(--color-emphasis)]"
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
                className="mt-3 w-full rounded-xl border border-[var(--color-nav-border)] bg-[var(--color-leaderboard-row)] px-4 py-3 text-base font-bold text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-primary)] placeholder:opacity-45 focus:border-[var(--color-emphasis)]"
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
                className="mt-3 w-full rounded-xl border border-[var(--color-nav-border)] bg-[var(--color-leaderboard-row)] px-4 py-3 text-base font-bold text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-primary)] placeholder:opacity-45 focus:border-[var(--color-emphasis)]"
              />
            </label>

            <button
              type="submit"
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
  );
}

export default AuthModal;