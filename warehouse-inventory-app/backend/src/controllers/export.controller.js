const { all } = require('../db');
const { stringify } = require('csv-stringify/sync');

async function exportTable(req, res, next) {
  try {
    const table = req.params.table;
    const allowed = ['Asortyment', 'Regał', 'Użytkownik', 'Stan_Magazynowy'];
    if (!allowed.includes(table)) return res.status(400).json({ error: 'Nieprawidłowa tabela' });

    const rows = await all(`SELECT * FROM "${table}"`);
    const csv = stringify(rows, { header: true, quoted: true, bom: true });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${table}.csv"`);
    res.send(csv);
  } catch (e) {
    next(e);
  }
}

module.exports = { exportTable };
