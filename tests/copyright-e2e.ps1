param(
    [Parameter(Mandatory = $true)][string]$ApiBaseUrl,
    [Parameter(Mandatory = $true)][string]$PublicCertificateCode,
    [Parameter(Mandatory = $true)][string]$CustomerToken,
    [Parameter(Mandatory = $true)][string]$AdminToken,
    [Parameter(Mandatory = $true)][int]$CopyrightId,
    [Parameter(Mandatory = $true)][int]$CustomArtRequestId
)

$ErrorActionPreference = 'Stop'
$base = $ApiBaseUrl.TrimEnd('/')
$customerHeaders = @{ Authorization = "Bearer $CustomerToken" }
$adminHeaders = @{ Authorization = "Bearer $AdminToken" }

$public = Invoke-RestMethod -Method Get -Uri "$base/api/chung-nhan/xac-minh/$([uri]::EscapeDataString($PublicCertificateCode))"
if (-not $public.timThay) { throw 'Public certificate was not found.' }
if ($null -eq $public.toanVen) { throw 'Public response did not report integrity.' }
$publicJson = $public | ConvertTo-Json -Depth 8
if ($publicJson -match '(?i)soDienThoai|email|diaChi|maNguoiDung') { throw 'Public certificate leaked a sensitive customer field.' }

$mine = Invoke-RestMethod -Method Get -Uri "$base/api/chung-nhan/cua-toi" -Headers $customerHeaders
if ($null -eq $mine) { throw 'Customer certificate endpoint did not return a payload.' }

$adminCopyright = Invoke-RestMethod -Method Get -Uri "$base/api/ban-quyen/admin/$CopyrightId" -Headers $adminHeaders
if ($null -eq $adminCopyright.maBanQuyen) { throw 'Admin copyright detail did not return a copyright id.' }

Invoke-RestMethod -Method Get -Uri "$base/api/tranh-theo-yeu-cau/admin/$CustomArtRequestId/thanh-toan" -Headers $adminHeaders | Out-Null

Write-Host 'PASS: COPYRIGHT API E2E READ-ONLY CHECKS COMPLETED'
