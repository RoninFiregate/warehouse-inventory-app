PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS Asortyment (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nazwa TEXT NOT NULL,
  kod_qr TEXT NOT NULL UNIQUE,
  opis TEXT,
  aktywny INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS Regał (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kod_lokalizacji TEXT NOT NULL UNIQUE,
  opis TEXT,
  maksymalne_obciazenie REAL NOT NULL DEFAULT 1000,
  aktywny INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS Użytkownik (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  login TEXT NOT NULL UNIQUE,
  haslo_hash TEXT NOT NULL,
  rola TEXT NOT NULL DEFAULT 'user',
  aktywny INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS Stan_Magazynowy (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  data_dodania TEXT NOT NULL DEFAULT (datetime('now')),
  asortyment_id INTEGER NOT NULL,
  regal_id INTEGER NOT NULL,
  uzytkownik_id INTEGER NOT NULL,
  ilosc INTEGER NOT NULL CHECK (ilosc > 0),
  komentarz TEXT,
  typ_operacji TEXT NOT NULL DEFAULT 'DODANIE',
  identyfikator_operacji TEXT NOT NULL UNIQUE,
  FOREIGN KEY (asortyment_id) REFERENCES Asortyment(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  FOREIGN KEY (regal_id) REFERENCES Regał(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  FOREIGN KEY (uzytkownik_id) REFERENCES Użytkownik(id) ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_asortyment_kod_qr ON Asortyment(kod_qr);
CREATE INDEX IF NOT EXISTS idx_regal_kod_lokalizacji ON Regał(kod_lokalizacji);
CREATE INDEX IF NOT EXISTS idx_stan_data ON Stan_Magazynowy(data_dodania);

