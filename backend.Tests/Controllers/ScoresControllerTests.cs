using Backend.Controllers;
using Backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Tests;

public class ScoresControllerTests
{
    [Fact]
    public async Task CreateScore_RejectsInvalidPayloads()
    {
        await using var context = TestDbContextFactory.Create();
        var controller = new ScoresController(context);

        var missingUserResult = await controller.CreateScore(
            new CreateScoreRequest(0, "Easy", 1000)
        );

        var invalidTimeResult = await controller.CreateScore(
            new CreateScoreRequest(1, "Easy", 0)
        );

        Assert.IsType<BadRequestObjectResult>(missingUserResult.Result);
        Assert.IsType<BadRequestObjectResult>(invalidTimeResult.Result);
    }

    [Fact]
    public async Task CreateScore_ReturnsNotFoundWhenUserDoesNotExist()
    {
        await using var context = TestDbContextFactory.Create();
        var controller = new ScoresController(context);

        var result = await controller.CreateScore(
            new CreateScoreRequest(999, "Easy", 1000)
        );

        Assert.IsType<NotFoundObjectResult>(result.Result);
    }

    [Fact]
    public async Task CreateScore_SavesFirstScoreAndNormalizesDifficulty()
    {
        await using var context = TestDbContextFactory.Create();
        var user = await AddUser(context, "Alex", "alex@example.com");
        var controller = new ScoresController(context);

        var result = await controller.CreateScore(
            new CreateScoreRequest(user.Id, " difficult ", 65432)
        );

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var score = Assert.IsType<ScoreResponse>(okResult.Value);

        Assert.Equal(user.Id, score.UserId);
        Assert.Equal("Difficult", score.Difficulty);
        Assert.Equal(65432, score.ElapsedMilliseconds);
        Assert.Equal("01:05:432", score.Time);
    }

    [Fact]
    public async Task CreateScore_KeepsOnlyBetterScoreForUserAndDifficulty()
    {
        await using var context = TestDbContextFactory.Create();
        var user = await AddUser(context, "Taylor", "taylor@example.com");
        var controller = new ScoresController(context);

        await controller.CreateScore(new CreateScoreRequest(user.Id, "Easy", 5000));
        await controller.CreateScore(new CreateScoreRequest(user.Id, "Easy", 7000));
        await controller.CreateScore(new CreateScoreRequest(user.Id, "Easy", 3000));

        var storedScores = await context.Scores.ToListAsync();

        Assert.Single(storedScores);
        Assert.Equal(3000, storedScores[0].ElapsedMilliseconds);
    }

    [Fact]
    public async Task GetScores_ReturnsRankingsOrderedByBestElapsedTime()
    {
        await using var context = TestDbContextFactory.Create();
        var firstUser = await AddUser(context, "Slow", "slow@example.com");
        var secondUser = await AddUser(context, "Fast", "fast@example.com");

        context.Scores.AddRange(
            new ScoreEntry
            {
                UserId = firstUser.Id,
                Difficulty = "Easy",
                ElapsedMilliseconds = 5000,
                CreatedAt = DateTime.UtcNow.AddMinutes(-2)
            },
            new ScoreEntry
            {
                UserId = secondUser.Id,
                Difficulty = "Easy",
                ElapsedMilliseconds = 3000,
                CreatedAt = DateTime.UtcNow.AddMinutes(-1)
            },
            new ScoreEntry
            {
                UserId = firstUser.Id,
                Difficulty = "Medium",
                ElapsedMilliseconds = 1000,
                CreatedAt = DateTime.UtcNow
            }
        );
        await context.SaveChangesAsync();

        var controller = new ScoresController(context);

        var result = await controller.GetScores("easy");

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var scores = Assert.IsType<List<ScoreResponse>>(okResult.Value);

        Assert.Equal(2, scores.Count);
        Assert.Equal(secondUser.Id, scores[0].UserId);
        Assert.Equal(1, scores[0].Rank);
        Assert.Equal(firstUser.Id, scores[1].UserId);
        Assert.Equal(2, scores[1].Rank);
        Assert.All(scores, score => Assert.Equal("Easy", score.Difficulty));
    }

    [Fact]
    public async Task GetScore_ReturnsRankedScoreWhenItExists()
    {
        await using var context = TestDbContextFactory.Create();
        var user = await AddUser(context, "Morgan", "morgan@example.com");
        var entry = new ScoreEntry
        {
            UserId = user.Id,
            Difficulty = "Easy",
            ElapsedMilliseconds = 1234,
            CreatedAt = DateTime.UtcNow
        };

        context.Scores.Add(entry);
        await context.SaveChangesAsync();

        var controller = new ScoresController(context);

        var result = await controller.GetScore(entry.Id);

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var score = Assert.IsType<ScoreResponse>(okResult.Value);

        Assert.Equal(entry.Id, score.Id);
        Assert.Equal("00:01:234", score.Time);
    }

    private static async Task<User> AddUser(
        Backend.Data.AppDbContext context,
        string name,
        string email
    )
    {
        var user = new User
        {
            Name = name,
            Email = email,
            PasswordHash = "hash",
            CreatedAt = DateTime.UtcNow
        };

        context.Users.Add(user);
        await context.SaveChangesAsync();

        return user;
    }
}
