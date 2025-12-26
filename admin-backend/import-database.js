const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

// 数据库连接配置
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'navigation_admin',
  multipleStatements: true
};

async function importDatabase() {
  let connection;
  
  try {
    console.log('🔄 连接到MySQL数据库...');
    // Create a connection without selecting a database first
    const rootConfig = { ...dbConfig, database: undefined };
    connection = await mysql.createConnection(rootConfig);
    console.log('✅ 数据库连接成功');

    // 检查导入文件是否存在
    const importPath = path.join(__dirname, 'database-export.sql');
    
    try {
      await fs.access(importPath);
    } catch (error) {
      console.error('❌ 导入文件不存在:', importPath);
      console.log('💡 请确保 database-export.sql 文件在当前目录下');
      return;
    }

    console.log('📖 读取导入文件...');
    let sqlContent = await fs.readFile(importPath, 'utf8');
    // 去除以 -- 开头的注释行，确保 DROP/INSERT 不被误过滤
    sqlContent = sqlContent.replace(/^--.*$/mg, '');
    console.log(`📊 文件大小: ${(sqlContent.length / 1024).toFixed(2)} KB`);

    // 创建数据库（如果不存在）
    console.log('🔧 创建数据库（如果不存在）...');
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await connection.query(`USE \`${dbConfig.database}\``);

    console.log('🚀 开始导入数据...');
    
    // 分割SQL语句并执行
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      if (statement.length === 0) continue;
      
      try {
        await connection.query(statement);
        successCount++;
        
        // 显示进度
        if (i % 10 === 0 || i === statements.length - 1) {
          const progress = ((i + 1) / statements.length * 100).toFixed(1);
          console.log(`📈 进度: ${progress}% (${i + 1}/${statements.length})`);
        }
      } catch (error) {
        errorCount++;
        console.warn(`⚠️  执行语句失败: ${error.message}`);
        console.warn(`   语句: ${statement.substring(0, 100)}...`);
      }
    }

    console.log('\n🎉 数据导入完成!');
    console.log(`✅ 成功执行: ${successCount} 条语句`);
    if (errorCount > 0) {
      console.log(`⚠️  失败: ${errorCount} 条语句`);
    }

    // 验证导入结果
    console.log('\n📊 验证导入结果:');
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ?
    `, [dbConfig.database]);

    for (const table of tables) {
      const tableName = table.TABLE_NAME;
      const [countResult] = await connection.execute(`SELECT COUNT(*) as count FROM \`${tableName}\``);
      console.log(`  ${tableName}: ${countResult[0].count} 条记录`);
    }

  } catch (error) {
    console.error('❌ 导入失败:', error.message);
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\n💡 解决方案:');
      console.log('1. 检查 .env 文件中的数据库配置');
      console.log('2. 确保MySQL服务正在运行');
      console.log('3. 验证数据库用户名和密码');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.log('\n💡 解决方案:');
      console.log('1. 数据库不存在，脚本会自动创建');
      console.log('2. 检查数据库用户是否有创建数据库的权限');
    }
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// 运行导入
importDatabase();