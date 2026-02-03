import React, { useState } from "react";
import { getApiErrorMessage } from "../../services/api";
import type { Student, StudentPayload } from "../../services/students";
import { createStudentUser, getStudent } from "../../services/students"; // ✅ IMPORTADO getStudent
import "./StudentsPage.css";


import { useStudents } from "./hooks/useStudents";
import { StudentsTable } from "./components/StudentsTable";
import { StudentFormModal } from "./components/StudentFormModal";
import type { ModalMode } from "./components/StudentFormModal";
import { StudentProfileModal } from "./components/StudentProfileModal";

import { clamp, formatName, strOrNull } from "./utils/helpers";

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

  // ✅ NUEVO: estado para botón crear usuario
  const [creatingUserStudentId, setCreatingUserStudentId] = useState<number | null>(null);

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

      if ((payload.document_type && !payload.document_number) || (!payload.document_type && payload.document_number)) {
        setFormErr("document_type y document_number deben enviarse juntos.");
        return;
      }

      if (modalMode === "create") await students.createOne(payload);
      if (modalMode === "edit" && editing) await students.updateOne(editing.id, payload);

      setModalOpen(false);
      await students.refresh();
    } catch (ex) {
      setFormErr(getApiErrorMessage(ex));
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
    } catch (e) {
      students.setErr(getApiErrorMessage(e));
    }
  }

  async function toggleStudentActive(s: Student) {
    await students.updateOne(s.id, { is_active: !s.is_active } as any);
    await students.refresh();
  }

  // ✅ ACTUALIZADO: Ahora carga los datos frescos del servidor antes de abrir el perfil
  async function openStudentProfile(s: Student) {
    try {
      // Opcional: puedes poner un loading aquí si tu API es lenta
      const freshStudent = await getStudent(s.id);
      setProfileStudent(freshStudent);
    } catch (err) {
      console.error("Error cargando perfil detallado:", err);
      // Fallback: usar los datos que ya tenemos si falla la API
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

  async function handleCreateUser(s: Student) {
    try {
      const dni = String(s.document_number ?? "").trim();
      if (!dni) {
        students.setErr("Este alumno no tiene DNI para crear usuario.");
        return;
      }

      setCreatingUserStudentId(s.id);
      await createStudentUser(s.id);
      alert(`✅ Usuario creado\n\nUsuario: ${dni}\nContraseña: ${dni}`);
      await students.refresh();
    } catch (e: any) {
      students.setErr(getApiErrorMessage(e));
    } finally {
      setCreatingUserStudentId(null);
    }
  }

  return (
  <div className="students-page">
    <div className="students-page__inner">
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
        onCreateUser={handleCreateUser}
        creatingUserStudentId={creatingUserStudentId}
      />

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
    </div>
  </div>
);

}