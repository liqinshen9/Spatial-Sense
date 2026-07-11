using Backend.Data;
using Backend.Models;
using Microsoft.EntityFrameworkCore;
using Backend.Services;

var builder = WebApplication.CreateBuilder(args);

builder.WebHost.UseUrls("http://localhost:5000");

builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        policy
            .WithOrigins("http://localhost:5173")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(connectionString));

builder.Services.AddControllers();
builder.Services.AddSingleton<PuzzleService>();
builder.Services.AddSingleton<PasswordService>();

var app = builder.Build();

app.UseCors("Frontend");

app.MapGet("/", () => "Backend is running!");

app.MapGet("/api/users", async (AppDbContext db) =>
{
    var users = await db.Users
        .Select(user => new
        {
            user.Id,
            user.Name,
            user.Email,
            user.CreatedAt
        })
        .ToListAsync();

    return Results.Ok(users);
});

app.MapControllers();

app.MapGet("/api/puzzles", (PuzzleService puzzleService) =>
{
    return Results.Ok(puzzleService.GetAll());
});

app.MapGet("/api/puzzles/random", (string? difficulty, PuzzleService puzzleService) =>
{
    var selectedDifficulty = string.IsNullOrWhiteSpace(difficulty)
        ? "Easy"
        : difficulty;

    var puzzle = puzzleService.GetRandom(selectedDifficulty);

    return Results.Ok(puzzle);
});

app.MapGet("/api/puzzles/{id:int}", (int id, PuzzleService puzzleService) =>
{
    var puzzle = puzzleService.GetById(id);

    if (puzzle == null)
    {
        return Results.NotFound();
    }

    return Results.Ok(puzzle);
});


app.Run();