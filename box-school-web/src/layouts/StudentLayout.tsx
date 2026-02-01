import { Outlet, Navigate, Link } from "react-router-dom";
import { Globe } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import StudentNav from "../pages/Students/StudentNav";

export default function StudentLayout() {
  const { user, loading, isStudent } = useAuth();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (!isStudent) return <Navigate to="/home" replace />;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">🎓</div>
          <div className="brand-info">
            <div className="brand-title">Alumno</div>
            <div className="brand-sub">Panel</div>
          </div>
        </div>

        <div className="accent-line" />
        <StudentNav />
      </aside>

      <main className="main">
        <div className="topbar">
          <div className="topbar-title">Panel del Alumno</div>

          {/* ✅ Botón a la web en la derecha */}
          <div className="topbar-actions">
            <Link to="/" className="btn btn-web btn-primary" title="Ir a la web pública">
              <span className="icon" aria-hidden="true">
                <Globe size={18} />
              </span>
              <span className="btn-web-text">Ir a la web</span>
            </Link>
          </div>
        </div>

        <div className="content student-content">
          <div className="student-content-inner">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
