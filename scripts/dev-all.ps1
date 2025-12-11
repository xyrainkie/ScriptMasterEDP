Param()
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$project = Split-Path -Parent $scriptDir

Write-Host "Starting frontend dev server (http://localhost:3000) ..."
Start-Process -FilePath "powershell" -ArgumentList "-NoProfile -ExecutionPolicy Bypass -Command npm run dev" -WorkingDirectory $project

Write-Host "Starting backend dev server ..."
Start-Process -FilePath "powershell" -ArgumentList "-NoProfile -ExecutionPolicy Bypass -Command npm run dev" -WorkingDirectory (Join-Path $project "backend")

Write-Host "Both servers started. Frontend: http://localhost:3000"
