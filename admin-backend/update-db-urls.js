const mysql = require('mysql2/promise');
const path = require('path');
const dotenv = require('dotenv');

// 加载环境变量
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env';
dotenv.config({ path: path.join(__dirname, envFile) });

// 尝试加载 server-config.env
const fs = require('fs');
const serverConfigFile = path.join(__dirname, 'server-config.env');
if (fs.existsSync(serverConfigFile)) {
    console.log('📝 Loading configuration from server-config.env');
    dotenv.config({ path: serverConfigFile });
}

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'navigation_db',
  charset: 'utf8mb4'
};

const updates = [
  { name: 'VitePress 博客', url: 'https://guluwater.com/vitepress/' },
  { name: 'Office Tools', url: 'https://guluwater.com/officetools/' },
  { name: 'Online Interface Full', url: 'https://guluwater.com/onlineinterfacefull/' },
  { name: 'Lite Image Previewer', url: 'https://guluwater.com/liteimagepreviewer/' },
  { name: 'Papercraft', url: 'https://guluwater.com/papercraft/' },
  { name: 'Mock Data Generator', url: 'https://guluwater.com/mockdatagenerator/' },
  { name: 'General Methods Utils', url: 'https://guluwater.com/generalmethodsutils/' },
  { name: 'Online Interface Lite', url: 'https://guluwater.com/onlineinterfacelite/' }
];

async function updateUrls() {
  let connection;
  try {
    console.log('🔄 Connecting to MySQL database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected.');

    for (const site of updates) {
      console.log(`Updating ${site.name} to ${site.url}...`);
      const [result] = await connection.execute(
        'UPDATE sites SET url = ? WHERE name = ?',
        [site.url, site.name]
      );
      if (result.affectedRows > 0) {
        console.log(`✅ Updated ${site.name}`);
      } else {
        console.log(`⚠️ Site not found or not updated: ${site.name}`);
      }
    }

    console.log('🎉 All updates completed.');
  } catch (error) {
    console.error('❌ Error updating database:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

updateUrls();
