require('dotenv').config();
const bcrypt = require('bcryptjs');
const { run, all } = require('./index');

async function seed() {
  // Jeśli chcesz zredukować bazę:
  // await run('DELETE FROM Użytkownik');
  // await run('DELETE FROM Asortyment');
  // await run('DELETE FROM Regał');
  // await run('DELETE FROM Stan_Magazynowy');
await run(`
  CREATE TABLE IF NOT EXISTS "Użytkownik" (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    login TEXT NOT NULL UNIQUE,
    haslo_hash TEXT NOT NULL,
    rola TEXT NOT NULL,
    aktywny INTEGER NOT NULL DEFAULT 1
  )
`);

await run(`
  CREATE TABLE IF NOT EXISTS "Asortyment" (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nazwa TEXT NOT NULL,
    kod_qr TEXT NOT NULL UNIQUE,
    opis TEXT,
    aktywny INTEGER NOT NULL DEFAULT 1
  )
`);

await run(`
  CREATE TABLE IF NOT EXISTS "Regał" (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kod_lokalizacji TEXT NOT NULL UNIQUE,
    opis TEXT,
    aktywny INTEGER NOT NULL DEFAULT 1
  )
`);

await run(`
  CREATE TABLE IF NOT EXISTS "Stan_Magazynowy" (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    asortyment_id INTEGER NOT NULL,
    regal_id INTEGER NOT NULL,
    uzytkownik_id INTEGER NOT NULL,
    ilosc INTEGER NOT NULL,
    komentarz TEXT,
    typ_operacji TEXT NOT NULL,
    identyfikator_operacji TEXT NOT NULL,
    data_dodania TEXT NOT NULL,
    FOREIGN KEY (asortyment_id) REFERENCES "Asortyment"(id),
    FOREIGN KEY (regal_id) REFERENCES "Regał"(id),
    FOREIGN KEY (uzytkownik_id) REFERENCES "Użytkownik"(id)
  )
`);

  // Użytkownik
  const admin = await all('SELECT id FROM Użytkownik WHERE login = ?', ['admin']);
  if (!admin.length) {
    const hash = await bcrypt.hash('Admin123!', 10);
    await run(
      'INSERT INTO Użytkownik (login, haslo_hash, rola, aktywny) VALUES (?, ?, ?, ?)',
      ['admin', hash, 'admin', 1]
    );
  }

  // Produkty: 19
  const products = await all('SELECT id FROM Asortyment');
  for (let i = 1; i <= 19; i++) {
    const exists = products.find(p => p.id === i);
    if (!exists) {
      const qr = `PRD-${i.toString().padStart(3, '0')}`;
      await run(
        'INSERT INTO Asortyment (nazwa, kod_qr, opis, aktywny) VALUES (?, ?, ?, ?)',
        [`Produkt ${i}`, qr, `Opis produktu ${i}`, 1]
      );
    }
  }

  // Regały: 19
  const shelves = await all('SELECT id FROM Regał');
  for (let i = 1; i <= 19; i++) {
    const exists = shelves.find(s => s.id === i);
    if (!exists) {
      const kod = `REG-A${i}`;
      await run(
        'INSERT INTO Regał (kod_lokalizacji, opis, aktywny) VALUES (?, ?, ?)',
        [kod, `Opis regału ${i}`, 1]
      );
    }
  }

  console.log('Seed completed: 19 products + 19 shelves');
  process.exit(0);
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
