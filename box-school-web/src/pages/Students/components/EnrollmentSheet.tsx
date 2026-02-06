import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "./EnrollmentSheet.css";

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
    <div className="es-stage es-printRoot">
      {/* Acciones (no imprimir) */}
      <div className="es-actions es-noPrint">
        <button className="es-btn es-btn--ghost" type="button" onClick={() => navigate(-1)}>
          Volver
        </button>
        <button className="es-btn es-btn--primary" type="button" onClick={() => window.print()}>
          Imprimir
        </button>
      </div>

      {/* Hoja */}
      <div className="es-sheet es-a4Page">
        {/* Header */}
        <div className="es-hdr">
          <div className="es-hdrLeft">
            <div className="es-logo">🥊</div>
            <div className="es-hdrTxt">
              <div className="es-club">{clubName}</div>
              <div className="es-sub">{`Ficha de Matrícula • ${clubCity}`}</div>
              <div className="es-mini">{clubAddr}</div>
            </div>
          </div>

          <div className="es-hdrRight">
            <div className="es-tag">{expediente}</div>
            <div className="es-mini">Fecha: {formatDate(todayYmd)}</div>
            <div className={`es-pill ${isActive ? "ok" : "bad"}`}>{isActive ? "ACTIVO" : "INACTIVO"}</div>
          </div>
        </div>

        {/* Datos + Foto */}
        <div className="es-topGrid">
          <div className="es-card">
            <div className="es-sec">Datos del estudiante</div>

            <div className="es-row2">
              <div>
                <div className="es-k">Nombre</div>
                <div className="es-v">{fullName}</div>
              </div>
              <div>
                <div className="es-k">DNI</div>
                <div className="es-v">{dni}</div>
              </div>
            </div>

            <div className="es-row3">
              <div>
                <div className="es-k">Nacimiento</div>
                <div className="es-v">{formatDate(student.birthdate ?? null)}</div>
              </div>
              <div>
                <div className="es-k">Edad</div>
                <div className="es-v">{calcAge(student.birthdate)} años</div>
              </div>
              <div>
                <div className="es-k">Teléfono</div>
                <div className="es-v">{student.phone ?? "—"}</div>
              </div>
            </div>

            <div className="es-row2">
              <div>
                <div className="es-k">Correo</div>
                <div className="es-v">{student.email ?? "—"}</div>
              </div>
              <div>
                <div className="es-k">Dirección</div>
                <div className="es-v">{student.address ?? "—"}</div>
              </div>
            </div>

            <div className="es-hr" />

            <div className="es-row2">
              <div>
                <div className="es-k">Emergencia</div>
                <div className="es-v">{student.emergency_contact_name ?? "—"}</div>
              </div>
              <div>
                <div className="es-k">Tel. Emergencia</div>
                <div className="es-v">{student.emergency_contact_phone ?? "—"}</div>
              </div>
            </div>
          </div>

          <div className="es-card es-photoCard">
            <div className="es-sec">Foto (carnet)</div>

            <div className="es-photo">
              <div className="es-photoTxt">PEGAR FOTO</div>
              <div className="es-mini es-center">30mm x 40mm</div>
            </div>

            <div className="es-mini es-mt6">Observaciones (salud/lesiones):</div>
            <div className="es-lineFill" />
          </div>
        </div>

        {/* Matrícula */}
        <div className="es-midGrid">
          <div className="es-card">
            <div className="es-sec">Matrícula</div>

            <div className="es-row3">
              <div>
                <div className="es-k">Categoría</div>
                <div className="es-v">
                  {catName}
                  {catLevel ? <span className="es-mini es-inline">({catLevel})</span> : null}
                </div>
              </div>
              <div>
                <div className="es-k">Inicio</div>
                <div className="es-v">{formatDate(enrollment?.starts_on ?? null)}</div>
              </div>
              <div>
                <div className="es-k">Fin</div>
                <div className="es-v">{formatDate(enrollment?.ends_on ?? null)}</div>
              </div>
            </div>

            <div className="es-mini">
              ID Matrícula: <b>{enrollment?.id ?? "—"}</b> • Estado: <b>{enrollment?.status ?? "—"}</b>
            </div>

            <div className="es-hr" />

            <div className="es-row3">
              <div>
                <div className="es-k">Objetivo</div>
                <div className="es-v es-small">⬜ Competencia ⬜ Defensa ⬜ Salud ⬜ Disciplina</div>
              </div>
              <div>
                <div className="es-k">Nivel</div>
                <div className="es-v es-small">⬜ Inicial ⬜ Intermedio ⬜ Avanzado</div>
              </div>
              <div>
                <div className="es-k">Implemento</div>
                <div className="es-v es-small">⬜ 12oz ⬜ 14oz ⬜ 16oz</div>
              </div>
            </div>

            <div className="es-hr" />

            <div className="es-twoCol">
              <div>
                <div className="es-k">Horarios / Asistencia</div>
                <div className="es-lines">
                  <div>⬜ Lun ⬜ Mar ⬜ Mié ⬜ Jue ⬜ Vie ⬜ Sáb</div>
                  <div>Hora: ____________ a ____________</div>
                  <div>Coach: __________________________</div>
                </div>
              </div>

              <div>
                <div className="es-k">Notas del Coach / Evaluación</div>
                <div className="es-notes">
                  (Técnica, guardia, resistencia, peso, lesiones, disciplina, progreso, etc.)
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contacto */}
        <div className="es-contactGrid">
          <div className="es-card">
            <div className="es-sec">Contacto y difusión</div>

            <div className="es-row3">
              <div>
                <div className="es-k">Celular</div>
                <div className="es-v">{clubPhone}</div>
              </div>
              <div>
                <div className="es-k">Email</div>
                <div className="es-v">{clubEmail}</div>
              </div>
              <div>
                <div className="es-k">Web</div>
                <div className="es-v">{clubWeb}</div>
              </div>
            </div>

            <div className="es-row3">
              <div>
                <div className="es-k">WhatsApp</div>
                <div className="es-v">{clubWsp}</div>
              </div>
              <div>
                <div className="es-k">Facebook</div>
                <div className="es-v">{clubFb}</div>
              </div>
              <div>
                <div className="es-k">TikTok</div>
                <div className="es-v">{clubTk}</div>
              </div>
            </div>

            <div className="es-hr" />

            <div className="es-checksWrap">
              <div className="es-checkBlock">
                <div className="es-k es-mb4">¿Cómo se enteró?</div>
                <div className="es-checks">
                  <span className="es-chk"><span className="es-box" /> Facebook</span>
                  <span className="es-chk"><span className="es-box" /> TikTok</span>
                  <span className="es-chk"><span className="es-box" /> Volante</span>
                  <span className="es-chk"><span className="es-box" /> Recomendación</span>
                  <span className="es-chk"><span className="es-box" /> Evento</span>
                  <span className="es-chk"><span className="es-box" /> Otro: __________</span>
                </div>
              </div>

              <div className="es-checkBlock">
                <div className="es-k es-mb4">Contacto preferido</div>
                <div className="es-checks">
                  <span className="es-chk"><span className="es-box" /> WhatsApp</span>
                  <span className="es-chk"><span className="es-box" /> Llamada</span>
                  <span className="es-chk"><span className="es-box" /> SMS</span>
                  <span className="es-chk"><span className="es-box" /> Email</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pie */}
        <div className="es-footer">
          <div className="es-bottomGrid">
            <div className="es-sign">
              <div className="es-signLine" />
              <div className="es-k">Firma del Estudiante</div>
              <div className="es-mini">{fullName}</div>
            </div>

            <div className="es-sign">
              <div className="es-signLine" />
              <div className="es-k">Firma del Encargado</div>
              <div className="es-mini">{clubName}</div>
            </div>

            <div className="es-sign es-miniSign">
              <div className="es-k">Huella</div>
              <div className="es-thumbBox">HUELLA</div>
            </div>

            <div className="es-sign es-miniSign">
              <div className="es-k">Sello</div>
              <div className="es-thumbBox">SELLO</div>
            </div>
          </div>

          <div className="es-tc">
            <div className="es-sec">Términos y condiciones (resumen)</div>
            <div className="es-mini es-note">
              1) Respeto y disciplina. 2) Uso de protección según coach. 3) Sin devolución por inasistencia.
              4) No responsabilidad por lesiones por imprudencia. 5) Autorización foto/video (opcional).
            </div>
          </div>

          <div className="es-tiny">
            * Documento interno del club. Conservar en el expediente del estudiante.
          </div>
        </div>
      </div>
    </div>
  );
}
