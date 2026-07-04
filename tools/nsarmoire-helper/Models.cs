namespace NightingaleSilence.NSArmoire.Helper;

internal static class ArmoireContracts
{
    public const string SnapshotSchemaVersion = "nsarmoire.snapshot.v1";
    public const string HelperVersion = "0.1.0";
}

internal sealed record ArmoireOwnedItem(
    uint ItemId,
    bool? Hq,
    int? Quantity,
    int[]? Dyes,
    string Container,
    string? ContainerName,
    int? SlotIndex);

internal sealed record ArmoireSnapshot(
    string SchemaVersion,
    string Source,
    string GeneratedAt,
    IReadOnlyList<ArmoireOwnedItem> Items);

internal sealed record HelperHealth(
    bool Ok,
    string HelperVersion,
    string Status,
    string StatusMessage,
    bool GameProcessFound,
    bool DresserLocated,
    bool DresserLoaded,
    IReadOnlyList<string> SupportedContainers,
    int? SelectedPid,
    int GameProcessCount);

internal sealed record HelperError(string Error, string Message);

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

internal sealed record ProcessSnapshot(int Id, IntPtr MainModuleBaseAddress, string? ExecutablePath);

internal sealed record DresserItem(uint ItemId, bool Hq, int Dye1Id, int Dye2Id, int SlotIndex);
