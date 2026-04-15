import { useState, useMemo, useRef, useEffect } from "react";
import { useData } from "../../context/DataContext";
import { Plus, ChevronLeft, ChevronRight, Calendar, Clock, CheckCircle, AlertTriangle, Users, X, Search, Trash2, Leaf, UserPlus, CalendarDays, ClipboardList, Zap } from "lucide-react";

/* ── CountUp hook ── */
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

/* ── Helpers ── */
const getWeekDates = (baseDate) => {
  const d = new Date(baseDate + "T12:00:00");
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Monday start
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  return Array.from({ length: 5 }, (_, i) => {
    const dt = new Date(monday);
    dt.setDate(monday.getDate() + i);
    return dt.toISOString().split("T")[0];
  });
};

const fmtDayHeader = (dateStr, lang) => {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString(lang === "es" ? "es-EC" : "en-US", { weekday: "long", month: "short", day: "numeric" });
};

const fmtTime = (time) => {
  if (!time) return "";
  const [h, m] = time.split(":");
  const hour = parseInt(h);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return h12 + ":" + m + " " + ampm;
};

const isToday = (dateStr) => dateStr === new Date().toISOString().split("T")[0];

const statusConfig = (s, lang) => {
  const labels = {
    completed:  { en: "Completed",   es: "Completado",  color: "#16A34A", bg: "#F0FDF4", darkBg: "rgba(22,163,74,0.12)" },
    inProgress: { en: "In Progress", es: "En Progreso", color: "#3B82F6", bg: "#EFF6FF", darkBg: "rgba(59,130,246,0.12)" },
    assigned:   { en: "Assigned",    es: "Asignado",    color: "#94A3B8", bg: "#F8FAFC", darkBg: "rgba(148,163,184,0.08)" },
    cancelled:  { en: "Cancelled",   es: "Cancelado",   color: "#EF4444", bg: "#FEF2F2", darkBg: "rgba(239,68,68,0.12)" },
  };
  const cfg = labels[s] || labels.assigned;
  return { label: lang === "es" ? cfg.es : cfg.en, color: cfg.color, bg: cfg.bg, darkBg: cfg.darkBg };
};

