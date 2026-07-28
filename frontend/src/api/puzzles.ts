import type { PuzzleDto } from "../types/puzzle";
import { API_BASE_URL, fetchWithRetry } from "./config";

export async function getRandomPuzzle(
  difficulty: string
): Promise<PuzzleDto> {
  const response = await fetchWithRetry(
    `${API_BASE_URL}/api/puzzles/random?difficulty=${difficulty}`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch puzzle.");
  }

  return response.json();
}
