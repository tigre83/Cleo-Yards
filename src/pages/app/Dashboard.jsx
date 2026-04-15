import { useAuth } from "../../context/AuthContext";
import { useState, useEffect, useRef, useMemo } from "react";
import { useData } from "../../context/DataContext";
import { useNavigate } from "react-router-dom";
import { Calendar, DollarSign, Users, AlertTriangle, TrendingUp, Clock, CheckCircle, ArrowRight, FileText, Target } from "lucide-react";

/* ── CountUp ── */
function useCountUp(target, duration = 1400) {
  const [val, setVal] = useState(0);
  const ref = useRef();
  useEffect(() => {
    let startTime;
    const animate = (now) => {
      if (!startTime) startTime = now;
      const p = Math.min((now - startTime) / duration, 1);
      setVal(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) ref.current = requestAnimationFrame(animate);
    };
    const t = setTimeout(() => { ref.current = requestAnimationFrame(animate); }, 200);
    return () => { clearTimeout(t); cancelAnimationFrame(ref.current); };
  }, [target, duration]);
  return val;
}

/* ── Fade-in ── */
const Anim = ({ children, delay = 0, style = {}, className = "" }) => {
  const [show, setShow] = useState(false);
  useEffect(() => { const t = setTimeout(() => setShow(true), delay); return () => clearTimeout(t); }, [delay]);
  return <div className={className} style={{ ...style, opacity: show ? 1 : 0, transform: show ? "translateY(0)" : "translateY(12px)", transition: "all 0.5s cubic-bezier(0.16,1,0.3,1)" }}>{children}</div>;
};

/* ── Mini bar chart ── */
const MiniChart = ({ data, color, height = 40, v }) => {
  const max = Math.max(...data, 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height }}>
      {data.map((val, i) => (
        <div key={i} style={{ flex: 1, height: `${(val / max) * 100}%`, background: color + "40", borderRadius: 2, minHeight: 2, transition: "height 0.5s ease" }}/>
      ))}
    </div>
  );
};

/* ── Donut ── */
const Donut = ({ value, color, size = 64, v }) => {
  const [anim, setAnim] = useState(0);
  useEffect(() => { const t = setTimeout(() => setAnim(value / 100), 300); return () => clearTimeout(t); }, [value]);
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={v.border} strokeWidth="5"/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="5"
        strokeDasharray={circ} strokeDashoffset={circ * (1 - anim)}
        strokeLinecap="round" transform={`rotate(-90 ${size/2} ${size/2})`} style={{ transition: "stroke-dashoffset 1s ease" }}/>
      <text x={size/2} y={size/2 + 1} fill={v.text} fontSize="13" fontWeight="800" textAnchor="middle" dominantBaseline="central">{value}%</text>
    </svg>
  );
};

