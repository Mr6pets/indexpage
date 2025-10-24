const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// 确保数据目录存在
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'navigation.db');

// 创建SQLite数据库连接
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ SQLite数据库连接失败:', err.message);
  } else {
    console.log('✅ SQLite数据库连接成功');
  }
});

// 初始化SQLite数据库表
function initSQLiteDatabase() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // 用户表
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          role TEXT DEFAULT 'user' CHECK(role IN ('admin', 'user')),
          avatar TEXT,
          status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // 分类表
      db.run(`
        CREATE TABLE IF NOT EXISTS categories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          description TEXT,
          icon TEXT DEFAULT 'Link',
          sort_order INTEGER DEFAULT 0,
          status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // 网站表
      db.run(`
        CREATE TABLE IF NOT EXISTS sites (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          description TEXT,
          url TEXT NOT NULL,
          icon TEXT,
          category_id INTEGER,
          click_count INTEGER DEFAULT 0,
          sort_order INTEGER DEFAULT 0,
          status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
        )
      `);

      // 系统设置表
      db.run(`
        CREATE TABLE IF NOT EXISTS settings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          key_name TEXT UNIQUE NOT NULL,
          value TEXT,
          description TEXT,
          type TEXT DEFAULT 'string' CHECK(type IN ('string', 'number', 'boolean', 'json')),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // 访问统计表
      db.run(`
        CREATE TABLE IF NOT EXISTS statistics (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          site_id INTEGER,
          ip_address TEXT,
          user_agent TEXT,
          referer TEXT,
          visited_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE
        )
      `, (err) => {
        if (err) {
          console.error('❌ SQLite表创建失败:', err.message);
          reject(err);
        } else {
          console.log('✅ SQLite数据库表创建完成');
          insertDefaultSQLiteData().then(resolve).catch(reject);
        }
      });
    });
  });
}

// 插入默认数据
async function insertDefaultSQLiteData() {
  const bcrypt = require('bcryptjs');
  
  return new Promise((resolve, reject) => {
    db.serialize(async () => {
      try {
        // 检查是否已有管理员用户
        db.get('SELECT COUNT(*) as count FROM users WHERE role = "admin"', async (err, row) => {
          if (err) {
            reject(err);
            return;
          }

          if (row.count === 0) {
            const hashedPassword = await bcrypt.hash('123456', 10);
            db.run(
              'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
              ['admin', 'admin@example.com', hashedPassword, 'admin'],
              function(err) {
                if (err) {
                  console.error('❌ 创建管理员用户失败:', err.message);
                } else {
                  console.log('✅ 默认管理员用户创建完成 (admin/123456)');
                }
              }
            );
          }

          // 插入默认分类
          db.get('SELECT COUNT(*) as count FROM categories', (err, row) => {
            if (err) {
              reject(err);
              return;
            }

            if (row.count === 0) {
              const categories = [
                ['常用工具', '日常工作中常用的在线工具', 'Setting', 1],
                ['开发资源', '编程开发相关的资源和工具', 'Document', 2],
                ['学习教育', '在线学习和教育平台', 'User', 3],
                ['娱乐休闲', '娱乐和休闲相关的网站', 'DataAnalysis', 4]
              ];

              const stmt = db.prepare('INSERT INTO categories (name, description, icon, sort_order) VALUES (?, ?, ?, ?)');
              categories.forEach(category => {
                stmt.run(category);
              });
              stmt.finalize();
              console.log('✅ 默认分类创建完成');
            }

            // 插入默认网站
            db.get('SELECT COUNT(*) as count FROM sites', (err, row) => {
              if (err) {
                reject(err);
                return;
              }

              if (row.count === 0) {
                const sites = [
                  ['百度', '全球最大的中文搜索引擎', 'https://www.baidu.com', 1, 1],
                  ['Google', '全球最大的搜索引擎', 'https://www.google.com', 1, 2],
                  ['GitHub', '全球最大的代码托管平台', 'https://github.com', 2, 1],
                  ['Stack Overflow', '程序员问答社区', 'https://stackoverflow.com', 2, 2]
                ];

                const stmt = db.prepare('INSERT INTO sites (name, description, url, category_id, sort_order) VALUES (?, ?, ?, ?, ?)');
                sites.forEach(site => {
                  stmt.run(site);
                });
                stmt.finalize();
                console.log('✅ 默认网站创建完成');
              }

              // 插入默认设置
              db.get('SELECT COUNT(*) as count FROM settings', (err, row) => {
                if (err) {
                  reject(err);
                  return;
                }

                if (row.count === 0) {
                  const settings = [
                    ['site_title', '咕噜水导航', '网站标题', 'string'],
                    ['site_description', '一个简洁实用的网址导航站', '网站描述', 'string'],
                    ['site_keywords', '导航,网址,工具,资源', '网站关键词', 'string'],
                    ['enable_statistics', 'true', '是否启用访问统计', 'boolean'],
                    ['max_sites_per_category', '20', '每个分类最大网站数量', 'number']
                  ];

                  const stmt = db.prepare('INSERT INTO settings (key_name, value, description, type) VALUES (?, ?, ?, ?)');
                  settings.forEach(setting => {
                    stmt.run(setting);
                  });
                  stmt.finalize();
                  console.log('✅ 默认系统设置创建完成');
                }

                console.log('🎉 SQLite数据库初始化完成');
                resolve();
              });
            });
          });
        });
      } catch (error) {
        reject(error);
      }
    });
  });
}

module.exports = {
  db,
  initSQLiteDatabase
};