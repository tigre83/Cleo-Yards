import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// ─── TRANSLATIONS ───
const T = {
  en: {
    nav: { features: "Features", pricing: "Pricing", integrations: "Integrations", login: "Log In", cta: "Start Free Trial" },
    login: {
      title: "Welcome back",
      tabClient: "Client Portal",
      tabBusiness: "Business Portal",
      email: "Email address",
      password: "Password",
      forgot: "Forgot password?",
      btn: "Sign In",
      noAccount: "Don't have an account?",
      signUp: "Start free trial",
      clientDesc: "View estimates, pay invoices, request services",
      businessDesc: "Manage crews, scheduling, invoicing & more",
    },
    hero: {
      badge: "Built for US Landscaping Businesses",
      h1_1: "Run Your",
      h1_accent: "Landscaping Business",
      h1_2: "Like a Pro",
      sub: "Schedule crews, send invoices, collect payments, and grow your business — all in one bilingual platform built for how landscapers actually work.",
      cta1: "Start 14-Day Free Trial",
      cta2: "Watch Demo",
      trust: "No credit card required · Setup in 5 minutes · Cancel anytime",
      stat1v: "2,400+", stat1l: "Jobs Scheduled Monthly",
      stat2v: "98%", stat2l: "Payment Collection Rate",
      stat3v: "3.5hrs", stat3l: "Saved Per Day, Per Crew",
    },
    features: {
      title: "Everything You Need to",
      titleAccent: "Grow Your Yard Business",
      sub: "From the first estimate to the last payment — Cleo Yards handles the entire job lifecycle so you can focus on making yards beautiful.",
      items: [
        { id: "schedule", title: "Smart Scheduling", desc: "Drag-and-drop crew scheduling with route optimization. Assign jobs based on crew skills, location, and availability. Your crews see updates in real-time on their phones." },
        { id: "invoice", title: "US Invoicing & Payments", desc: "Professional estimates and invoices in USD. Auto-calculate state sales tax. Accept credit cards, ACH, Zelle, and Venmo. Net 15/30/60 terms with auto-reminders." },
        { id: "crew", title: "Crew Management", desc: "Track hours, assign crews to jobs, manage equipment. Built-in time tracking with GPS clock-in/out. Spanish-first mobile app your crews will actually use." },
        { id: "route", title: "Route Optimization", desc: "Minimize drive time between jobs. Smart routing saves fuel and fits more jobs per day. Real-time GPS tracking so you always know where your crews are." },
        { id: "client", title: "Client Portal", desc: "Clients approve estimates, pay invoices, and request services online. Property photos, job history, and notes — everything in one place." },
        { id: "dashboard", title: "Business Dashboard", desc: "Revenue, jobs completed, crew performance, outstanding payments — all at a glance. Know exactly where your business stands, every single day." },
      ]
    },
    pricing: {
      title: "Simple, Honest",
      titleAccent: "Pricing",
      sub: "No hidden fees. No long-term contracts. Switch plans or cancel anytime.",
      monthly: "Monthly",
      annually: "Annual",
      plans: [
        { name: "Starter", price: "49", period: "/mo", desc: "Perfect for solo operators and small crews", features: ["Up to 3 users", "Scheduling & dispatch", "Invoicing in USD", "Client management", "Mobile app (EN/ES)", "Email support"], cta: "Start Free Trial", popular: false },
        { name: "Business", price: "99", period: "/mo", desc: "For growing landscaping companies", features: ["Up to 15 users", "Everything in Starter", "Route optimization", "QuickBooks integration", "Client portal", "Priority support"], cta: "Start Free Trial", popular: true },
        { name: "Enterprise", price: "199", period: "/mo", desc: "For large operations & franchises", features: ["Unlimited users", "Everything in Business", "API access", "Custom reports", "Dedicated account manager", "Multi-location support"], cta: "Contact Sales", popular: false },
      ],
      annual: "Save 20% with annual billing",
      popularBadge: "Most Popular"
    },
    integrations: {
      title: "Connects With Tools",
      titleAccent: "You Already Use",
      sub: "Seamless integrations with the platforms that power your business.",
      items: ["QuickBooks Online", "Stripe", "Square", "Xero", "Google Calendar", "Zapier"]
    },
    bilingualSection: {
      title: "Truly",
      titleAccent: "Bilingual",
      sub: "Not just translated — built bilingual from day one.",
      p1title: "Office in English",
      p1desc: "Owners and managers run estimates, invoices, and reports in English — the language of your clients and your books.",
      p2title: "Crews in Spanish",
      p2desc: "Your field crews use the mobile app in Spanish. Schedules, job details, time tracking — todo en español, sin confusión.",
      p3title: "Clients Choose",
      p3desc: "Automated emails, estimates, and invoices sent in the client's preferred language. Professional in every interaction."
    },
    finalCta: {
      title: "Ready to Run Your Business",
      titleAccent: "Smarter?",
      sub: "Join hundreds of landscaping companies already using Cleo Yards to schedule faster, invoice smarter, and get paid on time.",
      cta: "Start Your Free 14-Day Trial",
      trust: "No credit card · No contracts · Full access"
    },
    footer: {
      tagline: "The bilingual platform for US landscaping businesses.",
      col1: "Product", col1items: ["Features", "Pricing", "Integrations", "Mobile App", "API"],
      col2: "Company", col2items: ["About", "Blog", "Careers", "Contact", "Partners"],
      col3: "Support", col3items: ["Help Center", "Documentation", "Status", "Security", "Privacy Policy"],
      copy: "© 2026 Cleo Yards. All rights reserved.",
      madeWith: "Made with 🌿 for landscapers who hustle."
    }
  },
  es: {
    nav: { features: "Funciones", pricing: "Precios", integrations: "Integraciones", login: "Iniciar Sesión", cta: "Prueba Gratis" },
    login: {
      title: "Bienvenido de vuelta",
      tabClient: "Portal Cliente",
      tabBusiness: "Portal Negocio",
      email: "Correo electrónico",
      password: "Contraseña",
      forgot: "¿Olvidaste tu contraseña?",
      btn: "Iniciar Sesión",
      noAccount: "¿No tienes cuenta?",
      signUp: "Empieza tu prueba gratis",
      clientDesc: "Ver estimados, pagar facturas, solicitar servicios",
      businessDesc: "Gestiona cuadrillas, programación, facturación y más",
    },
    hero: {
      badge: "Hecho para Negocios de Jardinería en USA",
      h1_1: "Maneja Tu Negocio de",
      h1_accent: "Landscaping",
      h1_2: "Como un Pro",
      sub: "Programa cuadrillas, envía facturas, cobra pagos y haz crecer tu negocio — todo en una plataforma bilingüe hecha para cómo realmente trabajan los landscapers.",
      cta1: "Prueba Gratis por 14 Días",
      cta2: "Ver Demo",
      trust: "Sin tarjeta de crédito · Listo en 5 minutos · Cancela cuando quieras",
      stat1v: "2,400+", stat1l: "Trabajos Programados al Mes",
      stat2v: "98%", stat2l: "Tasa de Cobro de Pagos",
      stat3v: "3.5hrs", stat3l: "Ahorradas al Día por Cuadrilla",
    },
    features: {
      title: "Todo lo que Necesitas para",
      titleAccent: "Crecer tu Negocio",
      sub: "Desde el primer estimado hasta el último pago — Cleo Yards maneja todo el ciclo del trabajo para que tú te enfoques en hacer los yards hermosos.",
      items: [
        { id: "schedule", title: "Programación Inteligente", desc: "Programación de cuadrillas con drag-and-drop y optimización de rutas. Asigna trabajos por habilidad, ubicación y disponibilidad. Tus cuadrillas ven cambios en tiempo real." },
        { id: "invoice", title: "Facturación y Cobros USA", desc: "Estimados y facturas profesionales en USD. Cálculo automático de sales tax por estado. Acepta tarjetas, ACH, Zelle y Venmo. Términos Net 15/30/60 con recordatorios." },
        { id: "crew", title: "Gestión de Cuadrillas", desc: "Controla horas, asigna cuadrillas a trabajos, maneja equipo. Time tracking con GPS clock-in/out. App móvil en español que tus cuadrillas van a usar de verdad." },
        { id: "route", title: "Optimización de Rutas", desc: "Minimiza tiempo de manejo entre trabajos. Rutas inteligentes ahorran gasolina y meten más trabajos por día. GPS en tiempo real para saber dónde están tus cuadrillas." },
        { id: "client", title: "Portal de Clientes", desc: "Los clientes aprueban estimados, pagan facturas y piden servicios online. Fotos de la propiedad, historial y notas — todo en un solo lugar." },
        { id: "dashboard", title: "Dashboard del Negocio", desc: "Revenue, trabajos completados, rendimiento de cuadrillas, pagos pendientes — todo de un vistazo. Sabe exactamente cómo va tu negocio, cada día." },
      ]
    },
    pricing: {
      title: "Precios",
      titleAccent: "Simples y Honestos",
      sub: "Sin cargos ocultos. Sin contratos largos. Cambia de plan o cancela cuando quieras.",
      monthly: "Mensual",
      annually: "Anual",
      plans: [
        { name: "Starter", price: "49", period: "/mes", desc: "Perfecto para operadores solos y cuadrillas pequeñas", features: ["Hasta 3 usuarios", "Programación y despacho", "Facturación en USD", "Gestión de clientes", "App móvil (EN/ES)", "Soporte por email"], cta: "Prueba Gratis", popular: false },
        { name: "Business", price: "99", period: "/mes", desc: "Para compañías de landscaping en crecimiento", features: ["Hasta 15 usuarios", "Todo en Starter", "Optimización de rutas", "Integración QuickBooks", "Portal de clientes", "Soporte prioritario"], cta: "Prueba Gratis", popular: true },
        { name: "Enterprise", price: "199", period: "/mes", desc: "Para operaciones grandes y franquicias", features: ["Usuarios ilimitados", "Todo en Business", "Acceso API", "Reportes personalizados", "Account manager dedicado", "Soporte multi-ubicación"], cta: "Contactar Ventas", popular: false },
      ],
      annual: "Ahorra 20% con facturación anual",
      popularBadge: "Más Popular"
    },
    integrations: {
      title: "Se Conecta con las Herramientas",
      titleAccent: "que Ya Usas",
      sub: "Integraciones directas con las plataformas que mueven tu negocio.",
      items: ["QuickBooks Online", "Stripe", "Square", "Xero", "Google Calendar", "Zapier"]
    },
    bilingualSection: {
      title: "Verdaderamente",
      titleAccent: "Bilingüe",
      sub: "No solo traducido — construido bilingüe desde el día uno.",
      p1title: "Oficina en Inglés",
      p1desc: "Dueños y managers manejan estimados, facturas y reportes en inglés — el idioma de tus clientes y tu contabilidad.",
      p2title: "Cuadrillas en Español",
      p2desc: "Tus cuadrillas en campo usan la app en español. Horarios, detalles del trabajo, time tracking — todo en español, sin confusión.",
      p3title: "Clientes Eligen",
      p3desc: "Emails, estimados y facturas automáticas en el idioma preferido del cliente. Profesional en cada interacción."
    },
    finalCta: {
      title: "¿Listo para Manejar tu Negocio",
      titleAccent: "Más Inteligente?",
      sub: "Únete a cientos de compañías de landscaping que ya usan Cleo Yards para programar más rápido, facturar mejor y cobrar a tiempo.",
      cta: "Empieza tu Prueba Gratis de 14 Días",
      trust: "Sin tarjeta · Sin contratos · Acceso completo"
    },
    footer: {
      tagline: "La plataforma bilingüe para negocios de landscaping en USA.",
      col1: "Producto", col1items: ["Funciones", "Precios", "Integraciones", "App Móvil", "API"],
      col2: "Empresa", col2items: ["Nosotros", "Blog", "Empleos", "Contacto", "Partners"],
      col3: "Soporte", col3items: ["Centro de Ayuda", "Documentación", "Estado", "Seguridad", "Privacidad"],
      copy: "© 2026 Cleo Yards. Todos los derechos reservados.",
      madeWith: "Hecho con 🌿 para landscapers que la luchan."
    }
  }
};

