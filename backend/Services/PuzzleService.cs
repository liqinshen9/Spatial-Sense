using Backend.Models;
using System.Globalization;
using System.Numerics;

namespace Backend.Services;

public class PuzzleService
{
    private readonly List<PuzzleDto> _puzzles;

    public PuzzleService()
    {
        _puzzles = GeneratePuzzles();
    }

    public List<PuzzleDto> GetAll()
    {
        return _puzzles;
    }

    public PuzzleDto? GetById(int id)
    {
        return _puzzles.FirstOrDefault(puzzle => puzzle.Id == id);
    }

    public PuzzleDto GetRandom(string difficulty)
    {
        var matchingPuzzles = _puzzles
            .Where(puzzle => puzzle.Difficulty.Equals(difficulty, StringComparison.OrdinalIgnoreCase))
            .ToList();

        if (matchingPuzzles.Count == 0)
        {
            matchingPuzzles = _puzzles.Where(puzzle => puzzle.Difficulty == "Easy").ToList();
        }

        return matchingPuzzles[Random.Shared.Next(matchingPuzzles.Count)];
    }

    private List<PuzzleDto> GeneratePuzzles()
    {
        var puzzles = new List<PuzzleDto>();
        var id = 1;

        var difficultyPlan = new[]
        {
            new { Difficulty = "Easy", Count = 100 },
            new { Difficulty = "Medium", Count = 100 },
            new { Difficulty = "Difficult", Count = 100 }
        };

        foreach (var plan in difficultyPlan)
        {
            var generatedCount = 0;
            var attempt = 0;

            while (generatedCount < plan.Count)
            {
                var difficulty = plan.Difficulty;

                var cubeCount = GetCubeCount(difficulty);
                var yellowCubeCount = GetYellowCubeCount(difficulty);

                var seed = GetSeed(difficulty, id, attempt);
                var random = new Random(seed);

                var cubes = GenerateConnectedShape(
                    cubeCount,
                    yellowCubeCount,
                    random
                );

                var solutionMoves = GenerateMoveSequence(difficulty, random);
                var targetOrientation = BuildOrientation(solutionMoves);

                var isInvalid = IsInvalidPuzzleForDifficulty(
                    cubes,
                    targetOrientation,
                    difficulty
                );

                if (isInvalid)
                {
                    attempt++;
                    continue;
                }

                puzzles.Add(new PuzzleDto
                {
                    Id = id,
                    Seed = seed,
                    Difficulty = difficulty,
                    Cubes = cubes,
                    TargetOrientation = ToDto(targetOrientation),
                    SolutionMoves = solutionMoves
                });

                id++;
                attempt++;
                generatedCount++;
            }
        }

        return puzzles;
    }

    private static int GetCubeCount(string difficulty)
    {
        return difficulty switch
        {
            "Easy" => 4,
            "Medium" => 8,
            "Difficult" => 8,
            _ => 4
        };
    }

    private static int GetYellowCubeCount(string difficulty)
    {
        return difficulty switch
        {
            "Easy" => 1,
            "Medium" => 3,
            "Difficult" => 3,
            _ => 1
        };
    }

    private static int GetSeed(string difficulty, int id, int attempt)
    {
        var difficultyOffset = difficulty switch
        {
            "Easy" => 10_000,
            "Medium" => 20_000,
            "Difficult" => 30_000,
            _ => 40_000
        };

        return difficultyOffset + id * 97 + attempt * 31;
    }

    private static List<PuzzleMoveDto> GenerateMoveSequence(string difficulty, Random random)
    {
        var moves = new List<PuzzleMoveDto>();
        var axes = new[] { "X", "Y", "Z" };

        if (difficulty == "Easy")
        {
            var moveCount = random.Next(1, 3);

            for (var i = 0; i < moveCount; i++)
            {
                moves.Add(new PuzzleMoveDto
                {
                    Axis = axes[random.Next(axes.Length)],
                    Degrees = random.Next(2) == 0 ? -90 : 90
                });
            }

            return moves;
        }

        var ninetyMoveCount = random.Next(2, 6);

        for (var i = 0; i < ninetyMoveCount; i++)
        {
            moves.Add(new PuzzleMoveDto
            {
                Axis = axes[random.Next(axes.Length)],
                Degrees = random.Next(2) == 0 ? -90 : 90
            });
        }

        moves.Add(new PuzzleMoveDto
        {
            Axis = "Z",
            Degrees = random.Next(2) == 0 ? -45 : 45
        });

        return moves;
    }

    private static Quaternion BuildOrientation(List<PuzzleMoveDto> moves)
    {
        var orientation = Quaternion.Identity;

        foreach (var move in moves)
        {
            var axis = move.Axis switch
            {
                "X" => Vector3.UnitX,
                "Y" => Vector3.UnitY,
                "Z" => Vector3.UnitZ,
                _ => Vector3.UnitX
            };

            var step = Quaternion.CreateFromAxisAngle(
                axis,
                move.Degrees * MathF.PI / 180f
            );

            orientation = Quaternion.Normalize(
                Quaternion.Multiply(step, orientation)
            );
        }

        return orientation;
    }

