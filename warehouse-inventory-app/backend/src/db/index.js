const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3');

const dbPath = process.env.DB_PATH || './data/warehouse.db';
const absPath = path.resolve(process.cwd(), dbPath);

fs.mkdirSync(path.dirname(absPath), { recursive: true });

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('SQLite database opened at:', DB_PATH);
  }
});

db.serialize(() => db.run('PRAGMA foreign_keys = ON'));

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

async function initDb() {
  const schema = fs.readFileSync(
    path.join(__dirname, 'schema.sql'),
    'utf8'
  );

  const statements = schema
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean);

  for (const stmt of statements) {
    await run(stmt);
  }

  try {
    await run(`
      ALTER TABLE "Regał"
      ADD COLUMN maksymalne_obciazenie REAL NOT NULL DEFAULT 1000
    `);
  } catch (e) {
    // kolumna już istnieje
  }

  try {
    await run(`
      ALTER TABLE Asortyment
      ADD COLUMN dlugosc REAL
    `);
  } catch (e) {}

  try {
    await run(`
      ALTER TABLE Asortyment
      ADD COLUMN szerokosc REAL
    `);
  } catch (e) {}

  try {
    await run(`
      ALTER TABLE Asortyment
      ADD COLUMN wysokosc REAL
    `);
  } catch (e) {}

  try {
    await run(`
      ALTER TABLE Asortyment
      ADD COLUMN waga REAL
    `);
  } catch (e) {}

  try {
    await run(`
      ALTER TABLE Asortyment
      ADD COLUMN dostawca TEXT
    `);
  } catch (e) {}

  try {
    await run(`
      CREATE TABLE IF NOT EXISTS Dokument (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        numer TEXT NOT NULL UNIQUE,
        typ TEXT NOT NULL,
        operacja_id INTEGER NOT NULL,
        data_utworzenia TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (operacja_id)
        REFERENCES Stan_Magazynowy(id)
        ON DELETE CASCADE
      )
    `);
  } catch (e) {}
}

module.exports = {
  db,
  run,
  get,
  all,
  initDb
};
