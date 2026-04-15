import { useState } from "react";
import { useData } from "../../context/DataContext";

const CatIcon = ({ type, size = 20, color }) => {
  const s = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round" };
  if (type === "maintenance") return <svg {...s}><path d="M12 22c-4.97 0-9-2.69-9-6v-4c0-3.31 4.03-6 9-6s9 2.69 9 6v4c0 3.31-4.03 6-9 6z"/><path d="M12 2v4M8 8c1-2 3-3 4-3s3 1 4 3"/><path d="M7 14l2-2M15 14l2-2"/></svg>;
  if (type === "improvements") return <svg {...s}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>;
  if (type === "installation") return <svg {...s}><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M12 6V2M7 6V4M17 6V4"/><path d="M2 12h20"/></svg>;
  if (type === "specials") return <svg {...s}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>;
  return null;
};

const categories = {
  maintenance: { en: "Maintenance", es: "Mantenimiento", color: "#16A34A", iconType: "maintenance" },
  improvements: { en: "Improvements", es: "Mejoras", color: "#3B82F6", iconType: "improvements" },
  installation: { en: "Installation", es: "Instalación", color: "#8B5CF6", iconType: "installation" },
  specials: { en: "Specials", es: "Especiales", color: "#F59E0B", iconType: "specials" },
};

const freqLabels = {
  en: { weekly: "Weekly", biweekly: "Bi-weekly", monthly: "Monthly", quarterly: "Quarterly", seasonal: "Seasonal", "one-time": "One-time", "on-demand": "On Demand" },
  es: { weekly: "Semanal", biweekly: "Quincenal", monthly: "Mensual", quarterly: "Trimestral", seasonal: "Estacional", "one-time": "Único", "on-demand": "Bajo Demanda" },
};

