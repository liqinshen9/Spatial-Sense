import type { AuthUser } from "../types/auth";

const API_BASE_URL = "http://localhost:5000";

type LoginPayload = {
  usernameOrEmail: string;
  password: string;
};

type RegisterPayload = {
  name: string;
  email: string;
  password: string;
};

export type ApiError = Error & {
  status?: number;
  data?: unknown;
};

async function createApiError(response: Response): Promise<ApiError> {
  let data: unknown = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  const message =
    typeof data === "object" &&
    data !== null &&
    "message" in data &&
    typeof (data as { message: unknown }).message === "string"
      ? (data as { message: string }).message
      : "Request failed.";

  const error = new Error(message) as ApiError;
  error.status = response.status;
  error.data = data;

  return error;
}

export async function loginUser(payload: LoginPayload): Promise<AuthUser> {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw await createApiError(response);
  }

  return response.json();
}

export async function registerUser(payload: RegisterPayload): Promise<AuthUser> {
  const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw await createApiError(response);
  }

  return response.json();
}