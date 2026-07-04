namespace NightingaleSilence.NSArmoire.Helper;

internal sealed class SnapshotService : IDisposable
{
    private readonly object syncRoot = new();
    private DresserMemoryReader? reader;
    private readonly GameProcessLocator processLocator;
    private int? selectedPid;
    private bool gameProcessFound;
    private string status = "idle";
    private string statusMessage = "本地助手已启动";

    public SnapshotService(GameProcessLocator processLocator, int? initialPid)
    {
        this.processLocator = processLocator;
        selectedPid = initialPid;
    }

    public HelperHealth GetHealth()
    {
        lock (syncRoot)
        {
            EnsureReader();
            return BuildHealth();
        }
    }

    public GameProcessList GetProcesses()
    {
        lock (syncRoot)
        {
            return new GameProcessList(processLocator.ListProcesses(selectedPid));
        }
    }

    public HelperHealth SelectProcess(int pid)
    {
        lock (syncRoot)
        {
            var selection = processLocator.Locate(pid);
            if (selection.Process is null)
            {
                throw new HelperRequestException(
                    selection.Status,
                    selection.StatusMessage,
                    selection.Status == "game_process_not_found" ? 404 : 409);
            }

            selectedPid = pid;
            ResetReader();
            gameProcessFound = true;
            AttachReader(selection.Process);

            return BuildHealth();
        }
    }

    public ArmoireSnapshot GetSnapshot()
    {
        lock (syncRoot)
        {
            EnsureReader();

            if (reader is null)
            {
                throw new HelperRequestException(status, statusMessage, 503);
            }

            var dresserItems = reader.ReadItems();
            if (!reader.Loaded)
            {
                status = "dresser_not_loaded";
                statusMessage = "投影台数据尚未载入，请先在游戏中打开或刷新投影台";
                throw new HelperRequestException(status, statusMessage, 409);
            }

            status = "ready";
            statusMessage = "投影台数据已读取";

            var items = dresserItems
                .Select(item => new ArmoireOwnedItem(
                    ItemId: item.ItemId,
                    Hq: item.Hq,
                    Quantity: null,
                    Dyes: new[] { item.Dye1Id, item.Dye2Id },
                    Container: "glamourDresser",
                    ContainerName: null,
                    SlotIndex: item.SlotIndex))
                .ToArray();

            return new ArmoireSnapshot(
                SchemaVersion: ArmoireContracts.SnapshotSchemaVersion,
                Source: "local-helper",
                GeneratedAt: DateTimeOffset.UtcNow.ToString("O"),
                Items: items);
        }
    }

    public void Dispose()
    {
        lock (syncRoot)
        {
            ResetReader();
        }
    }

    private void EnsureReader()
    {
        if (reader is not null)
        {
            return;
        }

        var selection = processLocator.Locate(selectedPid);
        gameProcessFound = selection.Status != "game_process_not_found";
        if (selection.Process is null)
        {
            status = selection.Status;
            statusMessage = selection.StatusMessage;
            return;
        }

        selectedPid = selection.Process.Id;
        AttachReader(selection.Process);
    }

    private void AttachReader(ProcessSnapshot process)
    {
        try
        {
            reader = new DresserMemoryReader(process);
            status = "ready";
            statusMessage = "投影台读取器已就绪";
        }
        catch (NotSupportedException)
        {
            status = "dresser_signature_not_found";
            statusMessage = "当前游戏版本暂时无法定位投影台数据";
        }
        catch
        {
            status = "dresser_unreadable";
            statusMessage = "读取投影台数据失败";
        }
    }

    private void ResetReader()
    {
        reader?.Dispose();
        reader = null;
    }

    private HelperHealth BuildHealth()
    {
        var processes = processLocator.ListProcesses(selectedPid);

        return new HelperHealth(
            Ok: true,
            HelperVersion: ArmoireContracts.HelperVersion,
            Status: status,
            StatusMessage: statusMessage,
            GameProcessFound: gameProcessFound,
            DresserLocated: reader is not null,
            DresserLoaded: reader?.Loaded ?? false,
            SupportedContainers: new[] { "glamourDresser" },
            SelectedPid: selectedPid,
            GameProcessCount: processes.Count);
    }
}

internal sealed class HelperRequestException : Exception
{
    public HelperRequestException(string code, string message, int statusCode)
        : base(message)
    {
        Code = code;
        StatusCode = statusCode;
    }

    public string Code { get; }
    public int StatusCode { get; }
}
