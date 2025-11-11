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

async function getTableStructure(conn, tableName) {
  try {
    const [columns] = await conn.query(`DESCRIBE ${tableName}`);
    return columns.map(col => ({
      field: col.Field,
      type: col.Type,
      null: col.Null,
      key: col.Key,
      default: col.Default,
      extra: col.Extra
    }));
  } catch (error) {
    console.error(`❌ 获取表结构失败 ${tableName}: ${error.message}`);
    return null;
  }
}

async function compareTableStructure(localConn, aliyunConn, tableName) {
  console.log(`\n📋 对比表结构: ${tableName}`);
  console.log('='.repeat(50));
  
  const localStructure = await getTableStructure(localConn, tableName);
  const aliyunStructure = await getTableStructure(aliyunConn, tableName);
  
  if (!localStructure || !aliyunStructure) {
    return;
  }
  
  // 创建字段映射
  const localFields = new Map();
  const aliyunFields = new Map();
  
  localStructure.forEach(col => {
    localFields.set(col.field, col);
  });
  
  aliyunStructure.forEach(col => {
    aliyunFields.set(col.field, col);
  });
  
  // 检查差异
  const localOnly = [];
  const aliyunOnly = [];
  const different = [];
  
  // 本地独有的字段
  for (const [field, col] of localFields) {
    if (!aliyunFields.has(field)) {
      localOnly.push(col);
    } else {
      // 检查字段定义是否相同
      const aliyunCol = aliyunFields.get(field);
      if (col.type !== aliyunCol.type || col.null !== aliyunCol.null) {
        different.push({
          field,
          local: col,
          aliyun: aliyunCol
        });
      }
    }
  }
  
  // 阿里云独有的字段
  for (const [field, col] of aliyunFields) {
    if (!localFields.has(field)) {
      aliyunOnly.push(col);
    }
  }
  
  // 输出结果
  console.log(`本地字段数: ${localStructure.length}`);
  console.log(`阿里云字段数: ${aliyunStructure.length}`);
  
  if (localOnly.length > 0) {
    console.log(`\n🔴 仅存在于本地的字段 (${localOnly.length}个):`);
    localOnly.forEach(col => {
      console.log(`   - ${col.field}: ${col.type} ${col.null === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
  }
  
  if (aliyunOnly.length > 0) {
    console.log(`\n🔵 仅存在于阿里云的字段 (${aliyunOnly.length}个):`);
    aliyunOnly.forEach(col => {
      console.log(`   - ${col.field}: ${col.type} ${col.null === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
  }
  
  if (different.length > 0) {
    console.log(`\n🟡 定义不同的字段 (${different.length}个):`);
    different.forEach(diff => {
      console.log(`   - ${diff.field}:`);
      console.log(`     本地: ${diff.local.type} ${diff.local.null === 'YES' ? 'NULL' : 'NOT NULL'}`);
      console.log(`     阿里云: ${diff.aliyun.type} ${diff.aliyun.null === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
  }
  
  if (localOnly.length === 0 && aliyunOnly.length === 0 && different.length === 0) {
    console.log('✅ 表结构完全一致');
  }
  
  return {
    localOnly: localOnly.length,
    aliyunOnly: aliyunOnly.length,
    different: different.length
  };
}

async function checkTableStructures() {
  let localConn, aliyunConn;
  
  try {
    console.log('🔍 检查本地和阿里云MySQL数据库表结构...');
    console.log('='.repeat(60));
    
    // 连接数据库
    console.log('📡 连接本地MySQL数据库...');
    localConn = await mysql.createConnection(localConfig);
    console.log('✅ 本地MySQL连接成功');
    
    console.log('📡 连接阿里云MySQL数据库...');
    aliyunConn = await mysql.createConnection(aliyunConfig);
    console.log('✅ 阿里云MySQL连接成功');
    
    // 获取所有表
    const [localTables] = await localConn.query('SHOW TABLES');
    const [aliyunTables] = await aliyunConn.query('SHOW TABLES');
    
    const localTableNames = localTables.map(row => Object.values(row)[0]);
    const aliyunTableNames = aliyunTables.map(row => Object.values(row)[0]);
    
    console.log(`\n📊 表数量对比:`);
    console.log(`本地表数: ${localTableNames.length}`);
    console.log(`阿里云表数: ${aliyunTableNames.length}`);
    
    // 找出共同的表
    const commonTables = localTableNames.filter(table => aliyunTableNames.includes(table));
    console.log(`共同表数: ${commonTables.length}`);
    
    if (localTableNames.length !== aliyunTableNames.length) {
      const localOnly = localTableNames.filter(table => !aliyunTableNames.includes(table));
      const aliyunOnly = aliyunTableNames.filter(table => !localTableNames.includes(table));
      
      if (localOnly.length > 0) {
        console.log(`🔴 仅存在于本地的表: ${localOnly.join(', ')}`);
      }
      if (aliyunOnly.length > 0) {
        console.log(`🔵 仅存在于阿里云的表: ${aliyunOnly.join(', ')}`);
      }
    }
    
    // 对比每个共同表的结构
    const summary = {};
    for (const tableName of commonTables) {
      const result = await compareTableStructure(localConn, aliyunConn, tableName);
      if (result) {
        summary[tableName] = result;
      }
    }
    
    // 输出总结
    console.log('\n📋 表结构对比总结');
    console.log('='.repeat(60));
    
    let totalDifferences = 0;
    for (const [table, stats] of Object.entries(summary)) {
      const hasDiff = stats.localOnly > 0 || stats.aliyunOnly > 0 || stats.different > 0;
      const status = hasDiff ? '❌' : '✅';
      console.log(`${status} ${table}`);
      
      if (hasDiff) {
        totalDifferences++;
        if (stats.localOnly > 0) console.log(`    - 本地独有字段: ${stats.localOnly}个`);
        if (stats.aliyunOnly > 0) console.log(`    - 阿里云独有字段: ${stats.aliyunOnly}个`);
        if (stats.different > 0) console.log(`    - 定义不同字段: ${stats.different}个`);
      }
    }
    
    console.log('\n🎯 建议:');
    if (totalDifferences === 0) {
      console.log('✅ 表结构完全一致，可以直接同步数据');
    } else {
      console.log('⚠️ 发现表结构差异，需要先同步表结构再同步数据');
      console.log('1. 创建表结构同步脚本');
      console.log('2. 执行表结构同步');
      console.log('3. 再执行数据同步');
    }
    
  } catch (error) {
    console.error('❌ 检查失败:', error.message);
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

// 执行检查
checkTableStructures();