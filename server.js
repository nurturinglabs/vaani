const http = require('http');
const fs = require('fs');
const path = require('path');

// Load API handler
const voiceTranslate = require('./api/voice-translate');

// Set API key
process.env.SARVAM_API_KEY = process.env.SARVAM_API_KEY || '';

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.wav': 'audio/wav',
  '.json': 'application/json',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

const server = http.createServer(async (req, res) => {
  // Handle API route
  if (req.url === '/api/voice-translate' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      req.body = JSON.parse(body);
      const fakeRes = {
        statusCode: 200,
        status(code) { this.statusCode = code; return this; },
        json(data) {
          res.writeHead(this.statusCode, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(data));
        }
      };
      await voiceTranslate(req, fakeRes);
    });
    return;
  }

  // Serve static files
  let filePath = req.url === '/' ? '/index.html' : req.url;
  filePath = filePath.split('?')[0]; // strip query params
  const fullPath = path.join(__dirname, filePath);

  const ext = path.extname(fullPath);
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(fullPath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`\n  Vaani running at http://localhost:${PORT}\n`);
  console.log(`  Pages:`);
  console.log(`    Landing:   http://localhost:${PORT}/`);
  console.log(`    Translate: http://localhost:${PORT}/translate.html?from=hi-IN&to=kn-IN`);
  console.log(`    Demos:     http://localhost:${PORT}/demos.html\n`);
});
