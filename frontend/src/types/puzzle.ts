export type CubeDto = {
  x: number;
  y: number;
  z: number;
  colorIndex: number;
};

export type BlockOrientation = {
  x: number;
  y: number;
  z: number;
  w: number;
};

export type PuzzleMoveDto = {
  axis: "X" | "Y" | "Z";
  degrees: -90 | -45 | 45 | 90;
};

export type PuzzleDto = {
  id: number;
  seed: number;
  difficulty: string;
  cubes: CubeDto[];
  targetOrientation: BlockOrientation;
  solutionMoves: PuzzleMoveDto[];
};