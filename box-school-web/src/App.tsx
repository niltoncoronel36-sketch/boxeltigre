import { BrowserRouter, Route, Routes, Navigate, Outlet } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import { ProtectedRoute } from "./routes/ProtectedRoute";
import { Layout } from "./components/Layout";

// AUTH & LOGIN
import LoginPage from "./pages/Login";

// PANEL ALUMNO
import StudentHome from "./pages/Students/StudentHome";
import StudentClasses from "./pages/Students/StudentClasses";
import StudentProgress from "./pages/Students/StudentProgress";
import StudentPayments from "./pages/Students/StudentPayments";
import StudentLayout from "./layouts/StudentLayout";

// PANEL ADMIN / CONTROL
import DashboardPage from "./pages/Dashboard";
import StudentsPage from "./pages/Students/StudentsPage";
import EnrollmentSheetPage from "./pages/Students/EnrollmentSheetPage";
import CategoriesPage from "./pages/CategoriesPage";
import PaymentsPage from "./pages/Payments";
import StorePage from "./pages/Store";
import StoreCategoriesPage from "./pages/StoreCategoriesPage";
import StoreOrdersPage from "./pages/StoreOrdersPage";
import EventsPage from "./pages/Events";
import AttendancePage from "./pages/AttendancePage";

// ✅ REPORTES
import ReportsPage from "./pages/Reports/ReportsPage";

// PÚBLICO
import PublicLayout from "./layouts/PublicLayout";
import PublicHome from "./pages/public/Home";
import PublicAbout from "./pages/public/About";
import PublicContact from "./pages/public/Contact";
import PublicStoreFront from "./pages/public/StoreFront";
import PublicProductPage from "./pages/public/ProductPage";

// ✅ NUEVO: SERVICIOS
import PublicServicios from "./pages/public/Servicios";

/** ✅ Guard genérico por roles */
function RoleGuard({ allowed }: { allowed: string[] }) {
  const { roles, loading } = useAuth();
  if (loading) return null;

  const keys = (roles ?? []).map((r: any) => r?.key);
  const ok = allowed.some((k) => keys.includes(k));

  if (!ok) return <Navigate to="/home" replace />;
  return <Outlet />;
}

/** ✅ Redirección inicial según rol */
function HomeRedirect() {
  const { user, loading, roles } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;

  const keys = (roles ?? []).map((r: any) => r?.key);

  if (keys.includes("admin")) return <Navigate to="/admin" replace />;
  if (keys.includes("attendance_controller")) return <Navigate to="/attendance" replace />;
  if (keys.includes("student")) return <Navigate to="/student" replace />;

  return <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* ======= WEB PÚBLICA ======= */}
          <Route path="/" element={<PublicLayout />}>
            <Route index element={<PublicHome />} />
            <Route path="nosotros" element={<PublicAbout />} />
            <Route path="servicios" element={<PublicServicios />} />
            <Route path="contacto" element={<PublicContact />} />
            <Route path="tienda" element={<PublicStoreFront />} />
            <Route path="tienda/:slug" element={<PublicProductPage />} />
          </Route>

          <Route path="/login" element={<LoginPage />} />

          {/* ======= RUTAS PRIVADAS ======= */}
          <Route element={<ProtectedRoute />}>
            <Route path="/home" element={<HomeRedirect />} />

            {/* 🎓 PANEL ALUMNO */}
            <Route element={<RoleGuard allowed={["student"]} />}>
              <Route path="/student" element={<StudentLayout />}>
                <Route index element={<StudentHome />} />
                <Route path="classes" element={<StudentClasses />} />
                <Route path="progress" element={<StudentProgress />} />
                <Route path="payments" element={<StudentPayments />} />
              </Route>
            </Route>

            {/* 🛡️ PANEL ADMIN / STAFF */}
            <Route element={<Layout />}>
              <Route element={<RoleGuard allowed={["admin"]} />}>
                <Route path="/admin" element={<DashboardPage />} />
                <Route path="/students" element={<StudentsPage />} />
                <Route path="/students/:id/enrollment-sheet" element={<EnrollmentSheetPage />} />
                <Route path="/categories" element={<CategoriesPage />} />
                <Route path="/payments" element={<PaymentsPage />} />
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/store" element={<StorePage />} />
                <Route path="/store-categories" element={<StoreCategoriesPage />} />
                <Route path="/store-orders" element={<StoreOrdersPage />} />
                <Route path="/events" element={<EventsPage />} />
              </Route>

              {/* ROL CONTROLADOR ASISTENCIA */}
              <Route element={<RoleGuard allowed={["admin", "attendance_controller"]} />}>
                <Route path="/attendance" element={<AttendancePage />} />
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<div style={{ padding: 16 }}>404 - No encontrado</div>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
