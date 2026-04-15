import { useState, useMemo, useRef, useEffect } from "react";
import { useData } from "../../context/DataContext";
import { Plus, ChevronLeft, Users, Phone, Star, MapPin, Clock, Trash2, X, UserPlus } from "lucide-react";

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

const capitalize = (str) => str.replace(/\b\w/g, c => c.toUpperCase());

const US_AREA_CODES = ["201","202","205","206","207","208","209","210","212","213","214","215","216","217","218","219","224","225","228","229","231","234","239","240","248","251","252","253","254","256","260","262","267","269","270","272","276","281","301","302","303","304","305","307","308","309","310","312","313","314","315","316","317","318","319","320","321","323","325","330","331","334","336","337","339","340","346","347","351","352","360","361","364","380","385","386","401","402","404","405","406","407","408","409","410","412","413","414","415","417","419","423","424","425","430","432","434","435","440","442","443","458","463","469","470","475","478","479","480","484","501","502","503","504","505","507","508","509","510","512","513","515","516","517","518","520","530","531","534","539","540","541","551","559","561","562","563","564","567","570","571","573","574","575","580","585","586","601","602","603","605","606","607","608","609","610","612","614","615","616","617","618","619","620","623","626","628","629","630","631","636","641","646","650","651","657","660","661","662","667","669","678","681","682","689","701","702","703","704","706","707","708","712","713","714","715","716","717","718","719","720","724","725","727","730","731","732","734","737","740","743","747","754","757","760","762","763","764","765","769","770","772","773","774","775","779","781","785","786","801","802","803","804","805","806","808","810","812","813","814","815","816","817","818","820","828","830","831","832","843","845","847","848","850","854","856","857","858","859","860","862","863","864","865","870","872","878","901","903","904","906","907","908","909","910","912","913","914","915","916","917","918","919","920","925","928","929","930","931","934","936","937","938","940","941","947","949","951","952","954","956","959","970","971","972","973","975","978","979","980","984","985","986","989"];

const CREW_COLORS = ["#16A34A", "#3B82F6", "#F59E0B", "#8B5CF6", "#EF4444", "#06B6D4", "#EC4899", "#F97316"];

const statusConfig = (st, lang) => {
  const map = {
    onJob:     { color: "#16A34A", en: "On Job",    es: "En Trabajo" },
    available: { color: "#3B82F6", en: "Available",  es: "Disponible" },
    offDuty:   { color: "#94A3B8", en: "Off Duty",   es: "Fuera de Turno" },
  };
  const cfg = map[st] || map.offDuty;
  return { color: cfg.color, label: lang === "es" ? cfg.es : cfg.en };
};

