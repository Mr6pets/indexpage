const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function setupDatabase() {
  let connection;
  
  try {
    console.log('🔄 开始设置数据库...');
    
    // 首先连接到MySQL服务器（不指定数据库）
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      multipleStatements: true
    });
    
    console.log('✅ 成功连接到MySQL服务器');
    
    // 读取SQL文件
    const sqlFile = path.join(__dirname, 'init.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    // 执行SQL语句
    console.log('🔄 执行数据库初始化脚本...');
    await connection.execute(sql);
    
    console.log('✅ 数据库初始化完成！');
    console.log('📊 数据库信息:');
    console.log(`   - 数据库名: ${process.env.DB_NAME || 'navigation_admin'}`);
    console.log(`   - 主机: ${process.env.DB_HOST || 'localhost'}`);
    console.log(`   - 端口: ${process.env.DB_PORT || 3306}`);
    console.log(`   - 用户: ${process.env.DB_USER || 'root'}`);
    console.log('🔑 默认管理员账号: admin / 123456');
    
  } catch (error) {
    console.error('❌ 数据库设置失败:', error.message);
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('💡 请检查数据库用户名和密码是否正确');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('💡 请确保MySQL服务正在运行');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.error('💡 数据库不存在，将尝试创建');
    }
    
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// 测试数据库连接
async function testConnection() {
  let connection;
  
  try {
    console.log('🔄 测试数据库连接...');
    
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'navigation_admin'
    });
    
    // 测试查询
    const [rows] = await connection.execute('SELECT COUNT(*) as count FROM users');
    console.log(`✅ 数据库连接成功！用户表中有 ${rows[0].count} 条记录`);
    
    const [categories] = await connection.execute('SELECT COUNT(*) as count FROM categories');
    console.log(`📁 分类表中有 ${categories[0].count} 条记录`);
    
    const [sites] = await connection.execute('SELECT COUNT(*) as count FROM sites');
    console.log(`🌐 网站表中有 ${sites[0].count} 条记录`);
    
  } catch (error) {
    console.error('❌ 数据库连接测试失败:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// 根据命令行参数执行不同操作
const command = process.argv[2];

if (command === 'test') {
  testConnection().catch(console.error);
} else {
  setupDatabase().then(() => {
    console.log('🎉 数据库设置完成，正在测试连接...');
    return testConnection();
  }).catch(console.error);
}