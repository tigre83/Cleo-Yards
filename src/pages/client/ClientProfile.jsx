import { useOutletContext } from "react-router-dom";
import { User, MapPin, Phone, Mail, CreditCard, Calendar, Leaf } from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   CLIENT PROFILE — View client information
   ═══════════════════════════════════════════════════════════════ */

const fmtDate = (d, lang) => d ? new Date(d + "T12:00").toLocaleDateString(lang === "es" ? "es-EC" : "en-US", { month: "long", year: "numeric" }) : "—";

export default function ClientProfile() {
  const { dark, v, lang, clientData, company } = useOutletContext();
  const L = (en, es) => lang === "es" ? es : en;
  const G = "#16A34A";

  if (!clientData) return null;

  const payLabels = { zelle: "Zelle", card: L("Credit Card", "Tarjeta de Crédito"), cash: L("Cash", "Efectivo"), check: L("Check", "Cheque"), ach: "ACH Transfer" };

  const InfoRow = ({ icon: Icon, label, value }) => (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 0", borderBottom: "1px solid " + v.border + "30" }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: dark ? "rgba(22,163,74,0.08)" : "#F0FDF4", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon size={14} color={G}/>
      </div>
      <div>
        <div style={{ fontSize: 10, fontWeight: 700, color: v.textTer, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 13, fontWeight: 600, color: v.text }}>{value || "—"}</div>
      </div>
    </div>
  );

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: v.text, fontFamily: "'Outfit', sans-serif", margin: 0 }}>{L("My Profile", "Mi Perfil")}</h1>
      <p style={{ fontSize: 13, color: v.textSec, margin: "2px 0 24px" }}>{L("Your account information", "Tu información de cuenta")}</p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20, alignItems: "start" }}>
        {/* Left - Profile card */}
        <div style={{ background: v.cardBg, border: "1px solid " + v.border, borderRadius: 12, overflow: "hidden" }}>
          {/* Header with avatar */}
          <div style={{ padding: "24px 24px 18px", borderBottom: "1px solid " + v.border, display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 64, height: 64, borderRadius: 16, background: `linear-gradient(135deg, ${G}, #4ADE80)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, fontWeight: 800, color: "#fff", flexShrink: 0 }}>
              {(clientData.name || "C").charAt(0)}
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: v.text, fontFamily: "'Outfit', sans-serif" }}>{clientData.name}</div>
              <div style={{ fontSize: 12, color: v.textSec, marginTop: 2 }}>{L("Client since", "Cliente desde")} {fmtDate(clientData.clientSince, lang)}</div>
              <span style={{ display: "inline-block", marginTop: 4, fontSize: 9, fontWeight: 600, padding: "2px 8px", borderRadius: 4, background: clientData.status === "active" ? "#DCFCE7" : "#FEE2E2", color: clientData.status === "active" ? G : "#DC2626" }}>
                {clientData.status === "active" ? L("Active", "Activo") : L("Inactive", "Inactivo")}
              </span>
            </div>
          </div>

          {/* Info rows */}
          <div style={{ padding: "4px 24px 16px" }}>
            <InfoRow icon={Mail} label="Email" value={clientData.email}/>
            <InfoRow icon={Phone} label={L("Phone", "Teléfono")} value={clientData.phone}/>
            <InfoRow icon={MapPin} label={L("Address", "Dirección")} value={clientData.address}/>
            <InfoRow icon={CreditCard} label={L("Payment Method", "Método de Pago")} value={payLabels[clientData.paymentMethod] || clientData.paymentMethod}/>
            <InfoRow icon={Calendar} label={L("Billing Type", "Tipo de Facturación")} value={clientData.billingType === "monthly" ? L("Monthly (consolidated)", "Mensual (consolidado)") : L("Per Visit", "Por Visita")}/>
          </div>
        </div>

        {/* Right - Company + notes */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Service Provider */}
          <div style={{ background: v.cardBg, border: "1px solid " + v.border, borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: v.textSec, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>{L("Service Provider", "Proveedor de Servicio")}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              {company?.logo ? (
                <img src={company.logo} alt="" style={{ width: 48, height: 48, borderRadius: 10, objectFit: "contain", background: dark ? "rgba(255,255,255,0.04)" : "#F8FAF9", border: "1px solid " + v.border }}/>
              ) : (
                <div style={{ width: 48, height: 48, borderRadius: 10, background: `linear-gradient(135deg, ${G}, #4ADE80)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Leaf size={20} color="#fff"/>
                </div>
              )}
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: v.text }}>{company?.name || "—"}</div>
                <div style={{ fontSize: 11, color: v.textSec }}>{company?.email || ""}</div>
              </div>
            </div>
            {company?.phone && <div style={{ fontSize: 12, color: v.textSec, marginBottom: 2 }}>{company.phone}</div>}
            {company?.address && <div style={{ fontSize: 12, color: v.textSec }}>{[company.address, company.city, company.state, company.zip].filter(Boolean).join(", ")}</div>}
          </div>

          {/* Notes */}
          {clientData.notes && (
            <div style={{ background: v.cardBg, border: "1px solid " + v.border, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: v.textSec, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>{L("Notes", "Notas")}</div>
              <div style={{ fontSize: 13, color: v.text, lineHeight: 1.6 }}>{clientData.notes}</div>
            </div>
          )}

          {/* Quick Actions */}
          <div style={{ background: v.cardBg, border: "1px solid " + v.border, borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: v.textSec, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>{L("Need Help?", "¿Necesitas Ayuda?")}</div>
            <div style={{ fontSize: 12, color: v.textSec, lineHeight: 1.6 }}>
              {L("Contact your service provider:", "Contacta a tu proveedor:")}
            </div>
            {company?.phone && (
              <a href={"tel:" + company.phone.replace(/[^0-9+]/g, "")} style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 8, padding: "8px 16px", borderRadius: 8, background: dark ? "rgba(22,163,74,0.1)" : "#F0FDF4", border: "1px solid " + G + "20", color: G, fontSize: 12, fontWeight: 600, textDecoration: "none" }}>
                <Phone size={13}/> {company.phone}
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
