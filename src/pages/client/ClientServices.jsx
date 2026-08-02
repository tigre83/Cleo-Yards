import { useState, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { CheckCircle, Clock, Calendar, Leaf, AlertTriangle, Search } from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   CLIENT SERVICE HISTORY
   ═══════════════════════════════════════════════════════════════ */

const fmtDate = (d, lang) => d ? new Date(d + "T12:00").toLocaleDateString(lang === "es" ? "es-EC" : "en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" }) : "—";
const fmtTime = (t) => { if (!t) return ""; const [h, m] = t.split(":"); const hr = parseInt(h); return (hr > 12 ? hr - 12 : hr) + ":" + m + (hr >= 12 ? " PM" : " AM"); };

const statusCfg = (s, lang) => {
  const L = (en, es) => lang === "es" ? es : en;
  return {
    completed: { label: L("Completed", "Completado"), color: "#16A34A", bg: "#DCFCE7", icon: CheckCircle },
    assigned: { label: L("Scheduled", "Programado"), color: "#3B82F6", bg: "#DBEAFE", icon: Calendar },
    inProgress: { label: L("In Progress", "En Progreso"), color: "#F59E0B", bg: "#FEF3C7", icon: Clock },
    cancelled: { label: L("Cancelled", "Cancelado"), color: "#94A3B8", bg: "#F1F5F9", icon: AlertTriangle },
    rescheduled: { label: L("Rescheduled", "Reprogramado"), color: "#8B5CF6", bg: "#EDE9FE", icon: Calendar },
  }[s] || { label: s, color: "#94A3B8", bg: "#F1F5F9", icon: Clock };
};

export default function ClientServices() {
  const { dark, v, lang, jobs } = useOutletContext();
  const L = (en, es) => lang === "es" ? es : en;
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const stats = useMemo(() => ({
    total: jobs.length,
    completed: jobs.filter(j => j.status === "completed").length,
    upcoming: jobs.filter(j => j.date >= new Date().toISOString().split("T")[0] && j.status !== "cancelled" && j.status !== "rescheduled").length,
  }), [jobs]);

  const filtered = useMemo(() => {
    let list = [...jobs];
    if (filter === "completed") list = list.filter(j => j.status === "completed");
    else if (filter === "upcoming") list = list.filter(j => j.date >= new Date().toISOString().split("T")[0] && j.status !== "cancelled" && j.status !== "rescheduled");
    if (search) list = list.filter(j => (j.services || []).some(s => s.name?.toLowerCase().includes(search.toLowerCase())));
    return list;
  }, [jobs, filter, search]);

  // Group by month
  const grouped = useMemo(() => {
    const groups = {};
    filtered.forEach(j => {
      const key = j.date ? j.date.slice(0, 7) : "unknown";
      if (!groups[key]) groups[key] = [];
      groups[key].push(j);
    });
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
  }, [filtered]);

  const G = "#16A34A";
  const filters = [
    { key: "all", label: L("All", "Todos") },
    { key: "upcoming", label: L("Upcoming", "Próximos") },
    { key: "completed", label: L("Completed", "Completados") },
  ];

  const fmtMonth = (key) => {
    if (key === "unknown") return "—";
    const [y, m] = key.split("-");
    const d = new Date(parseInt(y), parseInt(m) - 1);
    return d.toLocaleDateString(lang === "es" ? "es-EC" : "en-US", { month: "long", year: "numeric" });
  };

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: v.text, fontFamily: "'Outfit', sans-serif", margin: 0 }}>{L("Service History", "Historial de Servicios")}</h1>
      <p style={{ fontSize: 13, color: v.textSec, margin: "2px 0 20px" }}>{L("All services performed at your property", "Todos los servicios realizados en tu propiedad")}</p>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: L("Total Services", "Total Servicios"), value: stats.total, color: "#3B82F6", icon: Leaf },
          { label: L("Completed", "Completados"), value: stats.completed, color: G, icon: CheckCircle },
          { label: L("Upcoming", "Próximos"), value: stats.upcoming, color: "#F59E0B", icon: Calendar },
        ].map((c, i) => (
          <div key={i} style={{ padding: "12px 16px", borderRadius: 10, background: v.cardBg, border: "1px solid " + v.border }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: v.textSec, textTransform: "uppercase", letterSpacing: "0.04em" }}>{c.label}</span>
              <c.icon size={13} color={c.color}/>
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: v.text, fontFamily: "'Outfit', sans-serif" }}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ display: "flex", borderRadius: 8, overflow: "hidden", border: "1px solid " + v.border }}>
          {filters.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              style={{ padding: "6px 14px", fontSize: 11, fontWeight: 600, border: "none", cursor: "pointer", background: filter === f.key ? G : "transparent", color: filter === f.key ? "#fff" : v.textSec, transition: "all 0.15s" }}>
              {f.label}
            </button>
          ))}
        </div>
        <div style={{ flex: 1, position: "relative", maxWidth: 260 }}>
          <Search size={14} color={v.textTer} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }}/>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={L("Search services...", "Buscar servicios...")}
            style={{ width: "100%", padding: "8px 12px 8px 32px", borderRadius: 8, border: "1px solid " + v.border, background: dark ? "rgba(255,255,255,0.04)" : v.surface, color: v.text, fontSize: 12, outline: "none", fontFamily: "'DM Sans'" }}/>
        </div>
      </div>

      {/* Grouped list */}
      {grouped.length === 0 ? (
        <div style={{ padding: 40, textAlign: "center", background: v.cardBg, border: "1px solid " + v.border, borderRadius: 12 }}>
          <Leaf size={32} color={v.textTer}/>
          <p style={{ fontSize: 14, fontWeight: 600, color: v.text, marginTop: 12 }}>{L("No services yet", "Sin servicios aún")}</p>
        </div>
      ) : grouped.map(([month, monthJobs]) => (
        <div key={month} style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: v.textSec, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8, paddingLeft: 4 }}>
            {fmtMonth(month)} ({monthJobs.length})
          </div>
          <div style={{ background: v.cardBg, border: "1px solid " + v.border, borderRadius: 12, overflow: "hidden" }}>
            {monthJobs.map((job, i) => {
              const st = statusCfg(job.status, lang);
              const svcNames = (job.services || []).map(s => s.name).join(", ") || "Service";
              return (
                <div key={job.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", borderBottom: i < monthJobs.length - 1 ? "1px solid " + v.border + "40" : "none" }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: st.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <st.icon size={16} color={st.color}/>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: v.text }}>{svcNames}</div>
                    <div style={{ fontSize: 11, color: v.textTer }}>{fmtDate(job.date, lang)}{job.time ? " · " + fmtTime(job.time) : ""}{job.duration ? " · " + job.duration + "h" : ""}</div>
                  </div>
                  <span style={{ fontSize: 9, fontWeight: 600, padding: "2px 8px", borderRadius: 4, background: st.bg, color: st.color }}>{st.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
