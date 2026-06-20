import { useState, useMemo } from 'react';

export default function TableEditor({
  title,
  rows = [],
  columns = [],
  onAdd,
  onEdit,
  onDelete,
  onInfo,
  onExport,
  hideActions = false,
  hideAdd = false
}) {  const [q, setQ] = useState('');

  const filtered = useMemo(
    () =>
      rows.filter((r) =>
        JSON.stringify(r).toLowerCase().includes(q.toLowerCase())
      ),
    [rows, q]
  );

  return (
    <div className="card">
      <div className="row">
        <h3>{title}</h3>

        {onExport && (
          <button onClick={onExport}>
            CSV
          </button>
        )}
      </div>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Szukaj / filtruj"
      />

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.key}>
                  {c.label}
                </th>
              ))}

              {!hideActions && (onEdit || onDelete || onInfo) && (
  <th>Akcje</th>
)}            </tr>
          </thead>

          <tbody>
            {filtered.map((r, index) => (
              <tr key={r.id ?? index}>
                {columns.map((c) => (
                  <td key={c.key}>
                    {String(r[c.key] ?? '')}
                  </td>
                ))}

                {!hideActions && (onEdit || onDelete || onInfo) && (
  <td>

<div className="action-buttons">

{onEdit && (
  <button
    className="btn-edit"
    onClick={() => onEdit(r)}
  >
    ✏️ Edytuj
  </button>
)}

{onDelete && (
  <button
    className="btn-delete"
    onClick={() => onDelete(r.id)}
  >
    🗑️ Usuń
  </button>
)}

{onInfo && (
  <button
    className="btn-info"
    onClick={() => onInfo(r)}
  >
    ℹ️ Info
  </button>
)}

{(r.kod_qr || r.kod_lokalizacji) && (
  <button
    className="btn-qr"
    onClick={() => {
                          const qr =
                            r.kod_qr || r.kod_lokalizacji;

                          const url =
                            `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qr)}`;

                          const win = window.open('', '_blank');

                          win.document.write(`
                            <html>
                              <head>
                                <title>Etykieta QR</title>
                              </head>

                              <body style="text-align:center;font-family:Arial;">
                                <h2>${qr}</h2>

                                <img src="${url}" />

                                <br><br>

                                <button onclick="window.print()">
                                  Drukuj
                                </button>
                              </body>
                            </html>
                          `);
                        }}
                      >
                        QR
                      </button>
                    )}
</div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!hideAdd && onAdd && (
        <button onClick={onAdd}>
          Dodaj
        </button>
      )}
    </div>
  );
}