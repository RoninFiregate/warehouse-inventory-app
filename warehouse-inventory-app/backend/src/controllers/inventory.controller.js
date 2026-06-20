const { all, get, run } = require('../db');
const { createOperationId } = require('../utils/crypto');

async function recent(req, res, next) {
  try {
    const rows = await all(`
      SELECT
        s.*,
        a.nazwa AS asortyment_nazwa,
        a.kod_qr,
        r.kod_lokalizacji,
        u.login
      FROM Stan_Magazynowy s
      JOIN Asortyment a ON a.id = s.asortyment_id
      JOIN "Regał" r ON r.id = s.regal_id
      JOIN Użytkownik u ON u.id = s.uzytkownik_id
      ORDER BY s.data_dodania DESC
      LIMIT 20
    `);

    res.json(rows);
  } catch (e) {
    next(e);
  }
}

async function findByQr(req, res, next) {
  try {
    const { type, qr } = req.query;

    if (type === 'product') {
      const row = await get(
        'SELECT * FROM Asortyment WHERE kod_qr = ? AND aktywny = 1',
        [qr]
      );

      if (!row) {
        return res.status(404).json({
          error: 'Nie znaleziono produktu dla tego QR'
        });
      }

      return res.json(row);
    }

    if (type === 'shelf') {
      const row = await get(
        'SELECT * FROM "Regał" WHERE kod_lokalizacji = ? AND aktywny = 1',
        [qr]
      );

      if (!row) {
        return res.status(404).json({
          error: 'Nie znaleziono regału dla tego QR'
        });
      }

      return res.json(row);
    }

    return res.status(400).json({
      error: 'Nieprawidłowy typ skanowania'
    });

  } catch (e) {
    next(e);
  }
}

async function createOperation(req, res, next) {
  try {

    const {
      asortyment_id,
      regal_id,
      uzytkownik_id,
      ilosc,
      komentarz,
      typ_operacji
    } = req.body;

  

    if (!asortyment_id || !regal_id || !uzytkownik_id) {
      return res.status(400).json({
        error: 'Brak wymaganych relacji'
      });
    }

    if (!Number.isInteger(Number(ilosc)) || Number(ilosc) <= 0) {
      return res.status(400).json({
        error: 'Ilość musi być dodatnia'
      });
    }

    /*
     * BLOKADA PRZECIĄŻENIA REGAŁU
     */
    if (
      typ_operacji === 'DODANIE' ||
      typ_operacji === 'PRZYJECIE'
    ) {

      const produkt = await get(
        `
        SELECT waga
        FROM Asortyment
        WHERE id = ?
        `,
        [asortyment_id]
      );

      const regal = await get(
        `
        SELECT maksymalne_obciazenie
        FROM "Regał"
        WHERE id = ?
        `,
        [regal_id]
      );

      const obciazenie = await get(
        `
        SELECT
          COALESCE(
            SUM(
              CASE
                WHEN sm.typ_operacji IN ('DODANIE', 'PRZYJECIE')
                  THEN sm.ilosc * a.waga
                WHEN sm.typ_operacji = 'WYDANIE'
                  THEN -sm.ilosc * a.waga
                ELSE 0
              END
            ),
            0
          ) AS masa
        FROM Stan_Magazynowy sm
        LEFT JOIN Asortyment a
          ON a.id = sm.asortyment_id
        WHERE sm.regal_id = ?
        `,
        [regal_id]
      );

      const aktualnaMasa = Number(obciazenie?.masa || 0);
      const masaTowaru =
        Number(produkt?.waga || 0) * Number(ilosc);

      const maksymalna =
        Number(regal?.maksymalne_obciazenie || 0);

      if (aktualnaMasa + masaTowaru > maksymalna) {
        return res.status(400).json({
          error:
            `Przekroczono dopuszczalne obciążenie regału. ` +
            `Aktualnie: ${aktualnaMasa} kg, ` +
            `dodawane: ${masaTowaru} kg, ` +
            `maksymalnie: ${maksymalna} kg.`
        });
      }
    }

    /*
     * BLOKADA WYDANIA WIĘKSZEJ ILOŚCI NIŻ STAN
     */
    if (typ_operacji === 'WYDANIE') {

      const stock = await get(
        `
        SELECT
          COALESCE(
            SUM(
              CASE
                WHEN typ_operacji IN ('DODANIE', 'PRZYJECIE')
                  THEN ilosc
                WHEN typ_operacji = 'WYDANIE'
                  THEN -ilosc
                ELSE 0
              END
            ),
            0
          ) AS stan
        FROM Stan_Magazynowy
        WHERE asortyment_id = ?
          AND regal_id = ?
        `,
        [asortyment_id, regal_id]
      );

      if (Number(stock.stan) < Number(ilosc)) {
        return res.status(400).json({
          error:
            `Brak wystarczającej ilości na stanie. ` +
            `Dostępne: ${stock.stan} szt.`
        });
      }
    }

    const opId = createOperationId();

    const result = await run(
      `
      INSERT INTO Stan_Magazynowy
      (
        data_dodania,
        asortyment_id,
        regal_id,
        uzytkownik_id,
        ilosc,
        komentarz,
        typ_operacji,
        identyfikator_operacji
      )
      VALUES (
        datetime('now'),
        ?, ?, ?, ?, ?, ?, ?
      )
      `,
      [
        asortyment_id,
        regal_id,
        uzytkownik_id,
        Number(ilosc),
        komentarz || '',
        typ_operacji || 'DODANIE',
        opId
      ]
    );
/*
 * AUTOMATYCZNE TWORZENIE DOKUMENTU
 */

const numerDokumentu =
  `${typ_operacji === 'WYDANIE' ? 'WZ' : 'PZ'}-` +
  `${new Date().getFullYear()}-` +
  `${String(result.lastID).padStart(6, '0')}`;

await run(
  `
  INSERT INTO Dokument
  (
    numer,
    typ,
    operacja_id
  )
  VALUES (?, ?, ?)
  `,
  [
    numerDokumentu,
    typ_operacji,
    result.lastID
  ]
);

    res.status(201).json({
      id: result.lastID,
      identyfikator_operacji: opId
    });

  } catch (e) {
  console.error('CREATE ERROR:');
  console.error(e);
  next(e);
}
}

