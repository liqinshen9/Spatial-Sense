using Backend.Services;

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
}
