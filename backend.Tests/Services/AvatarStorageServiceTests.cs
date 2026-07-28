using Backend.Services;

namespace Backend.Tests;

public class AvatarStorageServiceTests : IDisposable
{
    private readonly string _webRootPath = Path.Combine(
        Path.GetTempPath(),
        $"avatar-tests-{Guid.NewGuid():N}"
    );

    [Fact]
    public async Task SaveAvatarAsync_ReturnsNullWhenNoFileIsProvided()
    {
        var service = CreateService();

        var avatarUrl = await service.SaveAvatarAsync(null);

        Assert.Null(avatarUrl);
    }

    [Fact]
    public async Task SaveAvatarAsync_SavesValidImageAndReturnsUploadUrl()
    {
        var service = CreateService();
        var file = TestFileFactory.CreateFormFile("profile.png", "image/png");

        var avatarUrl = await service.SaveAvatarAsync(file);

        Assert.NotNull(avatarUrl);
        Assert.StartsWith("/uploads/avatars/avatar-", avatarUrl);
        Assert.EndsWith(".png", avatarUrl);

        var savedFile = Path.Combine(
            _webRootPath,
            avatarUrl.TrimStart('/').Replace('/', Path.DirectorySeparatorChar)
        );
        Assert.True(File.Exists(savedFile));
    }

    [Theory]
    [InlineData("profile.txt", "image/png", "Avatar must be a JPG, PNG, WEBP, or GIF image.")]
    [InlineData("profile.png", "text/plain", "Avatar file must be an image.")]
    public async Task SaveAvatarAsync_RejectsInvalidFiles(
        string fileName,
        string contentType,
        string expectedMessage
    )
    {
        var service = CreateService();
        var file = TestFileFactory.CreateFormFile(fileName, contentType);

        var error = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.SaveAvatarAsync(file)
        );

        Assert.Equal(expectedMessage, error.Message);
    }

    [Fact]
    public async Task SaveAvatarAsync_RejectsOversizedFiles()
    {
        var service = CreateService();
        var oversizedContent = new byte[2 * 1024 * 1024 + 1];
        var file = TestFileFactory.CreateFormFile(
            "large.png",
            "image/png",
            oversizedContent
        );

        var error = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.SaveAvatarAsync(file)
        );

        Assert.Equal("Avatar image must be smaller than 2MB.", error.Message);
    }

    [Fact]
    public async Task DeleteAvatar_RemovesStoredAvatarButIgnoresOtherPaths()
    {
        var service = CreateService();
        var file = TestFileFactory.CreateFormFile("profile.webp", "image/webp");
        var avatarUrl = await service.SaveAvatarAsync(file);

        var unrelatedFilePath = Path.Combine(_webRootPath, "unrelated.png");
        await File.WriteAllBytesAsync(unrelatedFilePath, [9, 9, 9]);

        service.DeleteAvatar("/unrelated.png");
        service.DeleteAvatar(avatarUrl);

        var avatarPath = Path.Combine(
            _webRootPath,
            avatarUrl!.TrimStart('/').Replace('/', Path.DirectorySeparatorChar)
        );
        Assert.False(File.Exists(avatarPath));
        Assert.True(File.Exists(unrelatedFilePath));
    }

    [Fact]
    public void GetUploadFolderPath_UsesPersistentAzureStorageWhenRunningInAppService()
    {
        var originalHome = Environment.GetEnvironmentVariable("HOME");
        var originalSiteName = Environment.GetEnvironmentVariable("WEBSITE_SITE_NAME");
        var azureHomePath = Path.Combine(
            Path.GetTempPath(),
            $"avatar-azure-home-{Guid.NewGuid():N}"
        );

        try
        {
            Environment.SetEnvironmentVariable("HOME", azureHomePath);
            Environment.SetEnvironmentVariable("WEBSITE_SITE_NAME", "spatial-sense-api");

            var service = CreateService();

            var uploadFolderPath = service.GetUploadFolderPath();

            Assert.Equal(
                Path.Combine(
                    azureHomePath,
                    "data",
                    "spatial-sense",
                    "uploads",
                    "avatars"
                ),
                uploadFolderPath
            );
        }
        finally
        {
            Environment.SetEnvironmentVariable("HOME", originalHome);
            Environment.SetEnvironmentVariable("WEBSITE_SITE_NAME", originalSiteName);

            if (Directory.Exists(azureHomePath))
            {
                Directory.Delete(azureHomePath, recursive: true);
            }
        }
    }

    public void Dispose()
    {
        if (Directory.Exists(_webRootPath))
        {
            Directory.Delete(_webRootPath, recursive: true);
        }
    }

    private AvatarStorageService CreateService()
    {
        Directory.CreateDirectory(_webRootPath);
        return new AvatarStorageService(new TestWebHostEnvironment(_webRootPath));
    }
}
