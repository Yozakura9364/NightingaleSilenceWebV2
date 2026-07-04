using System.Runtime.InteropServices;

namespace NightingaleSilence.NSArmoire.Helper;

internal sealed class InventoryMemoryReader : IDisposable
{
    private static readonly byte?[] InventoryManagerSignature =
    {
        0x48, 0x8D, 0x0D, null, null, null, null, 0x81, 0xC2
    };

    private const int InventoryManagerInventoriesOffset = 7688;
    private const int InventoryContainerSize = 32;
    private const int InventoryItemSize = 72;
    private const int MaxContainerScanCount = 512;
    private const int MaxContainerSize = 1000;

    private static readonly InventoryContainerTarget[] Targets =
    {
        new(0, "inventory", "背包 1"),
        new(1, "inventory", "背包 2"),
        new(2, "inventory", "背包 3"),
        new(3, "inventory", "背包 4"),
        new(1000, "armoury", "已装备"),
        new(3200, "armoury", "兵装库：副手"),
        new(3201, "armoury", "兵装库：头部"),
        new(3202, "armoury", "兵装库：身体"),
        new(3203, "armoury", "兵装库：手部"),
        new(3204, "armoury", "兵装库：腰部"),
        new(3205, "armoury", "兵装库：腿部"),
        new(3206, "armoury", "兵装库：脚部"),
        new(3207, "armoury", "兵装库：耳饰"),
        new(3208, "armoury", "兵装库：项链"),
        new(3209, "armoury", "兵装库：手镯"),
        new(3300, "armoury", "兵装库：戒指"),
        new(3400, "armoury", "兵装库：灵魂水晶"),
        new(3500, "armoury", "兵装库：主手"),
        new(4000, "saddlebag", "陆行鸟鞍囊 1"),
        new(4001, "saddlebag", "陆行鸟鞍囊 2"),
        new(4100, "saddlebag", "付费陆行鸟鞍囊 1"),
        new(4101, "saddlebag", "付费陆行鸟鞍囊 2"),
        new(10000, "retainer", "雇员内部块 1"),
        new(10001, "retainer", "雇员内部块 2"),
        new(10002, "retainer", "雇员内部块 3"),
        new(10003, "retainer", "雇员内部块 4"),
        new(10004, "retainer", "雇员内部块 5"),
        new(10005, "retainer", "雇员内部块 6"),
        new(10006, "retainer", "雇员内部块 7"),
        new(11000, "retainer", "雇员已装备"),
        new(12002, "retainer", "雇员市场"),
    };

    private static readonly IReadOnlyDictionary<uint, InventoryContainerTarget> TargetsByType =
        Targets.ToDictionary(target => target.InventoryType);

    private readonly IntPtr processHandle;
    private readonly IntPtr inventoryManagerAddress;

    public InventoryMemoryReader(ProcessSnapshot process)
    {
        processHandle = WinApi.OpenProcess(WinApi.ProcessVmRead, false, (uint)process.Id);
        if (processHandle == IntPtr.Zero)
        {
            throw new InvalidOperationException("访问游戏进程失败");
        }

        inventoryManagerAddress = LocateInventoryManager(process.MainModuleBaseAddress);
        if (inventoryManagerAddress == IntPtr.Zero)
        {
            throw new NotSupportedException("定位背包管理器失败");
        }
    }

    public InventoryReadResult Read()
    {
        var tableAddress = ReadPointer(IntPtr.Add(inventoryManagerAddress, InventoryManagerInventoriesOffset));
        if (tableAddress == IntPtr.Zero)
        {
            return new InventoryReadResult(
                ManagerLocated: true,
                ContainerTableLocated: false,
                Containers: BuildMissingContainers("container_table_not_found"));
        }

        var containers = ScanContainers(tableAddress);
        return new InventoryReadResult(
            ManagerLocated: true,
            ContainerTableLocated: true,
            Containers: containers);
    }

    public void Dispose()
    {
        if (processHandle != IntPtr.Zero)
        {
            WinApi.CloseHandle(processHandle);
        }
    }

