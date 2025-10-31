const { pool } = require('./config/database');
const fs = require('fs');
const path = require('path');

async function createActivityTables() {
  let connection;
  
  try {
    // 使用现有的连接池
    connection = await pool.getConnection();
    console.log('Connected to MySQL database');

    // 读取SQL文件
    const sqlFile = path.join(__dirname, 'database', 'add-activity-logs.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');

    // 分割SQL语句并逐个执行
    const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);
    
    for (const statement of statements) {
      if (statement.trim()) {
        await connection.execute(statement);
      }
    }
    
    console.log('Activity tables created successfully!');

    // 验证表是否创建成功
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = 'navigation_admin' 
      AND TABLE_NAME IN ('activity_logs', 'visit_trends', 'category_stats')
    `);

    console.log('Created tables:', tables.map(t => t.TABLE_NAME));

  } catch (error) {
    console.error('Error creating activity tables:', error);
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

createActivityTables();