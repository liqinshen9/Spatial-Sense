using Microsoft.AspNetCore.Http;

namespace Backend.Tests;

internal static class TestFileFactory
{
    public static IFormFile CreateFormFile(
        string fileName,
        string contentType,
        byte[]? content = null
    )
    {
        var bytes = content ?? [1, 2, 3, 4];
        var stream = new MemoryStream(bytes);

        return new FormFile(stream, 0, bytes.Length, "avatar", fileName)
        {
            Headers = new HeaderDictionary(),
            ContentType = contentType
        };
    }
}
