import React from "react";

export default function DataTable(props: {
  columns: Array<{ key: string; title: string; render?: (row: any) => React.ReactNode }>;
  rows: any[];
  loading?: boolean;
  err?: string | null;
}) {
  const { columns, rows, loading, err } = props;

  return (
    <div className="card" style={{ padding: 12 }}>
      {err ? <div className="err" style={{ marginBottom: 10 }}>{err}</div> : null}

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  style={{
                    textAlign: "left",
                    padding: 10,
                    borderBottom: "1px solid rgba(0,0,0,.08)",
                    color: "rgba(0,0,0,.60)",
                    fontWeight: 900,
                    textTransform: "uppercase",
                    letterSpacing: 0.4,
                    whiteSpace: "nowrap",
                  }}
                >
                  {c.title}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} style={{ padding: 12, color: "rgba(0,0,0,.60)" }}>
                  Cargando...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} style={{ padding: 12, color: "rgba(0,0,0,.60)" }}>
                  Sin resultados.
                </td>
              </tr>
            ) : (
              rows.map((r, idx) => (
                <tr key={idx}>
                  {columns.map((c) => (
                    <td key={c.key} style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.06)" }}>
                      {c.render ? c.render(r) : String((r as any)[c.key] ?? "—")}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