// ─── SVG ICONS ───
const Icons = {
  schedule: (c) => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="3"/><path d="M16 2v4M8 2v4M3 10h18"/><circle cx="12" cy="16" r="2"/>
    </svg>
  ),
  invoice: (c) => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
    </svg>
  ),
  crew: (c) => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
    </svg>
  ),
  route: (c) => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 000-7h-11a3.5 3.5 0 010-7H15"/><circle cx="18" cy="5" r="3"/>
    </svg>
  ),
  client: (c) => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  dashboard: (c) => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="4" rx="1"/><rect x="14" y="10" width="7" height="11" rx="1"/><rect x="3" y="13" width="7" height="8" rx="1"/>
    </svg>
  ),
  sun: (c) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
    </svg>
  ),
  moon: (c) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round">
      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
    </svg>
  ),
};


// ─── LOGIN MODAL ───
const LoginModal = ({ open, onClose, tab, setTab, t, dark, v, onLogin, error }) => {
  const [loginEmail, setLoginEmail] = useState("");
  if (!open) return null;
  const isBiz = tab === "business";
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 420, background: v.cardBg, borderRadius: 20, border: "1px solid " + v.border, boxShadow: "0 24px 64px rgba(0,0,0,0.2)", overflow: "hidden", position: "relative" }}>
        {/* Form state managed by parent via onLogin */}
        {/* Close button */}
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", fontSize: 20, color: v.textTer, cursor: "pointer", lineHeight: 1 }}>✕</button>

        <div style={{ padding: "36px 32px 32px" }}>
          {/* Logo */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
            <svg width="44" height="44" viewBox="0 0 512 512">
              <defs>
                <linearGradient id="mlbg" x1="0" y1="1" x2="1" y2="0">
                  <stop offset="0%" stopColor="#16A34A"/><stop offset="100%" stopColor="#4ADE80"/>
                </linearGradient>
              </defs>
              <rect width="512" height="512" rx="128" fill="url(#mlbg)"/>
              <path d="M256 420Q256 260 256 92Q288 132 296 196Q296 320 256 420Z" fill="#fff" opacity=".9"/>
              <path d="M256 420Q256 260 256 92Q224 132 216 196Q216 320 256 420Z" fill="#fff" opacity=".75"/>
              <path d="M244 420Q168 280 120 160Q152 168 184 220Q224 296 244 420Z" fill="#fff" opacity=".65"/>
              <path d="M268 420Q344 280 392 160Q360 168 328 220Q288 296 268 420Z" fill="#fff" opacity=".55"/>
            </svg>
          </div>
          <p style={{ textAlign: "center", fontSize: 22, fontWeight: 800, fontFamily: "'Syne', sans-serif", color: v.text, marginBottom: 4 }}>
            <span style={{ color: dark ? "#22C55E" : "#16A34A" }}>cleo</span>
            <span style={{ color: "#4ADE80" }}>yards</span>
          </p>
          <p style={{ textAlign: "center", fontSize: 14, color: v.textSec, marginBottom: 24 }}>{t.login.title}</p>

          {/* Tabs */}
          <div style={{ display: "flex", borderRadius: 10, overflow: "hidden", border: "1px solid " + v.border, marginBottom: 24 }}>
            <button onClick={() => setTab("client")} style={{ flex: 1, padding: "12px 0", fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer", background: tab === "client" ? (dark ? "rgba(22,163,74,0.15)" : "#DCFCE7") : "transparent", color: tab === "client" ? "#16A34A" : v.textSec, transition: "all 0.2s", display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={tab === "client" ? "#16A34A" : v.textTer} strokeWidth="1.8" strokeLinecap="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              <span>{t.login.tabClient}</span>
            </button>
            <button onClick={() => setTab("business")} style={{ flex: 1, padding: "12px 0", fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer", borderLeft: "1px solid " + v.border, background: tab === "business" ? (dark ? "rgba(22,163,74,0.15)" : "#DCFCE7") : "transparent", color: tab === "business" ? "#16A34A" : v.textSec, transition: "all 0.2s", display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={tab === "business" ? "#16A34A" : v.textTer} strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="4" rx="1"/><rect x="14" y="10" width="7" height="11" rx="1"/><rect x="3" y="13" width="7" height="8" rx="1"/></svg>
              <span>{t.login.tabBusiness}</span>
            </button>
          </div>

          {/* Tab description */}
          <p style={{ textAlign: "center", fontSize: 12, color: v.textTer, marginBottom: 20, marginTop: -12 }}>
            {isBiz ? t.login.businessDesc : t.login.clientDesc}
          </p>

          {/* Form fields */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: v.textSec, display: "block", marginBottom: 6 }}>{t.login.email}</label>
            <div style={{ position: "relative" }}>
              <input id="login-email" type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value.replace(/,/g, "."))} placeholder="name@company.com" style={{ width: "100%", padding: "12px 14px", paddingRight: 34, borderRadius: 10, border: "1px solid " + (loginEmail && isValidEmail(loginEmail) ? "#16A34A" : loginEmail && !isValidEmail(loginEmail) ? "#EF4444" : v.border), background: dark ? "rgba(255,255,255,0.04)" : v.surface, color: v.text, fontSize: 14, outline: "none", transition: "border 0.2s" }} />
              {loginEmail && <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14, fontWeight: 700, color: isValidEmail(loginEmail) ? "#16A34A" : "#EF4444" }}>{isValidEmail(loginEmail) ? "✓" : "✗"}</span>}
            </div>
          </div>
          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: v.textSec, display: "block", marginBottom: 6 }}>{t.login.password}</label>
            <input id="login-pw" type="password" placeholder="••••••••" style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid " + v.border, background: dark ? "rgba(255,255,255,0.04)" : v.surface, color: v.text, fontSize: 14, outline: "none", transition: "border 0.2s" }} onFocus={(e) => e.target.style.borderColor = "#16A34A"} onBlur={(e) => e.target.style.borderColor = v.border} />
          </div>
          <div style={{ textAlign: "right", marginBottom: 20 }}>
            <a style={{ fontSize: 13, color: "#16A34A", textDecoration: "none", cursor: "pointer", fontWeight: 500 }}>{t.login.forgot}</a>
          </div>

          {/* Sign in button */}
          {error && <p style={{ fontSize: 12, color: "#EF4444", textAlign: "center", marginBottom: 10 }}>{error}</p>}
          <button id="login-btn" onClick={() => {
            const email = loginEmail;
            const pw = document.getElementById("login-pw").value;
            onLogin(email, pw, tab);
          }} style={{ width: "100%", padding: "14px 0", borderRadius: 12, background: "linear-gradient(135deg, #16A34A, #22C55E)", color: "#fff", border: "none", fontSize: 15, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 16px rgba(22,163,74,0.3)", transition: "all 0.3s", marginBottom: 16 }}>{t.login.btn}</button>

          {/* Sign up link */}
          <p style={{ textAlign: "center", fontSize: 13, color: v.textSec }}>
            {t.login.noAccount}{" "}
            <a onClick={onClose} style={{ color: "#16A34A", fontWeight: 600, cursor: "pointer", textDecoration: "none" }}>{t.login.signUp}</a>
          </p>
        </div>
      </div>
    </div>
  );
};

