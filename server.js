const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const sessions = new Map();

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, '{}');

function readUsers() {
  try { return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8') || '{}'); }
  catch { return {}; }
}
function writeUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}
function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { salt, hash };
}
function verifyPassword(password, user) {
  const derived = crypto.scryptSync(password, user.passwordSalt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(derived, 'hex'), Buffer.from(user.passwordHash, 'hex'));
}
function publicUser(user) {
  const copy = { ...user };
  delete copy.passwordHash;
  delete copy.passwordSalt;
  return copy;
}
function newToken() {
  return crypto.randomBytes(32).toString('hex');
}
function authUser(req) {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) return null;
  const username = sessions.get(auth.slice(7));
  if (!username) return null;
  const users = readUsers();
  return users[username] || null;
}
function send(res, status, body) {
  const text = JSON.stringify(body);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(text);
}
function body(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', chunk => { raw += chunk; if (raw.length > 2_000_000) req.destroy(); });
    req.on('end', () => { try { resolve(JSON.parse(raw || '{}')); } catch { reject(new Error('Invalid JSON')); } });
    req.on('error', reject);
  });
}
function validUsername(username) { return /^[A-Za-z0-9_]{3,20}$/.test(username); }

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon'
};
function staticFile(req, res) {
  let pathname = decodeURIComponent(new URL(req.url, `http://${req.headers.host}`).pathname);
  if (pathname === '/') pathname = '/index.html';
  if (pathname === '/data' || pathname.startsWith('/data/')) return send(res, 403, { error: 'Forbidden' });
  const file = path.normalize(path.join(ROOT, pathname));
  if (!file.startsWith(ROOT)) return send(res, 403, { error: 'Forbidden' });
  fs.stat(file, (err, stat) => {
    if (err || !stat.isFile()) return send(res, 404, { error: 'Not found' });
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.url.startsWith('/api/')) {
      if (req.method === 'POST' && req.url === '/api/register') {
        const data = await body(req);
        if (!validUsername(data.username || '') || typeof data.password !== 'string' || data.password.length < 6) return send(res, 400, { error: 'Invalid username or password.' });
        const users = readUsers();
        if (users[data.username]) return send(res, 409, { error: 'ID Name này đã tồn tại.' });
        const { salt, hash } = hashPassword(data.password);
        users[data.username] = {
          username: data.username, createdAt: Date.now(), gems: 5000, coins: 10000, tickets: 10, rank: 1,
          gachaPity: 0, characterPity: 0, gachaHistory: [], myCards: [], myCharacters: [], selectedCharacterId: 'mystery',
          passwordSalt: salt, passwordHash: hash
        };
        writeUsers(users);
        const token = newToken(); sessions.set(token, data.username);
        return send(res, 200, { token, user: publicUser(users[data.username]) });
      }
      if (req.method === 'POST' && req.url === '/api/login') {
        const data = await body(req); const users = readUsers(); const user = users[data.username];
        if (!user || !verifyPassword(data.password || '', user)) return send(res, 401, { error: 'ID Name hoặc Password không đúng.' });
        const token = newToken(); sessions.set(token, user.username);
        return send(res, 200, { token, user: publicUser(user) });
      }
      if (req.method === 'GET' && req.url === '/api/me') {
        const user = authUser(req); if (!user) return send(res, 401, { error: 'Unauthorized' });
        return send(res, 200, { user: publicUser(user) });
      }
      if (req.method === 'PUT' && req.url === '/api/user') {
        const current = authUser(req); if (!current) return send(res, 401, { error: 'Unauthorized' });
        const data = await body(req); const incoming = data.user || {};
        const users = readUsers(); const stored = users[current.username];
        const allowed = ['gems','coins','tickets','rank','gachaPity','characterPity','gachaHistory','myCards','myCharacters','selectedCharacterId'];
        for (const key of allowed) if (Object.prototype.hasOwnProperty.call(incoming, key)) stored[key] = incoming[key];
        writeUsers(users);
        return send(res, 200, { user: publicUser(stored) });
      }
      return send(res, 404, { error: 'API route not found' });
    }
    staticFile(req, res);
  } catch (error) {
    console.error(error);
    send(res, 500, { error: 'Server error' });
  }
});

server.listen(PORT, () => console.log(`REALYZE!! server running on http://localhost:${PORT}`));
