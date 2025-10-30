#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 开始完整项目部署准备...\n');

async function deployAll() {
  try {
    const rootDir = __dirname;
    const backendDir = path.join(rootDir, 'admin-backend');
    
    // 1. 构建主前端项目
    console.log('🏗️  1. 构建主导航页面...');
    process.chdir(rootDir);
    
    console.log('   安装主项目依赖...');
    execSync('npm install', { stdio: 'inherit' });
    
    console.log('   构建主项目...');
    execSync('npm run build', { stdio: 'inherit' });
    
    // 2. 运行后端部署脚本
    console.log('\n📦 2. 准备后端管理系统...');
    process.chdir(backendDir);
    
    if (fs.existsSync('deploy-production.js')) {
      execSync('node deploy-production.js', { stdio: 'inherit' });
    } else {
      console.log('⚠️  后端部署脚本不存在，请手动运行');
    }
    
    // 3. 创建完整的部署包结构说明
    process.chdir(rootDir);
    console.log('\n📋 3. 创建部署包说明...');
    
    const deploymentStructure = `# 完整项目部署结构

## 项目结构
\`\`\`
/your-server-path/
├── dist/                          # 主导航页面构建文件
├── admin-backend/                 # 后端API服务
│   ├── admin-frontend/dist/       # 管理后台前端构建文件
│   ├── server.js                  # 后端服务入口
│   ├── .env.production           # 生产环境配置
│   ├── ecosystem.config.js       # PM2配置
│   └── ...
└── nginx.conf                     # Nginx配置
\`\`\`

## 部署步骤

### 1. 上传文件
\`\`\`bash
# 上传主项目构建文件
scp -r ./dist/* user@server:/var/www/navigation/

# 上传后端项目
scp -r ./admin-backend user@server:/opt/navigation-admin/
\`\`\`

### 2. 配置Nginx
\`\`\`nginx
server {
    listen 80;
    server_name your-domain.com;
    
    # 主导航页面
    location / {
        root /var/www/navigation;
        try_files $uri $uri/ /index.html;
    }
    
    # 后端API
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 80;
    server_name admin.your-domain.com;
    
    # 管理后台
    location / {
        root /opt/navigation-admin/admin-frontend/dist;
        try_files $uri $uri/ /index.html;
    }
}
\`\`\`

### 3. 启动服务
\`\`\`bash
cd /opt/navigation-admin
pm2 start ecosystem.config.js --env production
\`\`\`

## 域名配置建议

- 主站：https://your-domain.com
- 管理后台：https://admin.your-domain.com
- API：https://your-domain.com/api

## 安全建议

1. 配置SSL证书
2. 设置防火墙规则
3. 定期更新依赖
4. 监控服务状态
5. 定期备份数据库
`;
    
    fs.writeFileSync('DEPLOYMENT-FULL.md', deploymentStructure);
    
    console.log('\n✅ 完整项目部署准备完成！');
    console.log('\n📁 构建文件位置：');
    console.log('   - 主项目：./dist/');
    console.log('   - 管理后台：./admin-backend/admin-frontend/dist/');
    console.log('   - 后端服务：./admin-backend/');
    
    console.log('\n📖 部署文档：');
    console.log('   - DEPLOYMENT-FULL.md (完整部署指南)');
    console.log('   - admin-backend/DEPLOYMENT.md (后端部署指南)');
    
  } catch (error) {
    console.error('❌ 部署准备失败:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  deployAll();
}

module.exports = { deployAll };