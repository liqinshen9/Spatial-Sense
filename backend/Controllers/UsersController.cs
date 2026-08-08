using Backend.Data;
using Backend.Models;
using Backend.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly AvatarStorageService _avatarStorageService;

    public UsersController(AppDbContext context, AvatarStorageService avatarStorageService)
    {
        _context = context;
        _avatarStorageService = avatarStorageService;
    }

    [HttpGet("{id:int}")]
    [EnableRateLimiting("Api")]
    public async Task<ActionResult<UserProfileResponse>> GetUser(int id)
    {
        var user = await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(user => user.Id == id);

        if (user is null)
        {
            return NotFound(new { message = "User not found." });
        }

        return Ok(ToUserProfileResponse(user));
    }

    [HttpPut("{id:int}/avatar")]
    [Consumes("multipart/form-data")]
    [EnableRateLimiting("Write")]
    public async Task<ActionResult<UserProfileResponse>> UpdateAvatar(
        int id,
        [FromForm] UpdateAvatarRequest request
    )
    {
        var user = await _context.Users.FindAsync(id);

        if (user is null)
        {
            return NotFound(new { message = "User not found." });
        }

        if (request.Avatar is null || request.Avatar.Length == 0)
        {
            return BadRequest(new { message = "Please choose an avatar image." });
        }

        string? newAvatarUrl;

        try
        {
            newAvatarUrl = await _avatarStorageService.SaveAvatarAsync(request.Avatar);
        }
        catch (InvalidOperationException error)
        {
            return BadRequest(new { message = error.Message });
        }

        var oldAvatarUrl = user.AvatarUrl;

        user.AvatarUrl = newAvatarUrl;
        await _context.SaveChangesAsync();

        _avatarStorageService.DeleteAvatar(oldAvatarUrl);

        return Ok(ToUserProfileResponse(user));
    }

    [HttpDelete("{id:int}")]
    [EnableRateLimiting("Write")]
    public async Task<IActionResult> DeleteAccount(int id)
    {
        var user = await _context.Users
            .Include(user => user.Scores)
            .FirstOrDefaultAsync(user => user.Id == id);

        if (user is null)
        {
            return NotFound(new { message = "User not found." });
        }

        var avatarUrl = user.AvatarUrl;

        _context.Users.Remove(user);
        await _context.SaveChangesAsync();

        _avatarStorageService.DeleteAvatar(avatarUrl);

        return NoContent();
    }

    private UserProfileResponse ToUserProfileResponse(User user)
    {
        return new UserProfileResponse(
            user.Id,
            user.Name,
            user.Email,
            _avatarStorageService.GetAvailableAvatarUrl(user.AvatarUrl),
            user.CreatedAt
        );
    }
}

public class UpdateAvatarRequest
{
    public IFormFile? Avatar { get; set; }
}

public record UserProfileResponse(
    int Id,
    string Name,
    string Email,
    string? AvatarUrl,
    DateTime CreatedAt
);
