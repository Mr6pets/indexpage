const http = require('http');

// 测试站点列表API
function testSitesAPI() {
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/sites',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const req = http.request(options, (res) => {
    console.log('Sites Status Code:', res.statusCode);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('Sites Response:', data);
      try {
        const parsed = JSON.parse(data);
        console.log('Sites Parsed Response:', JSON.stringify(parsed, null, 2));
      } catch (e) {
        console.log('Failed to parse JSON response');
      }
    });
  });

  req.on('error', (e) => {
    console.error('Sites API Error:', e.message);
  });

  req.end();
}

testSitesAPI();