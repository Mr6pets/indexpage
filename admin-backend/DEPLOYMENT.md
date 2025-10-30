# 生产环境部署指南

## 文件说明

本项目已为您准备了以下部署文件：

### 配置文件
- `.env.production` - 生产环境配置
- `ecosystem.config.js` - PM2进程管理配置
- `nginx.conf.example` - Nginx配置示例

### 启动脚本
- `start-production.sh` - Linux/Mac启动脚本
- `start-production.bat` - Windows启动脚本

## 部署步骤

### 1. 服务器准备

#### 安装Node.js
```bash
# 使用NodeSource仓库安装Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 验证安装
node --version
npm --version
```

#### 安装PM2
```bash
sudo npm install -g pm2
```

#### 安装MySQL（如果需要）
```bash
sudo apt update
sudo apt install mysql-server
sudo mysql_secure_installation
```

### 2. 上传文件到服务器

#### 方法1：使用scp
```bash
# 上传后端项目
scp -r ./admin-backend user@your-server:/opt/navigation-admin/

# 上传主项目构建文件
scp -r ./dist user@your-server:/var/www/navigation/
```

#### 方法2：使用git
```bash
# 在服务器上克隆项目
git clone https://github.com/your-username/your-repo.git
cd your-repo
```

### 3. 安装依赖

```bash
cd /opt/navigation-admin
npm install --production
```

### 4. 构建前端

```bash
cd admin-frontend
npm install
npm run build
```

### 5. 配置环境变量

编辑 `.env.production` 文件：

```bash
nano .env.production
```

**重要配置项：**
- `JWT_SECRET`: 更改为安全的随机字符串
- `DB_HOST`, `DB_USER`, `DB_PASSWORD`: 数据库连接信息
- `FRONTEND_URL`, `ADMIN_FRONTEND_URL`: 实际域名

### 6. 初始化数据库

```bash
# 运行数据库部署脚本
node deploy-to-aliyun.js

# 创建管理员用户
node create-admin-user.js
```

### 7. 启动应用

#### 使用PM2启动（推荐）
```bash
pm2 start ecosystem.config.js --env production
```

#### 直接启动
```bash
NODE_ENV=production node server.js
```

### 8. 配置Nginx

#### 安装Nginx
```bash
sudo apt install nginx
```

#### 配置文件
创建 `/etc/nginx/sites-available/navigation`：

```nginx
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
    
    # 主导航页面
    location / {
        root /var/www/navigation;
        try_files $uri $uri/ /index.html;
    }
    
    # 后端API
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
}

# 管理后台子域名
server {
    listen 443 ssl http2;
    server_name admin.your-domain.com;
    
    # SSL证书配置
    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;
    
    # 管理后台
    location / {
        root /opt/navigation-admin/admin-frontend/dist;
        try_files $uri $uri/ /index.html;
    }
}
```

#### 启用站点
```bash
sudo ln -s /etc/nginx/sites-available/navigation /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 9. 设置开机自启

```bash
pm2 startup
pm2 save
```

### 10. 配置防火墙

```bash
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

## 监控和维护

### 查看应用状态
```bash
pm2 status
pm2 logs navigation-admin
pm2 monit
```

### 重启应用
```bash
pm2 restart navigation-admin
```

### 更新应用
```bash
git pull
npm install --production
cd admin-frontend && npm run build && cd ..
pm2 restart navigation-admin
```

### 备份数据库
```bash
mysqldump -u root -p navigation_admin > backup_$(date +%Y%m%d_%H%M%S).sql
```

## 故障排除

### 常见问题

1. **端口被占用**
   ```bash
   sudo lsof -i :3001
   sudo kill -9 <PID>
   ```

2. **权限问题**
   ```bash
   sudo chown -R $USER:$USER /opt/navigation-admin
   ```

3. **数据库连接失败**
   - 检查MySQL服务状态
   - 验证数据库配置
   - 检查防火墙设置

4. **Nginx配置错误**
   ```bash
   sudo nginx -t
   sudo systemctl status nginx
   ```

### 日志位置
- 应用日志: `/opt/navigation-admin/logs/`
- Nginx日志: `/var/log/nginx/`
- PM2日志: `~/.pm2/logs/`

## 安全建议

1. **定期更新**
   - 系统包更新
   - Node.js和npm更新
   - 依赖包更新

2. **SSL证书**
   - 使用Let's Encrypt免费证书
   - 定期更新证书

3. **数据库安全**
   - 使用强密码
   - 限制数据库访问IP
   - 定期备份

4. **监控**
   - 设置服务器监控
   - 配置日志轮转
   - 监控磁盘空间

## 性能优化

1. **启用Gzip压缩**
2. **配置缓存策略**
3. **使用CDN**
4. **数据库索引优化**

## 联系支持

如遇到部署问题，请检查：
1. 服务器日志
2. 应用日志
3. 数据库连接
4. 网络配置