const express = require('express');
const session = require('express-session');
const multer = require('multer');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const db = require('./db');

const { PORT = 3000, ADMIN_USER, ADMIN_PASSWORD, SESSION_SECRET, WHATSAPP_NUMBER = '' } = process.env;
if (!ADMIN_USER || !ADMIN_PASSWORD || !SESSION_SECRET) {
  console.error('.env faylında ADMIN_USER, ADMIN_PASSWORD və SESSION_SECRET olmalıdır.');
  process.exit(1);
}

const UPLOADS = path.join(__dirname, 'uploads');
fs.mkdirSync(UPLOADS, { recursive: true });

const app = express();
app.set('trust proxy', 1);
app.use(express.json());
app.use(session({
  secret: SESSION_SECRET, resave: false, saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax', secure: 'auto', maxAge: 8 * 3600 * 1000 }
}));

// ---------- Giriş ----------
const digest = (s) => crypto.createHash('sha256').update(String(s)).digest();
const same = (a, b) => crypto.timingSafeEqual(digest(a), digest(b));
const fails = new Map(); // IP -> { n, until }  (5 yanlış cəhd = 15 dəqiqə blok)

app.post('/api/login', (req, res) => {
  const f = fails.get(req.ip) || { n: 0, until: 0 };
  if (f.until > Date.now()) return res.status(429).json({ error: 'Çox cəhd edildi. 15 dəqiqə sonra yenidən yoxlayın.' });
  const { username = '', password = '' } = req.body || {};
  if (same(username, ADMIN_USER) && same(password, ADMIN_PASSWORD)) {
    fails.delete(req.ip);
    req.session.admin = true;
    return res.json({ ok: true });
  }
  if (++f.n >= 5) { f.until = Date.now() + 15 * 60 * 1000; f.n = 0; }
  fails.set(req.ip, f);
  res.status(401).json({ error: 'İstifadəçi adı və ya parol yanlışdır.' });
});
app.post('/api/logout', (req, res) => req.session.destroy(() => res.json({ ok: true })));
app.get('/api/me', (req, res) => res.json({ admin: !!req.session.admin }));
const auth = (req, res, next) => (req.session.admin ? next() : res.status(401).json({ error: 'Giriş tələb olunur.' }));

// ---------- Şəkil yükləmə ----------
const EXT = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };
const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOADS,
    filename: (req, file, cb) => cb(null, crypto.randomUUID() + EXT[file.mimetype])
  }),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => cb(null, !!EXT[file.mimetype])
});
const removeFile = (name) => { if (name) fs.unlink(path.join(UPLOADS, path.basename(name)), () => {}); };

// ---------- Posterlər ----------
const clean = (b) => ({
  title: String(b.title || '').trim().slice(0, 120),
  category: String(b.category || '').trim().slice(0, 60),
  description: String(b.description || '').trim().slice(0, 600),
  price: b.price === '' || b.price == null || isNaN(+b.price) ? null : +b.price
});

app.get('/api/config', (req, res) => res.json({ whatsapp: WHATSAPP_NUMBER }));

app.get('/api/posters', (req, res) =>
  res.json(db.prepare('SELECT * FROM posters ORDER BY created_at DESC, id DESC').all()));

app.post('/api/posters', auth, upload.single('image'), (req, res) => {
  const p = clean(req.body);
  if (!p.title) { removeFile(req.file && req.file.filename); return res.status(400).json({ error: 'Poster adı vacibdir.' }); }
  const r = db.prepare('INSERT INTO posters (title, category, description, price, image, created_at) VALUES (?,?,?,?,?,?)')
    .run(p.title, p.category, p.description, p.price, req.file ? req.file.filename : '', Date.now());
  res.json(db.prepare('SELECT * FROM posters WHERE id = ?').get(r.lastInsertRowid));
});

app.put('/api/posters/:id', auth, upload.single('image'), (req, res) => {
  const old = db.prepare('SELECT * FROM posters WHERE id = ?').get(req.params.id);
  if (!old) { removeFile(req.file && req.file.filename); return res.sendStatus(404); }
  const p = clean({ ...old, ...req.body });
  if (!p.title) { removeFile(req.file && req.file.filename); return res.status(400).json({ error: 'Poster adı vacibdir.' }); }
  const image = req.file ? req.file.filename : old.image;
  db.prepare('UPDATE posters SET title=?, category=?, description=?, price=?, image=? WHERE id=?')
    .run(p.title, p.category, p.description, p.price, image, old.id);
  if (req.file) removeFile(old.image);
  res.json({ ...p, id: old.id, image });
});

app.delete('/api/posters/:id', auth, (req, res) => {
  const old = db.prepare('SELECT * FROM posters WHERE id = ?').get(req.params.id);
  if (!old) return res.sendStatus(404);
  db.prepare('DELETE FROM posters WHERE id = ?').run(old.id);
  removeFile(old.image);
  res.json({ ok: true });
});

// ---------- Statik fayllar ----------
app.use('/uploads', express.static(UPLOADS, { maxAge: '7d' }));
app.use('/admin', express.static(path.join(__dirname, 'admin')));
app.use(express.static(path.join(__dirname, 'public')));

app.use((err, req, res, next) =>
  res.status(400).json({ error: 'Şəkil yüklənmədi (JPG, PNG və ya WEBP, maksimum 8 MB).' }));

app.listen(PORT, () => console.log(`Sayt:  http://localhost:${PORT}\nAdmin: http://localhost:${PORT}/admin`));
