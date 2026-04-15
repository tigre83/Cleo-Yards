import { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Logo from "../../components/Logo";
import Icons from "../../components/Icons";
import { getTheme } from "../../components/ThemeContext";

export default function ClientLayout() {
  const [dark, setDark] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const v = getTheme(dark);

  return (
    <div style={{ minHeight: "100vh", background: v.bg, fontFamily: "'DM Sans', sans-serif", color: v.text, transition: "background 0.3s" }}>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700&display=swap" rel="stylesheet" />
      <style>{`@keyframes slideLine{0%{transform:translateX(0)}50%{transform:translateX(150%)}100%{transform:translateX(0)}}.animated-line{animation:slideLine 3s ease-in-out infinite}`}</style>

      {/* Top nav */}
      <nav style={{ background: v.surface, borderBottom: "1px solid " + v.border, padding: "12px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Logo dark={dark} />
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button onClick={() => setDark(!dark)} style={{ background: "none", border: "1px solid " + v.border, borderRadius: 8, padding: 6, cursor: "pointer", display: "flex" }}>
            {dark ? Icons.sun("#F1F5F9") : Icons.moon("#0F172A")}
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: dark ? "rgba(22,163,74,0.15)" : "#DCFCE7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#16A34A" }}>{user?.name?.[0]}</div>
            <span style={{ fontSize: 13, fontWeight: 600, color: v.text }}>{user?.name}</span>
          </div>
          <button onClick={() => { logout(); navigate("/"); }} style={{ background: "none", border: "none", cursor: "pointer", display: "flex" }}>
            {Icons.logout("#EF4444")}
          </button>
        </div>
      </nav>

      <main style={{ maxWidth: 960, margin: "0 auto", padding: 32 }}>
        <Outlet context={{ dark, v }} />
      </main>
    </div>
  );
}
