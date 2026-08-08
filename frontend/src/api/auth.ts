import type { AuthUser } from "../types/auth";
import { apiUrl, fetchWithRetry, wakeDatabaseConnection } from "./config";

type LoginPayload = {
  usernameOrEmail: string;
  password: string;
};

type RegisterPayload = {
  name: string;
  email: string;
  password: string;
  avatar?: File | null;
};

export type ApiError = Error & {
  status?: number;
  data?: unknown;
};

async function createApiError(response: Response): Promise<ApiError> {
  const contentType = response.headers.get("content-type") ?? "";

  let data: unknown = null;
  let message = "Request failed.";

  if (contentType.includes("application/json")) {
    try {
      data = await response.json();

      if (
        typeof data === "object" &&
        data !== null &&
        "message" in data &&
        typeof (data as { message: unknown }).message === "string"
      ) {
        message = (data as { message: string }).message;
      }
    } catch {
      message = "Request failed.";
    }
  } else {
    const text = await response.text();

    if (text.trim().length > 0 && response.status !== 500) {
      message = text;
    }
  }

  if (response.status === 404) {
    message = "User not found. Please register first.";
  }

  const error = new Error(message) as ApiError;
  error.status = response.status;
  error.data = data;

  return error;
}

export async function loginUser(payload: LoginPayload): Promise<AuthUser> {
  await wakeDatabaseConnection();

  const response = await fetchWithRetry(apiUrl("/api/auth/login"), {
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
  await wakeDatabaseConnection();

  const formData = new FormData();

  formData.append("name", payload.name);
  formData.append("email", payload.email);
  formData.append("password", payload.password);

  if (payload.avatar) {
    formData.append("avatar", payload.avatar);
  }

  const response = await fetchWithRetry(apiUrl("/api/auth/register"), {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw await createApiError(response);
  }

  return response.json();
}
