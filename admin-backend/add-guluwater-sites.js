const database = require('./config/database');
const { pool } = database;

async function addGuluWaterSites() {
  try {
    console.log('开始添加GuluWater网站...');
    
    // 获取常用工具分类的ID
    const [categories] = await pool.execute('SELECT id FROM categories WHERE name = "常用工具"');
    if (categories.length === 0) {
      throw new Error('找不到"常用工具"分类');
    }
    const categoryId = categories[0].id;
    console.log(`常用工具分类ID: ${categoryId}`);
    
    // 要添加的网站数据
    const sites = [
      {
        name: 'VitePress 博客',
        url: 'https://guluwater.com/vitepress/',
        description: '专业的 Vue 3 博客',
        icon: '💧',
        sort_order: 1
      },
      {
        name: '通用方法库',
        url: 'https://guluwater.com/generalmethodsutils/',
        description: '实用的JavaScript工具库',
        icon: '🛠️',
        sort_order: 2
      },
      {
        name: 'Office Tools',
        url: 'https://guluwater.com/officetools/',
        description: '办公工具集',
        icon: '📄',
        sort_order: 3
      }
    ];
    
    // 添加每个网站
    for (const site of sites) {
      // 检查网站是否已存在
      const [existing] = await pool.execute('SELECT id FROM sites WHERE url = ?', [site.url]);
      
      if (existing.length > 0) {
        console.log(`网站 ${site.name} 已存在，跳过添加`);
        continue;
      }
      
      // 添加网站
      const [result] = await pool.execute(
        'INSERT INTO sites (name, url, description, icon, category_id, sort_order, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [site.name, site.url, site.description, site.icon, categoryId, site.sort_order, 'active']
      );
      
      console.log(`✅ 成功添加网站: ${site.name} (ID: ${result.insertId})`);
    }
    
    console.log('\n所有GuluWater网站添加完成！');
    process.exit(0);
  } catch (error) {
    console.error('添加网站失败:', error);
    process.exit(1);
  }
}

addGuluWaterSites();