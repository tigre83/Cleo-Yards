import { useState, useRef, useEffect } from "react";
import { ChevronLeft, CalendarDays, ClipboardList, Users } from "lucide-react";
import { useData } from "../../context/DataContext";

const capitalize = (str) => str.replace(/\b\w/g, c => c.toUpperCase());
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const US_AREA_CODES = [
  {code:"201",city:"New Jersey"},{code:"202",city:"Washington DC"},{code:"206",city:"Seattle WA"},{code:"210",city:"San Antonio TX"},{code:"212",city:"New York NY"},{code:"213",city:"Los Angeles CA"},{code:"214",city:"Dallas TX"},{code:"215",city:"Philadelphia PA"},{code:"224",city:"Illinois"},{code:"239",city:"Florida"},{code:"240",city:"Maryland"},{code:"248",city:"Michigan"},{code:"251",city:"Alabama"},{code:"253",city:"Washington"},{code:"254",city:"Texas"},{code:"262",city:"Wisconsin"},{code:"267",city:"Philadelphia PA"},{code:"281",city:"Houston TX"},{code:"301",city:"Maryland"},{code:"303",city:"Denver CO"},{code:"305",city:"Miami FL"},{code:"310",city:"Los Angeles CA"},{code:"312",city:"Chicago IL"},{code:"313",city:"Detroit MI"},{code:"314",city:"St. Louis MO"},{code:"317",city:"Indianapolis IN"},{code:"321",city:"Florida"},{code:"323",city:"Los Angeles CA"},{code:"346",city:"Houston TX"},{code:"347",city:"New York NY"},{code:"352",city:"Florida"},{code:"385",city:"Utah"},{code:"401",city:"Rhode Island"},{code:"404",city:"Atlanta GA"},{code:"405",city:"Oklahoma City OK"},{code:"407",city:"Orlando FL"},{code:"408",city:"San Jose CA"},{code:"410",city:"Maryland"},{code:"412",city:"Pittsburgh PA"},{code:"414",city:"Milwaukee WI"},{code:"415",city:"San Francisco CA"},{code:"424",city:"Los Angeles CA"},{code:"469",city:"Dallas TX"},{code:"470",city:"Atlanta GA"},{code:"480",city:"Phoenix AZ"},{code:"484",city:"Pennsylvania"},{code:"501",city:"Arkansas"},{code:"502",city:"Louisville KY"},{code:"503",city:"Portland OR"},{code:"504",city:"New Orleans LA"},{code:"510",city:"California"},{code:"512",city:"Austin TX"},{code:"513",city:"Cincinnati OH"},{code:"516",city:"New York"},{code:"520",city:"Arizona"},{code:"530",city:"California"},{code:"540",city:"Virginia"},{code:"561",city:"Florida"},{code:"571",city:"Virginia"},{code:"602",city:"Phoenix AZ"},{code:"612",city:"Minneapolis MN"},{code:"614",city:"Columbus OH"},{code:"615",city:"Nashville TN"},{code:"617",city:"Boston MA"},{code:"619",city:"San Diego CA"},{code:"626",city:"California"},{code:"630",city:"Illinois"},{code:"646",city:"New York NY"},{code:"650",city:"California"},{code:"678",city:"Atlanta GA"},{code:"702",city:"Las Vegas NV"},{code:"703",city:"Virginia"},{code:"704",city:"Charlotte NC"},{code:"713",city:"Houston TX"},{code:"714",city:"California"},{code:"718",city:"New York NY"},{code:"720",city:"Denver CO"},{code:"727",city:"Florida"},{code:"732",city:"New Jersey"},{code:"737",city:"Austin TX"},{code:"754",city:"Florida"},{code:"757",city:"Virginia"},{code:"770",city:"Georgia"},{code:"773",city:"Chicago IL"},{code:"786",city:"Miami FL"},{code:"801",city:"Utah"},{code:"804",city:"Virginia"},{code:"808",city:"Hawaii"},{code:"813",city:"Tampa FL"},{code:"817",city:"Fort Worth TX"},{code:"818",city:"California"},{code:"832",city:"Houston TX"},{code:"843",city:"South Carolina"},{code:"847",city:"Illinois"},{code:"858",city:"San Diego CA"},{code:"901",city:"Memphis TN"},{code:"904",city:"Jacksonville FL"},{code:"907",city:"Alaska"},{code:"916",city:"Sacramento CA"},{code:"917",city:"New York NY"},{code:"919",city:"North Carolina"},{code:"925",city:"California"},{code:"929",city:"New York NY"},{code:"941",city:"Florida"},{code:"949",city:"California"},{code:"954",city:"Florida"},{code:"972",city:"Dallas TX"},
];

const US_CITIES = ["Abilene TX","Akron OH","Albany NY","Albuquerque NM","Alexandria VA","Amarillo TX","Anaheim CA","Anchorage AK","Arlington TX","Atlanta GA","Aurora CO","Austin TX","Bakersfield CA","Baltimore MD","Baton Rouge LA","Bee Cave TX","Bellevue WA","Boise ID","Boston MA","Boulder CO","Buffalo NY","Cedar Park TX","Chandler AZ","Charlotte NC","Chicago IL","Cincinnati OH","Cleveland OH","Colorado Springs CO","Columbus OH","Dallas TX","Denver CO","Des Moines IA","Detroit MI","Durham NC","El Paso TX","Fort Collins CO","Fort Lauderdale FL","Fort Worth TX","Fresno CA","Georgetown TX","Gilbert AZ","Grand Rapids MI","Henderson NV","Honolulu HI","Houston TX","Huntsville AL","Indianapolis IN","Irvine CA","Irving TX","Jacksonville FL","Jersey City NJ","Kansas City MO","Knoxville TN","Las Vegas NV","Leander TX","Lexington KY","Long Beach CA","Los Angeles CA","Louisville KY","Madison WI","Memphis TN","Mesa AZ","Miami FL","Milwaukee WI","Minneapolis MN","Nashville TN","New Orleans LA","New York NY","Newark NJ","Oakland CA","Oklahoma City OK","Omaha NE","Orlando FL","Philadelphia PA","Phoenix AZ","Pittsburgh PA","Plano TX","Portland OR","Raleigh NC","Reno NV","Richmond VA","Riverside CA","Round Rock TX","Sacramento CA","Salt Lake City UT","San Antonio TX","San Diego CA","San Francisco CA","San Jose CA","Santa Ana CA","Savannah GA","Scottsdale AZ","Seattle WA","Spokane WA","St. Louis MO","St. Petersburg FL","Tampa FL","Tucson AZ","Tulsa OK","Virginia Beach VA","Waco TX","Washington DC","Wichita KS"].map(c => { const p = c.split(" "); const st = p.pop(); return { name: p.join(" "), state: st, full: c }; });


