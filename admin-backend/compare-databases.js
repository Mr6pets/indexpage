const mysql = require('mysql2/promise');
require('dotenv').config();

const localConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'navigation_admin'
};

const aliyunConfig = {
  host: process.env.ALIYUN_DB_HOST,
  port: process.env.ALIYUN_DB_PORT || 3306,
  user: process.env.ALIYUN_DB_USER,
  password: process.env.ALIYUN_DB_PASSWORD,
  database: process.env.ALIYUN_DB_NAME
};

async function getTables(config) {
  let connection;
  try {
    connection = await mysql.createConnection(config);
    const [rows] = await connection.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ?
      ORDER BY TABLE_NAME
    `, [config.database]);
    await connection.end();
    return rows.map(r => r.TABLE_NAME);
  } catch (error) {
    console.error(`Error connecting to ${config.host}: ${error.message}`);
    return [];
  }
}

async function compare() {
  console.log('🔄 正在对比数据库表结构...');
  
  const localTables = await getTables(localConfig);
  const aliyunTables = await getTables(aliyunConfig);
  
  console.log(`\n🏠 本地数据库 (${localTables.length} 个表):`);
  console.log(localTables.join(', '));
  
  console.log(`\n☁️ 阿里云数据库 (${aliyunTables.length} 个表):`);
  console.log(aliyunTables.join(', '));
  
  const onlyInLocal = localTables.filter(t => !aliyunTables.includes(t));
  const onlyInAliyun = aliyunTables.filter(t => !localTables.includes(t));
  
  console.log('\n📊 差异分析:');
  if (onlyInLocal.length === 0 && onlyInAliyun.length === 0) {
    console.log('✅ 两个数据库表名完全一致！');
  } else {
    if (onlyInLocal.length > 0) {
      console.log('👉 仅在本地存在的表:', onlyInLocal.join(', '));
    }
    if (onlyInAliyun.length > 0) {
      console.log('👉 仅在阿里云存在的表:', onlyInAliyun.join(', '));
    }
  }
}

compare();
