$envFile = "backend/.env"
if (Test-Path $envFile) {
    $content = Get-Content $envFile
    $dbPass = ($content | Select-String "DB_PASSWORD=(.*)").Matches.Groups[1].Value
    $jwtSecret = ($content | Select-String "JWT_SECRET=(.*)").Matches.Groups[1].Value
    $mailKey = ($content | Select-String "BREVO_SMTP_KEY=(.*)").Matches.Groups[1].Value

    $vars = @{
        "DB_PASSWORD" = $dbPass;
        "JWT_SECRET" = $jwtSecret;
        "BREVO_SMTP_KEY" = $mailKey
    }

    foreach ($key in $vars.Keys) {
        $val = $vars[$key]
        if ($val -and $val -ne "") {
            $output = git log --all --format=%h -S"$val" --name-only
            if ($output) {
                Write-Host "$key : MATCHES FOUND"
                Write-Host $output
            } else {
                Write-Host "$key : not found"
            }
        } else {
            Write-Host "$key : Empty in .env"
        }
    }
} else {
    Write-Host ".env not found"
}

Write-Host "--- ALL .env* files in history ---"
git log --all --name-only --oneline | Select-String ".env" | Sort-Object -Unique
