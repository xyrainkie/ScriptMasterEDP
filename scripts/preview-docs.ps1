Param()
$root = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "Building site to docs/ ..."
Push-Location $root
npm run build | Out-Null
Pop-Location

Write-Host "Launching static server at http://localhost:5500 ..."
Start-Process -FilePath "powershell" -ArgumentList "-NoProfile -ExecutionPolicy Bypass -Command npx http-server docs -p 5500 -c-1 -o" -WorkingDirectory $root

