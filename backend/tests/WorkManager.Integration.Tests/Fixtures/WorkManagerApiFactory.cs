using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;

namespace WorkManager.Integration.Tests.Fixtures;

/// <summary>
/// Hosts the API in-process against the dedicated <c>WorkManager_Test</c> database on the local SQL Server,
/// so integration tests never touch the developer's <c>WorkManager</c> database.
/// Override the connection with the <c>WORKMANAGER_TEST_CONNECTION</c> environment variable.
/// </summary>
public class WorkManagerApiFactory : WebApplicationFactory<Program>
{
    public const string DefaultConnectionString =
        "Server=localhost;Database=WorkManager_Test;Trusted_Connection=True;TrustServerCertificate=True;";

    public static string ConnectionString =>
        Environment.GetEnvironmentVariable("WORKMANAGER_TEST_CONNECTION") ?? DefaultConnectionString;

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.ConfigureAppConfiguration((_, config) =>
            config.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:DefaultConnection"] = ConnectionString,
            }));
    }
}
