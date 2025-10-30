#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 开始生产环境部署准备...\n');

async function deployProduction() {
  try {
    // 1. 检查环境
    console.log('📋 1. 检查部署环境...');
    
    // 检查Node.js版本
    const nodeVersion = process.version;
    console.log(`   Node.js版本: ${nodeVersion}`);
    
    // 检查npm版本
    try {
      const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
      console.log(`   npm版本: ${npmVersion}`);
    } catch (error) {
      console.error('❌ npm未安装或不可用');
      process.exit(1);
    }
    
    // 2. 构建前端项目
    console.log('\n🏗️  2. 构建管理后台前端...');
    const frontendPath = path.join(__dirname, 'admin-frontend');
    
    if (!fs.existsSync(frontendPath)) {
      console.error('❌ 前端项目目录不存在');
      process.exit(1);
    }
    
    process.chdir(frontendPath);
    console.log('   安装前端依赖...');
    execSync('npm install', { stdio: 'inherit' });
    
    console.log('   构建前端项目...');
    execSync('npm run build', { stdio: 'inherit' });
    
    // 3. 准备后端项目
    console.log('\n📦 3. 准备后端项目...');
    process.chdir(__dirname);
    
    console.log('   安装后端依赖...');
    execSync('npm install --production', { stdio: 'inherit' });
    
    // 4. 部署数据库
    console.log('\n🗄️  4. 部署数据库到阿里云...');
    try {
      execSync('node deploy-to-aliyun.js', { stdio: 'inherit' });
      console.log('✅ 数据库部署成功');
    } catch (error) {
      console.log('⚠️  数据库部署失败，请手动检查');
    }
    
    // 5. 创建启动脚本
    console.log('\n📝 5. 创建启动脚本...');
    
    const startScript = `#!/bin/bash
# 生产环境启动脚本

# 设置环境变量
export NODE_ENV=production

# 启动后端服务
echo "🚀 启动后端服务..."
node server.js
`;
    
    fs.writeFileSync('start-production.sh', startScript);
    
    // Windows启动脚本
    const startScriptWin = `@echo off
REM 生产环境启动脚本

REM 设置环境变量
set NODE_ENV=production

REM 启动后端服务
echo 🚀 启动后端服务...
node server.js
`;
    
    fs.writeFileSync('start-production.bat', startScriptWin);
    
    // 6. 创建PM2配置文件
    console.log('\n⚙️  6. 创建PM2配置文件...');
    
    const pm2Config = {
      apps: [{
        name: 'navigation-admin',
        script: 'server.js',
        env: {
          NODE_ENV: 'development'
        },
        env_production: {
          NODE_ENV: 'production',
          PORT: 3001
        },
        instances: 1,
        autorestart: true,
        watch: false,
        max_memory_restart: '1G',
        error_file: './logs/err.log',
        out_file: './logs/out.log',
        log_file: './logs/combined.log',
        time: true
      }]
    };
    
    fs.writeFileSync('ecosystem.config.js', `module.exports = ${JSON.stringify(pm2Config, null, 2)};`);
    
    // 7. 创建nginx配置示例
    console.log('\n🌐 7. 创建Nginx配置示例...');
    
    const nginxConfig = `# Nginx配置示例
server {
    listen 80;
    server_name your-domain.com;
    
    # 重定向到HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    # SSL证书配置
    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;
    
    # 前端静态文件
    location / {
        root /path/to/your/frontend/dist;
        try_files $uri $uri/ /index.html;
    }
    
    # 后端API代理
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # 管理后台
    location /admin/ {
        root /path/to/your/admin-frontend/dist;
        try_files $uri $uri/ /admin/index.html;
    }
}`;
    
    fs.writeFileSync('nginx.conf.example', nginxConfig);
    
    // 8. 创建部署说明
    console.log('\n📖 8. 创建部署说明...');
    
    const deploymentGuide = `# 生产环境部署指南

## 文件说明

本脚本已为您准备了以下文件：

### 配置文件
- \`.env.production\` - 生产环境配置
- \`ecosystem.config.js\` - PM2进程管理配置
- \`nginx.conf.example\` - Nginx配置示例

### 启动脚本
- \`start-production.sh\` - Linux/Mac启动脚本
- \`start-production.bat\` - Windows启动脚本

## 部署步骤

### 1. 上传文件到服务器
\`\`\`bash
# 使用scp上传（替换为您的服务器信息）
scp -r ./* user@your-server:/path/to/your/app/
\`\`\`

### 2. 安装PM2（推荐）
\`\`\`bash
npm install -g pm2
\`\`\`

### 3. 启动应用
\`\`\`bash
# 使用PM2启动
pm2 start ecosystem.config.js --env production

# 或直接启动
NODE_ENV=production node server.js
\`\`\`

### 4. 配置Nginx（可选）
\`\`\`bash
# 复制nginx配置
sudo cp nginx.conf.example /etc/nginx/sites-available/your-site
sudo ln -s /etc/nginx/sites-available/your-site /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
\`\`\`

### 5. 设置开机自启
\`\`\`bash
pm2 startup
pm2 save
\`\`\`

## 监控和维护

### 查看应用状态
\`\`\`bash
pm2 status
pm2 logs navigation-admin
\`\`\`

### 重启应用
\`\`\`bash
pm2 restart navigation-admin
\`\`\`

### 更新应用
\`\`\`bash
git pull
npm install --production
pm2 restart navigation-admin
\`\`\`

## 注意事项

1. 请修改 \`.env.production\` 中的JWT密钥
2. 配置正确的域名和SSL证书
3. 定期备份数据库
4. 监控服务器资源使用情况
`;
    
    fs.writeFileSync('DEPLOYMENT.md', deploymentGuide);
    
    // 9. 创建logs目录
    const logsDir = path.join(__dirname, 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir);
    }
    
    console.log('\n✅ 生产环境部署准备完成！');
    console.log('\n📋 生成的文件：');
    console.log('   - .env.production (生产环境配置)');
    console.log('   - ecosystem.config.js (PM2配置)');
    console.log('   - nginx.conf.example (Nginx配置示例)');
    console.log('   - start-production.sh/.bat (启动脚本)');
    console.log('   - DEPLOYMENT.md (部署说明)');
    console.log('   - logs/ (日志目录)');
    
    console.log('\n🎯 下一步：');
    console.log('1. 修改 .env.production 中的配置');
    console.log('2. 上传文件到阿里云服务器');
    console.log('3. 按照 DEPLOYMENT.md 进行部署');
    
  } catch (error) {
    console.error('❌ 部署准备失败:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  deployProduction();
}

module.exports = { deployProduction };