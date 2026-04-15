import { useState, useRef, useEffect } from "react";
import { useData } from "../../context/DataContext";
import { ImagePlus, UserPlus, Shield, Eye, Trash2, Mail, Clock } from "lucide-react";


const capitalize = (str) => str.replace(/\b\w/g, c => c.toUpperCase());
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const US_AREA_CODES = [
  {code:"201",city:"New Jersey"},{code:"202",city:"Washington DC"},{code:"206",city:"Seattle WA"},{code:"210",city:"San Antonio TX"},{code:"212",city:"New York NY"},{code:"213",city:"Los Angeles CA"},{code:"214",city:"Dallas TX"},{code:"215",city:"Philadelphia PA"},{code:"281",city:"Houston TX"},{code:"301",city:"Maryland"},{code:"303",city:"Denver CO"},{code:"305",city:"Miami FL"},{code:"310",city:"Los Angeles CA"},{code:"312",city:"Chicago IL"},{code:"314",city:"St. Louis MO"},{code:"317",city:"Indianapolis IN"},{code:"323",city:"Los Angeles CA"},{code:"346",city:"Houston TX"},{code:"347",city:"New York NY"},{code:"404",city:"Atlanta GA"},{code:"407",city:"Orlando FL"},{code:"408",city:"San Jose CA"},{code:"412",city:"Pittsburgh PA"},{code:"415",city:"San Francisco CA"},{code:"469",city:"Dallas TX"},{code:"480",city:"Phoenix AZ"},{code:"501",city:"Arkansas"},{code:"502",city:"Louisville KY"},{code:"503",city:"Portland OR"},{code:"504",city:"New Orleans LA"},{code:"512",city:"Austin TX"},{code:"513",city:"Cincinnati OH"},{code:"602",city:"Phoenix AZ"},{code:"612",city:"Minneapolis MN"},{code:"614",city:"Columbus OH"},{code:"615",city:"Nashville TN"},{code:"617",city:"Boston MA"},{code:"619",city:"San Diego CA"},{code:"646",city:"New York NY"},{code:"702",city:"Las Vegas NV"},{code:"703",city:"Virginia"},{code:"704",city:"Charlotte NC"},{code:"713",city:"Houston TX"},{code:"718",city:"New York NY"},{code:"720",city:"Denver CO"},{code:"737",city:"Austin TX"},{code:"786",city:"Miami FL"},{code:"801",city:"Utah"},{code:"808",city:"Hawaii"},{code:"813",city:"Tampa FL"},{code:"817",city:"Fort Worth TX"},{code:"832",city:"Houston TX"},{code:"901",city:"Memphis TN"},{code:"904",city:"Jacksonville FL"},{code:"916",city:"Sacramento CA"},{code:"917",city:"New York NY"},{code:"919",city:"North Carolina"},{code:"954",city:"Florida"},{code:"972",city:"Dallas TX"},
];

const US_CITIES = ["Abilene TX","Akron OH","Albany NY","Albuquerque NM","Alexandria VA","Amarillo TX","Anaheim CA","Anchorage AK","Arlington TX","Atlanta GA","Aurora CO","Austin TX","Bakersfield CA","Baltimore MD","Baton Rouge LA","Bee Cave TX","Bellevue WA","Boise ID","Boston MA","Boulder CO","Buffalo NY","Cedar Park TX","Chandler AZ","Charlotte NC","Chicago IL","Cincinnati OH","Cleveland OH","Colorado Springs CO","Columbus OH","Dallas TX","Denver CO","Des Moines IA","Detroit MI","Durham NC","El Paso TX","Fort Collins CO","Fort Lauderdale FL","Fort Worth TX","Fresno CA","Georgetown TX","Gilbert AZ","Grand Rapids MI","Henderson NV","Honolulu HI","Houston TX","Huntsville AL","Indianapolis IN","Irvine CA","Irving TX","Jacksonville FL","Jersey City NJ","Kansas City MO","Knoxville TN","Las Vegas NV","Leander TX","Lexington KY","Long Beach CA","Los Angeles CA","Louisville KY","Madison WI","Memphis TN","Mesa AZ","Miami FL","Milwaukee WI","Minneapolis MN","Nashville TN","New Orleans LA","New York NY","Newark NJ","Oakland CA","Oklahoma City OK","Omaha NE","Orlando FL","Philadelphia PA","Phoenix AZ","Pittsburgh PA","Plano TX","Portland OR","Raleigh NC","Reno NV","Richmond VA","Riverside CA","Round Rock TX","Sacramento CA","Salt Lake City UT","San Antonio TX","San Diego CA","San Francisco CA","San Jose CA","Santa Ana CA","Savannah GA","Scottsdale AZ","Seattle WA","Spokane WA","St. Louis MO","St. Petersburg FL","Tampa FL","Tucson AZ","Tulsa OK","Virginia Beach VA","Waco TX","Washington DC","Wichita KS"].map(c => { const p = c.split(" "); const st = p.pop(); return { name: p.join(" "), state: st, full: c }; });

