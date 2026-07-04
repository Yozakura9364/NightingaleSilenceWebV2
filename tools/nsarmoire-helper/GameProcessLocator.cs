using System.Diagnostics;

namespace NightingaleSilence.NSArmoire.Helper;

internal sealed class GameProcessLocator
{
    private const string ProcessName = "ffxiv_dx11";

    public IReadOnlyList<GameProcessInfo> ListProcesses(int? selectedPid)
    {
        return Process.GetProcessesByName(ProcessName)
            .OrderBy(process => process.Id)
            .Select(process => CreateProcessInfo(process, selectedPid))
            .ToArray();
    }

    public GameProcessSelection Locate(int? targetPid)
    {
        var processes = Process.GetProcessesByName(ProcessName);

        if (targetPid is not null)
        {
            var selected = processes.FirstOrDefault(process => process.Id == targetPid.Value);
            return selected is null
                ? new GameProcessSelection(null, "game_process_not_found", "未找到指定 PID 的游戏进程")
                : CreateSelection(selected);
        }

        return processes.Length switch
        {
            0 => new GameProcessSelection(null, "game_process_not_found", "未找到 ffxiv_dx11.exe 进程"),
            1 => CreateSelection(processes[0]),
            _ => new GameProcessSelection(null, "multiple_game_processes", "检测到多个游戏进程，请在网页中选择目标进程")
        };
    }

    private static GameProcessSelection CreateSelection(Process process)
    {
        try
        {
            var snapshot = new ProcessSnapshot(
                process.Id,
                process.MainModule?.BaseAddress ?? IntPtr.Zero,
                WinApi.TryQueryFullProcessImageName(process.Id));

            if (snapshot.MainModuleBaseAddress == IntPtr.Zero)
            {
                return new GameProcessSelection(null, "game_process_unreadable", "游戏进程主模块不可读");
            }

            return new GameProcessSelection(snapshot, "ready", "已找到游戏进程");
        }
        catch
        {
            return new GameProcessSelection(null, "game_process_unreadable", "读取游戏进程信息失败");
        }
    }

    private static GameProcessInfo CreateProcessInfo(Process process, int? selectedPid)
    {
        var processName = process.ProcessName;
        var windowTitle = GetWindowTitle(process);
        var displayName = string.IsNullOrWhiteSpace(windowTitle)
            ? $"{processName} #{process.Id}"
            : $"{windowTitle} ({processName} #{process.Id})";
        var status = "ready";
        var statusMessage = "可读取";
        var isReadable = true;

        try
        {
            if ((process.MainModule?.BaseAddress ?? IntPtr.Zero) == IntPtr.Zero)
            {
                isReadable = false;
                status = "game_process_unreadable";
                statusMessage = "游戏进程主模块不可读";
            }
        }
        catch
        {
            isReadable = false;
            status = "game_process_unreadable";
            statusMessage = "读取游戏进程信息失败";
        }

        return new GameProcessInfo(
            Pid: process.Id,
            ProcessName: processName,
            DisplayName: displayName,
            WindowTitle: string.IsNullOrWhiteSpace(windowTitle) ? null : windowTitle,
            IsSelected: selectedPid == process.Id,
            IsReadable: isReadable,
            Status: status,
            StatusMessage: statusMessage);
    }

    private static string? GetWindowTitle(Process process)
    {
        try
        {
            return process.MainWindowTitle;
        }
        catch
        {
            return null;
        }
    }
}
