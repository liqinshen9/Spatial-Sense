using Backend.Data;
using Backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ScoresController : ControllerBase
{
    private readonly AppDbContext _context;

    public ScoresController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    [EnableRateLimiting("Api")]
    public async Task<ActionResult<List<ScoreResponse>>> GetScores([FromQuery] string? difficulty)
    {
        var selectedDifficulty = NormalizeDifficulty(difficulty);
        var rankings = await GetRankings(selectedDifficulty);

        return Ok(rankings);
    }

    [HttpPost]
    [EnableRateLimiting("Write")]
    public async Task<ActionResult<ScoreResponse>> CreateScore(CreateScoreRequest request)
    {
        if (request.UserId <= 0)
        {
            return BadRequest(new { message = "A valid user is required." });
        }

        if (request.ElapsedMilliseconds <= 0)
        {
            return BadRequest(new { message = "Elapsed time must be greater than 0." });
        }

        var user = await _context.Users.FindAsync(request.UserId);

        if (user is null)
        {
            return NotFound(new { message = "User was not found." });
        }

        var difficulty = NormalizeDifficulty(request.Difficulty);

        var existingScores = await _context.Scores
            .Where(score =>
                score.UserId == request.UserId &&
                score.Difficulty == difficulty
            )
            .OrderBy(score => score.ElapsedMilliseconds)
            .ThenBy(score => score.CreatedAt)
            .ToListAsync();

        var existingScore = existingScores.FirstOrDefault();

        if (existingScore is null)
        {
            existingScore = new ScoreEntry
            {
                UserId = request.UserId,
                Difficulty = difficulty,
                ElapsedMilliseconds = request.ElapsedMilliseconds,
                CreatedAt = DateTime.UtcNow
            };

            _context.Scores.Add(existingScore);
        }
        else if (request.ElapsedMilliseconds < existingScore.ElapsedMilliseconds)
        {
            existingScore.ElapsedMilliseconds = request.ElapsedMilliseconds;
            existingScore.CreatedAt = DateTime.UtcNow;
        }

        if (existingScores.Count > 1)
        {
            _context.Scores.RemoveRange(existingScores.Skip(1));
        }

        await _context.SaveChangesAsync();

        var rankings = await GetRankings(difficulty);

        var savedScore = rankings.FirstOrDefault(score =>
            score.UserId == user.Id
        );

        if (savedScore is null)
        {
            return BadRequest(new { message = "Score could not be ranked." });
        }

        return Ok(savedScore);
    }

    [HttpGet("{id:int}")]
    [EnableRateLimiting("Api")]
    public async Task<ActionResult<ScoreResponse>> GetScore(int id)
    {
        var score = await _context.Scores.FindAsync(id);

        if (score is null)
        {
            return NotFound();
        }

        var rankings = await GetRankings(score.Difficulty);
        var result = rankings.FirstOrDefault(item => item.Id == id);

        if (result is null)
        {
            return NotFound();
        }

        return Ok(result);
    }

    private async Task<List<ScoreResponse>> GetRankings(string difficulty)
    {
        var bestScores = await _context.Scores
            .AsNoTracking()
            .Where(score =>
                score.Difficulty == difficulty &&
                !_context.Scores.Any(otherScore =>
                    otherScore.UserId == score.UserId &&
                    otherScore.Difficulty == score.Difficulty &&
                    (
                        otherScore.ElapsedMilliseconds < score.ElapsedMilliseconds ||
                        (
                            otherScore.ElapsedMilliseconds == score.ElapsedMilliseconds &&
                            otherScore.CreatedAt < score.CreatedAt
                        ) ||
                        (
                            otherScore.ElapsedMilliseconds == score.ElapsedMilliseconds &&
                            otherScore.CreatedAt == score.CreatedAt &&
                            otherScore.Id < score.Id
                        )
                    )
                )
            )
            .Select(score => new
            {
                score.Id,
                score.UserId,
                Username = score.User.Name,
                score.User.AvatarUrl,
                score.Difficulty,
                score.ElapsedMilliseconds,
                score.CreatedAt
            }
            )
            .OrderBy(score => score.ElapsedMilliseconds)
            .ThenBy(score => score.CreatedAt)
            .ThenBy(score => score.Id)
            .ToListAsync();

        return bestScores
            .Select((score, index) => new ScoreResponse(
                score.Id,
                index + 1,
                score.UserId,
                score.Username,
                score.AvatarUrl,
                score.Difficulty,
                score.ElapsedMilliseconds,
                FormatTime(score.ElapsedMilliseconds),
                score.CreatedAt
            ))
            .ToList();
    }

    private static string NormalizeDifficulty(string? difficulty)
    {
        return difficulty?.Trim().ToLower() switch
        {
            "easy" => "Easy",
            "medium" => "Medium",
            "difficult" => "Difficult",
            _ => "Easy"
        };
    }

    private static string FormatTime(int totalMilliseconds)
    {
        var minutes = totalMilliseconds / 60000;
        var seconds = totalMilliseconds % 60000 / 1000;
        var milliseconds = totalMilliseconds % 1000;

        return $"{minutes:D2}:{seconds:D2}:{milliseconds:D3}";
    }
}

public record CreateScoreRequest(
    int UserId,
    string Difficulty,
    int ElapsedMilliseconds
);

public record ScoreResponse(
    int Id,
    int Rank,
    int UserId,
    string Username,
    string? AvatarUrl,
    string Difficulty,
    int ElapsedMilliseconds,
    string Time,
    DateTime CreatedAt
);
