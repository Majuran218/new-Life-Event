using System.Text;
using LifeEventsHub.Api.Data;
using LifeEventsHub.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using MySqlConnector;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

var jwtKey = builder.Configuration["Jwt:Key"] ?? "LifeEventsHubSecretKeyForJWT2026Min32Chars!!";
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "LifeEventsHub",
            ValidAudience = builder.Configuration["Jwt:Audience"] ?? "LifeEventsHub",
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    });
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "Life Events Hub API", Version = "v1" });
});

var connStr = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? "Server=localhost;Database=lifeeventshub;User=root;Password=root;";

// Create database if it doesn't exist (connect without database first)
var connBuilder = new MySqlConnectionStringBuilder(connStr);
var database = connBuilder.Database;
connBuilder.Database = "";
using (var conn = new MySqlConnection(connBuilder.ConnectionString))
{
    await conn.OpenAsync();
    using var cmd = conn.CreateCommand();
    cmd.CommandText = $"CREATE DATABASE IF NOT EXISTS `{database}`";
    await cmd.ExecuteNonQueryAsync();
}

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseMySql(connStr, new MySqlServerVersion(new Version(8, 0, 21))));

builder.Services.AddScoped<FileStorageService>();
builder.Services.AddScoped<JwtService>();
builder.Services.AddSingleton<PricingService>();
builder.Services.AddSingleton<StripeService>();
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins("http://localhost:4200")
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

app.UseStaticFiles();
app.UseCors();
app.UseAuthentication();
app.UseAuthorization();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.MapControllers();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await db.Database.EnsureCreatedAsync();

    // Seed test user - always ensure it exists (for flow testing)
    var testEmail = "test@example.com";
    var testUser = await db.Users.FirstOrDefaultAsync(u => u.Email == testEmail);
    if (testUser == null)
    {
        testUser = new LifeEventsHub.Api.Models.User
        {
            Email = testEmail,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("password123"),
            DisplayName = "Test User",
            ProfileVisibility = "Public",
            CreatedAt = DateTime.UtcNow
        };
        db.Users.Add(testUser);
        await db.SaveChangesAsync();
    }

}

app.Run();
