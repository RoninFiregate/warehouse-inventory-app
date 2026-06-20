import { useState } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';

export default function ScannerPanel({ onDetected }) {
  const [mode, setMode] = useState('scan'); // 'scan' | 'manual-product' | 'manual-shelf' | 'manual-both'
  const [scannerActive, setScannerActive] = useState(false);
  const [manualProductId, setManualProductId] = useState('');
  const [manualShelfId, setManualShelfId] = useState('');
  const [error, setError] = useState('');

  const handleManualProductSubmit = () => {
    const id = manualProductId.trim();
    if (!id) {
      setError('Podaj ID produktu');
      return;
    }
    onDetected(id);
    setManualProductId('');
    setError('');
  };

  const handleManualShelfSubmit = () => {
    const id = manualShelfId.trim();
    if (!id) {
      setError('Podaj ID regału');
      return;
    }
    onDetected(id);
    setManualShelfId('');
    setError('');
  };

  const isManualProduct = mode === 'manual-product' || mode === 'manual-both';
  const isManualShelf = mode === 'manual-shelf' || mode === 'manual-both';
  const isScan = mode === 'scan';

  return (
    <div className="card">
      <h3>Skanowanie QR / wpis ręczny</h3>

      <label style={{ marginBottom: '10px' }}>
        Tryb:
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value)}
          style={{ marginLeft: '8px', padding: '6px' }}
        >
          <option value="scan">Tylko skanowanie (produkt + regał)</option>
          <option value="manual-product">Produkt ręcznie, regał QR</option>
          <option value="manual-shelf">Produkt QR, regał ręcznie</option>
          <option value="manual-both">Tylko ręcznie (produkt + regał)</option>
        </select>
      </label>

      {isManualProduct && (
        <div style={{ marginTop: '10px' }}>
          <p>Wpisz ID produktu ręcznie:</p>
          <input
            value={manualProductId}
            onChange={(e) => setManualProductId(e.target.value)}
            placeholder="ID produktu"
          />
          <button onClick={handleManualProductSubmit}>Dodaj produkt</button>
        </div>
      )}

      {isManualShelf && (
        <div style={{ marginTop: '10px' }}>
          <p>Wpisz ID regału ręcznie:</p>
          <input
            value={manualShelfId}
            onChange={(e) => setManualShelfId(e.target.value)}
            placeholder="ID regału"
          />
          <button onClick={handleManualShelfSubmit}>Dodaj regał</button>
        </div>
      )}

      {!isManualProduct && !isManualShelf && (
        <div style={{ marginTop: '10px' }}>
          <p>
            {mode === 'scan'
              ? 'Zeskanuj produkt, potem regał'
              : mode === 'manual-product'
              ? 'Zeskanuj regał'
              : mode === 'manual-shelf'
              ? 'Zeskanuj produkt'
              : '↑ Wpisz ID ręcznie ↑'}
          </p>
          <button
  className="camera-btn"
  onClick={() => setScannerActive((v) => !v)}
>
  {scannerActive
    ? '🔴 Wyłącz kamerę'
    : '📷 Załącz kamerę'}
</button>
          {scannerActive && (
            <Scanner
              onScan={(result) => {
                const value = result?.[0]?.rawValue;
                if (value) onDetected(value);
              }}
            />
          )}
          {error && <div className="error" style={{ marginTop: '8px' }}>{error}</div>}
        </div>
      )}
    </div>
  );
}
