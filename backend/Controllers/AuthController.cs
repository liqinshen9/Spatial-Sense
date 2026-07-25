using Backend.Data;
using Backend.Models;
using Backend.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private const string PasswordValidationMessage =
        "Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.";
    private const string UsernameInUseMessage = "Username is already in use.";

    private readonly AppDbContext _context;
    private readonly PasswordService _passwordService;
    private readonly AvatarStorageService _avatarStorageService;

    public AuthController(
        AppDbContext context,
        PasswordService passwordService,
        AvatarStorageService avatarStorageService
    )
    {
        _context = context;
        _passwordService = passwordService;
        _avatarStorageService = avatarStorageService;
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthUserResponse>> Login(LoginRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.UsernameOrEmail) ||
            string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new { message = "Username/email and password are required." });
        }

        var identifier = request.UsernameOrEmail.Trim();

        var user = await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(user =>
                user.Email == identifier ||
                user.Name == identifier
            );

        if (user is null)
        {
            return NotFound(new
            {
                message = "User not found. Please register first.",
                needsRegistration = true
            });
        }

        var passwordIsValid = _passwordService.VerifyPassword(
            request.Password,
            user.PasswordHash
        );

        if (!passwordIsValid)
        {
            return Unauthorized(new { message = "Incorrect password." });
        }

        return Ok(ToAuthUserResponse(user));
    }

    [HttpPost("register")]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<AuthUserResponse>> Register([FromForm] RegisterRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name) ||
            string.IsNullOrWhiteSpace(request.Email) ||
            string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new { message = "Name, email, and password are required." });
        }

        var name = request.Name.Trim();
        var email = request.Email.Trim().ToLower();

        if (!PasswordMeetsRequirements(request.Password))
        {
            return BadRequest(new { message = PasswordValidationMessage });
        }

        var usernameAlreadyExists = await _context.Users.AnyAsync(user =>
            user.Name.ToLower() == name.ToLower()
        );

        if (usernameAlreadyExists)
        {
            return Conflict(new { message = UsernameInUseMessage });
        }

        var emailAlreadyExists = await _context.Users.AnyAsync(user =>
            user.Email.ToLower() == email
        );

        if (emailAlreadyExists)
        {
            return Conflict(new { message = "This email is already registered. Please log in." });
        }

        string? avatarUrl;

        try
        {
            avatarUrl = await _avatarStorageService.SaveAvatarAsync(request.Avatar);
        }
        catch (InvalidOperationException error)
        {
            return BadRequest(new { message = error.Message });
        }

        var user = new User
        {
            Name = name,
            Email = email,
            PasswordHash = _passwordService.HashPassword(request.Password),
            AvatarUrl = avatarUrl,
            CreatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        return Created($"/api/users/{user.Id}", ToAuthUserResponse(user));
    }

    private static AuthUserResponse ToAuthUserResponse(User user)
    {
        return new AuthUserResponse(
            user.Id,
            user.Name,
            user.Email,
            user.AvatarUrl,
            user.CreatedAt
        );
    }

    private static bool PasswordMeetsRequirements(string password)
    {
        return password.Length >= 8 &&
            password.Any(char.IsUpper) &&
            password.Any(char.IsLower) &&
            password.Any(char.IsDigit) &&
            password.Any(character => !char.IsLetterOrDigit(character));
    }
}

public record LoginRequest(string UsernameOrEmail, string Password);

public class RegisterRequest
{
    public string Name { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string Password { get; set; } = string.Empty;

    public IFormFile? Avatar { get; set; }
}

public record AuthUserResponse(
    int Id,
    string Name,
    string Email,
    string? AvatarUrl,
    DateTime CreatedAt
);
