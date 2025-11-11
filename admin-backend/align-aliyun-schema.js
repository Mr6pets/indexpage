require('dotenv').config();
const mysql = require('mysql2/promise');

/**
 * Align Aliyun MySQL schema to match local intentions:
 * - Normalize INT display width (int(11) -> INT)
 * - Ensure TIMESTAMP for created_at / updated_at columns
 *
 * Usage:
 *   node align-aliyun-schema.js --dry-run
 *   node align-aliyun-schema.js --execute
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

async function connectAliyun() {
  return mysql.createConnection({
    host: process.env.ALIYUN_DB_HOST,
    port: Number(process.env.ALIYUN_DB_PORT || 3306),
    user: process.env.ALIYUN_DB_USER || 'root',
    password: process.env.ALIYUN_DB_PASSWORD || '',
    database: process.env.ALIYUN_DB_NAME || 'navigation_admin'
  });
}

async function describeTable(conn, table) {
  const [rows] = await conn.query(`DESCRIBE \`${table}\``);
  return rows; // fields: Field, Type, Null, Key, Default, Extra
}

function needsIntNormalization(type) {
  return /^int\(\d+\)$/i.test(type);
}

function buildAlterStatementsForTable(desc, table) {
  const alters = [];
  for (const col of desc) {
    const name = col.Field;
    const type = col.Type.toLowerCase();
    // Normalize int(11) -> INT
    if (needsIntNormalization(type)) {
      // Keep NOT NULL / NULL, DEFAULT, AUTO_INCREMENT if present
      const notNull = col.Null === 'NO' ? 'NOT NULL' : 'NULL';
      const isAI = col.Extra && col.Extra.toLowerCase().includes('auto_increment');
      const defaultClause = col.Default != null ? ` DEFAULT ${mysql.escape(col.Default)}` : '';
      const aiClause = isAI ? ' AUTO_INCREMENT' : '';
      alters.push(`MODIFY COLUMN \`${name}\` INT ${notNull}${defaultClause}${aiClause}`);
    }

    // Ensure TIMESTAMP for created_at / updated_at
    if (name === 'created_at' && type !== 'timestamp') {
      alters.push('MODIFY COLUMN `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
    }
    if (name === 'updated_at' && type !== 'timestamp') {
      alters.push('MODIFY COLUMN `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');
    }
  }
  if (alters.length > 0) {
    return `ALTER TABLE \`${table}\`\n  ${alters.join(',\n  ')};`;
  }
  return null;
}

async function main() {
  const { dryRun } = parseArgs();
  const conn = await connectAliyun();
  console.log('🔧 开始对齐阿里云表结构（int(11) 与 时间字段）');
  const targetTables = ['users', 'categories', 'sites', 'settings', 'statistics', 'access_logs'];

  try {
    const plans = [];
    for (const table of targetTables) {
      try {
        const desc = await describeTable(conn, table);
        const alter = buildAlterStatementsForTable(desc, table);
        if (alter) plans.push({ table, alter });
      } catch (err) {
        console.warn(`⚠️ 跳过不存在的表: ${table} (${err.message})`);
      }
    }

    if (plans.length === 0) {
      console.log('✅ 无需更改：表结构已与预期一致');
      return;
    }

    console.log('📝 计划执行的 ALTER 语句如下：');
    for (const p of plans) {
      console.log(`\n-- ${p.table}\n${p.alter}`);
    }

    if (dryRun) {
      console.log('\n🧪 干跑模式：不执行任何修改');
      return;
    }

    console.log('\n🚀 执行表结构对齐...');
    await conn.beginTransaction();
    try {
      for (const p of plans) {
        await conn.query(p.alter);
        console.log(`   ✅ 已对齐: ${p.table}`);
      }
      await conn.commit();
      console.log('✅ 表结构对齐事务提交成功');
    } catch (err) {
      await conn.rollback();
      console.error('❌ 对齐失败，已回滚事务:', err.message);
      process.exitCode = 1;
    }
  } finally {
    await conn.end();
    console.log('🔌 阿里云数据库连接已关闭');
  }
}

main().catch(err => {
  console.error('❌ 脚本异常:', err);
  process.exit(1);
});