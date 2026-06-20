const bcrypt = require('bcryptjs');
const { all, run } = require('../db');

async function list(req, res, next) {
  try {
    const rows = await all('SELECT id, login, rola, aktywny FROM Użytkownik ORDER BY id DESC');
    res.json(rows);
  } catch (e) { next(e); }
}

async function create(req, res, next) {
  try {
    const { login, haslo, rola, aktywny } = req.body;
    const hash = await bcrypt.hash(haslo, 10);
    const result = await run(
      'INSERT INTO Użytkownik (login, haslo_hash, rola, aktywny) VALUES (?, ?, ?, ?)',
      [login, hash, rola || 'user', aktywny ? 1 : 0]
    );
    res.status(201).json({ id: result.lastID });
  } catch (e) { next(e); }
}

async function update(req, res, next) {
  try {
    const { login, haslo, rola, aktywny } = req.body;
    if (haslo) {
      const hash = await bcrypt.hash(haslo, 10);
      await run(
        'UPDATE Użytkownik SET login = ?, haslo_hash = ?, rola = ?, aktywny = ? WHERE id = ?',
        [login, hash, rola, aktywny ? 1 : 0, req.params.id]
      );
    } else {
      await run(
        'UPDATE Użytkownik SET login = ?, rola = ?, aktywny = ? WHERE id = ?',
        [login, rola, aktywny ? 1 : 0, req.params.id]
      );
    }
    res.json({ ok: true });
  } catch (e) { next(e); }
}

async function remove(req, res, next) {
  try {
    await run('DELETE FROM Użytkownik WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (e) { next(e); }
}

module.exports = { list, create, update, remove };
