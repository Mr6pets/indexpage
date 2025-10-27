// 调试统计接口
const express = require('express');
const { authenticateToken } = require('./middleware/auth');

// 尝试使用MySQL，如果失败则使用模拟数据库
let database;
try {
  database = require('./config/database');
  console.log('✅ 使用MySQL数据库');
} catch (error) {
  console.log('⚠️ MySQL连接失败，使用模拟数据库');
  database = require('./database/mock-database');
}

async function debugStats() {
  try {
    console.log('🔍 开始调试统计功能...');
    
    // 检查数据库类型
    const { siteOperations, categoryOperations, userOperations } = database;
    
    if (siteOperations && categoryOperations && userOperations) {
      console.log('📊 使用模拟数据库进行统计');
      
      // 获取数据
      const sites = siteOperations.getAll();
      const categories = categoryOperations.getAll();
      const users = userOperations.getAll();
      
      console.log('📈 数据统计:');
      console.log('- 站点数量:', sites.length);
      console.log('- 分类数量:', categories.length);
      console.log('- 用户数量:', users.length);
      
      // 检查数据结构
      if (sites.length > 0) {
        console.log('📋 站点数据示例:', JSON.stringify(sites[0], null, 2));
      }
      
      if (categories.length > 0) {
        console.log('📋 分类数据示例:', JSON.stringify(categories[0], null, 2));
      }
      
      // 计算统计数据
      const activeSites = sites.filter(site => site.status === 'active');
      const activeCategories = categories.filter(cat => cat.status === 'active');
      
      console.log('✅ 活跃站点数量:', activeSites.length);
      console.log('✅ 活跃分类数量:', activeCategories.length);
      
      const totalSites = [{ total: activeSites.length }];
      const totalCategories = [{ total: activeCategories.length }];
      const totalUsers = [{ total: users.length }];
      const totalClicks = [{ total: sites.reduce((sum, site) => sum + (site.click_count || 0), 0) }];
      
      // 模拟访问量数据
      const todayVisits = [{ total: Math.floor(Math.random() * 100) + 50 }];
      const monthVisits = [{ total: Math.floor(Math.random() * 1000) + 500 }];
      
      // 获取最受欢迎的网站
      const popularSites = activeSites
        .sort((a, b) => (b.click_count || 0) - (a.click_count || 0))
        .slice(0, 10)
        .map(site => {
          const category = categories.find(cat => cat.id === site.category_id);
          return {
            ...site,
            category_name: category ? category.name : null
          };
        });
      
      // 模拟最近访问记录
      const recentVisits = activeSites.slice(0, 10).map((site, index) => ({
        id: index + 1,
        site_id: site.id,
        site_name: site.name,
        site_url: site.url,
        ip_address: `192.168.1.${Math.floor(Math.random() * 255)}`,
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        created_at: new Date(Date.now() - Math.random() * 86400000).toISOString()
      }));
      
      const result = {
        success: true,
        data: {
          overview: {
            total_sites: totalSites[0].total,
            total_categories: totalCategories[0].total,
            total_users: totalUsers[0].total,
            total_clicks: totalClicks[0].total || 0,
            today_visits: todayVisits[0].total,
            month_visits: monthVisits[0].total
          },
          popular_sites: popularSites,
          recent_visits: recentVisits
        }
      };
      
      console.log('🎉 统计结果:', JSON.stringify(result, null, 2));
      
    } else {
      console.log('❌ 无法获取数据库操作对象');
    }
    
  } catch (error) {
    console.error('❌ 调试过程中出现错误:', error);
    console.error('错误堆栈:', error.stack);
  }
}

debugStats();