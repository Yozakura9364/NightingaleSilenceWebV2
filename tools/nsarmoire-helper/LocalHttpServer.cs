using System.Net;
using System.Text;
using System.Text.Json;
using System.Diagnostics;
using System.Text.Json.Serialization;

namespace NightingaleSilence.NSArmoire.Helper;

internal sealed class LocalHttpServer
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = false,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
    };

    private readonly HttpListener listener = new();
    private readonly SnapshotService snapshotService;
    private readonly int port;
    private readonly IReadOnlySet<string> additionalAllowedOrigins;
    private readonly Uri webUrl;

    public LocalHttpServer(
        SnapshotService snapshotService,
        int port,
        IReadOnlySet<string> additionalAllowedOrigins,
        Uri webUrl)
    {
        this.snapshotService = snapshotService;
        this.port = port;
        this.additionalAllowedOrigins = additionalAllowedOrigins;
        this.webUrl = webUrl;
    }

    public void Run()
    {
        var prefix = $"http://127.0.0.1:{port}/";
        listener.Prefixes.Add(prefix);
        listener.Start();

        Console.WriteLine($"NSArmoire helper listening on {prefix}");
        Console.WriteLine("Press Ctrl+C to stop.");

        while (listener.IsListening)
        {
            HttpListenerContext context;
            try
            {
                context = listener.GetContext();
            }
            catch (HttpListenerException error) when (!listener.IsListening || error.ErrorCode == 995)
            {
                break;
            }

            _ = Task.Run(() => HandleRequest(context));
        }
    }

    public void Stop()
    {
        listener.Stop();
        listener.Close();
    }

    private async Task HandleRequest(HttpListenerContext context)
    {
        try
        {
            AddCorsHeaders(context);

            if (context.Request.HttpMethod == "OPTIONS")
            {
                context.Response.StatusCode = 204;
                return;
            }

            var path = context.Request.Url?.AbsolutePath ?? "/";
            switch (path)
            {
                case "/":
                    await WriteText(
                        context,
                        $"NSArmoire local helper\nV2 page: {webUrl}\nOpen with: /open-v2");
                    break;
                case "/open-v2" when context.Request.HttpMethod == "GET":
                    OpenWebPage();
                    await WriteJson(context, new OpenV2Result(webUrl.ToString()));
                    break;
                case "/health":
                    await WriteJson(context, snapshotService.GetHealth());
                    break;
                case "/processes" when context.Request.HttpMethod == "GET":
                    await WriteJson(context, snapshotService.GetProcesses());
                    break;
                case "/process/select" when context.Request.HttpMethod == "POST":
                    var request = await ReadJsonBody<ProcessSelectRequest>(context);
                    if (request is null || request.Pid <= 0)
                    {
                        throw new HelperRequestException("invalid_request", "请选择有效的游戏进程", 400);
                    }

                    await WriteJson(context, snapshotService.SelectProcess(request.Pid));
                    break;
                case "/snapshot" when context.Request.HttpMethod is "GET" or "POST":
                case "/snapshot/refresh" when context.Request.HttpMethod == "POST":
                    await WriteJson(context, snapshotService.GetSnapshot());
                    break;
                default:
                    await WriteJson(
                        context,
                        new HelperError("not_found", "接口不存在"),
                        statusCode: 404);
                    break;
            }
        }
        catch (HelperRequestException error)
        {
            await WriteJson(
                context,
                new HelperError(error.Code, error.Message),
                statusCode: error.StatusCode);
        }
        catch
        {
            await WriteJson(
                context,
                new HelperError("internal_error", "本地助手处理请求失败"),
                statusCode: 500);
        }
        finally
        {
            context.Response.Close();
        }
    }

    private void OpenWebPage()
    {
        try
        {
            Process.Start(new ProcessStartInfo
            {
                FileName = webUrl.ToString(),
                UseShellExecute = true
            });
        }
        catch
        {
            throw new HelperRequestException("open_v2_failed", "打开 V2 页面失败", 500);
        }
    }

    private void AddCorsHeaders(HttpListenerContext context)
    {
        var origin = context.Request.Headers["Origin"];
        if (!string.IsNullOrWhiteSpace(origin) && IsAllowedOrigin(origin))
        {
            context.Response.Headers["Access-Control-Allow-Origin"] = origin;
            context.Response.Headers["Vary"] = "Origin";
        }

        context.Response.Headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS";
        context.Response.Headers["Access-Control-Allow-Headers"] = "Content-Type";

        if (context.Request.Headers["Access-Control-Request-Private-Network"] == "true")
        {
            context.Response.Headers["Access-Control-Allow-Private-Network"] = "true";
        }
    }

    private static async Task<T?> ReadJsonBody<T>(HttpListenerContext context)
    {
        if (!context.Request.HasEntityBody)
        {
            return default;
        }

        using var reader = new StreamReader(
            context.Request.InputStream,
            context.Request.ContentEncoding ?? Encoding.UTF8);
        var body = await reader.ReadToEndAsync();

        if (body.Length > 4096)
        {
            throw new HelperRequestException("request_too_large", "请求内容过大", 413);
        }

        try
        {
            return JsonSerializer.Deserialize<T>(body, JsonOptions);
        }
        catch (JsonException)
        {
            throw new HelperRequestException("invalid_json", "请求 JSON 无法解析", 400);
        }
    }

    private bool IsAllowedOrigin(string origin)
    {
        if (additionalAllowedOrigins.Contains(origin))
        {
            return true;
        }

        return Uri.TryCreate(origin, UriKind.Absolute, out var uri)
            && uri.Host is "localhost" or "127.0.0.1" or "::1";
    }

    private static async Task WriteText(HttpListenerContext context, string text, int statusCode = 200)
    {
        var bytes = Encoding.UTF8.GetBytes(text);
        context.Response.StatusCode = statusCode;
        context.Response.ContentType = "text/plain; charset=utf-8";
        context.Response.ContentLength64 = bytes.Length;
        await context.Response.OutputStream.WriteAsync(bytes);
    }

    private static async Task WriteJson(HttpListenerContext context, object payload, int statusCode = 200)
    {
        var bytes = JsonSerializer.SerializeToUtf8Bytes(payload, JsonOptions);
        context.Response.StatusCode = statusCode;
        context.Response.ContentType = "application/json; charset=utf-8";
        context.Response.ContentLength64 = bytes.Length;
        context.Response.Headers["Cache-Control"] = "no-store";
        await context.Response.OutputStream.WriteAsync(bytes);
    }
}
