param(
    [Parameter(Mandatory = $true)]
    [ValidateSet('Usuario', 'Admin')]
    [string]$Panel
)

$ErrorActionPreference = 'Stop'
$projectRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..\..')).Path
$isClient = $Panel -eq 'Usuario'
$panelDirectory = if ($isClient) { $projectRoot } else { Join-Path $projectRoot 'admin-panel' }
$basePort = if ($isClient) { 8081 } else { 3000 }
$cliFragment = if ($isClient) { 'node_modules\expo\bin\cli' } else { 'node_modules\next\dist\bin\next' }
$serverFragment = if ($isClient) { 'expo\bin\cli' } else { 'next\dist\' }

# Next.js runs its HTTP server in a child process. Check its ancestors too.
function Test-ProjectServer([int]$OwnerId) {
    for ($depth = 0; $depth -lt 6 -and $OwnerId -gt 0; $depth++) {
        $process = Get-CimInstance Win32_Process -Filter "ProcessId = $OwnerId" -ErrorAction SilentlyContinue
        if (-not $process) { return $false }
        $command = [string]$process.CommandLine
        if ($command.IndexOf($panelDirectory, [StringComparison]::OrdinalIgnoreCase) -ge 0 -and
            $command.IndexOf($serverFragment, [StringComparison]::OrdinalIgnoreCase) -ge 0) {
            return $true
        }
        $OwnerId = [int]$process.ParentProcessId
    }
    return $false
}

try {
    $Host.UI.RawUI.WindowTitle = "Mas Cafe - $Panel"
    Write-Host "Mas Cafe - $Panel" -ForegroundColor Yellow
    Write-Host ''
    if (-not (Get-Command node.exe -ErrorAction SilentlyContinue)) {
        throw 'No se encontro Node.js. Instala Node.js 24 LTS y vuelve a abrir este acceso.'
    }
    if (-not (Test-Path -LiteralPath (Join-Path $panelDirectory $cliFragment))) {
        throw "Faltan dependencias. Ejecuta npm ci en: $panelDirectory"
    }
    $environmentFiles = @('.env.local', '.env', '.env.development', '.env.development.local')
    if (-not ($environmentFiles | Where-Object { Test-Path -LiteralPath (Join-Path $panelDirectory $_) })) {
        throw "Falta el archivo de entorno. Configura .env.local en: $panelDirectory"
    }

    $listeners = @(Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue)
    $existing = $listeners | Where-Object {
        $_.LocalPort -ge $basePort -and $_.LocalPort -le ($basePort + 20) -and
        (Test-ProjectServer ([int]$_.OwningProcess))
    } | Sort-Object LocalPort | Select-Object -First 1
    if ($existing) {
        $url = "http://localhost:$($existing.LocalPort)"
        Write-Host "El panel ya esta iniciado. Abriendo $url" -ForegroundColor Green
        Start-Process $url
        if ($isClient) { Write-Host 'El QR sigue disponible en la ventana donde se inicio Expo.' }
        return
    }

    $port = $basePort
    while ($listeners.LocalPort -contains $port) { $port++ }
    if ($port -gt ($basePort + 20)) { throw 'No hay un puerto disponible para iniciar el panel.' }
    $url = "http://localhost:$port"
    Set-Location -LiteralPath $panelDirectory
    Write-Host "Carpeta: $panelDirectory"
    Write-Host "Direccion: $url"
    Write-Host 'Deja esta ventana abierta. Para detener el servidor, presiona Ctrl+C.'
    Write-Host ''
    $nodePath = (Get-Command node.exe).Source
    $cliPath = Join-Path $panelDirectory $cliFragment
    if ($isClient) {
        Write-Host 'Conecta el celular a la misma red Wi-Fi y escanea el QR con Expo Go.'
        & $nodePath $cliPath start --go --web --port $port
    } else {
        # Open the browser only after Next.js can serve its first page.
        $waiterPath = Join-Path $PSScriptRoot 'wait-and-open.ps1'
        Start-Process -FilePath 'powershell.exe' -WindowStyle Hidden -ArgumentList @(
            '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', ('"{0}"' -f $waiterPath),
            '-Url', $url, '-LauncherId', $PID
        )
        & $nodePath $cliPath dev --hostname 0.0.0.0 --port $port
    }
    if ($LASTEXITCODE -ne 0) { throw "El servidor termino con codigo $LASTEXITCODE. Revisa el mensaje de arriba." }
} catch {
    Write-Host ''
    Write-Host $_.Exception.Message -ForegroundColor Red
    Read-Host 'Presiona Enter para cerrar'
    exit 1
}
