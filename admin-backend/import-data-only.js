const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function run() {
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'navigation_admin',
    multipleStatements: true
  };

  let connection;
  try {
    console.log('🔄 连接到 MySQL...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ 连接成功');

    // 确保数据库存在并选中
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await connection.query(`USE \`${dbConfig.database}\``);

    // 优先使用统一命名的导出文件，兼容旧文件名
    const preferred = path.join(__dirname, 'database-export.sql');
    const legacy = path.join(__dirname, 'exported-data.sql');
    const sqlPath = fs.existsSync(preferred) ? preferred : (fs.existsSync(legacy) ? legacy : null);
    if (!sqlPath) {
      console.error('❌ 找不到导出SQL（database-export.sql 或 exported-data.sql）');
      process.exit(1);
    }

    let sql = fs.readFileSync(sqlPath, 'utf8');
    // 去除以 -- 开头的注释行，避免和语句合并导致识别失败
    sql = sql.replace(/^--.*$/mg, '');
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0)
      .filter(s => /\bINSERT\s+INTO\b/i.test(s));

    console.log(`📄 需执行 INSERT 语句: ${statements.length} 条`);

    let ok = 0, fail = 0;
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      try {
        await connection.query(stmt);
        ok++;
        if (i % 2 === 0 || i === statements.length - 1) {
          const progress = ((i + 1) / statements.length * 100).toFixed(1);
          console.log(`📈 进度: ${progress}% (${i + 1}/${statements.length})`);
        }
      } catch (err) {
        fail++;
        console.warn('⚠️ 插入失败:', err.message);
        console.warn('   语句片段:', stmt.substring(0, 80) + '...');
      }
    }

    console.log(`\n🎉 插入完成，成功 ${ok}，失败 ${fail}`);

    // 验证记录数
    const tables = ['users', 'categories', 'sites', 'settings'];
    for (const t of tables) {
      try {
        const [rows] = await connection.query(`SELECT COUNT(*) as count FROM \`${t}\``);
        console.log(`  ${t}: ${rows[0].count} 条记录`);
      } catch (err) {
        console.warn(`  ⚠️ 无法统计 ${t}:`, err.message);
      }
    }

  } catch (error) {
    console.error('❌ 执行失败:', error.message);
  } finally {
    if (connection) await connection.end();
  }
}

if (require.main === module) {
  run();
}