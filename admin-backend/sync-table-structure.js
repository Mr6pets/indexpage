const mysql = require('mysql2/promise');
require('dotenv').config();

// 阿里云数据库配置
const aliyunConfig = {
  host: '47.100.161.36',
  port: 3306,
  user: 'root',
  password: '8bR39mc9!',
  database: 'navigation_admin',
  charset: 'utf8mb4',
  timezone: '+08:00'
};

async function syncTableStructure() {
  let aliyunConn;
  
  try {
    console.log('🔧 开始同步表结构到阿里云MySQL数据库...');
    console.log('='.repeat(60));
    
    // 连接阿里云数据库
    console.log('📡 连接阿里云MySQL数据库...');
    aliyunConn = await mysql.createConnection(aliyunConfig);
    console.log('✅ 阿里云MySQL连接成功');
    
    // 开始事务
    await aliyunConn.beginTransaction();
    console.log('🔒 开始事务');
    
    try {
      // 为 users 表添加缺失的字段
      console.log('\n🔄 同步 users 表结构...');
      
      const alterQueries = [
        'ALTER TABLE users ADD COLUMN real_name VARCHAR(100) NULL AFTER email',
        'ALTER TABLE users ADD COLUMN phone VARCHAR(20) NULL AFTER real_name',
        'ALTER TABLE users ADD COLUMN bio TEXT NULL AFTER phone'
      ];
      
      for (const query of alterQueries) {
        try {
          await aliyunConn.query(query);
          console.log(`✅ 执行成功: ${query}`);
        } catch (error) {
          if (error.code === 'ER_DUP_FIELDNAME') {
            console.log(`⚠️ 字段已存在，跳过: ${query}`);
          } else {
            throw error;
          }
        }
      }
      
      // 提交事务
      await aliyunConn.commit();
      console.log('✅ 事务提交成功');
      
      console.log('\n🎉 表结构同步完成！');
      console.log('📋 已添加的字段:');
      console.log('   - real_name: VARCHAR(100) NULL');
      console.log('   - phone: VARCHAR(20) NULL');
      console.log('   - bio: TEXT NULL');
      
      console.log('\n💡 下一步：');
      console.log('1. 运行数据同步脚本');
      console.log('2. 验证同步结果');
      
    } catch (error) {
      // 回滚事务
      await aliyunConn.rollback();
      console.error('❌ 事务回滚');
      throw error;
    }
    
  } catch (error) {
    console.error('❌ 表结构同步失败:', error.message);
    process.exit(1);
  } finally {
    if (aliyunConn) {
      await aliyunConn.end();
      console.log('🔌 阿里云数据库连接已关闭');
    }
  }
}

// 确认提示
console.log('⚠️  警告：此操作将修改阿里云数据库表结构');
console.log('📋 将要执行的操作：');
console.log('   - 为 users 表添加 real_name 字段');
console.log('   - 为 users 表添加 phone 字段');
console.log('   - 为 users 表添加 bio 字段');
console.log('');
console.log('💡 建议：执行前请确保已备份阿里云数据库');
console.log('');

// 执行同步
syncTableStructure();