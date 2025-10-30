# 阿里云部署检查清单

## 🎯 部署前准备

### ✅ 本地环境检查
- [ ] 本地项目运行正常
- [ ] 数据库连接测试通过
- [ ] 前端构建成功
- [ ] 后端API测试通过
- [ ] 管理后台功能正常

### ✅ 服务器准备
- [ ] 阿里云ECS实例已创建
- [ ] 安全组配置（开放80, 443, 22端口）
- [ ] 域名解析配置
- [ ] SSL证书准备（可选）

### ✅ 数据库准备
- [ ] 阿里云MySQL实例已创建
- [ ] 数据库用户权限配置
- [ ] 网络白名单配置
- [ ] 数据库结构已部署

## 🚀 部署步骤

### 1. 服务器环境配置
```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装PM2
sudo npm install -g pm2

# 安装Nginx
sudo apt install nginx -y

# 安装Git
sudo apt install git -y
```

### 2. 项目部署
```bash
# 创建项目目录
sudo mkdir -p /opt/navigation-admin
sudo mkdir -p /var/www/navigation

# 设置权限
sudo chown -R $USER:$USER /opt/navigation-admin
sudo chown -R $USER:$USER /var/www/navigation

# 上传项目文件
# 方法1: 使用scp
scp -r ./admin-backend/* user@server:/opt/navigation-admin/
scp -r ./dist/* user@server:/var/www/navigation/

# 方法2: 使用git
git clone https://github.com/your-repo.git /opt/navigation-admin
```

### 3. 安装依赖
```bash
cd /opt/navigation-admin
npm install --production

cd admin-frontend
npm install
npm run build
```

### 4. 配置环境变量
```bash
# 编辑生产环境配置
nano .env.production

# 必须修改的配置项：
# - JWT_SECRET: 生成安全的密钥
# - FRONTEND_URL: 实际域名
# - ADMIN_FRONTEND_URL: 管理后台域名
```

### 5. 初始化数据库
```bash
# 部署数据库结构
node deploy-to-aliyun.js

# 创建管理员用户
node create-admin-user.js
```

### 6. 启动服务
```bash
# 使用PM2启动
pm2 start ecosystem.config.js --env production

# 设置开机自启
pm2 startup
pm2 save
```

### 7. 配置Nginx
```bash
# 复制配置文件
sudo cp nginx.conf.example /etc/nginx/sites-available/navigation

# 启用站点
sudo ln -s /etc/nginx/sites-available/navigation /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启Nginx
sudo systemctl restart nginx
```

## 🔍 部署后验证

### ✅ 服务状态检查
```bash
# 检查PM2状态
pm2 status

# 检查Nginx状态
sudo systemctl status nginx

# 检查端口监听
sudo netstat -tlnp | grep :3001
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :443
```

### ✅ 功能测试
- [ ] 主站访问正常: `https://your-domain.com`
- [ ] 管理后台访问正常: `https://admin.your-domain.com`
- [ ] API接口测试: `curl https://your-domain.com/api/health`
- [ ] 管理后台登录功能
- [ ] 数据增删改查功能
- [ ] 文件上传功能

### ✅ 性能检查
- [ ] 页面加载速度
- [ ] API响应时间
- [ ] 数据库查询性能
- [ ] 服务器资源使用情况

## 🛡️ 安全配置

### ✅ 防火墙配置
```bash
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

### ✅ SSL证书配置
```bash
# 使用Let's Encrypt
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com -d admin.your-domain.com
```

### ✅ 安全加固
- [ ] 修改SSH默认端口
- [ ] 禁用root登录
- [ ] 配置fail2ban
- [ ] 设置定期备份

## 📊 监控配置

### ✅ 日志监控
```bash
# 查看应用日志
pm2 logs navigation-admin

# 查看Nginx日志
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### ✅ 性能监控
```bash
# PM2监控
pm2 monit

# 系统监控
htop
df -h
free -h
```

## 🔄 维护操作

### ✅ 定期维护
```bash
# 更新应用
git pull
npm install --production
pm2 restart navigation-admin

# 数据库备份
mysqldump -h 47.100.161.36 -u root -p navigation_admin > backup_$(date +%Y%m%d).sql

# 日志清理
pm2 flush
sudo logrotate -f /etc/logrotate.conf
```

### ✅ 故障排除
- [ ] 检查服务状态
- [ ] 查看错误日志
- [ ] 验证配置文件
- [ ] 测试网络连接
- [ ] 检查磁盘空间

## 📞 紧急联系

### 常用命令
```bash
# 重启服务
pm2 restart navigation-admin

# 重启Nginx
sudo systemctl restart nginx

# 查看实时日志
pm2 logs navigation-admin --lines 100

# 检查端口占用
sudo lsof -i :3001
```

### 回滚操作
```bash
# 停止服务
pm2 stop navigation-admin

# 恢复备份
# ... 根据具体情况操作

# 重启服务
pm2 start navigation-admin
```

## ✅ 部署完成确认

- [ ] 所有服务正常运行
- [ ] 网站功能完整可用
- [ ] 性能指标达标
- [ ] 安全配置完成
- [ ] 监控系统就绪
- [ ] 备份策略实施
- [ ] 文档更新完成

---

**部署日期**: ___________
**部署人员**: ___________
**服务器信息**: ___________
**域名信息**: ___________