/* ── Area Code Picker ── */
function AreaCodePicker({ value, onChange, v, dark }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = search ? US_AREA_CODES.filter(c => c.startsWith(search)) : US_AREA_CODES;

  return (
    <div ref={ref} style={{ position: "relative", width: 80 }}>
      <div onClick={() => setOpen(!open)} style={{ padding: "10px 8px", borderRadius: 8, border: "1px solid " + v.border, background: dark ? "rgba(255,255,255,0.04)" : v.surface, color: v.text, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span>{value ? "(" + value + ")" : "Cód."}</span>
        <span style={{ fontSize: 8, color: v.textSec }}>▾</span>
      </div>
      {open && (
        <div style={{ position: "absolute", top: "100%", left: 0, width: 140, marginTop: 4, background: v.cardBg, border: "1px solid " + v.border, borderRadius: 8, boxShadow: "0 8px 24px rgba(0,0,0,0.15)", zIndex: 20, maxHeight: 180, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <input value={search} onChange={e => setSearch(e.target.value.replace(/[^0-9]/g, ""))} placeholder="Search..." autoFocus
            style={{ padding: "6px 8px", border: "none", borderBottom: "1px solid " + v.border, background: "transparent", color: v.text, fontSize: 11, outline: "none" }}/>
          <div style={{ flex: 1, overflowY: "auto" }}>
            {filtered.slice(0, 30).map(code => (
              <div key={code} onClick={() => { onChange(code); setOpen(false); setSearch(""); }}
                style={{ padding: "6px 10px", cursor: "pointer", fontSize: 12, color: code === value ? "#16A34A" : v.text, fontWeight: code === value ? 700 : 400 }}
                onMouseEnter={e => e.currentTarget.style.background = dark ? "rgba(255,255,255,0.04)" : "#F8FAFC"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                ({code})
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Crews({ dark, v, t, lang }) {
  const { crews, jobs, addCrew, updateCrew, deleteJob, clients } = useData();
  const c = t.crews;
  const L = (en, es) => lang === "es" ? es : en;

  const [view, setView] = useState("list"); // list | form | detail
  const [editCrew, setEditCrew] = useState(null);
  const [selectedCrew, setSelectedCrew] = useState(null);
  const [toast, setToast] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const todayStr = new Date().toISOString().split("T")[0];

  // Real stats
  const crewStats = useMemo(() => {
    return (crews || []).map(cr => {
      const todayJobs = (jobs || []).filter(j => j.crewId === cr.id && j.date === todayStr);
      const weekJobs = (jobs || []).filter(j => j.crewId === cr.id);
      const completed = todayJobs.filter(j => j.status === "completed").length;
      return { ...cr, todayJobs: todayJobs.length, todayCompleted: completed, weekJobs: weekJobs.length };
    });
  }, [crews, jobs, todayStr]);

  const activeNow = crewStats.filter(c => c.status !== "offDuty").length;
  const totalJobs = crewStats.reduce((s, c) => s + c.todayJobs, 0);
  const avgRating = crewStats.length > 0 ? (crewStats.reduce((s, c) => s + (c.rating || 0), 0) / crewStats.length).toFixed(1) : "—";

  const animTotal = useCountUp(crewStats.length);
  const animActive = useCountUp(activeNow);
  const animJobs = useCountUp(totalJobs);

  const clientMap = useMemo(() => {
    const m = {};
    (clients || []).forEach(c => { m[c.id] = c; });
    return m;
  }, [clients]);

  // ── Form handlers ──
  const emptyForm = { name: "", leader: "", members: [""], areaCode: "", phoneNumber: "", color: CREW_COLORS[crewStats.length % CREW_COLORS.length], status: "available", rating: 5.0 };

  const openNew = () => { setEditCrew({ ...emptyForm, color: CREW_COLORS[crewStats.length % CREW_COLORS.length] }); setView("form"); };
  const openEdit = (cr) => { const pp = (cr.phone||"").match(/\((\d{3})\)\s?(.+)/); setEditCrew({ ...cr, members: [...cr.members], areaCode: pp?pp[1]:"", phoneNumber: pp?pp[2]:"" }); setView("form"); };
  const closeForm = () => { setView("list"); setEditCrew(null); };

  const openDetail = (cr) => { setSelectedCrew(cr); setView("detail"); };

  const handleSave = () => {
    if (!editCrew.name || !editCrew.leader) return;
    const data = { ...editCrew, members: editCrew.members.filter(m => m.trim()), phone: editCrew.areaCode ? "(" + editCrew.areaCode + ") " + editCrew.phoneNumber : "" };
    if (editCrew.id) {
      updateCrew(editCrew.id, data);
      setToast(L("Crew updated", "Cuadrilla actualizada"));
    } else {
      addCrew(data);
      setToast(L("Crew created", "Cuadrilla creada"));
    }
    setTimeout(() => setToast(null), 3000);
    closeForm();
  };

  const addMember = () => setEditCrew(p => ({ ...p, members: [...p.members, ""] }));
  const updateMember = (i, val) => setEditCrew(p => ({ ...p, members: p.members.map((m, idx) => idx === i ? val : m) }));
  const removeMember = (i) => setEditCrew(p => ({ ...p, members: p.members.filter((_, idx) => idx !== i) }));

  const inputStyle = { width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid " + v.border, background: dark ? "rgba(255,255,255,0.04)" : v.surface, color: v.text, fontSize: 13, outline: "none", fontFamily: "'DM Sans', sans-serif" };
  const labelStyle = { fontSize: 11, fontWeight: 600, color: v.textSec, textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: 4 };

  // ── Form view ──
  if (view === "form" && editCrew) {
    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <button onClick={closeForm} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: 6, border: "1px solid " + v.border, background: v.cardBg, cursor: "pointer" }}>
            <ChevronLeft size={16} color={v.text}/>
          </button>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: v.text, margin: 0 }}>{editCrew.id ? L("Edit Crew", "Editar Cuadrilla") : L("New Crew", "Nueva Cuadrilla")}</h1>
          </div>
          {editCrew.id && (
            <button onClick={() => setConfirmDelete(editCrew)} style={{ padding: "10px 16px", borderRadius: 10, border: "1px solid #DC262640", background: "transparent", color: "#DC2626", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
              <Trash2 size={14}/> {L("Delete", "Eliminar")}
            </button>
          )}
          <button onClick={handleSave} style={{ padding: "10px 20px", borderRadius: 10, background: "linear-gradient(135deg, #16A34A, #22C55E)", border: "none", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", boxShadow: "0 2px 8px rgba(22,163,74,0.3)" }}>
            {editCrew.id ? L("Save Changes", "Guardar Cambios") : L("Create Crew", "Crear Cuadrilla")}
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 20, alignItems: "start" }}>
          {/* Left */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Basic info */}
            <div style={{ background: v.cardBg, border: "1px solid " + v.border, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: v.text, marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
                <Users size={14} color="#16A34A"/> {L("Crew Info", "Datos de Cuadrilla")}
              </div>
              <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>{L("Crew Name", "Nombre")} *</label>
                  <input value={editCrew.name} onChange={e => setEditCrew(p => ({ ...p, name: capitalize(e.target.value) }))} placeholder="Crew Alpha" style={inputStyle}/>
                </div>
                <div style={{ width: 130 }}>
                  <label style={labelStyle}>{L("Color", "Color")}</label>
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    {CREW_COLORS.map(clr => (
                      <div key={clr} onClick={() => setEditCrew(p => ({ ...p, color: clr }))}
                        style={{ width: 24, height: 24, borderRadius: 6, background: clr, cursor: "pointer", border: editCrew.color === clr ? "3px solid " + v.text : "2px solid transparent", transition: "all 0.15s" }}/>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>{L("Leader", "Líder")} *</label>
                  <input value={editCrew.leader} onChange={e => setEditCrew(p => ({ ...p, leader: capitalize(e.target.value) }))} placeholder="Carlos Mendez" style={inputStyle}/>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>{L("Phone", "Teléfono")}</label>
                  <div style={{ display: "flex", gap: 6 }}>
                    <AreaCodePicker value={editCrew.areaCode} onChange={code => setEditCrew(p => ({ ...p, areaCode: code }))} v={v} dark={dark}/>
                    <input value={editCrew.phoneNumber} onChange={e => { let val = e.target.value.replace(/[^0-9]/g, ""); if (val.length > 3) val = val.slice(0, 3) + "-" + val.slice(3); setEditCrew(p => ({ ...p, phoneNumber: val.slice(0, 8) })); }} placeholder="555-1001" style={{ ...inputStyle, flex: 1 }}/>
                  </div>
                </div>
              </div>
            </div>

            {/* Members */}
            <div style={{ background: v.cardBg, border: "1px solid " + v.border, borderRadius: 12, padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: v.text, display: "flex", alignItems: "center", gap: 6 }}>
                  <UserPlus size={14} color="#16A34A"/> {L("Members", "Miembros")} ({editCrew.members.filter(m => m.trim()).length})
                </div>
                <button onClick={addMember} style={{ fontSize: 11, fontWeight: 600, color: "#16A34A", background: "none", border: "none", cursor: "pointer" }}>+ {L("Add", "Agregar")}</button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {editCrew.members.map((m, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input value={m} onChange={e => updateMember(i, capitalize(e.target.value))} placeholder={L("Member name", "Nombre del miembro")} style={{ ...inputStyle, flex: 1 }}/>
                    {editCrew.members.length > 1 && (
                      <button onClick={() => removeMember(i)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                        <X size={14} color={v.textSec}/>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right — Status & Preview */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16, position: "sticky", top: 20 }}>
            <div style={{ background: v.cardBg, border: "1px solid " + v.border, borderRadius: 12, padding: 20 }}>
              <label style={labelStyle}>{L("Status", "Estado")}</label>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {["available", "onJob", "offDuty"].map(st => {
                  const cfg = statusConfig(st, lang);
                  const sel = editCrew.status === st;
                  return (
                    <div key={st} onClick={() => setEditCrew(p => ({ ...p, status: st }))}
                      style={{ padding: "8px 12px", borderRadius: 6, cursor: "pointer", border: "2px solid " + (sel ? cfg.color : v.border), background: sel ? cfg.color + "10" : "transparent", display: "flex", alignItems: "center", gap: 8, transition: "all 0.15s" }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: cfg.color }}/>
                      <span style={{ fontSize: 12, fontWeight: 600, color: sel ? cfg.color : v.text }}>{cfg.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Preview */}
            {editCrew.name && (
              <div style={{ background: editCrew.color + "08", border: "1px solid " + editCrew.color + "30", borderRadius: 12, padding: "14px 16px" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: editCrew.color, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>{L("Preview", "Vista previa")}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: editCrew.color }}/>
                  <span style={{ fontSize: 14, fontWeight: 700, color: v.text }}>{editCrew.name}</span>
                </div>
                <div style={{ fontSize: 11, color: v.textSec, lineHeight: 1.6 }}>
                  <div>{L("Leader","Líder")}: {editCrew.leader || "—"}</div>
                  <div>{editCrew.members.filter(m => m.trim()).length} {L("members","miembros")}</div>
                  {editCrew.phone && <div>{editCrew.phone}</div>}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Detail view ──
  if (view === "detail" && selectedCrew) {
    const cr = crewStats.find(c => c.id === selectedCrew.id) || selectedCrew;
    const st = statusConfig(cr.status, lang);
    const crewJobs = (jobs || []).filter(j => j.crewId === cr.id && j.date === todayStr).sort((a, b) => a.time.localeCompare(b.time));

    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <button onClick={() => setView("list")} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: 6, border: "1px solid " + v.border, background: v.cardBg, cursor: "pointer" }}>
            <ChevronLeft size={16} color={v.text}/>
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 12, height: 12, borderRadius: "50%", background: cr.color }}/>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: v.text, margin: 0 }}>{cr.name}</h1>
              <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: st.color + "15", color: st.color }}>{st.label}</span>
            </div>
          </div>
          <button onClick={() => setConfirmDelete(cr)} style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #DC262640", background: "transparent", color: "#DC2626", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
            <Trash2 size={13}/> {L("Delete", "Eliminar")}
          </button>
          <button onClick={() => openEdit(cr)} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #16A34A", background: "transparent", color: "#16A34A", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            {L("Edit", "Editar")}
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {/* Crew info */}
          <div style={{ background: v.cardBg, border: "1px solid " + v.border, borderRadius: 10, padding: "16px 18px" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: v.text, marginBottom: 12 }}>{L("Crew Details", "Detalles")}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 11, color: v.textSec }}>{L("Leader", "Líder")}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: v.text }}>{cr.leader}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 11, color: v.textSec }}>{L("Members", "Miembros")}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: v.text }}>{cr.members.length}</span>
              </div>
              {cr.phone && <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 11, color: v.textSec }}>{L("Phone", "Teléfono")}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: v.text }}>{cr.phone}</span>
              </div>}
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 11, color: v.textSec }}>Rating</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#F59E0B" }}>{cr.rating} ★</span>
              </div>
              <div style={{ borderTop: "1px solid " + v.border, paddingTop: 8, marginTop: 4 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: v.textSec, textTransform: "uppercase", marginBottom: 6 }}>{L("Team", "Equipo")}</div>
                {cr.members.map((m, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 0" }}>
                    <div style={{ width: 22, height: 22, borderRadius: 5, background: cr.color + "15", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: cr.color }}>{m[0]}</div>
                    <span style={{ fontSize: 11, color: v.text }}>{m}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Today's jobs */}
          <div style={{ background: v.cardBg, border: "1px solid " + v.border, borderRadius: 10, padding: "16px 18px" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: v.text, marginBottom: 12 }}>{L("Today's Jobs", "Trabajos de Hoy")} ({crewJobs.length})</div>
            {crewJobs.length === 0 && <div style={{ fontSize: 12, color: v.textSec, padding: "16px 0", textAlign: "center" }}>{L("No jobs today", "Sin trabajos hoy")}</div>}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {crewJobs.map(j => {
                const cl = clientMap[j.clientId];
                const stColor = j.status === "completed" ? "#16A34A" : j.status === "inProgress" ? "#3B82F6" : "#94A3B8";
                return (
                  <div key={j.id} style={{ display: "flex", gap: 8, padding: "8px 10px", borderRadius: 6, border: "1px solid " + v.border + "50", borderLeft: "3px solid " + stColor }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 10, fontWeight: 600, color: v.textSec }}>{j.time ? (() => { const [h,m] = j.time.split(":"); const hr = parseInt(h); return (hr > 12 ? hr-12 : hr) + ":" + m + (hr >= 12 ? " PM" : " AM"); })() : ""} · {j.duration}h</div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: v.text, marginTop: 2 }}>{cl?.name || "—"}</div>
                    </div>
                    <span style={{ fontSize: 9, fontWeight: 600, padding: "2px 6px", borderRadius: 4, background: stColor + "15", color: stColor, alignSelf: "center" }}>
                      {j.status === "completed" ? L("Done","Hecho") : j.status === "inProgress" ? L("Active","Activo") : L("Pending","Pendiente")}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── List view ──
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: v.text, margin: 0 }}>{c.title}</h1>
          <p style={{ fontSize: 13, color: v.textSec, margin: "2px 0 0" }}>{crewStats.length} {L("crews","cuadrillas")} · {activeNow} {L("active","activas")}</p>
        </div>
        <button onClick={openNew} style={{ padding: "10px 20px", borderRadius: 10, background: "linear-gradient(135deg, #16A34A, #22C55E)", border: "none", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", boxShadow: "0 2px 8px rgba(22,163,74,0.3)", display: "flex", alignItems: "center", gap: 6 }}>
          <Plus size={15}/> {c.addCrew}
        </button>
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 20 }}>
        {[
          { label: c.totalCrews, value: Math.round(animTotal), color: "#3B82F6", icon: Users },
          { label: c.activeNow, value: Math.round(animActive), color: "#16A34A", icon: Clock },
          { label: L("Jobs Today","Trabajos Hoy"), value: Math.round(animJobs), color: "#F59E0B", icon: MapPin },
          { label: c.avgRating, value: avgRating + " ★", color: "#8B5CF6", icon: Star },
        ].map((k, i) => {
          const Icon = k.icon;
          return (
            <div key={i} style={{ padding: "10px 14px", borderRadius: 10, background: v.cardBg, border: "1px solid " + v.border }} className="cy-card-hover">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontSize: 10, color: v.textSec, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>{k.label}</span>
                <Icon size={13} color={k.color}/>
              </div>
              <span style={{ fontSize: 18, fontWeight: 800, color: k.color, display: "block", textAlign: "center" }}>{k.value}</span>
            </div>
          );
        })}
      </div>

      {/* Crew cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 }}>
        {crewStats.map(cr => {
          const st = statusConfig(cr.status, lang);
          return (
            <div key={cr.id} onClick={() => openDetail(cr)} style={{ padding: "16px 18px", borderRadius: 10, background: v.cardBg, border: "1px solid " + v.border, cursor: "pointer", borderLeft: "4px solid " + cr.color }} className="cy-card-hover">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: v.text }}>{cr.name}</span>
                </div>
                <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: st.color + "15", color: st.color }}>{st.label}</span>
              </div>
              <div style={{ fontSize: 11, color: v.textSec, marginBottom: 3 }}>
                <strong style={{ color: v.text }}>{cr.leader}</strong> · {cr.members.length} {L("members","miembros")}
              </div>
              {cr.phone && <div style={{ fontSize: 10, color: v.textSec, display: "flex", alignItems: "center", gap: 4, marginBottom: 6 }}><Phone size={9}/> {cr.phone}</div>}
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, paddingTop: 10, borderTop: "1px solid " + v.border }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: v.text }}>{cr.todayJobs}</div>
                  <div style={{ fontSize: 9, color: v.textTer }}>{L("Today","Hoy")}</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: v.text }}>{cr.todayCompleted}/{cr.todayJobs}</div>
                  <div style={{ fontSize: 9, color: v.textTer }}>{L("Done","Hechos")}</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#F59E0B" }}>{cr.rating} ★</div>
                  <div style={{ fontSize: 9, color: v.textTer }}>Rating</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, marginTop: 10, paddingTop: 10, borderTop: "1px solid " + v.border }}>
                <button onClick={(e) => { e.stopPropagation(); openEdit(cr); }} style={{ flex: 1, padding: "6px 0", borderRadius: 6, border: "1px solid " + v.border, background: "transparent", color: v.textSec, fontSize: 10, fontWeight: 600, cursor: "pointer" }}>
                  {L("Edit", "Editar")}
                </button>
                <button onClick={(e) => { e.stopPropagation(); setConfirmDelete(cr); }} style={{ flex: 1, padding: "6px 0", borderRadius: 6, border: "1px solid #DC262640", background: "transparent", color: "#DC2626", fontSize: 10, fontWeight: 600, cursor: "pointer" }}>
                  {L("Delete", "Eliminar")}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Confirm Delete Modal */}
      {confirmDelete && (
        <div onClick={() => setConfirmDelete(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
          <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 380, background: v.cardBg, borderRadius: 14, border: "1px solid " + v.border, boxShadow: "0 24px 64px rgba(0,0,0,0.2)", overflow: "hidden" }}>
            <div style={{ padding: "20px 24px 16px" }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: v.text }}>{L("Delete Crew?", "¿Eliminar Cuadrilla?")}</div>
              <div style={{ fontSize: 12, color: v.textSec, marginTop: 6, lineHeight: 1.5 }}>
                {L("Are you sure you want to delete", "¿Estás seguro de eliminar")} <strong>{confirmDelete.name}</strong>? {L("This action cannot be undone.", "Esta acción no se puede deshacer.")}
              </div>
            </div>
            <div style={{ padding: "14px 24px", borderTop: "1px solid " + v.border, display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button onClick={() => setConfirmDelete(null)} style={{ padding: "9px 18px", borderRadius: 8, border: "1px solid " + v.border, background: "transparent", color: v.text, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                {L("Cancel", "Cancelar")}
              </button>
              <button onClick={() => {
                updateCrew(confirmDelete.id, { _deleted: true });
                setToast(L("Crew deleted", "Cuadrilla eliminada"));
                setTimeout(() => setToast(null), 3000);
                setConfirmDelete(null);
                if (view === "detail") setView("list");
                if (view === "form") closeForm();
              }} style={{ padding: "9px 18px", borderRadius: 8, border: "none", background: "#DC2626", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
                <Trash2 size={13}/> {L("Delete", "Eliminar")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", bottom: 24, right: 24, padding: "12px 20px", borderRadius: 8,
          background: "#16A34A", color: "#FFF", fontSize: 13, fontWeight: 600,
          fontFamily: "'DM Sans',sans-serif", boxShadow: "0 4px 12px rgba(22,163,74,0.3)",
          display: "flex", alignItems: "center", gap: 8, zIndex: 100,
          animation: "toastUp 0.3s ease" }}>
          <span>✓</span> {toast}
        </div>
      )}
      <style>{`@keyframes toastUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </div>
  );
}
