const { all } = require('../db');

async function getDocuments(req, res, next) {
  try {

    const rows = await all(`
      SELECT
        d.*,

        s.asortyment_id,
        s.regal_id,
        s.uzytkownik_id,
        s.ilosc,
        s.komentarz,
        s.typ_operacji

      FROM Dokument d

      LEFT JOIN Stan_Magazynowy s
        ON s.id = d.operacja_id

      ORDER BY d.data_utworzenia DESC
    `);

    res.json(rows);

  } catch (e) {
    next(e);
  }
}

module.exports = {
  getDocuments
};