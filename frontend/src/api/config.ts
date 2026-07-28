export const API_BASE_URL = import.meta.env.DEV ? "http://localhost:5000" : "";

const retryDelays = [1000, 2000, 4000, 6000, 8000, 10000, 12000, 15000];

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
  init?: RequestInit
) {
  let lastError: unknown = null;

  for (let attempt = 0; attempt <= retryDelays.length; attempt++) {
    try {
      const response = await fetch(input, init);

      if (!shouldRetryResponse(response) || attempt === retryDelays.length) {
        return response;
      }

      lastError = new Error(`Request failed with status ${response.status}.`);
    } catch (error) {
      lastError = error;

      if (attempt === retryDelays.length) {
        break;
      }
    }

    await delay(retryDelays[attempt]);
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Request failed.");
}
