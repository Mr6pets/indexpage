require('dotenv').config();
const mysql = require('mysql2/promise');

/**
 * Cleanup Aliyun-only records with a dry-run preview.
 * Default target: table `sites`, compare by `name` against local DB.
 *
 * Usage:
 *   node cleanup-aliyun-extra-records.js --dry-run   # 仅预览
 *   node cleanup-aliyun-extra-records.js --execute   # 执行删除
 *
 * Creates a backup SQL for deleted rows under backups/cleanup_backup_sites_<timestamp>.sql
 */

function parseArgs() {
  const args = process.argv.slice(2);
  const flags = { dryRun: true };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--execute') flags.dryRun = false;
    if (a === '--dry-run') flags.dryRun = true;
  }
  return flags;
}

async function connectLocal() {
  return mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'navigation_admin'
  });
}

async function connectAliyun() {
  return mysql.createConnection({
    host: process.env.ALIYUN_DB_HOST,
    port: Number(process.env.ALIYUN_DB_PORT || 3306),
    user: process.env.ALIYUN_DB_USER || 'root',
    password: process.env.ALIYUN_DB_PASSWORD || '',
    database: process.env.ALIYUN_DB_NAME || 'navigation_admin'
  });
}

async function fetchSites(conn) {
  const [rows] = await conn.query('SELECT id, name, url, description, icon, category_id, sort_order, status, click_count FROM sites');
  return rows;
}

function buildBackupSQL(rows) {
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const header = `-- Backup of Aliyun-only sites to be deleted at ${ts}\n`;
  const inserts = rows.map(r => {
    const values = [
      r.name,
      r.description,
      r.url,
      r.icon,
      r.category_id,
      r.sort_order,
      r.status,
      r.click_count
    ].map(v => v === null || v === undefined ? 'NULL' : mysql.escape(v)).join(', ');
    return `INSERT INTO sites (name, description, url, icon, category_id, sort_order, status, click_count) VALUES (${values});`;
  }).join('\n');
  return header + inserts + '\n';
}

const fs = require('fs');
const path = require('path');

async function main() {
  const { dryRun } = parseArgs();
  console.log('🔍 开始对比本地与阿里云的 sites 表，多余记录清理');

  const local = await connectLocal();
  const aliyun = await connectAliyun();
  try {
    const [localSites, aliyunSites] = await Promise.all([fetchSites(local), fetchSites(aliyun)]);
    const localNameCounts = localSites.reduce((m, s) => { m[s.name] = (m[s.name] || 0) + 1; return m; }, {});
    const aliyunByName = aliyunSites.reduce((m, s) => { (m[s.name] = m[s.name] || []).push(s); return m; }, {});

    // 计算需要删除的记录：
    // 1) 本地不存在该 name 的所有记录
    // 2) 本地存在该 name，但阿里云有重复（保留最小 id 的一条，多余的删除）
    const toDelete = [];
    for (const [name, rows] of Object.entries(aliyunByName)) {
      const localCount = localNameCounts[name] || 0;
      if (localCount === 0) {
        // 删除全部该 name 的记录
        toDelete.push(...rows);
      } else if (rows.length > localCount) {
        // 保留按 id 升序的前 localCount 条，删除剩余
        const sorted = rows.slice().sort((a, b) => a.id - b.id);
        const surplus = sorted.slice(localCount);
        toDelete.push(...surplus);
      }
    }

    if (toDelete.length === 0) {
      console.log('✅ 阿里云没有多余的 sites 记录');
      return;
    }

    console.log(`⚠️ 检测到阿里云需要清理记录 ${toDelete.length} 条：`);
    for (const r of toDelete) {
      console.log(`   - ${r.name} (id=${r.id}, url=${r.url})`);
    }

    if (dryRun) {
      console.log('🧪 干跑模式：不执行删除，仅展示将被删除的记录');
      const backupSQL = buildBackupSQL(toDelete);
      const backupDir = path.join(__dirname, 'backups');
      if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
      const backupPath = path.join(backupDir, `cleanup_backup_sites_${new Date().toISOString().replace(/[:.]/g, '-')}.sql`);
      fs.writeFileSync(backupPath, backupSQL, 'utf8');
      console.log(`💾 已生成备份SQL: ${backupPath}`);
      return;
    }

    console.log('🗑️ 执行删除阿里云端多余的 sites 记录...');
    await aliyun.beginTransaction();
    try {
      for (const r of toDelete) {
        await aliyun.query('DELETE FROM sites WHERE id = ?', [r.id]);
        console.log(`   ✅ 已删除: ${r.name} (id=${r.id})`);
      }
      await aliyun.commit();
      console.log('✅ 删除事务提交成功');
    } catch (err) {
      await aliyun.rollback();
      console.error('❌ 删除失败，已回滚事务:', err.message);
      process.exitCode = 1;
    }
  } finally {
    await local.end();
    await aliyun.end();
    console.log('🔌 数据库连接已关闭');
  }
}

main().catch(err => {
  console.error('❌ 脚本异常:', err);
  process.exit(1);
});