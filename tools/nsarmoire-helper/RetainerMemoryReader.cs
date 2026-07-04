using System.Runtime.InteropServices;
using System.Text;

namespace NightingaleSilence.NSArmoire.Helper;

internal sealed class RetainerMemoryReader : IDisposable
{
    private static readonly byte?[] RetainerManagerSignature =
    {
        0x48, 0x8D, 0x0D, null, null, null, null, 0x48, 0x8B, 0x18
    };

    private const int RetainerManagerSize = 784;
    private const int RetainerSize = 72;
    private const int RetainerCount = 10;
    private const int DisplayOrderOffset = 720;
    private const int IsReadyOffset = 730;
    private const int LastSelectedRetainerIdOffset = 736;

    private readonly IntPtr processHandle;
    private readonly IntPtr retainerManagerAddress;

    public RetainerMemoryReader(ProcessSnapshot process)
    {
        processHandle = WinApi.OpenProcess(WinApi.ProcessVmRead, false, (uint)process.Id);
        if (processHandle == IntPtr.Zero)
        {
            throw new InvalidOperationException("访问游戏进程失败");
        }

        retainerManagerAddress = LocateRetainerManager(process.MainModuleBaseAddress);
        if (retainerManagerAddress == IntPtr.Zero)
        {
            throw new NotSupportedException("定位雇员管理器失败");
        }
    }

    public RetainerReadResult Read()
    {
        var buffer = new byte[RetainerManagerSize];
        if (!WinApi.ReadProcessMemory(processHandle, retainerManagerAddress, buffer, buffer.Length, IntPtr.Zero))
        {
            return new RetainerReadResult(
                ManagerLocated: true,
                IsReady: false,
                MaxRetainerEntitlement: 0,
                LastSelectedRetainerId: 0,
                Retainers: Array.Empty<RetainerRecord>());
        }

        var isReady = buffer[IsReadyOffset] != 0;
        var maxRetainerEntitlement = buffer[IsReadyOffset + 1];
        var lastSelectedRetainerId = BitConverter.ToUInt64(buffer, LastSelectedRetainerIdOffset);
        var displayOrder = buffer.AsSpan(DisplayOrderOffset, RetainerCount).ToArray();
        var retainers = new List<RetainerRecord>();

        for (var slot = 0; slot < RetainerCount; slot++)
        {
            var offset = slot * RetainerSize;
            var retainerId = BitConverter.ToUInt64(buffer, offset);
            if (retainerId == 0)
            {
                continue;
            }

            var name = ReadName(buffer.AsSpan(offset + 8, 32));
            retainers.Add(new RetainerRecord(
                Slot: slot,
                DisplayOrder: displayOrder[slot],
                RetainerId: retainerId,
                Name: name,
                Available: buffer[offset + 40] != 0,
                JobId: buffer[offset + 41],
                Level: buffer[offset + 42],
                ItemCount: buffer[offset + 43],
                Gil: BitConverter.ToUInt32(buffer, offset + 44),
                Town: buffer[offset + 48],
                MarketItemCount: buffer[offset + 49],
                MarketExpire: BitConverter.ToUInt32(buffer, offset + 52),
                VentureId: BitConverter.ToUInt16(buffer, offset + 56),
                VentureComplete: BitConverter.ToUInt32(buffer, offset + 60),
                IsActive: retainerId == lastSelectedRetainerId));
        }

        return new RetainerReadResult(
            ManagerLocated: true,
            IsReady: isReady,
            MaxRetainerEntitlement: maxRetainerEntitlement,
            LastSelectedRetainerId: lastSelectedRetainerId,
            Retainers: retainers);
    }

    public void Dispose()
    {
        if (processHandle != IntPtr.Zero)
        {
            WinApi.CloseHandle(processHandle);
        }
    }

    private static string ReadName(ReadOnlySpan<byte> bytes)
    {
        var length = bytes.IndexOf((byte)0);
        if (length < 0)
        {
            length = bytes.Length;
        }

        return Encoding.UTF8.GetString(bytes[..length]);
    }

    private IntPtr LocateRetainerManager(IntPtr processBaseAddress)
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

        for (var index = 0; index < section.Length - RetainerManagerSignature.Length; index++)
        {
            for (var sigIndex = 0; sigIndex < RetainerManagerSignature.Length; sigIndex++)
            {
                if (RetainerManagerSignature[sigIndex] is { } expected && section[index + sigIndex] != expected)
                {
                    goto NextCandidate;
                }
            }

            var targetIndex = Array.IndexOf(RetainerManagerSignature, null);
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

internal sealed record RetainerReadResult(
    bool ManagerLocated,
    bool IsReady,
    byte MaxRetainerEntitlement,
    ulong LastSelectedRetainerId,
    IReadOnlyList<RetainerRecord> Retainers);

internal sealed record RetainerRecord(
    int Slot,
    byte DisplayOrder,
    ulong RetainerId,
    string Name,
    bool Available,
    byte JobId,
    byte Level,
    byte ItemCount,
    uint Gil,
    byte Town,
    byte MarketItemCount,
    uint MarketExpire,
    ushort VentureId,
    uint VentureComplete,
    bool IsActive);
