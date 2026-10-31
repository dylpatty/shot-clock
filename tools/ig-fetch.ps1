# Instagram for the Social tab, fetched from this PC. Instagram shows a login wall to GitHub's servers but serves its
# public profile embeds (/<account>/embed/, what websites embed) to a home connection. This saves those pages for 10 NBA
# accounts and uploads them, unchanged, to the repo's `ig-raw` branch; the live data job on GitHub reads them from there.
# Logged out, read-only, about 10 requests per run. Run it by hand, or every 15 minutes with install-ig-task.ps1.
param([string]$Repo = 'https://github.com/dylpatty/shot-clock.git')
$ErrorActionPreference = 'Stop'
$accounts = 'nba', 'houseofhighlights', 'bleacherreport', 'espn', 'nbaonprime', 'slam', 'overtime', 'ballislife', 'nbatv', 'warriors'
$ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36'
$work = Join-Path $env:TEMP 'shot-clock-ig'
if (Test-Path $work) { Remove-Item -Recurse -Force $work }
New-Item -ItemType Directory -Force (Join-Path $work 'raw') | Out-Null

$ok = 0
foreach ($a in $accounts) {
  $out = Join-Path $work "raw\$a.html"
  & curl.exe -s --compressed -m 25 -o $out -A $ua -H 'Accept: text/html,application/xhtml+xml' -H 'Accept-Language: en-US,en;q=0.9' `
    -H 'Sec-Fetch-Dest: iframe' -H 'Sec-Fetch-Mode: navigate' -H 'Sec-Fetch-Site: cross-site' -H 'Referer: https://dylpatty.github.io/' `
    "https://www.instagram.com/$a/embed/"
  if ((Test-Path $out) -and (Select-String -Path $out -SimpleMatch '"contextJSON":"' -Quiet)) { $ok++ } elseif (Test-Path $out) { Remove-Item $out }
  Start-Sleep -Milliseconds 700
}
if ($ok -eq 0) { Write-Output 'Instagram sent no profile embeds this time; nothing uploaded.'; exit 1 }
Set-Content -Path (Join-Path $work 'raw\fetched.txt') -Value ([DateTime]::UtcNow.ToString('o')) -Encoding ascii

Push-Location $work
try {
  git init -q -b ig-raw
  git config user.name 'shot-clock (home PC)'
  git config user.email 'dylpatty@users.noreply.github.com'
  git add -A
  git commit -q -m 'Instagram profile embeds'
  git push -q --force $Repo ig-raw
  Write-Output "Uploaded $ok of $($accounts.Count) Instagram accounts."
} finally { Pop-Location }
