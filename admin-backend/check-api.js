const http = require('http');

http.get('http://localhost:3001/api/sites?limit=1000&active=true', (res) => {
  console.log('Status Code:', res.statusCode);
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      const vitepress = json.data.items.find(s => s.name.includes('VitePress'));
      console.log('VitePress URL:', vitepress ? vitepress.url : 'Not Found');
    } catch (e) {
      console.log('Response:', data);
    }
  });
}).on('error', (err) => {
  console.error('Error:', err.message);
});