    private IReadOnlyList<InventoryContainerReadResult> ScanContainers(IntPtr tableAddress)
    {
        var resultsByType = new Dictionary<uint, InventoryContainerReadResult>();
        var containerBuffer = new byte[InventoryContainerSize];

        for (var index = 0; index < MaxContainerScanCount; index++)
        {
            var containerAddress = IntPtr.Add(tableAddress, index * InventoryContainerSize);
            if (!WinApi.ReadProcessMemory(
                    processHandle,
                    containerAddress,
                    containerBuffer,
                    containerBuffer.Length,
                    IntPtr.Zero))
            {
                break;
            }

            var type = BitConverter.ToUInt32(containerBuffer, 16);
            if (!TargetsByType.TryGetValue(type, out var target))
            {
                continue;
            }

            var itemAddress = (IntPtr)(long)BitConverter.ToUInt64(containerBuffer, 8);
            var size = BitConverter.ToInt32(containerBuffer, 20);
            var loaded = containerBuffer[24] != 0;
            var status = "ready";
            IReadOnlyList<InventoryItemRecord> items = Array.Empty<InventoryItemRecord>();

            if (size <= 0 || size > MaxContainerSize)
            {
                status = "invalid_size";
                loaded = false;
            }
            else if (itemAddress == IntPtr.Zero)
            {
                status = "items_not_found";
                loaded = false;
            }
            else if (!loaded)
            {
                status = "not_loaded";
            }
            else
            {
                items = ReadItems(target, itemAddress, size);
            }

            var result = new InventoryContainerReadResult(
                InventoryType: type,
                Container: target.Container,
                ContainerName: target.ContainerName,
                Located: true,
                Loaded: loaded,
                Size: size is > 0 and <= MaxContainerSize ? size : null,
                ItemCount: items.Count,
                Status: status,
                Items: items);

            if (!resultsByType.TryGetValue(type, out var existing) || ShouldReplaceContainer(existing, result))
            {
                resultsByType[type] = result;
            }
        }

        return Targets
            .Select(target => resultsByType.TryGetValue(target.InventoryType, out var result)
                ? result
                : new InventoryContainerReadResult(
                    InventoryType: target.InventoryType,
                    Container: target.Container,
                    ContainerName: target.ContainerName,
                    Located: false,
                    Loaded: false,
                    Size: null,
                    ItemCount: 0,
                    Status: "not_found",
                    Items: Array.Empty<InventoryItemRecord>()))
            .ToArray();
    }

    private static bool ShouldReplaceContainer(
        InventoryContainerReadResult existing,
        InventoryContainerReadResult candidate)
    {
        if (existing.Status == "ready" && candidate.Status != "ready")
        {
            return false;
        }

        if (candidate.Status == "ready" && existing.Status != "ready")
        {
            return true;
        }

        if (candidate.Loaded != existing.Loaded)
        {
            return candidate.Loaded;
        }

        return candidate.ItemCount > existing.ItemCount;
    }

    private static IReadOnlyList<InventoryContainerReadResult> BuildMissingContainers(string status)
    {
        return Targets
            .Select(target => new InventoryContainerReadResult(
                InventoryType: target.InventoryType,
                Container: target.Container,
                ContainerName: target.ContainerName,
                Located: false,
                Loaded: false,
                Size: null,
                ItemCount: 0,
                Status: status,
                Items: Array.Empty<InventoryItemRecord>()))
            .ToArray();
    }

