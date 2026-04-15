import { MapPin } from "lucide-react";

export default function Routes({ dark, v, t, lang }) {
  const L = (en, es) => lang === "es" ? es : en;
  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: v.text, margin: 0 }}>{L("Routes", "Rutas")}</h1>
        <p style={{ fontSize: 13, color: v.textSec, margin: "2px 0 0" }}>{L("Route optimization & tracking", "Optimización y seguimiento de rutas")}</p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 20px", borderRadius: 12, border: "2px dashed " + v.border, background: dark ? "rgba(255,255,255,0.02)" : "#FAFFFE" }}>
        <div style={{ width: 56, height: 56, borderRadius: 14, background: "#16A34A12", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
          <MapPin size={24} color="#16A34A"/>
        </div>
        <div style={{ fontSize: 18, fontWeight: 800, color: v.text, marginBottom: 6 }}>{L("Coming Soon", "Próximamente")}</div>
        <div style={{ fontSize: 13, color: v.textSec, textAlign: "center", maxWidth: 360, lineHeight: 1.6 }}>
          {L("Route optimization with Google Maps, GPS tracking, and smart scheduling to reduce drive time between jobs.", "Optimización de rutas con Google Maps, seguimiento GPS y programación inteligente para reducir tiempos de traslado.")}
        </div>
        <div style={{ marginTop: 20, padding: "8px 16px", borderRadius: 8, background: "#16A34A12", border: "1px solid #16A34A20" }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: "#16A34A" }}>v2.0</span>
        </div>
      </div>
    </div>
  );
}