async function updateOperation(req, res, next) {
  try {

    console.log('UPDATE BODY:', req.body);
    console.log('UPDATE ID:', req.params.id);

console.log(req.body);

    const {
  asortyment_id,
  regal_id,
  uzytkownik_id,
  ilosc,
  komentarz,
  typ_operacji,
  data_dodania
} = req.body;

    const currentOp = await get(
      `
      SELECT *
      FROM Stan_Magazynowy
      WHERE id = ?
      `,
      [req.params.id]
    );

    if (!currentOp) {
      return res.status(404).json({
        error: 'Operacja nie istnieje'
      });
    }

    if (typ_operacji === 'WYDANIE') {

      const stock = await get(
        `
        SELECT
          COALESCE(
            SUM(
              CASE
                WHEN typ_operacji IN ('DODANIE','PRZYJECIE')
                  THEN ilosc
                WHEN typ_operacji = 'WYDANIE'
                  THEN -ilosc
                ELSE 0
              END
            ),
            0
          ) AS stan
        FROM Stan_Magazynowy
        WHERE asortyment_id = ?
          AND regal_id = ?
          AND id <> ?
        `,
        [
          asortyment_id,
          regal_id,
          req.params.id
        ]
      );

      if (Number(stock.stan) < Number(ilosc)) {
        return res.status(400).json({
          error:
            `Brak wystarczającej ilości po edycji. ` +
            `Dostępne: ${stock.stan} szt.`
        });
      }
    }

    await run(
      `
     UPDATE Stan_Magazynowy
SET
  asortyment_id = ?,
  regal_id = ?,
  uzytkownik_id = ?,
  ilosc = ?,
  komentarz = ?,
  typ_operacji = ?,
  data_dodania = ?
      WHERE id = ?
      `,
      [
  asortyment_id,
  regal_id,
  uzytkownik_id,
  Number(ilosc),
  komentarz || '',
  typ_operacji,
  data_dodania,
  req.params.id
]    );

    res.json({ ok: true });

  } catch (e) {
    next(e);
  }
}

async function current(req, res, next) {
  try {
    const rows = await all(`
      SELECT
        a.nazwa AS produkt,
        r.kod_lokalizacji,
        SUM(
          CASE
            WHEN s.typ_operacji IN ('DODANIE', 'PRZYJECIE')
              THEN s.ilosc
            WHEN s.typ_operacji = 'WYDANIE'
              THEN -s.ilosc
            ELSE 0
          END
        ) AS stan
      FROM Stan_Magazynowy s
      JOIN Asortyment a
        ON a.id = s.asortyment_id
      JOIN "Regał" r
        ON r.id = s.regal_id
      GROUP BY
        s.asortyment_id,
        s.regal_id
      HAVING stan <> 0
      ORDER BY
        a.nazwa,
        r.kod_lokalizacji
    `);

    res.json(rows);

  } catch (e) {
    next(e);
  }
}

async function removeOperation(req, res, next) {
  try {
    await run(
      'DELETE FROM Stan_Magazynowy WHERE id = ?',
      [req.params.id]
    );

    res.json({ ok: true });

  } catch (e) {
    next(e);
  }
}

async function getProductLocations(req, res, next) {
  try {
    const { id } = req.params;

    const rows = await all(
  `
  SELECT
    r.kod_lokalizacji,
    SUM(s.ilosc) AS ilosc
  FROM Stan_Magazynowy s
  JOIN "Regał" r ON r.id = s.regal_id
  WHERE s.asortyment_id = ?
  GROUP BY r.id, r.kod_lokalizacji
  HAVING ilosc > 0
  ORDER BY r.kod_lokalizacji
  `,
  [id]
);

    res.json(rows);

  } catch (e) {
    next(e);
  }
}

async function transfer(req, res, next) {
  try {

    const {
      asortyment_id,
      source_regal_id,
      target_regal_id,
      uzytkownik_id,
      ilosc,
      komentarz
    } = req.body;

    const stock = await get(
      `
      SELECT ...
      `,
      [asortyment_id, source_regal_id]
    );

    // reszta kodu

    res.json({
      ok: true,
      identyfikator_operacji: opId
    });

  } catch (e) {
    next(e);
  }
}
module.exports = {
  findByQr,
  createOperation,
  recent,
  current,
  updateOperation,
  removeOperation,
  getProductLocations,
transfer
};