/* ── Client Picker with search ── */
function ClientPicker({ clients, value, onChange, v, dark, lang, inputStyle, onCreateClient }) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selected = (clients || []).find(c => c.id === value);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return clients || [];
    const q = search.toLowerCase();
    return (clients || []).filter(c => c.name.toLowerCase().includes(q) || (c.address || "").toLowerCase().includes(q));
  }, [search, clients]);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <div style={{ position: "relative" }}>
        <input value={selected ? selected.name : search}
          onChange={e => { setSearch(e.target.value); onChange(""); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder={lang === "es" ? "Buscar cliente..." : "Search client..."}
          style={{ ...inputStyle, paddingRight: value ? 32 : 12 }}/>
        {value && (
          <button onMouseDown={e => { e.preventDefault(); onChange(""); setSearch(""); setOpen(true); }}
            style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 2 }}>
            <X size={14} color={v.textSec}/>
          </button>
        )}
      </div>
      {open && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, marginTop: 4, background: v.cardBg,
          border: "1px solid " + v.border, borderRadius: 8, boxShadow: "0 8px 24px rgba(0,0,0,0.15)", zIndex: 20,
          maxHeight: 200, overflowY: "auto" }}>
          {onCreateClient && (
            <div onClick={() => { onCreateClient(); setOpen(false); }}
              style={{ padding: "10px 12px", cursor: "pointer", borderBottom: "1px solid " + v.border, display: "flex", alignItems: "center", gap: 6, transition: "background 0.1s" }}
              onMouseEnter={e => e.currentTarget.style.background = dark ? "rgba(22,163,74,0.08)" : "#F0FDF4"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <UserPlus size={13} color="#16A34A"/>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#16A34A" }}>{lang === "es" ? "Crear nuevo cliente" : "Create new client"}</span>
            </div>
          )}
          {filtered.map(cl => (
            <div key={cl.id} onClick={() => { onChange(cl.id); setSearch(""); setOpen(false); }}
              style={{ padding: "8px 12px", cursor: "pointer", fontSize: 12, color: v.text, transition: "background 0.1s" }}
              onMouseEnter={e => e.currentTarget.style.background = dark ? "rgba(255,255,255,0.04)" : "#F8FAFC"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <div style={{ fontWeight: 600 }}>{cl.name}</div>
              {cl.address && <div style={{ fontSize: 10, color: v.textSec, marginTop: 1 }}>{cl.address}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const categories = { maintenance: { en: "Maintenance", es: "Mantenimiento", color: "#16A34A" }, improvements: { en: "Improvements", es: "Mejoras", color: "#3B82F6" }, installation: { en: "Installation", es: "Instalación", color: "#8B5CF6" }, specials: { en: "Specials", es: "Especiales", color: "#F59E0B" } };

export default function Scheduling({ dark, v, t, lang }) {
  const { jobs, crews, clients, services, getJobsByDate, addJob, updateJob, deleteJob, addClient, generateMonthlyJobs } = useData();
  const s = t.sched;

  const [view, setView] = useState("week"); // "week" | "form"
  const [editJob, setEditJob] = useState(null);
  const [showNewClient, setShowNewClient] = useState(false);
  const [toast, setToast] = useState(null);
  const [genConfirm, setGenConfirm] = useState(null);
  const [svcTab, setSvcTab] = useState("maintenance");
  const [newClientForm, setNewClientForm] = useState(null);
  const [weekBase, setWeekBase] = useState(new Date().toISOString().split("T")[0]);

  // Calculate pending jobs to generate
  const pendingGenCount = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const daysInMonth = new Date(year, month, 0).getDate();
    const weekdays = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dt = new Date(year, month - 1, d);
      if (dt.getDay() >= 1 && dt.getDay() <= 5) weekdays.push(dt.toISOString().split("T")[0]);
    }
    const monthlyClients = (clients || []).filter(cl => cl.billingType === "monthly" && cl.defaultCrewId && cl.status === "active");
    let count = 0;
    monthlyClients.forEach(cl => {
      (cl.services || []).forEach(cs => {
        const svcId = typeof cs === "string" ? cs : cs.serviceId;
        const qty = typeof cs === "string" ? 1 : (cs.qty || 1);
        const spacing = Math.max(1, Math.floor(weekdays.length / qty));
        for (let i = 0; i < qty; i++) {
          const dayIdx = Math.min(i * spacing, weekdays.length - 1);
          const dateStr = weekdays[dayIdx];
          const exists = (jobs || []).some(j => j.clientId === cl.id && j.date === dateStr && (j.serviceIds || []).some(s => (typeof s === "object" ? s.serviceId : s) === svcId));
          if (!exists) count++;
        }
      });
    });
    return count;
  }, [clients, jobs]);
  const weekDates = useMemo(() => getWeekDates(weekBase), [weekBase]);

  const prevWeek = () => {
    const d = new Date(weekDates[0] + "T12:00:00");
    d.setDate(d.getDate() - 7);
    setWeekBase(d.toISOString().split("T")[0]);
  };
  const nextWeek = () => {
    const d = new Date(weekDates[0] + "T12:00:00");
    d.setDate(d.getDate() + 7);
    setWeekBase(d.toISOString().split("T")[0]);
  };
  const goToday = () => setWeekBase(new Date().toISOString().split("T")[0]);

  // Week jobs
  const weekJobs = useMemo(() => {
    return jobs.filter(j => weekDates.includes(j.date));
  }, [jobs, weekDates]);

  // Stats
  const todayStr = new Date().toISOString().split("T")[0];
  const todayJobs = jobs.filter(j => j.date === todayStr).length;
  const weekTotal = weekJobs.length;
  const completedCount = weekJobs.filter(j => j.status === "completed").length;
  const completionRate = weekTotal > 0 ? Math.round((completedCount / weekTotal) * 100) : 0;
  const unassigned = weekJobs.filter(j => !j.crewId).length;

  const animToday = useCountUp(todayJobs);
  const animWeek = useCountUp(weekTotal);
  const animRate = useCountUp(completionRate);
  const animUnassigned = useCountUp(unassigned);

  // Crew color map
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


  // ── Form handlers ──
  const openNewJob = (date) => {
    setEditJob({ clientId: "", serviceIds: [], crewId: "", date: date || new Date().toISOString().split("T")[0], time: "08:00", duration: 1, notes: "", status: "assigned" });
    setView("form");
  };
  const openEditJob = (job) => { setEditJob({ ...job }); setView("form"); };
  const closeForm = () => { setView("week"); setEditJob(null); };

  const handleSaveJob = () => {
    if (!editJob.clientId || !editJob.crewId || !editJob.date || !editJob.time) return;
    if (editJob.id) {
      updateJob(editJob.id, editJob);
    } else {
      addJob(editJob);
    }
    closeForm();
  };

  const handleDeleteJob = () => {
    if (editJob.id) deleteJob(editJob.id);
    closeForm();
  };

  // ── Form view ──
  if (view === "form") {
    const selectedClient = (clients || []).find(cl => cl.id === editJob.clientId);
    const selectedCrew = (crews || []).find(cr => cr.id === editJob.crewId);
    const L = (en, es) => lang === "es" ? es : en;
    const inputStyle = { width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid " + v.border, background: dark ? "rgba(255,255,255,0.04)" : v.surface, color: v.text, fontSize: 13, outline: "none", fontFamily: "'DM Sans', sans-serif" };
    const labelStyle = { fontSize: 11, fontWeight: 600, color: v.textSec, textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: 4 };

    return (
      <>
      <div>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <button onClick={closeForm} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: 6, border: "1px solid " + v.border, background: v.cardBg, cursor: "pointer" }}>
            <ChevronLeft size={16} color={v.text}/>
          </button>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: v.text, margin: 0 }}>{editJob.id ? L("Edit Job", "Editar Trabajo") : L("New Job", "Nuevo Trabajo")}</h1>
            {editJob.id && <span style={{ fontSize: 13, color: v.textSec }}>{editJob.id}</span>}
          </div>
          {editJob.id && (
            <button onClick={handleDeleteJob} style={{ padding: "8px 14px", borderRadius: 6, border: "1px solid #DC262640", background: "transparent", color: "#DC2626", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
              <Trash2 size={13}/> {L("Delete", "Eliminar")}
            </button>
          )}
          <button onClick={handleSaveJob} style={{ padding: "10px 20px", borderRadius: 10, background: "linear-gradient(135deg, #16A34A, #22C55E)", border: "none", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", boxShadow: "0 2px 8px rgba(22,163,74,0.3)" }}>
            {editJob.id ? L("Save Changes", "Guardar Cambios") : L("Create Job", "Crear Trabajo")}
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20, alignItems: "start" }}>
          {/* Left — Form */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Client */}
            <div style={{ background: v.cardBg, border: "1px solid " + v.border, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: v.text, marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
                <Users size={14} color="#16A34A"/> {L("Client", "Cliente")}
              </div>
              <ClientPicker clients={clients} value={editJob.clientId} onCreateClient={() => { setShowNewClient(true); setNewClientForm({ name: "", email: "", phone: "", areaCode: "", street: "", city: "", state: "", zip: "", paymentMethod: "zelle", zellePhone: "", billingType: "per_visit", services: [], notes: "" }); }} onChange={(id) => {
                setEditJob(p => ({ ...p, clientId: id }));
                const cl = (clients || []).find(c => c.id === id);
                if (cl?.services?.length && !editJob.serviceIds?.length) {
                  setEditJob(p => ({ ...p, clientId: id, serviceIds: cl.services }));
                }
              }} v={v} dark={dark} lang={lang} inputStyle={inputStyle}/>
              {selectedClient && (
                <div style={{ marginTop: 10, padding: "8px 10px", background: dark ? "rgba(255,255,255,0.02)" : "#F8FAF9", borderRadius: 6, fontSize: 11, color: v.textSec, lineHeight: 1.6 }}>
                  <strong>{selectedClient.name}</strong>
                  {selectedClient.address && <div>{selectedClient.address}</div>}
                  {selectedClient.phone && <div>{selectedClient.phone}</div>}
                </div>
              )}
            </div>

            {/* Services */}
            <div style={{ background: v.cardBg, border: "1px solid " + v.border, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: v.text, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                <Leaf size={14} color="#16A34A"/> {L("Services", "Servicios")}
              </div>
              {/* Category tabs */}
              <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                {Object.entries(categories).map(([key, cat]) => {
                  const cnt = (services || []).filter(s => s.active && s.category === key).length;
                  const sel = (services || []).filter(s => s.active && s.category === key && (editJob.serviceIds || []).some(x => (typeof x === "object" ? x.serviceId : x) === s.id)).length;
                  return (
                    <button key={key} onClick={() => setSvcTab(key)}
                      style={{ flex: 1, padding: "6px 4px", borderRadius: 6, fontSize: 9, whiteSpace: "nowrap", fontWeight: 600,
                        border: "1px solid " + (svcTab === key ? cat.color : v.border),
                        background: svcTab === key ? cat.color + (dark ? "15" : "08") : "transparent",
                        color: svcTab === key ? cat.color : v.textSec, cursor: "pointer", textAlign: "center" }}>
                      {cat[lang]} ({cnt}){sel > 0 && <span style={{ marginLeft: 2, fontSize: 7, padding: "0 4px", borderRadius: 4, background: cat.color, color: "#fff" }}>{sel}</span>}
                    </button>
                  );
                })}
              </div>
              {/* Services in category */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {(services || []).filter(svc => svc.active && svc.category === svcTab).map(svc => {
                  const svcEntry = (editJob.serviceIds || []).find(s => typeof s === "object" ? s.serviceId === svc.id : s === svc.id);
                  const qty = svcEntry ? (typeof svcEntry === "object" ? svcEntry.qty || 1 : 1) : 0;
                  const sel = qty > 0;
                  const cc = categories[svc.category]?.color || "#16A34A";
                  const updateQty = (newQty) => {
                    setEditJob(p => {
                      const ids = p.serviceIds || [];
                      if (newQty <= 0) return { ...p, serviceIds: ids.filter(s => (typeof s === "object" ? s.serviceId : s) !== svc.id) };
                      const exists = ids.find(s => (typeof s === "object" ? s.serviceId : s) === svc.id);
                      if (exists) return { ...p, serviceIds: ids.map(s => (typeof s === "object" ? s.serviceId : s) === svc.id ? { serviceId: svc.id, qty: newQty } : s) };
                      return { ...p, serviceIds: [...ids, { serviceId: svc.id, qty: newQty }] };
                    });
                  };
                  return (
                    <div key={svc.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", borderRadius: 6, background: sel ? cc + "08" : "transparent", border: "1px solid " + (sel ? cc + "30" : v.border + "50"), transition: "all 0.12s" }}>
                      <span style={{ fontSize: 12, fontWeight: sel ? 600 : 400, color: sel ? v.text : v.textSec, flex: 1 }}>{lang === "es" && svc.nameEs ? svc.nameEs : svc.name}</span>
                      <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                        <button onClick={() => { if (qty > 0) updateQty(qty - 1); }}
                          style={{ width: 22, height: 22, borderRadius: 4, border: "1px solid " + (qty > 0 ? cc + "40" : v.border), background: qty > 0 ? cc + "08" : "transparent", cursor: qty > 0 ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: qty > 0 ? cc : v.textSec, fontWeight: 700, opacity: qty > 0 ? 1 : 0.4 }}>−</button>
                        <span style={{ fontSize: 12, fontWeight: 700, color: sel ? cc : v.textSec, minWidth: 22, textAlign: "center" }}>{qty}</span>
                        <button onClick={() => updateQty(qty + 1)}
                          style={{ width: 22, height: 22, borderRadius: 4, border: "1px solid " + cc + "40", background: cc + "08", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: cc, fontWeight: 700 }}>+</button>
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: sel ? cc : v.textSec, minWidth: 55, textAlign: "right" }}>{sel ? "$" + (svc.price * qty) : "$" + svc.price}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Notes */}
            <div style={{ background: v.cardBg, border: "1px solid " + v.border, borderRadius: 12, padding: 20 }}>
              <label style={labelStyle}>{L("Notes", "Notas")}</label>
              <textarea value={editJob.notes || ""} onChange={e => setEditJob(p => ({ ...p, notes: e.target.value }))}
                rows={3} placeholder={L("Special instructions...", "Instrucciones especiales...")}
                style={{ ...inputStyle, resize: "vertical", lineHeight: 1.5 }}/>
            </div>
          </div>

          {/* Right — Date, Time, Crew */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16, position: "sticky", top: 20 }}>
            {/* Date & Time */}
            <div style={{ background: v.cardBg, border: "1px solid " + v.border, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: v.text, marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
                <Calendar size={14} color="#16A34A"/> {L("Schedule", "Programar")}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div>
                  <label style={labelStyle}>{L("Date", "Fecha")}</label>
                  <input type="date" value={editJob.date} onChange={e => setEditJob(p => ({ ...p, date: e.target.value }))} style={inputStyle}/>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>{L("Start Time", "Hora Inicio")}</label>
                    <input type="time" value={editJob.time} onChange={e => setEditJob(p => ({ ...p, time: e.target.value }))} style={inputStyle}/>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>{L("Duration (hrs)", "Duración (hrs)")}</label>
                    <input type="number" min="0.5" max="12" step="0.5" value={editJob.duration} onChange={e => setEditJob(p => ({ ...p, duration: parseFloat(e.target.value) || 1 }))} style={{ ...inputStyle, textAlign: "center" }}/>
                  </div>
                </div>
              </div>
            </div>

            {/* Crew */}
            <div style={{ background: v.cardBg, border: "1px solid " + v.border, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: v.text, marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
                <Users size={14} color="#16A34A"/> {L("Assign Crew", "Asignar Cuadrilla")}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {(crews || []).map(cr => {
                  const sel = editJob.crewId === cr.id;
                  const busyJobs = jobs.filter(j => j.crewId === cr.id && j.date === editJob.date && j.id !== editJob.id);
                  return (
                    <div key={cr.id} onClick={() => setEditJob(p => ({ ...p, crewId: cr.id }))}
                      style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 8, cursor: "pointer",
                        border: "2px solid " + (sel ? cr.color : v.border), background: sel ? cr.color + "10" : "transparent", transition: "all 0.15s" }}>
                      <div style={{ width: 10, height: 10, borderRadius: "50%", background: cr.color, flexShrink: 0 }}/>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: v.text }}>{cr.name}</div>
                        <div style={{ fontSize: 10, color: v.textSec }}>{cr.leader} · {cr.members.length} {L("members", "miembros")}</div>
                      </div>
                      {busyJobs.length > 0 && (
                        <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: "#FEF3C7", color: "#D97706", fontWeight: 600 }}>
                          {busyJobs.length} {L("jobs", "trabajos")}
                        </span>
                      )}
                      {sel && <CheckCircle size={14} color={cr.color}/>}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Summary */}
            {selectedClient && editJob.crewId && (
              <div style={{ background: "#16A34A10", border: "1px solid #16A34A30", borderRadius: 12, padding: "14px 16px" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#16A34A", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
                  {L("Summary", "Resumen")}
                </div>
                <div style={{ fontSize: 12, color: v.text, lineHeight: 1.7 }}>
                  <div><strong>{selectedClient.name}</strong></div>
                  <div>{selectedCrew?.name} · {editJob.date} · {fmtTime(editJob.time)}</div>
                  <div>{(editJob.serviceIds || []).filter(s => typeof s === "object" ? s.qty > 0 : true).length} {L("services", "servicios")} · {editJob.duration}h</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ position:"fixed", bottom:24, right:24, padding:"12px 20px", borderRadius:8,
          background:"#16A34A", color:"#FFF", fontSize:13, fontWeight:600,
          fontFamily:"'DM Sans',sans-serif", boxShadow:"0 4px 12px rgba(22,163,74,0.3)",
          display:"flex", alignItems:"center", gap:8, zIndex:100,
          animation:"schToast 0.3s ease" }}>
          <span>✓</span> {toast}
        </div>
      )}
      <style>{`@keyframes schToast { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }`}</style>

      {/* New Client Modal */}
      {showNewClient && newClientForm && (() => {
      const L = (en, es) => lang === "es" ? es : en;
      const capitalize = (str) => str.replace(/\b\w/g, c => c.toUpperCase());
      const isValidEmail = (em) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em);
      const mInput = { width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid " + v.border, background: dark ? "rgba(255,255,255,0.04)" : v.surface, color: v.text, fontSize: 12, outline: "none", fontFamily: "'DM Sans', sans-serif" };
      const mLabel = { fontSize: 10, fontWeight: 600, color: v.textSec, textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: 3 };
      const f = newClientForm;
      const setF = (data) => setNewClientForm(p => ({ ...p, ...data }));
      
      const saveNewClient = () => {
        if (!f.name || !f.email || !f.areaCode || !f.phone || !f.street || !f.city || !f.state || !f.zip) return;
        const newCl = addClient({
          name: capitalize(f.name),
          email: f.email,
          phone: "(" + f.areaCode + ") " + f.phone,
          address: [f.street, f.city, f.state + " " + f.zip].filter(Boolean).join(", "),
          paymentMethod: f.paymentMethod,
          zellePhone: f.zellePhone,
          billingType: f.billingType,
          services: f.services,
          notes: f.notes,
        });
        if (newCl?.id) {
          setEditJob(p => ({ ...p, clientId: newCl.id }));
        }
        setShowNewClient(false);
        setNewClientForm(null);
      };

      return (
        <div onClick={() => setShowNewClient(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
          <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 560, maxHeight: "90vh", background: v.cardBg, borderRadius: 16, border: "1px solid " + v.border, boxShadow: "0 24px 64px rgba(0,0,0,0.25)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
            {/* Header */}
            <div style={{ padding: "18px 24px 14px", borderBottom: "1px solid " + v.border, display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
              <UserPlus size={18} color="#16A34A"/>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: v.text }}>{L("New Client", "Nuevo Cliente")}</div>
                <div style={{ fontSize: 11, color: v.textSec }}>{L("Fill in client details", "Completa los datos del cliente")}</div>
              </div>
              <button onClick={() => setShowNewClient(false)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                <X size={16} color={v.textSec}/>
              </button>
            </div>

            {/* Scrollable body */}
            <div style={{ flex: 1, overflowY: "auto", padding: "18px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Name + Email */}
              <div style={{ display: "flex", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={mLabel}>{L("Name", "Nombre")} *</label>
                  <input value={f.name} onChange={e => setF({ name: capitalize(e.target.value) })} placeholder="John Smith" style={mInput}/>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={mLabel}>Email *</label>
                  <div style={{ position: "relative" }}>
                    <input value={f.email} onChange={e => setF({ email: e.target.value.replace(/,/g, ".") })} placeholder="john@email.com"
                      style={{ ...mInput, borderColor: f.email && isValidEmail(f.email) ? "#16A34A" : f.email && !isValidEmail(f.email) ? "#EF4444" : v.border, paddingRight: 28 }}/>
                    {f.email && <span style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", fontSize: 12, fontWeight: 700, color: isValidEmail(f.email) ? "#16A34A" : "#EF4444" }}>{isValidEmail(f.email) ? "✓" : "✗"}</span>}
                  </div>
                </div>
              </div>

              {/* Phone */}
              <div style={{ display: "flex", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={mLabel}>{L("Phone", "Teléfono")} *</label>
                  <div style={{ display: "flex", gap: 6 }}>
                    <input value={f.areaCode} onChange={e => setF({ areaCode: e.target.value.replace(/[^0-9]/g, "").slice(0, 3) })} placeholder="512" style={{ ...mInput, width: 60, textAlign: "center" }}/>
                    <input value={f.phone} onChange={e => { let val = e.target.value.replace(/[^0-9]/g, ""); if (val.length > 3) val = val.slice(0, 3) + "-" + val.slice(3); setF({ phone: val.slice(0, 8) }); }} placeholder="555-0100" style={{ ...mInput, flex: 1 }}/>
                  </div>
                </div>
                <div style={{ width: 140 }}>
                  <label style={mLabel}>{L("Payment", "Pago")} *</label>
                  <select value={f.paymentMethod} onChange={e => setF({ paymentMethod: e.target.value })}
                    style={{ ...mInput, cursor: "pointer", appearance: "none", backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%237A8F82' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center" }}>
                    <option value="zelle">Zelle</option>
                    <option value="cash">{L("Cash", "Efectivo")}</option>
                  </select>
                </div>
              </div>

              {/* Address */}
              <div>
                <label style={mLabel}>{L("Street", "Calle")} *</label>
                <input value={f.street} onChange={e => setF({ street: capitalize(e.target.value) })} placeholder="742 Evergreen Terrace" style={mInput}/>
              </div>

              {/* City, State, ZIP */}
              <div style={{ display: "flex", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={mLabel}>{L("City", "Ciudad")} *</label>
                  <input value={f.city} onChange={e => setF({ city: capitalize(e.target.value) })} placeholder="Austin" style={mInput}/>
                </div>
                <div style={{ width: 70 }}>
                  <label style={mLabel}>{L("State", "Estado")} *</label>
                  <input value={f.state} onChange={e => setF({ state: e.target.value.toUpperCase().slice(0, 2) })} placeholder="TX" style={mInput} maxLength={2}/>
                </div>
                <div style={{ width: 80 }}>
                  <label style={mLabel}>ZIP *</label>
                  <div style={{ position: "relative" }}>
                    <input value={f.zip} onChange={e => setF({ zip: e.target.value.replace(/[^0-9]/g, "").slice(0, 5) })} placeholder="78701" style={{ ...mInput, borderColor: f.zip?.length === 5 ? "#16A34A" : f.zip?.length > 0 ? "#EF4444" : v.border, paddingRight: 22 }} maxLength={5}/>
                    {f.zip && <span style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", fontSize: 10, fontWeight: 700, color: f.zip.length === 5 ? "#16A34A" : "#EF4444" }}>{f.zip.length === 5 ? "✓" : "✗"}</span>}
                  </div>
                </div>
              </div>

              {/* Billing Type */}
              <div>
                <label style={mLabel}>{L("Billing Type", "Tipo de Facturación")}</label>
                <div style={{ display: "flex", gap: 8 }}>
                  {[
                    { key: "monthly", label: L("Monthly", "Mensual"), Icon: CalendarDays },
                    { key: "per_visit", label: L("Per Visit", "Por Visita"), Icon: ClipboardList },
                  ].map(bt => {
                    const sel = f.billingType === bt.key;
                    return (
                      <div key={bt.key} onClick={() => setF({ billingType: bt.key })}
                        style={{ flex: 1, padding: "8px 10px", borderRadius: 6, cursor: "pointer", border: "2px solid " + (sel ? "#16A34A" : v.border), background: sel ? (dark ? "rgba(22,163,74,0.08)" : "#DCFCE7") : "transparent", display: "flex", alignItems: "center", gap: 6, transition: "all 0.15s" }}>
                        <bt.Icon size={13} color={sel ? "#16A34A" : v.textSec}/>
                        <span style={{ fontSize: 11, fontWeight: 600, color: sel ? "#16A34A" : v.text }}>{bt.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label style={mLabel}>{L("Notes", "Notas")}</label>
                <input value={f.notes} onChange={e => setF({ notes: e.target.value })} placeholder={L("Special instructions...", "Instrucciones especiales...")} style={mInput}/>
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: "14px 24px", borderTop: "1px solid " + v.border, display: "flex", justifyContent: "flex-end", gap: 10, flexShrink: 0 }}>
              <button onClick={() => setShowNewClient(false)} style={{ padding: "9px 18px", borderRadius: 8, border: "1px solid " + v.border, background: "transparent", color: v.text, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                {L("Cancel", "Cancelar")}
              </button>
              <button onClick={saveNewClient} style={{ padding: "9px 18px", borderRadius: 8, border: "none", background: "linear-gradient(135deg, #16A34A, #22C55E)", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, boxShadow: "0 2px 8px rgba(22,163,74,0.3)" }}>
                <UserPlus size={13}/> {L("Create & Select", "Crear y Seleccionar")}
              </button>
            </div>
          </div>
        </div>
      );
      })()}
      </>
    );
  }

    return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: v.text, margin: 0 }}>{s.title}</h1>
          <p style={{ fontSize: 13, color: v.textSec, margin: "2px 0 0" }}>{s.sub}</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => {
            const now = new Date();
            const year = now.getFullYear();
            const month = now.getMonth() + 1;
            const monthlyClients = (clients || []).filter(cl => cl.billingType === "monthly" && cl.defaultCrewId && cl.status === "active");
            let totalJobs = 0;
            const preview = [];
            const daysInMonth = new Date(year, month, 0).getDate();
            const weekdays = [];
            for (let d = 1; d <= daysInMonth; d++) {
              const dt = new Date(year, month - 1, d);
              if (dt.getDay() >= 1 && dt.getDay() <= 5) weekdays.push(dt.toISOString().split("T")[0]);
            }
            monthlyClients.forEach(cl => {
              const crew = (crews || []).find(cr => cr.id === cl.defaultCrewId);
              let clientJobs = 0;
              (cl.services || []).forEach(cs => {
                const svcId = typeof cs === "string" ? cs : cs.serviceId;
                const qty = typeof cs === "string" ? 1 : (cs.qty || 1);
                const spacing = Math.max(1, Math.floor(weekdays.length / qty));
                for (let i = 0; i < qty; i++) {
                  const dayIdx = Math.min(i * spacing, weekdays.length - 1);
                  const dateStr = weekdays[dayIdx];
                  const exists = (jobs || []).some(j => j.clientId === cl.id && j.date === dateStr && (j.serviceIds || []).some(s => (typeof s === "object" ? s.serviceId : s) === svcId));
                  if (!exists) clientJobs++;
                }
              });
              totalJobs += clientJobs;
              if (clientJobs > 0) preview.push({ name: cl.name, jobs: clientJobs, crew: crew?.name || "—", color: crew?.color || "#94A3B8" });
            });
            const monthName = new Date(year, month - 1).toLocaleDateString(lang === "es" ? "es-EC" : "en-US", { month: "long", year: "numeric" });
            setGenConfirm({ year, month, total: totalJobs, preview, monthName });
          }} style={{ padding: "10px 16px", borderRadius: 10, border: "2px solid #16A34A", background: "transparent", color: "#16A34A", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            <Zap size={14}/> {lang === "es" ? "Generar Mes" : "Generate Month"}
            {pendingGenCount > 0 && <span style={{ padding: "1px 6px", borderRadius: 10, background: "#16A34A", color: "#fff", fontSize: 9, fontWeight: 700, minWidth: 16, textAlign: "center" }}>{pendingGenCount}</span>}
          </button>
          <button onClick={() => openNewJob()} style={{ padding: "10px 20px", borderRadius: 10, background: "linear-gradient(135deg, #16A34A, #22C55E)", border: "none", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", boxShadow: "0 2px 8px rgba(22,163,74,0.3)", display: "flex", alignItems: "center", gap: 6 }}>
            <Plus size={15}/> {lang === "es" ? "Trabajo Puntual" : "One-time Job"}
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 20 }}>
        {[
          { label: s.jobsToday, value: Math.round(animToday), color: "#16A34A", icon: Calendar },
          { label: s.jobsWeek, value: Math.round(animWeek), color: "#3B82F6", icon: Clock },
          { label: s.completionRate, value: Math.round(animRate) + "%", color: "#22C55E", icon: CheckCircle },
          { label: s.unassigned, value: Math.round(animUnassigned), color: "#94A3B8", icon: AlertTriangle },
        ].map((k, i) => {
          const Icon = k.icon;
          return (
            <div key={i} style={{ padding: "10px 14px", borderRadius: 10, background: v.cardBg, border: "1px solid " + v.border }} className="cy-card-hover">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontSize: 10, color: v.textSec, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>{k.label}</span>
                <Icon size={13} color={k.color}/>
              </div>
              <span style={{ fontSize: 18, fontWeight: 800, color: k.color, display:"block", textAlign:"center" }}>{k.value}</span>
            </div>
          );
        })}
      </div>

      {/* Week navigation */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <button onClick={prevWeek} style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid " + v.border, background: v.cardBg, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <ChevronLeft size={16} color={v.textSec}/>
        </button>
        <button onClick={goToday} style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid #16A34A", background: "transparent", color: "#16A34A", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
          {s.today}
        </button>
        <button onClick={nextWeek} style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid " + v.border, background: v.cardBg, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <ChevronRight size={16} color={v.textSec}/>
        </button>
        <span style={{ fontSize: 13, fontWeight: 600, color: v.text, marginLeft: 8 }}>
          {fmtDayHeader(weekDates[0], lang)} — {fmtDayHeader(weekDates[4], lang)}
        </span>
      </div>

      {/* Week grid */}
      <div style={{ borderRadius: 14, border: "1px solid " + v.border, overflow: "hidden", background: v.cardBg }}>
        {/* Day headers */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", borderBottom: "1px solid " + v.border }}>
          {weekDates.map((date, i) => {
            const today = isToday(date);
            return (
              <div key={i} style={{ padding: "12px 14px", borderRight: i < 4 ? "1px solid " + v.border : "none", fontSize: 12, fontWeight: 700, color: today ? "#16A34A" : v.textSec, textTransform: "uppercase", letterSpacing: "0.04em", background: today ? (dark ? "rgba(22,163,74,0.06)" : "rgba(22,163,74,0.03)") : "transparent" }}>
                {fmtDayHeader(date, lang)}
                <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 400, color: v.textSec }}>
                  ({jobs.filter(j => j.date === date).length})
                </span>
              </div>
            );
          })}
        </div>

        {/* Job cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", minHeight: 400 }}>
          {weekDates.map((date, dayIdx) => {
            const dayJobs = jobs.filter(j => j.date === date).sort((a, b) => a.time.localeCompare(b.time));
            const today = isToday(date);
            return (
              <div key={dayIdx} style={{ borderRight: dayIdx < 4 ? "1px solid " + v.border : "none", padding: 8, background: today ? (dark ? "rgba(22,163,74,0.03)" : "rgba(22,163,74,0.015)") : "transparent" }}>
                {dayJobs.map(j => {
                  const st = statusConfig(j.status, lang);
                  const crew = crewMap[j.crewId];
                  const client = clientMap[j.clientId];
                  return (
                    <div key={j.id} className="cy-card-hover" style={{ padding: "8px 10px", borderRadius: 8, marginBottom: 6, background: dark ? "rgba(255,255,255,0.03)" : v.surface, border: "1px solid " + v.border, cursor: "pointer", borderLeft: "3px solid " + (crew?.color || "#94A3B8"), transition: "all 0.15s" }} onClick={() => openEditJob(j)}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: v.textSec }}>{fmtTime(j.time)}</span>
                        <span style={{ fontSize: 9, fontWeight: 600, padding: "2px 6px", borderRadius: 4, background: dark ? st.darkBg : st.bg, color: st.color }}>{st.label}</span>
                      </div>
                      {(() => {
                        const svcNames = (j.serviceIds || []).map(entry => {
                          const sid = typeof entry === "object" ? entry.serviceId : entry;
                          const svc = services.find(s => s.id === sid);
                          if (!svc) return null;
                          return lang === "es" && svc.nameEs ? svc.nameEs : svc.name;
                        }).filter(Boolean);
                        return <p style={{ fontSize: 12, fontWeight: 600, color: v.text, marginBottom: 2 }}>{svcNames.length > 0 ? svcNames.join(", ") : j.notes || "Job"}</p>;
                      })()}
                      <p style={{ fontSize: 11, color: v.textTer }}>{client?.name || "—"}</p>
                      {crew && <p style={{ fontSize: 10, color: crew.color, fontWeight: 600, marginTop: 4 }}>● {crew.name}</p>}
                      {j.duration && <span style={{ fontSize: 9, color: v.textSec }}>{j.duration >= 1 ? Math.floor(j.duration) + "h" : ""}{j.duration % 1 ? " " + Math.round((j.duration % 1) * 60) + "m" : ""}</span>}
                    </div>
                  );
                })}
                {dayJobs.length === 0 && (
                  <div style={{ padding: "20px 8px", textAlign: "center", fontSize: 11, color: v.textTer }}>
                    {lang === "es" ? "Sin trabajos" : "No jobs"}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>


      {/* Generate Confirm Modal */}
      {genConfirm && (
        <div onClick={() => setGenConfirm(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
          <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 440, background: v.cardBg, borderRadius: 14, border: "1px solid " + v.border, boxShadow: "0 24px 64px rgba(0,0,0,0.2)", overflow: "hidden" }}>
            <div style={{ padding: "20px 24px 14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Zap size={18} color="#16A34A"/>
                <div style={{ fontSize: 16, fontWeight: 800, color: v.text }}>{lang === "es" ? "Generar Trabajos" : "Generate Jobs"}</div>
              </div>
              <div style={{ fontSize: 12, color: v.textSec, marginTop: 4 }}>
                {genConfirm.total > 0 
                  ? <>{lang === "es" ? "Se generarán" : "Will generate"} <strong style={{ color: "#16A34A" }}>{genConfirm.total} {lang === "es" ? "trabajos" : "jobs"}</strong> {lang === "es" ? "para" : "for"} <strong>{genConfirm.monthName}</strong></>
                  : <>{lang === "es" ? "Revisando" : "Reviewing"} <strong>{genConfirm.monthName}</strong></>
                }
              </div>
            </div>
            <div style={{ padding: "10px 24px 16px", maxHeight: 220, overflowY: "auto" }}>
              {genConfirm.preview.map((p, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: i < genConfirm.preview.length - 1 ? "1px solid " + v.border + "40" : "none" }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: p.color, flexShrink: 0 }}/>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: v.text }}>{p.name}</div>
                    <div style={{ fontSize: 10, color: v.textSec }}>{p.crew}</div>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#16A34A" }}>{p.jobs} {lang === "es" ? "trabajos" : "jobs"}</span>
                </div>
              ))}
              {genConfirm.total === 0 && (
                <div style={{ textAlign: "center", padding: "20px 0" }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>✓</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#16A34A" }}>{lang === "es" ? "Todo al día" : "All caught up"}</div>
                  <div style={{ fontSize: 11, color: v.textSec, marginTop: 4 }}>{lang === "es" ? "Todos los trabajos del mes ya están generados" : "All jobs for this month are already generated"}</div>
                </div>
              )}
            </div>
            <div style={{ padding: "14px 24px", borderTop: "1px solid " + v.border, display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button onClick={() => setGenConfirm(null)} style={{ padding: "9px 18px", borderRadius: 8, border: "1px solid " + v.border, background: "transparent", color: v.text, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                {lang === "es" ? "Cancelar" : "Cancel"}
              </button>
              {genConfirm.total > 0 && (
                <button onClick={() => {
                  const count = generateMonthlyJobs(genConfirm.year, genConfirm.month);
                  setGenConfirm(null);
                  setToast(count > 0 ? (lang === "es" ? count + " trabajos generados" : count + " jobs generated") : (lang === "es" ? "Sin trabajos nuevos" : "No new jobs"));
                  setTimeout(() => setToast(null), 3000);
                }} style={{ padding: "9px 18px", borderRadius: 8, border: "none", background: "linear-gradient(135deg, #16A34A, #22C55E)", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, boxShadow: "0 2px 8px rgba(22,163,74,0.3)" }}>
                  <Zap size={13}/> {lang === "es" ? "Generar " + genConfirm.total + " Trabajos" : "Generate " + genConfirm.total + " Jobs"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position:"fixed", bottom:24, right:24, padding:"12px 20px", borderRadius:8,
          background:"#16A34A", color:"#FFF", fontSize:13, fontWeight:600,
          fontFamily:"'DM Sans',sans-serif", boxShadow:"0 4px 12px rgba(22,163,74,0.3)",
          display:"flex", alignItems:"center", gap:8, zIndex:100,
          animation:"schToast2 0.3s ease" }}>
          <span>✓</span> {toast}
        </div>
      )}
      <style>{`@keyframes schToast2 { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </div>
  );
}