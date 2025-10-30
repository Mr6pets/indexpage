const mysql = require('mysql2/promise');
require('dotenv').config();

// 本地数据库配置
const localConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'navigation_admin'
};

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

async function syncTable(localConn, aliyunConn, tableName, primaryKey = 'id') {
  console.log(`\n🔄 同步表: ${tableName}`);
  console.log('='.repeat(50));
  
  try {
    // 获取本地数据
    const [localData] = await localConn.query(`SELECT * FROM ${tableName} ORDER BY ${primaryKey}`);
    
    // 获取阿里云数据
    const [aliyunData] = await aliyunConn.query(`SELECT * FROM ${tableName} ORDER BY ${primaryKey}`);
    
    console.log(`本地记录数: ${localData.length}`);
    console.log(`阿里云记录数: ${aliyunData.length}`);
    
    // 创建映射
    const aliyunMap = new Map();
    aliyunData.forEach(row => {
      aliyunMap.set(row[primaryKey], row);
    });
    
    let insertCount = 0;
    let updateCount = 0;
    
    // 处理每条本地记录
    for (const localRow of localData) {
      const id = localRow[primaryKey];
      const aliyunRow = aliyunMap.get(id);
      
      if (!aliyunRow) {
        // 插入新记录
        const columns = Object.keys(localRow);
        const placeholders = columns.map(() => '?').join(', ');
        const values = columns.map(col => localRow[col]);
        
        const insertSql = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`;
        await aliyunConn.query(insertSql, values);
        
        insertCount++;
        console.log(`✅ 插入新记录: ${localRow.name || localRow.username || localRow.key_name || id}`);
        
      } else {
        // 检查是否需要更新
        let needUpdate = false;
        const updates = [];
        const updateValues = [];
        
        for (const column in localRow) {
          if (column !== 'created_at' && column !== 'updated_at') {
            if (JSON.stringify(localRow[column]) !== JSON.stringify(aliyunRow[column])) {
              needUpdate = true;
              updates.push(`${column} = ?`);
              updateValues.push(localRow[column]);
            }
          }
        }
        
        if (needUpdate) {
          updateValues.push(id);
          const updateSql = `UPDATE ${tableName} SET ${updates.join(', ')} WHERE ${primaryKey} = ?`;
          await aliyunConn.query(updateSql, updateValues);
          
          updateCount++;
          console.log(`🔄 更新记录: ${localRow.name || localRow.username || localRow.key_name || id}`);
        }
      }
    }
    
    console.log(`📊 同步完成: 插入${insertCount}条, 更新${updateCount}条`);
    
    return { insertCount, updateCount };
    
  } catch (error) {
    console.error(`❌ 同步失败: ${error.message}`);
    throw error;
  }
}

async function syncToAliyun() {
  let localConn, aliyunConn;
  
  try {
    console.log('🚀 开始将本地数据同步到阿里云MySQL数据库...');
    console.log('='.repeat(60));
    
    // 连接数据库
    console.log('📡 连接本地MySQL数据库...');
    localConn = await mysql.createConnection(localConfig);
    console.log('✅ 本地MySQL连接成功');
    
    console.log('📡 连接阿里云MySQL数据库...');
    aliyunConn = await mysql.createConnection(aliyunConfig);
    console.log('✅ 阿里云MySQL连接成功');
    
    // 开始事务
    await aliyunConn.beginTransaction();
    console.log('🔒 开始事务');
    
    try {
      // 同步各个表（按依赖顺序）
      const tables = [
        { name: 'users', key: 'id' },
        { name: 'categories', key: 'id' },
        { name: 'sites', key: 'id' },
        { name: 'settings', key: 'id' }
      ];
      
      const summary = {};
      
      for (const table of tables) {
        const result = await syncTable(localConn, aliyunConn, table.name, table.key);
        summary[table.name] = result;
      }
      
      // 提交事务
      await aliyunConn.commit();
      console.log('✅ 事务提交成功');
      
      // 输出同步总结
      console.log('\n📋 同步总结报告');
      console.log('='.repeat(60));
      
      let totalInserts = 0;
      let totalUpdates = 0;
      
      for (const [table, stats] of Object.entries(summary)) {
        totalInserts += stats.insertCount;
        totalUpdates += stats.updateCount;
        
        if (stats.insertCount > 0 || stats.updateCount > 0) {
          console.log(`📊 ${table}: 插入${stats.insertCount}条, 更新${stats.updateCount}条`);
        } else {
          console.log(`✅ ${table}: 无需同步`);
        }
      }
      
      console.log(`\n🎉 同步完成！总计: 插入${totalInserts}条, 更新${totalUpdates}条`);
      
      if (totalInserts > 0 || totalUpdates > 0) {
        console.log('\n💡 建议：');
        console.log('1. 运行验证脚本确认同步结果');
        console.log('2. 测试应用功能是否正常');
        console.log('3. 如有问题，可从备份恢复');
      }
      
    } catch (error) {
      // 回滚事务
      await aliyunConn.rollback();
      console.error('❌ 事务回滚');
      throw error;
    }
    
  } catch (error) {
    console.error('❌ 同步失败:', error.message);
    process.exit(1);
  } finally {
    if (localConn) {
      await localConn.end();
      console.log('🔌 本地数据库连接已关闭');
    }
    if (aliyunConn) {
      await aliyunConn.end();
      console.log('🔌 阿里云数据库连接已关闭');
    }
  }
}

// 确认提示
console.log('⚠️  警告：此操作将把本地数据同步到阿里云数据库');
console.log('📋 将要执行的操作：');
console.log('   - 插入本地独有的记录到阿里云');
console.log('   - 更新内容不一致的记录');
console.log('   - 不会删除阿里云独有的记录');
console.log('');
console.log('💡 建议：执行前请确保已备份阿里云数据库');
console.log('');

// 执行同步
syncToAliyun();