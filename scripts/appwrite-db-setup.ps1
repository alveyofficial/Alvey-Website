$base = "https://fra.cloud.appwrite.io/v1"
$headers = @{
    "x-appwrite-project" = "tutorslink"
    "x-appwrite-key" = "standard_d0e51e83b95d75408dc323375e19f7880bfeb9fdbf616bd2885bb5d7db2569bf5ff4a94dfbf01db0d2d02ed221055c440ef9b840f69e7eb7d77d35629c6f5c8ca0ed2276788d776d06eb673dc0eb1b4420c668514caee23d161d345ff3ed1475983cf27648041d540d37bce1420aa0780a8a1027ffcd2f5904112f4b87a6342c"
    "Content-Type" = "application/json"
}
$dbId = "Database"

function Add-StringAttr($collId, $key, $size, $required, $default = $null, $array = $false) {
    $body = @{ key = $key; size = $size; required = $required; array = $array }
    if ($null -ne $default) { $body.default = $default }
    try {
        Invoke-RestMethod -Uri "$base/databases/$dbId/collections/$collId/attributes/string" -Method POST -Headers $headers -Body ($body | ConvertTo-Json) | Out-Null
        Write-Host "  + $key (string)" -ForegroundColor Green
    } catch {
        $msg = ($_.ErrorDetails.Message | ConvertFrom-Json -ErrorAction SilentlyContinue).message
        Write-Host "  ! $key (string): $msg" -ForegroundColor Yellow
    }
}

function Add-TextAttr($collId, $key, $required) {
    $body = @{ key = $key; required = $required }
    try {
        Invoke-RestMethod -Uri "$base/databases/$dbId/collections/$collId/attributes/string" -Method POST -Headers $headers -Body ($body | ConvertTo-Json) | Out-Null
        Write-Host "  + $key (text)" -ForegroundColor Green
    } catch {
        $msg = ($_.ErrorDetails.Message | ConvertFrom-Json -ErrorAction SilentlyContinue).message
        Write-Host "  ! $key (text): $msg" -ForegroundColor Yellow
    }
}

function Add-DatetimeAttr($collId, $key, $required) {
    $body = @{ key = $key; required = $required }
    try {
        Invoke-RestMethod -Uri "$base/databases/$dbId/collections/$collId/attributes/datetime" -Method POST -Headers $headers -Body ($body | ConvertTo-Json) | Out-Null
        Write-Host "  + $key (datetime)" -ForegroundColor Green
    } catch {
        $msg = ($_.ErrorDetails.Message | ConvertFrom-Json -ErrorAction SilentlyContinue).message
        Write-Host "  ! $key (datetime): $msg" -ForegroundColor Yellow
    }
}

function Add-BoolAttr($collId, $key, $required, $default) {
    $body = @{ key = $key; required = $required; default = $default }
    try {
        Invoke-RestMethod -Uri "$base/databases/$dbId/collections/$collId/attributes/boolean" -Method POST -Headers $headers -Body ($body | ConvertTo-Json) | Out-Null
        Write-Host "  + $key (boolean)" -ForegroundColor Green
    } catch {
        $msg = ($_.ErrorDetails.Message | ConvertFrom-Json -ErrorAction SilentlyContinue).message
        Write-Host "  ! $key (boolean): $msg" -ForegroundColor Yellow
    }
}

function Add-IntAttr($collId, $key, $required, $default = $null) {
    $body = @{ key = $key; required = $required }
    if ($null -ne $default) { $body.default = $default }
    try {
        Invoke-RestMethod -Uri "$base/databases/$dbId/collections/$collId/attributes/integer" -Method POST -Headers $headers -Body ($body | ConvertTo-Json) | Out-Null
        Write-Host "  + $key (integer)" -ForegroundColor Green
    } catch {
        $msg = ($_.ErrorDetails.Message | ConvertFrom-Json -ErrorAction SilentlyContinue).message
        Write-Host "  ! $key (integer): $msg" -ForegroundColor Yellow
    }
}

function Add-DoubleAttr($collId, $key, $required) {
    $body = @{ key = $key; required = $required }
    try {
        Invoke-RestMethod -Uri "$base/databases/$dbId/collections/$collId/attributes/float" -Method POST -Headers $headers -Body ($body | ConvertTo-Json) | Out-Null
        Write-Host "  + $key (double/float)" -ForegroundColor Green
    } catch {
        $msg = ($_.ErrorDetails.Message | ConvertFrom-Json -ErrorAction SilentlyContinue).message
        Write-Host "  ! $key (double/float): $msg" -ForegroundColor Yellow
    }
}

function Create-Collection($id, $name) {
    $body = @{ collectionId = $id; name = $name; documentSecurity = $false } | ConvertTo-Json
    try {
        Invoke-RestMethod -Uri "$base/databases/$dbId/collections" -Method POST -Headers $headers -Body $body | Out-Null
        Write-Host "Collection '$name' ($id) created" -ForegroundColor Cyan
        return $true
    } catch {
        $msg = ($_.ErrorDetails.Message | ConvertFrom-Json -ErrorAction SilentlyContinue).message
        Write-Host "Collection '$name' ($id): $msg" -ForegroundColor Yellow
        return $false
    }
}

