const { all, get, run } = require('../db');

// Lista regałów
async function list(req, res, next) {
  try {
    res.json(await all('SELECT * FROM "Regał" ORDER BY id DESC'));
  } catch (e) {
    next(e);
  }
}

// Pobieranie regału po id
async function getById(req, res, next) {
  try {
    const { id } = req.params;

    const row = await get(
      'SELECT * FROM "Regał" WHERE id = ? AND aktywny = 1',
      [id]
    );

    if (!row) {
      return res.status(404).json({
        error: 'Nie znaleziono regału'
      });
    }

    const stan = await get(
  `
  SELECT
    COALESCE(SUM(
      CASE
        WHEN sm.typ_operacji = 'DODANIE' THEN sm.ilosc
        WHEN sm.typ_operacji = 'WYDANIE' THEN -sm.ilosc
        ELSE 0
      END
    ),0) AS sztuki,

    COALESCE(SUM(
      CASE
        WHEN sm.typ_operacji = 'DODANIE' THEN sm.ilosc * a.waga
        WHEN sm.typ_operacji = 'WYDANIE' THEN -sm.ilosc * a.waga
        ELSE 0
      END
    ),0) AS masa

  FROM Stan_Magazynowy sm
  LEFT JOIN Asortyment a
    ON a.id = sm.asortyment_id

  WHERE sm.regal_id = ?
  `,
  [id]
);

    const aktualnaLiczbaSztuk = stan.sztuki || 0;
const aktualnaMasa = stan.masa || 0;

    const maksymalne = row.maksymalne_obciazenie || 0;

   res.json({
  ...row,
  liczba_sztuk: aktualnaLiczbaSztuk,
  stopien_obciazenia: aktualnaMasa,
  pozostalo: maksymalne - aktualnaMasa
});  } catch (e) {
    next(e);
  }
}

// Dodawanie regału
async function create(req, res, next) {
  try {
    const {
      kod_lokalizacji,
      opis,
      aktywny,
      maksymalne_obciazenie
    } = req.body;

    const result = await run(
      `INSERT INTO "Regał"
       (kod_lokalizacji, opis, maksymalne_obciazenie, aktywny)
       VALUES (?, ?, ?, ?)`,
      [
        kod_lokalizacji,
        opis || '',
        Number(maksymalne_obciazenie) || 1000,
        aktywny ? 1 : 0
      ]
    );

    res.status(201).json({
      id: result.lastID
    });
  } catch (e) {
    next(e);
  }
}

// Aktualizacja regału
async function update(req, res, next) {
  try {
    const {
      kod_lokalizacji,
      opis,
      aktywny,
      maksymalne_obciazenie
    } = req.body;

    await run(
      `UPDATE "Regał"
       SET kod_lokalizacji = ?,
           opis = ?,
           maksymalne_obciazenie = ?,
           aktywny = ?
       WHERE id = ?`,
      [
        kod_lokalizacji,
        opis || '',
        Number(maksymalne_obciazenie),
        aktywny ? 1 : 0,
        req.params.id
      ]
    );

    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
}

// Usuwanie regału
async function remove(req, res, next) {
  try {
    await run(
      'DELETE FROM "Regał" WHERE id = ?',
      [req.params.id]
    );

    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
}

module.exports = {
  list,
  getById,
  create,
  update,
  remove
};