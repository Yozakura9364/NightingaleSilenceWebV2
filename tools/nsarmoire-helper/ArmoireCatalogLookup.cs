using System.Text.Json;

namespace NightingaleSilence.NSArmoire.Helper;

internal sealed class ArmoireCatalogLookup
{
    private readonly IReadOnlyDictionary<uint, uint> itemIdsByCabinetId;

    private ArmoireCatalogLookup(IReadOnlyDictionary<uint, uint> itemIdsByCabinetId, string? sourcePath)
    {
        this.itemIdsByCabinetId = itemIdsByCabinetId;
        SourcePath = sourcePath;
    }

    public string? SourcePath { get; }
    public bool HasSource => SourcePath is not null;
    public bool IsLoaded => itemIdsByCabinetId.Count > 0;
    public int CabinetEntryCount => itemIdsByCabinetId.Count;

    public static ArmoireCatalogLookup LoadDefault()
    {
        var catalogPath = FindCatalogPath();
        if (catalogPath is null)
        {
            return new ArmoireCatalogLookup(new Dictionary<uint, uint>(), null);
        }

        try
        {
            using var stream = File.OpenRead(catalogPath);
            using var document = JsonDocument.Parse(stream);
            if (!document.RootElement.TryGetProperty("cabinetEntries", out var cabinetEntries)
                || cabinetEntries.ValueKind != JsonValueKind.Array)
            {
                return new ArmoireCatalogLookup(new Dictionary<uint, uint>(), catalogPath);
            }

            var mapping = new Dictionary<uint, uint>();
            foreach (var entry in cabinetEntries.EnumerateArray())
            {
                if (!entry.TryGetProperty("cabinetId", out var cabinetIdElement)
                    || !entry.TryGetProperty("itemId", out var itemIdElement)
                    || !cabinetIdElement.TryGetUInt32(out var cabinetId)
                    || !itemIdElement.TryGetUInt32(out var itemId)
                    || cabinetId == 0
                    || itemId == 0)
                {
                    continue;
                }

                mapping[cabinetId] = itemId;
            }

            return new ArmoireCatalogLookup(mapping, catalogPath);
        }
        catch
        {
            return new ArmoireCatalogLookup(new Dictionary<uint, uint>(), catalogPath);
        }
    }

    public IReadOnlyList<CabinetStoredItem> ResolveCabinetItems(IReadOnlyList<uint> cabinetIds)
    {
        return cabinetIds
            .Where(cabinetId => itemIdsByCabinetId.ContainsKey(cabinetId))
            .Select(cabinetId => new CabinetStoredItem(cabinetId, itemIdsByCabinetId[cabinetId]))
            .OrderBy(item => item.CabinetId)
            .ToArray();
    }

    public byte[] ReadCatalogJson()
    {
        if (SourcePath is null || !File.Exists(SourcePath))
        {
            throw new HelperRequestException("catalog_not_found", "本地助手未找到静态目录数据", 404);
        }

        try
        {
            var bytes = File.ReadAllBytes(SourcePath);
            using var _ = JsonDocument.Parse(bytes);
            return bytes;
        }
        catch (JsonException)
        {
            throw new HelperRequestException("catalog_invalid", "静态目录数据无法解析", 500);
        }
        catch
        {
            throw new HelperRequestException("catalog_unreadable", "静态目录数据读取失败", 500);
        }
    }

    private static string? FindCatalogPath()
    {
        foreach (var root in EnumerateSearchRoots())
        {
            var candidate = Path.Combine(root, "public", "data", "armoire-catalog.json");
            if (File.Exists(candidate))
            {
                return candidate;
            }
        }

        return null;
    }

    private static IEnumerable<string> EnumerateSearchRoots()
    {
        var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (var start in new[] { Directory.GetCurrentDirectory(), AppContext.BaseDirectory })
        {
            var current = new DirectoryInfo(start);
            while (current is not null)
            {
                if (seen.Add(current.FullName))
                {
                    yield return current.FullName;
                }

                current = current.Parent;
            }
        }
    }
}

internal sealed record CabinetStoredItem(uint CabinetId, uint ItemId);
