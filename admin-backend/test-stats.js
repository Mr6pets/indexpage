const http = require('http');

// 测试统计API
function testStatsAPI() {
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/stats/overview',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const req = http.request(options, (res) => {
    console.log('Stats Status Code:', res.statusCode);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('Stats Response:', data);
      try {
        const parsed = JSON.parse(data);
        console.log('Stats Parsed Response:', JSON.stringify(parsed, null, 2));
      } catch (e) {
        console.log('Failed to parse JSON response');
      }
    });
  });

  req.on('error', (e) => {
    console.error('Stats API Error:', e.message);
  });

  req.end();
}

testStatsAPI();