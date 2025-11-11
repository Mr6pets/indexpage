const mysql = require('mysql2/promise');
require('dotenv').config();

// 本地数据库配置
const localConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'navigation_admin'
};

// 阿里云数据库配置（优先从环境变量读取）
const aliyunConfig = {
  host: process.env.ALIYUN_DB_HOST || '47.100.161.36',
  port: parseInt(process.env.ALIYUN_DB_PORT || '3306', 10),
  user: process.env.ALIYUN_DB_USER || 'root',
  password: process.env.ALIYUN_DB_PASSWORD || '8bR39mc9!',
  database: process.env.ALIYUN_DB_NAME || 'navigation_admin',
  charset: 'utf8mb4',
  timezone: '+08:00'
};

async function compareData(localConn, aliyunConn, tableName, primaryKey = 'id') {
  console.log(`\n📊 对比表: ${tableName}`);
  console.log('='.repeat(50));
  
  try {
    // 获取本地数据
    const [localData] = await localConn.query(`SELECT * FROM ${tableName} ORDER BY ${primaryKey}`);
    
    // 获取阿里云数据
    const [aliyunData] = await aliyunConn.query(`SELECT * FROM ${tableName} ORDER BY ${primaryKey}`);
    
    console.log(`本地记录数: ${localData.length}`);
    console.log(`阿里云记录数: ${aliyunData.length}`);
    
    if (localData.length !== aliyunData.length) {
      console.log(`⚠️ 记录数不一致！差异: ${Math.abs(localData.length - aliyunData.length)}`);
    } else {
      console.log('✅ 记录数一致');
    }
    
    // 详细对比数据
    const localMap = new Map();
    const aliyunMap = new Map();
    
    localData.forEach(row => {
      localMap.set(row[primaryKey], row);
    });
    
    aliyunData.forEach(row => {
      aliyunMap.set(row[primaryKey], row);
    });
    
    // 检查本地有但阿里云没有的记录
    const localOnly = [];
    for (const [key, value] of localMap) {
      if (!aliyunMap.has(key)) {
        localOnly.push(value);
      }
    }
    
    // 检查阿里云有但本地没有的记录
    const aliyunOnly = [];
    for (const [key, value] of aliyunMap) {
      if (!localMap.has(key)) {
        aliyunOnly.push(value);
      }
    }
    
    // 检查内容差异
    const contentDiffs = [];
    for (const [key, localRow] of localMap) {
      const aliyunRow = aliyunMap.get(key);
      if (aliyunRow) {
        const diffs = [];
        for (const column in localRow) {
          if (column !== 'created_at' && column !== 'updated_at') { // 忽略时间戳字段
            if (JSON.stringify(localRow[column]) !== JSON.stringify(aliyunRow[column])) {
              diffs.push({
                column,
                local: localRow[column],
                aliyun: aliyunRow[column]
              });
            }
          }
        }
        if (diffs.length > 0) {
          contentDiffs.push({
            id: key,
            name: localRow.name || localRow.username || localRow.key_name || key,
            diffs
          });
        }
      }
    }
    
    // 输出差异报告
    if (localOnly.length > 0) {
      console.log(`\n🔴 仅存在于本地的记录 (${localOnly.length}条):`);
      localOnly.forEach(row => {
        const name = row.name || row.username || row.key_name || `ID:${row[primaryKey]}`;
        console.log(`   - ${name}`);
      });
    }
    
    if (aliyunOnly.length > 0) {
      console.log(`\n🔵 仅存在于阿里云的记录 (${aliyunOnly.length}条):`);
      aliyunOnly.forEach(row => {
        const name = row.name || row.username || row.key_name || `ID:${row[primaryKey]}`;
        console.log(`   - ${name}`);
      });
    }
    
    if (contentDiffs.length > 0) {
      console.log(`\n🟡 内容不一致的记录 (${contentDiffs.length}条):`);
      contentDiffs.forEach(diff => {
        console.log(`   - ${diff.name}:`);
        diff.diffs.forEach(d => {
          console.log(`     ${d.column}: 本地="${d.local}" vs 阿里云="${d.aliyun}"`);
        });
      });
    }
    
    if (localOnly.length === 0 && aliyunOnly.length === 0 && contentDiffs.length === 0) {
      console.log('✅ 数据完全一致');
    }
    
    return {
      localCount: localData.length,
      aliyunCount: aliyunData.length,
      localOnly: localOnly.length,
      aliyunOnly: aliyunOnly.length,
      contentDiffs: contentDiffs.length
    };
    
  } catch (error) {
    console.log(`❌ 对比失败: ${error.message}`);
    return null;
  }
}

async function compareDatabases() {
  let localConn, aliyunConn;
  
  try {
    console.log('🔍 开始对比本地和阿里云MySQL数据库...');
    console.log('='.repeat(60));
    
    // 连接本地数据库
    console.log('📡 连接本地MySQL数据库...');
    localConn = await mysql.createConnection(localConfig);
    console.log('✅ 本地MySQL连接成功');
    
    // 连接阿里云数据库
    console.log('📡 连接阿里云MySQL数据库...');
    aliyunConn = await mysql.createConnection(aliyunConfig);
    console.log('✅ 阿里云MySQL连接成功');
    
    // 对比各个表
    const tables = ['users', 'categories', 'sites', 'settings'];
    const summary = {};
    
    for (const table of tables) {
      const result = await compareData(localConn, aliyunConn, table);
      if (result) {
        summary[table] = result;
      }
    }
    
    // 输出总结报告
    console.log('\n📋 对比总结报告');
    console.log('='.repeat(60));
    
    let totalDifferences = 0;
    for (const [table, stats] of Object.entries(summary)) {
      const hasDiff = stats.localOnly > 0 || stats.aliyunOnly > 0 || stats.contentDiffs > 0;
      const status = hasDiff ? '❌' : '✅';
      console.log(`${status} ${table}: 本地${stats.localCount}条, 阿里云${stats.aliyunCount}条`);
      
      if (hasDiff) {
        totalDifferences++;
        if (stats.localOnly > 0) console.log(`    - 本地独有: ${stats.localOnly}条`);
        if (stats.aliyunOnly > 0) console.log(`    - 阿里云独有: ${stats.aliyunOnly}条`);
        if (stats.contentDiffs > 0) console.log(`    - 内容差异: ${stats.contentDiffs}条`);
      }
    }
    
    console.log('\n🎯 同步建议:');
    if (totalDifferences === 0) {
      console.log('✅ 数据库完全一致，无需同步');
    } else {
      console.log('⚠️ 发现数据不一致，建议执行以下操作:');
      console.log('1. 备份当前数据库');
      console.log('2. 选择同步方向（本地→阿里云 或 阿里云→本地）');
      console.log('3. 执行数据同步');
      console.log('4. 验证同步结果');
    }
    
  } catch (error) {
    console.error('❌ 数据库对比失败:', error.message);
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

// 执行对比
compareDatabases();