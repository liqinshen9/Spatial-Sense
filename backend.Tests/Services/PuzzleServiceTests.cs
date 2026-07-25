using Backend.Services;
using Backend.Models;
using System.Numerics;

namespace Backend.Tests;

public class PuzzleServiceTests
{
    [Fact]
    public void GetAll_GeneratesExpectedPuzzleCountsByDifficulty()
    {
        var service = new PuzzleService();
        var puzzles = service.GetAll();

        Assert.Equal(300, puzzles.Count);
        Assert.Equal(100, puzzles.Count(puzzle => puzzle.Difficulty == "Easy"));
        Assert.Equal(100, puzzles.Count(puzzle => puzzle.Difficulty == "Medium"));
        Assert.Equal(100, puzzles.Count(puzzle => puzzle.Difficulty == "Difficult"));
    }

    [Theory]
    [InlineData("Easy", 4, 1)]
    [InlineData("Medium", 8, 3)]
    [InlineData("Difficult", 8, 3)]
    public void GetRandom_ReturnsPuzzleWithExpectedShapeForDifficulty(
        string difficulty,
        int expectedCubeCount,
        int expectedYellowCubeCount
    )
    {
        var service = new PuzzleService();

        var puzzle = service.GetRandom(difficulty);

        Assert.Equal(difficulty, puzzle.Difficulty);
        Assert.Equal(expectedCubeCount, puzzle.Cubes.Count);
        Assert.Equal(expectedYellowCubeCount, puzzle.Cubes.Count(cube => cube.ColorIndex == 1));
        Assert.NotEmpty(puzzle.SolutionMoves);
    }

    [Fact]
    public void GetRandom_FallsBackToEasyWhenDifficultyIsUnknown()
    {
        var service = new PuzzleService();

        var puzzle = service.GetRandom("Impossible");

        Assert.Equal("Easy", puzzle.Difficulty);
    }

    [Fact]
    public void GetById_ReturnsMatchingPuzzleAndNullForMissingId()
    {
        var service = new PuzzleService();
        var firstPuzzle = service.GetAll().First();

        Assert.Same(firstPuzzle, service.GetById(firstPuzzle.Id));
        Assert.Null(service.GetById(-1));
    }

    [Fact]
    public void GetAll_DoesNotGenerateTargetsWithHiddenYellowCubes()
    {
        var service = new PuzzleService();

        var puzzlesWithHiddenYellow = service.GetAll()
            .Where(HasHiddenYellowCube)
            .Select(puzzle => puzzle.Id)
            .ToList();

        Assert.Empty(puzzlesWithHiddenYellow);
    }

    private static bool HasHiddenYellowCube(PuzzleDto puzzle)
    {
        var orientation = new Quaternion(
            (float)puzzle.TargetOrientation.X,
            (float)puzzle.TargetOrientation.Y,
            (float)puzzle.TargetOrientation.Z,
            (float)puzzle.TargetOrientation.W
        );

        var projectedCubes = GetProjectedVisualCubes(
            puzzle.Cubes,
            Quaternion.Normalize(orientation)
        );

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
}
