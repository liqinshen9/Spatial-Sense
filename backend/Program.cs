using Backend.Data;
using Backend.Models;
using Microsoft.EntityFrameworkCore;
using Backend.Services;
using Microsoft.Extensions.FileProviders;
using Scalar.AspNetCore;

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

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("DefaultConnection"),
        sqlOptions =>
        {
            sqlOptions.EnableRetryOnFailure(
                maxRetryCount: 8,
                maxRetryDelay: TimeSpan.FromSeconds(10),
                errorNumbersToAdd: null
            );
        }
    ));

builder.Services.AddControllers();
builder.Services.AddOpenApi();
builder.Services.AddSingleton<PuzzleService>();
builder.Services.AddSingleton<PasswordService>();
builder.Services.AddSingleton<AvatarStorageService>();

var app = builder.Build();

var webRootPath = Path.Combine(app.Environment.ContentRootPath, "wwwroot");
var avatarFolderPath = Path.Combine(webRootPath, "uploads", "avatars");

Directory.CreateDirectory(avatarFolderPath);

app.UseCors("Frontend");

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(webRootPath),
    RequestPath = ""
});

app.MapGet("/", () => "Backend is running!");

app.MapGet("/api/users", async (AppDbContext db) =>
{
    var users = await db.Users
        .Select(user => new
        {
            user.Id,
            user.Name,
            user.Email,
            user.AvatarUrl,
            user.CreatedAt
        })
        .ToListAsync();

    return Results.Ok(users);
});

app.MapControllers();
app.MapOpenApi();
app.MapScalarApiReference();

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