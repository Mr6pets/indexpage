const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

// 阿里云数据库配置（不指定数据库，先连接服务器）
const aliyunConfig = {
  host: '47.100.161.36',
  port: 3306,
  user: 'root',
  password: '8bR39mc9!',
  charset: 'utf8mb4',
  timezone: '+08:00'
};

async function deployToAliyun() {
  let connection;
  
  try {
    console.log('🚀 开始部署到阿里云MySQL数据库...');
    
    // 连接到阿里云MySQL
    console.log('📡 连接到阿里云MySQL服务器...');
    connection = await mysql.createConnection(aliyunConfig);
    console.log('✅ 阿里云MySQL连接成功');
    
    // 创建数据库（如果不存在）
    console.log('🗄️ 创建数据库...');
    await connection.query('CREATE DATABASE IF NOT EXISTS navigation_admin CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
    
    // 关闭当前连接，重新连接到指定数据库
    await connection.end();
    
    // 重新连接到指定数据库
    connection = await mysql.createConnection({
      ...aliyunConfig,
      database: 'navigation_admin'
    });
    console.log('✅ 数据库创建/选择成功');
    
    // 创建表结构
    console.log('📋 创建表结构...');
    
    // 用户表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin', 'editor', 'viewer') DEFAULT 'viewer',
        avatar VARCHAR(255),
        status ENUM('active', 'inactive') DEFAULT 'active',
        last_login DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    // 分类表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        icon VARCHAR(50),
        sort_order INT DEFAULT 0,
        status ENUM('active', 'inactive') DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    // 网站表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS sites (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        url VARCHAR(500) NOT NULL,
        icon VARCHAR(255),
        category_id INT,
        click_count INT DEFAULT 0,
        sort_order INT DEFAULT 0,
        status ENUM('active', 'inactive') DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    // 设置表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        key_name VARCHAR(100) UNIQUE NOT NULL,
        value TEXT,
        description TEXT,
        type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    // 统计表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS statistics (
        id INT AUTO_INCREMENT PRIMARY KEY,
        date DATE NOT NULL,
        total_clicks INT DEFAULT 0,
        unique_visitors INT DEFAULT 0,
        page_views INT DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_date (date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    // 访问日志表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS access_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        site_id INT,
        ip_address VARCHAR(45),
        user_agent TEXT,
        referer VARCHAR(500),
        clicked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
        INDEX idx_site_id (site_id),
        INDEX idx_clicked_at (clicked_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    console.log('✅ 所有表创建完成');
    
    // 读取并导入数据
    console.log('📥 导入数据...');
    const sqlFile = path.join(__dirname, 'exported-data.sql');
    const sqlContent = await fs.readFile(sqlFile, 'utf8');
    
    // 分割SQL语句并执行
    const statements = sqlContent.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await connection.execute(statement);
        } catch (error) {
          if (!error.message.includes('Cannot truncate a table referenced in a foreign key constraint')) {
            console.warn('⚠️ SQL执行警告:', statement.substring(0, 50) + '...', error.message);
          }
        }
      }
    }
    
    console.log('✅ 数据导入完成');
    
    // 验证数据
    console.log('🔍 验证数据...');
    const [users] = await connection.execute('SELECT COUNT(*) as count FROM users');
    const [categories] = await connection.execute('SELECT COUNT(*) as count FROM categories');
    const [sites] = await connection.execute('SELECT COUNT(*) as count FROM sites');
    
    console.log('📊 数据统计:');
    console.log(`   - 用户: ${users[0].count} 条`);
    console.log(`   - 分类: ${categories[0].count} 条`);
    console.log(`   - 网站: ${sites[0].count} 条`);
    
    console.log('🎉 阿里云MySQL数据库部署完成!');
    
  } catch (error) {
    console.error('❌ 部署失败:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 解决方案:');
      console.log('   1. 检查阿里云MySQL服务器地址和端口');
      console.log('   2. 确认MySQL服务正在运行');
      console.log('   3. 检查防火墙设置');
      console.log('   4. 验证网络连接');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('💡 解决方案:');
      console.log('   1. 检查用户名和密码');
      console.log('   2. 确认用户有足够的权限');
      console.log('   3. 检查MySQL用户配置');
    }
    
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 数据库连接已关闭');
    }
  }
}

// 检查配置
function checkConfig() {
  console.log('⚙️ 当前阿里云数据库配置:');
  console.log(`   - 主机: ${aliyunConfig.host}`);
  console.log(`   - 端口: ${aliyunConfig.port}`);
  console.log(`   - 用户: ${aliyunConfig.user}`);
  console.log(`   - 数据库: ${aliyunConfig.database}`);
  console.log('');
  
  if (aliyunConfig.host === 'your_aliyun_mysql_host') {
    console.log('⚠️ 请先配置阿里云数据库连接信息!');
    console.log('📝 修改本文件中的 aliyunConfig 对象:');
    console.log('   - host: 阿里云MySQL服务器地址');
    console.log('   - user: MySQL用户名');
    console.log('   - password: MySQL密码');
    console.log('');
    return false;
  }
  
  return true;
}

// 主函数
async function main() {
  console.log('🌟 阿里云MySQL数据库部署工具');
  console.log('==================================');
  
  if (!checkConfig()) {
    process.exit(1);
  }
  
  await deployToAliyun();
}

// 如果直接运行此脚本
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { deployToAliyun, aliyunConfig };