export default function Services({ dark, v, t, lang }) {
  const { services, clients, addService, updateService } = useData();
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [activeCat, setActiveCat] = useState("maintenance");
  const [form, setForm] = useState({ name: "", nameEs: "", desc: "", descEs: "", price: "", frequency: "weekly", category: "maintenance" });

  const s = lang === "es" ? {
    title: "Servicios", sub: "Catálogo de servicios por categoría", add: "Agregar Servicio", search: "Buscar servicios...", edit: "Editar", save: "Guardar", cancel: "Cancelar", addService: "Agregar Servicio", editService: "Editar Servicio",
    name: "Nombre (EN)", nameEs: "Nombre (ES)", desc: "Descripción (EN)", descEs: "Descripción (ES)", price: "Precio ($)", freq: "Frecuencia", cat: "Categoría",
    total: "Total Servicios", active: "Activos", avgPrice: "Precio Promedio", catCount: "Categorías",
    services: "servicios", from: "desde"
  } : {
    title: "Services", sub: "Service catalog by category", add: "Add Service", search: "Search services...", edit: "Edit", save: "Save", cancel: "Cancel", addService: "Add Service", editService: "Edit Service",
    name: "Name (EN)", nameEs: "Name (ES)", desc: "Description (EN)", descEs: "Description (ES)", price: "Price ($)", freq: "Frequency", cat: "Category",
    total: "Total Services", active: "Active", avgPrice: "Avg Price", catCount: "Categories",
    services: "services", from: "from"
  };

  const freq = freqLabels[lang] || freqLabels.en;
  const catLabel = (key) => categories[key]?.[lang] || categories[key]?.en || key;

  const filtered = services.filter(svc => {
    if (!search) return true;
    const name = lang === "es" ? svc.nameEs : svc.name;
    return name.toLowerCase().includes(search.toLowerCase());
  });

  const groupedServices = {};
  Object.keys(categories).forEach(cat => {
    const items = filtered.filter(svc => svc.category === cat);
    if (items.length > 0) groupedServices[cat] = items;
  });

  
  const openAdd = (cat = "maintenance") => { setEditId(null); setForm({ name: "", nameEs: "", desc: "", descEs: "", price: "", frequency: "weekly", category: cat }); setShowModal(true); };
  const openEdit = (svc) => { setEditId(svc.id); setForm({ name: svc.name, nameEs: svc.nameEs, desc: svc.desc, descEs: svc.descEs, price: String(svc.price), frequency: svc.frequency, category: svc.category }); setShowModal(true); };

  const handleSave = () => {
    const data = { ...form, price: parseFloat(form.price) || 0 };
    if (editId) updateService(editId, data);
    else addService(data);
    setShowModal(false);
  };

  const inp = { width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid " + v.border, background: dark ? "rgba(255,255,255,0.04)" : v.surface, color: v.text, fontSize: 13, outline: "none", fontFamily: "'DM Sans', sans-serif" };
  const lbl = { fontSize: 12, fontWeight: 600, color: v.textSec, display: "block", marginBottom: 4 };

  const avgPrice = services.length ? Math.round(services.reduce((a, b) => a + b.price, 0) / services.length) : 0;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: v.text, margin: 0 }}>{s.title}</h1>
          <p style={{ fontSize: 13, color: v.textSec, margin: "2px 0 0" }}>{s.sub}</p>
        </div>
        <button onClick={() => openAdd()} style={{ padding: "10px 20px", borderRadius: 10, background: "linear-gradient(135deg, #16A34A, #22C55E)", border: "none", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", boxShadow: "0 2px 8px rgba(22,163,74,0.3)" }}>{s.add}</button>
      </div>



      {/* Search */}
      <input value={search} onChange={e => setSearch(e.target.value)} placeholder={s.search} style={{ ...inp, marginBottom: 20, maxWidth: 300 }} />

      {/* Category Tabs */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        {Object.entries(categories).map(([key, cat]) => {
          const active = activeCat === key;
          const count = filtered.filter(s => s.category === key).length;
          return (
            <button key={key} onClick={() => setActiveCat(key)} style={{
              display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", borderRadius: 10,
              border: "1px solid " + (active ? cat.color : v.border),
              background: active ? cat.color + (dark ? "15" : "10") : "transparent",
              cursor: "pointer", transition: "all 0.2s"
            }}>
              <CatIcon type={key} size={18} color={active ? cat.color : v.textTer} />
              <span style={{ fontSize: 13, fontWeight: 600, color: active ? cat.color : v.textSec }}>{cat[lang]}</span>
              <span style={{ fontSize: 11, fontWeight: 700, padding: "1px 7px", borderRadius: 10, background: active ? cat.color + "20" : v.border, color: active ? cat.color : v.textTer }}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Active Category Services */}
      {(() => {
        const catInfo = categories[activeCat];
        const items = filtered.filter(svc => svc.category === activeCat);
        return (
          <div style={{ borderRadius: 14, border: "1px solid " + v.border, overflow: "hidden", background: v.cardBg }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 22px", background: dark ? "rgba(255,255,255,0.02)" : v.surface, borderBottom: "1px solid " + v.border }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <CatIcon type={activeCat} size={20} color={catInfo.color} />
                <span style={{ fontSize: 15, fontWeight: 700, color: v.text }}>{catLabel(activeCat)}</span>
                <span style={{ fontSize: 12, color: v.textSec }}>— {items.length} {s.services}</span>
              </div>
              <button onClick={() => openAdd(activeCat)} style={{ fontSize: 12, fontWeight: 600, padding: "6px 14px", borderRadius: 8, background: catInfo.color, border: "none", color: "#fff", cursor: "pointer" }}>+ {s.add}</button>
            </div>
            {/* List */}
            {items.length === 0 && <p style={{ padding: 32, textAlign: "center", color: v.textTer, fontSize: 13 }}>{lang === "es" ? "No hay servicios en esta categoría" : "No services in this category"}</p>}
            {items.map((svc, idx) => (
              <div key={svc.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 22px", borderBottom: idx < items.length - 1 ? "1px solid " + v.border : "none", transition: "background 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.background = dark ? "rgba(255,255,255,0.02)" : "#F8FAFC"} className="cy-row-hover"
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <div style={{ width: 6, height: 6, borderRadius: 3, background: catInfo.color, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: v.text }}>{lang === "es" ? svc.nameEs : svc.name}</p>
                  <p style={{ fontSize: 12, color: v.textTer, marginTop: 2 }}>{lang === "es" ? svc.descEs : svc.desc}</p>
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 6, background: dark ? "rgba(59,130,246,0.12)" : "#EFF6FF", color: "#3B82F6", whiteSpace: "nowrap" }}>{freq[svc.frequency]}</span>
                <span style={{ fontSize: 18, fontWeight: 800, fontFamily: "'Syne', sans-serif", color: catInfo.color, minWidth: 70, textAlign: "right" }}>${svc.price}</span>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => openEdit(svc)} style={{ fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 6, border: "1px solid " + v.border, background: "transparent", color: v.textSec, cursor: "pointer" }}>{s.edit}</button>
                  <button onClick={() => setDeleteConfirm(svc)} style={{ fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 6, border: "none", background: dark ? "rgba(239,68,68,0.1)" : "#FEF2F2", color: "#EF4444", cursor: "pointer" }}>{lang === "es" ? "Eliminar" : "Delete"}</button>
                </div>
              </div>
            ))}
          </div>
        );
      })()}

      {/* Add/Edit Modal */}
      {showModal && (
        <div onClick={() => setShowModal(false)} style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 520, background: v.cardBg, borderRadius: 16, border: "1px solid " + v.border, padding: 28, boxShadow: "0 24px 64px rgba(0,0,0,0.2)" }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: v.text, marginBottom: 20, fontFamily: "'Syne', sans-serif" }}>{editId ? s.editService : s.addService}</h2>

            {/* Category selector */}
            <div style={{ marginBottom: 16 }}>
              <label style={lbl}>{s.cat}</label>
              <div style={{ display: "flex", gap: 8 }}>
                {Object.entries(categories).map(([key, cat]) => (
                  <button key={key} onClick={() => setForm({...form, category: key})} style={{
                    flex: 1, padding: "10px 8px", borderRadius: 10, border: "1px solid " + (form.category === key ? cat.color : v.border),
                    background: form.category === key ? cat.color + (dark ? "18" : "10") : "transparent",
                    cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, transition: "all 0.15s"
                  }}>
                    <CatIcon type={key} size={20} color={form.category === key ? cat.color : v.textTer} />
                    <span style={{ fontSize: 10, fontWeight: 600, color: form.category === key ? cat.color : v.textSec }}>{cat[lang]}</span>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={lbl}>{s.name}</label>
                <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} style={inp} placeholder="Lawn Mowing" />
              </div>
              <div>
                <label style={lbl}>{s.nameEs}</label>
                <input value={form.nameEs} onChange={e => setForm({...form, nameEs: e.target.value})} style={inp} placeholder="Corte de Césped" />
              </div>
              <div>
                <label style={lbl}>{s.desc}</label>
                <input value={form.desc} onChange={e => setForm({...form, desc: e.target.value})} style={inp} placeholder={lang === "es" ? "Descripción en inglés" : "Description in English"} />
              </div>
              <div>
                <label style={lbl}>{s.descEs}</label>
                <input value={form.descEs} onChange={e => setForm({...form, descEs: e.target.value})} style={inp} placeholder={lang === "es" ? "Descripción en español" : "Description in Spanish"} />
              </div>
              <div style={{ display: "flex", gap: 14 }}>
                <div style={{ flex: 1 }}>
                  <label style={lbl}>{s.price}</label>
                  <input type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})} style={inp} placeholder="85" />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={lbl}>{s.freq}</label>
                  <select value={form.frequency} onChange={e => setForm({...form, frequency: e.target.value})} style={{...inp, cursor: "pointer"}}>
                    {Object.entries(freq).map(([k,v2]) => <option key={k} value={k}>{v2}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
              <button onClick={() => setShowModal(false)} style={{ padding: "10px 20px", borderRadius: 8, border: "1px solid " + v.border, background: "transparent", color: v.textSec, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>{s.cancel}</button>
              <button onClick={handleSave} style={{ padding: "10px 20px", borderRadius: 8, background: "linear-gradient(135deg, #16A34A, #22C55E)", border: "none", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>{s.save}</button>
            </div>
          </div>
        </div>
      )}
      {/* Delete Confirmation */}
      {deleteConfirm && (() => {
        const svc = deleteConfirm;
        const activeClients = clients.filter(c => c.status === "active" && c.services.includes(svc.id)).length;
        return (
          <div onClick={() => setDeleteConfirm(null)} style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
            <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 420, background: v.cardBg, borderRadius: 16, border: "1px solid " + v.border, padding: 28, boxShadow: "0 24px 64px rgba(0,0,0,0.2)", textAlign: "center" }}>
              <div style={{ width: 56, height: 56, borderRadius: 14, background: dark ? "rgba(239,68,68,0.1)" : "#FEF2F2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: v.text, marginBottom: 8, fontFamily: "'Syne', sans-serif" }}>
                {lang === "es" ? "¿Eliminar servicio?" : "Delete service?"}
              </h3>
              <p style={{ fontSize: 14, fontWeight: 600, color: v.text, marginBottom: 4 }}>{lang === "es" ? svc.nameEs : svc.name}</p>
              <p style={{ fontSize: 13, color: v.textSec, marginBottom: 16 }}>${svc.price} · {freq[svc.frequency]}</p>
              {activeClients > 0 && (
                <div style={{ padding: "10px 16px", borderRadius: 8, background: dark ? "rgba(245,158,11,0.1)" : "#FEF3C7", border: "1px solid #F59E0B40", marginBottom: 16 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#F59E0B" }}>
                    ⚠ {activeClients} {lang === "es" ? "cliente(s) activo(s) tiene(n) este servicio" : "active client(s) have this service"}
                  </p>
                </div>
              )}
              {activeClients === 0 && (
                <p style={{ fontSize: 13, color: v.textTer, marginBottom: 16 }}>
                  {lang === "es" ? "Ningún cliente activo usa este servicio" : "No active clients use this service"}
                </p>
              )}
              <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                <button onClick={() => setDeleteConfirm(null)} style={{ padding: "10px 24px", borderRadius: 10, border: "1px solid " + v.border, background: "transparent", color: v.textSec, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>{lang === "es" ? "Cancelar" : "Cancel"}</button>
                <button onClick={() => { updateService(svc.id, { active: false }); setDeleteConfirm(null); }} style={{ padding: "10px 24px", borderRadius: 10, border: "none", background: "#EF4444", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>{lang === "es" ? "Eliminar" : "Delete"}</button>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
}
