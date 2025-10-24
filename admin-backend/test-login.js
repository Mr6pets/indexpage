const http = require('http');

// 测试登录API
const testLogin = () => {
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
      console.log('Login Status Code:', res.statusCode);
      console.log('Login Response:', data);
      try {
        const parsed = JSON.parse(data);
        console.log('Login Parsed Response:', JSON.stringify(parsed, null, 2));
      } catch (e) {
        console.log('Failed to parse JSON:', e.message);
      }
    });
  });

  req.on('error', (e) => {
    console.error('Login Request error:', e.message);
  });

  req.write(postData);
  req.end();
};

testLogin();