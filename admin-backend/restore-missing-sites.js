const mysql = require('mysql2/promise');
require('dotenv').config();

// 数据库连接配置
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'navigation_db',
  charset: 'utf8mb4'
};

// 从数据库导出文件（database-export.sql）提取的完整网站数据
const allSitesData = [
  {id: 1, name: '百度', description: '全球最大的中文搜索引擎', url: 'https://www.baidu.com', icon: '🔍', category_id: 1, click_count: 0, sort_order: 1, status: 'active'},
  {id: 2, name: 'Google', description: '全球最大的搜索引擎', url: 'https://www.google.com', icon: '🔍', category_id: 1, click_count: 0, sort_order: 2, status: 'active'},
  {id: 3, name: 'GitHub', description: '全球最大的代码托管平台', url: 'https://github.com', icon: '🐙', category_id: 2, click_count: 0, sort_order: 1, status: 'active'},
  {id: 4, name: 'Stack Overflow', description: '程序员问答社区', url: 'https://stackoverflow.com', icon: '📚', category_id: 2, click_count: 0, sort_order: 2, status: 'active'},
  {id: 5, name: 'Online Interface Full', description: '在线接口（完整版）', url: 'http://onlineinterfacefull.guluwater.com/', icon: '🧩', category_id: 1, click_count: 323, sort_order: 5, status: 'active'},
  {id: 6, name: 'Lite Image Previewer', description: '轻量图像预览器', url: 'http://liteimagepreviewer.guluwater.com/', icon: '🖼️', category_id: 1, click_count: 101, sort_order: 6, status: 'active'},
  {id: 7, name: 'Papercraft', description: '纸艺工具', url: 'http://papercraft.guluwater.com/', icon: '✂️', category_id: 1, click_count: 867, sort_order: 7, status: 'active'},
  {id: 8, name: 'Mock Data Generator', description: '智能数据模拟生成器', url: 'http://mockdatagenerator.guluwater.com/', icon: '🔄', category_id: 1, click_count: 737, sort_order: 8, status: 'active'},
  {id: 9, name: 'Vue.js', description: '渐进式 JavaScript 框架', url: 'https://vuejs.org/', icon: '💚', category_id: 2, click_count: 752, sort_order: 1, status: 'active'},
  {id: 10, name: 'React', description: 'Facebook 开发的 UI 库', url: 'https://reactjs.org/', icon: '⚛️', category_id: 2, click_count: 803, sort_order: 2, status: 'active'},
  {id: 11, name: 'Angular', description: 'Google 开发的前端框架', url: 'https://angular.io/', icon: '🅰️', category_id: 2, click_count: 15, sort_order: 3, status: 'active'},
  {id: 12, name: 'Svelte', description: '编译时优化的前端框架', url: 'https://svelte.dev/', icon: '🔥', category_id: 2, click_count: 387, sort_order: 4, status: 'active'},
  {id: 13, name: 'VS Code', description: '微软开发的代码编辑器', url: 'https://code.visualstudio.com/', icon: '💙', category_id: 3, click_count: 897, sort_order: 1, status: 'active'},
  {id: 14, name: 'WebStorm', description: 'JetBrains 的 Web IDE', url: 'https://www.jetbrains.com/webstorm/', icon: '🌊', category_id: 3, click_count: 853, sort_order: 2, status: 'active'},
  {id: 15, name: 'Chrome DevTools', description: '浏览器开发者工具', url: 'https://developer.chrome.com/docs/devtools/', icon: '🔍', category_id: 3, click_count: 965, sort_order: 3, status: 'active'},
  {id: 16, name: 'Figma', description: '协作式设计工具', url: 'https://figma.com/', icon: '🎨', category_id: 3, click_count: 828, sort_order: 4, status: 'active'},
  {id: 17, name: 'MDN Web Docs', description: 'Web 技术权威文档', url: 'https://developer.mozilla.org/', icon: '📖', category_id: 4, click_count: 504, sort_order: 1, status: 'active'},
  {id: 18, name: 'freeCodeCamp', description: '免费编程学习平台', url: 'https://www.freecodecamp.org/', icon: '🔥', category_id: 4, click_count: 147, sort_order: 2, status: 'active'},
  {id: 19, name: 'Codecademy', description: '交互式编程学习', url: 'https://www.codecademy.com/', icon: '🎓', category_id: 4, click_count: 712, sort_order: 3, status: 'active'},
  {id: 20, name: 'JavaScript.info', description: 'JavaScript 深度教程', url: 'https://javascript.info/', icon: '📚', category_id: 4, click_count: 44, sort_order: 4, status: 'active'},
  {id: 21, name: 'Stack Overflow', description: '程序员问答社区', url: 'https://stackoverflow.com/', icon: '📚', category_id: 5, click_count: 404, sort_order: 1, status: 'active'},
  {id: 22, name: 'GitHub Discussions', description: 'GitHub 社区讨论', url: 'https://github.com/discussions', icon: '💬', category_id: 5, click_count: 484, sort_order: 2, status: 'active'},
  {id: 23, name: 'Dev.to', description: '开发者社区平台', url: 'https://dev.to/', icon: '👩‍💻', category_id: 5, click_count: 877, sort_order: 3, status: 'active'},
  {id: 24, name: 'Reddit Programming', description: 'Reddit 编程社区', url: 'https://www.reddit.com/r/programming/', icon: '🤖', category_id: 5, click_count: 334, sort_order: 4, status: 'active'},
  {id: 25, name: 'Can I Use', description: '浏览器兼容性查询', url: 'https://caniuse.com/', icon: '✅', category_id: 6, click_count: 950, sort_order: 1, status: 'active'},
  {id: 26, name: 'RegExr', description: '正则表达式测试工具', url: 'https://regexr.com/', icon: '🔤', category_id: 6, click_count: 693, sort_order: 2, status: 'active'},
  {id: 27, name: 'JSON Formatter', description: 'JSON 格式化工具', url: 'https://jsonformatter.curiousconcept.com/', icon: '📋', category_id: 6, click_count: 853, sort_order: 3, status: 'active'},
  {id: 28, name: 'Color Hunt', description: '配色方案灵感', url: 'https://colorhunt.co/', icon: '🎨', category_id: 6, click_count: 18, sort_order: 4, status: 'active'},
  {id: 29, name: 'Postman', description: 'API 开发测试工具', url: 'https://www.postman.com/', icon: '📮', category_id: 6, click_count: 891, sort_order: 5, status: 'active'}
];

