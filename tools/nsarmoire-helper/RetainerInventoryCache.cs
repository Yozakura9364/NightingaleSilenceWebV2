namespace NightingaleSilence.NSArmoire.Helper;

internal sealed class RetainerInventoryCache
{
    private static readonly uint[] InternalBagTypes =
    {
        10000, 10001, 10002, 10003, 10004, 10005, 10006
    };

    private readonly Dictionary<ulong, RetainerInventoryCacheEntry> entries = new();

    public IReadOnlyList<RetainerInventoryCacheEntry> Entries => entries.Values
        .OrderBy(entry => entry.RetainerName, StringComparer.OrdinalIgnoreCase)
        .ThenBy(entry => entry.RetainerId)
        .ToArray();

    public int Count => entries.Count;

    public RetainerInventoryCacheEntry? Get(ulong retainerId)
    {
        return entries.TryGetValue(retainerId, out var entry) ? entry : null;
    }

    public void Clear()
    {
        entries.Clear();
    }

    public void UpdateFromCurrentRetainer(
        InventoryReadResult? inventoryResult,
        RetainerReadResult? retainerResult)
    {
        if (inventoryResult is null || retainerResult is null || retainerResult.LastSelectedRetainerId == 0)
        {
            return;
        }

        var retainer = retainerResult.Retainers
            .FirstOrDefault(item => item.RetainerId == retainerResult.LastSelectedRetainerId);
        if (retainer is null)
        {
            return;
        }

        var containersByType = inventoryResult.Containers.ToDictionary(container => container.InventoryType);
        var bagContainers = InternalBagTypes
            .Select(type => containersByType.TryGetValue(type, out var container) ? container : null)
            .ToArray();

        if (bagContainers.Any(container => container is null || !container.Loaded || container.Status != "ready"))
        {
            return;
        }

        var items = new List<InventoryItemRecord>();
        for (var internalBagIndex = 0; internalBagIndex < bagContainers.Length; internalBagIndex++)
        {
            var bag = bagContainers[internalBagIndex]!;
            foreach (var item in bag.Items)
            {
                var absoluteIndex = internalBagIndex * 25 + item.SlotIndex;
                if (absoluteIndex is < 0 or >= 175)
                {
                    continue;
                }

                var uiBagIndex = absoluteIndex / 35;
                var uiSlotIndex = absoluteIndex % 35;
                items.Add(item with
                {
                    Container = "retainer",
                    ContainerName = $"{retainer.Name} 背包 {uiBagIndex + 1}",
                    SlotIndex = uiSlotIndex
                });
            }
        }

        AddContainerItems(containersByType, 11000, $"{retainer.Name} 已装备", items);
        AddContainerItems(containersByType, 12002, $"{retainer.Name} 市场", items);

        entries[retainer.RetainerId] = new RetainerInventoryCacheEntry(
            RetainerId: retainer.RetainerId,
            RetainerName: retainer.Name,
            UpdatedAt: DateTimeOffset.UtcNow,
            Items: items
                .OrderBy(item => item.InventoryType)
                .ThenBy(item => item.SlotIndex)
                .ToArray());
    }

    private static void AddContainerItems(
        IReadOnlyDictionary<uint, InventoryContainerReadResult> containersByType,
        uint inventoryType,
        string containerName,
        List<InventoryItemRecord> items)
    {
        if (!containersByType.TryGetValue(inventoryType, out var container)
            || !container.Loaded
            || container.Status != "ready")
        {
            return;
        }

        items.AddRange(container.Items.Select(item => item with
        {
            Container = "retainer",
            ContainerName = containerName
        }));
    }
}

internal sealed record RetainerInventoryCacheEntry(
    ulong RetainerId,
    string RetainerName,
    DateTimeOffset UpdatedAt,
    IReadOnlyList<InventoryItemRecord> Items);
