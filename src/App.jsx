import { BrowserRouter, Routes, Route, Navigate, useOutletContext } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { DataProvider } from "./context/DataContext";
import Landing from "./pages/Landing";
import AppLayout from "./pages/app/AppLayout";
import Dashboard from "./pages/app/Dashboard";
import Invoicing from "./pages/app/Invoicing";
import Clients from "./pages/app/Clients";
import Services from "./pages/app/Services";
import Scheduling from "./pages/app/Scheduling";
import Crews from "./pages/app/Crews";
import RoutesPage from "./pages/app/Routes";
import Settings from "./pages/app/Settings";
import ClientLayout from "./pages/client/ClientLayout";
import ClientHome from "./pages/client/ClientHome";

function ProtectedRoute({ children, role }) {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/" />;
  if (role && user?.role !== role) return <Navigate to="/" />;
  return children;
}

function Wrap({ Component }) {
  const { dark, v, t, lang, setLang } = useOutletContext();
  return <Component dark={dark} v={v} t={t} lang={lang} setLang={setLang} />;
}

function ClientWrap({ Component }) {
  const { dark, v } = useOutletContext();
  return <Component dark={dark} v={v} />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/app" element={<ProtectedRoute role="business"><DataProvider><AppLayout /></DataProvider></ProtectedRoute>}>
              <Route index element={<Wrap Component={Dashboard} />} />
              <Route path="scheduling" element={<Wrap Component={Scheduling} />} />
              <Route path="invoicing" element={<Wrap Component={Invoicing} />} />
              <Route path="crews" element={<Wrap Component={Crews} />} />
              <Route path="routes" element={<Wrap Component={RoutesPage} />} />
              <Route path="clients" element={<Wrap Component={Clients} />} />
              <Route path="services" element={<Wrap Component={Services} />} />
              <Route path="settings" element={<Wrap Component={Settings} />} />
            </Route>
            <Route path="/client" element={<ProtectedRoute role="client"><ClientLayout /></ProtectedRoute>}>
              <Route index element={<ClientWrap Component={ClientHome} />} />
            </Route>
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
