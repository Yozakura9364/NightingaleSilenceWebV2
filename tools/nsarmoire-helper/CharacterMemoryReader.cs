using System.Runtime.InteropServices;
using System.Text;

namespace NightingaleSilence.NSArmoire.Helper;

internal sealed class CharacterMemoryReader : IDisposable
{
    private static readonly byte?[] PlayerStateSignature =
    {
        0x48, 0x8D, 0x0D, null, null, null, null, 0xE8, null, null, null, null, 0x84, 0xC0, 0x75, 0x06, 0xF6, 0x43, 0x18, 0x02
    };

    private static readonly byte?[] ControlSignature =
    {
        0x4C, 0x8D, 0x35, null, null, null, null, 0x48, 0x8B, 0x09
    };

    private const int PlayerStateReadSize = 0x70;
    private const int CharacterNameOffset = 0x01;
    private const int CharacterNameSize = 64;
    private const int ControlLocalPlayerOffset = 0x76A0;
    private const int CharacterHomeWorldOffset = 0x2362;

    private readonly IntPtr processHandle;
    private readonly IntPtr playerStateAddress;
    private readonly IntPtr controlAddress;

    public CharacterMemoryReader(ProcessSnapshot process)
    {
        processHandle = WinApi.OpenProcess(WinApi.ProcessVmRead, false, (uint)process.Id);
        if (processHandle == IntPtr.Zero)
        {
            throw new InvalidOperationException("访问游戏进程失败");
        }

        var textSection = LocateTextSection(process.MainModuleBaseAddress);
        if (textSection.Address == IntPtr.Zero || textSection.Size == 0)
        {
            throw new NotSupportedException("定位游戏代码区失败");
        }

        var section = new byte[textSection.Size];
        if (!WinApi.ReadProcessMemory(processHandle, textSection.Address, section, section.Length, IntPtr.Zero))
        {
            throw new InvalidOperationException("读取游戏代码区失败");
        }

        playerStateAddress = LocateStaticAddress(textSection.Address, section, PlayerStateSignature);
        if (playerStateAddress == IntPtr.Zero)
        {
            throw new NotSupportedException("定位角色状态失败");
        }

        controlAddress = LocateStaticAddress(textSection.Address, section, ControlSignature);
    }

    public CharacterReadResult Read()
    {
        var buffer = new byte[PlayerStateReadSize];
        if (!WinApi.ReadProcessMemory(processHandle, playerStateAddress, buffer, buffer.Length, IntPtr.Zero))
        {
            return new CharacterReadResult(
                Located: true,
                Loaded: false,
                Name: null,
                WorldId: null,
                WorldName: null,
                Status: "unreadable");
        }

        var isLoaded = buffer[0] != 0;
        var name = ReadName(buffer.AsSpan(CharacterNameOffset, CharacterNameSize));
        if (!isLoaded || string.IsNullOrWhiteSpace(name))
        {
            return new CharacterReadResult(
                Located: true,
                Loaded: false,
                Name: null,
                WorldId: null,
                WorldName: null,
                Status: "not_loaded");
        }

        var worldId = ReadHomeWorldId();
        var worldName = worldId is { } id ? WorldNameLookup.GetName(id) : null;
        var status = worldId switch
        {
            null => "world_not_found",
            _ when worldName is null => "world_unknown",
            _ => "ready"
        };

        return new CharacterReadResult(
            Located: true,
            Loaded: true,
            Name: name,
            WorldId: worldId,
            WorldName: worldName,
            Status: status);
    }

    public void Dispose()
    {
        if (processHandle != IntPtr.Zero)
        {
            WinApi.CloseHandle(processHandle);
        }
    }

