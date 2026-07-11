import type { CreateScorePayload, Difficulty, ScoreRanking } from "../types/score";

const API_BASE_URL = "http://localhost:5000";

export async function getScoresByDifficulty(
  difficulty: Difficulty
): Promise<ScoreRanking[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/scores?difficulty=${difficulty}`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch leaderboard.");
  }

  return response.json();
}

export async function createScore(
  payload: CreateScorePayload
): Promise<ScoreRanking> {
  const response = await fetch(`${API_BASE_URL}/api/scores`, {
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