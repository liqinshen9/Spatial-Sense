export type Difficulty = "easy" | "medium" | "difficult";

export type ScoreRanking = {
  id: number;
  rank: number;
  userId: number;
  username: string;
  avatarUrl: string | null;
  difficulty: string;
  elapsedMilliseconds: number;
  time: string;
  createdAt: string;
};

export type CreateScorePayload = {
  userId: number;
  difficulty: string;
  elapsedMilliseconds: number;
};