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

var app = builder.Build();

app.UseCors("Frontend");

app.MapGet("/", () => "Backend is running!");

app.MapGet("/api/users", async (AppDbContext db) =>
{
    var users = await db.Users.ToListAsync();
    return Results.Ok(users);
});

app.MapGet("/api/users/{id}", async (int id, AppDbContext db) =>
{
    var user = await db.Users.FindAsync(id);

    if (user == null)
    {
        return Results.NotFound();
    }

    return Results.Ok(user);
});

app.MapPost("/api/users", async (User user, AppDbContext db) =>
{
    if (string.IsNullOrWhiteSpace(user.Name) || string.IsNullOrWhiteSpace(user.Email))
    {
        return Results.BadRequest("Name and email are required.");
    }
    db.Users.Add(user);
    await db.SaveChangesAsync();
    return Results.Created($"/api/users/{user.Id}", user);
});

app.MapPut("/api/users/{id}", async (int id, User updatedUser, AppDbContext db) =>
{
    if (string.IsNullOrWhiteSpace(updatedUser.Name) || string.IsNullOrWhiteSpace(updatedUser.Email))
    {
        return Results.BadRequest("Name and email are required.");
    }

    var user = await db.Users.FindAsync(id);

    if (user == null)
    {
        return Results.NotFound();
    }

    user.Name = updatedUser.Name;
    user.Email = updatedUser.Email;

    await db.SaveChangesAsync();

    return Results.Ok(user);
});

app.MapDelete("/api/users/{id}", async (int id, AppDbContext db) =>
{
    var user = await db.Users.FindAsync(id);

    if (user == null)
    {
        return Results.NotFound();
    }

    db.Users.Remove(user);
    await db.SaveChangesAsync();

    return Results.NoContent();
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