# ==============================
# STEP 2: homework collection
# ==============================
Write-Host "`n== STEP 2: Creating 'homework' collection ==" -ForegroundColor Magenta
Create-Collection "homework" "Homework"
Add-StringAttr "homework" "tutorId" 255 $true
Add-StringAttr "homework" "studentId" 255 $true
Add-StringAttr "homework" "title" 255 $true
Add-TextAttr "homework" "instructions" $false
Add-DatetimeAttr "homework" "dueDate" $false
Add-StringAttr "homework" "status" 50 $false "assigned"
Add-StringAttr "homework" "fileIds" 255 $false $null $true
Add-StringAttr "homework" "fileNames" 255 $false $null $true
Add-StringAttr "homework" "submissionFileIds" 255 $false $null $true
Add-StringAttr "homework" "submissionFileNames" 255 $false $null $true
Add-DatetimeAttr "homework" "submittedAt" $false
Add-DatetimeAttr "homework" "createdAt" $true
Add-BoolAttr "homework" "isDeleted" $false $false

# ==============================
# STEP 3: chat_conversations collection
# ==============================
Write-Host "`n== STEP 3: Creating 'chat_conversations' collection ==" -ForegroundColor Magenta
Create-Collection "chat_conversations" "Chat Conversations"
Add-StringAttr "chat_conversations" "studentId" 255 $true
Add-StringAttr "chat_conversations" "tutorId" 255 $true
Add-DatetimeAttr "chat_conversations" "lastMessageAt" $false
Add-StringAttr "chat_conversations" "lastMessagePreview" 255 $false
Add-IntAttr "chat_conversations" "studentUnreadCount" $false 0
Add-IntAttr "chat_conversations" "tutorUnreadCount" $false 0
Add-DatetimeAttr "chat_conversations" "createdAt" $true
Add-BoolAttr "chat_conversations" "isDeleted" $false $false

# ==============================
# STEP 4: chat_messages collection
# ==============================
Write-Host "`n== STEP 4: Creating 'chat_messages' collection ==" -ForegroundColor Magenta
Create-Collection "chat_messages" "Chat Messages"
Add-StringAttr "chat_messages" "conversationId" 255 $true
Add-StringAttr "chat_messages" "senderId" 255 $true
Add-StringAttr "chat_messages" "senderRole" 50 $true
Add-TextAttr "chat_messages" "body" $false
Add-StringAttr "chat_messages" "fileIds" 255 $false $null $true
Add-StringAttr "chat_messages" "fileNames" 255 $false $null $true
Add-BoolAttr "chat_messages" "isRead" $false $false
Add-DatetimeAttr "chat_messages" "createdAt" $true
Add-BoolAttr "chat_messages" "isDeleted" $false $false

# ==============================
# STEP 5: recordings collection
# ==============================
Write-Host "`n== STEP 5: Creating 'recordings' collection ==" -ForegroundColor Magenta
Create-Collection "recordings" "Recordings"
Add-StringAttr "recordings" "lessonId" 255 $false
Add-StringAttr "recordings" "tutorId" 255 $true
Add-StringAttr "recordings" "studentIds" 255 $false $null $true
Add-StringAttr "recordings" "title" 255 $true
Add-TextAttr "recordings" "description" $false
Add-StringAttr "recordings" "fileId" 255 $false
Add-StringAttr "recordings" "fileName" 255 $false
Add-StringAttr "recordings" "externalUrl" 2048 $false
Add-StringAttr "recordings" "storageProvider" 50 $false "appwrite"
Add-IntAttr "recordings" "durationSeconds" $false
Add-StringAttr "recordings" "subject" 255 $false
Add-DatetimeAttr "recordings" "recordedAt" $false
Add-DatetimeAttr "recordings" "createdAt" $true
Add-BoolAttr "recordings" "isDeleted" $false $false

# ==============================
# STEP 6: payments collection
# ==============================
Write-Host "`n== STEP 6: Creating 'payments' collection ==" -ForegroundColor Magenta
Create-Collection "payments" "Payments"
Add-StringAttr "payments" "tutorId" 255 $true
Add-StringAttr "payments" "studentId" 255 $false
Add-StringAttr "payments" "lessonId" 255 $false
Add-DoubleAttr "payments" "amountGbp" $true
Add-StringAttr "payments" "status" 50 $false "pending"
Add-StringAttr "payments" "description" 255 $false
Add-DatetimeAttr "payments" "periodStart" $false
Add-DatetimeAttr "payments" "periodEnd" $false
Add-DatetimeAttr "payments" "paidAt" $false
Add-DatetimeAttr "payments" "createdAt" $true
Add-BoolAttr "payments" "isDeleted" $false $false

Write-Host "`n== ALL COLLECTIONS DONE ==" -ForegroundColor Magenta
