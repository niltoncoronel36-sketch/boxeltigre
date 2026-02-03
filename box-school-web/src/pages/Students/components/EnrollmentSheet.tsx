import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";

type StudentLite = {
  id: number;

  first_name?: string | null;
  last_name?: string | null;

  email?: string | null;
  phone?: string | null;

  document_number?: string | null; // DNI
  birthdate?: string | null; // YYYY-MM-DD
  address?: string | null;

  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;

  is_active?: any;
};

type EnrollmentLite = {
  id: number;
  status?: string | null;

  starts_on?: string | null;
  ends_on?: string | null;

  category?: {
    id: number;
    name: string;
    level?: string | null;
  } | null;
};

function formatDate(ymd?: string | null) {
  if (!ymd) return "—";
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (!m) return ymd;
  return `${m[3]}/${m[2]}/${m[1]}`;
}

function calcAge(birthdate?: string | null) {
  if (!birthdate) return "—";
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthdate);
  if (!m) return "—";
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const now = new Date();
  let age = now.getFullYear() - y;
  const cur = (now.getMonth() + 1) * 100 + now.getDate();
  const dob = mo * 100 + d;
  if (cur < dob) age -= 1;
  return String(Math.max(0, age));
}

export default function EnrollmentSheet(props: {
  student: StudentLite;
  enrollment?: EnrollmentLite | null;

  club?: {
    name?: string;
    city?: string;
    address?: string;
    phone?: string;
    email?: string;
    whatsapp?: string;
    facebook?: string;
    tiktok?: string;
    website?: string;
  };
}) {
  const { student, enrollment, club } = props;
  const navigate = useNavigate();

  const fullName = useMemo(() => {
    const fn = (student.first_name ?? "").trim();
    const ln = (student.last_name ?? "").trim();
    const v = `${fn} ${ln}`.trim();
    return v || "—";
  }, [student.first_name, student.last_name]);

  const dni = (student.document_number ?? "—") as string;
  const expediente = useMemo(() => `EXP-${String(student.id).padStart(6, "0")}`, [student.id]);

  const isActive = student.is_active === true || student.is_active === 1 || student.is_active === "1";

  const today = new Date();
  const todayYmd = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(
    today.getDate()
  ).padStart(2, "0")}`;

  // ✅ Datos del club
  const clubName = club?.name ?? "CLUB DE BOX “EL TIGRE”";
  const clubCity = club?.city ?? "Huancayo";
  const clubAddr = club?.address ?? "—";
  const clubPhone = club?.phone ?? "924 710 687";
  const clubEmail = club?.email ?? "eltigre@gmail.com";
  const clubWsp = club?.whatsapp ?? "51924710687";
  const clubFb = club?.facebook ?? "@eltigrebox";
  const clubTk = club?.tiktok ?? "@eltigrebox";
  const clubWeb = club?.website ?? "https://eltigrecorporacion.com/";

  const catName = enrollment?.category?.name ?? "—";
  const catLevel = enrollment?.category?.level ?? null;

  return (
    <div className="a4-stage print-root">
      {/* Botones (no imprimir) */}
      <div className="no-print top-actions">
        <button className="btn" type="button" onClick={() => navigate(-1)}>
          Volver
        </button>
        <button className="btn btn-primary" type="button" onClick={() => window.print()}>
          Imprimir
        </button>
      </div>

      {/* Hoja A4 */}
      <div className="sheet a4-page">
        {/* HEADER */}
        <div className="hdr">
          <div className="hdr-left">
            <div className="logo">🥊</div>
            <div>
              <div className="club">{clubName}</div>
              <div className="sub">{`Ficha de Matrícula • ${clubCity}`}</div>
              <div className="mini">{clubAddr}</div>
            </div>
          </div>

          <div className="hdr-right">
            <div className="tag">{expediente}</div>
            <div className="mini">Fecha: {formatDate(todayYmd)}</div>
            <div className={`pill ${isActive ? "ok" : "bad"}`}>{isActive ? "ACTIVO" : "INACTIVO"}</div>
          </div>
        </div>

        {/* DATOS + FOTO */}
        <div className="top-grid">
          <div className="card">
            <div className="sec">Datos del estudiante</div>

            <div className="row2">
              <div>
                <div className="k">Nombre</div>
                <div className="v">{fullName}</div>
              </div>
              <div>
                <div className="k">DNI</div>
                <div className="v">{dni}</div>
              </div>
            </div>

            <div className="row3">
              <div>
                <div className="k">Nacimiento</div>
                <div className="v">{formatDate(student.birthdate ?? null)}</div>
              </div>
              <div>
                <div className="k">Edad</div>
                <div className="v">{calcAge(student.birthdate)} años</div>
              </div>
              <div>
                <div className="k">Teléfono</div>
                <div className="v">{student.phone ?? "—"}</div>
              </div>
            </div>

            <div className="row2">
              <div>
                <div className="k">Correo</div>
                <div className="v">{student.email ?? "—"}</div>
              </div>
              <div>
                <div className="k">Dirección</div>
                <div className="v">{student.address ?? "—"}</div>
              </div>
            </div>

            <div className="hr" />

            <div className="row2">
              <div>
                <div className="k">Emergencia</div>
                <div className="v">{student.emergency_contact_name ?? "—"}</div>
              </div>
              <div>
                <div className="k">Tel. Emergencia</div>
                <div className="v">{student.emergency_contact_phone ?? "—"}</div>
              </div>
            </div>
          </div>

          <div className="card photo-card">
            <div className="sec">Foto (carnet)</div>
            <div className="photo">
              <div className="mini" style={{ textAlign: "center" }}>
                PEGAR FOTO
              </div>
              <div className="mini" style={{ textAlign: "center" }}>
                30mm x 40mm
              </div>
            </div>

            <div className="mini" style={{ marginTop: 6 }}>
              Observaciones (salud/lesiones):
            </div>
            <div className="line-fill" />
          </div>
        </div>

        {/* MATRÍCULA + HORARIOS/NOTAS */}
        <div className="mid-grid">
          <div className="card">
            <div className="sec">Matrícula</div>

            <div className="row3">
              <div>
                <div className="k">Categoría</div>
                <div className="v">
                  {catName}
                  {catLevel ? <span className="mini" style={{ marginLeft: 6 }}>({catLevel})</span> : null}
                </div>
              </div>
              <div>
                <div className="k">Inicio</div>
                <div className="v">{formatDate(enrollment?.starts_on ?? null)}</div>
              </div>
              <div>
                <div className="k">Fin</div>
                <div className="v">{formatDate(enrollment?.ends_on ?? null)}</div>
              </div>
            </div>

            <div className="mini">
              ID Matrícula: {enrollment?.id ?? "—"} • Estado: {enrollment?.status ?? "—"}
            </div>

            <div className="hr" />

            <div className="row3">
              <div>
                <div className="k">Objetivo</div>
                <div className="v small">⬜ Competencia ⬜ Defensa ⬜ Salud ⬜ Disciplina</div>
              </div>
              <div>
                <div className="k">Nivel</div>
                <div className="v small">⬜ Inicial ⬜ Intermedio ⬜ Avanzado</div>
              </div>
              <div>
                <div className="k">Implemento</div>
                <div className="v small">⬜ 12oz ⬜ 14oz ⬜ 16oz</div>
              </div>
            </div>

            <div className="hr" />

            <div className="two-col-fill">
              <div>
                <div className="k">Horarios / Asistencia</div>
                <div className="lines">
                  <div>⬜ Lun ⬜ Mar ⬜ Mié ⬜ Jue ⬜ Vie ⬜ Sáb</div>
                  <div>Hora: ____________ a ____________</div>
                  <div>Coach: __________________________</div>
                </div>
              </div>

              <div>
                <div className="k">Notas del Coach / Evaluación</div>
                <div className="notes-box">
                  (Técnica, guardia, resistencia, peso, lesiones, disciplina, progreso, etc.)
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CONTACTO + DIFUSIÓN */}
        <div className="contact-grid">
          <div className="card">
            <div className="sec">Contacto y difusión</div>

            <div className="row3">
              <div>
                <div className="k">Celular</div>
                <div className="v">{clubPhone}</div>
              </div>
              <div>
                <div className="k">Email</div>
                <div className="v">{clubEmail}</div>
              </div>
              <div>
                <div className="k">Web</div>
                <div className="v">{clubWeb}</div>
              </div>
            </div>

            <div className="row3">
              <div>
                <div className="k">WhatsApp</div>
                <div className="v">{clubWsp}</div>
              </div>
              <div>
                <div className="k">Facebook</div>
                <div className="v">{clubFb}</div>
              </div>
              <div>
                <div className="k">TikTok</div>
                <div className="v">{clubTk}</div>
              </div>
            </div>

            <div className="hr" />

            <div className="checks-wrap">
              <div className="checks-block">
                <div className="k" style={{ marginBottom: 4 }}>¿Cómo se enteró?</div>
                <div className="checks">
                  <span className="chk"><span className="box" /> Facebook</span>
                  <span className="chk"><span className="box" /> TikTok</span>
                  <span className="chk"><span className="box" /> Volante</span>
                  <span className="chk"><span className="box" /> Recomendación</span>
                  <span className="chk"><span className="box" /> Evento</span>
                  <span className="chk"><span className="box" /> Otro: __________</span>
                </div>
              </div>

              <div className="checks-block">
                <div className="k" style={{ marginBottom: 4 }}>Contacto preferido</div>
                <div className="checks">
                  <span className="chk"><span className="box" /> WhatsApp</span>
                  <span className="chk"><span className="box" /> Llamada</span>
                  <span className="chk"><span className="box" /> SMS</span>
                  <span className="chk"><span className="box" /> Email</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* PIE */}
        <div className="sheet-footer">
          <div className="bottom-grid">
            <div className="sign">
              <div className="line" />
              <div className="k">Firma del Estudiante</div>
              <div className="mini">{fullName}</div>
            </div>

            <div className="sign">
              <div className="line" />
              <div className="k">Firma del Encargado</div>
              <div className="mini">{clubName}</div>
            </div>

            <div className="sign mini-sign">
              <div className="k">Huella</div>
              <div className="thumb-box">HUELLA</div>
            </div>

            <div className="sign mini-sign">
              <div className="k">Sello</div>
              <div className="thumb-box">SELLO</div>
            </div>
          </div>

          <div className="tc">
            <div className="sec">Términos y condiciones (resumen)</div>
            <div className="mini note">
              1) Respeto y disciplina. 2) Uso de protección según coach. 3) Sin devolución por inasistencia.
              4) No responsabilidad por lesiones por imprudencia. 5) Autorización foto/video (opcional).
            </div>
          </div>

          <div className="tiny">
            * Documento interno del club. Conservar en el expediente del estudiante.
          </div>
        </div>
      </div>

      {/* ✅ PRINT FIX: fuerza 1 página y oculta layout si se cuela */}
      <style>{`
        .a4-stage{
          padding: 16px;
          background: #fff;
          min-height: 100vh;
        }
        .top-actions{
          display:flex;
          justify-content:flex-end;
          gap: 8px;
          max-width: 210mm;
          margin: 0 auto 10px auto;
        }

        @page { size: A4; margin: 0; }

        /* Hoja A4 real */
        .sheet{
          width: 210mm;
          min-height: 297mm;
          margin: 0 auto;
          background: #fff;
          border-radius: 8px;
          box-shadow: 0 30px 90px rgba(0,0,0,.45);
          border: 1px solid rgba(0,0,0,.12);
          padding: 7mm;
          box-sizing: border-box;
          font-family: Arial, Helvetica, sans-serif;
          color: #0f172a;
        }

        /* evita cortes internos */
        .a4-page, .sheet, .card, .sign, .tc { break-inside: avoid; page-break-inside: avoid; }

        .hdr{ display:flex; justify-content:space-between; gap: 10mm; align-items:flex-start; }
        .hdr-left{ display:flex; gap: 4mm; align-items:center; }
        .logo{
          width: 14mm; height: 14mm;
          border-radius: 5mm;
          background:#0f172a; color:#fff;
          display:grid; place-items:center;
          font-size: 18px; font-weight: 900;
        }
        .club{ font-weight: 900; font-size: 12pt; letter-spacing: .2px; }
        .sub{ font-size: 9pt; opacity: .75; margin-top: 1mm; }
        .mini{ font-size: 8pt; opacity: .75; margin-top: 1mm; }
        .hdr-right{ text-align:right; }
        .tag{
          display:inline-block;
          background:#0f172a; color:#fff;
          padding: 2mm 4mm;
          border-radius: 999px;
          font-weight: 900;
          font-size: 9pt;
        }
        .pill{
          display:inline-block;
          margin-top: 2mm;
          padding: 1mm 4mm;
          border-radius: 999px;
          font-weight: 900;
          font-size: 8pt;
        }
        .pill.ok{ background:#dcfce7; color:#166534; }
        .pill.bad{ background:#fee2e2; color:#991b1b; }

        .card{
          border: 1px solid rgba(0,0,0,.10);
          border-radius: 12px;
          padding: 10px;
          background:#f8fafc;
          box-sizing:border-box;
        }
        .sec{ font-weight: 900; font-size: 10pt; margin-bottom: 6px; }
        .k{ font-size: 8pt; font-weight: 900; opacity: .7; text-transform: uppercase; letter-spacing: .3px; }
        .v{ font-size: 9.5pt; font-weight: 900; margin-top: 2px; }
        .v.small{ font-weight: 800; font-size: 9pt; }
        .hr{ height: 1px; background: rgba(0,0,0,.10); margin: 8px 0; }

        .top-grid{ margin-top: 10px; display:grid; grid-template-columns: 1fr 56mm; gap: 10px; }
        .photo-card{ background:#fff; }

        .photo{
          width: 30mm; height: 40mm;
          border: 2px dashed rgba(0,0,0,.18);
          border-radius: 8px;
          background:#fff;
          display:grid;
          place-items:center;
          margin-top: 6px;
        }
        .line-fill{
          height: 12px;
          border-bottom: 1px solid rgba(0,0,0,.35);
          margin-top: 6px;
        }

        .row2{ display:grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 6px; }
        .row3{ display:grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-top: 6px; }

        .mid-grid{ margin-top: 10px; }
        .contact-grid{ margin-top: 10px; }

        .two-col-fill{
          display:grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-top: 6px;
          align-items: start;
        }
        .lines{
          background:#fff;
          border: 1px solid rgba(0,0,0,.12);
          border-radius: 10px;
          padding: 10px;
          font-size: 8.5pt;
          opacity: .9;
          line-height: 1.55;
        }
        .notes-box{
          margin-top: 6px;
          background: #fff;
          border: 1px solid rgba(0,0,0,.12);
          border-radius: 10px;
          padding: 10px;
          min-height: 92px;
          font-size: 8.5pt;
          opacity: .85;
        }

        .checks-wrap{ display:grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .checks{ display:flex; flex-wrap: wrap; gap: 6px 12px; }
        .chk{ display:inline-flex; align-items:center; gap: 6px; font-size: 8.5pt; font-weight: 700; }
        .box{ width: 12px; height: 12px; border: 1px solid rgba(0,0,0,.55); border-radius: 3px; background:#fff; }

        .sheet-footer{ margin-top: 10px; }
        .bottom-grid{
          display:grid;
          grid-template-columns: 1fr 1fr 1fr 1fr;
          gap: 10px;
          align-items: end;
        }
        .sign{
          border: 1px solid rgba(0,0,0,.10);
          border-radius: 12px;
          padding: 10px;
          background:#fff;
          min-height: 75px;
          box-sizing:border-box;
        }
        .mini-sign{ min-height: 75px; }
        .line{ height: 1px; background: rgba(0,0,0,.30); margin-top: 28px; }

        .thumb-box{
          margin-top: 8px;
          height: 38px;
          border: 1px dashed rgba(0,0,0,.35);
          border-radius: 10px;
          display:grid;
          place-items:center;
          font-weight: 900;
          font-size: 9pt;
          opacity: .75;
        }

        .tc{
          margin-top: 10px;
          border: 1px solid rgba(0,0,0,.10);
          border-radius: 12px;
          padding: 10px;
          background:#fff;
        }
        .note{ line-height: 1.35; }
        .tiny{ margin-top: 6px; font-size: 8pt; opacity: .7; }

        @media print{
          html, body{
            margin:0 !important;
            padding:0 !important;
            background:#fff !important;
          }
          header, nav, aside, footer { display:none !important; }
          .no-print{ display:none !important; }

          .print-root{ background:#fff !important; padding:0 !important; min-height:auto !important; }
          .sheet.a4-page{
            width:210mm !important;
            min-height:297mm !important;
            margin:0 !important;
            padding:10mm !important;
            border:none !important;
            border-radius:0 !important;
            box-shadow:none !important;
          }
        }
      `}</style>
    </div>
  );
}
