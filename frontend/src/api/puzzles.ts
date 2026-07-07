import type { PuzzleDto } from "../types/puzzle";

const API_BASE_URL = "http://localhost:5000";

export async function getRandomPuzzle(
  difficulty: string
): Promise<PuzzleDto> {
  const response = await fetch(
    `${API_BASE_URL}/api/puzzles/random?difficulty=${difficulty}`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch puzzle.");
  }

  return response.json();
}