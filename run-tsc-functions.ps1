Set-Location "c:\Users\MEMONS\Alvey-Website\functions"
$result = & npx tsc --noEmit 2>&1
$result | Out-File "c:\Users\MEMONS\Alvey-Website\.agents\tasks\tsc-functions-out.txt" -Encoding utf8
Write-Host "Exit: $LASTEXITCODE"
Write-Host "Lines: $($result.Count)"
