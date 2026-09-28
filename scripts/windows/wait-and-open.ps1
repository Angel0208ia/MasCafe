param(
    [Parameter(Mandatory = $true)] [string]$Url,
    [Parameter(Mandatory = $true)] [int]$LauncherId
)

# The helper runs hidden and exits if the launcher's console is closed.
$deadline = (Get-Date).AddMinutes(3)
while ((Get-Date) -lt $deadline -and (Get-Process -Id $LauncherId -ErrorAction SilentlyContinue)) {
    try {
        $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
        if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 400) {
            Start-Process $Url
            exit 0
        }
    } catch {
        # Compilation can take a little longer on the first run.
    }
    Start-Sleep -Seconds 1
}
exit 1
