const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

// 数据库连接配置
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'navigation_admin',
  multipleStatements: true
};

async function exportDatabase() {
  let connection;
  
  try {
    console.log('🔄 连接到MySQL数据库...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ 数据库连接成功');

    // 获取所有表名
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ?
    `, [dbConfig.database]);

    console.log(`📋 找到 ${tables.length} 个表:`, tables.map(t => t.TABLE_NAME).join(', '));

    let sqlContent = '';
    sqlContent += `-- 数据库导出文件\n`;
    sqlContent += `-- 生成时间: ${new Date().toLocaleString()}\n`;
    sqlContent += `-- 数据库: ${dbConfig.database}\n\n`;
    
    sqlContent += `-- 设置字符集\n`;
    sqlContent += `SET NAMES utf8mb4;\n`;
    sqlContent += `SET FOREIGN_KEY_CHECKS = 0;\n\n`;

    // 导出每个表的结构和数据
    for (const table of tables) {
      const tableName = table.TABLE_NAME;
      console.log(`📤 导出表: ${tableName}`);

      // 获取表结构
      const [createTable] = await connection.execute(`SHOW CREATE TABLE \`${tableName}\``);
      sqlContent += `-- 表结构: ${tableName}\n`;
      sqlContent += `DROP TABLE IF EXISTS \`${tableName}\`;\n`;
      sqlContent += `${createTable[0]['Create Table']};\n\n`;

      // 获取表数据
      const [rows] = await connection.execute(`SELECT * FROM \`${tableName}\``);
      
      if (rows.length > 0) {
        sqlContent += `-- 表数据: ${tableName}\n`;
        
        // 获取列名
        const [columns] = await connection.execute(`
          SELECT COLUMN_NAME 
          FROM INFORMATION_SCHEMA.COLUMNS 
          WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
          ORDER BY ORDINAL_POSITION
        `, [dbConfig.database, tableName]);
        
        const columnNames = columns.map(col => `\`${col.COLUMN_NAME}\``).join(', ');
        
        // 分批插入数据（每100条一批）
        const batchSize = 100;
        for (let i = 0; i < rows.length; i += batchSize) {
          const batch = rows.slice(i, i + batchSize);
          
          sqlContent += `INSERT INTO \`${tableName}\` (${columnNames}) VALUES\n`;
          
          const values = batch.map(row => {
            const rowValues = Object.values(row).map(value => {
              if (value === null) return 'NULL';
              if (typeof value === 'string') {
                return `'${value.replace(/'/g, "''").replace(/\\/g, '\\\\')}'`;
              }
              if (value instanceof Date) {
                return `'${value.toISOString().slice(0, 19).replace('T', ' ')}'`;
              }
              return value;
            });
            return `(${rowValues.join(', ')})`;
          });
          
          sqlContent += values.join(',\n') + ';\n\n';
        }
        
        console.log(`  ✅ 导出 ${rows.length} 条记录`);
      } else {
        console.log(`  ℹ️  表 ${tableName} 无数据`);
      }
    }

    sqlContent += `SET FOREIGN_KEY_CHECKS = 1;\n`;

    // 保存到文件
    const exportPath = path.join(__dirname, 'database-export.sql');
    await fs.writeFile(exportPath, sqlContent, 'utf8');
    
    console.log(`\n🎉 数据库导出完成!`);
    console.log(`📁 导出文件: ${exportPath}`);
    console.log(`📊 文件大小: ${(sqlContent.length / 1024).toFixed(2)} KB`);

    // 显示统计信息
    console.log('\n📈 导出统计:');
    for (const table of tables) {
      const tableName = table.TABLE_NAME;
      const [countResult] = await connection.execute(`SELECT COUNT(*) as count FROM \`${tableName}\``);
      console.log(`  ${tableName}: ${countResult[0].count} 条记录`);
    }

  } catch (error) {
    console.error('❌ 导出失败:', error.message);
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\n💡 解决方案:');
      console.log('1. 检查 .env 文件中的数据库配置');
      console.log('2. 确保MySQL服务正在运行');
      console.log('3. 验证数据库用户名和密码');
    }
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// 运行导出
exportDatabase();