async function restoreMissingSites() {
  let connection;
  
  try {
    console.log('🔄 开始恢复缺失的网站数据...');
    
    // 连接数据库
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ 数据库连接成功');
    
    // 获取当前数据库中的网站
    const [currentSites] = await connection.execute('SELECT id, name FROM sites ORDER BY id');
    console.log(`📊 当前数据库中有 ${currentSites.length} 个网站`);
    
    const currentSiteIds = new Set(currentSites.map(site => site.id));
    const missingSites = allSitesData.filter(site => !currentSiteIds.has(site.id));
    
    console.log(`🔍 发现 ${missingSites.length} 个缺失的网站需要恢复`);
    
    if (missingSites.length === 0) {
      console.log('✅ 所有网站数据都已存在，无需恢复');
      return;
    }
    
    // 开始恢复缺失的网站
    let restoredCount = 0;
    
    for (const site of missingSites) {
      try {
        await connection.execute(
          `INSERT INTO sites (id, name, description, url, icon, category_id, click_count, sort_order, status, created_at, updated_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [site.id, site.name, site.description, site.url, site.icon, site.category_id, site.click_count, site.sort_order, site.status]
        );
        
        console.log(`✅ 恢复网站: ${site.name} (ID: ${site.id})`);
        restoredCount++;
      } catch (error) {
        console.error(`❌ 恢复网站失败 ${site.name} (ID: ${site.id}):`, error.message);
      }
    }
    
    // 验证恢复结果
    const [finalSites] = await connection.execute('SELECT COUNT(*) as count FROM sites WHERE status = "active"');
    console.log(`\n📊 恢复完成统计:`);
    console.log(`   - 成功恢复: ${restoredCount} 个网站`);
    console.log(`   - 当前活跃网站总数: ${finalSites[0].count} 个`);
    
    // 按分类统计网站数量
    const [categoryStats] = await connection.execute(`
      SELECT c.name as category_name, COUNT(s.id) as site_count 
      FROM categories c 
      LEFT JOIN sites s ON c.id = s.category_id AND s.status = 'active'
      GROUP BY c.id, c.name 
      ORDER BY c.sort_order
    `);
    
    console.log(`\n📈 各分类网站数量:`);
    categoryStats.forEach(stat => {
      console.log(`   - ${stat.category_name}: ${stat.site_count} 个网站`);
    });
    
  } catch (error) {
    console.error('❌ 恢复网站数据失败:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 数据库连接已关闭');
    }
  }
}

// 执行恢复
restoreMissingSites().then(() => {
  console.log('🎉 网站数据恢复任务完成！');
}).catch(error => {
  console.error('💥 恢复任务执行失败:', error.message);
});