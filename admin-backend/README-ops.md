# 运行与运维手册（Aliyun 专项）

本手册介绍 3 个新增脚本与操作流程：

- `create-aliyun-db-user.js`：创建阿里云 MySQL 专用低权限账号并授权
- `cleanup-aliyun-extra-records.js`：清理阿里云端多余记录（支持干跑预览与备份）
- `align-aliyun-schema.js`：对齐阿里云表结构（int(11) 与时间字段）

> 速查入口：请参考 `README-deployment-cheatsheet.md`（部署脚本速查表，含高频命令、参数与注意事项）。

## 环境准备

- 在 `admin-backend/.env` 中配置阿里云数据库连接：
  - `ALIYUN_DB_HOST` / `ALIYUN_DB_PORT`
  - `ALIYUN_DB_USER` / `ALIYUN_DB_PASSWORD`
  - `ALIYUN_DB_NAME`
- 若执行创建账号与授权，建议使用有 `CREATE USER` / `GRANT` 权限的账号（通常为 `root`）。
- 强烈建议在执行任何修改前，做好数据库备份（可用 `export-database.js` 或 RDS 快照）。

## 1. 创建阿里云专用数据库账号并授权

脚本：`create-aliyun-db-user.js`

作用：创建一个仅限目标库、最小权限、可限制来源主机的应用账号。

用法示例：

```
node create-aliyun-db-user.js --username nav_admin --host % --password "Your_Strong_Pwd!" --db navigation_admin
node create-aliyun-db-user.js --username nav_admin --host 1.2.3.4 --password "Your_Strong_Pwd!" --db navigation_admin
```

参数说明：

- `--username`：新建账号名（默认 `nav_admin`）
- `--host`：来源主机（默认 `%`，可替换为固定公网IP以提升安全）
- `--password`：账号密码（必填）
- `--db`：授权的数据库名（默认读取 `ALIYUN_DB_NAME`）
- `--privileges`：授权的权限集合（默认 `SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX`）

执行后效果：

- 创建用户（若存在则跳过）
- 将权限授予到指定数据库
- 刷新权限

## 2. 清理阿里云端多余记录（带干跑预览）

脚本：`cleanup-aliyun-extra-records.js`

作用：对比本地与阿里云的 `sites` 表，找出阿里云独有记录；支持干跑预览与备份，并可安全删除。

用法：

```
node cleanup-aliyun-extra-records.js --dry-run   # 默认，仅预览
node cleanup-aliyun-extra-records.js --execute   # 真实执行删除（含事务）
```

执行逻辑：

- 连接本地与阿里云数据库，读取 `sites` 列表
- 以 `name` 字段为对比键，找出阿里云独有记录
- 干跑：生成待删除列表，并在 `admin-backend/backups/` 下生成 SQL 备份文件
- 执行：在事务中逐条删除，失败自动回滚

注意：

- 对比键为 `name`，若你的唯一键策略不同，请修改脚本（例如以主键或唯一索引为准）。
- 删除前务必确认备份文件已生成。

## 3. 对齐阿里云表结构（int(11) 与时间字段）

脚本：`align-aliyun-schema.js`

作用：将阿里云的显示宽度型整数 `int(11)` 统一为 `INT`，并将 `created_at` / `updated_at` 字段统一为 `TIMESTAMP`（带默认值与自动更新），与本地约定保持一致。

用法：

```
node align-aliyun-schema.js --dry-run
node align-aliyun-schema.js --execute
```

执行逻辑：

- 遍历目标表：`users, categories, sites, settings, statistics, access_logs`
- `DESCRIBE` 获取当前列定义，构造需要的 `ALTER TABLE` 语句
- 干跑：打印计划执行的所有 `ALTER` 语句
- 执行：使用事务逐个执行，失败自动回滚

注意：

- `int(11)` 是显示宽度差异，功能上等价于 `INT`；统一后更简洁一致。
- 时间字段统一为 `TIMESTAMP`，与本地建表一致；若存在历史数据，MySQL 会保留数据，仅调整列定义。
- 脚本不会删除阿里云中的额外列（如 `users` 的 `real_name/phone/bio`），避免数据丢失。

## 验证与回归检查

- 数据比对：`node compare-databases.js`
- 结构比对：`node check-table-structure.js`
- 业务验收：启动后端与前端，访问主要功能并检查日志。

## 快速命令入口（运维常用）
- 首次部署到阿里云：
  - `node export-database.js`
  - `node deploy-to-aliyun.js`
  - `node verify-aliyun-data.js`
- 结构对齐与清理（先预览后执行）：
  - 对齐结构：`node align-aliyun-schema.js --dry-run` → `node align-aliyun-schema.js --execute`
  - 清理多余记录：`node cleanup-aliyun-extra-records.js --dry-run` → `node cleanup-aliyun-extra-records.js --execute`
  - 对比验证：`node compare-databases.js`
- 持续同步：
  - `node sync-to-aliyun.js`
- 导出/导入统一入口：
  - 导出：`node sync-database.js export`
  - 导入：`node sync-database.js import`
  - 检查：`node sync-database.js check`

> 提醒：生产环境建议使用 `.env.production` 配置 `ALIYUN_DB_*` 与 `DB_*`，并优先使用低权限账号（如 `nav_admin`）。

## 常见问题

- 权限不足：创建账号/授权需要具备相应权限的连接用户（通常为 `root`）。
- 连接失败：确认 `.env` 中的 `ALIYUN_DB_*` 参数正确，且网络/安全组允许访问。
- 回滚：若对齐或清理出现异常，脚本会回滚事务；必要时用备份文件恢复。

### 注意事项与回滚指南（安全优先）
- 优先使用 `--dry-run`：在执行结构对齐与清理脚本前，先预览将要修改/删除的内容。
- 备份位置：删除前会在 `admin-backend/backups/` 生成 SQL 备份（如 `cleanup_backup_sites_*.sql`）；建议同时做整库导出（`node export-database.js` 或 `mysqldump`）。
- 回滚步骤示例：
  - 登录到阿里云 MySQL，并选择目标库（如 `navigation_admin`）。
  - 执行备份 SQL（如 `cleanup_backup_sites_*.sql`）以恢复被删记录。
  - 如遇外键约束，可在导入前暂时 `SET FOREIGN_KEY_CHECKS = 0;`，导入后 `SET FOREIGN_KEY_CHECKS = 1;`。
- 结构对齐的回退：`align-aliyun-schema.js` 仅规范 `INT` 与时间戳定义，若需完全回退，建议用完整库备份恢复（避免手动反向 ALTER 带来的风险）。
- 权限与账号安全：生产环境使用低权限账号（如 `nav_admin`），限制来源主机（固定公网 IP），定期旋转密码，避免 `root@%`。
- 生产环境配置：将敏感信息放入 `.env.production`，确保仓库忽略（`.gitignore`），并在部署进程中加载生产配置。
- 验证恢复：回滚或修复后，运行 `node compare-databases.js` 与 `node verify-aliyun-data.js`，确认数据与结构一致性、关键功能正常。