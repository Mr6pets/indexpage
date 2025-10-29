const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function createAdminUser() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'navigation_admin'
  });

  try {
    console.log('🔄 创建管理员用户...\n');
    
    // 检查是否已存在管理员用户
    const [existingUsers] = await connection.execute('SELECT * FROM users WHERE username = ?', ['admin']);
    
    if (existingUsers.length > 0) {
      console.log('✅ 管理员用户已存在');
      console.log(`用户名: ${existingUsers[0].username}`);
      console.log(`邮箱: ${existingUsers[0].email}`);
      console.log(`角色: ${existingUsers[0].role}`);
      return;
    }
    
    // 创建管理员用户
    const username = 'admin';
    const email = 'admin@example.com';
    const password = 'admin123';
    const role = 'admin';
    
    // 加密密码
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // 插入用户数据
    const [result] = await connection.execute(
      'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
      [username, email, hashedPassword, role]
    );
    
    console.log('✅ 管理员用户创建成功!');
    console.log('='.repeat(40));
    console.log(`用户名: ${username}`);
    console.log(`邮箱: ${email}`);
    console.log(`密码: ${password}`);
    console.log(`角色: ${role}`);
    console.log(`用户ID: ${result.insertId}`);
    console.log('='.repeat(40));
    console.log('💡 请使用以上信息登录后台管理系统');
    
  } catch (error) {
    console.error('❌ 创建管理员用户失败:', error.message);
  } finally {
    await connection.end();
  }
}

createAdminUser();