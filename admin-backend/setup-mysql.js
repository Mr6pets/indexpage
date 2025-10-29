const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// MySQL连接配置（不指定数据库）
const connectionConfig = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: '8bR39mc9', // MySQL root密码
  multipleStatements: true
};

// 数据库配置
const dbConfig = {
  ...connectionConfig,
  database: 'navigation_admin'
};

// 创建数据库和表结构
async function setupMySQL() {
  let connection;
  
  try {
    console.log('🔄 开始设置MySQL数据库...');
    
    // 1. 连接到MySQL服务器（不指定数据库）
    console.log('📡 连接到MySQL服务器...');
    connection = await mysql.createConnection(connectionConfig);
    console.log('✅ MySQL服务器连接成功');
    
    // 2. 创建数据库
    console.log('🗄️ 创建数据库 navigation_admin...');
    await connection.execute('CREATE DATABASE IF NOT EXISTS navigation_admin CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
    console.log('✅ 数据库创建成功');
    
    // 3. 切换到目标数据库
    await connection.query('USE navigation_admin');
    
    // 4. 创建用户表
    console.log('👥 创建用户表...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin', 'editor') DEFAULT 'editor',
        avatar VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    // 5. 创建分类表
    console.log('📂 创建分类表...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        icon VARCHAR(50),
        sort_order INT DEFAULT 0,
        status ENUM('active', 'inactive') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    // 6. 创建网站表
    console.log('🌐 创建网站表...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS sites (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        url VARCHAR(500) NOT NULL,
        description TEXT,
        icon VARCHAR(100),
        category_id INT,
        sort_order INT DEFAULT 0,
        status ENUM('active', 'inactive') DEFAULT 'active',
        click_count INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    // 7. 创建设置表
    console.log('⚙️ 创建设置表...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        key_name VARCHAR(100) UNIQUE NOT NULL,
        value TEXT,
        description VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    // 8. 创建统计表
    console.log('📊 创建统计表...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS statistics (
        id INT AUTO_INCREMENT PRIMARY KEY,
        site_id INT,
        date DATE NOT NULL,
        clicks INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
        UNIQUE KEY unique_site_date (site_id, date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    console.log('✅ 所有表创建完成');
    
    // 9. 导入数据
    console.log('📥 导入数据...');
    const sqlFilePath = path.join(__dirname, 'exported-data.sql');
    
    if (fs.existsSync(sqlFilePath)) {
      const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
      
      // 分割SQL语句并执行
      const statements = sqlContent
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
      
      for (const statement of statements) {
        if (statement.trim()) {
          try {
            await connection.execute(statement);
          } catch (error) {
            if (!error.message.includes('Duplicate entry')) {
              console.warn('⚠️ SQL执行警告:', statement.substring(0, 50) + '...', error.message);
            }
          }
        }
      }
      
      console.log('✅ 数据导入完成');
    } else {
      console.log('⚠️ 未找到导出的数据文件，跳过数据导入');
    }
    
    // 10. 验证数据
    console.log('🔍 验证数据...');
    const [users] = await connection.execute('SELECT COUNT(*) as count FROM users');
    const [categories] = await connection.execute('SELECT COUNT(*) as count FROM categories');
    const [sites] = await connection.execute('SELECT COUNT(*) as count FROM sites');
    
    console.log('📊 数据统计:');
    console.log(`   - 用户: ${users[0].count} 条`);
    console.log(`   - 分类: ${categories[0].count} 条`);
    console.log(`   - 网站: ${sites[0].count} 条`);
    
    console.log('🎉 MySQL数据库设置完成!');
    
  } catch (error) {
    console.error('❌ 设置失败:', error.message);
    
    // 如果是密码错误，提供帮助信息
    if (error.message.includes('Access denied')) {
      console.log('\n💡 解决方案:');
      console.log('1. 请修改此脚本中的 password 字段为您的MySQL root密码');
      console.log('2. 或者创建一个新的MySQL用户:');
      console.log('   CREATE USER \'nav_admin\'@\'localhost\' IDENTIFIED BY \'your_password\';');
      console.log('   GRANT ALL PRIVILEGES ON navigation_admin.* TO \'nav_admin\'@\'localhost\';');
      console.log('   FLUSH PRIVILEGES;');
    }
    
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  setupMySQL()
    .then(() => {
      console.log('✨ 设置完成!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 设置失败:', error.message);
      process.exit(1);
    });
}

module.exports = { setupMySQL };