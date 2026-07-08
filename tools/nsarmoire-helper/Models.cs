namespace NightingaleSilence.NSArmoire.Helper;

internal static class ArmoireContracts
{
    public const string SnapshotSchemaVersion = "nsarmoire.snapshot.v1";
    public const string HelperVersion = "0.5.1";
}

internal sealed record ArmoireOwnedItem(
    uint ItemId,
    bool? Hq,
    int? Quantity,
    int[]? Dyes,
    int? Spiritbond,
    string Container,
    string? ContainerName,
    int? SlotIndex,
    uint? InventoryType = null,
    string? RetainerId = null,
    string? RetainerName = null,
    uint? CabinetId = null);

internal sealed record ArmoireCharacter(
    string? Id,
    string? Name,
    string? World,
    string? DataCenter);

internal sealed record ArmoireSnapshot(
    string SchemaVersion,
    string Source,
    string GeneratedAt,
    ArmoireCharacter? Character,
    IReadOnlyList<ArmoireOwnedItem> Items);

internal sealed record HelperHealth(
    bool Ok,
    string HelperVersion,
    string Status,
    string StatusMessage,
    bool GameProcessFound,
    bool CharacterLocated,
    bool CharacterLoaded,
    string? CharacterName,
    ushort? CharacterWorldId,
    string? CharacterWorld,
    bool DresserLocated,
    bool DresserLoaded,
    bool CatalogLocated,
    int CatalogCabinetEntryCount,
    bool CabinetLocated,
    bool CabinetLoaded,
    bool InventoryLocated,
    bool RetainerManagerLocated,
    int CachedRetainerCount,
    IReadOnlyList<string> SupportedContainers,
    int? SelectedPid,
    int GameProcessCount);

internal sealed record HelperError(string Error, string Message);

internal sealed record HelperProbe(
    bool Ok,
    string HelperVersion,
    bool GameProcessFound,
    int? SelectedPid,
    string SnapshotContentHash,
    CharacterProbeResult Character,
    bool DresserLocated,
    bool DresserLoaded,
    CabinetProbeResult Cabinet,
    bool InventoryLocated,
    bool RetainerManagerLocated,
    bool InventoryContainerTableLocated,
    IReadOnlyList<RetainerProbeResult> Retainers,
    IReadOnlyList<RetainerCacheProbeResult> RetainerCaches,
    IReadOnlyList<ContainerProbeResult> Containers);

internal sealed record ContainerProbeResult(
    string Key,
    string Container,
    string? ContainerName,
    uint? InventoryType,
    bool Located,
    bool Loaded,
    int? Size,
    int ItemCount,
    string Status);

internal sealed record CharacterProbeResult(
    bool Located,
    bool Loaded,
    string? Name,
    ushort? WorldId,
    string? WorldName,
    string Status);

internal sealed record CabinetProbeResult(
    bool Located,
    bool Loaded,
    int? State,
    int? ByteCount,
    int UnlockedBitCount,
    bool CatalogLocated,
    int MappedItemCount,
    string Status);

internal sealed record RetainerProbeResult(
    int Slot,
    ulong RetainerId,
    string Name,
    byte JobId,
    byte Level,
    byte ItemCount,
    byte MarketItemCount,
    bool Available,
    uint VentureId,
    uint VentureComplete,
    bool IsActive,
    bool InventoryCached,
    int CachedItemCount,
    string? CachedAt);

internal sealed record RetainerCacheProbeResult(
    string RetainerId,
    string RetainerName,
    int ItemCount,
    string UpdatedAt);

internal sealed record GameProcessSelection(ProcessSnapshot? Process, string Status, string StatusMessage);

internal sealed record GameProcessList(IReadOnlyList<GameProcessInfo> Processes);

internal sealed record GameProcessInfo(
    int Pid,
    string ProcessName,
    string DisplayName,
    string? WindowTitle,
    string? StartedAt,
    bool IsSelected,
    bool IsReadable,
    string Status,
    string StatusMessage);

internal sealed record ProcessSelectRequest(int Pid);

internal sealed record OpenV2Result(string Url);

internal sealed record HelperShutdownResult(bool Ok);

internal sealed record ProcessSnapshot(int Id, IntPtr MainModuleBaseAddress, string? ExecutablePath);

internal sealed record DresserItem(uint ItemId, bool Hq, int Dye1Id, int Dye2Id, int SlotIndex);
