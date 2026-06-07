const http = require('http');
const fs = require('fs');
const path = require('path');
const ROOT = '/Users/com-000055/Downloads/Project Management';
const MIME = { '.html':'text/html', '.js':'application/javascript', '.css':'text/css', '.json':'application/json', '.png':'image/png', '.ico':'image/x-icon' };
http.createServer((req, res) => {
  let url = req.url === '/' ? '/Project_Dashboard_v2.html' : req.url;
  const file = path.join(ROOT, url.split('?')[0]);
  const ext = path.extname(file);
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'text/plain' });
    res.end(data);
  });
}).listen(8080, () => console.log('Serving on http://localhost:8080'));