const CITY_ZIPS = {"Abilene TX":"79601","Akron OH":"44301","Albany NY":"12201","Albuquerque NM":"87101","Alexandria VA":"22301","Amarillo TX":"79101","Anaheim CA":"92801","Anchorage AK":"99501","Arlington TX":"76001","Atlanta GA":"30301","Aurora CO":"80010","Austin TX":"78701","Bakersfield CA":"93301","Baltimore MD":"21201","Baton Rouge LA":"70801","Bee Cave TX":"78738","Bellevue WA":"98004","Boise ID":"83701","Boston MA":"02101","Boulder CO":"80301","Buffalo NY":"14201","Cedar Park TX":"78613","Chandler AZ":"85224","Charlotte NC":"28201","Chicago IL":"60601","Cincinnati OH":"45201","Cleveland OH":"44101","Colorado Springs CO":"80901","Columbus OH":"43201","Dallas TX":"75201","Denver CO":"80201","Des Moines IA":"50301","Detroit MI":"48201","Durham NC":"27701","El Paso TX":"79901","Fort Collins CO":"80521","Fort Lauderdale FL":"33301","Fort Worth TX":"76101","Fresno CA":"93701","Georgetown TX":"78626","Gilbert AZ":"85233","Grand Rapids MI":"49501","Henderson NV":"89011","Honolulu HI":"96801","Houston TX":"77001","Huntsville AL":"35801","Indianapolis IN":"46201","Irvine CA":"92601","Irving TX":"75014","Jacksonville FL":"32099","Jersey City NJ":"07301","Kansas City MO":"64101","Knoxville TN":"37901","Las Vegas NV":"89101","Leander TX":"78641","Lexington KY":"40501","Long Beach CA":"90801","Los Angeles CA":"90001","Louisville KY":"40201","Madison WI":"53701","Memphis TN":"38101","Mesa AZ":"85201","Miami FL":"33101","Milwaukee WI":"53201","Minneapolis MN":"55401","Nashville TN":"37201","New Orleans LA":"70112","New York NY":"10001","Newark NJ":"07101","Oakland CA":"94601","Oklahoma City OK":"73101","Omaha NE":"68101","Orlando FL":"32801","Philadelphia PA":"19101","Phoenix AZ":"85001","Pittsburgh PA":"15201","Plano TX":"75023","Portland OR":"97201","Raleigh NC":"27601","Reno NV":"89501","Richmond VA":"23219","Riverside CA":"92501","Round Rock TX":"78664","Sacramento CA":"95814","Salt Lake City UT":"84101","San Antonio TX":"78201","San Diego CA":"92101","San Francisco CA":"94101","San Jose CA":"95101","Santa Ana CA":"92701","Savannah GA":"31401","Scottsdale AZ":"85251","Seattle WA":"98101","Spokane WA":"99201","St. Louis MO":"63101","St. Petersburg FL":"33701","Tampa FL":"33601","Tucson AZ":"85701","Tulsa OK":"74101","Virginia Beach VA":"23451","Waco TX":"76701","Washington DC":"20001","Wichita KS":"67201"};
const US_STATES = [{code:"AL",name:"Alabama"},{code:"AK",name:"Alaska"},{code:"AZ",name:"Arizona"},{code:"AR",name:"Arkansas"},{code:"CA",name:"California"},{code:"CO",name:"Colorado"},{code:"CT",name:"Connecticut"},{code:"DE",name:"Delaware"},{code:"FL",name:"Florida"},{code:"GA",name:"Georgia"},{code:"HI",name:"Hawaii"},{code:"ID",name:"Idaho"},{code:"IL",name:"Illinois"},{code:"IN",name:"Indiana"},{code:"IA",name:"Iowa"},{code:"KS",name:"Kansas"},{code:"KY",name:"Kentucky"},{code:"LA",name:"Louisiana"},{code:"ME",name:"Maine"},{code:"MD",name:"Maryland"},{code:"MA",name:"Massachusetts"},{code:"MI",name:"Michigan"},{code:"MN",name:"Minnesota"},{code:"MS",name:"Mississippi"},{code:"MO",name:"Missouri"},{code:"MT",name:"Montana"},{code:"NE",name:"Nebraska"},{code:"NV",name:"Nevada"},{code:"NH",name:"New Hampshire"},{code:"NJ",name:"New Jersey"},{code:"NM",name:"New Mexico"},{code:"NY",name:"New York"},{code:"NC",name:"North Carolina"},{code:"ND",name:"North Dakota"},{code:"OH",name:"Ohio"},{code:"OK",name:"Oklahoma"},{code:"OR",name:"Oregon"},{code:"PA",name:"Pennsylvania"},{code:"RI",name:"Rhode Island"},{code:"SC",name:"South Carolina"},{code:"SD",name:"South Dakota"},{code:"TN",name:"Tennessee"},{code:"TX",name:"Texas"},{code:"UT",name:"Utah"},{code:"VT",name:"Vermont"},{code:"VA",name:"Virginia"},{code:"WA",name:"Washington"},{code:"WV",name:"West Virginia"},{code:"WI",name:"Wisconsin"},{code:"WY",name:"Wyoming"},{code:"DC",name:"Washington DC"},{code:"PR",name:"Puerto Rico"}];

const categories = { maintenance: { en: "Maintenance", es: "Mantenimiento", color: "#16A34A" }, improvements: { en: "Improvements", es: "Mejoras", color: "#3B82F6" }, installation: { en: "Installation", es: "Instalación", color: "#8B5CF6" }, specials: { en: "Specials", es: "Especiales", color: "#F59E0B" } };
const payMethods = { en: { zelle: "Zelle", card: "Credit Card", ach: "ACH Transfer", cash: "Cash", check: "Check" }, es: { zelle: "Zelle", card: "Tarjeta de Crédito", ach: "Transferencia ACH", cash: "Efectivo", check: "Cheque" } };

const SearchDrop = ({ value, onSelect, items, placeholder, displayFn, filterFn, v, dark, width, dropdownMinWidth }) => {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef();
  useEffect(() => { const fn = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }; document.addEventListener("mousedown", fn); return () => document.removeEventListener("mousedown", fn); }, []);
  const filtered = q ? items.filter(i => filterFn(i, q.toLowerCase())) : items;
  return (
    <div ref={ref} style={{ position: "relative", width: width || "100%" }}>
      <div onClick={() => setOpen(!open)} style={{ padding: "7px 10px", borderRadius: 6, border: "1px solid " + v.border, background: dark ? "rgba(255,255,255,0.04)" : v.surface, color: value ? v.text : v.textTer, fontSize: 12, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", height: 34, boxSizing: "border-box" }}>
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value ? displayFn(items.find(i => filterFn(i, value.toLowerCase())) || {}, value) : placeholder}</span>
        <span style={{ fontSize: 9, color: v.textTer, marginLeft: 6, flexShrink: 0 }}>▾</span>
      </div>
      {open && (
        <div style={{ position: "absolute", top: "100%", left: 0, width: dropdownMinWidth || undefined, minWidth: dropdownMinWidth ? undefined : 200, marginTop: 3, background: v.cardBg, border: "1px solid " + v.border, borderRadius: 8, boxShadow: "0 8px 24px rgba(0,0,0,0.15)", zIndex: 20, maxHeight: 200, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: 6, borderBottom: "1px solid " + v.border }}>
            <input autoFocus value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => { if (e.key === "Escape") setOpen(false); }} placeholder={"🔍 " + placeholder} style={{ width: "100%", padding: "5px 8px", borderRadius: 5, border: "1px solid " + v.border, background: dark ? "rgba(255,255,255,0.04)" : "#fff", color: v.text, fontSize: 11, outline: "none", fontFamily: "'DM Sans'", boxSizing: "border-box" }} />
          </div>
          <div style={{ overflowY: "auto", maxHeight: 160 }}>
            {filtered.slice(0, 40).map((item, i) => (
              <div key={i} onClick={() => { onSelect(item); setOpen(false); setQ(""); }} style={{ padding: "6px 10px", cursor: "pointer", fontSize: 11, color: v.text }} onMouseEnter={e => e.currentTarget.style.background = dark ? "rgba(255,255,255,0.04)" : "#F8FAFC"} className="cy-row-hover" onMouseLeave={e => e.currentTarget.style.background = "transparent"}>{displayFn(item)}</div>
            ))}
            {filtered.length === 0 && <p style={{ padding: 10, fontSize: 11, color: v.textTer, textAlign: "center" }}>No results</p>}
          </div>
        </div>
      )}
    </div>
  );
};

