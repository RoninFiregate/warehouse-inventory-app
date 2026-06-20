const { stringify } = require('csv-stringify/sync');

function toCsv(rows) {
  return stringify(rows, { header: true, quoted: true, bom: true });
}

module.exports = { toCsv };