    private static bool IsInvalidPuzzleForDifficulty(
        List<CubeDto> cubes,
        Quaternion targetOrientation,
        string difficulty
    )
    {
        if (IsIdentityOrientation(targetOrientation))
        {
            return true;
        }

        if (HasHiddenYellowCube(cubes, targetOrientation))
        {
            return true;
        }

        if (difficulty == "Medium" || difficulty == "Difficult")
        {
            return CanMatchUsingOnlyNinetyDegreeRotations(
                cubes,
                targetOrientation
            );
        }

        return IsSameVisualState(
            cubes,
            Quaternion.Identity,
            targetOrientation
        );
    }

    private static bool CanMatchUsingOnlyNinetyDegreeRotations(
        List<CubeDto> cubes,
        Quaternion targetOrientation
    )
    {
        var targetSignature = GetVisualStateSignature(
            cubes,
            targetOrientation
        );

        var allNinetyDegreeOrientations = GetAllNinetyDegreeOrientations();

        foreach (var ninetyDegreeOrientation in allNinetyDegreeOrientations)
        {
            var ninetyDegreeSignature = GetVisualStateSignature(
                cubes,
                ninetyDegreeOrientation
            );

            if (ninetyDegreeSignature == targetSignature)
            {
                return true;
            }
        }

        return false;
    }

    private static List<Quaternion> GetAllNinetyDegreeOrientations()
    {
        var result = new List<Quaternion>();
        var queue = new Queue<Quaternion>();
        var seen = new HashSet<string>();

        queue.Enqueue(Quaternion.Identity);
        seen.Add(GetOrientationKey(Quaternion.Identity));

        var axes = new[]
        {
            Vector3.UnitX,
            Vector3.UnitY,
            Vector3.UnitZ
        };

        var degreesOptions = new[] { -90, 90 };

        while (queue.Count > 0)
        {
            var current = queue.Dequeue();

            result.Add(current);

            foreach (var axis in axes)
            {
                foreach (var degrees in degreesOptions)
                {
                    var step = Quaternion.CreateFromAxisAngle(
                        axis,
                        degrees * MathF.PI / 180f
                    );

                    var next = Quaternion.Normalize(
                        Quaternion.Multiply(step, current)
                    );

                    var key = GetOrientationKey(next);

                    if (!seen.Contains(key))
                    {
                        seen.Add(key);
                        queue.Enqueue(next);
                    }
                }
            }
        }

        return result;
    }

    private static string GetOrientationKey(Quaternion orientation)
    {
        var rotatedX = Vector3.Transform(Vector3.UnitX, orientation);
        var rotatedY = Vector3.Transform(Vector3.UnitY, orientation);
        var rotatedZ = Vector3.Transform(Vector3.UnitZ, orientation);

        return
            $"{RoundAxis(rotatedX.X)},{RoundAxis(rotatedX.Y)},{RoundAxis(rotatedX.Z)}|" +
            $"{RoundAxis(rotatedY.X)},{RoundAxis(rotatedY.Y)},{RoundAxis(rotatedY.Z)}|" +
            $"{RoundAxis(rotatedZ.X)},{RoundAxis(rotatedZ.Y)},{RoundAxis(rotatedZ.Z)}";
    }

    private static int RoundAxis(float value)
    {
        if (value > 0.5f)
        {
            return 1;
        }

        if (value < -0.5f)
        {
            return -1;
        }

        return 0;
    }

    private static bool IsIdentityOrientation(Quaternion orientation)
    {
        var normalized = Quaternion.Normalize(orientation);

        var dot = Math.Abs(
            Quaternion.Dot(normalized, Quaternion.Identity)
        );

        return dot > 0.9999f;
    }

    private static bool IsSameVisualState(
        List<CubeDto> cubes,
        Quaternion firstOrientation,
        Quaternion secondOrientation
    )
    {
        var firstSignature = GetVisualStateSignature(
            cubes,
            firstOrientation
        );

        var secondSignature = GetVisualStateSignature(
            cubes,
            secondOrientation
        );

        return firstSignature == secondSignature;
    }

    private static bool HasHiddenYellowCube(
        List<CubeDto> cubes,
        Quaternion orientation
    )
    {
        var projectedCubes = GetProjectedVisualCubes(cubes, orientation);

        return projectedCubes
            .GroupBy(cube => new { cube.X, cube.Y })
            .Any(group =>
            {
                var frontZ = group.Max(cube => cube.Z);

                return group.Any(cube =>
                    cube.ColorIndex == 1 &&
                    cube.Z < frontZ
                );
            });
    }

