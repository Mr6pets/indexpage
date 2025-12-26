const mysql = require('mysql2/promise');
const https = require('https');
require('dotenv').config();

// 阿里云数据库配置
const dbConfig = {
  host: process.env.ALIYUN_DB_HOST,
  port: process.env.ALIYUN_DB_PORT || 3306,
  user: process.env.ALIYUN_DB_USER,
  password: process.env.ALIYUN_DB_PASSWORD,
  database: process.env.ALIYUN_DB_NAME
};

function getPublicIp() {
  return new Promise((resolve) => {
    https.get('https://api.ipify.org?format=json', (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const ip = JSON.parse(data).ip;
          resolve(ip);
        } catch (e) {
          resolve(null);
        }
      });
    }).on('error', () => resolve(null));
  });
}

async function checkConnection() {
  console.log('🔄 正在测试阿里云数据库连接...');
  console.log(`📡 目标地址: ${dbConfig.host}:${dbConfig.port}`);
  console.log(`👤 用户名: ${dbConfig.user}`);
  
  try {
    const connection = await mysql.createConnection(dbConfig);
    console.log('\n✅ 连接成功！');
    console.log('🎉 恭喜，您的白名单配置正确，可以正常访问阿里云数据库。');
    await connection.end();
  } catch (error) {
    console.log('\n❌ 连接失败！');
    console.error(`错误信息: ${error.message}`);
    
    if (error.code === 'ETIMEDOUT') {
      console.log('\n⚠️  连接超时。可能是网络问题，或者防火墙拦截。');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR' || error.message.includes('Access denied')) {
      console.log('\n🚫 访问被拒绝。极大概率是 **IP白名单** 未配置或配置错误。');
      
      console.log('⏳ 正在获取本机公网 IP...');
      const ip = await getPublicIp();
      
      if (ip) {
        console.log(`\n🔑 请将此 IP 地址添加到阿里云 RDS 白名单中:`);
        console.log(`👉  ${ip}  👈`);
      } else {
        console.log('\n🔑 请查询本机公网 IP 并添加到阿里云 RDS 白名单中。');
        console.log('   (可以在百度搜索 "IP" 查看)');
      }
    }
  }
}

checkConnection();
