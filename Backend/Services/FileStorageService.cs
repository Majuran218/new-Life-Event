namespace LifeEventsHub.Api.Services;

public class FileStorageService
{
    private readonly IWebHostEnvironment _env;
    private readonly string _uploadFolder = "uploads";
    private readonly string[] _allowedExtensions = { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
    private const int MaxFileSize = 5 * 1024 * 1024; // 5MB

    public FileStorageService(IWebHostEnvironment env) => _env = env;

    public async Task<string?> SaveFileAsync(IFormFile file)
    {
        if (file == null || file.Length == 0 || file.Length > MaxFileSize)
            return null;

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!_allowedExtensions.Contains(ext))
            return null;

        var folder = Path.Combine(_env.WebRootPath ?? Path.Combine(_env.ContentRootPath, "wwwroot"), _uploadFolder, DateTime.UtcNow.ToString("yyyyMM"));
        Directory.CreateDirectory(folder);

        var fileName = $"{Guid.NewGuid()}{ext}";
        var filePath = Path.Combine(folder, fileName);

        await using var stream = new FileStream(filePath, FileMode.Create);
        await file.CopyToAsync(stream);

        return $"/uploads/{DateTime.UtcNow:yyyyMM}/{fileName}";
    }

    public string GetBaseUrl(HttpRequest request)
    {
        return $"{request.Scheme}://{request.Host}";
    }
}
