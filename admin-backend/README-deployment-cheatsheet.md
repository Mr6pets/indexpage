# 注意与回滚指南（安全优先 / Notes and Rollback Guide）

## 检查脚本速查（Check Scripts Cheatsheet）
- 运行全部检查：`npm run check:all`
- API 数据检查：`npm run check:api`
- 当前网站详情：`npm run check:sites`
- 本地 MySQL 数据：`npm run check:db`
- 网站计数与状态：`npm run check:counts`
- 用户数据检查：`npm run check:users`
- 表结构对比（本地 vs 阿里云）：`npm run check:structure`
- 阿里云网站图标检查：`npm run check:aliyun:icons`

前置条件：
- 本地服务已启动（`npm start`），用于 API 类检查。
- `.env` 已配置本地/阿里云数据库连接信息（`DB_*` 和 `ALIYUN_DB_*`）。

常见问题：
- 端口占用（`3001`）：释放端口后再启动服务。
- 数据库连接失败：检查 `.env` 主机、用户名、密码与库名是否一致。

## 冒烟测试速查表（Smoke Tests）
- 启动后端后运行以下命令快速验收核心功能：
  - `npm run smoke:login` → 验证登录与令牌获取
  - `npm run smoke:integration` → 验证分类/网站 API 与简单关联
  - `npm run smoke:dashboard` → 验证带鉴权的仪表盘统计概览
  - `npm run smoke:verify-aliyun` →（部署到阿里云后）验证云端数据一致性
- 一键冒烟（本地）：`npm run smoke`

> 说明：已合并并删除重复的 `test-*`/`verify-*` 脚本，仅保留上述代表性脚本以减少维护成本。

在执行任何会变更数据或结构的脚本前，请先做好以下安全动作：
- 优先使用预览模式：对齐/清理类脚本请先运行 `--dry-run` 或预览命令，确认影响范围再执行。
- 先备份再变更：使用导出脚本生成 `admin-backend/database-export.sql`，或确认脚本会在 `admin-backend/backups/` 自动生成回滚文件。
- 最小权限原则：为生产环境使用受限账号（如 `nav_admin`），避免使用 `root@%`；在阿里云请仅授予必要的库级权限。
- 生产配置独立：使用 `.env.production` 并妥善保管，避免将敏感信息提交到版本库。
- 回滚路径清晰：出现误删或错误变更时，优先从最近备份（`backups/` 或 `database-export.sql`）恢复；必要时先重建库表再导入。
- 事后验证必做：使用检查/验证脚本（如 `verify-aliyun-data.js`、`check-db-count.js`、`compare-databases.js`）确认数据量、结构与预期一致。

更多细节与演练步骤见 `README-ops.md` 的“Notes and Rollback Guide (Safety First)”章节。

# 部署脚本速查表（精简版）

面向生产部署与阿里云同步/对齐的高频脚本与常用命令示例。确保 `.env` 或 `.env.production` 已正确配置 `DB_*` 与 `ALIYUN_DB_*`。

## 环境准备
- 配置 `admin-backend/.env` 或 `admin-backend/.env.production`
  - 本地：`DB_HOST`、`DB_PORT`、`DB_USER`、`DB_PASSWORD`、`DB_NAME`
  - 阿里云：`ALIYUN_DB_HOST`、`ALIYUN_DB_PORT`、`ALIYUN_DB_USER`、`ALIYUN_DB_PASSWORD`、`ALIYUN_DB_NAME`
- 建议使用低权限账号（如 `nav_admin`），避免 `root@%`。

## 核心部署
- 运行生产部署准备
  - `node deploy-production.js`
  - 构建前端、安装后端依赖、生成 `start-production.*`、`ecosystem.config.js`、`nginx.conf.example`、`DEPLOYMENT.md`
- 部署到阿里云（创建库表并导入 `database-export.sql`）
  - `node deploy-to-aliyun.js`
- 需存在 `admin-backend/database-export.sql`

## 阿里云同步/对齐
- 本地 → 阿里云（插入/更新，不删除）
  - `node sync-to-aliyun.js`
- 数据对比（本地 vs 阿里云）
  - `node compare-databases.js`
- 结构对齐（标准化 `INT` 与时间戳）
  - 预览：`node align-aliyun-schema.js --dry-run`
  - 执行：`node align-aliyun-schema.js --execute`
- 清理阿里云多余记录（默认：`sites` 表，含重复清理）
  - 预览：`node cleanup-aliyun-extra-records.js --dry-run`
  - 执行：`node cleanup-aliyun-extra-records.js --execute`
- 结构差异检查
  - `node check-table-structure.js`
- 结构同步示例（为 `users` 添加 `real_name/phone/bio`）
  - `node sync-table-structure.js`

