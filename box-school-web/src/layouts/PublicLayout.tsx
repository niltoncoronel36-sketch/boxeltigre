import { useEffect, useMemo, useState } from "react";
import { Outlet, Link, NavLink, useNavigate } from "react-router-dom";
import "./public.css";
import { useAuth } from "../auth/AuthContext";

// ✅ carrito público (usa KEY="public_cart_v1" internamente)
import { loadCart, cartCount } from "../pages/public/store/cart";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `pub-nav__link ${isActive ? "is-active" : ""}`;

export default function PublicLayout() {
  const [open, setOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const navigate = useNavigate();
  const { user, loading, isAdmin, isStudent, signOut } = useAuth();

  // ✅ contador carrito (header)
  const [cartN, setCartN] = useState(0);

  const refreshCart = () => {
    try {
      const c = loadCart();
      setCartN(cartCount(c));
    } catch {
      setCartN(0);
    }
  };

  useEffect(() => {
    refreshCart();

    // si cambias el localStorage (otra pestaña)
    const onStorage = () => refreshCart();
    window.addEventListener("storage", onStorage);

    // cuando vuelves a la pestaña (útil al agregar desde detalle)
    const onFocus = () => refreshCart();
    window.addEventListener("focus", onFocus);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  const displayName = useMemo(() => {
    if (!user) return "";
    return (
      (user as any)?.name ||
      (user as any)?.nombre ||
      (user as any)?.full_name ||
      (user as any)?.email ||
      "Usuario"
    );
  }, [user]);

  const panelPath = useMemo(() => {
    if (isAdmin) return "/admin";
    if (isStudent) return "/student";
    return "/home";
  }, [isAdmin, isStudent]);

  // ✅ SOLO web pública
  useEffect(() => {
    document.body.classList.add("is-public");
    return () => document.body.classList.remove("is-public");
  }, []);

  // ✅ cerrar menú usuario al hacer click fuera
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (!t.closest?.(".pub-user")) setUserMenuOpen(false);
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  const handleLogout = async () => {
    try {
      await signOut();
    } finally {
      setUserMenuOpen(false);
      setOpen(false);
      navigate("/", { replace: true });
    }
  };

  const goCart = () => {
    setOpen(false);
    setUserMenuOpen(false);

    // ✅ abre el drawer en StoreFront (por ?cart=1)
    navigate("/tienda?cart=1");
  };

  return (
    <div className="public-scope">
      <div className="pub-site">
        <header className="pub-header">
          <div className="pub-container pub-header__inner">
            <Link to="/" className="pub-brand" onClick={() => setOpen(false)}>
              <span className="pub-brand__mark" aria-hidden="true" />
              <span className="pub-brand__text">
                <span className="pub-brand__title">ACADEMIA BOX</span>
                <span className="pub-brand__subtitle">Entrena con disciplina</span>
              </span>
            </Link>

            {/* Desktop nav */}
            <nav className="pub-nav pub-nav--desktop" aria-label="Navegación principal">
              <NavLink to="/" end className={navLinkClass}>
                Inicio
              </NavLink>
              <NavLink to="/nosotros" className={navLinkClass}>
                Nosotros
              </NavLink>

              {/* ✅ NUEVO: Servicios */}
              <NavLink to="/servicios" className={navLinkClass}>
                Servicios
              </NavLink>

              <NavLink to="/tienda" className={navLinkClass}>
                Tienda
              </NavLink>
              <NavLink to="/contacto" className={navLinkClass}>
                Contacto
              </NavLink>

              <div className="pub-nav__sep" aria-hidden="true" />

              {/* ✅ carrito siempre visible */}
              <button type="button" className="pub-btn pub-btn--outline" onClick={goCart}>
                Ver carrito ({cartN})
              </button>

              {!loading && !user && (
                <>
                  <NavLink to="/login" className="pub-btn pub-btn--outline">
                    Login
                  </NavLink>
                  <a href="/#unete" className="pub-btn pub-btn--accent">
                    Únete
                  </a>
                </>
              )}

              {!loading && user && (
                <>
                  <Link to={panelPath} className="pub-btn pub-btn--accent">
                    Ir al panel
                  </Link>

                  <div className="pub-user">
                    <button
                      type="button"
                      className="pub-user__btn"
                      onClick={() => setUserMenuOpen((v) => !v)}
                      aria-expanded={userMenuOpen}
                    >
                      <span className="pub-user__avatar" aria-hidden="true">
                        {String(displayName).trim().charAt(0).toUpperCase()}
                      </span>
                      <span className="pub-user__name">
                        Hola, <b>{displayName}</b>
                      </span>
                      <span className={`pub-user__chev ${userMenuOpen ? "is-open" : ""}`} aria-hidden="true">
                        ▾
                      </span>
                    </button>

                    {userMenuOpen && (
                      <div className="pub-user__menu">
                        <Link to={panelPath} className="pub-user__item" onClick={() => setUserMenuOpen(false)}>
                          Panel
                        </Link>

                        <button type="button" className="pub-user__item pub-user__danger" onClick={handleLogout}>
                          Cerrar sesión
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </nav>

            {/* Mobile header */}
            <div className="pub-header__mobile">
              {/* ✅ carrito en mobile */}
              <button className="pub-btn pub-btn--outline pub-btn--sm" type="button" onClick={goCart}>
                Carrito ({cartN})
              </button>

              {!loading && !user && (
                <NavLink to="/login" className="pub-btn pub-btn--outline pub-btn--sm">
                  Login
                </NavLink>
              )}

              {!loading && user && (
                <Link to={panelPath} className="pub-btn pub-btn--accent pub-btn--sm">
                  Panel
                </Link>
              )}

              <button className="pub-burger" type="button" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
                <span className={`pub-burger__lines ${open ? "is-open" : ""}`} />
              </button>
            </div>
          </div>

          {/* Mobile dropdown */}
          <div className={`pub-mobile ${open ? "is-open" : ""}`}>
            <div className="pub-container pub-mobile__inner">
              <NavLink to="/" end className={navLinkClass} onClick={() => setOpen(false)}>
                Inicio
              </NavLink>
              <NavLink to="/nosotros" className={navLinkClass} onClick={() => setOpen(false)}>
                Nosotros
              </NavLink>

              {/* ✅ NUEVO: Servicios */}
              <NavLink to="/servicios" className={navLinkClass} onClick={() => setOpen(false)}>
                Servicios
              </NavLink>

              <NavLink to="/tienda" className={navLinkClass} onClick={() => setOpen(false)}>
                Tienda
              </NavLink>
              <NavLink to="/contacto" className={navLinkClass} onClick={() => setOpen(false)}>
                Contacto
              </NavLink>

              {/* ✅ carrito dentro del menú mobile */}
              <button className="pub-btn pub-btn--outline" type="button" onClick={goCart}>
                Ver carrito ({cartN})
              </button>

              <div className="pub-mobile__cta">
                {!loading && !user && (
                  <a href="/#unete" className="pub-btn pub-btn--accent" onClick={() => setOpen(false)}>
                    Únete
                  </a>
                )}

                {!loading && user && (
                  <>
                    <Link to={panelPath} className="pub-btn pub-btn--accent" onClick={() => setOpen(false)}>
                      Ir al panel
                    </Link>
                    <button className="pub-btn pub-btn--outline" type="button" onClick={handleLogout}>
                      Cerrar sesión
                    </button>
                    <div className="pub-mobile__hello">
                      Sesión iniciada como: <b>{displayName}</b>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="pub-main">
          <Outlet />
        </main>

        <footer className="pub-footer">
          <div className="pub-container pub-footer__inner">
            <div>
              <div className="pub-footer__brand">ACADEMIA BOX</div>
              <div className="pub-footer__muted">Disciplina • Técnica • Progreso</div>
            </div>
            <div className="pub-footer__muted">© {new Date().getFullYear()}</div>
          </div>
        </footer>
      </div>
    </div>
  );
}
