using System.Runtime.InteropServices;

namespace NightingaleSilence.NSArmoire.Helper;

internal sealed class DresserMemoryReader : IDisposable
{
    private static readonly byte?[] Signature =
    {
        0x48, 0x8B, 0x0D, null, null, null, null, 0x48, 0x8D, 0x44, 0x24, null, 0x0F, 0x57, 0xC0
    };

    private const int DresserSize = 800;
    private readonly IntPtr processHandle;
    private readonly IntPtr dresserPointerAddress;
    private readonly byte[] data = new byte[(4 + 1 + 1) * DresserSize + 2];
    private readonly byte[] incomingData = new byte[(4 + 1 + 1) * DresserSize + 2];

    public DresserMemoryReader(ProcessSnapshot process)
    {
        processHandle = WinApi.OpenProcess(WinApi.ProcessVmRead, false, (uint)process.Id);
        if (processHandle == IntPtr.Zero)
        {
            throw new InvalidOperationException("访问游戏进程失败");
        }

        dresserPointerAddress = LocateDresserPointer(process.MainModuleBaseAddress);
        if (dresserPointerAddress == IntPtr.Zero)
        {
            throw new NotSupportedException("定位投影台数据失败");
        }
    }

    public bool Loaded => data[^1] != 0;

    public IReadOnlyList<DresserItem> ReadItems()
    {
        Read();

        if (!Loaded)
        {
            return Array.Empty<DresserItem>();
        }

        var itemIds = MemoryMarshal.Cast<byte, uint>(data.AsSpan(0, 4 * DresserSize));
        var dye1Ids = data.AsSpan(4 * DresserSize, DresserSize);
        var dye2Ids = data.AsSpan(5 * DresserSize, DresserSize);
        var items = new List<DresserItem>();

        for (var index = 0; index < itemIds.Length; index++)
        {
            var itemId = itemIds[index];
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

            items.Add(new DresserItem(itemId, hq, dye1Ids[index], dye2Ids[index], index));
        }

        return items;
    }

    public void Dispose()
    {
        if (processHandle != IntPtr.Zero)
        {
            WinApi.CloseHandle(processHandle);
        }
    }

    private void Read()
    {
        if (!WinApi.ReadProcessMemory(processHandle, dresserPointerAddress, incomingData, 8, IntPtr.Zero))
        {
            throw new InvalidOperationException("读取投影台指针失败");
        }

        var dresserDataAddress = (IntPtr)(long)BitConverter.ToUInt64(incomingData);
        if (dresserDataAddress == IntPtr.Zero)
        {
            return;
        }

        if (!WinApi.ReadProcessMemory(
                processHandle,
                IntPtr.Add(dresserDataAddress, 4),
                incomingData,
                incomingData.Length,
                IntPtr.Zero))
        {
            throw new InvalidOperationException("读取投影台数据失败");
        }

        if (incomingData[^1] == 0)
        {
            return;
        }

        incomingData.CopyTo(data, 0);
    }

    private IntPtr LocateDresserPointer(IntPtr processBaseAddress)
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

        for (var index = 0; index < section.Length - Signature.Length; index++)
        {
            for (var sigIndex = 0; sigIndex < Signature.Length; sigIndex++)
            {
                if (Signature[sigIndex] is { } expected && section[index + sigIndex] != expected)
                {
                    goto NextCandidate;
                }
            }

            var targetIndex = Array.IndexOf(Signature, null);
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
}
