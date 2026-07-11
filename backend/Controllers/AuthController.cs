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
    private readonly AppDbContext _context;
    private readonly PasswordService _passwordService;

    public AuthController(AppDbContext context, PasswordService passwordService)
    {
        _context = context;
        _passwordService = passwordService;
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthUserResponse>> Login(LoginRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.UsernameOrEmail) ||
            string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new { message = "Username/email and password are required." });
        }

        var identifier = request.UsernameOrEmail.Trim().ToLower();

        var user = await _context.Users.FirstOrDefaultAsync(user =>
            user.Email.ToLower() == identifier ||
            user.Name.ToLower() == identifier
        );

        if (user is null)
        {
            return NotFound(new
            {
                message = "This user does not exist. Please sign up first.",
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
    public async Task<ActionResult<AuthUserResponse>> Register(RegisterRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name) ||
            string.IsNullOrWhiteSpace(request.Email) ||
            string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new { message = "Name, email, and password are required." });
        }

        var name = request.Name.Trim();
        var email = request.Email.Trim().ToLower();

        var usernameAlreadyExists = await _context.Users.AnyAsync(user =>
        user.Name.ToLower() == name.ToLower()
        );

        if (usernameAlreadyExists)
        {
            return Conflict(new { message = "This username is already taken. Please choose another one." });
        }

        var emailAlreadyExists = await _context.Users.AnyAsync(user =>
            user.Email.ToLower() == email
        );

        if (emailAlreadyExists)
        {
            return Conflict(new { message = "This email is already registered. Please log in." });
        }
        var user = new User
        {
            Name = name,
            Email = email,
            PasswordHash = _passwordService.HashPassword(request.Password),
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
            user.CreatedAt
        );
    }
}

public record LoginRequest(string UsernameOrEmail, string Password);

public record RegisterRequest(string Name, string Email, string Password);

public record AuthUserResponse(int Id, string Name, string Email, DateTime CreatedAt);