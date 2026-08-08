using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;

namespace Backend.Services;

public class AvatarStorageService
{
    private const long MaxAvatarSizeInBytes = 2 * 1024 * 1024;

    private static readonly HashSet<string> AllowedExtensions = new()
    {
        ".jpg",
        ".jpeg",
        ".png",
        ".webp",
        ".gif"
    };

    private readonly IWebHostEnvironment _environment;

    public AvatarStorageService(IWebHostEnvironment environment)
    {
        _environment = environment;
    }

    public async Task<string?> SaveAvatarAsync(IFormFile? avatar)
    {
        if (avatar is null || avatar.Length == 0)
        {
            return null;
        }

        if (avatar.Length > MaxAvatarSizeInBytes)
        {
            throw new InvalidOperationException("Avatar image must be smaller than 2MB.");
        }

        var extension = Path.GetExtension(avatar.FileName).ToLowerInvariant();

        if (!AllowedExtensions.Contains(extension))
        {
            throw new InvalidOperationException("Avatar must be a JPG, PNG, WEBP, or GIF image.");
        }

        if (string.IsNullOrWhiteSpace(avatar.ContentType) ||
            !avatar.ContentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("Avatar file must be an image.");
        }

        var uploadFolder = GetUploadFolderPath();

        Directory.CreateDirectory(uploadFolder);

        var fileName = $"avatar-{Guid.NewGuid():N}{extension}";
        var filePath = Path.Combine(uploadFolder, fileName);

        await using var stream = File.Create(filePath);
        await avatar.CopyToAsync(stream);

        return $"/uploads/avatars/{fileName}";
    }

    public void DeleteAvatar(string? avatarUrl)
    {
        if (string.IsNullOrWhiteSpace(avatarUrl))
        {
            return;
        }

        if (!avatarUrl.StartsWith("/uploads/avatars/", StringComparison.OrdinalIgnoreCase))
        {
            return;
        }

        var uploadFolder = GetUploadFolderPath();
        var fileName = Path.GetFileName(avatarUrl);
        var filePath = Path.Combine(uploadFolder, fileName);

        if (File.Exists(filePath))
        {
            File.Delete(filePath);
        }
    }

    public string? GetAvailableAvatarUrl(string? avatarUrl)
    {
        if (string.IsNullOrWhiteSpace(avatarUrl))
        {
            return null;
        }

        if (!avatarUrl.StartsWith("/uploads/avatars/", StringComparison.OrdinalIgnoreCase))
        {
            return avatarUrl;
        }

        var uploadFolder = GetUploadFolderPath();
        var fileName = Path.GetFileName(avatarUrl);
        var filePath = Path.Combine(uploadFolder, fileName);

        return File.Exists(filePath) ? avatarUrl : null;
    }

    public string GetUploadFolderPath()
    {
        var azureHomePath = Environment.GetEnvironmentVariable("HOME");
        var azureSiteName = Environment.GetEnvironmentVariable("WEBSITE_SITE_NAME");

        if (!string.IsNullOrWhiteSpace(azureHomePath) &&
            !string.IsNullOrWhiteSpace(azureSiteName))
        {
            return Path.Combine(
                azureHomePath,
                "data",
                "spatial-sense",
                "uploads",
                "avatars"
            );
        }

        return Path.Combine(GetWebRootPath(), "uploads", "avatars");
    }

    private string GetWebRootPath()
    {
        if (!string.IsNullOrWhiteSpace(_environment.WebRootPath))
        {
            return _environment.WebRootPath;
        }

        return Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
    }
}
