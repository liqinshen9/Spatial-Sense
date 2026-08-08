import type { AuthUser } from "../types/auth";
import { apiUrl, fetchWithRetry, wakeDatabaseConnection } from "./config";

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

  const error = new Error(message) as ApiError;
  error.status = response.status;
  error.data = data;

  return error;
}

export async function getUser(userId: number): Promise<AuthUser> {
  const response = await fetchWithRetry(apiUrl(`/api/users/${userId}`));

  if (!response.ok) {
    throw await createApiError(response);
  }

  return response.json();
}

export async function updateUserAvatar(
  userId: number,
  avatar: File
): Promise<AuthUser> {
  await wakeDatabaseConnection();

  const formData = new FormData();
  formData.append("avatar", avatar);

  const response = await fetchWithRetry(apiUrl(`/api/users/${userId}/avatar`), {
    method: "PUT",
    body: formData,
  });

  if (!response.ok) {
    throw await createApiError(response);
  }

  return response.json();
}

export async function deleteUserAccount(userId: number): Promise<void> {
  await wakeDatabaseConnection();

  const response = await fetchWithRetry(apiUrl(`/api/users/${userId}`), {
    method: "DELETE",
  });

  if (!response.ok) {
    throw await createApiError(response);
  }
}
