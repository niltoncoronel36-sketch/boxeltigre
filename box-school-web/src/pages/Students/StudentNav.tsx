import { NavLink } from "react-router-dom";
import { LogOut } from "lucide-react"; // Mantengo este para el botón de salir si te gusta
import { useAuth } from "../../auth/AuthContext";

export default function StudentNav() {
  const { signOut } = useAuth();

  return (
    <nav className="nav">
      {/* Inicio */}
      <NavLink 
        to="/student" 
        end 
        className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
      >
        <span className="icon">🏠</span>
        <span className="nav-text">Inicio</span>
      </NavLink>

      {/* Mis clases */}
      <NavLink 
        to="/student/classes" 
        className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
      >
        <span className="icon">📅</span>
        <span className="nav-text">Mis clases</span>
      </NavLink>

      {/* Mi progreso */}
      <NavLink 
        to="/student/progress" 
        className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
      >
        <span className="icon">📈</span>
        <span className="nav-text">Mi progreso</span>
      </NavLink>

      {/* Pagos */}
      <NavLink 
        to="/student/payments" 
        className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
      >
        <span className="icon">💳</span>
        <span className="nav-text">Pagos</span>
      </NavLink>

      {/* Logout */}
      <button
        type="button"
        className="nav-link logout-button"
        onClick={signOut}
        style={{ 
          marginTop: "auto", 
          border: 'none', 
          background: 'none', 
          cursor: 'pointer', 
          width: '100%', 
          textAlign: 'left',
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <span className="icon">
          <LogOut size={18} />
        </span>
        <span className="nav-text">Salir</span>
      </button>
    </nav>
  );
}