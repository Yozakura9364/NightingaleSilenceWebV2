using System.Net;
using System.Text;
using NightingaleSilence.NSArmoire.Helper;

Console.OutputEncoding = Encoding.UTF8;

var options = HelperOptions.Parse(args);
using var snapshotService = new SnapshotService(new GameProcessLocator(), options.Pid);
var server = new LocalHttpServer(snapshotService, options.Port, options.AllowedOrigins);

Console.CancelKeyPress += (_, eventArgs) =>
{
    eventArgs.Cancel = true;
    server.Stop();
};

try
{
    server.Run();
}
catch (HttpListenerException error) when (error.ErrorCode == 32)
{
    Console.Error.WriteLine($"端口 {options.Port} 已被占用，请使用 --port 指定其他端口。");
}

internal sealed record HelperOptions(int Port, int? Pid, IReadOnlySet<string> AllowedOrigins)
{
    public static HelperOptions Parse(string[] args)
    {
        var port = 8015;
        int? pid = null;
        var allowedOrigins = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        for (var index = 0; index < args.Length; index++)
        {
            var current = args[index];
            var next = index + 1 < args.Length ? args[index + 1] : null;

            switch (current)
            {
                case "--port" when int.TryParse(next, out var parsedPort):
                    port = parsedPort;
                    index++;
                    break;
                case "--pid" when int.TryParse(next, out var parsedPid):
                    pid = parsedPid;
                    index++;
                    break;
                case "--allow-origin" when !string.IsNullOrWhiteSpace(next):
                    allowedOrigins.Add(next);
                    index++;
                    break;
            }
        }

        return new HelperOptions(port, pid, allowedOrigins);
    }
}