## 导出/导入
- 导出当前数据库到 `database-export.sql`
  - `node export-database.js`
- 从 `database-export.sql` 导入到当前数据库
  - `node import-database.js`
- 统一入口（导出/导入/检查）
  - 导出：`node sync-database.js export`
  - 导入：`node sync-database.js import`
  - 检查：`node sync-database.js check`

## 验证与启动
- 验证阿里云数据（概览 + 完整性检查）
  - `node verify-aliyun-data.js`
- 快速检查当前数据库连接与关键数据
  - `node check-mysql-data.js`
- 使用 PM2 启动生产后端
  - `pm2 start ecosystem.config.js --env production`
- 直接启动后端（需设置生产环境变量）
  - `NODE_ENV=production node server.js`

## 快速工作流示例
- 首次上云部署
  - `node export-database.js` → `node deploy-to-aliyun.js` → `node verify-aliyun-data.js`
- 结构对齐 + 数据清理
  - `node compare-databases.js` → `node align-aliyun-schema.js --dry-run/--execute` → `node cleanup-aliyun-extra-records.js --dry-run/--execute` → `node compare-databases.js` → `node verify-aliyun-data.js`
- 持续同步本地变更到阿里云
  - `node sync-to-aliyun.js` → `node verify-aliyun-data.js`

## 安全与回滚提示
- 执行有破坏性的脚本时优先使用 `--dry-run` 预览。
- 删除操作会在 `admin-backend/backups/` 生成备份 SQL（可用于回滚）。
- 为生产环境采用 `.env.production` 并避免将敏感信息提交到仓库。

---
如需将此速查表合并进 `README-deployment.md` 或补充更详细用法，请告知我偏好，我可以同步整理。

## 参数说明与注意事项（脚本速览）
- `deploy-production.js`
  - 参数：无；按预设流程执行（构建前端、安装后端依赖、生成脚本与PM2配置、Nginx示例、部署说明）。
  - 注意：可能调用 `deploy-to-aliyun.js`；首次运行需网络与构建工具可用；生成 `start-production.*` 与 `ecosystem.config.js`。
- `deploy-to-aliyun.js`
  - 参数：无；读取 `ALIYUN_DB_*` 环境变量。
- 注意：会创建库表并导入 `database-export.sql`；存在外键时按语句顺序处理，建议先确保 SQL 文件完整；失败时打印连接与权限排查建议。
- `sync-to-aliyun.js`
  - 参数：无；读取本地 `DB_*` 与阿里云 `ALIYUN_DB_*`。
  - 注意：只插入/更新阿里云，不删除阿里云独有记录；整体在事务中执行，失败自动回滚；建议同步前先备份阿里云。
- `compare-databases.js`
  - 参数：无；读取 `DB_*` 与 `ALIYUN_DB_*`。
  - 注意：按主键对比，忽略 `created_at/updated_at` 的差异；输出“仅本地/仅阿里云/内容差异”统计用于决策同步策略。
- `align-aliyun-schema.js`
  - 参数：`--dry-run`（默认预览）、`--execute`（执行对齐）。
  - 注意：仅规范 `INT` 显示宽度与 `created_at/updated_at` 的 `TIMESTAMP`；逐表生成 `ALTER` 并在事务中执行；建议先预览与备份。
- `cleanup-aliyun-extra-records.js`
  - 参数：`--dry-run`（默认预览）、`--execute`（执行删除）。
  - 注意：默认以 `name` 对比本地与阿里云 `sites`，删除阿里云多余与重复记录；执行前会生成备份 SQL；删除仅发生在阿里云侧。
- `check-table-structure.js`
  - 参数：无；读取 `DB_*` 与 `ALIYUN_DB_*`。
  - 注意：按共同表比较字段定义，输出本地/阿里云独有字段与定义差异；用于指导结构同步。
- `sync-table-structure.js`
  - 参数：无；直接执行示例结构变更（为 `users` 添加 `real_name/phone/bio`）。
  - 注意：在事务中执行；若字段已存在会跳过，其他错误将回滚；用于演示结构同步流程。
- `export-database.js`
  - 参数：无；读取 `DB_*`。
  - 注意：导出结构与数据到 `database-export.sql`；分批插入语句；失败时提供连接与权限排查建议。
- `import-database.js`
  - 参数：无；读取 `DB_*`。
  - 注意：从 `database-export.sql` 导入并在缺失时创建数据库；会过滤 `--` 注释行并分割执行；显示进度与失败计数。
- `sync-database.js`
  - 参数：`export`、`import`、`check`、`help`。
  - 注意：封装导出/导入/检查三个操作；便于迁移流程统一触发。