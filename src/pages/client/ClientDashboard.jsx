import { useMemo } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { CheckCircle, Clock, AlertTriangle, DollarSign, Calendar, FileText, ArrowRight } from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   CLIENT DASHBOARD — Overview with real data
   ═══════════════════════════════════════════════════════════════ */

const fmtDate = (d, lang) => {
  if (!d) return "—";
  return new Date(d + "T12:00").toLocaleDateString(lang === "es" ? "es-EC" : "en-US", { month: "short", day: "numeric", year: "numeric" });
};
const fmtMoney = (n) => "$" + (n || 0).toFixed(2);

export default function ClientDashboard() {
  const { dark, v, lang, clientData, company, invoices, jobs } = useOutletContext();
  const navigate = useNavigate();
  const L = (en, es) => lang === "es" ? es : en;

  const stats = useMemo(() => {
    const unpaid = invoices.filter(i => ["sent", "overdue"].includes(i.status));
    const paid = invoices.filter(i => i.status === "paid");
    const overdue = invoices.filter(i => i.status === "overdue");
    const balanceDue = unpaid.reduce((s, i) => s + (i.total || 0), 0);
    const totalPaid = paid.reduce((s, i) => s + (i.total || 0), 0);

    const upcomingJobs = jobs.filter(j => j.date >= new Date().toISOString().split("T")[0] && j.status !== "cancelled" && j.status !== "rescheduled").sort((a, b) => a.date.localeCompare(b.date));
    const completedJobs = jobs.filter(j => j.status === "completed");
    const nextJob = upcomingJobs[0];

    return { balanceDue, totalPaid, overdue: overdue.length, unpaid: unpaid.length, nextJob, completedJobs: completedJobs.length, upcomingJobs: upcomingJobs.length };
  }, [invoices, jobs]);

  const recentJobs = jobs.filter(j => j.status === "completed").slice(0, 5);
  const pendingInvoices = invoices.filter(i => ["sent", "overdue"].includes(i.status)).slice(0, 5);

  const G = "#16A34A";

  return (
    <div>
      {/* Greeting */}
      <h1 style={{ fontSize: 22, fontWeight: 800, color: v.text, fontFamily: "'Outfit', sans-serif", margin: 0 }}>
        {L("Welcome back", "Bienvenido")}, {clientData?.name?.split(" ")[0] || ""}
      </h1>
      <p style={{ fontSize: 13, color: v.textSec, margin: "2px 0 24px" }}>
        {company?.name || ""} · {clientData?.address || ""}
      </p>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 24 }}>
        {[
          { label: L("Next Service", "Próximo Servicio"), value: stats.nextJob ? fmtDate(stats.nextJob.date, lang) : L("None", "Ninguno"), sub: stats.nextJob ? stats.nextJob.services?.map(s => s.name).join(", ") : L("No upcoming jobs", "Sin trabajos programados"), color: G, icon: Calendar, onClick: () => navigate("/client/services") },
          { label: L("Balance Due", "Saldo Pendiente"), value: fmtMoney(stats.balanceDue), sub: stats.unpaid + " " + L("unpaid invoices", "facturas sin pagar"), color: stats.balanceDue > 0 ? "#F59E0B" : G, icon: DollarSign, onClick: () => navigate("/client/invoices") },
          { label: L("Total Paid", "Total Pagado"), value: fmtMoney(stats.totalPaid), sub: L("All time", "Total histórico"), color: G, icon: CheckCircle },
          { label: L("Services Done", "Servicios Realizados"), value: String(stats.completedJobs), sub: stats.upcomingJobs + " " + L("upcoming", "programados"), color: "#3B82F6", icon: FileText, onClick: () => navigate("/client/services") },
        ].map((c, i) => (
          <div key={i} onClick={c.onClick} style={{ padding: "16px 18px", borderRadius: 12, background: v.cardBg, border: "1px solid " + v.border, cursor: c.onClick ? "pointer" : "default", transition: "all 0.15s" }}
            onMouseEnter={e => { if (c.onClick) e.currentTarget.style.borderColor = c.color + "50"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = v.border; }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: v.textSec, textTransform: "uppercase", letterSpacing: "0.05em" }}>{c.label}</span>
              <c.icon size={14} color={c.color}/>
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: v.text, fontFamily: "'Outfit', sans-serif" }}>{c.value}</div>
            <div style={{ fontSize: 11, color: c.color, marginTop: 4, fontWeight: 500 }}>{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Overdue Alert */}
      {stats.overdue > 0 && (
        <div onClick={() => navigate("/client/invoices")} style={{ padding: "14px 18px", borderRadius: 10, background: dark ? "rgba(220,38,38,0.08)" : "#FEF2F2", border: "1px solid #DC262630", marginBottom: 20, display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
          <AlertTriangle size={18} color="#DC2626"/>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#DC2626" }}>
              {stats.overdue} {L("overdue invoice(s)", "factura(s) vencida(s)")}
            </div>
            <div style={{ fontSize: 12, color: dark ? "#FCA5A5" : "#991B1B" }}>
              {L("Please pay as soon as possible to avoid late fees.", "Por favor paga lo antes posible para evitar recargos.")}
            </div>
          </div>
          <ArrowRight size={16} color="#DC2626"/>
        </div>
      )}

      {/* Two columns */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Pending Invoices */}
        <div style={{ background: v.cardBg, border: "1px solid " + v.border, borderRadius: 12, overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid " + v.border, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: v.text }}>{L("Pending Invoices", "Facturas Pendientes")}</span>
            <button onClick={() => navigate("/client/invoices")} style={{ fontSize: 11, fontWeight: 600, color: G, background: "none", border: "none", cursor: "pointer" }}>{L("View all", "Ver todas")} →</button>
          </div>
          <div style={{ padding: "0 18px" }}>
            {pendingInvoices.length === 0 ? (
              <div style={{ padding: "24px 0", textAlign: "center", color: v.textTer, fontSize: 12 }}>{L("All caught up!", "¡Todo al día!")}</div>
            ) : pendingInvoices.map((inv, i) => {
              const isOverdue = inv.status === "overdue";
              return (
                <div key={inv.id} onClick={() => window.open("/pay/" + inv.id, "_blank")} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: i < pendingInvoices.length - 1 ? "1px solid " + v.border + "50" : "none", cursor: "pointer" }}
                  onMouseEnter={e => e.currentTarget.style.opacity = "0.8"} onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: isOverdue ? "#FEE2E2" : (dark ? "rgba(22,163,74,0.1)" : "#F0FDF4"), display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {isOverdue ? <AlertTriangle size={14} color="#DC2626"/> : <FileText size={14} color={G}/>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: v.text }}>{inv.invoiceNumber}</div>
                    <div style={{ fontSize: 10, color: isOverdue ? "#DC2626" : v.textTer }}>{L("Due", "Vence")} {fmtDate(inv.dueDate, lang)}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: v.text }}>{fmtMoney(inv.total)}</div>
                    <div style={{ fontSize: 9, fontWeight: 600, padding: "1px 6px", borderRadius: 4, background: isOverdue ? "#FEE2E2" : "#DBEAFE", color: isOverdue ? "#DC2626" : "#2563EB" }}>{isOverdue ? L("Overdue", "Vencida") : L("Sent", "Enviada")}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Services */}
        <div style={{ background: v.cardBg, border: "1px solid " + v.border, borderRadius: 12, overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid " + v.border, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: v.text }}>{L("Recent Services", "Servicios Recientes")}</span>
            <button onClick={() => navigate("/client/services")} style={{ fontSize: 11, fontWeight: 600, color: G, background: "none", border: "none", cursor: "pointer" }}>{L("View all", "Ver todos")} →</button>
          </div>
          <div style={{ padding: "0 18px" }}>
            {recentJobs.length === 0 ? (
              <div style={{ padding: "24px 0", textAlign: "center", color: v.textTer, fontSize: 12 }}>{L("No services yet", "Sin servicios aún")}</div>
            ) : recentJobs.map((job, i) => (
              <div key={job.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: i < recentJobs.length - 1 ? "1px solid " + v.border + "50" : "none" }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: dark ? "rgba(22,163,74,0.1)" : "#F0FDF4", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <CheckCircle size={14} color={G}/>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: v.text }}>{(job.services || []).map(s => s.name).join(", ") || "Service"}</div>
                  <div style={{ fontSize: 10, color: v.textTer }}>{fmtDate(job.date, lang)}</div>
                </div>
                <span style={{ fontSize: 9, fontWeight: 600, padding: "2px 8px", borderRadius: 4, background: dark ? "rgba(22,163,74,0.12)" : "#DCFCE7", color: G }}>{L("Done", "Hecho")}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
