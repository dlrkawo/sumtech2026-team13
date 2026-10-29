// 실험용 정적 서버: node server.js → http://localhost:4173
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 4173;

http
  .createServer((req, res) => {
    const name = req.url === '/' ? 'share.html' : req.url.slice(1);
    const file =
      name === 'html2canvas.min.js'
        ? require.resolve('html2canvas/dist/html2canvas.min.js')
        : path.join(__dirname, 'pages', path.basename(name));
    const type = name.endsWith('.js') ? 'text/javascript' : 'text/html; charset=utf-8';
    fs.readFile(file, (err, body) => {
      if (err) {
        res.writeHead(404).end('not found');
        return;
      }
      res.writeHead(200, { 'Content-Type': type }).end(body);
    });
  })
  .listen(PORT, () => console.log(`http://localhost:${PORT}`));
