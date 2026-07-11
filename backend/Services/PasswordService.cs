using System.Security.Cryptography;

namespace Backend.Services;

public class PasswordService
{
    //Number of random bytes used for the salt. A salt makes sure that even if two users have the same password, their stored password hashes will still be different.
    private const int SaltSize = 16;

    //Number of bytes produced for the final password hash.
    private const int HashSize = 32;

    //Number of PBKDF2 iterations. More iterations make brute-force attacks slower.
    private const int Iterations = 100000;

    public string HashPassword(string password)
    {
        //Generate a new random salt for every password.
        var salt = RandomNumberGenerator.GetBytes(SaltSize);

        //Use PBKDF2 to create a one-way password hash. The real password is never stored in the database.
        var hash = Rfc2898DeriveBytes.Pbkdf2(
            password,
            salt,
            Iterations,
            HashAlgorithmName.SHA256,
            HashSize
        );

        // Store the algorithm name, iteration count, salt, and hash together.The salt is not secret; it is needed later to verify the password.
        return $"PBKDF2${Iterations}${Convert.ToBase64String(salt)}${Convert.ToBase64String(hash)}";
    }

    public bool VerifyPassword(string password, string storedHash)
    {
        // Split the stored value back into:algorithm name, iteration count, salt, and stored hash.
        var parts = storedHash.Split('$');

        // If the stored format is invalid, reject the login attempt.
        if (parts.Length != 4 || parts[0] != "PBKDF2")
        {
            return false;
        }

        var iterations = int.Parse(parts[1]);
        var salt = Convert.FromBase64String(parts[2]);
        var expectedHash = Convert.FromBase64String(parts[3]);

        // Hash the password entered during login using the same salt and iteration count that were stored during registration.
        var actualHash = Rfc2898DeriveBytes.Pbkdf2(
            password,
            salt,
            iterations,
            HashAlgorithmName.SHA256,
            expectedHash.Length
        );

        // Compare hashes using a fixed-time comparison. This helps avoid timing attacks where an attacker guesses information based on how long the comparison takes.
        return CryptographicOperations.FixedTimeEquals(actualHash, expectedHash);
    }
}