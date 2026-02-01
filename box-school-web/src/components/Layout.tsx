import React, { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import "./layout.css";

import {
  LayoutDashboard,
  Users,
  Tags,
  ShoppingCart,
  Package,
  Layers,
  ClipboardList,
  CalendarDays,
  ChevronDown,
  ExternalLink,
  LogOut,
  ClipboardCheck,
  BarChart3, // ✅ NUEVO
  Newspaper, // ✅ NUEVO
} from "lucide-react";

export function Layout() {
  const { user, roles, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const roleKeys = useMemo(() => (roles ?? []).map((r: any) => r?.key), [roles]);

  const isAdmin = useMemo(() => roleKeys.includes("admin"), [roleKeys]);

  const canAttendance = useMemo(() => {
    return roleKeys.includes("admin") || roleKeys.includes("attendance_controller");
  }, [roleKeys]);

  const isStoreRoute = useMemo(() => {
    const p = location.pathname;
    return p.startsWith("/store") || p.startsWith("/store-") || p.includes("/product") || p.includes("store");
  }, [location.pathname]);

  const [isStoreOpen, setIsStoreOpen] = useState(isStoreRoute);

  useEffect(() => {
    if (isStoreRoute) setIsStoreOpen(true);
  }, [isStoreRoute]);

  async function handleLogout() {
    await signOut();
    navigate("/login", { replace: true });
  }

  if (loading) return null;

  const linkClass = ({ isActive }: { isActive: boolean }) => (isActive ? "nav-link active" : "nav-link");

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Sidebar">
        <div className="brand">
          <div className="brand-icon" aria-hidden="true">
            <ShoppingCart size={20} />
          </div>

          <div className="brand-info">
            <div className="brand-title">{import.meta.env.VITE_APP_NAME ?? "Box School"}</div>
            <div className="brand-sub">{isAdmin ? "Admin Panel" : canAttendance ? "Control de Asistencia" : "Panel"}</div>
          </div>
        </div>

        <div className="accent-line" />

        <nav className="nav">
          {/* ✅ SOLO ADMIN */}
          {isAdmin && (
            <NavLink title="Dashboard" to="/admin" end className={linkClass}>
              <span className="icon" aria-hidden="true">
                <LayoutDashboard size={20} />
              </span>
              <span className="nav-text">Dashboard</span>
            </NavLink>
          )}

          {isAdmin && (
            <NavLink title="Estudiantes" to="/students" className={linkClass}>
              <span className="icon" aria-hidden="true">
                <Users size={20} />
              </span>
              <span className="nav-text">Estudiantes</span>
            </NavLink>
          )}

          {isAdmin && (
            <NavLink title="Categorías" to="/categories" className={linkClass}>
              <span className="icon" aria-hidden="true">
                <Tags size={20} />
              </span>
              <span className="nav-text">Categorías</span>
            </NavLink>
          )}

          {/* ✅ NUEVO: REPORTES (solo admin) */}
          {isAdmin && (
            <NavLink title="Reportes" to="/reports" className={linkClass}>
              <span className="icon" aria-hidden="true">
                <BarChart3 size={20} />
              </span>
              <span className="nav-text">Reportes</span>
            </NavLink>
          )}

          {/* ✅ NUEVO: BLOG (solo admin) */}
          {isAdmin && (
            <NavLink title="Blog" to="/blog" className={linkClass}>
              <span className="icon" aria-hidden="true">
                <Newspaper size={20} />
              </span>
              <span className="nav-text">Blog</span>
            </NavLink>
          )}

          {/* ✅ ASISTENCIA (admin o controlador) */}
          {canAttendance && (
            <NavLink title="Asistencia" to="/attendance" className={linkClass}>
              <span className="icon" aria-hidden="true">
                <ClipboardCheck size={20} />
              </span>
              <span className="nav-text">Asistencia</span>
            </NavLink>
          )}

          {/* ✅ TIENDA SOLO ADMIN */}
          {isAdmin && (
            <div className={`nav-group ${isStoreOpen ? "is-open" : ""}`}>
              <button
                type="button"
                className={`nav-link nav-dropdown-btn ${isStoreRoute ? "active" : ""}`}
                onClick={() => setIsStoreOpen((v) => !v)}
                aria-expanded={isStoreOpen}
                title="Tienda"
              >
                <span className="icon" aria-hidden="true">
                  <ShoppingCart size={20} />
                </span>
                <span className="nav-text">Tienda</span>
                <span className={`arrow ${isStoreOpen ? "up" : ""}`} aria-hidden="true">
                  <ChevronDown size={18} />
                </span>
              </button>

              <div className={`sub-nav ${isStoreOpen ? "show" : ""}`}>
                <NavLink to="/store" className={linkClass} title="Productos">
                  <span className="icon" aria-hidden="true">
                    <Package size={18} />
                  </span>
                  <span className="nav-text">Productos</span>
                </NavLink>

                <NavLink to="/store-categories" className={linkClass} title="Categorías de tienda">
                  <span className="icon" aria-hidden="true">
                    <Layers size={18} />
                  </span>
                  <span className="nav-text">Categorías</span>
                </NavLink>

                <NavLink to="/store-orders" className={linkClass} title="Pedidos">
                  <span className="icon" aria-hidden="true">
                    <ClipboardList size={18} />
                  </span>
                  <span className="nav-text">Pedidos</span>
                </NavLink>
              </div>
            </div>
          )}

          {/* ✅ EVENTOS SOLO ADMIN */}
          {isAdmin && (
            <NavLink title="Eventos" to="/events" className={linkClass}>
              <span className="icon" aria-hidden="true">
                <CalendarDays size={20} />
              </span>
              <span className="nav-text">Eventos</span>
            </NavLink>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="user-box">
            <div className="user-avatar" title={user?.name || "Usuario"}>
              {(user?.name || "U").charAt(0).toUpperCase()}
            </div>

            <div className="brand-info">
              <div className="user-name">{user?.name}</div>
              <div className="user-email">{user?.email}</div>
            </div>
          </div>

          <button className="btn btn-primary btn-logout" onClick={handleLogout} title="Cerrar Sesión">
            <span className="icon" aria-hidden="true">
              <LogOut size={18} />
            </span>
            <span className="nav-text">Salir</span>
          </button>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="topbar-title">{isAdmin ? "Administración" : canAttendance ? "Control de Asistencia" : "Panel"}</div>

          <div className="topbar-actions">
            {isAdmin && (
              <a href="/" target="_blank" rel="noreferrer" className="btn btn-web" title="Ver Web">
                <ExternalLink size={18} />
                <span className="btn-web-text">Ver Web</span>
              </a>
            )}

            <div className="role-badge">{roleKeys?.[0] || "USER"}</div>
          </div>
        </header>

        <div className="content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
