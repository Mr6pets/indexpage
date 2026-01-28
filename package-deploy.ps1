# Deploy Package Script
# Usage: .\package-deploy.ps1

Write-Host "🚀 Starting deployment packaging..." -ForegroundColor Cyan

$rootDir = Get-Location
$deployDir = "$rootDir\deploy_package"

# 1. Clean old directory
if (Test-Path $deployDir) {
    Write-Host "🧹 Cleaning old directory..." -ForegroundColor Yellow
    Remove-Item -Path $deployDir -Recurse -Force
}
New-Item -ItemType Directory -Path $deployDir | Out-Null
New-Item -ItemType Directory -Path "$deployDir\web" | Out-Null
New-Item -ItemType Directory -Path "$deployDir\admin" | Out-Null
New-Item -ItemType Directory -Path "$deployDir\admin-backend" | Out-Null

# 2. Build Main Frontend (Web)
Write-Host "`n📦 [1/3] Building Main Frontend (Web)..." -ForegroundColor Cyan
try {
    npm install
    npm run build
    if ($LASTEXITCODE -ne 0) { throw "Web build failed" }
    Copy-Item -Path "$rootDir\dist\*" -Destination "$deployDir\web" -Recurse
    Write-Host "✅ Web build success" -ForegroundColor Green
} catch {
    Write-Error "❌ Web build error: $_"
    exit 1
}

# 3. Build Admin Frontend
Write-Host "`n📦 [2/3] Building Admin Frontend..." -ForegroundColor Cyan
try {
    Set-Location "$rootDir\admin-backend\admin-frontend"
    npm install
    npm run build-only
    if ($LASTEXITCODE -ne 0) { throw "Admin build failed" }
    Copy-Item -Path "dist\*" -Destination "$deployDir\admin" -Recurse
    Write-Host "✅ Admin build success" -ForegroundColor Green
} catch {
    Write-Error "❌ Admin build error: $_"
    Set-Location $rootDir
    exit 1
}

# 4. Copy Backend Files
Write-Host "`n📦 [3/3] Preparing Backend Files..." -ForegroundColor Cyan
Set-Location "$rootDir\admin-backend"

# Optimized Mode: Copy only essential files
$includeFiles = @(
    "server.js",
    "package.json",
    "package-lock.json",
    "ecosystem.config.js"
)

$includeDirs = @(
    "config",
    "routes",
    "middleware",
    "utils",
    "database"
)

$targetBackendDir = "$deployDir\admin-backend"

Write-Host "   Copying core files..." -ForegroundColor Gray

# Copy files
foreach ($fileName in $includeFiles) {
    if (Test-Path $fileName) {
        Copy-Item -Path $fileName -Destination $targetBackendDir
    }
}

# Handle .env / server-config.env
Write-Host "   Handling configuration files..." -ForegroundColor Gray
if (Test-Path ".env.production") {
    # 复制 .env.production 并重命名为 server-config.env (方便 FTP 上传)
    Copy-Item -Path ".env.production" -Destination "$targetBackendDir\server-config.env"
    Write-Host "      Created server-config.env from .env.production" -ForegroundColor DarkGray
} elseif (Test-Path ".env") {
    Copy-Item -Path ".env" -Destination "$targetBackendDir\server-config.env"
    Write-Host "      Created server-config.env from .env" -ForegroundColor DarkGray
} else {
    # 创建一个模板
    $envTemplate = "DB_HOST=127.0.0.1",
                   "DB_PORT=3306",
                   "DB_USER=root",
                   "DB_PASSWORD=your_password",
                   "DB_NAME=navigation_admin",
                   "",
                   "# 如果您的 Nginx 配置的是 3000 端口，请将下方改为 3000",
                   "PORT=3001",
                   "JWT_SECRET=your_jwt_secret_key"

    Set-Content -Path "$targetBackendDir\server-config.env" -Value $envTemplate -Encoding UTF8
    Write-Host "      Created template server-config.env" -ForegroundColor DarkGray
}