const US_STATES = [{code:"AL",name:"Alabama"},{code:"AK",name:"Alaska"},{code:"AZ",name:"Arizona"},{code:"AR",name:"Arkansas"},{code:"CA",name:"California"},{code:"CO",name:"Colorado"},{code:"CT",name:"Connecticut"},{code:"DE",name:"Delaware"},{code:"FL",name:"Florida"},{code:"GA",name:"Georgia"},{code:"HI",name:"Hawaii"},{code:"ID",name:"Idaho"},{code:"IL",name:"Illinois"},{code:"IN",name:"Indiana"},{code:"IA",name:"Iowa"},{code:"KS",name:"Kansas"},{code:"KY",name:"Kentucky"},{code:"LA",name:"Louisiana"},{code:"ME",name:"Maine"},{code:"MD",name:"Maryland"},{code:"MA",name:"Massachusetts"},{code:"MI",name:"Michigan"},{code:"MN",name:"Minnesota"},{code:"MS",name:"Mississippi"},{code:"MO",name:"Missouri"},{code:"MT",name:"Montana"},{code:"NE",name:"Nebraska"},{code:"NV",name:"Nevada"},{code:"NH",name:"New Hampshire"},{code:"NJ",name:"New Jersey"},{code:"NM",name:"New Mexico"},{code:"NY",name:"New York"},{code:"NC",name:"North Carolina"},{code:"ND",name:"North Dakota"},{code:"OH",name:"Ohio"},{code:"OK",name:"Oklahoma"},{code:"OR",name:"Oregon"},{code:"PA",name:"Pennsylvania"},{code:"RI",name:"Rhode Island"},{code:"SC",name:"South Carolina"},{code:"SD",name:"South Dakota"},{code:"TN",name:"Tennessee"},{code:"TX",name:"Texas"},{code:"UT",name:"Utah"},{code:"VT",name:"Vermont"},{code:"VA",name:"Virginia"},{code:"WA",name:"Washington"},{code:"WV",name:"West Virginia"},{code:"WI",name:"Wisconsin"},{code:"WY",name:"Wyoming"},{code:"DC",name:"Washington DC"},{code:"PR",name:"Puerto Rico"}];