    private IReadOnlyList<InventoryItemRecord> ReadItems(
        InventoryContainerTarget target,
        IntPtr itemAddress,
        int size)
    {
        var buffer = new byte[size * InventoryItemSize];
        if (!WinApi.ReadProcessMemory(processHandle, itemAddress, buffer, buffer.Length, IntPtr.Zero))
        {
            return Array.Empty<InventoryItemRecord>();
        }

        var items = new List<InventoryItemRecord>();
        for (var index = 0; index < size; index++)
        {
            var offset = index * InventoryItemSize;
            var itemId = BitConverter.ToUInt32(buffer, offset + 16);
            if (itemId == 0)
            {
                continue;
            }

            var hq = false;
            if (itemId > 1_000_000)
            {
                itemId -= 1_000_000;
                hq = true;
            }

            var quantity = BitConverter.ToInt32(buffer, offset + 20);
            var spiritbond = BitConverter.ToUInt16(buffer, offset + 24);
            var stain0 = buffer[offset + 55];
            var stain1 = buffer[offset + 56];
            var slot = BitConverter.ToInt16(buffer, offset + 12);

            items.Add(new InventoryItemRecord(
                ItemId: itemId,
                Hq: hq,
                Quantity: quantity > 0 ? quantity : null,
                Dyes: new[] { (int)stain0, (int)stain1 },
                Spiritbond: spiritbond,
                InventoryType: target.InventoryType,
                Container: target.Container,
                ContainerName: target.ContainerName,
                SlotIndex: slot >= 0 ? slot : index));
        }

        return items;
    }

    private IntPtr LocateInventoryManager(IntPtr processBaseAddress)
    {
        var textSection = LocateTextSection(processBaseAddress);
        if (textSection.Address == IntPtr.Zero || textSection.Size == 0)
        {
            return IntPtr.Zero;
        }

        var section = new byte[textSection.Size];
        if (!WinApi.ReadProcessMemory(processHandle, textSection.Address, section, section.Length, IntPtr.Zero))
        {
            return IntPtr.Zero;
        }

        for (var index = 0; index < section.Length - InventoryManagerSignature.Length; index++)
        {
            for (var sigIndex = 0; sigIndex < InventoryManagerSignature.Length; sigIndex++)
            {
                if (InventoryManagerSignature[sigIndex] is { } expected && section[index + sigIndex] != expected)
                {
                    goto NextCandidate;
                }
            }

            var targetIndex = Array.IndexOf(InventoryManagerSignature, null);
            var target = BitConverter.ToInt32(section, index + targetIndex);
            var offset = index + targetIndex + 4 + target;
            return IntPtr.Add(textSection.Address, offset);

        NextCandidate:
            continue;
        }

        return IntPtr.Zero;
    }

    private (IntPtr Address, int Size) LocateTextSection(IntPtr processBaseAddress)
    {
        var header = new byte[0x800];
        if (!WinApi.ReadProcessMemory(processHandle, processBaseAddress, header, header.Length, IntPtr.Zero))
        {
            return (IntPtr.Zero, 0);
        }

        var headerWords = MemoryMarshal.Cast<byte, ulong>(header);
        for (var index = 0; index < headerWords.Length - 1; index++)
        {
            if (headerWords[index] != 0x747865742E)
            {
                continue;
            }

            var packed = headerWords[index + 1];
            var sectionOffset = (int)(packed >> 32);
            var sectionSize = (int)(packed & 0xffffffffL);
            return (IntPtr.Add(processBaseAddress, sectionOffset), sectionSize);
        }

        return (IntPtr.Zero, 0);
    }

    private IntPtr ReadPointer(IntPtr address)
    {
        var buffer = new byte[8];
        if (!WinApi.ReadProcessMemory(processHandle, address, buffer, buffer.Length, IntPtr.Zero))
        {
            return IntPtr.Zero;
        }

        return (IntPtr)(long)BitConverter.ToUInt64(buffer);
    }
}

internal sealed record InventoryReadResult(
    bool ManagerLocated,
    bool ContainerTableLocated,
    IReadOnlyList<InventoryContainerReadResult> Containers);

internal sealed record InventoryContainerReadResult(
    uint InventoryType,
    string Container,
    string? ContainerName,
    bool Located,
    bool Loaded,
    int? Size,
    int ItemCount,
    string Status,
    IReadOnlyList<InventoryItemRecord> Items);

internal sealed record InventoryItemRecord(
    uint ItemId,
    bool Hq,
    int? Quantity,
    int[] Dyes,
    int Spiritbond,
    uint InventoryType,
    string Container,
    string? ContainerName,
    int SlotIndex);

internal sealed record InventoryContainerTarget(
    uint InventoryType,
    string Container,
    string? ContainerName);