const PhoneField = ({ areaCode, number, onAreaChange, onNumberChange, items, v, dark, placeholder, error }) => (
  <div style={{ display: "flex", gap: 8 }}>
    <SearchDrop value={areaCode} onSelect={i => onAreaChange(i.code)} items={items} placeholder={placeholder || "Cód."} displayFn={(i) => i.code ? "("+i.code+")" : ""} filterFn={(i,q) => i.code.includes(q)||i.city.toLowerCase().includes(q)} v={v} dark={dark} width={76} dropdownMinWidth={76} />
    <input value={number} onChange={e => onNumberChange(e.target.value.replace(/[^0-9-]/g, ""))} style={{ flex: 1, padding: "7px 10px", borderRadius: 6, border: "1px solid " + (error ? "#EF4444" : v.border), background: dark ? "rgba(255,255,255,0.04)" : v.surface, color: v.text, fontSize: 12, outline: "none", fontFamily: "'DM Sans'", height: 34, boxSizing: "border-box" }} placeholder="555-0142" maxLength="8" />
  </div>
);

export default function Clients({ dark, v, t, lang }) {
  const { clients, services, crews, addClient, updateClient, getClientServices, getClientMonthlyTotal } = useData();
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [view, setView] = useState("list");
  const [toast, setToast] = useState(null);
  const [crewDrop, setCrewDrop] = useState(false);
  const crewRef = useRef(null);
  const [editId, setEditId] = useState(null);
  const [payDropdown, setPayDropdown] = useState(false);
  const [svcTab, setSvcTab] = useState("maintenance");
  const [errors, setErrors] = useState({});
  const [showConfirm, setShowConfirm] = useState(false);
  const emptyForm = { name: "", email: "", phone: "", areaCode: "", street: "", city: "", state: "", zip: "", paymentMethod: "zelle", zellePhone: "", billingType: "monthly", defaultCrewId: "", clientSince: "", services: [], notes: "" };
  const [form, setForm] = useState(emptyForm);
  const pay = payMethods[lang] || payMethods.en;
  const L = (en, es) => lang === "es" ? es : en;

  const filtered = clients.filter(cl => {
    if (filter === "active" && cl.status !== "active") return false;
    if (filter === "inactive" && cl.status !== "inactive") return false;
    if (search && !cl.name.toLowerCase().includes(search.toLowerCase()) && !cl.email.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });
  const totalMonthly = clients.filter(x => x.status === "active").reduce((s, cl) => s + getClientMonthlyTotal(cl.id), 0);
  useEffect(() => {
    const handler = (e) => { if (crewRef.current && !crewRef.current.contains(e.target)) setCrewDrop(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const openAdd = () => { setEditId(null); setForm(emptyForm); setErrors({}); setSvcTab("maintenance"); setView("form"); };
  const openEdit = (cl) => { setEditId(cl.id); const parts = (cl.address||"").split(", "); const sz = (parts[2]||"").split(" "); const pp = (cl.phone||"").match(/\((\d{3})\)\s?(.+)/); setForm({ name: cl.name, email: cl.email, phone: pp?pp[2]:cl.phone, areaCode: pp?pp[1]:"", street: parts[0]||"", city: parts[1]||"", state: sz[0]||"", zip: sz[1]||"", paymentMethod: cl.paymentMethod, zellePhone: cl.zellePhone||"", billingType: cl.billingType||"monthly", defaultCrewId: cl.defaultCrewId||"", clientSince: cl.clientSince||"", services: (cl.services||[]).map(s => typeof s === "string" ? { serviceId: s, qty: 1 } : s), notes: cl.notes||"" }); setErrors({}); setSvcTab("maintenance"); setView("form"); };
  const validate = () => { const e={}; if(!form.name.trim())e.name=1; if(!form.email.trim()||!isValidEmail(form.email))e.email=1; if(!form.phone.trim()||!form.areaCode)e.phone=1; if(!form.street.trim())e.street=1; if(!form.city)e.city=1; if(!form.state)e.state=1; if(!form.zip.trim())e.zip=1; if(!form.services.length)e.services=1; setErrors(e); return !Object.keys(e).length; };
  const handleSave = () => { if(!validate()) return; const c={...form, name:capitalize(form.name), phone:"("+form.areaCode+") "+form.phone, address:[form.street,form.city,form.state+" "+form.zip].filter(Boolean).join(", "), billingType:form.billingType, defaultCrewId:form.defaultCrewId, clientSince:form.clientSince}; if(editId){ updateClient(editId,c); setToast(L("Client updated","Cliente actualizado")); } else { addClient(c); setToast(L("Client created","Cliente creado")); } setTimeout(() => setToast(null), 3000); setView("list"); };
  const toggleService = (sid) => setForm(f => {
    const exists = f.services.find(s => (typeof s === "string" ? s : s.serviceId) === sid);
    if (exists) return { ...f, services: f.services.filter(s => (typeof s === "string" ? s : s.serviceId) !== sid) };
    return { ...f, services: [...f.services, { serviceId: sid, qty: 1 }] };
  });
  const updateServiceQty = (sid, qty) => setForm(f => ({
    ...f, services: qty <= 0 
      ? f.services.filter(s => (typeof s === "string" ? s : s.serviceId) !== sid)
      : f.services.map(s => (typeof s === "string" ? s : s.serviceId) === sid ? { serviceId: sid, qty } : s)
  }));
  const getSvcQty = (sid) => { const s = form.services.find(x => (typeof x === "string" ? x : x.serviceId) === sid); if (!s) return 0; return typeof s === "string" ? 1 : (s?.qty || 1); };
  const isSvcSelected = (sid) => form.services.some(s => (typeof s === "string" ? s : s.serviceId) === sid);
  const toggleStatus = (cl) => updateClient(cl.id, { status: cl.status==="active"?"inactive":"active" });

  const I = (err) => ({ width:"100%", padding:"7px 10px", borderRadius:6, border:"1px solid "+(err?"#EF4444":v.border), background:dark?"rgba(255,255,255,0.04)":v.surface, color:v.text, fontSize:12, outline:"none", fontFamily:"'DM Sans'", height:34, boxSizing:"border-box" });
  const LB = { fontSize:10, fontWeight:600, color:v.textSec, marginBottom:4, display:"block" };
  const ROW = { display:"flex", gap:24, marginBottom:14 };
  const SH = (text) => <div style={{ fontSize:10, fontWeight:700, color:"#16A34A", textTransform:"uppercase", letterSpacing:"0.08em", paddingBottom:8, marginBottom:14, borderBottom:"1px solid "+v.border }}>{text}</div>;

  if (view === "form") return (
    <div>
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14 }}>
        <button onClick={() => setView("list")} style={{ display:"inline-flex", alignItems:"center", justifyContent:"center", width:36, height:36, borderRadius:6, border:"1px solid "+v.border, background:v.cardBg, cursor:"pointer" }}><ChevronLeft size={16} color={v.text}/></button>
        <h1 style={{ fontSize:22, fontWeight:800, color:v.text, margin:0 }}>{editId ? L("Edit Client","Editar Cliente") : L("New Client","Nuevo Cliente")}</h1>
      </div>

      <div style={{ display:"flex", gap:16, alignItems:"flex-start" }}>
        {/* LEFT */}
        <div style={{ flex:1, background:v.cardBg, border:"1px solid "+v.border, borderRadius:10, padding:"20px 24px" }}>
          {SH(L("Personal Information","Información Personal"))}
          <div style={ROW}>
            <div style={{ flex:1 }}><span style={LB}>{L("Name","Nombre")} *</span><input value={form.name} onChange={e => setForm({...form, name:capitalize(e.target.value)})} style={I(errors.name)} placeholder="John Smith" /></div>
            <div style={{ flex:1 }}><span style={LB}>Email *</span><div style={{ position:"relative" }}><input value={form.email} onChange={e => { const val = e.target.value.replace(/,/g, "."); setForm({...form, email:val}); if(errors.email) setErrors({...errors,email:0}); }} style={{...I(errors.email), borderColor:!errors.email&&form.email&&isValidEmail(form.email)?"#16A34A":errors.email||(!errors.email&&form.email&&!isValidEmail(form.email))?"#EF4444":v.border, paddingRight:30}} placeholder="john@email.com" />{form.email && <span style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", fontSize:14, fontWeight:700, color:isValidEmail(form.email)?"#16A34A":"#EF4444" }}>{isValidEmail(form.email)?"✓":"✗"}</span>}</div></div>
          </div>
          <div style={ROW}>
            <div style={{ flex:1 }}><span style={LB}>{L("Phone","Teléfono")} *</span><PhoneField areaCode={form.areaCode} number={form.phone} onAreaChange={c => setForm({...form,areaCode:c})} onNumberChange={n => setForm(f=>({...f,phone:n,zellePhone:n}))} items={US_AREA_CODES} v={v} dark={dark} placeholder={L("Code","Cód.")} error={errors.phone} /></div>
            <div style={{ width:160 }}><span style={LB}>{L("Payment","Pago")} *</span><div style={{ position:"relative" }}><div onClick={() => setPayDropdown(!payDropdown)} style={{...I(), cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center"}}><span>{pay[form.paymentMethod]}</span><span style={{ fontSize:9, color:v.textTer }}>▾</span></div>{payDropdown && <div style={{ position:"absolute", top:"100%", left:0, width:220, marginTop:3, background:v.cardBg, border:"1px solid "+v.border, borderRadius:8, boxShadow:"0 8px 24px rgba(0,0,0,0.15)", zIndex:10, overflow:"hidden" }}>{Object.entries(pay).map(([k,label]) => { const soon=k==="card"||k==="ach"; const sel=form.paymentMethod===k; return <div key={k} onClick={() => {if(!soon){setForm({...form,paymentMethod:k});setPayDropdown(false);}}} style={{ padding:"8px 12px", cursor:soon?"default":"pointer", opacity:soon?0.5:1, background:sel?(dark?"rgba(22,163,74,0.08)":"#DCFCE7"):"transparent", borderBottom:"1px solid "+v.border+"40", display:"flex", alignItems:"center", fontSize:12 }} onMouseEnter={e=>{if(!soon&&!sel)e.currentTarget.style.background=dark?"rgba(255,255,255,0.04)":"#F8FAFC"}} onMouseLeave={e=>{if(!sel)e.currentTarget.style.background="transparent"}}><span style={{ fontWeight:sel?600:400, color:soon?v.textTer:v.text }}>{label}</span>{soon&&<span style={{ fontSize:8, padding:"1px 5px", borderRadius:3, background:"#FEF3C7", color:"#F59E0B", marginLeft:"auto", fontWeight:700 }}>{L("Soon","Pronto")}</span>}{sel&&!soon&&<span style={{ marginLeft:"auto", color:"#16A34A", fontWeight:700 }}>✓</span>}</div>; })}</div>}</div></div>
            {form.paymentMethod==="zelle" && <div style={{ flex:1 }}><span style={LB}>Zelle</span><PhoneField areaCode={form.areaCode} number={form.zellePhone} onAreaChange={c => setForm({...form,areaCode:c})} onNumberChange={n => setForm({...form,zellePhone:n})} items={US_AREA_CODES} v={v} dark={dark} placeholder={L("Code","Cód.")} /></div>}
          </div>

          {/* Billing Type */}
          <div style={{ marginBottom:14 }}>
            <span style={LB}>{L("Billing Type","Tipo de Facturación")} *</span>
            <div style={{ display:"flex", gap:8 }}>
              {[
                { key:"monthly", en:"Monthly (consolidated)", es:"Mensual (consolidado)", icon:"📅", desc_en:"Invoice at end of month with all services", desc_es:"Factura al fin de mes con todos los servicios" },
                { key:"per_visit", en:"Per Visit", es:"Por Visita", icon:"📋", desc_en:"Invoice after each completed job", desc_es:"Factura después de cada trabajo completado" },
              ].map(bt => {
                const sel = form.billingType === bt.key;
                return (
                  <div key={bt.key} onClick={() => setForm({...form, billingType: bt.key})}
                    style={{ flex:1, padding:"10px 12px", borderRadius:8, cursor:"pointer",
                      border:"2px solid "+(sel?"#16A34A":v.border),
                      background:sel?(dark?"rgba(22,163,74,0.08)":"#DCFCE7"):"transparent",
                      transition:"all 0.15s" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4 }}>
                      {bt.key === "monthly" ? <CalendarDays size={15} color={sel?"#16A34A":v.textSec}/> : <ClipboardList size={15} color={sel?"#16A34A":v.textSec}/>}
                      <span style={{ fontSize:12, fontWeight:700, color:sel?"#16A34A":v.text }}>{lang==="es"?bt.es:bt.en}</span>
                    </div>
                    <span style={{ fontSize:10, color:v.textSec }}>{lang==="es"?bt.desc_es:bt.desc_en}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Client Since + Crew */}
          <div style={{ display:"flex", gap:14, marginBottom:14 }}>
            <div style={{ width:200 }}>
              <span style={LB}>{L("Client Since","Cliente Desde")}</span>
              <input type="month" value={form.clientSince ? form.clientSince.slice(0,7) : ""} onChange={e => setForm({...form, clientSince: e.target.value + "-01"})}
                style={{...I(), cursor:"pointer"}} />
            </div>
            <div style={{ flex:1 }}>
              <span style={LB}>{L("Assigned Crew","Cuadrilla Asignada")}</span>
            {(() => {
              const selCrew = (crews||[]).find(cr => cr.id === form.defaultCrewId);
              return (
                <div ref={crewRef} style={{ position:"relative" }}>
                  <div onClick={() => setCrewDrop(!crewDrop)} style={{...I(), cursor:"pointer", display:"flex", alignItems:"center", gap:8 }}>
                    {selCrew ? (
                      <>
                        <div style={{ width:8, height:8, borderRadius:"50%", background:selCrew.color, flexShrink:0 }}/>
                        <span style={{ flex:1, fontSize:12, fontWeight:600, color:v.text }}>{selCrew.name}</span>
                        <span style={{ fontSize:10, color:v.textSec }}>{selCrew.leader} · {selCrew.members.length}</span>
                        <span style={{ fontSize:9, color:v.textTer }}>▾</span>
                      </>
                    ) : (
                      <>
                        <span style={{ flex:1, fontSize:12, color:v.textSec }}>{L("Select crew...","Seleccionar cuadrilla...")}</span>
                        <span style={{ fontSize:9, color:v.textTer }}>▾</span>
                      </>
                    )}
                  </div>
                  {crewDrop && (
                    <div style={{ position:"absolute", top:"100%", left:0, right:0, marginTop:4, background:v.cardBg, border:"1px solid "+v.border, borderRadius:8, boxShadow:"0 8px 24px rgba(0,0,0,0.15)", zIndex:20, overflow:"hidden" }}>
                      <div onClick={() => { setForm({...form, defaultCrewId:""}); setCrewDrop(false); }}
                        style={{ padding:"8px 12px", cursor:"pointer", fontSize:11, color:v.textSec, borderBottom:"1px solid "+v.border+"40" }}
                        onMouseEnter={e => e.currentTarget.style.background = dark?"rgba(255,255,255,0.04)":"#F8FAFC"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                        {L("No crew","Sin cuadrilla")}
                      </div>
                      {(crews||[]).map(cr => {
                        const sel = form.defaultCrewId === cr.id;
                        return (
                          <div key={cr.id} onClick={() => { setForm({...form, defaultCrewId:cr.id}); setCrewDrop(false); }}
                            style={{ padding:"8px 12px", cursor:"pointer", display:"flex", alignItems:"center", gap:8,
                              background:sel?(dark?"rgba(22,163,74,0.08)":"#DCFCE7"):"transparent" }}
                            onMouseEnter={e => { if(!sel) e.currentTarget.style.background = dark?"rgba(255,255,255,0.04)":"#F8FAFC"; }}
                            onMouseLeave={e => { if(!sel) e.currentTarget.style.background = "transparent"; }}>
                            <div style={{ width:8, height:8, borderRadius:"50%", background:cr.color, flexShrink:0 }}/>
                            <div style={{ flex:1 }}>
                              <div style={{ fontSize:12, fontWeight:sel?700:500, color:sel?"#16A34A":v.text }}>{cr.name}</div>
                              <div style={{ fontSize:10, color:v.textSec }}>{cr.leader} · {cr.members.length} {L("members","miembros")}</div>
                            </div>
                            {sel && <span style={{ fontSize:12, fontWeight:700, color:"#16A34A" }}>✓</span>}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}
            </div>
          </div>

          <div style={{ borderTop:"1px solid "+v.border, marginBottom:14 }} />
          {SH(L("Address","Dirección"))}
          <div style={{ marginBottom:14 }}><span style={LB}>{L("Street","Calle")} *</span><input value={form.street} onChange={e => setForm({...form, street:capitalize(e.target.value)})} style={I(errors.street)} placeholder="742 Evergreen Terrace" /></div>
          <div style={{ display:"flex", gap:24, marginBottom:14 }}>
            <div style={{ flex:1 }}><span style={LB}>{L("City","Ciudad")} *</span><SearchDrop value={form.city} onSelect={i => setForm({...form, city:i.name, state:i.state, zip: CITY_ZIPS[i.full] || form.zip})} items={US_CITIES} placeholder={L("Search...","Buscar...")} displayFn={i => i.name?i.name:""} filterFn={(i,q) => i.name.toLowerCase().includes(q)||i.state.toLowerCase().includes(q)} v={v} dark={dark} /></div>
            <div style={{ width:120 }}><span style={LB}>{L("State","Estado")} *</span><SearchDrop value={form.state} onSelect={i => setForm({...form, state:i.code})} items={US_STATES} placeholder="..." displayFn={i => i.code?i.code:""} filterFn={(i,q) => i.code.toLowerCase().includes(q)||i.name.toLowerCase().includes(q)} v={v} dark={dark} /></div>
            <div style={{ width:72 }}><span style={LB}>ZIP *</span><div style={{ position:"relative" }}><input value={form.zip} onChange={e => setForm({...form, zip:e.target.value.replace(/[^0-9]/g,"")})} style={{...I(errors.zip), borderColor:form.zip.length===5?"#16A34A":form.zip.length>0?"#EF4444":v.border, paddingRight:24}} placeholder="78701" maxLength="5" />{form.zip && <span style={{ position:"absolute", right:6, top:"50%", transform:"translateY(-50%)", fontSize:12, fontWeight:700, color:form.zip.length===5?"#16A34A":"#EF4444" }}>{form.zip.length===5?"✓":"✗"}</span>}</div></div>
          </div>
          <div><span style={LB}>{L("Notes (optional)","Notas (opcional)")}</span><input value={form.notes} onChange={e => setForm({...form, notes:e.target.value})} style={I()} placeholder={L("Internal notes...","Notas internas...")} /></div>
        </div>

        {/* RIGHT */}
        <div style={{ flex:"0 0 340px", background:v.cardBg, border:"1px solid "+v.border, borderRadius:10, padding:"20px 24px" }}>
          {SH(L("Assigned Services","Servicios Asignados") + " *")}
          <div style={{ display:"flex", gap:6, marginBottom:12 }}>
            {Object.entries(categories).map(([key,cat]) => { const cnt=services.filter(s=>s.active&&s.category===key).length; const sel=services.filter(s=>s.active&&s.category===key&&isSvcSelected(s.id)).length; return <button key={key} onClick={() => setSvcTab(key)} style={{ flex:1, padding:"6px 4px", borderRadius:6, fontSize:9, whiteSpace:"nowrap", fontWeight:600, border:"1px solid "+(svcTab===key?cat.color:v.border), background:svcTab===key?cat.color+(dark?"15":"08"):"transparent", color:svcTab===key?cat.color:v.textSec, cursor:"pointer", textAlign:"center" }}>{cat[lang]} ({cnt}){sel>0&&<span style={{ marginLeft:2, fontSize:7, padding:"0 4px", borderRadius:4, background:cat.color, color:"#fff" }}>{sel}</span>}</button>; })}
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:4, maxHeight:220, overflowY:"auto", marginBottom:10 }}>
            {services.filter(s=>s.active&&s.category===svcTab).map(svc => { const qty=getSvcQty(svc.id); const sel=qty>0; const cc=categories[svc.category]?.color||"#16A34A"; return <div key={svc.id} style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 10px", borderRadius:6, background:sel?cc+"08":"transparent", border:"1px solid "+(sel?cc+"30":v.border+"50"), transition:"all 0.1s" }}><span style={{ fontSize:11, fontWeight:sel?600:400, color:sel?v.text:v.textSec, flex:1 }}>{lang==="es"?svc.nameEs:svc.name}</span><div style={{ display:"flex", alignItems:"center", gap:3 }}><button onClick={()=>{if(qty>0)updateServiceQty(svc.id,qty-1);}} style={{ width:22, height:22, borderRadius:4, border:"1px solid "+(qty>0?cc+"40":v.border), background:qty>0?cc+"08":"transparent", cursor:qty>0?"pointer":"default", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, color:qty>0?cc:v.textSec, fontWeight:700, opacity:qty>0?1:0.4 }}>−</button><span style={{ fontSize:12, fontWeight:700, color:sel?cc:v.textSec, minWidth:22, textAlign:"center" }}>{qty}</span><button onClick={()=>{if(qty===0){setForm(f=>({...f,services:[...f.services,{serviceId:svc.id,qty:1}]}));}else{updateServiceQty(svc.id,qty+1);}}} style={{ width:22, height:22, borderRadius:4, border:"1px solid "+(cc+"40"), background:cc+"08", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, color:cc, fontWeight:700 }}>+</button></div><span style={{ fontSize:12, fontWeight:700, color:sel?cc:v.textSec, minWidth:55, textAlign:"right" }}>{sel?"$"+(svc.price*qty):"$"+svc.price}</span></div>; })}
          </div>
          {form.services.length > 0 && <div style={{ borderTop:"1px solid "+v.border, paddingTop:10 }}>
            <div style={{ display:"flex", gap:4, flexWrap:"wrap", marginBottom:8 }}>{form.services.map(cs => { const sid = typeof cs === "string" ? cs : cs.serviceId; const qty = typeof cs === "string" ? 1 : (cs.qty||1); const svc=services.find(s=>s.id===sid); if(!svc) return null; const cc=categories[svc.category]?.color||"#16A34A"; return <span key={sid} onClick={() => toggleService(sid)} style={{ fontSize:9, fontWeight:600, padding:"3px 7px", borderRadius:4, background:cc+"12", color:cc, cursor:"pointer", display:"flex", alignItems:"center", gap:3 }}>{lang==="es"?svc.nameEs:svc.name} ×{qty} <span style={{ opacity:0.4, fontSize:11 }}>×</span></span>; })}</div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 10px", borderRadius:6, background:dark?"rgba(22,163,74,0.06)":"#F0FDF4" }}><span style={{ fontSize:10, color:v.textSec }}>{form.services.length} {L("services","servicios")}</span><span style={{ fontSize:14, fontWeight:800, color:"#16A34A", fontFamily:"'Syne'" }}>${form.services.reduce((s,cs) => { const sid=typeof cs==="string"?cs:cs.serviceId; const qty=typeof cs==="string"?1:(cs.qty||1); const svc=services.find(x=>x.id===sid); return s+(svc?.price||0)*qty; },0)}{L("/mo","/mes")}</span></div>
          </div>}
          {errors.services && <p style={{ fontSize:10, color:"#EF4444", marginTop:6 }}>{L("Select at least one","Selecciona al menos uno")}</p>}
        </div>
      </div>
      {/* Confirmation Modal */}
      {showConfirm && (
        <div onClick={() => setShowConfirm(false)} style={{ position:"fixed", inset:0, zIndex:300, background:"rgba(0,0,0,0.5)", backdropFilter:"blur(4px)", display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
          <div onClick={e => e.stopPropagation()} style={{ width:"100%", maxWidth:480, background:v.cardBg, borderRadius:12, border:"1px solid "+v.border, padding:"24px 28px", boxShadow:"0 24px 64px rgba(0,0,0,0.2)" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
              <div style={{ width:40, height:40, borderRadius:10, background:dark?"rgba(22,163,74,0.12)":"#DCFCE7", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2" strokeLinecap="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
              </div>
              <div>
                <h3 style={{ fontSize:16, fontWeight:700, color:v.text, fontFamily:"'Syne'" }}>{L("Review before saving","Revisa antes de guardar")}</h3>
                <p style={{ fontSize:11, color:v.textTer }}>{L("Please confirm the client details","Confirma los datos del cliente")}</p>
              </div>
            </div>

            <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:16 }}>
              <div style={{ display:"flex", justifyContent:"space-between", padding:"8px 12px", borderRadius:6, background:dark?"rgba(255,255,255,0.02)":v.surface }}>
                <span style={{ fontSize:11, color:v.textTer }}>{L("Name","Nombre")}</span>
                <span style={{ fontSize:12, fontWeight:600, color:v.text }}>{capitalize(form.name)}</span>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", padding:"8px 12px", borderRadius:6, background:dark?"rgba(255,255,255,0.02)":v.surface }}>
                <span style={{ fontSize:11, color:v.textTer }}>Email</span>
                <span style={{ fontSize:12, fontWeight:600, color:v.text }}>{form.email}</span>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", padding:"8px 12px", borderRadius:6, background:dark?"rgba(255,255,255,0.02)":v.surface }}>
                <span style={{ fontSize:11, color:v.textTer }}>{L("Phone","Teléfono")}</span>
                <span style={{ fontSize:12, fontWeight:600, color:v.text }}>({form.areaCode}) {form.phone}</span>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", padding:"8px 12px", borderRadius:6, background:dark?"rgba(255,255,255,0.02)":v.surface }}>
                <span style={{ fontSize:11, color:v.textTer }}>{L("Payment","Pago")}</span>
                <span style={{ fontSize:12, fontWeight:600, color:v.text }}>{pay[form.paymentMethod]}{form.paymentMethod==="zelle" ? " — ("+form.areaCode+") "+form.zellePhone : ""}</span>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", padding:"8px 12px", borderRadius:6, background:dark?"rgba(255,255,255,0.02)":v.surface }}>
                <span style={{ fontSize:11, color:v.textTer }}>{L("Billing","Facturación")}</span>
                <span style={{ fontSize:12, fontWeight:600, color:v.text }}>{form.billingType==="monthly"?L("Monthly","Mensual"):L("Per Visit","Por Visita")}</span>
              </div>
              {form.clientSince && <div style={{ display:"flex", justifyContent:"space-between", padding:"8px 12px", borderRadius:6, background:dark?"rgba(255,255,255,0.02)":v.surface }}>
                <span style={{ fontSize:11, color:v.textTer }}>{L("Client Since","Cliente Desde")}</span>
                <span style={{ fontSize:12, fontWeight:600, color:v.text }}>{new Date(form.clientSince).toLocaleDateString(lang==="es"?"es-EC":"en-US",{month:"short",year:"numeric"})}</span>
              </div>}
              {form.defaultCrewId && (() => { const cr = (crews||[]).find(c=>c.id===form.defaultCrewId); return cr ? <div style={{ display:"flex", justifyContent:"space-between", padding:"8px 12px", borderRadius:6, background:dark?"rgba(255,255,255,0.02)":v.surface }}>
                <span style={{ fontSize:11, color:v.textTer }}>{L("Crew","Cuadrilla")}</span>
                <span style={{ fontSize:12, fontWeight:600, color:cr.color }}>● {cr.name}</span>
              </div> : null; })()}
              <div style={{ display:"flex", justifyContent:"space-between", padding:"8px 12px", borderRadius:6, background:dark?"rgba(255,255,255,0.02)":v.surface }}>
                <span style={{ fontSize:11, color:v.textTer }}>{L("Address","Dirección")}</span>
                <span style={{ fontSize:12, fontWeight:600, color:v.text, textAlign:"right", maxWidth:260 }}>{form.street}, {form.city}, {form.state} {form.zip}</span>
              </div>
              <div style={{ padding:"8px 12px", borderRadius:6, background:dark?"rgba(255,255,255,0.02)":v.surface }}>
                <span style={{ fontSize:11, color:v.textTer, display:"block", marginBottom:6 }}>{L("Services","Servicios")} ({form.services.length})</span>
                <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                  {form.services.map(cs => { const sid=typeof cs==="string"?cs:cs.serviceId; const qty=typeof cs==="string"?1:(cs.qty||1); const svc = services.find(s=>s.id===sid); if(!svc) return null; const cc = categories[svc.category]?.color||"#16A34A"; return <span key={sid} style={{ fontSize:9, fontWeight:600, padding:"2px 6px", borderRadius:4, background:cc+"12", color:cc }}>{lang==="es"?svc.nameEs:svc.name} ×{qty} ${svc.price*qty}</span>; })}
                </div>
                <p style={{ fontSize:12, fontWeight:700, color:"#16A34A", marginTop:6, textAlign:"right" }}>Total: ${form.services.reduce((s,cs) => { const sid=typeof cs==="string"?cs:cs.serviceId; const qty=typeof cs==="string"?1:(cs.qty||1); const svc=services.find(x=>x.id===sid); return s+(svc?.price||0)*qty; },0)}{L("/mo","/mes")}</p>
              </div>
              {form.notes && <div style={{ display:"flex", justifyContent:"space-between", padding:"8px 12px", borderRadius:6, background:dark?"rgba(255,255,255,0.02)":v.surface }}>
                <span style={{ fontSize:11, color:v.textTer }}>{L("Notes","Notas")}</span>
                <span style={{ fontSize:12, fontStyle:"italic", color:v.textSec }}>{form.notes}</span>
              </div>}
            </div>

            <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
              <button onClick={() => setShowConfirm(false)} style={{ padding:"9px 20px", borderRadius:8, border:"1px solid "+v.border, background:"transparent", color:v.textSec, fontSize:12, fontWeight:600, cursor:"pointer" }}>{L("Go back & edit","Volver a editar")}</button>
              <button onClick={() => { setShowConfirm(false); handleSave(); }} style={{ padding:"9px 20px", borderRadius:8, background:"linear-gradient(135deg,#16A34A,#22C55E)", border:"none", color:"#fff", fontSize:12, fontWeight:600, cursor:"pointer", boxShadow:"0 2px 8px rgba(22,163,74,0.3)" }}>{L("Confirm & Save","Confirmar y Guardar")}</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display:"flex", gap:10, justifyContent:"flex-end", marginTop:14 }}>
        <button onClick={() => setView("list")} style={{ padding:"10px 28px", borderRadius:8, border:"1px solid "+v.border, background:"transparent", color:v.textSec, fontSize:13, fontWeight:600, cursor:"pointer" }}>{L("Cancel","Cancelar")}</button>

        <button onClick={() => { if(validate()) setShowConfirm(true); }} style={{ padding:"10px 28px", borderRadius:8, background:"linear-gradient(135deg,#16A34A,#22C55E)", border:"none", color:"#fff", fontSize:13, fontWeight:600, cursor:"pointer", boxShadow:"0 2px 8px rgba(22,163,74,0.3)" }}>{L("Save Client","Guardar Cliente")}</button>
      </div>
    </div>
  );

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:12, marginBottom:18 }}>
        <div><h1 style={{ fontSize:22, fontWeight:800, color:v.text, margin:0 }}>{L("Clients","Clientes")}</h1><p style={{ fontSize:13, color:v.textSec, margin:"2px 0 0" }}>{L("Manage your client database","Gestiona tu base de clientes")}</p></div>
        <button onClick={openAdd} style={{ padding:"8px 16px", borderRadius:8, background:"linear-gradient(135deg,#16A34A,#22C55E)", border:"none", color:"#fff", fontSize:12, fontWeight:600, cursor:"pointer" }}>{L("Add Client","Agregar Cliente")}</button>
      </div>
      {(() => {
        const now = new Date();
        const thisMonth = now.getFullYear() + "-" + String(now.getMonth()+1).padStart(2,"0");
        const over1y = clients.filter(cl => cl.clientSince && (now - new Date(cl.clientSince)) / (365.25*24*60*60*1000) >= 1).length;
        const over5y = clients.filter(cl => cl.clientSince && (now - new Date(cl.clientSince)) / (365.25*24*60*60*1000) >= 5).length;
        const newClients = clients.filter(cl => cl.clientSince && cl.clientSince.slice(0,7) === thisMonth).length;
        const inactive = clients.filter(cl => cl.status === "inactive").length;
        return (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(120px, 1fr))", gap:12, marginBottom:16 }}>
            {[
              {l:L("Total","Total"), v:clients.length, c:"#3B82F6"},
              {l:L("Active","Activos"), v:clients.filter(x=>x.status==="active").length, c:"#16A34A"},
              {l:L("New","Nuevos"), v:newClients, c:"#06B6D4"},
              {l:L("Inactive","Inactivos"), v:inactive, c:"#94A3B8"},
              {l:L("+1 Year","+1 Año"), v:over1y, c:"#F59E0B"},
              {l:L("+5 Years","+5 Años"), v:over5y, c:"#8B5CF6"},
              {l:L("+10 Years","+10 Años"), v:clients.filter(cl => cl.clientSince && (now - new Date(cl.clientSince)) / (365.25*24*60*60*1000) >= 10).length, c:"#DC2626"},
            ].map((k,i) => <div key={i} style={{ padding:"10px 14px", borderRadius:10, background:v.cardBg, border:"1px solid "+v.border }} className="cy-card-hover">
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                <span style={{ fontSize:10, color:v.textSec, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.04em" }}>{k.l}</span>
              </div>
              <span style={{ fontSize:18, fontWeight:800, color:k.c, display:"block", textAlign:"center" }}>{k.v}</span>
            </div>)}
          </div>
        );
      })()}
      <div style={{ display:"flex", gap:6, marginBottom:12, alignItems:"center" }}>
        {["all","active","inactive"].map(k => <button key={k} onClick={() => setFilter(k)} style={{ padding:"4px 10px", borderRadius:5, border:"1px solid "+(filter===k?"#16A34A":v.border), background:filter===k?(dark?"rgba(22,163,74,0.12)":"#DCFCE7"):"transparent", color:filter===k?"#16A34A":v.textSec, fontSize:10, fontWeight:600, cursor:"pointer" }}>{k==="all"?L("All","Todos"):k==="active"?L("Active","Activos"):L("Inactive","Inactivos")}</button>)}
        <div style={{ flex:1 }} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder={L("Search...","Buscar...")} style={{...I(), maxWidth:200}} />
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1.3fr 180px 70px 80px 80px 80px", gap:6, padding:"6px 14px", fontSize:8, fontWeight:700, color:v.textTer, textTransform:"uppercase", letterSpacing:"0.06em" }}>
        <span>{L("Client","Cliente")}</span><span>{L("Services","Servicios")}</span><span>{L("Value","Valor")}</span><span>{L("Payment","Pago")}</span><span>{L("Status","Estado")}</span><span>{L("Actions","Acciones")}</span>
      </div>
      <div style={{ borderRadius:8, border:"1px solid "+v.border, overflow:"hidden", background:v.cardBg }}>
        {filtered.map((cl,idx) => { const clSvc=getClientServices(cl.id); const mt=getClientMonthlyTotal(cl.id); const overdueMap={"CLT-003":345.92,"CLT-007":780}; const od=overdueMap[cl.id]; return <div key={cl.id} style={{ display:"grid", gridTemplateColumns:"1.3fr 180px 70px 80px 80px 80px", gap:6, alignItems:"flex-start", padding:"10px 14px", borderBottom:idx<filtered.length-1?"1px solid "+v.border:"none" }} onMouseEnter={e=>e.currentTarget.style.background=dark?"rgba(255,255,255,0.02)":"#FAFFFE"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
          <div style={{ display:"flex", gap:8 }}><div style={{ width:30, height:30, borderRadius:7, background:cl.status==="active"?(dark?"rgba(22,163,74,0.15)":"#DCFCE7"):v.surface, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, color:cl.status==="active"?"#16A34A":v.textTer, flexShrink:0 }}>{cl.name[0]}</div><div style={{ minWidth:0 }}><div style={{ display:"flex", alignItems:"center", gap:5 }}><p style={{ fontSize:12, fontWeight:600, color:v.text }}>{cl.name}</p>{cl.status==="inactive"&&<span style={{ fontSize:7, fontWeight:700, padding:"1px 4px", borderRadius:3, background:"#FEF2F2", color:"#EF4444" }}>{L("Inactive","Inactivo")}</span>}{(() => { if(!cl.clientSince) return null; const now=new Date(); const since=new Date(cl.clientSince); const thisMonth=now.getFullYear()===since.getFullYear()&&now.getMonth()===since.getMonth(); if(thisMonth) return <span style={{ fontSize:7, fontWeight:700, padding:"1px 5px", borderRadius:3, background:"#ECFDF5", color:"#06B6D4" }}>{L("New","Nuevo")}</span>; const yrs=Math.floor((now-since)/(365.25*24*60*60*1000)); const mos=Math.floor((now-since)/(30.44*24*60*60*1000)); if(yrs>=10) return <span style={{ fontSize:7, fontWeight:700, padding:"1px 5px", borderRadius:3, background:"#FEF2F2", color:"#DC2626" }}>{yrs} {L("years","años")}</span>; if(yrs>=5) return <span style={{ fontSize:7, fontWeight:700, padding:"1px 5px", borderRadius:3, background:"#EDE9FE", color:"#8B5CF6" }}>{yrs} {L("years","años")}</span>; if(yrs>=1) return <span style={{ fontSize:7, fontWeight:700, padding:"1px 5px", borderRadius:3, background:"#FEF3C7", color:"#F59E0B" }}>{yrs} {yrs===1?L("year","año"):L("years","años")}</span>; return <span style={{ fontSize:7, fontWeight:700, padding:"1px 5px", borderRadius:3, background:"#ECFDF5", color:"#16A34A" }}>{mos} {mos===1?L("month","mes"):L("months","meses")}</span>; })()}</div><p style={{ fontSize:9, color:v.textSec, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{cl.address}</p><div style={{ display:"flex", alignItems:"center", gap:3, marginTop:1 }}><svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke={v.textTer} strokeWidth="2.5" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.13.81.36 1.6.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c1.21.34 2 .57 2.81.7A2 2 0 0122 16.92z"/></svg><span style={{ fontSize:9, color:v.textTer }}>{cl.phone}</span></div></div></div>
          <div style={{ display:"flex", gap:3, flexWrap:"wrap", alignContent:"flex-start" }}>{clSvc.slice(0,3).map(svc => <span key={svc.id} style={{ fontSize:8, fontWeight:600, padding:"1px 5px", borderRadius:3, background:(categories[svc.category]?.color||"#16A34A")+"12", color:categories[svc.category]?.color||"#16A34A", whiteSpace:"nowrap" }}>{lang==="es"?svc.nameEs:svc.name}</span>)}{clSvc.length>3&&<span style={{ fontSize:8, fontWeight:600, padding:"1px 5px", borderRadius:3, background:v.border, color:v.textSec }}>+{clSvc.length-3}</span>}</div>
          <div><p style={{ fontSize:12, fontWeight:700, color:"#16A34A", fontFamily:"'Syne'" }}>${mt}</p><p style={{ fontSize:8, color:v.textTer }}>{L("/mo","/mes")}</p></div>
          <div><p style={{ fontSize:10, fontWeight:500, color:v.text }}>{pay[cl.paymentMethod]}</p>{cl.defaultCrewId && (() => { const cr=(crews||[]).find(c=>c.id===cl.defaultCrewId); return cr ? <div style={{ display:"flex", alignItems:"center", gap:3, marginTop:2 }}><div style={{ width:6, height:6, borderRadius:"50%", background:cr.color }}/><span style={{ fontSize:8, fontWeight:600, color:cr.color }}>{cr.name}</span></div> : null; })()}</div>
          {od ? <div><span style={{ fontSize:8, fontWeight:700, padding:"2px 5px", borderRadius:3, background:"#FEF2F2", color:"#EF4444" }}>{L("Overdue","En Mora")}</span><p style={{ fontSize:9, fontWeight:700, color:"#EF4444", marginTop:2 }}>${od}</p></div> : <span style={{ fontSize:8, fontWeight:700, padding:"2px 5px", borderRadius:3, background:dark?"rgba(22,163,74,0.12)":"#DCFCE7", color:"#16A34A" }}>{L("Current","Al Día")}</span>}
          <div style={{ display:"flex", flexDirection:"column", gap:3 }}><button onClick={() => openEdit(cl)} style={{ fontSize:9, fontWeight:600, padding:"3px 7px", borderRadius:4, border:"1px solid "+v.border, background:"transparent", color:v.textSec, cursor:"pointer" }}>{L("Edit","Editar")}</button><button onClick={() => toggleStatus(cl)} style={{ fontSize:9, fontWeight:600, padding:"3px 7px", borderRadius:4, border:"none", background:cl.status==="active"?"#FEF2F2":"#DCFCE7", color:cl.status==="active"?"#EF4444":"#16A34A", cursor:"pointer" }}>{cl.status==="active"?L("Deactivate","Desactivar"):L("Reactivate","Reactivar")}</button></div>
        </div>; })}
      </div>
      {toast && (
        <div style={{ position:"fixed", bottom:24, right:24, padding:"12px 20px", borderRadius:8,
          background:"#16A34A", color:"#FFF", fontSize:13, fontWeight:600,
          fontFamily:"'DM Sans',sans-serif", boxShadow:"0 4px 12px rgba(22,163,74,0.3)",
          display:"flex", alignItems:"center", gap:8, zIndex:100,
          animation:"toastUp 0.3s ease" }}>
          <span>✓</span> {toast}
        </div>
      )}
      <style>{`@keyframes toastUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </div>
  );
}
