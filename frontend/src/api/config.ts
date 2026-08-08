const DEFAULT_API_BASE_URL = "http://localhost:5000";
const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL?.trim() ||
  (import.meta.env.DEV ? DEFAULT_API_BASE_URL : "");

export const API_BASE_URL = apiBaseUrl.replace(/\/+$/, "");

const retryDelays = [1000, 2000, 4000, 6000, 8000, 10000, 12000, 15000];

type FetchRetryOptions = {
  retryResponses?: boolean;
  retryNetworkErrors?: boolean;
};

function delay(milliseconds: number) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

function shouldRetryResponse(response: Response) {
  return (
    response.status === 408 ||
    response.status === 429 ||
    response.status >= 500
  );
}

export async function fetchWithRetry(
  input: RequestInfo | URL,
  init?: RequestInit,
  options: FetchRetryOptions = {}
) {
  const retryResponses = options.retryResponses ?? isReadRequest(init);
  const retryNetworkErrors = options.retryNetworkErrors ?? isReadRequest(init);
  let lastError: unknown = null;

  for (let attempt = 0; attempt <= retryDelays.length; attempt++) {
    try {
      const response = await fetch(input, init);

      if (
        !retryResponses ||
        !shouldRetryResponse(response) ||
        attempt === retryDelays.length
      ) {
        return response;
      }

      lastError = new Error(`Request failed with status ${response.status}.`);
    } catch (error) {
      lastError = error;

      if (!retryNetworkErrors || attempt === retryDelays.length) {
        break;
      }
    }

    await delay(retryDelays[attempt]);
  }

  throw createRetryError(lastError);
}

export function apiUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return `${API_BASE_URL}${normalizedPath}`;
}

function isReadRequest(init?: RequestInit) {
  const method = init?.method?.toUpperCase() ?? "GET";

  return method === "GET" || method === "HEAD";
}

function createRetryError(error: unknown) {
  if (
    error instanceof TypeError &&
    error.message.toLowerCase().includes("fetch")
  ) {
    return new Error("The server is still waking up. Please try again shortly.");
  }

  return error instanceof Error ? error : new Error("Request failed.");
}

export async function wakeDatabaseConnection() {
  const response = await fetchWithRetry(apiUrl("/api/database/wake"));

  if (!response.ok) {
    throw new Error("Failed to wake database.");
  }
}