# Create uploads directory
if (-not (Test-Path "$targetBackendDir\uploads")) {
    New-Item -ItemType Directory -Path "$targetBackendDir\uploads" -Force | Out-Null
    Write-Host "      Created uploads directory" -ForegroundColor DarkGray
}

# Copy directories
Write-Host "   Copying directories..." -ForegroundColor Gray
foreach ($dirName in $includeDirs) {
    if (Test-Path $dirName) {
        Copy-Item -Path $dirName -Destination $targetBackendDir -Recurse
    }
}

# Clean up unnecessary files
Write-Host "   Cleaning up unnecessary files..." -ForegroundColor Gray
$cleanupPatterns = @(
    "database\test-*.js",
    "database\*.md"
)

foreach ($pattern in $cleanupPatterns) {
    $pathPattern = Join-Path $targetBackendDir $pattern
    # Use Get-ChildItem to resolve wildcards first
    $itemsToDelete = Get-ChildItem -Path $pathPattern -ErrorAction SilentlyContinue
    
    foreach ($item in $itemsToDelete) {
        Write-Host "      Removing: $($item.Name)" -ForegroundColor DarkGray
        Remove-Item -Path $item.FullName -Force -ErrorAction SilentlyContinue
    }
}

Write-Host "✅ Backend files ready (Optimized)" -ForegroundColor Green

# 4.5 Copy Nginx Configs
Write-Host "`n📦 [4/4] Copying Nginx Configs..." -ForegroundColor Cyan
if (Test-Path "$rootDir\nginx_dist") {
    $nginxTarget = "$deployDir\nginx_config"
    New-Item -ItemType Directory -Path $nginxTarget | Out-Null
    Copy-Item -Path "$rootDir\nginx_dist\*" -Destination $nginxTarget -Recurse
    Write-Host "✅ Nginx configs copied" -ForegroundColor Green
}

# 6. Create DEPLOY_README.md
Write-Host "`n📝 Creating Deployment Instructions..." -ForegroundColor Cyan
Set-Location $rootDir
$readmeContent = "# Deployment Guide",
                 "",
                 "Upload the folders in this directory to your server:",
                 "",
                 "1. 'web' folder -> /home/indexpage/web",
                 "   (Clear existing content first)",
                 "",
                 "2. 'admin' folder -> /home/indexpage/admin",
                 "   (Clear existing content first)",
                 "",
                 "3. 'admin-backend' folder -> /home/indexpage/admin-backend",
                 "   (Run 'npm install' inside this folder on server if needed)",
                 "   (Start with: npm run pm2:start)",
                 "   (Note: 'server-config.env' contains your database settings. Edit it if needed.)",
                 "",
                 "4. 'nginx_config' folder -> /etc/nginx/",
                 "   (Copy contents of conf.d to /etc/nginx/conf.d/)",
                 "   (Run 'nginx -t' and 'systemctl restart nginx')",
                 "",
                 "## 🚨 Troubleshooting (If 502 Error):",
                 "1. Stop PM2: pm2 stop navigation-admin",
                 "2. Check/Edit Port: Open 'server-config.env' and change PORT=3001 to PORT=3000 (if Nginx uses 3000).",
                 "3. Start again: pm2 restart ecosystem.config.js --env production",
                 "4. Check logs: pm2 logs navigation-admin",
                 "",
                 "## Quick Upload Example:",
                 "scp -r deploy_package/web/* root@your_server:/home/indexpage/web/",
                 "scp -r deploy_package/admin/* root@your_server:/home/indexpage/admin/",
                 "scp -r deploy_package/admin-backend/* root@your_server:/home/indexpage/admin-backend/"

Set-Content -Path "$deployDir\DEPLOY_README.md" -Value $readmeContent -Encoding UTF8

Write-Host "`n🎉 Packaging Complete!" -ForegroundColor Green
Write-Host "📂 Output: $deployDir" -ForegroundColor White
Write-Host "📄 Check DEPLOY_README.md for instructions." -ForegroundColor Yellow
