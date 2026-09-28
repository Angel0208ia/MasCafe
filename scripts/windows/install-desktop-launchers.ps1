$ErrorActionPreference = 'Stop'
$desktopDirectory = [Environment]::GetFolderPath('Desktop')
$launcherPath = Join-Path $PSScriptRoot 'start-mascafe.ps1'
$powershellPath = Join-Path $env:SystemRoot 'System32\WindowsPowerShell\v1.0\powershell.exe'
$shortcutShell = New-Object -ComObject WScript.Shell
foreach ($panel in @('Usuario', 'Admin')) {
    $destination = Join-Path $desktopDirectory "Mas Cafe - $panel.lnk"
    $shortcut = $shortcutShell.CreateShortcut($destination)
    $shortcut.TargetPath = $powershellPath
    $shortcut.Arguments = '-NoProfile -ExecutionPolicy Bypass -File "{0}" -Panel {1}' -f $launcherPath, $panel
    $shortcut.WorkingDirectory = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..\..')).Path
    $shortcut.Description = "Abrir Mas Cafe - $panel"
    $shortcut.IconLocation = "$powershellPath,0"
    $shortcut.WindowStyle = 1
    $shortcut.Save()

    # Replace only the .cmd wrappers created by the previous installer.
    $legacyPath = Join-Path $desktopDirectory "Mas Cafe - $panel.cmd"
    if (Test-Path -LiteralPath $legacyPath) {
        $legacyBody = [IO.File]::ReadAllText($legacyPath)
        if ($legacyBody.Contains($launcherPath.Replace('%', '%%'))) {
            Remove-Item -LiteralPath $legacyPath
        }
    }
    Write-Host "Creado: $destination"
}

# Notify Explorer without restarting it or closing any windows.
if (-not ('MasCafeDesktopNotify' -as [type])) {
    Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public static class MasCafeDesktopNotify {
    [DllImport("shell32.dll", CharSet = CharSet.Unicode)]
    public static extern void SHChangeNotify(uint eventId, uint flags,
        [MarshalAs(UnmanagedType.LPWStr)] string path, IntPtr unused);
}
'@
}
[MasCafeDesktopNotify]::SHChangeNotify(0x1000, 0x5, $desktopDirectory, [IntPtr]::Zero)
