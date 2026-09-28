$ErrorActionPreference = 'Stop'
$desktopDirectory = [Environment]::GetFolderPath('Desktop')
$launcherPath = Join-Path $PSScriptRoot 'start-mascafe.ps1'
foreach ($panel in @('Usuario', 'Admin')) {
    $destination = Join-Path $desktopDirectory "Mas Cafe - $panel.cmd"
    $body = @"
@echo off
chcp 65001 >nul
title Mas Cafe - $panel
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$($launcherPath.Replace('%', '%%'))" -Panel $panel
"@
    [IO.File]::WriteAllText($destination, ($body -replace "`r?`n", "`r`n") + "`r`n", [Text.UTF8Encoding]::new($false))
    Write-Host "Creado: $destination"
}
