import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AuthModel from "../AuthModel";
import { loginUser, registerUser } from "../../api/auth";
import type { AuthUser } from "../../types/auth";

vi.mock("../../api/auth", () => ({
  loginUser: vi.fn(),
  registerUser: vi.fn(),
}));

vi.mock("../../utils/soundEffects", () => ({
  playButtonSound: vi.fn(),
  playErrorSound: vi.fn(),
}));

const mockUser: AuthUser = {
  id: 1,
  name: "Li",
  email: "li@example.com",
  avatarUrl: null,
  createdAt: "2026-01-01T00:00:00Z",
};

describe("AuthModel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not submit login when fields are empty", async () => {
    const user = userEvent.setup();

    renderAuthModel();

    await user.click(screen.getByRole("button", { name: /^log in$/i }));

    expect(loginUser).not.toHaveBeenCalled();
  });

  it("logs in successfully with valid details", async () => {
    const user = userEvent.setup();
    const onAuthenticated = vi.fn();

    vi.mocked(loginUser).mockResolvedValue(mockUser);

    renderAuthModel({ onAuthenticated });

    await user.type(screen.getByLabelText(/email/i), "li@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /^log in$/i }));

    await waitFor(() => {
      expect(onAuthenticated).toHaveBeenCalledWith(mockUser);
    });
  });

  it("switches to register mode when the create account link is clicked", async () => {
    const user = userEvent.setup();

    renderAuthModel();

    await user.click(screen.getByRole("button", { name: /sign up here/i }));

    expect(screen.getByRole("button", { name: /create account/i }))
      .toBeInTheDocument();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
  });

  it("does not register when passwords do not match", async () => {
    const user = userEvent.setup();

    renderAuthModel();

    await user.click(screen.getByRole("button", { name: /sign up here/i }));

    await user.type(screen.getByLabelText(/username/i), "Li");
    await user.type(screen.getByLabelText(/email/i), "li@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "Password1!");
    await user.type(screen.getByLabelText(/confirm password/i), "Different1!");

    await user.click(screen.getByRole("button", { name: /^create account$/i }));

    expect(registerUser).not.toHaveBeenCalled();
  });

  it("does not register when password does not meet security requirements", async () => {
    const user = userEvent.setup();

    renderAuthModel();

    await user.click(screen.getByRole("button", { name: /sign up here/i }));

    await user.type(screen.getByLabelText(/username/i), "Li");
    await user.type(screen.getByLabelText(/email/i), "li@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "password");
    await user.type(screen.getByLabelText(/confirm password/i), "password");

    await user.click(screen.getByRole("button", { name: /^create account$/i }));

    expect(screen.getByText(/uppercase, lowercase, number, and special character/i))
      .toBeInTheDocument();
    expect(registerUser).not.toHaveBeenCalled();
  });

  it("shows a clear error when username is already in use", async () => {
    const user = userEvent.setup();
    const error = Object.assign(new Error("Username is already in use."), {
      status: 409,
    });

    vi.mocked(registerUser).mockRejectedValue(error);

    renderAuthModel();

    await user.click(screen.getByRole("button", { name: /sign up here/i }));

    await user.type(screen.getByLabelText(/username/i), "Li");
    await user.type(screen.getByLabelText(/email/i), "li@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "Password1!");
    await user.type(screen.getByLabelText(/confirm password/i), "Password1!");

    await user.click(screen.getByRole("button", { name: /^create account$/i }));

    expect(await screen.findByText("Username is already in use."))
      .toBeInTheDocument();
  });

  it("shows loading animation while creating an account", async () => {
    const user = userEvent.setup();

    vi.mocked(registerUser).mockReturnValue(new Promise(() => undefined));

    renderAuthModel();

    await user.click(screen.getByRole("button", { name: /sign up here/i }));

    await user.type(screen.getByLabelText(/username/i), "Li");
    await user.type(screen.getByLabelText(/email/i), "li@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "Password1!");
    await user.type(screen.getByLabelText(/confirm password/i), "Password1!");

    await user.click(screen.getByRole("button", { name: /^create account$/i }));

    expect(await screen.findByText("Creating account...")).toBeInTheDocument();
  });
});

function renderAuthModel({
  onAuthenticated = vi.fn(),
  onClose = vi.fn(),
}: {
  onAuthenticated?: (user: AuthUser) => void;
  onClose?: () => void;
} = {}) {
  return render(
    <AuthModel
      onClose={onClose}
      onAuthenticated={onAuthenticated}
      pendingScore={null}
    />
  );
}
