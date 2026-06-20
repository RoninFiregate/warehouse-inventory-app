const { all, get, run } = require('../db');

async function list(req, res, next) {
  try {
    const rows = await all('SELECT * FROM Asortyment ORDER BY id DESC');
    res.json(rows);
  } catch (e) { next(e); }
}

async function create(req, res, next) {
  try {
    const { nazwa, kod_qr, opis, aktywny } = req.body;
    const result = await run(
      'INSERT INTO Asortyment (nazwa, kod_qr, opis, aktywny) VALUES (?, ?, ?, ?)',
      [nazwa, kod_qr, opis || '', aktywny ? 1 : 0]
    );
    res.status(201).json({ id: result.lastID });
  } catch (e) { next(e); }
}

async function update(req, res, next) {
  try {
    const { id } = req.params;

    const {
  nazwa,
  kod_qr,
  opis,
  aktywny,
  dostawca,
  dlugosc,
  szerokosc,
  wysokosc,
  waga
} = req.body;

   await run(
  `UPDATE Asortyment
   SET nazwa = ?,
       kod_qr = ?,
       opis = ?,
       aktywny = ?,
       dostawca = ?,
       dlugosc = ?,
       szerokosc = ?,
       wysokosc = ?,
       waga = ?
   WHERE id = ?`,
  [
    nazwa,
    kod_qr,
    opis || '',
    aktywny ? 1 : 0,
    dostawca || '',
    dlugosc || null,
    szerokosc || null,
    wysokosc || null,
    waga || null,
    id
  ]
);

    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
}

async function remove(req, res, next) {
  try {
    await run('DELETE FROM Asortyment WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (e) { next(e); }
}

async function getById(req, res, next) {
  try {
    const { id } = req.params;
    const row = await get('SELECT * FROM "Asortyment" WHERE id = ? AND aktywny = 1', [id]);
    if (!row) return res.status(404).json({ error: 'Nie znaleziono produktu' });
    res.json(row);
  } catch (e) {
    next(e);
  }
}

module.exports = { list, create, update, remove, getById };
