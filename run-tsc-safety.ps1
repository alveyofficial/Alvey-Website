Set-Location "c:\Users\MEMONS\Alvey-Website"
$result = & npx tsc --noEmit 2>&1
$result | Out-File "c:\Users\MEMONS\Alvey-Website\tsc-safety-out.txt" -Encoding utf8
Write-Host "Exit: $LASTEXITCODE"
Write-Host "Lines: $($result.Count)"
