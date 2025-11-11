# 阿里云部署指南

## 概述

本项目已成功将模拟数据迁移到本地MySQL数据库，并提供了完整的阿里云部署方案。

## 速查表与快速命令入口
- 速查表：`README-deployment-cheatsheet.md`（精炼版命令与脚本说明、参数与注意事项）
- 常用命令：
  - 构建与产出生产启动文件：`node deploy-production.js`
  - 首次上云部署：`node export-database.js` → `node deploy-to-aliyun.js` → `node verify-aliyun-data.js`
  - 对齐结构（预览→执行）：`node align-aliyun-schema.js --dry-run` → `node align-aliyun-schema.js --execute`
  - 清理阿里云多余记录：`node cleanup-aliyun-extra-records.js --dry-run` → `node cleanup-aliyun-extra-records.js --execute`
  - 数据对比与同步：`node compare-databases.js` → `node sync-to-aliyun.js`
  - 导出/导入入口：`node sync-database.js export|import|check`

## 已完成的工作

### ✅ 本地MySQL数据库设置
- [x] 创建了 `navigation_admin` 数据库
- [x] 导入了所有模拟数据（用户、分类、网站、设置）
- [x] 修改了所有路由配置，优先使用MySQL数据库
- [x] 测试了API功能，确认正常工作

### ✅ 数据统计
- **用户数据**: 0 条（需要重新创建管理员账户）
- **分类数据**: 6 条
- **网站数据**: 29 条
- **设置数据**: 5 条

## 阿里云部署步骤

### 1. 准备阿里云MySQL数据库

1. 登录阿里云控制台
2. 创建RDS MySQL实例
3. 配置数据库参数：
   - 数据库版本：MySQL 8.0 或 5.7
   - 字符集：utf8mb4
   - 时区：Asia/Shanghai

### 2. 配置数据库连接

编辑 `deploy-to-aliyun.js` 文件中的 `aliyunConfig` 对象：

```javascript
const aliyunConfig = {
  host: 'your-rds-instance.mysql.rds.aliyuncs.com',  // 阿里云RDS内网地址
  port: 3306,
  user: 'your_username',                              // 数据库用户名
  password: 'your_password',                          // 数据库密码
  database: 'navigation_admin',
  charset: 'utf8mb4',
  timezone: '+08:00'
};
```

### 3. 执行数据部署

```bash
# 部署数据到阿里云MySQL
node deploy-to-aliyun.js
```

### 4. 配置生产环境

编辑 `.env.production` 文件：

```env
# 阿里云MySQL数据库配置
DB_HOST=your-rds-instance.mysql.rds.aliyuncs.com
DB_PORT=3306
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=navigation_admin

# JWT 配置（请更改为安全的密钥）
JWT_SECRET=your_production_jwt_secret_key_change_this

# CORS 配置
CORS_ORIGIN=https://your-domain.com
```

### 5. 服务器部署

1. **上传代码到阿里云ECS**
   ```bash
   # 使用git或scp上传代码
   git clone your-repository
   cd admin-backend
   ```

2. **安装依赖**
   ```bash
   npm install --production
   ```

3. **启动服务**
   ```bash
   # 使用PM2管理进程
   npm install -g pm2
   pm2 start server.js --name "navigation-admin"
   
   # 或直接启动
   NODE_ENV=production npm start
   ```

## 安全配置

### 1. 数据库安全
- 使用强密码
- 限制数据库访问IP
- 定期备份数据

### 2. 服务器安全
- 配置防火墙规则
- 使用HTTPS证书
- 定期更新系统

### 3. 应用安全
- 更改默认JWT密钥
- 配置CORS白名单
- 启用访问日志

## 监控和维护

### 1. 日志监控
```bash
# 查看PM2日志
pm2 logs navigation-admin

# 查看错误日志
pm2 logs navigation-admin --err
```

### 2. 性能监控
```bash
# 查看进程状态
pm2 status

# 查看资源使用
pm2 monit
```

### 3. 数据备份
```bash
# 定期备份数据库
mysqldump -h your-host -u your-user -p navigation_admin > backup_$(date +%Y%m%d).sql
```

## 故障排除

### 常见问题

1. **数据库连接失败**
   - 检查网络连接
   - 验证数据库配置
   - 确认防火墙设置

2. **权限错误**
   - 检查数据库用户权限
   - 验证文件系统权限

3. **端口冲突**
   - 修改应用端口
   - 检查端口占用情况

### 联系支持

如遇到问题，请检查：
1. 服务器日志
2. 数据库连接状态
3. 网络配置

## 下一步计划

- [ ] 配置SSL证书
- [ ] 设置CDN加速
- [ ] 配置自动备份
- [ ] 添加监控告警