/* ── Reusable SearchDrop ── */
function SettingsSearchDrop({ value, onSelect, items, placeholder, displayFn, filterFn, listDisplayFn, v, dark, width }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef(null);
  const filtered = q ? items.filter(i => filterFn(i, q.toLowerCase())) : items;

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) { setOpen(false); setQ(""); } };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} style={{ position:"relative", width: width || "100%" }}>
      <div onClick={() => setOpen(!open)} style={{ padding:"12px 14px", borderRadius:10, border:"1px solid "+(open?"#16A34A":v.border), background:dark?"rgba(255,255,255,0.04)":v.surface, color: value ? v.text : v.textSec, fontSize:14, cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center", fontFamily:"'DM Sans',sans-serif", transition:"border 0.15s" }}>
        <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{value || placeholder}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={v.textSec} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0, transform: open?"rotate(180deg)":"none", transition:"transform 0.2s" }}><path d="m6 9 6 6 6-6"/></svg>
      </div>
      {open && (
        <div style={{ position:"absolute", top:"100%", left:0, right:0, marginTop:3, background:v.cardBg, border:"1px solid "+v.border, borderRadius:8, boxShadow:"0 8px 24px rgba(0,0,0,0.15)", zIndex:10, maxHeight:220, overflow:"hidden", minWidth:0 }}>
          <div style={{ padding:6 }}><input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder={placeholder} style={{ width:"100%", padding:"6px 10px", borderRadius:6, border:"1px solid "+v.border, background:"transparent", color:v.text, fontSize:12, outline:"none", fontFamily:"'DM Sans'" }} /></div>
          <div style={{ maxHeight:170, overflowY:"auto" }}>
            {filtered.slice(0,20).map((item, i) => (
              <div key={i} onClick={() => { onSelect(item); setOpen(false); setQ(""); }} style={{ padding:"7px 10px", cursor:"pointer", fontSize:12, color:v.text, transition:"background 0.1s" }}
                onMouseEnter={e => e.currentTarget.style.background = dark ? "rgba(255,255,255,0.04)" : "#F8FAFC"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>{(listDisplayFn || displayFn)(item)}</div>
            ))}
            {filtered.length === 0 && <div style={{ padding:"8px 10px", fontSize:11, color:v.textSec }}>No results</div>}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Settings({ dark, v, t, lang, setLang }) {
  const s = t.settings;
  const [activeTab, setActiveTab] = useState("company");

  const tabs = [
    { key: "company", label: s.company },
    { key: "team", label: lang === "es" ? "Equipo" : "Team" },
    { key: "billing", label: s.billing },
    { key: "language", label: s.language },
    { key: "integrations", label: s.integrations },
  ];

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({ name: "", email: "", role: "user" });
  const [teamMembers, setTeamMembers] = useState([
    { id: 1, name: "Francisco G.", email: "demo@cleoyards.com", role: "admin", status: "active", lastActive: "Just now" },
  ]);

  const handleInvite = () => {
    if (!inviteForm.name || !inviteForm.email) return;
    setTeamMembers(p => [...p, { id: Date.now(), name: inviteForm.name, email: inviteForm.email, role: inviteForm.role, status: "pending", lastActive: "—" }]);
    setInviteForm({ name: "", email: "", role: "user" });
    setInviteOpen(false);
  };

  const removeTeamMember = (id) => {
    if (teamMembers.length <= 1) return;
    setTeamMembers(p => p.filter(m => m.id !== id));
  };

  const changeRole = (id, role) => {
    setTeamMembers(p => p.map(m => m.id === id ? { ...m, role } : m));
  };

  const { companyProfile, updateCompanyProfile } = useData();
  const [company, setCompany] = useState(() => {
    const cp = { ...companyProfile };
    const pp = (cp.phone || "").match(/\((\d{3})\)\s?(.+)/);
    if (pp) { cp.areaCode = pp[1]; cp.phoneNumber = pp[2]; }
    return cp;
  });
  const [saved, setSaved] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [editing, setEditing] = useState(!companyProfile.profileComplete);
  const [missingFields, setMissingFields] = useState([]);
  const [logoError, setLogoError] = useState("");
  const fileRef = useRef(null);

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoError("");

    // Validate type
    if (!["image/png", "image/jpeg"].includes(file.type)) {
      setLogoError(lang === "es" ? "Solo PNG o JPG" : "Only PNG or JPG files");
      return;
    }
    // Validate size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setLogoError(lang === "es" ? "Máximo 2MB" : "Max 2MB file size");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        if (img.width < 200 || img.height < 200) {
          setLogoError(lang === "es" ? "Mínimo 200x200px" : "Minimum 200x200px");
          return;
        }
        setCompany(p => ({ ...p, logo: ev.target.result }));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveCompany = () => {
    const required = [
      { key:"name", label: lang === "es" ? "Nombre" : "Company Name" },
      { key:"email", label: "Email" },
      { key:"areaCode", label: lang === "es" ? "Código de Área" : "Area Code" },
      { key:"phoneNumber", label: lang === "es" ? "Teléfono" : "Phone" },
      { key:"address", label: lang === "es" ? "Dirección" : "Address" },
      { key:"city", label: lang === "es" ? "Ciudad" : "City" },
      { key:"state", label: lang === "es" ? "Estado" : "State" },
      { key:"zip", label: "ZIP" },
      { key:"ein", label: "Tax ID (EIN)" },
    ];
    const missing = required.filter(f => !company[f.key]?.trim());
    setMissingFields(missing);
    setShowConfirm(true);
  };

  const confirmSave = () => {
    const toSave = { ...company, phone: company.areaCode ? "("+company.areaCode+") "+(company.phoneNumber||"") : company.phone };
    updateCompanyProfile(toSave);
    setShowConfirm(false);
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const removeLogo = () => { setCompany(p => ({ ...p, logo: null })); };

  const integrations = [
    { name: "QuickBooks Online", desc: "Sync invoices and payments", connected: true, icon: "QB" },
    { name: "Stripe", desc: "Accept credit card payments", connected: true, icon: "S" },
    { name: "Square", desc: "POS and card payments", connected: false, icon: "Sq" },
    { name: "Google Calendar", desc: "Sync scheduling", connected: true, icon: "G" },
    { name: "Xero", desc: "Accounting software", connected: false, icon: "X" },
    { name: "Zapier", desc: "Connect 5,000+ apps", connected: false, icon: "Z" },
  ];

  const inputStyle = { width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid " + v.border, background: dark ? "rgba(255,255,255,0.04)" : v.surface, color: v.text, fontSize: 14, outline: "none", fontFamily: "'DM Sans', sans-serif" };
  const labelStyle = { fontSize: 13, fontWeight: 600, color: v.textSec, display: "block", marginBottom: 6 };

  return (
    <div>
      <h1 style={{ fontSize: 26, fontWeight: 800, fontFamily: "'Syne', sans-serif", color: v.text, marginBottom: 4 }}>{s.title}</h1>
      <p style={{ fontSize: 14, color: v.textSec, marginBottom: 24 }}>{s.sub}</p>

      <div style={{ display: "flex", gap: 8, marginBottom: 28, flexWrap: "wrap" }}>
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{ padding: "8px 18px", borderRadius: 8, border: "1px solid " + (activeTab === tab.key ? "#16A34A" : v.border), background: activeTab === tab.key ? (dark ? "rgba(22,163,74,0.12)" : "#DCFCE7") : "transparent", color: activeTab === tab.key ? "#16A34A" : v.textSec, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: 640, borderRadius: 14, background: v.cardBg, border: "1px solid " + v.border, padding: 28 }}>
        {activeTab === "company" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {!editing && (
              <div style={{ padding:"12px 16px", borderRadius:8, background:"rgba(22,163,74,0.06)", border:"1px solid rgba(22,163,74,0.15)",
                display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontSize:14 }}>✓</span>
                <span style={{ fontSize:13, fontWeight:600, color:"#16A34A" }}>{lang === "es" ? "Datos guardados correctamente" : "Company data saved"}</span>
              </div>
            )}
            <div style={{ opacity: editing ? 1 : 0.55, pointerEvents: editing ? "auto" : "none", transition:"opacity 0.3s",
              display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Logo upload */}
            <div>
              <label style={labelStyle}>{lang === "es" ? "Logo de Empresa" : "Company Logo"}</label>
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 4 }}>
                <div style={{ width: 80, height: 80, borderRadius: 12, border: "2px dashed " + v.border, background: dark ? "rgba(255,255,255,0.03)" : "#F8FAF9",
                  display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
                  {company.logo ? (
                    <img src={company.logo} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                  ) : (
                    <ImagePlus size={24} color={v.border} strokeWidth={1.5}/>
                  )}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => fileRef.current?.click()} style={{ padding: "7px 14px", borderRadius: 6, border: "1px solid " + v.border, background: "transparent",
                      color: v.text, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                      {company.logo ? (lang === "es" ? "Cambiar" : "Change") : (lang === "es" ? "Subir Logo" : "Upload Logo")}
                    </button>
                    {company.logo && (
                      <button onClick={removeLogo} style={{ padding: "7px 14px", borderRadius: 6, border: "1px solid #DC262640", background: "transparent",
                        color: "#DC2626", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                        {lang === "es" ? "Eliminar" : "Remove"}
                      </button>
                    )}
                  </div>
                  <span style={{ fontSize: 11, color: v.textSec }}>{lang === "es" ? "PNG o JPG · Mínimo 200×200px · Máximo 2MB" : "PNG or JPG · Min 200×200px · Max 2MB"}</span>
                  <span style={{ fontSize: 11, color: v.textSec }}>{lang === "es" ? "Fondo transparente recomendado para mejor resultado en PDF" : "Transparent background recommended for best PDF output"}</span>
                  {logoError && <span style={{ fontSize: 11, color: "#DC2626", fontWeight: 600 }}>{logoError}</span>}
                </div>
                <input ref={fileRef} type="file" accept="image/png,image/jpeg" onChange={handleLogoUpload} style={{ display: "none" }} />
              </div>
            </div>

            {/* Company Name — capitalize */}
            <div style={{ borderTop: "1px solid " + v.border, paddingTop: 20 }}>
              <label style={labelStyle}>{s.companyName}</label>
              <input value={company.name} onChange={e => setCompany(p => ({...p, name: capitalize(e.target.value)}))} style={inputStyle} placeholder="GreenPro Landscaping LLC" />
            </div>

            {/* Email + Phone */}
            <div style={{ display: "flex", gap: 14 }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>{s.companyEmail}</label>
                <div style={{ position: "relative" }}>
                  <input value={company.email} onChange={e => { const val = e.target.value.replace(/,/g, "."); setCompany(p => ({...p, email: val})); }}
                    style={{...inputStyle, borderColor: company.email && isValidEmail(company.email) ? "#16A34A" : company.email && !isValidEmail(company.email) ? "#EF4444" : v.border, paddingRight: 30 }}
                    placeholder="info@company.com" />
                  {company.email && <span style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", fontSize:14, fontWeight:700, color: isValidEmail(company.email) ? "#16A34A" : "#EF4444" }}>{isValidEmail(company.email) ? "✓" : "✗"}</span>}
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>{s.companyPhone}</label>
                <div style={{ display: "flex", gap: 6 }}>
                  <SettingsSearchDrop value={company.areaCode ? "("+company.areaCode+")" : ""} onSelect={i => setCompany(p => ({...p, areaCode: i.code}))} items={US_AREA_CODES}
                    placeholder={lang === "es" ? "Cód." : "Code"} displayFn={i => i.code ? "("+i.code+")" : ""} listDisplayFn={i => i.code ? "("+i.code+")" : ""} filterFn={(i,q) => i.code.includes(q)||i.city.toLowerCase().includes(q)}
                    v={v} dark={dark} width={82} />
                  <input value={company.phoneNumber || ""} onChange={e => {
                    let val = e.target.value.replace(/[^0-9]/g,"");
                    if (val.length > 3) val = val.slice(0,3) + "-" + val.slice(3);
                    if (val.length > 8) val = val.slice(0,8);
                    setCompany(p => ({...p, phoneNumber: val}));
                  }} style={{...inputStyle, flex:1}} placeholder="555-0100" maxLength="8" />
                </div>
              </div>
            </div>

            {/* Address */}
            <div><label style={labelStyle}>{lang === "es" ? "Dirección" : "Street Address"}</label><input value={company.address} onChange={e => setCompany(p => ({...p, address: capitalize(e.target.value)}))} style={inputStyle} placeholder="1200 S Congress Ave" /></div>

            {/* City + State + ZIP */}
            <div style={{ display: "flex", gap: 14 }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>{lang === "es" ? "Ciudad" : "City"}</label>
                <SettingsSearchDrop value={company.city || ""} onSelect={i => setCompany(p => ({...p, city: i.name, state: i.state}))} items={US_CITIES}
                  placeholder={lang === "es" ? "Buscar..." : "Search..."} displayFn={i => i.name ? i.name + ", " + i.state : ""} filterFn={(i,q) => i.name.toLowerCase().includes(q)||i.state.toLowerCase().includes(q)}
                  v={v} dark={dark} />
              </div>
              <div style={{ width: 120 }}>
                <label style={labelStyle}>{lang === "es" ? "Estado" : "State"}</label>
                <SettingsSearchDrop value={company.state || ""} onSelect={i => setCompany(p => ({...p, state: i.code}))} items={US_STATES}
                  placeholder="..." displayFn={i => i.code ? i.code + " - " + i.name : ""} filterFn={(i,q) => i.code.toLowerCase().includes(q)||i.name.toLowerCase().includes(q)}
                  v={v} dark={dark} />
              </div>
              <div style={{ width: 100 }}>
                <label style={labelStyle}>ZIP</label>
                <div style={{ position:"relative" }}>
                  <input value={company.zip || ""} onChange={e => setCompany(p => ({...p, zip: e.target.value.replace(/[^0-9]/g,"")}))}
                    style={{...inputStyle, borderColor: company.zip?.length===5 ? "#16A34A" : company.zip?.length > 0 ? "#EF4444" : v.border, paddingRight:24}}
                    placeholder="78704" maxLength="5" />
                  {company.zip && <span style={{ position:"absolute", right:6, top:"50%", transform:"translateY(-50%)", fontSize:12, fontWeight:700, color: company.zip.length===5 ? "#16A34A" : "#EF4444" }}>{company.zip.length===5 ? "✓" : "✗"}</span>}
                </div>
              </div>
            </div>

            <div style={{ width: 220 }}>
              <label style={labelStyle}>{s.taxId}</label>
              <div style={{ position:"relative" }}>
                <input value={company.ein || ""} onChange={e => {
                  let val = e.target.value.replace(/[^0-9-]/g,"");
                  if (val.length === 2 && !val.includes("-") && company.ein?.length < val.length) val += "-";
                  if (val.length > 10) val = val.slice(0,10);
                  setCompany(p => ({...p, ein: val}));
                }} style={{...inputStyle, borderColor: company.ein && /^\d{2}-\d{7}$/.test(company.ein) ? "#16A34A" : company.ein?.length > 0 ? "#EF4444" : v.border, paddingRight:24}} placeholder="82-1234567" maxLength="10" />
                {company.ein && <span style={{ position:"absolute", right:6, top:"50%", transform:"translateY(-50%)", fontSize:12, fontWeight:700, color: /^\d{2}-\d{7}$/.test(company.ein) ? "#16A34A" : "#EF4444" }}>{/^\d{2}-\d{7}$/.test(company.ein) ? "✓" : "✗"}</span>}
              </div>
            </div>

            </div>{/* end opacity wrapper */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 4 }}>
              {editing ? (
                <button onClick={handleSaveCompany} style={{ padding: "12px 28px", borderRadius: 10, background: "linear-gradient(135deg, #16A34A, #22C55E)", border: "none", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>{s.save}</button>
              ) : (
                <button onClick={() => setEditing(true)} style={{ padding: "12px 28px", borderRadius: 10, border: "2px solid #16A34A", background: "transparent", color: "#16A34A", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>{lang === "es" ? "Editar" : "Edit"}</button>
              )}
              {saved && <span style={{ fontSize: 13, fontWeight: 600, color: "#16A34A" }}>✓ {lang === "es" ? "Guardado" : "Saved"}</span>}
            </div>
          </div>
        )}

        {activeTab === "billing" && (
          <div>
            <div style={{ padding: 20, borderRadius: 12, border: "2px solid #16A34A", background: dark ? "rgba(22,163,74,0.06)" : "rgba(22,163,74,0.03)", marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <p style={{ fontSize: 11, color: v.textSec, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.currentPlan}</p>
                  <p style={{ fontSize: 24, fontWeight: 800, fontFamily: "'Syne', sans-serif", color: "#16A34A" }}>Business</p>
                  <p style={{ fontSize: 14, color: v.textSec }}>$99/mo — Up to 15 users</p>
                </div>
                <button style={{ padding: "8px 18px", borderRadius: 8, border: "1px solid " + v.border, background: "transparent", color: v.text, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Upgrade</button>
              </div>
            </div>
            <div style={{ fontSize: 13, color: v.textSec, lineHeight: 2 }}>
              <p><strong style={{ color: v.text }}>Payment method:</strong> Visa ending in 4242</p>
              <p><strong style={{ color: v.text }}>Next billing:</strong> May 1, 2026</p>
              <p><strong style={{ color: v.text }}>Users:</strong> 8 / 15</p>
            </div>
          </div>
        )}

        {activeTab === "language" && (
          <div>
            <p style={{ fontSize: 14, color: v.textSec, marginBottom: 20 }}>
              {lang === "en" ? "Choose the language for the business portal. This only affects the dashboard — your crews and clients can each use their preferred language." : "Elige el idioma del portal de negocio. Esto solo afecta el dashboard — tus cuadrillas y clientes pueden usar su idioma preferido."}
            </p>
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={() => setLang("en")} style={{ flex: 1, padding: "16px", borderRadius: 12, border: `2px solid ${lang === "en" ? "#16A34A" : v.border}`, background: lang === "en" ? (dark ? "rgba(22,163,74,0.08)" : "#DCFCE7") : "transparent", cursor: "pointer", textAlign: "center" }}>
                <p style={{ fontSize: 24, marginBottom: 6 }}>🇺🇸</p>
                <p style={{ fontSize: 14, fontWeight: 700, color: lang === "en" ? "#16A34A" : v.text }}>English</p>
              </button>
              <button onClick={() => setLang("es")} style={{ flex: 1, padding: "16px", borderRadius: 12, border: `2px solid ${lang === "es" ? "#16A34A" : v.border}`, background: lang === "es" ? (dark ? "rgba(22,163,74,0.08)" : "#DCFCE7") : "transparent", cursor: "pointer", textAlign: "center" }}>
                <p style={{ fontSize: 24, marginBottom: 6 }}>🇪🇸</p>
                <p style={{ fontSize: 14, fontWeight: 700, color: lang === "es" ? "#16A34A" : v.text }}>Español</p>
              </button>
            </div>
          </div>
        )}

        {activeTab === "integrations" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {integrations.map((int, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 0", borderBottom: i < integrations.length - 1 ? "1px solid " + v.border : "none" }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: dark ? "rgba(255,255,255,0.05)" : v.surface, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: v.textSec }}>{int.icon}</div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: v.text }}>{int.name}</p>
                  <p style={{ fontSize: 12, color: v.textSec }}>{int.desc}</p>
                </div>
                {int.connected
                  ? <span style={{ fontSize: 11, fontWeight: 600, color: "#16A34A", padding: "4px 10px", borderRadius: 6, background: dark ? "rgba(22,163,74,0.12)" : "#DCFCE7" }}>{s.connected}</span>
                  : <button style={{ fontSize: 11, fontWeight: 600, color: v.textSec, padding: "4px 12px", borderRadius: 6, border: "1px solid " + v.border, background: "transparent", cursor: "pointer" }}>{s.connect}</button>
                }
              </div>
            ))}
          </div>
        )}

        {activeTab === "team" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: v.text }}>{lang === "es" ? "Miembros del Equipo" : "Team Members"}</div>
                <div style={{ fontSize: 12, color: v.textSec, marginTop: 2 }}>{teamMembers.length}/15 {lang === "es" ? "usuarios" : "users"}</div>
              </div>
              <button onClick={() => setInviteOpen(true)} style={{ padding: "8px 16px", borderRadius: 8, background: "linear-gradient(135deg, #16A34A, #22C55E)", border: "none", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, boxShadow: "0 2px 8px rgba(22,163,74,0.3)" }}>
                <UserPlus size={14}/> {lang === "es" ? "Invitar" : "Invite"}
              </button>
            </div>

            {/* Roles legend */}
            <div style={{ display: "flex", gap: 16, padding: "10px 14px", background: dark ? "rgba(255,255,255,0.02)" : "#F8FAF9", borderRadius: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Shield size={13} color="#16A34A"/>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: v.text }}>Admin</div>
                  <div style={{ fontSize: 9, color: v.textSec }}>{lang === "es" ? "Acceso completo" : "Full access"}</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Eye size={13} color="#3B82F6"/>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: v.text }}>User</div>
                  <div style={{ fontSize: 9, color: v.textSec }}>{lang === "es" ? "Solo programación y rutas" : "Scheduling & routes only"}</div>
                </div>
              </div>
            </div>

            {/* Team list */}
            <div style={{ borderRadius: 10, border: "1px solid " + v.border, overflow: "hidden" }}>
              {teamMembers.map((m, idx) => (
                <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderBottom: idx < teamMembers.length - 1 ? "1px solid " + v.border : "none" }}
                  onMouseEnter={e => e.currentTarget.style.background = dark ? "rgba(255,255,255,0.02)" : "#FAFFFE"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: m.role === "admin" ? (dark ? "rgba(22,163,74,0.15)" : "#DCFCE7") : (dark ? "rgba(59,130,246,0.15)" : "#EFF6FF"), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: m.role === "admin" ? "#16A34A" : "#3B82F6", flexShrink: 0 }}>
                    {m.name[0]}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: v.text }}>{m.name}</span>
                      {m.status === "pending" && <span style={{ fontSize: 8, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: "#FEF3C7", color: "#D97706" }}>{lang === "es" ? "Pendiente" : "Pending"}</span>}
                    </div>
                    <div style={{ fontSize: 11, color: v.textSec }}>{m.email}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: v.textSec }}>
                    <Clock size={10}/> {m.lastActive}
                  </div>
                  <select value={m.role} onChange={e => changeRole(m.id, e.target.value)}
                    style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid " + v.border, background: "transparent", color: m.role === "admin" ? "#16A34A" : "#3B82F6", fontSize: 11, fontWeight: 600, cursor: "pointer", outline: "none" }}>
                    <option value="admin">Admin</option>
                    <option value="user">User</option>
                  </select>
                  {teamMembers.length > 1 && (
                    <button onClick={() => removeTeamMember(m.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                      <Trash2 size={13} color={v.textSec}/>
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Plan info */}
            <div style={{ padding: "12px 14px", borderRadius: 8, background: dark ? "rgba(22,163,74,0.06)" : "rgba(22,163,74,0.03)", border: "1px solid #16A34A20" }}>
              <div style={{ fontSize: 11, color: v.textSec, lineHeight: 1.6 }}>
                {lang === "es" 
                  ? "Tu plan Business permite hasta 15 usuarios. Los Admin ven todos los módulos. Los User solo ven Programación y Rutas."
                  : "Your Business plan allows up to 15 users. Admins see all modules. Users only see Scheduling and Routes."}
              </div>
            </div>
          </div>
        )}

        {/* Invite Modal */}
        {inviteOpen && (
          <div onClick={() => setInviteOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
            <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 420, background: v.cardBg, borderRadius: 16, border: "1px solid " + v.border, boxShadow: "0 24px 64px rgba(0,0,0,0.2)", overflow: "hidden" }}>
              <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid " + v.border }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: v.text }}>{lang === "es" ? "Invitar Miembro" : "Invite Team Member"}</div>
                <div style={{ fontSize: 12, color: v.textSec, marginTop: 2 }}>{lang === "es" ? "Se enviará una invitación por email" : "An invitation will be sent by email"}</div>
              </div>
              <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: v.textSec, textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: 4 }}>{lang === "es" ? "Nombre" : "Name"}</label>
                  <input value={inviteForm.name} onChange={e => setInviteForm(p => ({...p, name: e.target.value}))} placeholder="John Doe" style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid " + v.border, background: dark ? "rgba(255,255,255,0.04)" : v.surface, color: v.text, fontSize: 13, outline: "none", fontFamily: "'DM Sans'" }}/>
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: v.textSec, textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: 4 }}>Email</label>
                  <input value={inviteForm.email} onChange={e => setInviteForm(p => ({...p, email: e.target.value.replace(/,/g, ".")}))} placeholder="john@company.com" style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid " + v.border, background: dark ? "rgba(255,255,255,0.04)" : v.surface, color: v.text, fontSize: 13, outline: "none", fontFamily: "'DM Sans'" }}/>
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: v.textSec, textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: 4 }}>{lang === "es" ? "Rol" : "Role"}</label>
                  <div style={{ display: "flex", gap: 8 }}>
                    {[
                      { key: "admin", label: "Admin", icon: Shield, color: "#16A34A", desc: lang === "es" ? "Acceso completo" : "Full access" },
                      { key: "user", label: "User", icon: Eye, color: "#3B82F6", desc: lang === "es" ? "Solo programación" : "Scheduling only" },
                    ].map(r => {
                      const sel = inviteForm.role === r.key;
                      const Icon = r.icon;
                      return (
                        <div key={r.key} onClick={() => setInviteForm(p => ({...p, role: r.key}))}
                          style={{ flex: 1, padding: "10px 12px", borderRadius: 8, cursor: "pointer", border: "2px solid " + (sel ? r.color : v.border), background: sel ? r.color + "10" : "transparent", transition: "all 0.15s" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                            <Icon size={13} color={sel ? r.color : v.textSec}/>
                            <span style={{ fontSize: 12, fontWeight: 700, color: sel ? r.color : v.text }}>{r.label}</span>
                          </div>
                          <span style={{ fontSize: 10, color: v.textSec }}>{r.desc}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div style={{ padding: "16px 24px", borderTop: "1px solid " + v.border, display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button onClick={() => setInviteOpen(false)} style={{ padding: "9px 18px", borderRadius: 8, border: "1px solid " + v.border, background: "transparent", color: v.text, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                  {lang === "es" ? "Cancelar" : "Cancel"}
                </button>
                <button onClick={handleInvite} style={{ padding: "9px 18px", borderRadius: 8, border: "none", background: "linear-gradient(135deg, #16A34A, #22C55E)", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, boxShadow: "0 2px 8px rgba(22,163,74,0.3)" }}>
                  <Mail size={13}/> {lang === "es" ? "Enviar Invitación" : "Send Invite"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Confirmation Modal */}
      {showConfirm && (
        <div onClick={() => setShowConfirm(false)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.4)", zIndex:200,
          display:"flex", alignItems:"center", justifyContent:"center", backdropFilter:"blur(4px)" }}>
          <div onClick={e => e.stopPropagation()} style={{ width:"100%", maxWidth:480, background:v.cardBg, borderRadius:16,
            border:"1px solid "+v.border, boxShadow:"0 24px 64px rgba(0,0,0,0.2)", overflow:"hidden" }}>
            <div style={{ padding:"20px 24px 16px", borderBottom:"1px solid "+v.border }}>
              <div style={{ fontSize:18, fontWeight:800, color:v.text }}>{lang === "es" ? "Confirmar Datos de Empresa" : "Confirm Company Details"}</div>
              <div style={{ fontSize:12, color:v.textSec, marginTop:2 }}>{lang === "es" ? "Revisa que la información sea correcta" : "Review your information before saving"}</div>
            </div>
            <div style={{ padding:"20px 24px", display:"flex", flexDirection:"column", gap:14 }}>
              {missingFields.length > 0 && (
                <div style={{ padding:"12px 14px", borderRadius:8, background:"#FEF2F2", border:"1px solid #DC262630" }}>
                  <div style={{ fontSize:12, fontWeight:700, color:"#DC2626", marginBottom:6 }}>{lang === "es" ? "Campos obligatorios incompletos:" : "Required fields missing:"}</div>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                    {missingFields.map((f,i) => (
                      <span key={i} style={{ fontSize:11, padding:"3px 8px", borderRadius:4, background:"#FEE2E2", color:"#DC2626", fontWeight:600 }}>{f.label}</span>
                    ))}
                  </div>
                </div>
              )}
              <div style={{ display:"flex", alignItems:"center", gap:12, paddingBottom:12, borderBottom:"1px solid "+v.border+"40" }}>
                {company.logo ? (
                  <img src={company.logo} alt="Logo" style={{ width:48, height:48, objectFit:"contain", borderRadius:8 }} />
                ) : (
                  <div style={{ width:48, height:48, borderRadius:8, background:dark?"rgba(255,255,255,0.05)":"#F3F4F6", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <span style={{ fontSize:11, color:v.textSec }}>N/A</span>
                  </div>
                )}
                <span style={{ fontSize:12, color:v.textSec }}>{company.logo ? (lang === "es" ? "Logo cargado" : "Logo uploaded") : (lang === "es" ? "Logo opcional" : "Logo optional")}</span>
              </div>
              {[
                { label: lang === "es" ? "Nombre" : "Company Name", value: company.name },
                { label: "Email", value: company.email, valid: company.email && isValidEmail(company.email) },
                { label: lang === "es" ? "Teléfono" : "Phone", value: company.areaCode ? "("+company.areaCode+") "+(company.phoneNumber||"") : "" },
                { label: lang === "es" ? "Dirección" : "Address", value: company.address },
                { label: lang === "es" ? "Ciudad" : "City", value: company.city },
                { label: lang === "es" ? "Estado" : "State", value: company.state },
                { label: "ZIP", value: company.zip, valid: company.zip?.length === 5 },
                { label: "Tax ID (EIN)", value: company.ein, valid: /^\d{2}-\d{7}$/.test(company.ein || "") },
              ].map((row, i) => (
                <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <span style={{ fontSize:12, color:v.textSec }}>{row.label}</span>
                  <span style={{ fontSize:13, fontWeight:600, color: !row.value ? "#DC2626" : (row.valid === false ? "#D97706" : v.text) }}>
                    {row.value || (lang === "es" ? "— Obligatorio —" : "— Required —")}
                    {row.value && row.valid === true && " ✓"}
                    {row.value && row.valid === false && " ⚠"}
                  </span>
                </div>
              ))}
            </div>
            <div style={{ padding:"16px 24px", borderTop:"1px solid "+v.border, display:"flex", justifyContent:"flex-end", gap:10 }}>
              <button onClick={() => setShowConfirm(false)} style={{ padding:"10px 20px", borderRadius:8, border:"1px solid "+v.border,
                background:"transparent", color:v.text, fontSize:13, fontWeight:600, cursor:"pointer" }}>
                {missingFields.length > 0 ? (lang === "es" ? "Completar Campos" : "Fill Missing Fields") : (lang === "es" ? "Editar" : "Edit")}
              </button>
              {missingFields.length === 0 ? (
                <button onClick={confirmSave} style={{ padding:"10px 24px", borderRadius:8, border:"none",
                  background:"linear-gradient(135deg, #16A34A, #22C55E)", color:"#fff", fontSize:13, fontWeight:600, cursor:"pointer",
                  boxShadow:"0 2px 8px rgba(22,163,74,0.3)" }}>
                  {lang === "es" ? "Confirmar y Guardar" : "Confirm & Save"}
                </button>
              ) : (
                <button disabled style={{ padding:"10px 24px", borderRadius:8, border:"none",
                  background:"#D1D5DB", color:"#9CA3AF", fontSize:13, fontWeight:600, cursor:"not-allowed" }}>
                  {lang === "es" ? "Confirmar y Guardar" : "Confirm & Save"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {saved && (
        <div style={{ position:"fixed", bottom:24, right:24, padding:"12px 20px", borderRadius:8,
          background:"#16A34A", color:"#FFF", fontSize:13, fontWeight:600,
          fontFamily:"'DM Sans',sans-serif", boxShadow:"0 4px 12px rgba(22,163,74,0.3)",
          display:"flex", alignItems:"center", gap:8, zIndex:100,
          animation:"settingsToast 0.3s ease" }}>
          <span style={{ fontSize:16 }}>✓</span> {lang === "es" ? "Perfil de empresa guardado" : "Company profile saved"}
        </div>
      )}
      <style>{`@keyframes settingsToast { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </div>
  );
}
