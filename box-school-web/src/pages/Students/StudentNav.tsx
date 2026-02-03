import React from "react";
import { NavLink } from "react-router-dom";
import { Home, CalendarDays, TrendingUp, CreditCard, LogOut } from "lucide-react";
import { useAuth } from "../../auth/AuthContext";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  isActive ? "nav-link active" : "nav-link";

export default function StudentNav() {
  const { signOut } = useAuth();

  return (
    <nav className="nav" aria-label="Navegación del alumno">
      {/* Inicio */}
      <NavLink to="/student" end className={linkClass} title="Inicio">
        <span className="icon" aria-hidden="true">
          <Home size={18} />
        </span>
        <span className="nav-text">Inicio</span>
      </NavLink>

      {/* Mis clases */}
      <NavLink to="/student/classes" className={linkClass} title="Mis clases">
        <span className="icon" aria-hidden="true">
          <CalendarDays size={18} />
        </span>
        <span className="nav-text">Mis clases</span>
      </NavLink>

      {/* Mi progreso */}
      <NavLink to="/student/progress" className={linkClass} title="Mi progreso">
        <span className="icon" aria-hidden="true">
          <TrendingUp size={18} />
        </span>
        <span className="nav-text">Mi progreso</span>
      </NavLink>

      {/* Pagos */}
      <NavLink to="/student/payments" className={linkClass} title="Pagos">
        <span className="icon" aria-hidden="true">
          <CreditCard size={18} />
        </span>
        <span className="nav-text">Pagos</span>
      </NavLink>

      {/* Logout */}
      <button type="button" className="nav-link nav-link--danger" onClick={signOut} title="Salir">
        <span className="icon" aria-hidden="true">
          <LogOut size={18} />
        </span>
        <span className="nav-text">Salir</span>
      </button>
    </nav>
  );
}
