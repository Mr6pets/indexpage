const mysql = require('mysql2/promise');
require('dotenv').config();

async function testConnection() {
  const configs = [
    { password: '', description: '空密码' },
    { password: '123456', description: '密码: 123456' },
    { password: 'root', description: '密码: root' },
    { password: 'mysql', description: '密码: mysql' }
  ];

  for (const config of configs) {
    try {
      console.log(`🔄 尝试连接 MySQL (${config.description})...`);
      
      const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: config.password
      });
      
      console.log(`✅ 连接成功！使用${config.description}`);
      
      // 测试查询
      const [rows] = await connection.execute('SHOW DATABASES');
      console.log('📊 可用数据库:', rows.map(row => row.Database).join(', '));
      
      await connection.end();
      
      // 更新 .env 文件
      const fs = require('fs');
      const path = require('path');
      const envPath = path.join(__dirname, '..', '.env');
      let envContent = fs.readFileSync(envPath, 'utf8');
      envContent = envContent.replace(/DB_PASSWORD=.*/, `DB_PASSWORD=${config.password}`);
      fs.writeFileSync(envPath, envContent);
      
      console.log('✅ 已更新 .env 文件中的数据库密码');
      return true;
      
    } catch (error) {
      console.log(`❌ 连接失败 (${config.description}): ${error.message}`);
    }
  }
  
  console.log('❌ 所有连接尝试都失败了');
  return false;
}

testConnection().catch(console.error);