require('dotenv').config();
const mysql = require('mysql2/promise');

/**
 * Create a dedicated Aliyun MySQL user with limited privileges.
 * Usage examples:
 *   node create-aliyun-db-user.js --username nav_admin --host % --password "StrongPwd!" --db navigation_admin
 *   node create-aliyun-db-user.js --username nav_admin --host 1.2.3.4 --password "StrongPwd!" --db navigation_admin
 *
 * Notes:
 * - Requires connecting with a user that has CREATE USER / GRANT privileges (typically root).
 * - Reads Aliyun connection from env: ALIYUN_DB_HOST/PORT/USER/PASSWORD/NAME.
 */

function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const key = arg.replace(/^--/, '');
      const next = args[i + 1];
      if (next && !next.startsWith('--')) {
        parsed[key] = next;
        i++;
      } else {
        parsed[key] = true;
      }
    }
  }
  return parsed;
}

async function main() {
  const {
    username = 'nav_admin',
    host = '%',
    password: newPassword,
    db = process.env.ALIYUN_DB_NAME || 'navigation_admin',
    privileges = 'SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX'
  } = parseArgs();

  if (!newPassword) {
    console.error('❌ 缺少 --password 参数：必须为新账号设置强密码');
    process.exit(1);
  }

  const aliyunConfig = {
    host: process.env.ALIYUN_DB_HOST,
    port: Number(process.env.ALIYUN_DB_PORT || 3306),
    user: process.env.ALIYUN_DB_USER || 'root',
    password: process.env.ALIYUN_DB_PASSWORD || '',
    database: db,
    multipleStatements: true
  };

  console.log('📡 连接阿里云MySQL，准备创建专用账号...');
  const conn = await mysql.createConnection(aliyunConfig);

  try {
    // Ensure target DB exists (optional)
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${db}\``);

    // Create user if not exists
    const createUserSQL = `CREATE USER IF NOT EXISTS \`${username}\`@\`${host}\` IDENTIFIED BY ?;`;
    await conn.query(createUserSQL, [newPassword]);

    // Grant limited privileges on target database
    const grantSQL = `GRANT ${privileges} ON \`${db}\`.* TO \`${username}\`@\`${host}\`;`;
    await conn.query(grantSQL);

    await conn.query('FLUSH PRIVILEGES;');

    console.log('✅ 已创建/存在专用账号并完成授权');
    console.log(`👤 账号: ${username}@${host}`);
    console.log(`📚 数据库: ${db}`);
    console.log(`🔒 权限: ${privileges}`);
  } catch (err) {
    console.error('❌ 创建/授权失败:', err.message);
    process.exitCode = 1;
  } finally {
    await conn.end();
    console.log('🔌 阿里云数据库连接已关闭');
  }
}

main().catch(err => {
  console.error('❌ 脚本异常:', err);
  process.exit(1);
});