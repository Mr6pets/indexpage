const { pool } = require('./config/database');

// 网站图标映射表
const siteIconMapping = {
  '百度': '🔍',
  'GitHub': '🐙',
  'Vue.js': '💚',
  'React': '⚛️',
  'VS Code': '💙',
  'WebStorm': '🌊',
  'MDN Web Docs': '📖',
  'freeCodeCamp': '🔥',
  'Stack Overflow': '📚',
  'Can I Use': '✅'
};

// 根据网站名称或URL获取默认图标
const getDefaultIconForSite = (siteName, siteUrl) => {
  // 优先使用映射表中的图标
  if (siteIconMapping[siteName]) {
    return siteIconMapping[siteName];
  }
  
  // 根据URL域名推断图标
  if (siteUrl) {
    const url = siteUrl.toLowerCase();
    if (url.includes('github')) return '🐙';
    if (url.includes('google')) return '🔍';
    if (url.includes('baidu')) return '🔍';
    if (url.includes('stackoverflow')) return '📚';
    if (url.includes('mozilla') || url.includes('mdn')) return '📖';
    if (url.includes('vue')) return '💚';
    if (url.includes('react')) return '⚛️';
    if (url.includes('code.visualstudio')) return '💙';
    if (url.includes('jetbrains')) return '🌊';
    if (url.includes('freecodecamp')) return '🔥';
    if (url.includes('caniuse')) return '✅';
  }
  
  // 默认图标
  return '🌐';
};

async function updateSiteIcons() {
  let connection;
  
  try {
    console.log('🔄 连接数据库...');
    connection = await pool.getConnection();
    
    console.log('📋 检查当前网站图标...');
    const [sites] = await connection.execute(
      'SELECT id, name, url, icon FROM sites ORDER BY id'
    );
    
    console.log('\n=== 当前网站图标状态 ===');
    sites.forEach(site => {
      const iconStatus = site.icon ? `"${site.icon}"` : '无图标';
      console.log(`${site.id}. ${site.name} - 图标: ${iconStatus} - URL: ${site.url}`);
    });
    
    console.log('\n🔄 开始更新网站图标...');
    let updatedCount = 0;
    
    for (const site of sites) {
      if (!site.icon || site.icon.trim() === '') {
        const newIcon = getDefaultIconForSite(site.name, site.url);
        
        console.log(`为网站 "${site.name}" 添加图标: "${newIcon}"`);
        
        await connection.execute(
          'UPDATE sites SET icon = ? WHERE id = ?',
          [newIcon, site.id]
        );
        
        updatedCount++;
      } else {
        console.log(`保持网站 "${site.name}": "${site.icon}" (已有图标)`);
      }
    }
    
    console.log(`\n✅ 更新完成！共为 ${updatedCount} 个网站添加了图标`);
    
    // 验证更新结果
    console.log('\n📋 验证更新结果...');
    const [updatedSites] = await connection.execute(
      'SELECT id, name, url, icon FROM sites ORDER BY id'
    );
    
    console.log('\n=== 更新后的网站图标 ===');
    updatedSites.forEach(site => {
      console.log(`${site.id}. ${site.name} - 图标: "${site.icon}" - URL: ${site.url}`);
    });
    
  } catch (error) {
    console.error('❌ 更新失败:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      connection.release();
      console.log('\n🔌 数据库连接已释放');
    }
  }
}

// 执行更新
updateSiteIcons();