using System.Runtime.InteropServices;

namespace NightingaleSilence.NSArmoire.Helper;

internal sealed class CabinetMemoryReader : IDisposable
{
    private static readonly byte?[] UiStateSignature =
    {
        0x48, 0x8D, 0x0D, null, null, null, null, 0x45, 0x33, 0xC0,
        0xBA, null, null, null, null, 0xE8, null, null, null, null,
        0x48, 0x8B, 0x0D, null, null, null, null, 0xBA
    };

    private const int UiStateCabinetOffset = 0x1688;
    private const int CabinetStateLoaded = 2;
    private const int CabinetUnlockedItemsVectorOffset = 0x08;
    private const int StdVectorMaxBytes = 16 * 1024;

    private readonly IntPtr processHandle;
    private readonly IntPtr uiStateAddress;

    public CabinetMemoryReader(ProcessSnapshot process)
    {
        processHandle = WinApi.OpenProcess(WinApi.ProcessVmRead, false, (uint)process.Id);
        if (processHandle == IntPtr.Zero)
        {
            throw new InvalidOperationException("访问游戏进程失败");
        }

        uiStateAddress = LocateUiState(process.MainModuleBaseAddress);
        if (uiStateAddress == IntPtr.Zero)
        {
            throw new NotSupportedException("定位 UIState 失败");
        }
    }

    public CabinetReadResult Read()
    {
        var cabinetAddress = IntPtr.Add(uiStateAddress, UiStateCabinetOffset);
        var stateBuffer = new byte[4];
        if (!WinApi.ReadProcessMemory(processHandle, cabinetAddress, stateBuffer, stateBuffer.Length, IntPtr.Zero))
        {
            return new CabinetReadResult(
                Located: true,
                Loaded: false,
                State: null,
                ByteCount: null,
                UnlockedBitCount: 0,
                CabinetIds: Array.Empty<uint>(),
                Status: "state_unreadable");
        }

        var state = BitConverter.ToInt32(stateBuffer);
        var vector = ReadStdVector(IntPtr.Add(cabinetAddress, CabinetUnlockedItemsVectorOffset));
        if (vector.Status != "ready")
        {
            return new CabinetReadResult(
                Located: true,
                Loaded: state == CabinetStateLoaded,
                State: state,
                ByteCount: null,
                UnlockedBitCount: 0,
                CabinetIds: Array.Empty<uint>(),
                Status: vector.Status);
        }

        var cabinetIds = GetSetBitIndexes(vector.Data);
        return new CabinetReadResult(
            Located: true,
            Loaded: state == CabinetStateLoaded,
            State: state,
            ByteCount: vector.Data.Length,
            UnlockedBitCount: cabinetIds.Count,
            CabinetIds: cabinetIds,
            Status: state == CabinetStateLoaded ? "ready" : "not_loaded");
    }

    public void Dispose()
    {
        if (processHandle != IntPtr.Zero)
        {
            WinApi.CloseHandle(processHandle);
        }
    }

    private (string Status, byte[] Data) ReadStdVector(IntPtr vectorAddress)
    {
        var buffer = new byte[24];
        if (!WinApi.ReadProcessMemory(processHandle, vectorAddress, buffer, buffer.Length, IntPtr.Zero))
        {
            return ("vector_unreadable", Array.Empty<byte>());
        }

        var begin = (IntPtr)(long)BitConverter.ToUInt64(buffer, 0);
        var end = (IntPtr)(long)BitConverter.ToUInt64(buffer, 8);
        if (begin == IntPtr.Zero || end == IntPtr.Zero)
        {
            return ("vector_empty", Array.Empty<byte>());
        }

        var length = (long)end - (long)begin;
        if (length < 0 || length > StdVectorMaxBytes)
        {
            return ("invalid_vector_size", Array.Empty<byte>());
        }

        var data = new byte[length];
        if (data.Length != 0 && !WinApi.ReadProcessMemory(processHandle, begin, data, data.Length, IntPtr.Zero))
        {
            return ("vector_data_unreadable", Array.Empty<byte>());
        }

        return ("ready", data);
    }

    private static IReadOnlyList<uint> GetSetBitIndexes(IReadOnlyList<byte> data)
    {
        var indexes = new List<uint>();
        for (var byteIndex = 0; byteIndex < data.Count; byteIndex++)
        {
            var value = data[byteIndex];
            if (value == 0)
            {
                continue;
            }

            for (var bitIndex = 0; bitIndex < 8; bitIndex++)
            {
                if ((value & (1 << bitIndex)) != 0)
                {
                    indexes.Add((uint)(byteIndex * 8 + bitIndex));
                }
            }
        }

        return indexes;
    }

    private IntPtr LocateUiState(IntPtr processBaseAddress)
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

        for (var index = 0; index < section.Length - UiStateSignature.Length; index++)
        {
            for (var sigIndex = 0; sigIndex < UiStateSignature.Length; sigIndex++)
            {
                if (UiStateSignature[sigIndex] is { } expected && section[index + sigIndex] != expected)
                {
                    goto NextCandidate;
                }
            }

            var targetIndex = Array.IndexOf(UiStateSignature, null);
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

internal sealed record CabinetReadResult(
    bool Located,
    bool Loaded,
    int? State,
    int? ByteCount,
    int UnlockedBitCount,
    IReadOnlyList<uint> CabinetIds,
    string Status);
