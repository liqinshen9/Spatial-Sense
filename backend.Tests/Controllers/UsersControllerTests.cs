using Backend.Controllers;
using Backend.Models;
using Backend.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Tests;

public class UsersControllerTests : IDisposable
{
    private readonly string _webRootPath = Path.Combine(
        Path.GetTempPath(),
        $"users-tests-{Guid.NewGuid():N}"
    );

    [Fact]
    public async Task GetUser_ReturnsProfileForExistingUser()
    {
        await using var context = TestDbContextFactory.Create();
        var user = await AddUser(context);
        var controller = CreateController(context);

        var result = await controller.GetUser(user.Id);

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var profile = Assert.IsType<UserProfileResponse>(okResult.Value);

        Assert.Equal(user.Id, profile.Id);
        Assert.Equal(user.Name, profile.Name);
        Assert.Equal(user.Email, profile.Email);
    }

    [Fact]
    public async Task GetUser_ReturnsNotFoundForMissingUser()
    {
        await using var context = TestDbContextFactory.Create();
        var controller = CreateController(context);

        var result = await controller.GetUser(123);

        Assert.IsType<NotFoundObjectResult>(result.Result);
    }

    [Fact]
    public async Task UpdateAvatar_RejectsMissingAvatar()
    {
        await using var context = TestDbContextFactory.Create();
        var user = await AddUser(context);
        var controller = CreateController(context);

        var result = await controller.UpdateAvatar(
            user.Id,
            new UpdateAvatarRequest()
        );

        Assert.IsType<BadRequestObjectResult>(result.Result);
    }

    [Fact]
    public async Task UpdateAvatar_SavesNewAvatarAndDeletesOldAvatar()
    {
        await using var context = TestDbContextFactory.Create();
        var oldAvatarPath = Path.Combine(_webRootPath, "uploads", "avatars");
        Directory.CreateDirectory(oldAvatarPath);
        var oldAvatarFile = Path.Combine(oldAvatarPath, "old.png");
        await File.WriteAllBytesAsync(oldAvatarFile, [1, 1, 1]);

        var user = await AddUser(context, "/uploads/avatars/old.png");
        var controller = CreateController(context);

        var result = await controller.UpdateAvatar(
            user.Id,
            new UpdateAvatarRequest
            {
                Avatar = TestFileFactory.CreateFormFile("new.png", "image/png")
            }
        );

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var profile = Assert.IsType<UserProfileResponse>(okResult.Value);

        Assert.NotNull(profile.AvatarUrl);
        Assert.StartsWith("/uploads/avatars/avatar-", profile.AvatarUrl);
        Assert.False(File.Exists(oldAvatarFile));
    }

    [Fact]
    public async Task DeleteAccount_RemovesUserAndScores()
    {
        await using var context = TestDbContextFactory.Create();
        var user = await AddUser(context);
        context.Scores.Add(new ScoreEntry
        {
            UserId = user.Id,
            Difficulty = "Easy",
            ElapsedMilliseconds = 1000
        });
        await context.SaveChangesAsync();
        var controller = CreateController(context);

        var result = await controller.DeleteAccount(user.Id);

        Assert.IsType<NoContentResult>(result);
        Assert.Empty(await context.Users.ToListAsync());
        Assert.Empty(await context.Scores.ToListAsync());
    }

    public void Dispose()
    {
        if (Directory.Exists(_webRootPath))
        {
            Directory.Delete(_webRootPath, recursive: true);
        }
    }

    private UsersController CreateController(Backend.Data.AppDbContext context)
    {
        Directory.CreateDirectory(_webRootPath);
        var avatarStorageService = new AvatarStorageService(
            new TestWebHostEnvironment(_webRootPath)
        );

        return new UsersController(context, avatarStorageService);
    }

    private static async Task<User> AddUser(
        Backend.Data.AppDbContext context,
        string? avatarUrl = null
    )
    {
        var user = new User
        {
            Name = "Riley",
            Email = "riley@example.com",
            PasswordHash = "hash",
            AvatarUrl = avatarUrl,
            CreatedAt = DateTime.UtcNow
        };

        context.Users.Add(user);
        await context.SaveChangesAsync();

        return user;
    }
}
