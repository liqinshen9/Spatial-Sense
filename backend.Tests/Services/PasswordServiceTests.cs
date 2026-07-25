using Backend.Services;

namespace Backend.Tests;

public class PasswordServiceTests
{
    private readonly PasswordService _passwordService = new();

    [Fact]
    public void HashPassword_CreatesVerifiableHashWithoutStoringPlainText()
    {
        var hash = _passwordService.HashPassword("secret-password");

        Assert.StartsWith("PBKDF2$", hash);
        Assert.DoesNotContain("secret-password", hash);
        Assert.True(_passwordService.VerifyPassword("secret-password", hash));
    }

    [Fact]
    public void HashPassword_UsesDifferentSaltForSamePassword()
    {
        var firstHash = _passwordService.HashPassword("same-password");
        var secondHash = _passwordService.HashPassword("same-password");

        Assert.NotEqual(firstHash, secondHash);
        Assert.True(_passwordService.VerifyPassword("same-password", firstHash));
        Assert.True(_passwordService.VerifyPassword("same-password", secondHash));
    }

    [Fact]
    public void VerifyPassword_RejectsWrongPasswordAndInvalidFormat()
    {
        var hash = _passwordService.HashPassword("correct-password");

        Assert.False(_passwordService.VerifyPassword("wrong-password", hash));
        Assert.False(_passwordService.VerifyPassword("anything", "not-a-valid-hash"));
    }
}
