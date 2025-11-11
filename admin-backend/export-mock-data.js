const fs = require('fs');
const path = require('path');
const mockDatabase = require('./database/mock-database');

// 导出模拟数据为SQL格式
async function exportMockDataToSQL() {
  try {
    console.log('🔄 开始导出模拟数据...');
    
    // 初始化模拟数据库
    await mockDatabase.initDatabase();
    
    const database = mockDatabase.database;
    
    // 生成SQL文件内容
    let sqlContent = '';
    
    // 添加文件头注释
    sqlContent += `-- 导航页面数据导出\n`;
    sqlContent += `-- 导出时间: ${new Date().toISOString()}\n`;
    sqlContent += `-- 数据库: navigation_admin\n\n`;
    
    // 使用数据库
    sqlContent += `USE navigation_admin;\n\n`;
    
    // 清空现有数据
    sqlContent += `-- 清空现有数据\n`;
    sqlContent += `SET FOREIGN_KEY_CHECKS = 0;\n`;
    sqlContent += `TRUNCATE TABLE sites;\n`;
    sqlContent += `TRUNCATE TABLE categories;\n`;
    sqlContent += `TRUNCATE TABLE users;\n`;
    sqlContent += `SET FOREIGN_KEY_CHECKS = 1;\n\n`;
    
    // 导出用户数据
    sqlContent += `-- 用户数据\n`;
    for (const user of database.users) {
      const createdAt = user.created_at ? new Date(user.created_at).toISOString().slice(0, 19).replace('T', ' ') : new Date().toISOString().slice(0, 19).replace('T', ' ');
      const updatedAt = user.updated_at ? new Date(user.updated_at).toISOString().slice(0, 19).replace('T', ' ') : new Date().toISOString().slice(0, 19).replace('T', ' ');
      
      sqlContent += `INSERT INTO users (id, username, email, password, role, avatar, created_at, updated_at) VALUES `;
      sqlContent += `(${user.id}, '${user.username}', '${user.email}', '${user.password}', '${user.role}', `;
      sqlContent += `${user.avatar ? `'${user.avatar}'` : 'NULL'}, '${createdAt}', '${updatedAt}');\n`;
    }
    sqlContent += `\n`;
    
    // 导出分类数据
    sqlContent += `-- 分类数据\n`;
    for (const category of database.categories) {
      const createdAt = category.created_at ? new Date(category.created_at).toISOString().slice(0, 19).replace('T', ' ') : new Date().toISOString().slice(0, 19).replace('T', ' ');
      const updatedAt = category.updated_at ? new Date(category.updated_at).toISOString().slice(0, 19).replace('T', ' ') : new Date().toISOString().slice(0, 19).replace('T', ' ');
      
      sqlContent += `INSERT INTO categories (id, name, icon, sort_order, status, created_at, updated_at) VALUES `;
      sqlContent += `(${category.id}, '${category.name}', '${category.icon}', ${category.sort_order}, `;
      sqlContent += `'${category.status}', '${createdAt}', '${updatedAt}');\n`;
    }
    sqlContent += `\n`;
    
    // 导出网站数据
    sqlContent += `-- 网站数据\n`;
    for (const site of database.sites) {
      const createdAt = site.created_at ? new Date(site.created_at).toISOString().slice(0, 19).replace('T', ' ') : new Date().toISOString().slice(0, 19).replace('T', ' ');
      const updatedAt = site.updated_at ? new Date(site.updated_at).toISOString().slice(0, 19).replace('T', ' ') : new Date().toISOString().slice(0, 19).replace('T', ' ');
      
      sqlContent += `INSERT INTO sites (id, name, url, description, icon, category_id, sort_order, status, click_count, created_at, updated_at) VALUES `;
      sqlContent += `(${site.id}, '${site.name.replace(/'/g, "\\'")}', '${site.url}', `;
      sqlContent += `${site.description ? `'${site.description.replace(/'/g, "\\'")}'` : 'NULL'}, `;
      sqlContent += `'${site.icon}', ${site.category_id}, ${site.sort_order || 0}, `;
      sqlContent += `'${site.status}', ${site.click_count || 0}, '${createdAt}', '${updatedAt}');\n`;
    }
    sqlContent += `\n`;
    
    // 重置自增ID
    sqlContent += `-- 重置自增ID\n`;
    sqlContent += `ALTER TABLE users AUTO_INCREMENT = ${Math.max(...database.users.map(u => u.id)) + 1};\n`;
    sqlContent += `ALTER TABLE categories AUTO_INCREMENT = ${Math.max(...database.categories.map(c => c.id)) + 1};\n`;
    sqlContent += `ALTER TABLE sites AUTO_INCREMENT = ${Math.max(...database.sites.map(s => s.id)) + 1};\n`;
    
    // 保存SQL文件
// 统一导出文件名为 database-export.sql
const exportPath = path.join(__dirname, 'database-export.sql');
    fs.writeFileSync(exportPath, sqlContent, 'utf8');
    
    console.log('✅ 数据导出完成!');
    console.log(`📁 导出文件: ${exportPath}`);
    console.log(`👥 用户数量: ${database.users.length}`);
    console.log(`📂 分类数量: ${database.categories.length}`);
    console.log(`🌐 网站数量: ${database.sites.length}`);
    
    return exportPath;
    
  } catch (error) {
    console.error('❌ 导出失败:', error);
    throw error;
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  exportMockDataToSQL()
    .then(() => {
      console.log('🎉 导出完成!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 导出失败:', error);
      process.exit(1);
    });
}

module.exports = { exportMockDataToSQL };