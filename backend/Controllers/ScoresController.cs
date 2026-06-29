using Backend.Data;
using Backend.Models;
using Microsoft.AspNetCore.Mvc;
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
    public async Task<ActionResult<List<ScoreEntry>>> GetScores()
    {
        var scores = await _context.Scores
            .OrderByDescending(score => score.Score)
            .ThenBy(score => score.CreatedAt)
            .ToListAsync();

        return Ok(scores);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ScoreEntry>> GetScore(int id)
    {
        var score = await _context.Scores.FindAsync(id);

        if (score is null)
        {
            return NotFound();
        }

        return Ok(score);
    }

}