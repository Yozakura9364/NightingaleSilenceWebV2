namespace NightingaleSilence.NSArmoire.Helper;

internal sealed class SnapshotService : IDisposable
{
    private readonly object syncRoot = new();
    private DresserMemoryReader? reader;
    private CharacterMemoryReader? characterReader;
    private InventoryMemoryReader? inventoryReader;
    private RetainerMemoryReader? retainerReader;
    private CabinetMemoryReader? cabinetReader;
    private readonly RetainerInventoryCache retainerInventoryCache = new();
    private readonly ArmoireCatalogLookup catalogLookup = ArmoireCatalogLookup.LoadDefault();
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

    public byte[] GetCatalogJson()
    {
        lock (syncRoot)
        {
            return catalogLookup.ReadCatalogJson();
        }
    }

    public HelperProbe GetProbe()
    {
        lock (syncRoot)
        {
            EnsureReader();
            var inventoryResult = SafeReadInventory();
            var retainerResult = SafeReadRetainers();
            var cabinetResult = SafeReadCabinet();
            var characterResult = SafeReadCharacter();
            retainerInventoryCache.UpdateFromCurrentRetainer(inventoryResult, retainerResult);
            return BuildProbe(characterResult, inventoryResult, retainerResult, cabinetResult);
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

            if (reader is null && inventoryReader is null)
            {
                throw new HelperRequestException(status, statusMessage, 503);
            }

            var items = new List<ArmoireOwnedItem>();
            var characterResult = SafeReadCharacter();
            var inventoryResult = SafeReadInventory();
            var retainerResult = SafeReadRetainers();
            var cabinetResult = SafeReadCabinet();
            retainerInventoryCache.UpdateFromCurrentRetainer(inventoryResult, retainerResult);

            if (cabinetResult is { Loaded: true, Status: "ready" })
            {
                items.AddRange(catalogLookup.ResolveCabinetItems(cabinetResult.CabinetIds)
                    .Select(item => new ArmoireOwnedItem(
                        ItemId: item.ItemId,
                        Hq: false,
                        Quantity: null,
                        Dyes: null,
                        Container: "armoire",
                        ContainerName: "收藏柜",
                        SlotIndex: checked((int)item.CabinetId),
                        InventoryType: 2500,
                        CabinetId: item.CabinetId)));
            }

            if (inventoryResult is not null)
            {
                items.AddRange(inventoryResult.Containers
                    .SelectMany(container => container.Items)
                    .Where(item => item.Container != "retainer")
                    .Select(item => ToOwnedItem(item)));
            }

            items.AddRange(retainerInventoryCache.Entries
                .SelectMany(entry => entry.Items.Select(item => ToOwnedItem(
                    item,
                    retainerId: entry.RetainerId.ToString(),
                    retainerName: entry.RetainerName))));

            var dresserLoaded = false;
            if (reader is not null)
            {
                var dresserItems = reader.ReadItems();
                dresserLoaded = reader.Loaded;
                if (dresserLoaded)
                {
                    items.AddRange(dresserItems
                        .Select(item => new ArmoireOwnedItem(
                            ItemId: item.ItemId,
                            Hq: item.Hq,
                            Quantity: null,
                            Dyes: new[] { item.Dye1Id, item.Dye2Id },
                            Container: "glamourDresser",
                            ContainerName: null,
                            SlotIndex: item.SlotIndex)));
                }
            }

            if (items.Count == 0 && reader is not null && !dresserLoaded)
            {
                status = "dresser_not_loaded";
                statusMessage = "投影台数据尚未载入，请先在游戏中打开或刷新投影台";
                throw new HelperRequestException(status, statusMessage, 409);
            }

            status = "ready";
            statusMessage = inventoryResult is null
                ? "投影台数据已读取"
                : "背包探针数据已读取";

            return new ArmoireSnapshot(
                SchemaVersion: ArmoireContracts.SnapshotSchemaVersion,
                Source: "local-helper",
                GeneratedAt: DateTimeOffset.UtcNow.ToString("O"),
                Character: ToCharacter(characterResult),
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

        try
        {
            characterReader = new CharacterMemoryReader(process);
        }
        catch
        {
            characterReader = null;
        }

        try
        {
            inventoryReader = new InventoryMemoryReader(process);
        }
        catch
        {
            inventoryReader = null;
        }

        try
        {
            retainerReader = new RetainerMemoryReader(process);
        }
        catch
        {
            retainerReader = null;
        }

        try
        {
            cabinetReader = new CabinetMemoryReader(process);
        }
        catch
        {
            cabinetReader = null;
        }
    }

    private void ResetReader()
    {
        reader?.Dispose();
        reader = null;
        characterReader?.Dispose();
        characterReader = null;
        inventoryReader?.Dispose();
        inventoryReader = null;
        retainerReader?.Dispose();
        retainerReader = null;
        cabinetReader?.Dispose();
        cabinetReader = null;
        retainerInventoryCache.Clear();
    }

    private HelperHealth BuildHealth()
    {
        var processes = processLocator.ListProcesses(selectedPid);
        var characterResult = SafeReadCharacter();

        return new HelperHealth(
            Ok: true,
            HelperVersion: ArmoireContracts.HelperVersion,
            Status: status,
            StatusMessage: statusMessage,
            GameProcessFound: gameProcessFound,
            CharacterLocated: characterReader is not null,
            CharacterLoaded: characterResult?.Loaded ?? false,
            CharacterName: characterResult?.Name,
            CharacterWorldId: characterResult?.WorldId,
            CharacterWorld: characterResult?.WorldName,
            DresserLocated: reader is not null,
            DresserLoaded: reader?.Loaded ?? false,
            CatalogLocated: catalogLookup.HasSource,
            CatalogCabinetEntryCount: catalogLookup.CabinetEntryCount,
            CabinetLocated: cabinetReader is not null,
            CabinetLoaded: SafeReadCabinet()?.Loaded ?? false,
            InventoryLocated: inventoryReader is not null,
            RetainerManagerLocated: retainerReader is not null,
            CachedRetainerCount: retainerInventoryCache.Count,
            SupportedContainers: BuildSupportedContainers(),
            SelectedPid: selectedPid,
            GameProcessCount: processes.Count);
    }

    private HelperProbe BuildProbe(
        CharacterReadResult? characterResult,
        InventoryReadResult? inventoryResult,
        RetainerReadResult? retainerResult,
        CabinetReadResult? cabinetResult)
    {
        var character = characterResult is null
            ? new CharacterProbeResult(
                Located: characterReader is not null,
                Loaded: false,
                Name: null,
                WorldId: null,
                WorldName: null,
                Status: characterReader is null ? "not_found" : "unreadable")
            : new CharacterProbeResult(
                Located: characterResult.Located,
                Loaded: characterResult.Loaded,
                Name: characterResult.Name,
                WorldId: characterResult.WorldId,
                WorldName: characterResult.WorldName,
                Status: characterResult.Status);

        var cabinet = cabinetResult is null
            ? new CabinetProbeResult(
                Located: false,
                Loaded: false,
                State: null,
                ByteCount: null,
                UnlockedBitCount: 0,
                CatalogLocated: catalogLookup.IsLoaded,
                MappedItemCount: 0,
                Status: cabinetReader is null ? "not_found" : "unreadable")
            : new CabinetProbeResult(
                Located: cabinetResult.Located,
                Loaded: cabinetResult.Loaded,
                State: cabinetResult.State,
                ByteCount: cabinetResult.ByteCount,
                UnlockedBitCount: cabinetResult.UnlockedBitCount,
                CatalogLocated: catalogLookup.IsLoaded,
                MappedItemCount: cabinetResult.Loaded
                    ? catalogLookup.ResolveCabinetItems(cabinetResult.CabinetIds).Count
                    : 0,
                Status: cabinetResult.Status);

        var containers = new List<ContainerProbeResult>
        {
            new(
                Key: "glamourDresser",
                Container: "glamourDresser",
                ContainerName: "投影台",
                InventoryType: null,
                Located: reader is not null,
                Loaded: reader?.Loaded ?? false,
                Size: 800,
                ItemCount: 0,
                Status: reader is null ? "not_found" : ((reader?.Loaded ?? false) ? "ready" : "not_loaded"))
        };

        if (inventoryResult is not null)
        {
            containers.AddRange(inventoryResult.Containers.Select(container => new ContainerProbeResult(
                Key: $"{container.Container}:{container.InventoryType}",
                Container: container.Container,
                ContainerName: container.ContainerName,
                InventoryType: container.InventoryType,
                Located: container.Located,
                Loaded: container.Loaded,
                Size: container.Size,
                ItemCount: container.ItemCount,
                Status: container.Status)));
        }

        var retainers = retainerResult?.Retainers
            .Select(retainer =>
            {
                var cacheEntry = retainerInventoryCache.Get(retainer.RetainerId);
                return new RetainerProbeResult(
                    Slot: retainer.Slot,
                    RetainerId: retainer.RetainerId,
                    Name: retainer.Name,
                    JobId: retainer.JobId,
                    Level: retainer.Level,
                    ItemCount: retainer.ItemCount,
                    MarketItemCount: retainer.MarketItemCount,
                    Available: retainer.Available,
                    VentureId: retainer.VentureId,
                    VentureComplete: retainer.VentureComplete,
                    IsActive: retainer.IsActive,
                    InventoryCached: cacheEntry is not null,
                    CachedItemCount: cacheEntry?.Items.Count ?? 0,
                    CachedAt: cacheEntry?.UpdatedAt.ToString("O"));
            })
            .ToArray() ?? Array.Empty<RetainerProbeResult>();

        var retainerCaches = retainerInventoryCache.Entries
            .Select(entry => new RetainerCacheProbeResult(
                RetainerId: entry.RetainerId.ToString(),
                RetainerName: entry.RetainerName,
                ItemCount: entry.Items.Count,
                UpdatedAt: entry.UpdatedAt.ToString("O")))
            .ToArray();

        return new HelperProbe(
            Ok: true,
            HelperVersion: ArmoireContracts.HelperVersion,
            GameProcessFound: gameProcessFound,
            SelectedPid: selectedPid,
            Character: character,
            DresserLocated: reader is not null,
            DresserLoaded: reader?.Loaded ?? false,
            Cabinet: cabinet,
            InventoryLocated: inventoryReader is not null,
            RetainerManagerLocated: retainerReader is not null,
            InventoryContainerTableLocated: inventoryResult?.ContainerTableLocated ?? false,
            Retainers: retainers,
            RetainerCaches: retainerCaches,
            Containers: containers);
    }

    private InventoryReadResult? SafeReadInventory()
    {
        if (inventoryReader is null)
        {
            return null;
        }

        try
        {
            return inventoryReader.Read();
        }
        catch
        {
            return null;
        }
    }

    private CharacterReadResult? SafeReadCharacter()
    {
        if (characterReader is null)
        {
            return null;
        }

        try
        {
            return characterReader.Read();
        }
        catch
        {
            return null;
        }
    }

    private RetainerReadResult? SafeReadRetainers()
    {
        if (retainerReader is null)
        {
            return null;
        }

        try
        {
            return retainerReader.Read();
        }
        catch
        {
            return null;
        }
    }

    private CabinetReadResult? SafeReadCabinet()
    {
        if (cabinetReader is null)
        {
            return null;
        }

        try
        {
            return cabinetReader.Read();
        }
        catch
        {
            return null;
        }
    }

    private string[] BuildSupportedContainers()
    {
        var containers = new List<string> { "glamourDresser" };
        if (cabinetReader is not null && catalogLookup.IsLoaded)
        {
            containers.Add("armoire");
        }

        if (inventoryReader is null)
        {
            return containers.ToArray();
        }

        containers.AddRange(new[] { "inventory", "armoury", "saddlebag", "retainer" });
        return containers.ToArray();
    }

    private static ArmoireOwnedItem ToOwnedItem(
        InventoryItemRecord item,
        string? retainerId = null,
        string? retainerName = null)
    {
        return new ArmoireOwnedItem(
            ItemId: item.ItemId,
            Hq: item.Hq,
            Quantity: item.Quantity,
            Dyes: item.Dyes,
            Container: item.Container,
            ContainerName: item.ContainerName,
            SlotIndex: item.SlotIndex,
            InventoryType: item.InventoryType,
            RetainerId: retainerId,
            RetainerName: retainerName);
    }

    private static ArmoireCharacter? ToCharacter(CharacterReadResult? result)
    {
        if (result is not { Loaded: true })
        {
            return null;
        }

        var name = string.IsNullOrWhiteSpace(result.Name) ? null : result.Name;
        var world = string.IsNullOrWhiteSpace(result.WorldName) ? null : result.WorldName;
        if (name is null && world is null)
        {
            return null;
        }

        return new ArmoireCharacter(
            Id: null,
            Name: name,
            World: world,
            DataCenter: null);
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
