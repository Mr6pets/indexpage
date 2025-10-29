# 数据库同步指南

## 概述
本指南帮助您将当前电脑的MySQL数据库同步到家中电脑的MySQL数据库。

## 导出的数据统计
- **categories**: 6 条记录（分类数据）
- **settings**: 5 条记录（系统设置）
- **sites**: 29 条记录（网站数据）
- **users**: 1 条记录（用户数据）
- **access_logs**: 0 条记录（访问日志）
- **statistics**: 0 条记录（统计数据）

## 文件说明
- `database-export.sql`: 完整的数据库导出文件（10.11 KB）
- `export-database.js`: 数据导出脚本
- `import-database.js`: 数据导入脚本

## 同步步骤

### 第一步：在当前电脑导出数据（已完成）
```bash
cd admin-backend
node export-database.js
```
这会生成 `database-export.sql` 文件。

### 第二步：传输文件到家中电脑
将以下文件复制到家中电脑的项目目录：
1. `database-export.sql` - 数据库导出文件
2. `import-database.js` - 导入脚本
3. `.env` - 环境配置文件（需要根据家中电脑的MySQL配置调整）

### 第三步：在家中电脑配置环境

#### 3.1 安装MySQL（如果未安装）
- Windows: 下载MySQL Installer
- macOS: `brew install mysql`
- Linux: `sudo apt-get install mysql-server`

#### 3.2 启动MySQL服务
```bash
# Windows
net start mysql

# macOS/Linux
sudo systemctl start mysql
# 或
sudo service mysql start
```

#### 3.3 配置.env文件
根据家中电脑的MySQL配置修改 `.env` 文件：
```env
# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=你的MySQL密码
DB_NAME=navigation_admin
```

### 第四步：在家中电脑导入数据
```bash
cd admin-backend
npm install  # 安装依赖（如果还没安装）
node import-database.js
```

### 第五步：验证导入结果
运行以下命令验证数据是否正确导入：
```bash
node check-mysql-data.js
```

## 常见问题解决

### 问题1：MySQL连接失败
**错误**: `Access denied for user 'root'@'localhost'`
**解决方案**:
1. 检查MySQL服务是否启动
2. 验证用户名和密码
3. 确保用户有数据库访问权限

### 问题2：数据库不存在
**错误**: `Unknown database 'navigation_admin'`
**解决方案**:
导入脚本会自动创建数据库，确保MySQL用户有创建数据库的权限。

### 问题3：字符编码问题
**解决方案**:
确保MySQL配置支持utf8mb4字符集：
```sql
SET NAMES utf8mb4;
```

### 问题4：导入文件不存在
**错误**: `导入文件不存在`
**解决方案**:
确保 `database-export.sql` 文件在 `admin-backend` 目录下。

## 手动导入方法（备选）
如果脚本导入失败，可以使用MySQL命令行工具：

```bash
# 登录MySQL
mysql -u root -p

# 创建数据库
CREATE DATABASE IF NOT EXISTS navigation_admin CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 使用数据库
USE navigation_admin;

# 导入数据
SOURCE /path/to/database-export.sql;
```

## 定期同步建议
1. 建议每周或每月进行一次数据同步
2. 可以设置定时任务自动导出数据
3. 重要数据变更后及时同步

## 注意事项
1. 导入前建议备份家中电脑的现有数据
2. 确保两台电脑的MySQL版本兼容
3. 导入会覆盖现有数据，请谨慎操作
4. 如果有自增ID冲突，可能需要手动处理

## 联系支持
如果遇到问题，请检查：
1. MySQL服务状态
2. 网络连接
3. 文件权限
4. 配置文件格式