    private static string GetVisualStateSignature(
        List<CubeDto> cubes,
        Quaternion orientation
    )
    {
        var visualCubes = GetProjectedVisualCubes(cubes, orientation)
            .OrderBy(cube => cube.X)
            .ThenBy(cube => cube.Y)
            .ThenBy(cube => cube.Z)
            .ThenBy(cube => cube.ColorIndex)
            .Select(cube =>
                $"{cube.X.ToString(CultureInfo.InvariantCulture)}," +
                $"{cube.Y.ToString(CultureInfo.InvariantCulture)}," +
                $"{cube.Z.ToString(CultureInfo.InvariantCulture)}," +
                $"{cube.ColorIndex}"
            );

        return string.Join("|", visualCubes);
    }

    private static List<VisualCube> GetProjectedVisualCubes(
        List<CubeDto> cubes,
        Quaternion orientation
    )
    {
        var minX = cubes.Min(cube => cube.X);
        var maxX = cubes.Max(cube => cube.X);

        var minY = cubes.Min(cube => cube.Y);
        var maxY = cubes.Max(cube => cube.Y);

        var minZ = cubes.Min(cube => cube.Z);
        var maxZ = cubes.Max(cube => cube.Z);

        var centerX = (minX + maxX) / 2f;
        var centerY = (minY + maxY) / 2f;
        var centerZ = (minZ + maxZ) / 2f;

        return cubes
            .Select(cube =>
            {
                var centeredPosition = new Vector3(
                    cube.X - centerX,
                    cube.Y - centerY,
                    cube.Z - centerZ
                );

                var rotatedPosition = Vector3.Transform(
                    centeredPosition,
                    orientation
                );

                return new VisualCube(
                    CleanNumber(rotatedPosition.X),
                    CleanNumber(rotatedPosition.Y),
                    CleanNumber(rotatedPosition.Z),
                    cube.ColorIndex
                );
            })
            .ToList();
    }

    private static float CleanNumber(float value)
    {
        var rounded = MathF.Round(value, 4);

        if (MathF.Abs(rounded) < 0.0001f)
        {
            return 0;
        }

        return rounded;
    }

    private sealed record VisualCube(
        float X,
        float Y,
        float Z,
        int ColorIndex
    );

    private static BlockOrientationDto ToDto(Quaternion quaternion)
    {
        var normalized = Quaternion.Normalize(quaternion);

        return new BlockOrientationDto
        {
            X = normalized.X,
            Y = normalized.Y,
            Z = normalized.Z,
            W = normalized.W
        };
    }

    private static List<CubeDto> GenerateConnectedShape(
        int cubeCount,
        int yellowCubeCount,
        Random random
    )
    {
        var directions = new (int X, int Y, int Z)[]
        {
            (1, 0, 0),
            (-1, 0, 0),
            (0, 1, 0),
            (0, -1, 0),
            (0, 0, 1),
            (0, 0, -1)
        };

        var positions = new HashSet<(int X, int Y, int Z)>
        {
            (0, 0, 0)
        };

        while (positions.Count < cubeCount)
        {
            var existingCube = positions.ElementAt(
                random.Next(positions.Count)
            );

            var direction = directions[random.Next(directions.Length)];

            var newCube = (
                existingCube.X + direction.X,
                existingCube.Y + direction.Y,
                existingCube.Z + direction.Z
            );

            positions.Add(newCube);
        }

        var cubes = Normalize(
            positions.Select(position => new CubeDto
            {
                X = position.X,
                Y = position.Y,
                Z = position.Z,
                ColorIndex = 0
            })
        );

        AssignYellowCubes(
            cubes,
            yellowCubeCount,
            random
        );

        return cubes;
    }

    private static void AssignYellowCubes(
        List<CubeDto> cubes,
        int yellowCubeCount,
        Random random
    )
    {
        foreach (var cube in cubes)
        {
            cube.ColorIndex = 0;
        }

        var yellowIndexes = Enumerable.Range(0, cubes.Count)
            .OrderBy(_ => random.Next())
            .Take(Math.Min(yellowCubeCount, cubes.Count))
            .ToList();

        foreach (var index in yellowIndexes)
        {
            cubes[index].ColorIndex = 1;
        }
    }

    private static List<CubeDto> Normalize(IEnumerable<CubeDto> cubes)
    {
        var cubeList = cubes.ToList();

        var minX = cubeList.Min(cube => cube.X);
        var minY = cubeList.Min(cube => cube.Y);
        var minZ = cubeList.Min(cube => cube.Z);

        return cubeList
            .Select(cube => new CubeDto
            {
                X = cube.X - minX,
                Y = cube.Y - minY,
                Z = cube.Z - minZ,
                ColorIndex = cube.ColorIndex
            })
            .OrderBy(cube => cube.X)
            .ThenBy(cube => cube.Y)
            .ThenBy(cube => cube.Z)
            .ThenBy(cube => cube.ColorIndex)
            .ToList();
    }
}