// ─── LOGO COMPONENT ───
const Logo = ({ dark, full = false }) => (
  <div style={{ display: "flex", alignItems: "center", gap: full ? 14 : 10, cursor: "pointer" }}>
    <svg width={full ? 52 : 38} height={full ? 52 : 38} viewBox="0 0 512 512">
      <defs>
        <linearGradient id="lbg" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#16A34A"/><stop offset="100%" stopColor="#4ADE80"/>
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="128" fill="url(#lbg)"/>
      <path d="M256 420Q256 260 256 92Q288 132 296 196Q296 320 256 420Z" fill="#fff" opacity=".9"/>
      <path d="M256 420Q256 260 256 92Q224 132 216 196Q216 320 256 420Z" fill="#fff" opacity=".75"/>
      <path d="M244 420Q168 280 120 160Q152 168 184 220Q224 296 244 420Z" fill="#fff" opacity=".65"/>
      <path d="M268 420Q344 280 392 160Q360 168 328 220Q288 296 268 420Z" fill="#fff" opacity=".55"/>
    </svg>
    <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
      <span style={{ fontSize: full ? 28 : 22, fontWeight: 800, fontFamily: "'Syne', sans-serif", letterSpacing: "-0.03em" }}>
        <span style={{ color: dark ? "#22C55E" : "#16A34A" }}>cleo</span>
        <span style={{ color: "#4ADE80" }}>yards</span>
      </span>
      <div style={{ width: "100%", height: full ? 2 : 1.5, background: dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)", borderRadius: 1, overflow: "hidden", marginTop: full ? 6 : 4 }}>
        <div className="animated-line" style={{ width: "40%", height: "100%", borderRadius: 1, background: "linear-gradient(90deg, #16A34A, #4ADE80)" }} />
      </div>
      <span style={{ fontSize: full ? 9 : 7, fontWeight: 500, letterSpacing: full ? 5 : 3.5, color: dark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.3)", marginTop: full ? 5 : 3, textTransform: "uppercase", textAlign: "center" }}>POWERED BY IA</span>
    </div>
  </div>
);



// ─── MAIN APP ───
export default function App() {
  const [lang, setLang] = useState("en");
  const [dark, setDark] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [annual, setAnnual] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [loginTab, setLoginTab] = useState("business");
  const [loginError, setLoginError] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();
  const t = T[lang];

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const v = dark
    ? { bg: "#0B1120", surface: "#131B2E", text: "#F1F5F9", textSec: "#94A3B8", textTer: "#64748B", border: "#1E293B", cardBg: "#131B2E", navBg: "rgba(11,17,32,0.92)" }
    : { bg: "#FFFFFF", surface: "#F8FAFC", text: "#0F172A", textSec: "#64748B", textTer: "#94A3B8", border: "#E2E8F0", cardBg: "#FFFFFF", navBg: "rgba(255,255,255,0.92)" };

  const cssVars = { "--bg": v.bg, "--surface": v.surface, "--text": v.text, "--textSec": v.textSec, "--textTer": v.textTer, "--border": v.border, "--cardBg": v.cardBg, "--green600": "#16A34A", "--green500": "#22C55E", "--green400": "#4ADE80", "--green100": "#DCFCE7", "--green700": "#15803D" };

  const calcPrice = (b) => annual ? Math.round(b * 0.8) : b;

  return (
    <div style={{ ...cssVars, fontFamily: "'DM Sans', sans-serif", color: v.text, background: v.bg, minHeight: "100vh", overflowX: "hidden", transition: "background 0.3s, color 0.3s" }}>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700&display=swap" rel="stylesheet" />
      <style>{`
        *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
        @keyframes slideLine { 0%{transform:translateX(0)} 50%{transform:translateX(150%)} 100%{transform:translateX(0)} }
        .animated-line { animation: slideLine 3s ease-in-out infinite; }
        @media(max-width:768px) {
          .hide-mobile { display:none!important; }
          .show-mobile { display:flex!important; }
          .hero-stats { gap:24px!important; }
          .hero-stats > div { min-width:80px; }
          .feat-grid { grid-template-columns:1fr!important; }
          .price-grid { grid-template-columns:1fr!important; }
          .bilingual-grid { grid-template-columns:1fr!important; }
          .footer-grid { grid-template-columns:1fr 1fr!important; gap:32px!important; }
          .hero-h1 { font-size:32px!important; }
          .hero-sub { font-size:16px!important; }
          .section-title { font-size:26px!important; }
          .nav-inner { padding:0 16px!important; }
          .section-pad { padding:60px 16px!important; }
        }
        @media(min-width:769px) {
          .show-mobile { display:none!important; }
        }
        .feat-card:hover { transform:translateY(-4px); box-shadow:0 8px 32px ${dark ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.08)"}; }
        .btn-primary:hover { transform:translateY(-2px); box-shadow:0 8px 32px rgba(22,163,74,0.35); }
        .int-chip:hover { border-color:#16A34A; color:#16A34A; }
      `}</style>

      {/* ─── NAV ─── */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, padding: scrolled ? "8px 0" : "14px 0", background: scrolled ? v.navBg : "transparent", backdropFilter: scrolled ? "blur(16px)" : "none", borderBottom: scrolled ? `1px solid ${v.border}` : "none", transition: "all 0.3s" }}>
        <div className="nav-inner" style={{ maxWidth: 1320, margin: "0 auto", padding: "0 40px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Logo dark={dark} />
          <div className="hide-mobile" style={{ display: "flex", gap: 28, alignItems: "center" }}>
            <a href="#features" style={{ fontSize: 14, color: v.textSec, textDecoration: "none", fontWeight: 500 }}>{t.nav.features}</a>
            <a href="#pricing" style={{ fontSize: 14, color: v.textSec, textDecoration: "none", fontWeight: 500 }}>{t.nav.pricing}</a>
            <a href="#integrations" style={{ fontSize: 14, color: v.textSec, textDecoration: "none", fontWeight: 500 }}>{t.nav.integrations}</a>
            <div style={{ display: "flex", borderRadius: 8, overflow: "hidden", border: `1px solid ${v.border}` }}>
              <button onClick={() => setLang("en")} style={{ padding: "5px 12px", fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer", background: lang === "en" ? "#16A34A" : "transparent", color: lang === "en" ? "#fff" : v.textSec, transition: "all 0.2s" }}>EN</button>
              <button onClick={() => setLang("es")} style={{ padding: "5px 12px", fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer", background: lang === "es" ? "#16A34A" : "transparent", color: lang === "es" ? "#fff" : v.textSec, transition: "all 0.2s" }}>ES</button>
            </div>
            <button onClick={() => setDark(!dark)} style={{ background: "none", border: `1px solid ${v.border}`, borderRadius: 8, padding: 6, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {dark ? Icons.sun("#F1F5F9") : Icons.moon("#0F172A")}
            </button>
            <a onClick={() => setLoginOpen(true)} style={{ fontSize: 14, color: v.text, textDecoration: "none", fontWeight: 600, cursor: "pointer" }}>{t.nav.login}</a>
            <button className="btn-primary" style={{ padding: "10px 22px", borderRadius: 10, background: "linear-gradient(135deg, #16A34A, #22C55E)", color: "#fff", border: "none", fontSize: 14, fontWeight: 600, cursor: "pointer", boxShadow: "0 2px 12px rgba(22,163,74,0.3)", transition: "all 0.3s" }}>{t.nav.cta}</button>
          </div>
          <div className="show-mobile" style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button onClick={() => setDark(!dark)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
              {dark ? Icons.sun("#F1F5F9") : Icons.moon("#0F172A")}
            </button>
            <button onClick={() => setMobileMenu(!mobileMenu)} style={{ background: "none", border: "none", fontSize: 24, color: v.text, cursor: "pointer" }}>☰</button>
          </div>
        </div>
      </nav>

      {/* ─── MOBILE MENU ─── */}
      {mobileMenu && (
        <div onClick={() => setMobileMenu(false)} style={{ position: "fixed", inset: 0, background: dark ? "rgba(11,17,32,0.98)" : "rgba(255,255,255,0.98)", zIndex: 200, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 28 }}>
          <div style={{ display: "flex", borderRadius: 8, overflow: "hidden", border: `1px solid ${v.border}` }}>
            <button onClick={(e) => { e.stopPropagation(); setLang("en"); }} style={{ padding: "6px 16px", fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer", background: lang === "en" ? "#16A34A" : "transparent", color: lang === "en" ? "#fff" : v.textSec }}>EN</button>
            <button onClick={(e) => { e.stopPropagation(); setLang("es"); }} style={{ padding: "6px 16px", fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer", background: lang === "es" ? "#16A34A" : "transparent", color: lang === "es" ? "#fff" : v.textSec }}>ES</button>
          </div>
          {[t.nav.features, t.nav.pricing, t.nav.integrations].map((item, i) => (
            <button key={i} style={{ fontSize: 20, fontWeight: 700, color: v.text, background: "none", border: "none", cursor: "pointer", fontFamily: "'Syne', sans-serif" }}>{item}</button>
          ))}
          <button onClick={() => { setMobileMenu(false); setLoginOpen(true); }} style={{ fontSize: 20, fontWeight: 700, color: v.text, background: "none", border: "none", cursor: "pointer", fontFamily: "'Syne', sans-serif" }}>{t.nav.login}</button>
          <button className="btn-primary" style={{ padding: "14px 32px", borderRadius: 10, background: "linear-gradient(135deg, #16A34A, #22C55E)", color: "#fff", border: "none", fontSize: 16, fontWeight: 600, cursor: "pointer" }}>{t.nav.cta}</button>
        </div>
      )}

      <LoginModal open={loginOpen} onClose={() => { setLoginOpen(false); setLoginError(""); }} tab={loginTab} setTab={setLoginTab} t={t} dark={dark} v={v} error={loginError} onLogin={(email, pw, portal) => {
        const result = login(email, pw, portal);
        if (result.success) {
          setLoginOpen(false);
          setLoginError("");
          navigate(result.redirect);
        } else {
          setLoginError(result.error);
        }
      }} />

      {/* ─── HERO ─── */}
      <section style={{ paddingTop: 130, paddingBottom: 80, textAlign: "center", position: "relative" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: dark ? "radial-gradient(ellipse at 50% 0%, rgba(22,163,74,0.06) 0%, transparent 70%)" : "radial-gradient(ellipse at 50% 0%, rgba(22,163,74,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "relative", zIndex: 1, padding: "0 40px" }}>
          <span style={{ display: "inline-block", padding: "6px 16px", borderRadius: 20, background: dark ? "rgba(22,163,74,0.12)" : "rgba(22,163,74,0.08)", color: "#16A34A", fontSize: 13, fontWeight: 600, marginBottom: 24, border: `1px solid ${dark ? "rgba(22,163,74,0.2)" : "rgba(22,163,74,0.15)"}` }}>{t.hero.badge}</span>
          <h1 className="hero-h1" style={{ fontSize: "clamp(34px, 5vw, 64px)", fontWeight: 800, lineHeight: 1.08, letterSpacing: "-0.035em", color: v.text, fontFamily: "'Syne', sans-serif", maxWidth: 960, margin: "0 auto 12px" }}>
            {t.hero.h1_1}{" "}
            <span style={{ color: "#16A34A" }}>{t.hero.h1_accent}</span>{" "}
            {t.hero.h1_2}
          </h1>
          <p className="hero-sub" style={{ fontSize: "clamp(16px, 1.8vw, 19px)", color: v.textSec, maxWidth: 720, margin: "20px auto 36px", lineHeight: 1.65 }}>{t.hero.sub}</p>
          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap", marginBottom: 14 }}>
            <button className="btn-primary" style={{ padding: "15px 34px", borderRadius: 12, background: "linear-gradient(135deg, #16A34A, #22C55E)", color: "#fff", border: "none", fontSize: 16, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 20px rgba(22,163,74,0.3)", transition: "all 0.3s" }}>{t.hero.cta1}</button>
            <button style={{ padding: "15px 34px", borderRadius: 12, background: "transparent", color: v.text, border: `2px solid ${v.border}`, fontSize: 16, fontWeight: 600, cursor: "pointer", transition: "all 0.3s" }}>{t.hero.cta2}</button>
          </div>
          <p style={{ fontSize: 13, color: v.textTer }}>{t.hero.trust}</p>
          <div style={{ marginTop: 50, maxWidth: 900, margin: "50px auto 0", borderRadius: 14, overflow: "hidden", boxShadow: "0 16px 48px rgba(0,0,0,0.12)", border: "1px solid " + v.border }}>
            <video
              key={lang} src={lang === "es" ? "https://res.cloudinary.com/dhaggnpkh/video/upload/v1776138002/Cleo_Yards_-_Liquid_Glass_Garden_Definitive_Final__v7_-Spanish__Latin_America__with_captions_mu3fwf.mp4" : "https://res.cloudinary.com/dhaggnpkh/video/upload/v1776133245/Cleo_Yards_-_Liquid_Glass_Garden_Definitive_Final_v7__1080p_vsbjfw.mp4"}
              controls
              autoPlay
              muted
              playsInline
              loop
              style={{ width: "100%", display: "block" }}
            />
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section id="features" className="section-pad" style={{ maxWidth: 1320, margin: "0 auto", padding: "80px 40px" }}>
        <h2 className="section-title" style={{ fontSize: "clamp(26px, 3.5vw, 42px)", fontWeight: 800, color: v.text, textAlign: "center", fontFamily: "'Syne', sans-serif", letterSpacing: "-0.03em" }}>
          {t.features.title} <span style={{ color: "#16A34A" }}>{t.features.titleAccent}</span>
        </h2>
        <p style={{ fontSize: 16, color: v.textSec, textAlign: "center", maxWidth: 640, margin: "14px auto 50px", lineHeight: 1.6 }}>{t.features.sub}</p>
        <div className="feat-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 20 }}>
          {t.features.items.map((f, i) => (
            <div className="feat-card" key={i} style={{ padding: 28, borderRadius: 14, background: v.cardBg, border: `1px solid ${v.border}`, transition: "all 0.3s", cursor: "default" }}>
              <div style={{ width: 50, height: 50, borderRadius: 12, background: dark ? "rgba(22,163,74,0.1)" : "#DCFCE7", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                {Icons[f.id]("#16A34A")}
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: v.text, marginBottom: 8 }}>{f.title}</h3>
              <p style={{ fontSize: 14, color: v.textSec, lineHeight: 1.65 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── BILINGUAL ─── */}
      <section style={{ background: dark ? "linear-gradient(160deg, #0B1120, #131B2E)" : "linear-gradient(160deg, #15803D, #16A34A, #22C55E)", color: "#fff", padding: "80px 40px" }}>
        <h2 className="section-title" style={{ fontSize: "clamp(26px, 3.5vw, 42px)", fontWeight: 800, color: "#fff", textAlign: "center", fontFamily: "'Syne', sans-serif", letterSpacing: "-0.03em" }}>
          {t.bilingualSection.title} <span style={{ color: "#4ADE80" }}>{t.bilingualSection.titleAccent}</span>
        </h2>
        <p style={{ fontSize: 16, color: "rgba(255,255,255,0.75)", textAlign: "center", maxWidth: 640, margin: "14px auto 50px", lineHeight: 1.6 }}>{t.bilingualSection.sub}</p>
        <div className="bilingual-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 24, maxWidth: 1100, margin: "0 auto" }}>
          {[["p1title", "p1desc"], ["p2title", "p2desc"], ["p3title", "p3desc"]].map(([tk, dk], i) => (
            <div key={i} style={{ padding: 28, borderRadius: 14, background: dark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.1)", border: `1px solid ${dark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.15)"}`, backdropFilter: "blur(8px)" }}>
              <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8, color: "#fff" }}>{t.bilingualSection[tk]}</h3>
              <p style={{ fontSize: 14, lineHeight: 1.65, color: "rgba(255,255,255,0.8)" }}>{t.bilingualSection[dk]}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── PRICING ─── */}
      <section id="pricing" className="section-pad" style={{ maxWidth: 1320, margin: "0 auto", padding: "80px 40px" }}>
        <h2 className="section-title" style={{ fontSize: "clamp(26px, 3.5vw, 42px)", fontWeight: 800, color: v.text, textAlign: "center", fontFamily: "'Syne', sans-serif", letterSpacing: "-0.03em" }}>
          {t.pricing.title} <span style={{ color: "#16A34A" }}>{t.pricing.titleAccent}</span>
        </h2>
        <p style={{ fontSize: 16, color: v.textSec, textAlign: "center", maxWidth: 640, margin: "14px auto 40px", lineHeight: 1.6 }}>{t.pricing.sub}</p>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 12, marginBottom: 40 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: !annual ? v.text : v.textTer }}>{t.pricing.monthly}</span>
          <div onClick={() => setAnnual(!annual)} style={{ width: 48, height: 26, borderRadius: 13, background: annual ? "#16A34A" : v.border, cursor: "pointer", position: "relative", transition: "background 0.3s" }}>
            <div style={{ width: 20, height: 20, borderRadius: 10, background: "#fff", position: "absolute", top: 3, left: annual ? 25 : 3, transition: "left 0.3s", boxShadow: "0 1px 4px rgba(0,0,0,0.15)" }} />
          </div>
          <span style={{ fontSize: 14, fontWeight: 600, color: annual ? v.text : v.textTer }}>{t.pricing.annually}</span>
          {annual && <span style={{ fontSize: 12, color: "#16A34A", fontWeight: 700 }}>-20%</span>}
        </div>
        <div className="price-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(270px, 1fr))", gap: 20, maxWidth: 1060, margin: "0 auto" }}>
          {t.pricing.plans.map((p, i) => (
            <div key={i} style={{ padding: 32, borderRadius: 16, background: p.popular ? "linear-gradient(160deg, #15803D, #16A34A)" : v.cardBg, color: p.popular ? "#fff" : v.text, border: p.popular ? "none" : `1px solid ${v.border}`, position: "relative", transform: p.popular ? "scale(1.03)" : "none", boxShadow: p.popular ? "0 12px 40px rgba(22,163,74,0.25)" : `0 2px 12px ${dark ? "rgba(0,0,0,0.2)" : "rgba(0,0,0,0.04)"}` }}>
              {p.popular && <span style={{ position: "absolute", top: 14, right: 14, padding: "4px 12px", borderRadius: 10, background: "rgba(74,222,128,0.2)", color: "#DCFCE7", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>{t.pricing.popularBadge}</span>}
              <div style={{ fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", opacity: 0.6, marginBottom: 6 }}>{p.name}</div>
              <div>
                <span style={{ fontSize: 44, fontWeight: 800, fontFamily: "'Syne', sans-serif", letterSpacing: "-0.03em" }}>${calcPrice(parseInt(p.price))}</span>
                <span style={{ fontSize: 15, opacity: 0.6 }}>{p.period}</span>
              </div>
              <p style={{ fontSize: 13.5, opacity: 0.65, marginTop: 6, marginBottom: 22 }}>{p.desc}</p>
              {p.features.map((f, j) => (
                <div key={j} style={{ fontSize: 13.5, padding: "5px 0", display: "flex", alignItems: "center", gap: 8, color: p.popular ? "rgba(255,255,255,0.9)" : v.textSec }}>
                  <span style={{ color: p.popular ? "#4ADE80" : "#16A34A", fontWeight: 700 }}>✓</span>{f}
                </div>
              ))}
              <button style={{ marginTop: 24, width: "100%", padding: "13px 0", borderRadius: 10, border: p.popular ? "2px solid rgba(255,255,255,0.25)" : `2px solid ${dark ? "#22C55E" : "#16A34A"}`, background: p.popular ? "rgba(255,255,255,0.08)" : "transparent", color: p.popular ? "#fff" : dark ? "#22C55E" : "#16A34A", fontSize: 14, fontWeight: 700, cursor: "pointer", transition: "all 0.3s" }}>{p.cta}</button>
            </div>
          ))}
        </div>
        <p style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: v.textTer }}>{t.pricing.annual}</p>
      </section>

      {/* ─── INTEGRATIONS ─── */}
      <section id="integrations" className="section-pad" style={{ maxWidth: 1320, margin: "0 auto", padding: "40px 40px 80px" }}>
        <h2 className="section-title" style={{ fontSize: "clamp(26px, 3.5vw, 42px)", fontWeight: 800, color: v.text, textAlign: "center", fontFamily: "'Syne', sans-serif", letterSpacing: "-0.03em" }}>
          {t.integrations.title} <span style={{ color: "#16A34A" }}>{t.integrations.titleAccent}</span>
        </h2>
        <p style={{ fontSize: 16, color: v.textSec, textAlign: "center", maxWidth: 640, margin: "14px auto 40px", lineHeight: 1.6 }}>{t.integrations.sub}</p>
        <div style={{ display: "flex", justifyContent: "center", gap: 16, flexWrap: "wrap" }}>
          {t.integrations.items.map((item, i) => (
            <div className="int-chip" key={i} style={{ padding: "12px 24px", borderRadius: 10, background: v.cardBg, border: `1px solid ${v.border}`, fontSize: 14, fontWeight: 600, color: v.textSec, transition: "all 0.2s", cursor: "default" }}>{item}</div>
          ))}
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section style={{ textAlign: "center", padding: "80px 40px", position: "relative" }}>
        <div style={{ position: "absolute", inset: 0, background: dark ? "radial-gradient(ellipse at 50% 100%, rgba(22,163,74,0.06) 0%, transparent 70%)" : "radial-gradient(ellipse at 50% 100%, rgba(22,163,74,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <h2 className="section-title" style={{ fontSize: "clamp(26px, 3.5vw, 42px)", fontWeight: 800, color: v.text, fontFamily: "'Syne', sans-serif", letterSpacing: "-0.03em" }}>
            {t.finalCta.title} <span style={{ color: "#16A34A" }}>{t.finalCta.titleAccent}</span>
          </h2>
          <p style={{ fontSize: 16, color: v.textSec, maxWidth: 660, margin: "14px auto 36px", lineHeight: 1.6 }}>{t.finalCta.sub}</p>
          <button className="btn-primary" style={{ padding: "16px 44px", borderRadius: 12, background: "linear-gradient(135deg, #16A34A, #22C55E)", color: "#fff", border: "none", fontSize: 17, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 24px rgba(22,163,74,0.3)", transition: "all 0.3s" }}>{t.finalCta.cta}</button>
          <p style={{ fontSize: 13, color: v.textTer, marginTop: 14 }}>{t.finalCta.trust}</p>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer style={{ background: dark ? "#080E1A" : "#0F172A", color: "rgba(255,255,255,0.7)", padding: "56px 40px 28px" }}>
        <div className="footer-grid" style={{ maxWidth: 1320, margin: "0 auto", display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 40, marginBottom: 40 }}>
          <div>
            <div style={{ marginBottom: 16 }}>
              <Logo dark={true} full={true} />
            </div>
            <p style={{ fontSize: 14, lineHeight: 1.6, maxWidth: 260, color: "rgba(255,255,255,0.5)" }}>{t.footer.tagline}</p>
          </div>
          {[["col1", "col1items"], ["col2", "col2items"], ["col3", "col3items"]].map(([title, items], i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#fff", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>{t.footer[title]}</div>
              {t.footer[items].map((item, j) => (
                <a key={j} style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", textDecoration: "none", cursor: "pointer" }}>{item}</a>
              ))}
            </div>
          ))}
        </div>
        <div style={{ maxWidth: 1320, margin: "0 auto", paddingTop: 20, borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10, fontSize: 12, color: "rgba(255,255,255,0.3)" }}>
          <span>{t.footer.copy}</span>
          <span>{t.footer.madeWith}</span>
        </div>
      </footer>
    </div>
  );
}
