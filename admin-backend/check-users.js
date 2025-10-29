const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkUsers() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'navigation_admin'
  });

  try {
    console.log('🔍 检查本地数据库用户数据...\n');
    
    // 检查用户表是否存在
    const [tables] = await connection.execute("SHOW TABLES LIKE 'users'");
    if (tables.length === 0) {
      console.log('❌ users表不存在');
      return;
    }
    
    // 查询所有用户
    const [users] = await connection.execute('SELECT id, username, email, role, created_at FROM users');
    
    console.log(`📊 用户总数: ${users.length}`);
    console.log('='.repeat(50));
    
    if (users.length === 0) {
      console.log('❌ 没有找到任何用户数据');
      console.log('💡 需要创建管理员用户');
    } else {
      users.forEach((user, index) => {
        console.log(`${index + 1}. 用户名: ${user.username}`);
        console.log(`   邮箱: ${user.email}`);
        console.log(`   角色: ${user.role}`);
        console.log(`   创建时间: ${user.created_at}`);
        console.log('-'.repeat(30));
      });
    }
    
  } catch (error) {
    console.error('❌ 检查用户数据失败:', error.message);
  } finally {
    await connection.end();
  }
}

checkUsers();