    private ushort? ReadHomeWorldId()
    {
        if (controlAddress == IntPtr.Zero)
        {
            return null;
        }

        var localPlayerAddress = ReadPointer(IntPtr.Add(controlAddress, ControlLocalPlayerOffset));
        if (localPlayerAddress == IntPtr.Zero)
        {
            return null;
        }

        var buffer = new byte[2];
        if (!WinApi.ReadProcessMemory(
                processHandle,
                IntPtr.Add(localPlayerAddress, CharacterHomeWorldOffset),
                buffer,
                buffer.Length,
                IntPtr.Zero))
        {
            return null;
        }

        var worldId = BitConverter.ToUInt16(buffer);
        return worldId == 0 ? null : worldId;
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

    private static string ReadName(ReadOnlySpan<byte> bytes)
    {
        var length = bytes.IndexOf((byte)0);
        if (length < 0)
        {
            length = bytes.Length;
        }

        return Encoding.UTF8.GetString(bytes[..length]).Trim();
    }

    private static IntPtr LocateStaticAddress(IntPtr textSectionAddress, byte[] section, byte?[] signature)
    {
        for (var index = 0; index < section.Length - signature.Length; index++)
        {
            for (var sigIndex = 0; sigIndex < signature.Length; sigIndex++)
            {
                if (signature[sigIndex] is { } expected && section[index + sigIndex] != expected)
                {
                    goto NextCandidate;
                }
            }

            var targetIndex = Array.IndexOf(signature, null);
            var target = BitConverter.ToInt32(section, index + targetIndex);
            var offset = index + targetIndex + 4 + target;
            return IntPtr.Add(textSectionAddress, offset);

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

internal static class WorldNameLookup
{
    public static string? GetName(ushort worldId)
        => worldId switch
        {
            // Current public international worlds.
            23 => "Asura",
            24 => "Belias",
            28 => "Pandaemonium",
            29 => "Shinryu",
            30 => "Unicorn",
            31 => "Yojimbo",
            32 => "Zeromus",
            33 => "Twintania",
            34 => "Brynhildr",
            35 => "Famfrit",
            36 => "Lich",
            37 => "Mateus",
            39 => "Omega",
            40 => "Jenova",
            41 => "Zalera",
            42 => "Zodiark",
            43 => "Alexander",
            44 => "Anima",
            45 => "Carbuncle",
            46 => "Fenrir",
            47 => "Hades",
            48 => "Ixion",
            49 => "Kujata",
            50 => "Typhon",
            51 => "Ultima",
            52 => "Valefor",
            53 => "Exodus",
            54 => "Faerie",
            55 => "Lamia",
            56 => "Phoenix",
            57 => "Siren",
            58 => "Garuda",
            59 => "Ifrit",
            60 => "Ramuh",
            61 => "Titan",
            62 => "Diabolos",
            63 => "Gilgamesh",
            64 => "Leviathan",
            65 => "Midgardsormr",
            66 => "Odin",
            67 => "Shiva",
            68 => "Atomos",
            69 => "Bahamut",
            70 => "Chocobo",
            71 => "Moogle",
            72 => "Tonberry",
            73 => "Adamantoise",
            74 => "Coeurl",
            75 => "Malboro",
            76 => "Tiamat",
            77 => "Ultros",
            78 => "Behemoth",
            79 => "Cactuar",
            80 => "Cerberus",
            81 => "Goblin",
            82 => "Mandragora",
            83 => "Louisoix",
            85 => "Spriggan",
            86 => "Sephirot",
            87 => "Sophia",
            88 => "Zurvan",
            90 => "Aegis",
            91 => "Balmung",
            92 => "Durandal",
            93 => "Excalibur",
            94 => "Gungnir",
            95 => "Hyperion",
            96 => "Masamune",
            97 => "Ragnarok",
            98 => "Ridill",
            99 => "Sargatanas",
            21 => "Ravana",
            22 => "Bismarck",
            400 => "Sagittarius",
            401 => "Phantom",
            402 => "Alpha",
            403 => "Raiden",
            404 => "Marilith",
            405 => "Seraph",
            406 => "Halicarnassus",
            407 => "Maduin",
            408 => "Cuchulainn",
            409 => "Kraken",
            410 => "Rafflesia",
            411 => "Golem",

            // Current public China worlds confirmed by the user.
            1042 => "拉诺西亚",
            1043 => "紫水栈桥",
            1044 => "幻影群岛",
            1045 => "摩杜纳",
            1060 => "萌芽池",
            1076 => "白金幻象",
            1081 => "神意之地",
            1106 => "静语庄园",
            1113 => "旅人栈桥",
            1121 => "拂晓之间",
            1166 => "龙巢神殿",
            1167 => "红玉海",
            1169 => "延夏",
            1170 => "潮风亭",
            1171 => "神拳痕",
            1172 => "白银乡",
            1173 => "宇宙和音",
            1174 => "沃仙曦染",
            1175 => "晨曦王座",
            1176 => "梦羽宝境",
            1177 => "海猫茶屋",
            1178 => "柔风海湾",
            1179 => "琥珀原",
            1180 => "太阳海岸",
            1183 => "银泪湖",
            1186 => "伊修加德",
            1192 => "水晶塔",
            1201 => "红茶川",

            // Current public Korea worlds confirmed by the user.
            2075 => "카벙클",
            2076 => "초코보",
            2077 => "모그리",
            2078 => "톤베리",
            2080 => "펜리르",
            _ => null
        };
}

internal sealed record CharacterReadResult(
    bool Located,
    bool Loaded,
    string? Name,
    ushort? WorldId,
    string? WorldName,
    string Status);
