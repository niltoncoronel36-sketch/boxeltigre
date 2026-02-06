import React, { useMemo, useState } from "react";
import { getApiErrorMessage } from "../../services/api";
import type { Student, StudentPayload } from "../../services/students";
import { createStudentUser, getStudent } from "../../services/students";
import "./StudentsPage.css";

import { useStudents } from "./hooks/useStudents";
import { StudentsTable } from "./components/StudentsTable";
import { StudentFormModal } from "./components/StudentFormModal";
import type { ModalMode } from "./components/StudentFormModal";
import { StudentProfileModal } from "./components/StudentProfileModal";

import { clamp, formatName, strOrNull } from "./utils/helpers";

type ToastKind = "success" | "error" | "info";
type ToastState = { open: boolean; kind: ToastKind; message: string };

type CredsState = {
  open: boolean;
  studentName: string;
  username: string;
  password: string;
};

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // fallback
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      return true;
    } catch {
      return false;
    }
  }
}

export default function StudentsPage() {
  const students = useStudents(15);

  // modal estudiante
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("create");
  const [editing, setEditing] = useState<Student | null>(null);
  const [formErr, setFormErr] = useState<string | null>(null);

  const [form, setForm] = useState<StudentPayload>({
    first_name: "",
    last_name: "",
    birthdate: "",
    document_type: "DNI",
    document_number: "",
    phone: "",
    email: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    is_active: true,
  } as any);

  // perfil
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileStudent, setProfileStudent] = useState<Student | null>(null);

  // crear usuario
  const [creatingUserStudentId, setCreatingUserStudentId] = useState<number | null>(null);
  const [confirmUserOpen, setConfirmUserOpen] = useState(false);
  const [confirmUserStudent, setConfirmUserStudent] = useState<Student | null>(null);

  // modal credenciales
  const [creds, setCreds] = useState<CredsState>({
    open: false,
    studentName: "",
    username: "",
    password: "",
  });

  // toast
  const [toast, setToast] = useState<ToastState>({ open: false, kind: "info", message: "" });

  const title = useMemo(() => "Alumnos", []);

  function showToast(kind: ToastKind, message: string) {
    setToast({ open: true, kind, message });
    window.setTimeout(() => setToast((t) => ({ ...t, open: false })), 2600);
  }

  function openCreate() {
    setModalMode("create");
    setEditing(null);
    setFormErr(null);
    setForm({
      first_name: "",
      last_name: "",
      birthdate: "",
      document_type: "DNI",
      document_number: "",
      phone: "",
      email: "",
      emergency_contact_name: "",
      emergency_contact_phone: "",
      is_active: true,
    } as any);
    setModalOpen(true);
  }

  function openEdit(s: Student) {
    setModalMode("edit");
    setEditing(s);
    setFormErr(null);
    setForm({
      user_id: s.user_id,
      first_name: s.first_name,
      last_name: s.last_name,
      birthdate: s.birthdate ?? "",
      document_type: s.document_type,
      document_number: s.document_number,
      phone: s.phone,
      email: s.email,
      emergency_contact_name: s.emergency_contact_name,
      emergency_contact_phone: s.emergency_contact_phone,
      is_active: s.is_active,
    } as any);
    setModalOpen(true);
  }

  async function onSaveStudent(e: React.FormEvent) {
    e.preventDefault();
    setFormErr(null);

    try {
      const payload: any = {
        ...form,
        first_name: String((form as any).first_name ?? "").trim(),
        last_name: String((form as any).last_name ?? "").trim(),
        birthdate: strOrNull((form as any).birthdate),
        document_type: strOrNull((form as any).document_type),
        document_number: strOrNull((form as any).document_number),
        phone: strOrNull((form as any).phone),
        email: strOrNull((form as any).email),
        emergency_contact_name: strOrNull((form as any).emergency_contact_name),
        emergency_contact_phone: strOrNull((form as any).emergency_contact_phone),
      };

      if (!payload.first_name || !payload.last_name) {
        setFormErr("Nombre y apellido son obligatorios.");
        return;
      }

      if (
        (payload.document_type && !payload.document_number) ||
        (!payload.document_type && payload.document_number)
      ) {
        setFormErr("document_type y document_number deben enviarse juntos.");
        return;
      }

      if (modalMode === "create") await students.createOne(payload);
      if (modalMode === "edit" && editing) await students.updateOne(editing.id, payload);

      setModalOpen(false);
      await students.refresh();
      showToast("success", modalMode === "create" ? "Alumno creado." : "Cambios guardados.");
    } catch (ex) {
      setFormErr(getApiErrorMessage(ex));
      showToast("error", getApiErrorMessage(ex));
    }
  }

  async function onDeleteStudent(s: Student) {
    if (!window.confirm(`¿Eliminar a ${formatName(s)}?`)) return;

    try {
      await students.deleteOne(s.id);
      const remaining = students.items.length - 1;
      const nextPage = remaining <= 0 && students.page > 1 ? students.page - 1 : students.page;

      if (nextPage !== students.page) {
        students.setPage(nextPage);
      } else {
        await students.refresh();
      }

      showToast("success", "Alumno eliminado.");
    } catch (e) {
      students.setErr(getApiErrorMessage(e));
      showToast("error", getApiErrorMessage(e));
    }
  }

  async function toggleStudentActive(s: Student) {
    try {
      await students.updateOne(s.id, { is_active: !s.is_active } as any);
      await students.refresh();
      showToast("success", `Alumno ${s.is_active ? "desactivado" : "activado"}.`);
    } catch (e) {
      students.setErr(getApiErrorMessage(e));
      showToast("error", getApiErrorMessage(e));
    }
  }

  // carga perfil fresco
  async function openStudentProfile(s: Student) {
    try {
      const freshStudent = await getStudent(s.id);
      setProfileStudent(freshStudent);
    } catch (err) {
      console.error("Error cargando perfil detallado:", err);
      setProfileStudent(s);
    }
    setProfileOpen(true);
  }

  function closeProfile() {
    setProfileOpen(false);
    setProfileStudent(null);
  }

  function goPrev() {
    students.setPage((p) => clamp(p - 1, 1, students.lastPage));
  }

  function goNext() {
    students.setPage((p) => clamp(p + 1, 1, students.lastPage));
  }

  // ✅ NUEVO UX: confirmar antes de crear usuario (sin alert feo)
  function askCreateUser(s: Student) {
    const dni = String(s.document_number ?? "").trim();
    if (!dni) {
      students.setErr("Este alumno no tiene DNI para crear usuario.");
      showToast("error", "Este alumno no tiene DNI para crear usuario.");
      return;
    }
    setConfirmUserStudent(s);
    setConfirmUserOpen(true);
  }

  async function confirmCreateUserNow() {
    const s = confirmUserStudent;
    if (!s) return;

    const dni = String(s.document_number ?? "").trim();
    if (!dni) {
      setConfirmUserOpen(false);
      setConfirmUserStudent(null);
      students.setErr("Este alumno no tiene DNI para crear usuario.");
      showToast("error", "Este alumno no tiene DNI para crear usuario.");
      return;
    }

    setConfirmUserOpen(false);

    try {
      setCreatingUserStudentId(s.id);
      await createStudentUser(s.id);

      // modal pro con credenciales
      setCreds({
        open: true,
        studentName: formatName(s),
        username: dni,
        password: dni,
      });

      await students.refresh();
      showToast("success", "Usuario creado correctamente.");
    } catch (e: any) {
      students.setErr(getApiErrorMessage(e));
      showToast("error", getApiErrorMessage(e));
    } finally {
      setCreatingUserStudentId(null);
      setConfirmUserStudent(null);
    }
  }

  const isBusy = students.loading || creatingUserStudentId !== null;

  return (
    <div className="students-page">
      <div className="students-page__inner">
        {/* Header pro */}
        <div className="students-head">
          <div className="students-head__left">
            <div className="students-kicker">Gestión</div>
            <h1 className="students-title">{title}</h1>
            <p className="students-subtitle">
              Crea alumnos, revisa su perfil y genera su usuario en un click.
            </p>
          </div>

          <div className="students-head__right">
            <button className="sp-btn sp-btn--ghost" onClick={() => students.refresh()} disabled={students.loading}>
              {students.loading ? "Actualizando…" : "Actualizar"}
            </button>

            <button className="sp-btn sp-btn--primary" onClick={openCreate} disabled={students.loading}>
              + Nuevo alumno
            </button>
          </div>
        </div>

        {/* Card contenedor */}
        <div className="students-card">
          <StudentsTable
            items={students.items}
            total={students.total}
            page={students.page}
            lastPage={students.lastPage}
            loading={students.loading}
            err={students.err}
            search={students.search}
            active={students.active}
            onSearchChange={(v) => {
              students.setPage(1);
              students.setSearch(v);
            }}
            onActiveChange={(v) => {
              students.setPage(1);
              students.setActive(v);
            }}
            onOpenCreate={openCreate}
            onRowClick={openStudentProfile}
            onPrev={goPrev}
            onNext={goNext}
            // ✅ aquí mejoramos el flujo: confirm modal antes de crear
            onCreateUser={askCreateUser}
            creatingUserStudentId={creatingUserStudentId}
          />
        </div>

        <StudentFormModal
          open={modalOpen}
          mode={modalMode}
          editing={editing}
          form={form}
          setForm={setForm}
          loading={students.loading}
          err={formErr}
          onClose={() => setModalOpen(false)}
          onSubmit={onSaveStudent}
        />

        <StudentProfileModal
          open={profileOpen}
          student={profileStudent}
          onClose={closeProfile}
          onEdit={(s) => {
            closeProfile();
            openEdit(s);
          }}
          onToggleActive={toggleStudentActive}
          onDeleteStudent={onDeleteStudent}
        />

        {/* Confirmación Crear Usuario */}
        {confirmUserOpen && confirmUserStudent && (
          <div className="sp-overlay" role="dialog" aria-modal="true">
            <div className="sp-modal">
              <div className="sp-modal__top">
                <div className="sp-pill">Crear usuario</div>
                <h3 className="sp-modal__title">Confirmar creación</h3>
                <p className="sp-modal__subtitle">
                  Se creará un usuario para <b>{formatName(confirmUserStudent)}</b>.
                </p>
              </div>

              <div className="sp-info">
                <div className="sp-info__row">
                  <span>DNI (usuario y contraseña)</span>
                  <b>{String(confirmUserStudent.document_number ?? "").trim()}</b>
                </div>
                <div className="sp-info__hint">
                  Por defecto: <b>Usuario = DNI</b> y <b>Contraseña = DNI</b>.
                </div>
              </div>

              <div className="sp-modal__actions">
                <button
                  className="sp-btn sp-btn--ghost"
                  onClick={() => {
                    setConfirmUserOpen(false);
                    setConfirmUserStudent(null);
                  }}
                  disabled={isBusy}
                >
                  Cancelar
                </button>
                <button className="sp-btn sp-btn--primary" onClick={confirmCreateUserNow} disabled={isBusy}>
                  {creatingUserStudentId ? "Creando…" : "Crear usuario"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Credenciales */}
        {creds.open && (
          <div className="sp-overlay" role="dialog" aria-modal="true">
            <div className="sp-modal sp-modal--wide">
              <div className="sp-modal__top">
                <div className="sp-pill sp-pill--success">Listo</div>
                <h3 className="sp-modal__title">Usuario creado</h3>
                <p className="sp-modal__subtitle">
                  Credenciales para <b>{creds.studentName}</b>
                </p>
              </div>

              <div className="sp-creds">
                <div className="sp-creds__box">
                  <div className="sp-creds__label">Usuario</div>
                  <div className="sp-creds__value">{creds.username}</div>
                  <button
                    className="sp-btn sp-btn--ghost sp-btn--sm"
                    onClick={async () => {
                      const ok = await copyText(creds.username);
                      showToast(ok ? "success" : "error", ok ? "Usuario copiado." : "No se pudo copiar.");
                    }}
                  >
                    Copiar
                  </button>
                </div>

                <div className="sp-creds__box">
                  <div className="sp-creds__label">Contraseña</div>
                  <div className="sp-creds__value sp-creds__value--mono">{creds.password}</div>
                  <button
                    className="sp-btn sp-btn--ghost sp-btn--sm"
                    onClick={async () => {
                      const ok = await copyText(creds.password);
                      showToast(ok ? "success" : "error", ok ? "Contraseña copiada." : "No se pudo copiar.");
                    }}
                  >
                    Copiar
                  </button>
                </div>
              </div>

              <div className="sp-modal__actions">
                <button
                  className="sp-btn sp-btn--ghost"
                  onClick={async () => {
                    const ok = await copyText(`Usuario: ${creds.username}\nContraseña: ${creds.password}`);
                    showToast(ok ? "success" : "error", ok ? "Credenciales copiadas." : "No se pudo copiar.");
                  }}
                >
                  Copiar todo
                </button>

                <button
                  className="sp-btn sp-btn--primary"
                  onClick={() => setCreds((c) => ({ ...c, open: false }))}
                >
                  Entendido
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Toast */}
        {toast.open && (
          <div className={`sp-toast sp-toast--${toast.kind}`} role="status" aria-live="polite">
            <span className="sp-toast__dot" />
            <span className="sp-toast__msg">{toast.message}</span>
          </div>
        )}
      </div>
    </div>
  );
}
