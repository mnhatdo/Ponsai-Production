$root = "D:\Document\Ki8\WebDev\deploy"
$files = @(
  "README.md",
  "QUICK_START.md",
  "DEV_ENVIRONMENT.md",
  "docs/DEPLOYMENT.md",
  "docs/ARCHITECTURE.md",
  "docs/FRONTEND.md",
  "docs/INDEX.md",
  "docs/DATA.md",
  "docs/REQUEST_FLOWS.md",
  "docs/CHATBOT_SETUP.md",
  "docs/CONTRIBUTING.md",
  "docs/CHANGELOG.md",
  "docs/changelogs/BANK_TRANSFER_REDESIGN.md",
  "docs/changelogs/COLOR_PALETTE_IMPLEMENTATION.md",
  "docs/AI_CUSTOMER_SUPPORT_TRAINING_DATA.txt",
  "backend/.env.example",
  "backend/check-users.js",
  "backend/src/config/database.ts",
  "backend/src/controllers/chatbotController.ts",
  "backend/src/routes/blogRoutes.ts",
  "backend/src/services/chatbotService.ts",
  "backend/src/services/momoService.ts",
  "backend/data/seeds/seed-admin.ts",
  "backend/data/seeds/seed-bonsai.ts",
  "backend/data/seeds/seed-test-users.ts",
  "backend/scripts/aggregate-metrics.js",
  "backend/scripts/backup-json-dump.js",
  "backend/scripts/check-db.js",
  "backend/scripts/check-promotions.js",
  "backend/scripts/create-promotions.js",
  "backend/scripts/generate-realistic-data.js",
  "backend/scripts/list-all-users.js",
  "backend/scripts/migrate-payment-lifecycle.js",
  "backend/scripts/sample-queries.js",
  "backend/scripts/verify-data.js",
  "frontend/src/environments/environment.ts",
  "frontend/src/environments/environment.prod.ts",
  "frontend/src/app/app.component.ts",
  "frontend/src/app/core/interceptors/auth.interceptor.ts",
  "frontend/src/app/core/interceptors/error.interceptor.ts",
  "frontend/src/app/core/services/auth.service.ts",
  "frontend/src/app/core/services/cart.service.ts",
  "frontend/src/app/core/services/chatbot.service.ts",
  "frontend/src/assets/i18n/en.json",
  "frontend/src/assets/i18n/vi.json",
  "frontend/src/assets/icons/icons.manifest.ts",
  "shared/src/types.ts"
)

$map = [ordered]@{
  "FurniShop" = "PonsaiShop"
  "Furni Shop" = "Ponsai Shop"
  "FurniBlog" = "PonsaiBlog"
  "BonSight" = "Ponsai"
  "FURNI" = "PONSAI"
  "Furni Ltd" = "Ponsai JSC"
  "BonSight Ltd" = "Ponsai JSC"
  "Company Name: Furni (Ponsai)" = "Company Name: Ponsai JSC"
  "Furni (Ponsai)" = "Ponsai JSC"
  "support@furni.vn" = "support@ponsai.vn"
  "shipping@furni.vn" = "shipping@ponsai.vn"
  "wholesale@furni.vn" = "wholesale@ponsai.vn"
  "fb.com/furni.vietnam" = "fb.com/ponsai.vn"
  "@furni.vietnam" = "@ponsai.vn"
  "furni_token" = "ponsai_token"
  "furni_cart" = "ponsai_cart"
  "mongodb://localhost:27017/furni_test" = "mongodb://localhost:27017/ponsai_test"
  "mongodb://localhost:27017/furni" = "mongodb://localhost:27017/ponsai"
  "mongodb://mongodb:27017/furni" = "mongodb://mongodb:27017/ponsai"
  "cluster>.mongodb.net/furni?retryWrites=true&w=majority" = "cluster>.mongodb.net/ponsai?retryWrites=true&w=majority"
  "cluster>.mongodb.net/furni" = "cluster>.mongodb.net/ponsai"
  "--db furni" = "--db ponsai"
  "/backup/20251231/furni" = "/backup/20251231/ponsai"
  "furni-api" = "ponsai-api"
  "furni-1.0.0" = "ponsai-2.0.0"
  "furni.git" = "ponsai.git"
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
