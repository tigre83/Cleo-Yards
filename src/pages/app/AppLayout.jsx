import { useState } from "react";
import { useData } from "../../context/DataContext";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Logo from "../../components/Logo";
import Icons from "../../components/Icons";
import { getTheme } from "../../components/ThemeContext";
import { appT } from "../../data/appTranslations";

export default function AppLayout() {
  const { companyProfile } = useData();
  const [dark, setDark] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [lang, setLang] = useState("en");
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const v = getTheme(dark);
  const t = appT[lang];

  const menu = [
    { id: "/app", icon: "dashboard", label: t.sidebar.dashboard },
    { id: "/app/scheduling", icon: "schedule", label: t.sidebar.scheduling },
    { id: "/app/invoicing", icon: "invoice", label: t.sidebar.invoicing },
    { id: "/app/crews", icon: "crew", label: t.sidebar.crews },
    { id: "/app/routes", icon: "route", label: t.sidebar.routes },
    { id: "/app/clients", icon: "client", label: t.sidebar.clients },
    { id: "/app/services", icon: "services", label: t.sidebar.services },
  ];

  const w = collapsed ? 68 : 250;

  return (
    <div data-app-portal="" style={{ display: "flex", minHeight: "100vh", background: v.bg, fontFamily: "'DM Sans', sans-serif", color: v.text, transition: "background 0.3s" }}>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700&display=swap" rel="stylesheet" />
      <style>{`@keyframes slideLine{0%{transform:translateX(0)}50%{transform:translateX(150%)}100%{transform:translateX(0)}}.animated-line{animation:slideLine 3s ease-in-out infinite}::-webkit-scrollbar{width:6px}::-webkit-scrollbar-thumb{background:${v.border};border-radius:3px}`}</style>

      {/* Sidebar */}
      <aside style={{ width: w, background: v.surface, borderRight: "1px solid " + v.border, padding: "10px 10px 8px", display: "flex", flexDirection: "column", transition: "width 0.3s", overflow: "hidden", flexShrink: 0, position: "sticky", top: 0, height: "100vh" }}>
        <div style={{ marginBottom: 8, paddingLeft: 4, minHeight: 36, display: "flex", alignItems: "center" }}>
          {collapsed
            ? <svg width="36" height="36" viewBox="0 0 512 512" style={{ cursor: "pointer" }} onClick={() => setCollapsed(false)}>
                <defs><linearGradient id="sb" x1="0" y1="1" x2="1" y2="0"><stop offset="0%" stopColor="#16A34A"/><stop offset="100%" stopColor="#4ADE80"/></linearGradient></defs>
                <rect width="512" height="512" rx="128" fill="url(#sb)"/>
                <path d="M256 420Q256 260 256 92Q288 132 296 196Q296 320 256 420Z" fill="#fff" opacity=".9"/>
                <path d="M256 420Q256 260 256 92Q224 132 216 196Q216 320 256 420Z" fill="#fff" opacity=".75"/>
                <path d="M244 420Q168 280 120 160Q152 168 184 220Q224 296 244 420Z" fill="#fff" opacity=".65"/>
                <path d="M268 420Q344 280 392 160Q360 168 328 220Q288 296 268 420Z" fill="#fff" opacity=".55"/>
              </svg>
            : <div onClick={() => setCollapsed(true)} style={{ cursor: "pointer" }}><Logo dark={dark} /></div>
          }
        </div>

        {/* Language toggle */}
        {!collapsed && (
          <div style={{ display: "flex", borderRadius: 8, overflow: "hidden", border: "1px solid " + v.border, marginBottom: 6, marginLeft: 2, marginRight: 2 }}>
            <button onClick={() => setLang("en")} style={{ flex: 1, padding: "4px 0", fontSize: 11, fontWeight: 600, border: "none", cursor: "pointer", background: lang === "en" ? "#16A34A" : "transparent", color: lang === "en" ? "#fff" : v.textSec, transition: "all 0.2s" }}>EN</button>
            <button onClick={() => setLang("es")} style={{ flex: 1, padding: "4px 0", fontSize: 11, fontWeight: 600, border: "none", cursor: "pointer", background: lang === "es" ? "#16A34A" : "transparent", color: lang === "es" ? "#fff" : v.textSec, transition: "all 0.2s" }}>ES</button>
          </div>
        )}

        <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 0, overflowY: "auto", minHeight: 0 }}>
          {menu.map((m) => {
            const active = location.pathname === m.id;
            return (
              <button key={m.id} onClick={() => navigate(m.id)} style={{ display: "flex", alignItems: "center", gap: 12, padding: collapsed ? "7px 12px" : "7px 14px", borderRadius: 8, border: "none", cursor: "pointer", background: active ? (dark ? "rgba(22,163,74,0.12)" : "#DCFCE7") : "transparent", color: active ? "#16A34A" : v.textSec, fontWeight: active ? 600 : 500, fontSize: 13, fontFamily: "'DM Sans', sans-serif", transition: "all 0.2s", justifyContent: collapsed ? "center" : "flex-start", textAlign: "left" }}>
                {Icons[m.icon](active ? "#16A34A" : v.textTer)}
                {!collapsed && <span>{m.label}</span>}
              </button>
            );
          })}
        </nav>



        <div style={{ borderTop: "1px solid " + v.border, paddingTop: 6, flexShrink: 0 }}>
          {!collapsed && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, padding: "0 4px" }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: dark ? "rgba(22,163,74,0.15)" : "#DCFCE7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#16A34A", flexShrink: 0 }}>{user?.name?.[0]}</div>
              <div style={{ overflow: "hidden", flex: 1 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: v.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user?.name}</p>
                <p style={{ fontSize: 10, color: v.textTer, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{companyProfile?.name || user?.company}</p>
              </div>
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "space-around", gap: 2 }}>
            <button onClick={() => navigate("/app/settings")} title={t.sidebar.settings} style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 5, borderRadius: 6, border: "none", cursor: "pointer", background: location.pathname === "/app/settings" ? (dark ? "rgba(22,163,74,0.12)" : "#DCFCE7") : "transparent" }}>
              {Icons.settings(location.pathname === "/app/settings" ? "#16A34A" : v.textTer)}
            </button>
            <button onClick={() => setDark(!dark)} title={dark ? t.sidebar.lightMode : t.sidebar.darkMode} style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 5, borderRadius: 6, border: "none", cursor: "pointer", background: "transparent" }}>
              {dark ? Icons.sun(v.textTer) : Icons.moon(v.textTer)}
            </button>
            <button onClick={() => { logout(); navigate("/"); }} title={t.sidebar.logout} style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 5, borderRadius: 6, border: "none", cursor: "pointer", background: "transparent" }}>
              {Icons.logout("#EF4444")}
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, padding: 32, overflowY: "auto", maxHeight: "100vh" }}>
        {companyProfile && !companyProfile.profileComplete && (
          <div onClick={() => navigate("settings")} style={{ padding:"12px 16px", marginBottom:20, borderRadius:10,
            background: dark ? "rgba(217,119,6,0.1)" : "#FFFBEB", border:"1px solid #F59E0B40",
            display:"flex", alignItems:"center", gap:10, cursor:"pointer", transition:"background 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.background = dark ? "rgba(217,119,6,0.15)" : "#FEF3C7"}
            onMouseLeave={e => e.currentTarget.style.background = dark ? "rgba(217,119,6,0.1)" : "#FFFBEB"}>
            <span style={{ fontSize:18 }}>⚠️</span>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, fontWeight:700, color: dark ? "#FBBF24" : "#92400E" }}>
                {lang === "es" ? "Completa tu perfil de empresa" : "Complete your company profile"}
              </div>
              <div style={{ fontSize:12, color: dark ? "#FCD34D" : "#A16207" }}>
                {lang === "es" ? "Nombre, email, teléfono, dirección y Tax ID son obligatorios para facturar." : "Name, email, phone, address and Tax ID are required for invoicing."}
              </div>
            </div>
            <span style={{ fontSize:12, fontWeight:600, color: dark ? "#FBBF24" : "#92400E" }}>
              {lang === "es" ? "Ir a Configuración →" : "Go to Settings →"}
            </span>
          </div>
        )}
        <Outlet context={{ dark, v, t, lang, setLang }} />
      </main>
    </div>
  );
}
