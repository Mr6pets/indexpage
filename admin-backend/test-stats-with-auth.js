const http = require('http');

// 首先登录获取token
function login() {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      username: 'admin',
      password: 'admin123'
    });

    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.success && response.data && response.data.token) {
            resolve(response.data.token);
          } else {
            reject(new Error('登录失败: ' + data));
          }
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

// 使用token访问统计接口
function getStats(token) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/stats/overview',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        console.log('Stats Status Code:', res.statusCode);
        console.log('Stats Response:', data);
        try {
          const response = JSON.parse(data);
          console.log('Stats Parsed Response:', JSON.stringify(response, null, 2));
          resolve(response);
        } catch (error) {
          console.log('Failed to parse response:', error.message);
          resolve(data);
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

// 执行测试
async function testStatsWithAuth() {
  try {
    console.log('正在登录...');
    const token = await login();
    console.log('登录成功，获取到token');
    
    console.log('正在访问统计接口...');
    await getStats(token);
  } catch (error) {
    console.error('测试失败:', error.message);
  }
}

testStatsWithAuth();