# Keeps Instagram in the Social tab fresh: copies ig-fetch.ps1 to %USERPROFILE%\shot-clock and runs it every 15 minutes
# while you're signed in to Windows, with no window. Instagram stops updating when the PC is off or asleep; the rest of
# the feed doesn't depend on it.
# To remove it:  schtasks /Delete /TN "Shot Clock Instagram" /F
$ErrorActionPreference = 'Stop'
$dir = Join-Path $env:USERPROFILE 'shot-clock'
New-Item -ItemType Directory -Force $dir | Out-Null
$script = Join-Path $dir 'ig-fetch.ps1'
Copy-Item (Join-Path $PSScriptRoot 'ig-fetch.ps1') $script -Force
# A tiny VBScript launcher, so PowerShell runs without flashing a window every 15 minutes
$vbs = Join-Path $dir 'ig-fetch-hidden.vbs'
$cmd = 'powershell.exe -NoProfile -ExecutionPolicy Bypass -File "' + $script + '"'
Set-Content -Path $vbs -Encoding ascii -Value ('CreateObject("WScript.Shell").Run "' + $cmd.Replace('"', '""') + '", 0, False')
schtasks /Create /F /SC MINUTE /MO 15 /TN 'Shot Clock Instagram' /TR ('wscript.exe "' + $vbs + '"') | Out-Null
Write-Output "Installed: Instagram refreshes every 15 minutes from $dir."
