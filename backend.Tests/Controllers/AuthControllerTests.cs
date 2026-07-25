using Backend.Controllers;
using Backend.Models;
using Backend.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Tests;

public class AuthControllerTests : IDisposable
{
    private readonly string _webRootPath = Path.Combine(
        Path.GetTempPath(),
        $"auth-tests-{Guid.NewGuid():N}"
    );

    [Fact]
    public async Task Login_RejectsBlankCredentials()
    {
        await using var context = TestDbContextFactory.Create();
        var controller = CreateController(context);

        var result = await controller.Login(new LoginRequest("", ""));

        Assert.IsType<BadRequestObjectResult>(result.Result);
    }

    [Fact]
    public async Task Login_ReturnsNotFoundForUnknownUser()
    {
        await using var context = TestDbContextFactory.Create();
        var controller = CreateController(context);

        var result = await controller.Login(
            new LoginRequest("missing@example.com", "password")
        );

        Assert.IsType<NotFoundObjectResult>(result.Result);
    }

    [Fact]
    public async Task Login_RejectsWrongPassword()
    {
        await using var context = TestDbContextFactory.Create();
        var passwordService = new PasswordService();
        context.Users.Add(new User
        {
            Name = "Sam",
            Email = "sam@example.com",
            PasswordHash = passwordService.HashPassword("correct-password")
        });
        await context.SaveChangesAsync();
        var controller = CreateController(context, passwordService);

        var result = await controller.Login(
            new LoginRequest("sam@example.com", "wrong-password")
        );

        Assert.IsType<UnauthorizedObjectResult>(result.Result);
    }

    [Theory]
    [InlineData("sam@example.com")]
    [InlineData("Sam")]
    public async Task Login_SucceedsWithEmailOrUsername(string identifier)
    {
        await using var context = TestDbContextFactory.Create();
        var passwordService = new PasswordService();
        context.Users.Add(new User
        {
            Name = "Sam",
            Email = "sam@example.com",
            PasswordHash = passwordService.HashPassword("correct-password")
        });
        await context.SaveChangesAsync();
        var controller = CreateController(context, passwordService);

        var result = await controller.Login(
            new LoginRequest(identifier, "correct-password")
        );

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var user = Assert.IsType<AuthUserResponse>(okResult.Value);
        Assert.Equal("Sam", user.Name);
        Assert.Equal("sam@example.com", user.Email);
    }

    [Fact]
    public async Task Register_CreatesUserAndNormalizesEmail()
    {
        await using var context = TestDbContextFactory.Create();
        var controller = CreateController(context);

        var result = await controller.Register(new RegisterRequest
        {
            Name = "  Jamie  ",
            Email = "JAMIE@EXAMPLE.COM",
            Password = "password"
        });

        var createdResult = Assert.IsType<CreatedResult>(result.Result);
        var user = Assert.IsType<AuthUserResponse>(createdResult.Value);

        Assert.Equal("Jamie", user.Name);
        Assert.Equal("jamie@example.com", user.Email);
        Assert.Single(await context.Users.ToListAsync());
    }

    [Fact]
    public async Task Register_RejectsDuplicateUsernameAndEmail()
    {
        await using var context = TestDbContextFactory.Create();
        var passwordService = new PasswordService();
        context.Users.Add(new User
        {
            Name = "Jamie",
            Email = "jamie@example.com",
            PasswordHash = passwordService.HashPassword("password")
        });
        await context.SaveChangesAsync();
        var controller = CreateController(context, passwordService);

        var duplicateName = await controller.Register(new RegisterRequest
        {
            Name = "jamie",
            Email = "new@example.com",
            Password = "password"
        });
        var duplicateEmail = await controller.Register(new RegisterRequest
        {
            Name = "NewName",
            Email = "JAMIE@EXAMPLE.COM",
            Password = "password"
        });

        Assert.IsType<ConflictObjectResult>(duplicateName.Result);
        Assert.IsType<ConflictObjectResult>(duplicateEmail.Result);
    }

    public void Dispose()
    {
        if (Directory.Exists(_webRootPath))
        {
            Directory.Delete(_webRootPath, recursive: true);
        }
    }

    private AuthController CreateController(
        Backend.Data.AppDbContext context,
        PasswordService? passwordService = null
    )
    {
        Directory.CreateDirectory(_webRootPath);
        var avatarStorageService = new AvatarStorageService(
            new TestWebHostEnvironment(_webRootPath)
        );

        return new AuthController(
            context,
            passwordService ?? new PasswordService(),
            avatarStorageService
        );
    }
}