const fmt = (n) => "$" + (n >= 1000 ? (n / 1000).toFixed(1) + "k" : n.toFixed(0));
const fmtFull = (n) => "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function Dashboard({ dark, v, t, lang }) {
  const { companyProfile } = useData();
  const { user } = useAuth();
  const { invoices, jobs, crews, clients, services } = useData();
  const d = t.dash;

  const navigate = useNavigate();
  const L = (en, es) => lang === "es" ? es : en;
  const todayStr = new Date().toISOString().split("T")[0];

  // ── Real metrics ──
  const stats = useMemo(() => {
    const todayJobs = (jobs || []).filter(j => j.date === todayStr);
    const activeCrews = (crews || []).filter(c => c.status === "onJob" || c.status === "available");
    const pendingInv = (invoices || []).filter(i => ["sent", "partial"].includes(i.status));
    const overdueInv = (invoices || []).filter(i => i.status === "overdue");
    const paidInv = (invoices || []).filter(i => i.status === "paid");
    const totalRevenue = (invoices || []).reduce((s, i) => s + (i.total || 0), 0);
    const totalPaid = paidInv.reduce((s, i) => s + (i.total || 0), 0);
    const totalOutstanding = pendingInv.reduce((s, i) => s + (i.total || 0), 0);
    const totalOverdue = overdueInv.reduce((s, i) => s + (i.total || 0), 0);
    const collectionRate = totalRevenue > 0 ? Math.round((totalPaid / totalRevenue) * 100) : 0;
    const crewUtil = (crews || []).length > 0 ? Math.round((activeCrews.length / (crews || []).length) * 100) : 0;

    return {
      todayJobs: todayJobs.length,
      todayCompleted: todayJobs.filter(j => j.status === "completed").length,
      activeCrews: activeCrews.length,
      totalCrews: (crews || []).length,
      totalOutstanding,
      pendingCount: pendingInv.length,
      totalOverdue,
      overdueCount: overdueInv.length,
      totalRevenue,
      totalPaid,
      collectionRate,
      crewUtil,
      clientCount: (clients || []).length,
      activeClients: (clients || []).filter(c => c.status === "active").length,
    };
  }, [jobs, crews, invoices, clients, todayStr]);

  // Animated values
  const animJobs = useCountUp(stats.todayJobs);
  const animCrews = useCountUp(stats.activeCrews);
  const animOutstanding = useCountUp(stats.totalOutstanding);
  const animRevenue = useCountUp(stats.totalRevenue);

  // Greeting
  const greeting = (() => {
    const h = new Date().getHours();
    return h < 12 ? L("Good morning", "Buenos días") : h < 18 ? L("Good afternoon", "Buenas tardes") : L("Good evening", "Buenas noches");
  })();



  // Today's jobs
  const todayJobs = useMemo(() => {
    return (jobs || []).filter(j => j.date === todayStr).sort((a, b) => a.time.localeCompare(b.time));
  }, [jobs, todayStr]);

  // Recent invoices
  const recentInvoices = useMemo(() => {
    return [...(invoices || [])].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
  }, [invoices]);

  // Crew map
  const crewMap = useMemo(() => {
    const m = {};
    (crews || []).forEach(c => { m[c.id] = c; });
    return m;
  }, [crews]);

  const clientMap = useMemo(() => {
    const m = {};
    (clients || []).forEach(c => { m[c.id] = c; });
    return m;
  }, [clients]);

  const statusLabel = (st) => {
    const map = { paid: { label: L("Paid","Pagado"), color: "#16A34A" }, sent: { label: L("Pending","Pendiente"), color: "#F59E0B" }, overdue: { label: L("Overdue","Vencido"), color: "#EF4444" }, draft: { label: L("Draft","Borrador"), color: "#94A3B8" }, partial: { label: L("Partial","Parcial"), color: "#D97706" } };
    return map[st] || map.draft;
  };

  const jobStatus = (st) => {
    const map = { completed: { label: L("Done","Hecho"), color: "#16A34A" }, inProgress: { label: L("Active","Activo"), color: "#3B82F6" }, assigned: { label: L("Pending","Pendiente"), color: "#94A3B8" }, cancelled: { label: L("Cancelled","Cancelado"), color: "#EF4444" } };
    return map[st] || map.assigned;
  };

  return (
    <div>
      {/* Greeting */}
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: v.text, margin: 0 }}>{greeting}, {companyProfile?.name || user?.name?.split(" ")[0] || ""}</h1>
        <p style={{ fontSize: 13, color: v.textSec, margin: "2px 0 0" }}>{d.overview}</p>
      </div>

      {/* KPI Cards — clickable */}
      <Anim delay={100} style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 14 }}>
        {[
          { label: d.todayJobs, value: Math.round(animJobs), sub: `${stats.todayCompleted} ${L("completed","completados")}`, color: "#16A34A", icon: Calendar, path: "scheduling" },
          { label: d.activeCrews, value: Math.round(animCrews) + "/" + stats.totalCrews, sub: `${stats.crewUtil}% ${L("utilization","utilización")}`, color: "#3B82F6", icon: Users, path: "crews" },
          { label: d.monthRevenue, value: "$" + Math.round(animRevenue).toLocaleString(), sub: `${stats.collectionRate}% ${L("collected","cobrado")}`, color: "#16A34A", icon: TrendingUp, path: "invoicing" },
          { label: L("Active Clients","Clientes Activos"), value: stats.activeClients + "/" + stats.clientCount, sub: L("registered","registrados"), color: "#8B5CF6", icon: Users, path: "clients" },
        ].map((k, i) => {
          const Icon = k.icon;
          return (
            <div key={i} onClick={() => navigate(k.path)} style={{ padding: "12px 14px", borderRadius: 10, background: v.cardBg, border: "1px solid " + v.border, cursor: "pointer" }} className="cy-card-hover">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontSize: 10, color: v.textSec, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>{k.label}</span>
                <Icon size={13} color={k.color}/>
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: v.text, textAlign: "center", marginBottom: 4 }}>{k.value}</div>
              <div style={{ fontSize: 10, color: k.color, fontWeight: 600, textAlign: "center" }}>{k.sub}</div>
            </div>
          );
        })}
      </Anim>

      {/* Action Cards — urgent items */}
      <Anim delay={150} style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16 }}>
        {[
          { label: L("Overdue","Vencidas"), value: fmtFull(stats.totalOverdue), sub: `${stats.overdueCount} ${L("invoices","facturas")}`, color: "#EF4444", bg: dark ? "rgba(239,68,68,0.06)" : "#FEF2F2", icon: AlertTriangle, path: "invoicing", show: stats.overdueCount > 0 },
          { label: L("Receivable","Por Cobrar"), value: fmtFull(stats.totalOutstanding), sub: `${stats.pendingCount} ${L("invoices","facturas")}`, color: "#F59E0B", bg: dark ? "rgba(245,158,11,0.06)" : "#FFFBEB", icon: DollarSign, path: "invoicing", show: stats.pendingCount > 0 },
          { label: L("Incomplete Today","Incompletos Hoy"), value: stats.todayJobs - stats.todayCompleted, sub: `${L("of","de")} ${stats.todayJobs} ${L("scheduled","programados")}`, color: "#3B82F6", bg: dark ? "rgba(59,130,246,0.06)" : "#EFF6FF", icon: Clock, path: "scheduling", show: stats.todayJobs > 0 },
          { label: L("Completion Rate","Tasa Completación"), value: stats.todayJobs > 0 ? Math.round((stats.todayCompleted / stats.todayJobs) * 100) + "%" : "—", sub: L("today","hoy"), color: "#16A34A", bg: dark ? "rgba(22,163,74,0.06)" : "#F0FDF4", icon: Target, path: "scheduling", show: true },
        ].filter(c => c.show).map((k, i) => {
          const Icon = k.icon;
          return (
            <div key={i} onClick={() => navigate(k.path)} style={{ padding: "12px 14px", borderRadius: 10, background: k.bg, border: "1px solid " + k.color + "20", cursor: "pointer" }} className="cy-card-hover">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontSize: 10, color: k.color, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>{k.label}</span>
                <Icon size={13} color={k.color}/>
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: k.color, textAlign: "center", marginBottom: 4 }}>{k.value}</div>
              <div style={{ fontSize: 10, color: k.color + "90", fontWeight: 600, textAlign: "center" }}>{k.sub}</div>
            </div>
          );
        })}
      </Anim>

      {/* Main grid: 3 columns */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 260px", gap: 14 }}>
        {/* Today's Schedule */}
        <Anim delay={200} style={{ background: v.cardBg, border: "1px solid " + v.border, borderRadius: 10, padding: "14px 16px", maxHeight: 360, display: "flex", flexDirection: "column" }} className="cy-card-hover">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: v.text }}>{d.todaySchedule}</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: "#16A34A", cursor: "pointer" }}>{d.viewAll} →</span>
          </div>
          <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
            {todayJobs.length === 0 && <div style={{ fontSize: 12, color: v.textSec, padding: "20px 0", textAlign: "center" }}>{L("No jobs scheduled","Sin trabajos programados")}</div>}
            {todayJobs.map(j => {
              const crew = crewMap[j.crewId];
              const client = clientMap[j.clientId];
              const st = jobStatus(j.status);
              const svcNames = (j.serviceIds || []).map(entry => {
                const sid = typeof entry === "object" ? entry.serviceId : entry;
                const svc = (services || []).find(s => s.id === sid);
                return svc ? (lang === "es" && svc.nameEs ? svc.nameEs : svc.name) : null;
              }).filter(Boolean);
              return (
                <div key={j.id} style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: "1px solid " + v.border + "40" }}>
                  <div style={{ width: 3, borderRadius: 2, background: crew?.color || "#94A3B8", flexShrink: 0 }}/>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 10, fontWeight: 600, color: v.textSec }}>{j.time ? (() => { const [h,m] = j.time.split(":"); const hr = parseInt(h); return (hr > 12 ? hr-12 : hr) + ":" + m + (hr >= 12 ? " PM" : " AM"); })() : ""}</span>
                      <span style={{ fontSize: 9, fontWeight: 600, padding: "1px 6px", borderRadius: 4, background: st.color + "15", color: st.color }}>{st.label}</span>
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: v.text, marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{svcNames.slice(0, 2).join(", ") || j.notes}</div>
                    <div style={{ fontSize: 10, color: v.textSec, marginTop: 1 }}>{client?.name || "—"}</div>
                    {crew && <div style={{ fontSize: 9, color: crew.color, fontWeight: 600, marginTop: 2 }}>● {crew.name}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </Anim>

        {/* Recent Invoices */}
        <Anim delay={300} style={{ background: v.cardBg, border: "1px solid " + v.border, borderRadius: 10, padding: "14px 16px", maxHeight: 360, display: "flex", flexDirection: "column" }} className="cy-card-hover">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: v.text }}>{d.recentInvoices}</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: "#16A34A", cursor: "pointer" }}>{d.viewAll} →</span>
          </div>
          <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
            {recentInvoices.length === 0 && <div style={{ fontSize: 12, color: v.textSec, padding: "20px 0", textAlign: "center" }}>{L("No invoices yet","Sin facturas")}</div>}
            {recentInvoices.map(inv => {
              const cl = clientMap[inv.clientId];
              const st = statusLabel(inv.status);
              return (
                <div key={inv.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid " + v.border + "40" }}>
                  <div style={{ width: 28, height: 28, borderRadius: 7, background: st.color + "12", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: st.color, flexShrink: 0 }}>
                    {cl?.name?.[0] || "?"}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: v.text }}>{cl?.name || "—"}</div>
                    <div style={{ fontSize: 9, color: v.textSec }}>{inv.invoiceNumber || "—"}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: v.text }}>{fmtFull(inv.total)}</div>
                    <div style={{ fontSize: 9, fontWeight: 600, color: st.color }}>{st.label}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </Anim>

        {/* Right column: Metrics */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Collection Rate */}
          <Anim delay={400} style={{ background: v.cardBg, border: "1px solid " + v.border, borderRadius: 10, padding: "14px 16px", display: "flex", alignItems: "center", gap: 14 }} className="cy-card-hover">
            <Donut value={stats.collectionRate} color="#16A34A" v={v}/>
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, color: v.textSec, textTransform: "uppercase", letterSpacing: "0.04em" }}>{d.collectionRate}</div>
              <div style={{ fontSize: 11, color: v.text, marginTop: 4 }}>{fmtFull(stats.totalPaid)} {L("of","de")} {fmtFull(stats.totalRevenue)}</div>
            </div>
          </Anim>

          {/* Crew Utilization */}
          <Anim delay={500} style={{ background: v.cardBg, border: "1px solid " + v.border, borderRadius: 10, padding: "14px 16px", display: "flex", alignItems: "center", gap: 14 }} className="cy-card-hover">
            <Donut value={stats.crewUtil} color="#3B82F6" v={v}/>
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, color: v.textSec, textTransform: "uppercase", letterSpacing: "0.04em" }}>{d.crewUtil}</div>
              <div style={{ fontSize: 11, color: v.text, marginTop: 4 }}>{stats.activeCrews}/{stats.totalCrews} {L("active","activas")}</div>
            </div>
          </Anim>

          {/* Quick stats */}
          <Anim delay={600} style={{ background: v.cardBg, border: "1px solid " + v.border, borderRadius: 10, padding: "14px 16px" }} className="cy-card-hover">
            <div style={{ fontSize: 10, fontWeight: 600, color: v.textSec, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 10 }}>{L("Quick Overview","Resumen Rápido")}</div>
            {[
              { label: L("Active Clients","Clientes Activos"), value: stats.activeClients, color: "#16A34A" },
              { label: L("Overdue","Vencido"), value: fmtFull(stats.totalOverdue), color: "#EF4444" },
              { label: L("Total Clients","Total Clientes"), value: stats.clientCount, color: "#3B82F6" },
            ].map((r, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", borderBottom: i < 2 ? "1px solid " + v.border + "40" : "none" }}>
                <span style={{ fontSize: 11, color: v.textSec }}>{r.label}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: r.color }}>{r.value}</span>
              </div>
            ))}
          </Anim>
        </div>
      </div>
    </div>
  );
}
