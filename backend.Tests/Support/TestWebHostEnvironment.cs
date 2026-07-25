using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.FileProviders;

namespace Backend.Tests;

internal class TestWebHostEnvironment : IWebHostEnvironment
{
    public TestWebHostEnvironment(string webRootPath)
    {
        WebRootPath = webRootPath;
        ContentRootPath = webRootPath;
        WebRootFileProvider = new PhysicalFileProvider(webRootPath);
        ContentRootFileProvider = new PhysicalFileProvider(webRootPath);
    }

    public string ApplicationName { get; set; } = "Backend.Tests";
    public IFileProvider ContentRootFileProvider { get; set; }
    public string ContentRootPath { get; set; }
    public string EnvironmentName { get; set; } = "Testing";
    public string WebRootPath { get; set; }
    public IFileProvider WebRootFileProvider { get; set; }
}
