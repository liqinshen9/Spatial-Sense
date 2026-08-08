import type { CreateScorePayload, Difficulty, ScoreRanking } from "../types/score";
import { apiUrl, fetchWithRetry, wakeDatabaseConnection } from "./config";

export async function getScoresByDifficulty(
  difficulty: Difficulty
): Promise<ScoreRanking[]> {
  const response = await fetchWithRetry(apiUrl(`/api/scores?difficulty=${difficulty}`));

  if (!response.ok) {
    throw new Error("Failed to fetch leaderboard.");
  }

  return response.json();
}

export async function createScore(
  payload: CreateScorePayload
): Promise<ScoreRanking> {
  await wakeDatabaseConnection();

  const response = await fetchWithRetry(apiUrl("/api/scores"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Failed to save score.");
  }

  return response.json();
}
