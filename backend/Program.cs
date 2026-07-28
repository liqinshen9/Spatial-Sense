using Backend.Data;
using Backend.Models;
using Microsoft.EntityFrameworkCore;
using Backend.Services;
using Microsoft.Extensions.FileProviders;
using Scalar.AspNetCore;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.RateLimiting;

var builder = WebApplication.CreateBuilder(args);

builder.WebHost.UseUrls("http://localhost:5000");

builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        policy
            .WithOrigins("http://localhost:5173", "https://spatial-sense.azurestaticapps.net")
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
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.OnRejected = async (context, cancellationToken) =>
    {
        context.HttpContext.Response.ContentType = "application/json";

        await context.HttpContext.Response.WriteAsJsonAsync(
            new { message = "Too many requests. Please try again shortly." },
            cancellationToken
        );
    };

    options.AddPolicy("Api", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 120,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0,
                AutoReplenishment = true
            }
        )
    );

    options.AddPolicy("Auth", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 10,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0,
                AutoReplenishment = true
            }
        )
    );

    options.AddPolicy("Write", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 30,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0,
                AutoReplenishment = true
            }
        )
    );
});
builder.Services.AddSingleton<PuzzleService>();
builder.Services.AddSingleton<PasswordService>();
builder.Services.AddSingleton<AvatarStorageService>();

var app = builder.Build();

var webRootPath = Path.Combine(app.Environment.ContentRootPath, "wwwroot");
var avatarFolderPath = Path.Combine(webRootPath, "uploads", "avatars");

Directory.CreateDirectory(avatarFolderPath);

app.UseCors("Frontend");
app.UseRateLimiter();

app.UseDefaultFiles(new DefaultFilesOptions
{
    FileProvider = new PhysicalFileProvider(webRootPath)
});

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(webRootPath),
    RequestPath = ""
});

app.MapGet("/health", () => "Backend is running!");

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
}).RequireRateLimiting("Api");

app.MapControllers();
app.MapOpenApi();
app.MapScalarApiReference();

app.MapGet("/api/puzzles", (PuzzleService puzzleService) =>
{
    return Results.Ok(puzzleService.GetAll());
}).RequireRateLimiting("Api");

app.MapGet("/api/puzzles/random", (string? difficulty, PuzzleService puzzleService) =>
{
    var selectedDifficulty = string.IsNullOrWhiteSpace(difficulty)
        ? "Easy"
        : difficulty;

    var puzzle = puzzleService.GetRandom(selectedDifficulty);

    return Results.Ok(puzzle);
}).RequireRateLimiting("Api");

app.MapGet("/api/puzzles/{id:int}", (int id, PuzzleService puzzleService) =>
{
    var puzzle = puzzleService.GetById(id);

    if (puzzle == null)
    {
        return Results.NotFound();
    }

    return Results.Ok(puzzle);
}).RequireRateLimiting("Api");

app.MapMethods(
    "/api/{**path}",
    new[] { "GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD" },
    () => Results.NotFound()
).RequireRateLimiting("Api");

app.MapFallbackToFile("index.html");

app.Run();
