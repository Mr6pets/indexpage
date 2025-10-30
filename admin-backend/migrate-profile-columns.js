const mysql = require('mysql2/promise');
require('dotenv').config();

// 数据库连接配置
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '123456',
  database: process.env.DB_NAME || 'navigation_admin',
};

async function migrateProfileColumns() {
  let connection;
  try {
    console.log('🔄 连接数据库...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ 数据库连接成功');

    // 检查列是否已存在
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users'
    `, [dbConfig.database]);

    const existingColumns = columns.map(col => col.COLUMN_NAME);
    console.log('📋 现有列:', existingColumns);

    // 添加 real_name 列
    if (!existingColumns.includes('real_name')) {
      console.log('🔄 添加 real_name 列...');
      await connection.execute(`
        ALTER TABLE users 
        ADD COLUMN real_name VARCHAR(100) DEFAULT NULL COMMENT '真实姓名'
      `);
      console.log('✅ real_name 列添加成功');
    } else {
      console.log('ℹ️ real_name 列已存在');
    }

    // 添加 phone 列
    if (!existingColumns.includes('phone')) {
      console.log('🔄 添加 phone 列...');
      await connection.execute(`
        ALTER TABLE users 
        ADD COLUMN phone VARCHAR(20) DEFAULT NULL COMMENT '手机号'
      `);
      console.log('✅ phone 列添加成功');
    } else {
      console.log('ℹ️ phone 列已存在');
    }

    // 添加 bio 列
    if (!existingColumns.includes('bio')) {
      console.log('🔄 添加 bio 列...');
      await connection.execute(`
        ALTER TABLE users 
        ADD COLUMN bio TEXT DEFAULT NULL COMMENT '个人简介'
      `);
      console.log('✅ bio 列添加成功');
    } else {
      console.log('ℹ️ bio 列已存在');
    }

    // 显示更新后的表结构
    console.log('📋 更新后的用户表结构:');
    const [tableInfo] = await connection.execute('DESCRIBE users');
    console.table(tableInfo);

    console.log('🎉 数据库迁移完成!');

  } catch (error) {
    console.error('❌ 迁移失败:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 数据库连接已关闭');
    }
  }
}

// 运行迁移
migrateProfileColumns();