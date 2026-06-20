const PDFDocument = require('pdfkit');
const { get } = require('../db');

async function generatePdf(req, res, next) {
try {
const documentId = req.params.id;

const docData = await get(
  `
  SELECT
    d.*,
    sm.ilosc,
    sm.komentarz,
    sm.typ_operacji,
    a.nazwa AS produkt,
    a.kod_qr,
    r.kod_lokalizacji,
    u.login
  FROM Dokument d
  LEFT JOIN Stan_Magazynowy sm
    ON sm.id = d.operacja_id
  LEFT JOIN Asortyment a
    ON a.id = sm.asortyment_id
  LEFT JOIN "Regał" r
    ON r.id = sm.regal_id
  LEFT JOIN Użytkownik u
    ON u.id = sm.uzytkownik_id
  WHERE d.id = ?
  `,
  [documentId]
);

if (!docData) {
  return res.status(404).json({
    error: 'Nie znaleziono dokumentu'
  });
}

const docType =
  docData.typ === 'WYDANIE'
    ? 'WZ'
    : 'PZ';

const title =
  docType === 'WZ'
    ? 'WYDANIE ZEWNĘTRZNE'
    : 'PRZYJĘCIE ZEWNĘTRZNE';

res.setHeader(
  'Content-Type',
  'application/pdf'
);

res.setHeader(
  'Content-Disposition',
  `inline; filename="${docData.numer}.pdf"`
);

const pdf = new PDFDocument({
  size: 'A4',
  margin: 50
});
pdf.registerFont(
  'Arial',
  './fonts/arial.ttf'
);

pdf.registerFont(
  'Arial-Bold',
  './fonts/arialbd.ttf'
);


pdf.pipe(res);

pdf
  .roundedRect(40, 40, 515, 70, 8)
  .stroke();
pdf
  .fontSize(10)
  .font('Arial')
  .text(
    'SYSTEM MAGAZYNOWY WMS',
    55,
    55
  );

pdf
  .fontSize(32)
  .font('Arial-Bold')
  .text(
    docType,
    0,
    50,
    {
      width: 595,
      align: 'center'
    }
  );

pdf
  .fillColor(
    docType === 'WZ'
      ? '#c62828'
      : '#2e7d32'
  )
  .fontSize(14)
  .font('Arial-Bold')
  .text(
    title,
    0,
    85,
    {
      width: 595,
      align: 'center'
    }
  );

pdf.fillColor('black');pdf.y = 130;
pdf
  .roundedRect(40, 140, 515, 90, 8)
  .stroke();

pdf
  .fontSize(12)
  .font('Arial-Bold')
  .text('DANE DOKUMENTU', 55, 150);

pdf
  .font('Arial')
  .fontSize(11);

pdf.text(
  `Numer: ${docData.numer}`,
  55,
  180
);

pdf.text(
  `Data: ${new Date(
    docData.data_utworzenia
  ).toLocaleString('pl-PL')}`,
  250,
  180
);

pdf.text(
  `Magazynier: ${docData.login || '-'}`,
  55,
  205
);

pdf.moveDown();


pdf
  .roundedRect(40, 250, 515, 120, 8)
  .stroke();
pdf
  .fontSize(12)
  .font('Arial-Bold')
  .text('POZYCJA DOKUMENTU', 55, 260);

pdf
  .font('Arial')
  .fontSize(11);

pdf.text(
  `Produkt: ${docData.produkt || '-'}`,
  55,
  290
);

pdf.text(
  `Kod QR: ${docData.kod_qr || '-'}`,
  300,
  290
);

pdf.text(
  `Lokalizacja: ${docData.kod_lokalizacji || '-'}`,
  55,
  320
);

pdf.text(
  `Ilość: ${docData.ilosc || 0} szt.`,
  300,
  320
);

pdf.y = 390;
pdf.moveDown();

pdf.moveTo(50, pdf.y)
  .lineTo(545, pdf.y)
  .stroke();

pdf.moveDown();

pdf
  .fontSize(14)
.font('Arial-Bold')
  .text('UWAGI');

pdf.moveDown(0.5);

pdf
  .fontSize(11)
  .font('Arial')
  .text(
    docData.komentarz || 'Brak uwag'
  );

pdf.moveDown(4);

pdf.moveTo(70, pdf.y)
  .lineTo(250, pdf.y)
  .stroke();

pdf.moveTo(340, pdf.y)
  .lineTo(520, pdf.y)
  .stroke();

pdf.moveDown(0.5);

const podpisY = pdf.y;

pdf.text(
  'Podpis magazyniera',
  80,
  podpisY
);

pdf.text(
  'Podpis odbierającego',
  340,
  podpisY
);
pdf.moveDown(5);

pdf
  .fontSize(9)
  .fillColor('gray')
  .text(
    'Dokument wygenerowany automatycznie przez system magazynowy WMS.',
    {
      align: 'center'
    }
  );

pdf.end();

} catch (err) {
next(err);
}
}

module.exports = {
generatePdf
};

