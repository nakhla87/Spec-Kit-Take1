using System.Net;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;

namespace WorkManager.Api.Tests;

public class PipelineTests(WebApplicationFactory<Program> factory) : IClassFixture<WebApplicationFactory<Program>>
{
    private const string FrontendOrigin = "http://localhost:5173";

    [Fact]
    public async Task Cors_preflight_from_frontend_origin_is_allowed()
    {
        var client = factory.CreateClient();
        using var request = new HttpRequestMessage(HttpMethod.Options, "/api/work-items");
        request.Headers.Add("Origin", FrontendOrigin);
        request.Headers.Add("Access-Control-Request-Method", "PUT");
        request.Headers.Add("Access-Control-Request-Headers", "content-type");

        var response = await client.SendAsync(request);

        response.StatusCode.Should().Be(HttpStatusCode.NoContent);
        response.Headers.GetValues("Access-Control-Allow-Origin").Should().ContainSingle().Which.Should().Be(FrontendOrigin);
    }

    [Fact]
    public async Task Cors_preflight_from_other_origin_is_not_allowed()
    {
        var client = factory.CreateClient();
        using var request = new HttpRequestMessage(HttpMethod.Options, "/api/work-items");
        request.Headers.Add("Origin", "http://evil.example");
        request.Headers.Add("Access-Control-Request-Method", "GET");

        var response = await client.SendAsync(request);

        response.Headers.Contains("Access-Control-Allow-Origin").Should().BeFalse();
    }

    [Fact]
    public async Task Unknown_route_returns_problem_details()
    {
        var client = factory.CreateClient();

        var response = await client.GetAsync("/api/does-not-exist");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
        response.Content.Headers.ContentType?.MediaType.Should().Be("application/problem+json");
    }
}
