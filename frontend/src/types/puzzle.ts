export type CubeDto = {
  x: number;
  y: number;
  z: number;

  // 0 = blue, 1 = yellow
  colorIndex: number;
};

export type PuzzleDto = {
  id: number;
  seed: number;
  difficulty: string;
  cubes: CubeDto[];
  targetCubes: CubeDto[];
};