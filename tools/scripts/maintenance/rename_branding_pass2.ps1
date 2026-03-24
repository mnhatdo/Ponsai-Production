$root = "D:\Document\Ki8\WebDev\deploy"
$files = @(
  "README.md",
  "QUICK_START.md",
  "DEV_ENVIRONMENT.md",
  "shared/src/types.ts",
  "frontend/src/environments/environment.prod.ts",
  "frontend/src/app/app.component.ts",
  "frontend/src/assets/i18n/en.json",
  "frontend/src/assets/i18n/vi.json",
  "frontend/src/assets/icons/icons.manifest.ts",
  "docs/ARCHITECTURE.md",
  "docs/CHATBOT_SETUP.md",
  "docs/COLOR_SYSTEM.md",
  "docs/CHANGELOG.md",
  "docs/CONTRIBUTING.md",
  "docs/DATA.md",
  "docs/DEPLOYMENT.md",
  "docs/INDEX.md",
  "docs/OPENSTREETMAP_SETUP.md",
  "docs/REQUEST_FLOWS.md",
  "docs/SHIPPING_SETUP.md",
  "docs/SHIPPING_POLICY.md",
  "docs/changelogs/COLOR_PALETTE_IMPLEMENTATION.md",
  "docs/AI_CUSTOMER_SUPPORT_TRAINING_DATA.txt",
  "backend/src/services/chatbotService.ts"
)

$map = [ordered]@{
  "Furni" = "Ponsai"
  "furni-frontend" = "ponsai-frontend"
  "# Switch to furni database" = "# Switch to ponsai database"
  "use furni" = "use ponsai"
  "mongodb://mongo:27017/furni" = "mongodb://mongo:27017/ponsai"
  "cluster.mongodb.net/furni?retryWrites=true&w=majority" = "cluster.mongodb.net/ponsai?retryWrites=true&w=majority"
  "The page could not be found" = "The page could not be found"
}

$changed = @()
foreach ($rel in $files) {
  $path = Join-Path $root $rel
  if (-not (Test-Path $path)) { continue }

  $content = Get-Content -Path $path -Raw
  $updated = $content
  foreach ($key in $map.Keys) {
    $updated = $updated.Replace($key, $map[$key])
  }

  if ($updated -ne $content) {
    Set-Content -Path $path -Value $updated
    $changed += $rel
  }
}

Write-Output "Updated files: $($changed.Count)"
$changed | ForEach-Object { Write-Output " - $_" }
