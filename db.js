// SQLite bazası (Node.js-in daxili node:sqlite modulu, əlavə quraşdırma tələb etmir)
const { DatabaseSync } = require('node:sqlite');
const fs = require('fs');
const path = require('path');

fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
const db = new DatabaseSync(path.join(__dirname, 'data', 'posterium.db'));

db.exec(`CREATE TABLE IF NOT EXISTS posters (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  title       TEXT NOT NULL,
  category    TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  price       REAL,
  image       TEXT NOT NULL DEFAULT '',
  created_at  INTEGER NOT NULL
)`);

module.exports = db;
