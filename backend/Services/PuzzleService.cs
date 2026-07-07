using Backend.Models;

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

        for (var i = 0; i < 100; i++)
        {
            var difficulty = i switch
            {
                < 35 => "Easy",
                < 70 => "Medium",
                _ => "Difficult"
            };

            var cubeCount = difficulty switch
            {
                "Easy" => 4,
                "Medium" => 6,
                "Difficult" => 8,
                _ => 4
            };

            var greenCubeCount = difficulty switch
            {
                "Easy" => 1,
                "Medium" => 2,
                "Difficult" => 3,
                _ => 1
            };

            var rotationCount = difficulty switch
            {
                "Easy" => 1,
                "Medium" => 2,
                "Difficult" => 4,
                _ => 1
            };

            var seed = 1000 + i;
            var random = new Random(seed);

            var baseCubes = GenerateConnectedShape(cubeCount, greenCubeCount, random);
            var targetCubes = GenerateTargetShape(baseCubes, rotationCount, random);

            puzzles.Add(new PuzzleDto
            {
                Id = i + 1,
                Seed = seed,
                Difficulty = difficulty,
                Cubes = baseCubes,
                TargetCubes = targetCubes
            });
        }

        return puzzles;
    }

    private static List<CubeDto> GenerateConnectedShape(
        int cubeCount,
        int greenCubeCount,
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
            var existingCube = positions.ElementAt(random.Next(positions.Count));
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

        AssignGreenCubes(cubes, greenCubeCount, random);

        return cubes;
    }

    private static void AssignGreenCubes(
        List<CubeDto> cubes,
        int greenCubeCount,
        Random random
    )
    {
        foreach (var cube in cubes)
        {
            cube.ColorIndex = 0;
        }

        var greenIndexes = Enumerable.Range(0, cubes.Count)
            .OrderBy(_ => random.Next())
            .Take(Math.Min(greenCubeCount, cubes.Count))
            .ToList();

        foreach (var index in greenIndexes)
        {
            cubes[index].ColorIndex = 1;
        }
    }

    private static List<CubeDto> GenerateTargetShape(
        List<CubeDto> baseCubes,
        int rotationCount,
        Random random
    )
    {
        var baseSignature = SerializeColoredCubes(baseCubes);

        for (var attempt = 0; attempt < 50; attempt++)
        {
            var targetCubes = baseCubes
                .Select(cube => new CubeDto
                {
                    X = cube.X,
                    Y = cube.Y,
                    Z = cube.Z,
                    ColorIndex = cube.ColorIndex
                })
                .ToList();

            for (var i = 0; i < rotationCount; i++)
            {
                var axis = random.Next(3);

                targetCubes = targetCubes.Select(cube =>
                {
                    return axis switch
                    {
                        0 => RotateX(cube),
                        1 => RotateY(cube),
                        2 => RotateZ(cube),
                        _ => cube
                    };
                }).ToList();
            }

            targetCubes = Normalize(targetCubes);

            var targetSignature = SerializeColoredCubes(targetCubes);

            if (targetSignature != baseSignature)
            {
                return targetCubes;
            }
        }

        // Fallback: force one X rotation if random attempts accidentally return the same state.
        return Normalize(baseCubes.Select(RotateX));
    }

    private static CubeDto RotateX(CubeDto cube)
    {
        return new CubeDto
        {
            X = cube.X,
            Y = -cube.Z,
            Z = cube.Y,
            ColorIndex = cube.ColorIndex
        };
    }

    private static CubeDto RotateY(CubeDto cube)
    {
        return new CubeDto
        {
            X = cube.Z,
            Y = cube.Y,
            Z = -cube.X,
            ColorIndex = cube.ColorIndex
        };
    }

    private static CubeDto RotateZ(CubeDto cube)
    {
        return new CubeDto
        {
            X = -cube.Y,
            Y = cube.X,
            Z = cube.Z,
            ColorIndex = cube.ColorIndex
        };
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

    private static string SerializeColoredCubes(IEnumerable<CubeDto> cubes)
    {
        return string.Join(
            "|",
            Normalize(cubes).Select(cube =>
                $"{cube.X},{cube.Y},{cube.Z},{cube.ColorIndex}"
            )
        );
    }
}