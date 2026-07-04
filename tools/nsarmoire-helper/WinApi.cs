using System.Runtime.InteropServices;

namespace NightingaleSilence.NSArmoire.Helper;

internal static class WinApi
{
    public const uint ProcessVmRead = 0x00000010;
    public const uint ProcessQueryLimitedInformation = 0x00001000;

    [DllImport("kernel32.dll", SetLastError = true)]
    public static extern IntPtr OpenProcess(
        uint processAccess,
        [MarshalAs(UnmanagedType.Bool)] bool inheritHandle,
        uint processId);

    [DllImport("kernel32.dll", SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)]
    public static extern bool ReadProcessMemory(
        IntPtr process,
        IntPtr baseAddress,
        [Out] byte[] buffer,
        IntPtr size,
        IntPtr bytesRead);

    [DllImport("kernel32.dll", SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)]
    public static extern bool CloseHandle(IntPtr handle);

    [DllImport(
        "kernel32.dll",
        EntryPoint = "QueryFullProcessImageNameW",
        SetLastError = true,
        CharSet = CharSet.Unicode)]
    [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool QueryFullProcessImageName(
        IntPtr process,
        int flags,
        [Out] char[] executableName,
        ref int size);

    public static string? TryQueryFullProcessImageName(int processId)
    {
        var process = OpenProcess(ProcessQueryLimitedInformation, false, (uint)processId);
        if (process == IntPtr.Zero)
        {
            return null;
        }

        try
        {
            var length = 1024;
            var buffer = new char[length];
            if (!QueryFullProcessImageName(process, 0, buffer, ref length))
            {
                return null;
            }

            return new string(buffer, 0, length);
        }
        finally
        {
            CloseHandle(process);
        }
    }
}
