import { useEffect, useState } from 'react';
import api from './api';
import LoginForm from './components/LoginForm';
import ScannerPanel from './components/ScannerPanel';
import TableEditor from './components/TableEditor';
import Toast from './components/Toast';


const emptyForm = {
  qty: '',
  comment: '',
  operation: 'DODANIE'
};


export default function App() {
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState('scan');
  const [product, setProduct] = useState(null);
  const [shelf, setShelf] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [toast, setToast] = useState(null);
const [sourceShelves, setSourceShelves] = useState([]);
const [targetShelves, setTargetShelves] = useState([]);
const [showTransferWindow, setShowTransferWindow] =
  useState(false);
const [generateDocument, setGenerateDocument] = useState(false);
  const [recent, setRecent] = useState([]);
const [currentStock, setCurrentStock] = useState([]);
  const [data, setData] = useState({ a: [], r: [], u: [] });

const [infoProduct, setInfoProduct] = useState(null);
const [editProduct, setEditProduct] = useState(null);
const [infoShelf, setInfoShelf] = useState(null);
const [selectedProductId, setSelectedProductId] = useState('');
const [productLocations, setProductLocations] = useState([]);
const [documents, setDocuments] = useState([]);

 const loadAll = async () => {
  try {
    const [a, r, u, s, c, d] = await Promise.all([
      api.get('/asortyment'),
      api.get('/regal'),
      api.get('/uzytkownik'),
      api.get('/stan/recent'),
      api.get('/stan/current'),
      api.get('/dokument')

    ]);

    setData({
      a: a.data,
      r: r.data,
      u: u.data
    });
console.log('ASORTYMENT:', a.data);
console.log('DATA STATE:', {
  a: a.data,
  r: r.data,
  u: u.data
});

    setRecent(s.data);
    setCurrentStock(c.data);
    setDocuments(d.data);

  } catch (err) {
    console.error('loadAll error', err);
  }
};
  useEffect(() => {
    const token = localStorage.getItem('token');
    const cached = localStorage.getItem('user');
    if (token && cached) setUser(JSON.parse(cached));
  }, []);


  useEffect(() => {
    if (user) loadAll();
  }, [user]);


  const login = async (login, haslo) => {
    const res = await api.post('/auth/login', { login, haslo });
    localStorage.setItem('token', res.data.token);
    localStorage.setItem('user', JSON.stringify(res.data.user));
    setUser(res.data.user);
  };


  const detect = async (value) => {
    try {
      if (!product) {
        const res = await api.get('/stan/lookup', { params: { type: 'product', qr: value } });
        setProduct(res.data);
        setToast({ type: 'ok', msg: 'Produkt zeskanowany' });
        return;
      }
      if (!shelf) {
        const res = await api.get('/stan/lookup', { params: { type: 'shelf', qr: value } });
        setShelf(res.data);
        setToast({ type: 'ok', msg: 'Regał zeskanowany' });
      }
    } catch (e) {
      setToast({ type: 'err', msg: e?.response?.data?.error || 'Błąd skanu' });
    }
  };


 const saveOperation = async () => {
  try {
    if (!product || !shelf) {
      return setToast({
        type: 'err',
        msg: 'Zeskanuj produkt i regał'
      });
    }

    if (
      !Number.isFinite(Number(form.qty)) ||
      Number(form.qty) <= 0
    ) {
      return setToast({
        type: 'err',
        msg: 'Ilość musi być dodatnia'
      });
    }

    const res = await api.post('/stan', {
      asortyment_id: product.id,
      regal_id: shelf.id,
      uzytkownik_id: user.id,
      ilosc: Number(form.qty),
      komentarz: form.comment,
      typ_operacji: form.operation
    });

    setToast({
      type: 'ok',
      msg: `Zapisano operację ${res.data.identyfikator_operacji}`
    });

    setProduct(null);
    setShelf(null);
    setForm(emptyForm);

    await loadAll();

  } catch (e) {
    setToast({
      type: 'err',
      msg:
        e?.response?.data?.error ||
        'Nie udało się zapisać operacji'
    });
  }
};

  const exportCsv = (name) => window.location.href = `http://localhost:4000/api/export/${name}?token=${localStorage.getItem('token')}`;


  if (!user) return <div className="page"><LoginForm onLogin={login} /></div>;


  return (
    <div className="page">
      <Toast message={toast?.msg} type={toast?.type} />
      <div className="topbar">
        <h1>Magazyn</h1>
        <button onClick={() => { localStorage.clear(); setUser(null); }}>Wyloguj</button>
      </div>

     <div className="tabs">

  <button onClick={() => setTab('scan')}>
    <span className="menu-icon">📷</span>
    <span>Skanowanie</span>
  </button>

  <button onClick={() => setTab('h')}>
    <span className="menu-icon">📜</span>
    <span>Historia</span>
  </button>

  <button onClick={() => setTab('a')}>
    <span className="menu-icon">📦</span>
    <span>Asortyment</span>
  </button>

  <button onClick={() => setTab('r')}>
    <span className="menu-icon">🗄️</span>
    <span>Regał</span>
  </button>

  <button onClick={() => setTab('u')}>
    <span className="menu-icon">👤</span>
    <span>Użytkownik</span>
  </button>

  <button onClick={() => setTab('s')}>
    <span className="menu-icon">📊</span>
    <span>Stan Magazynowy</span>
  </button>

  <button onClick={() => setTab('l')}>
    <span className="menu-icon">📍</span>
    <span>Lokalizacje</span>
  </button>

  <button onClick={() => setTab('d')}>
    <span className="menu-icon">📄</span>
    <span>Dokumenty</span>
  </button>



</div>

      {tab === 'scan' && (
        <>
          <div className="card">
            <h3>Skanowanie</h3>
            <ScannerPanel onDetected={detect} />

            <div style={{ marginTop: '10px' }}>
              <div>Produkt: {product?.nazwa || '-'}</div>
              <div>Regał: {shelf?.kod_lokalizacji || '-'}</div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <input
                  value={product?.id || ''}
                  onChange={(e) => {
                    const id = e.target.value ? Number(e.target.value) : null;
                    if (id) {
                      api.get(`/asortyment/${id}`)
                        .then(res => { setProduct(res.data); setToast({ type: 'ok', msg: 'Produkt pobrany ręcznie' }); })
                        .catch(() => setToast({ type: 'err', msg: 'Nie znaleziono produktu o ID ' + id }));
                    } else {
                      setProduct(null);
                    }
                  }}
                  placeholder="ID produktu"
                />
                <input
                  value={shelf?.id || ''}
                  onChange={(e) => {
                    const id = e.target.value ? Number(e.target.value) : null;
                    if (id) {
                      api.get(`/regal/${id}`)
                        .then(res => { setShelf(res.data); setToast({ type: 'ok', msg: 'Regał pobrany ręcznie' }); })
                        .catch(() => setToast({ type: 'err', msg: 'Nie znaleziono regału o ID ' + id }));
                    } else {
                      setShelf(null);
                    }
                  }}
                  placeholder="ID regału"
                />
              </div>

              <input
                value={form.qty}
                onChange={(e) => setForm({ ...form, qty: e.target.value })}
                placeholder="Ilość"
                style={{ marginTop: '8px' }}
              />
              <input
  value={form.comment}
  onChange={(e) => setForm({ ...form, comment: e.target.value })}
  placeholder="Komentarz"
  style={{ marginTop: '8px' }}
/>

<select
  value={form.operation}
  onChange={async (e) => {
    const value = e.target.value;

    setForm({
      ...form,
      operation: value
    });

    if (value === 'PRZESUNIECIE') {

  try {

    const [sourceRes, targetRes] = await Promise.all([
      api.get('/regal'),
      api.get('/regal')
    ]);

    setSourceShelves(sourceRes.data);
    setTargetShelves(targetRes.data);

    setShowTransferWindow(true);

  } catch {

    setToast({
      type: 'err',
      msg: 'Nie udało się pobrać regałów'
    });

  }
}  }}
>
  <option value="DODANIE">
    📥 Przyjęcie na magazyn
  </option>

  <option value="WYDANIE">
    📤 Wydanie z magazynu
  </option>

  <option value="PRZESUNIECIE">
    🔄 Przesunięcie między regałami
  </option>
</select>
  
<div
  style={{
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginTop: '12px'
  }}
>
  <input
    type="checkbox"
    id="generateDocument"
    checked={generateDocument}
    onChange={(e) =>
      setGenerateDocument(e.target.checked)
    }
  />

  <label
    htmlFor="generateDocument"
    style={{
      cursor: 'pointer',
      fontWeight: 500
    }}
  >
    📄 Dodaj dokument
  </label>
</div>              <button
  className={
    form.operation === 'WYDANIE'
      ? 'save-btn-out'
      : 'save-btn-in'
  }
  onClick={saveOperation}
  disabled={
    !product ||
    !shelf ||
    !form.qty ||
    Number(form.qty) <= 0
  }
>
  💾 Zapisz operację
</button>           
 </div>
          </div>

          <div className="card">
            <h3>Ostatnie operacje</h3>
            {recent.map((x) => (
              <div key={x.id} className="history">
                {x.data_dodania} | {x.asortyment_nazwa} | {x.kod_lokalizacji} | {x.ilosc} | {x.login}
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'a' && <TableEditor title="Asortyment" rows={data.a} columns={[{ key: 'id', label: 'ID' }, { key: 'nazwa', label: 'Nazwa' }, { key: 'kod_qr', label: 'QR' }, { key: 'opis', label: 'Opis' }, { key: 'aktywny', label: 'Aktywny' }]} onAdd={() => {}} onEdit={(row) => {
  setEditProduct({
    ...row,
    dostawca: row.dostawca || ''
  });
}} onDelete={() => {}}
onInfo={(row) => {
  console.log('Kliknięto informacje:', row);
  setInfoProduct(row);
}} onExport={() => exportCsv('Asortyment')} />}
    {tab === 'r' && (
  <TableEditor
    title="Regał"
    rows={data.r}
    columns={[
      { key: 'id', label: 'ID' },
      { key: 'kod_lokalizacji', label: 'Kod' },
      { key: 'opis', label: 'Opis' },
      { key: 'aktywny', label: 'Aktywny' }
    ]}
    onAdd={() => {}}

    onInfo={async (row) => {
      try {
        const res = await api.get(`/regal/${row.id}`);
        setInfoShelf(res.data);
      } catch {
        setToast({
          type: 'err',
          msg: 'Nie udało się pobrać informacji o regale'
        });
      }
    }}

    onExport={() => exportCsv('Regał')}
  />
)}      {tab === 'u' && <TableEditor title="Użytkownik" rows={data.u} columns={[{ key: 'id', label: 'ID' }, { key: 'login', label: 'Login' }, { key: 'rola', label: 'Rola' }, { key: 'aktywny', label: 'Aktywny' }]} onAdd={() => {}} onEdit={() => {}} onDelete={() => {}} onExport={() => exportCsv('Użytkownik')} />}
    {tab === 's' && (
  <TableEditor
    title="Stan Magazynowy"
    rows={currentStock}
    columns={[
      { key: 'produkt', label: 'Produkt' },
      { key: 'kod_lokalizacji', label: 'Regał' },
      { key: 'stan', label: 'Stan' }
    ]}
    onExport={() => exportCsv('Stan_Magazynowy')}
    hideActions={true}
    hideAdd={true}
  />
)}
{tab === 'h' && (
  <TableEditor
    title="Historia operacji"
    rows={recent}
    columns={[
      { key: 'id', label: 'ID' },
      { key: 'data_dodania', label: 'Data' },
      { key: 'asortyment_nazwa', label: 'Produkt' },
      { key: 'kod_lokalizacji', label: 'Regał' },
      { key: 'ilosc', label: 'Ilość' },
      { key: 'typ_operacji', label: 'Operacja' },
      { key: 'login', label: 'Użytkownik' },
      { key: 'komentarz', label: 'Komentarz' }
    ]}
    onExport={() => exportCsv('Historia_Operacji')}
    hideActions={true}
    hideAdd={true}
  />
)}
{tab === 'l' && (
  <div className="card">
    <h3>📍 Lokalizacje produktu</h3>
<p>
  Data i godzina wydruku:{' '}
  {new Date().toLocaleString('pl-PL')}
</p>

<p>
  Magazynier: {user.login}
</p>

<p>
  Produkt:{' '}
  {
    data.a.find(
      p => p.id === Number(selectedProductId)
    )?.nazwa
  }
</p>

<hr />

    <div style={{ marginBottom: '15px' }}>
      <label>Wybierz produkt:</label>

      <select
        value={selectedProductId}
        onChange={async (e) => {
          const id = e.target.value;

          setSelectedProductId(id);

          if (!id) {
            setProductLocations([]);
            return;
          }

          try {
            const res = await api.get(
              `/stan/produkt/${id}/lokalizacje`
            );

            setProductLocations(res.data);

          } catch {
            setToast({
              type: 'err',
              msg: 'Nie udało się pobrać lokalizacji'
            });
          }
        }}
        style={{ marginLeft: '10px' }}
      >
        <option value="">
          -- wybierz produkt --
        </option>

        {data.a.map((p) => (
          <option key={p.id} value={p.id}>
            {p.nazwa}
          </option>
        ))}
      </select>
    </div>

    {productLocations.length > 0 && (
      <>
        <table style={{ width: '100%' }}>
          <thead>
            <tr>
              <th>Regał</th>
              <th>Ilość</th>
            </tr>
          </thead>

          <tbody>
            {productLocations.map((x, idx) => (
              <tr key={idx}>
                <td>{x.kod_lokalizacji}</td>
                <td>{x.ilosc}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ marginTop: '20px' }}>
  <button onClick={() => window.print()}>
    🖨️ Drukuj
  </button>
</div>

<div
  id="print-area"
>
  <div style={{ textAlign: 'center' }}>
    <h2>SYSTEM MAGAZYNOWY WMS</h2>
    <h3>ZESTAWIENIE LOKALIZACJI PRODUKTU</h3>
  </div>

  <p>
    <strong>Data i godzina wydruku:</strong>{' '}
    {new Date().toLocaleString('pl-PL')}
  </p>

  <p>
    <strong>Magazynier:</strong>{' '}
    {user.login}
  </p>

  <p>
    <strong>Produkt:</strong>{' '}
    {
      data.a.find(
        p => p.id === Number(selectedProductId)
      )?.nazwa
    }
  </p>

  <hr />

  <table
    style={{
      width: '100%',
      borderCollapse: 'collapse'
    }}
  >
    <thead>
      <tr>
        <th style={{ border: '1px solid black', padding: '8px' }}>
          Regał
        </th>

        <th style={{ border: '1px solid black', padding: '8px' }}>
          Ilość
        </th>
      </tr>
    </thead>

    <tbody>
      {productLocations.map((x, idx) => (
        <tr key={idx}>
          <td style={{ border: '1px solid black', padding: '8px' }}>
            {x.kod_lokalizacji}
          </td>

          <td style={{ border: '1px solid black', padding: '8px' }}>
            {x.ilosc}
          </td>
        </tr>
      ))}
    </tbody>
  </table>

  <div style={{ marginTop: '80px' }}>
    Podpis magazyniera ({user.login}):

    <br /><br /><br />

    ....................................................
  </div>
</div>
      </>
    )}

    {selectedProductId &&
      productLocations.length === 0 && (
        <p>Brak produktu na regałach.</p>
      )}
  </div>
)}
{tab === 'd' && (
  <div className="card">
    <h3>📄 Dokumenty</h3>

    {documents.length === 0 ? (
      <p>Brak dokumentów.</p>
    ) : (
      <table style={{ width: '100%' }}>
        <thead>
          <tr>
  <th>ID</th>
  <th>Numer</th>
  <th>Typ</th>
  <th>Akcja</th>
</tr>        </thead>

       <tbody>
  {documents.map((doc) => (
    <tr key={doc.id}>
      <td>{doc.id}</td>

      <td>
        <a
          href={`http://localhost:4000/api/document/${doc.id}/pdf`}
          target="_blank"
          rel="noreferrer"
        >
          {doc.numer}
        </a>
      </td>

      <td>{doc.typ_operacji}</td>

      <td>
        <button
          onClick={async () => {

           const qty = prompt('Nowa ilość:', doc.ilosc);

if (qty === null) return;

const comment = prompt(
  'Komentarz / dostawca:',
  doc.komentarz || ''
);


const dataUtworzenia = prompt(
  'Data dokumentu (YYYY-MM-DD HH:mm:ss)',
  doc.data_utworzenia
);

if (dataUtworzenia === null) return;

if (comment === null) return;

            if (!qty) return;

            try {

              await api.put(
  `/stan/${doc.operacja_id}`,
  {
    asortyment_id: doc.asortyment_id,
    regal_id: doc.regal_id,
    uzytkownik_id: doc.uzytkownik_id,
    ilosc: Number(qty),
    komentarz: comment,
    typ_operacji: doc.typ_operacji,
    data_utworzenia: dataUtworzenia
  }
);
              setToast({
                type: 'ok',
                msg: 'Dokument poprawiony'
              });

              await loadAll();

            } catch (e) {

              setToast({
                type: 'err',
                msg:
                  e?.response?.data?.error ||
                  'Błąd edycji'
              });

            }
          }}
        >
          ✏️ Edytuj
        </button>
      </td>
    </tr>
  ))}
      
</tbody>      </table>
    )}
  </div>
)}
{infoProduct && (
  <div
    style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 9999
    }}
  >
    <div
      className="card"
      style={{
        width: '500px',
        maxWidth: '90%',
        background: 'white',
        padding: '20px',
        borderRadius: '10px'
      }}
    >
      <h3>ℹ️ Informacje o produkcie</h3>

      <p>
        <strong>Produkt:</strong> {infoProduct.nazwa}
      </p>

      <div style={{ marginTop: '10px' }}>
        <label>📏 Długość (cm)</label>
        <input
  type="number"
  value={infoProduct.dlugosc || ''}
  onChange={(e) =>
    setInfoProduct({
      ...infoProduct,
      dlugosc: e.target.value
    })
  }
/>
      </div>

      <div style={{ marginTop: '10px' }}>
        <label>📐 Szerokość (cm)</label>
        <input
  type="number"
  value={infoProduct.szerokosc || ''}
  onChange={(e) =>
    setInfoProduct({
      ...infoProduct,
      szerokosc: e.target.value
    })
  }
/>
      </div>
<div style={{ marginTop: '10px' }}>
  <label>⚖️ Waga (kg)</label>
  <input
  type="number"
  value={infoProduct.waga || ''}
  onChange={(e) =>
    setInfoProduct({
      ...infoProduct,
      waga: e.target.value
    })
  }
/>
</div>

      <div style={{ marginTop: '10px' }}>
        <label>📦 Wysokość (cm)</label>
        <input
  type="number"
  value={infoProduct.wysokosc || ''}
  onChange={(e) =>
    setInfoProduct({
      ...infoProduct,
      wysokosc: e.target.value
    })
  }
/>
      </div>
<button
  style={{ marginTop: '10px' }}
  onClick={async () => {
    try {
      await api.put(`/asortyment/${infoProduct.id}`, {
        ...infoProduct
      });

      setToast({
        type: 'ok',
        msg: 'Dane produktu zapisane'
      });

      await loadAll();

    } catch {
      setToast({
        type: 'err',
        msg: 'Nie udało się zapisać'
      });
    }
  }}
>
  Zapisz
</button>

      <button
        style={{ marginTop: '20px' }}
        onClick={() => setInfoProduct(null)}
      >
        Zamknij
      </button>
    </div>
  </div>
)}    
{editProduct && (
  <div
    style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 9999
    }}
  >
    <div
      className="card"
      style={{
        width: '500px',
        maxWidth: '90%',
        background: 'white',
        padding: '20px',
        borderRadius: '10px'
      }}
    >
      <h3>✏️ Edycja produktu</h3>

      <div style={{ marginTop: '10px' }}>
        <label>Nazwa produktu</label>

        <input
          value={editProduct.nazwa || ''}
          onChange={(e) =>
            setEditProduct({
              ...editProduct,
              nazwa: e.target.value
            })
          }
        />
      </div>

      <div style={{ marginTop: '10px' }}>
        <label>Dostawca</label>

        <input
          value={editProduct.dostawca || ''}
          onChange={(e) =>
            setEditProduct({
              ...editProduct,
              dostawca: e.target.value
            })
          }
        />
      </div>

      <button
        style={{ marginTop: '20px' }}
        onClick={async () => {
          try {
            await api.put(
              `/asortyment/${editProduct.id}`,
              editProduct
            );

            setToast({
              type: 'ok',
              msg: 'Produkt zapisany'
            });

            await loadAll();
            setEditProduct(null);
          } catch {
            setToast({
              type: 'err',
              msg: 'Nie udało się zapisać'
            });
          }
        }}
      >
        Zapisz
      </button>

      <button
        style={{ marginTop: '20px', marginLeft: '10px' }}
        onClick={() => setEditProduct(null)}
      >
        Zamknij
      </button>
    </div>
  </div>
)}

{infoShelf && (
  <div
    style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 9999
    }}
  >
    <div
      className="card"
      style={{
        width: '500px',
        maxWidth: '90%',
        background: 'white',
        padding: '20px',
        borderRadius: '10px'
      }}
    >
      <h3>ℹ️ Informacje o regale</h3>

      <p>
        <strong>Regał:</strong> {infoShelf.kod_lokalizacji}
      </p>

      <div style={{ marginTop: '10px' }}>
        <label>⚖️ Maksymalne obciążenie (kg)</label>

        <input
          type="number"
          value={infoShelf.maksymalne_obciazenie || ''}
          onChange={(e) =>
            setInfoShelf({
              ...infoShelf,
              maksymalne_obciazenie: e.target.value
            })
          }
        />

        <button
          style={{ marginTop: '10px' }}
          onClick={async () => {
            try {
              await api.put(`/regal/${infoShelf.id}`, {
                ...infoShelf
              });

              setToast({
                type: 'ok',
                msg: 'Zapisano maksymalne obciążenie'
              });

              await loadAll();
            } catch {
              setToast({
                type: 'err',
                msg: 'Nie udało się zapisać'
              });
            }
          }}
        >
          Zapisz
        </button>
      </div>

      {(() => {
        const procent =
          Number(infoShelf.maksymalne_obciazenie) > 0
            ? (
                Number(infoShelf.stopien_obciazenia || 0) /
                Number(infoShelf.maksymalne_obciazenie)
              ) * 100
            : 0;

        let kolor = 'green';

        if (procent > 95) {
          kolor = 'red';
        } else if (procent > 80) {
          kolor = 'orange';
        }

        return (
          <>
            <p>
              <strong>📦 Liczba sztuk:</strong>{' '}
              {infoShelf.liczba_sztuk || 0}
            </p>

            <p>
              <strong>⚖️ Aktualne obciążenie:</strong>{' '}
              {infoShelf.stopien_obciazenia || 0} kg
            </p>

            <p>
              <strong>✅ Pozostało miejsca:</strong>{' '}
              {infoShelf.pozostalo || 0} kg
            </p>

            <p>
              <span
                style={{
                  display: 'inline-block',
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  backgroundColor: kolor,
                  marginRight: 10
                }}
              />

              <strong>Wykorzystanie:</strong>{' '}
              {procent.toFixed(1)}%
            </p>
          </>
        );
      })()}

      <button
        style={{ marginTop: '20px' }}
        onClick={() => setInfoShelf(null)}
      >
        Zamknij
      </button>
    </div>
  </div>
)}

{showTransferWindow && (
  <div
    style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 99999
    }}
  >
    <div
      className="card"
      style={{
        width: '1000px',
        maxWidth: '95%',
        height: '700px',
        background: 'white',
        padding: '20px',
        borderRadius: '10px'
      }}
    >
      <h2>🔄 Przesunięcie między regałami</h2>

      <div
        style={{
          display: 'flex',
          gap: '20px',
          marginTop: '20px'
        }}
      >

        <div style={{ flex: 1 }}>
          <h3>Regał źródłowy</h3>

          <div
            style={{
              border: '1px solid #ccc',
              height: '500px',
              overflow: 'auto'
            }}
          >
            {sourceShelves.map((shelf) => (
  <div
    key={shelf.id}
    style={{
      padding: '10px',
      borderBottom: '1px solid #ddd',
      cursor: 'pointer'
    }}
  >
    {shelf.kod_lokalizacji}
  </div>
))}
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <h3>Regał docelowy</h3>

          <div
            style={{
              border: '1px solid #ccc',
              height: '500px',
              overflow: 'auto'
            }}
          >
            {targetShelves.map((shelf) => (
  <div
    key={shelf.id}
    style={{
      padding: '10px',
      borderBottom: '1px solid #ddd',
      cursor: 'pointer'
    }}
  >
    {shelf.kod_lokalizacji}
  </div>
))}
          </div>
        </div>

      </div>

      <button
        style={{ marginTop: '20px' }}
        onClick={() =>
          setShowTransferWindow(false)
        }
      >
        Zamknij
      </button>

    </div>
  </div>
)}

<style>{`
#print-area {
  display: none;
}

@media print {

  body * {
    visibility: hidden !important;
  }

  #print-area,
  #print-area * {
    visibility: visible !important;
  }

  #print-area {
    display: block !important;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    padding: 30px;
    background: white;
    box-sizing: border-box;
    z-index: 99999;
  }

  button,
  select {
    display: none !important;
  }
}
`}</style>
  </div>
  );
}
