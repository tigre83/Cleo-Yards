import { useState, useMemo, useRef, useEffect } from "react";
import { useData } from "../../context/DataContext";
import { useAuth } from "../../context/AuthContext";
import { Plus, ChevronLeft, ChevronRight, Calendar, Clock, CheckCircle, AlertTriangle, Users, X, Search, Trash2, Leaf, UserPlus, CalendarDays, ClipboardList, Zap, MoreHorizontal, Save } from "lucide-react";

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
  return Array.from({ length: 7 }, (_, i) => {
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
    rescheduled:{ en: "Rescheduled", es: "Reprogramado",color: "#94A3B8", bg: "#F8FAFC", darkBg: "rgba(148,163,184,0.08)" },
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


const US_AREA_CODES_SCH = [
  {code:"201",city:"Jersey City"},{code:"202",city:"Washington DC"},{code:"205",city:"Birmingham"},{code:"206",city:"Seattle"},{code:"210",city:"San Antonio"},{code:"212",city:"New York"},{code:"213",city:"Los Angeles"},{code:"214",city:"Dallas"},{code:"215",city:"Philadelphia"},{code:"224",city:"Chicago suburbs"},{code:"225",city:"Baton Rouge"},{code:"229",city:"Albany GA"},{code:"231",city:"Muskegon"},{code:"234",city:"Akron"},{code:"239",city:"Fort Myers"},{code:"240",city:"Maryland"},{code:"248",city:"Troy MI"},{code:"251",city:"Mobile"},{code:"252",city:"Greenville NC"},{code:"253",city:"Tacoma"},{code:"254",city:"Killeen"},{code:"256",city:"Huntsville"},{code:"260",city:"Fort Wayne"},{code:"262",city:"Kenosha"},{code:"267",city:"Philadelphia"},{code:"269",city:"Kalamazoo"},{code:"270",city:"Bowling Green"},{code:"276",city:"Bristol VA"},{code:"281",city:"Houston"},{code:"301",city:"Maryland"},{code:"302",city:"Delaware"},{code:"303",city:"Denver"},{code:"304",city:"West Virginia"},{code:"305",city:"Miami"},{code:"307",city:"Wyoming"},{code:"308",city:"Grand Island"},{code:"309",city:"Peoria"},{code:"310",city:"Los Angeles"},{code:"312",city:"Chicago"},{code:"313",city:"Detroit"},{code:"314",city:"St. Louis"},{code:"315",city:"Syracuse"},{code:"316",city:"Wichita"},{code:"317",city:"Indianapolis"},{code:"318",city:"Shreveport"},{code:"319",city:"Cedar Rapids"},{code:"320",city:"St. Cloud"},{code:"321",city:"Orlando"},{code:"323",city:"Los Angeles"},{code:"325",city:"Abilene"},{code:"330",city:"Akron"},{code:"331",city:"Aurora IL"},{code:"334",city:"Montgomery"},{code:"336",city:"Greensboro"},{code:"337",city:"Lafayette"},{code:"339",city:"Boston"},{code:"346",city:"Houston"},{code:"347",city:"New York"},{code:"351",city:"Lowell"},{code:"352",city:"Gainesville"},{code:"361",city:"Corpus Christi"},{code:"386",city:"Daytona Beach"},{code:"401",city:"Rhode Island"},{code:"402",city:"Omaha"},{code:"404",city:"Atlanta"},{code:"405",city:"Oklahoma City"},{code:"406",city:"Montana"},{code:"407",city:"Orlando"},{code:"408",city:"San Jose"},{code:"409",city:"Beaumont"},{code:"410",city:"Baltimore"},{code:"412",city:"Pittsburgh"},{code:"413",city:"Springfield MA"},{code:"414",city:"Milwaukee"},{code:"415",city:"San Francisco"},{code:"417",city:"Springfield MO"},{code:"419",city:"Toledo"},{code:"423",city:"Chattanooga"},{code:"424",city:"Los Angeles"},{code:"425",city:"Bellevue"},{code:"430",city:"Tyler"},{code:"432",city:"Midland"},{code:"434",city:"Lynchburg"},{code:"440",city:"Lorain"},{code:"442",city:"Oceanside"},{code:"443",city:"Baltimore"},{code:"469",city:"Dallas"},{code:"470",city:"Atlanta"},{code:"475",city:"Bridgeport"},{code:"478",city:"Macon"},{code:"479",city:"Fort Smith"},{code:"480",city:"Mesa"},{code:"484",city:"Allentown"},{code:"501",city:"Little Rock"},{code:"502",city:"Louisville"},{code:"503",city:"Portland"},{code:"504",city:"New Orleans"},{code:"505",city:"Albuquerque"},{code:"507",city:"Rochester MN"},{code:"508",city:"Worcester"},{code:"509",city:"Spokane"},{code:"510",city:"Oakland"},{code:"512",city:"Austin"},{code:"513",city:"Cincinnati"},{code:"515",city:"Des Moines"},{code:"516",city:"Hempstead"},{code:"517",city:"Lansing"},{code:"518",city:"Albany NY"},{code:"520",city:"Tucson"},{code:"530",city:"Redding"},{code:"531",city:"Omaha"},{code:"534",city:"Eau Claire"},{code:"539",city:"Tulsa"},{code:"540",city:"Roanoke"},{code:"541",city:"Eugene"},{code:"551",city:"Jersey City"},{code:"559",city:"Fresno"},{code:"561",city:"West Palm Beach"},{code:"562",city:"Long Beach"},{code:"563",city:"Davenport"},{code:"567",city:"Toledo"},{code:"570",city:"Scranton"},{code:"571",city:"Arlington VA"},{code:"573",city:"Columbia MO"},{code:"574",city:"South Bend"},{code:"575",city:"Las Cruces"},{code:"580",city:"Lawton"},{code:"585",city:"Rochester NY"},{code:"586",city:"Warren MI"},{code:"601",city:"Jackson MS"},{code:"602",city:"Phoenix"},{code:"603",city:"New Hampshire"},{code:"605",city:"South Dakota"},{code:"606",city:"Ashland KY"},{code:"607",city:"Binghamton"},{code:"608",city:"Madison"},{code:"609",city:"Trenton"},{code:"610",city:"Allentown"},{code:"612",city:"Minneapolis"},{code:"614",city:"Columbus"},{code:"615",city:"Nashville"},{code:"616",city:"Grand Rapids"},{code:"617",city:"Boston"},{code:"618",city:"Belleville IL"},{code:"619",city:"San Diego"},{code:"620",city:"Dodge City"},{code:"623",city:"Glendale AZ"},{code:"626",city:"Pasadena"},{code:"630",city:"Naperville"},{code:"631",city:"Suffolk"},{code:"636",city:"OFallon MO"},{code:"641",city:"Mason City"},{code:"646",city:"New York"},{code:"650",city:"San Mateo"},{code:"651",city:"St. Paul"},{code:"657",city:"Anaheim"},{code:"660",city:"Sedalia"},{code:"661",city:"Bakersfield"},{code:"662",city:"Southaven MS"},{code:"678",city:"Atlanta"},{code:"682",city:"Fort Worth"},{code:"701",city:"North Dakota"},{code:"702",city:"Las Vegas"},{code:"703",city:"Arlington VA"},{code:"704",city:"Charlotte"},{code:"706",city:"Augusta"},{code:"707",city:"Santa Rosa"},{code:"708",city:"Cicero IL"},{code:"712",city:"Sioux City"},{code:"713",city:"Houston"},{code:"714",city:"Anaheim"},{code:"715",city:"Wausau"},{code:"716",city:"Buffalo"},{code:"717",city:"Harrisburg"},{code:"718",city:"New York"},{code:"719",city:"Colorado Springs"},{code:"720",city:"Denver"},{code:"724",city:"New Castle PA"},{code:"725",city:"Las Vegas"},{code:"727",city:"St. Petersburg"},{code:"731",city:"Jackson TN"},{code:"732",city:"New Brunswick"},{code:"734",city:"Ann Arbor"},{code:"737",city:"Austin"},{code:"740",city:"Lancaster OH"},{code:"743",city:"Greensboro"},{code:"747",city:"Burbank"},{code:"754",city:"Fort Lauderdale"},{code:"757",city:"Virginia Beach"},{code:"760",city:"Oceanside"},{code:"762",city:"Augusta"},{code:"763",city:"Brooklyn Park"},{code:"769",city:"Jackson MS"},{code:"770",city:"Roswell GA"},{code:"772",city:"Port St. Lucie"},{code:"773",city:"Chicago"},{code:"774",city:"Worcester"},{code:"775",city:"Reno"},{code:"779",city:"Rockford"},{code:"781",city:"Boston"},{code:"786",city:"Miami"},{code:"801",city:"Salt Lake City"},{code:"802",city:"Vermont"},{code:"803",city:"Columbia SC"},{code:"804",city:"Richmond"},{code:"805",city:"San Luis Obispo"},{code:"806",city:"Lubbock"},{code:"808",city:"Honolulu"},{code:"810",city:"Flint"},{code:"812",city:"Evansville"},{code:"813",city:"Tampa"},{code:"814",city:"Erie"},{code:"815",city:"Rockford"},{code:"816",city:"Kansas City"},{code:"817",city:"Fort Worth"},{code:"818",city:"Burbank"},{code:"828",city:"Asheville"},{code:"830",city:"New Braunfels"},{code:"831",city:"Salinas"},{code:"832",city:"Houston"},{code:"843",city:"Charleston"},{code:"845",city:"Poughkeepsie"},{code:"847",city:"Elgin"},{code:"848",city:"New Brunswick"},{code:"850",city:"Tallahassee"},{code:"856",city:"Camden"},{code:"857",city:"Boston"},{code:"858",city:"San Diego"},{code:"859",city:"Lexington"},{code:"860",city:"Hartford"},{code:"862",city:"Newark"},{code:"863",city:"Lakeland"},{code:"864",city:"Greenville SC"},{code:"865",city:"Knoxville"},{code:"870",city:"Jonesboro"},{code:"872",city:"Chicago"},{code:"878",city:"Pittsburgh"},{code:"901",city:"Memphis"},{code:"903",city:"Tyler"},{code:"904",city:"Jacksonville"},{code:"906",city:"Marquette"},{code:"907",city:"Alaska"},{code:"908",city:"Elizabeth NJ"},{code:"909",city:"Pomona"},{code:"910",city:"Fayetteville NC"},{code:"912",city:"Savannah"},{code:"913",city:"Kansas City KS"},{code:"914",city:"Yonkers"},{code:"915",city:"El Paso"},{code:"916",city:"Sacramento"},{code:"917",city:"New York"},{code:"918",city:"Tulsa"},{code:"919",city:"Raleigh"},{code:"920",city:"Green Bay"},{code:"925",city:"Concord CA"},{code:"928",city:"Flagstaff"},{code:"929",city:"New York"},{code:"931",city:"Clarksville"},{code:"936",city:"Conroe"},{code:"937",city:"Dayton"},{code:"940",city:"Denton"},{code:"941",city:"Sarasota"},{code:"947",city:"Troy MI"},{code:"949",city:"Irvine"},{code:"951",city:"Riverside"},{code:"952",city:"Bloomington MN"},{code:"954",city:"Fort Lauderdale"},{code:"956",city:"Laredo"},{code:"959",city:"Hartford"},{code:"972",city:"Dallas"},{code:"973",city:"Newark"},{code:"979",city:"College Station"},{code:"980",city:"Charlotte"},{code:"984",city:"Raleigh"},{code:"985",city:"Houma"}
];

const US_CITIES_SCH = ["Abilene TX","Akron OH","Albany NY","Albuquerque NM","Alexandria VA","Amarillo TX","Anaheim CA","Anchorage AK","Arlington TX","Atlanta GA","Aurora CO","Austin TX","Bakersfield CA","Baltimore MD","Baton Rouge LA","Bee Cave TX","Bellevue WA","Boise ID","Boston MA","Boulder CO","Buffalo NY","Cedar Park TX","Chandler AZ","Charlotte NC","Chicago IL","Cincinnati OH","Cleveland OH","Colorado Springs CO","Columbus OH","Dallas TX","Denver CO","Des Moines IA","Detroit MI","Durham NC","El Paso TX","Fort Collins CO","Fort Lauderdale FL","Fort Worth TX","Fresno CA","Georgetown TX","Gilbert AZ","Grand Rapids MI","Henderson NV","Honolulu HI","Houston TX","Huntsville AL","Indianapolis IN","Irvine CA","Irving TX","Jacksonville FL","Jersey City NJ","Kansas City MO","Knoxville TN","Las Vegas NV","Leander TX","Lexington KY","Long Beach CA","Los Angeles CA","Louisville KY","Madison WI","Memphis TN","Mesa AZ","Miami FL","Milwaukee WI","Minneapolis MN","Nashville TN","New Orleans LA","New York NY","Newark NJ","Oakland CA","Oklahoma City OK","Omaha NE","Orlando FL","Philadelphia PA","Phoenix AZ","Pittsburgh PA","Plano TX","Portland OR","Raleigh NC","Reno NV","Richmond VA","Riverside CA","Round Rock TX","Sacramento CA","Salt Lake City UT","San Antonio TX","San Diego CA","San Francisco CA","San Jose CA","Santa Ana CA","Savannah GA","Scottsdale AZ","Seattle WA","Spokane WA","St. Louis MO","St. Petersburg FL","Tampa FL","Tucson AZ","Tulsa OK","Virginia Beach VA","Waco TX","Washington DC","Wichita KS"].map(c => { const p = c.split(" "); const st = p.pop(); return { name: p.join(" "), state: st, full: c }; });

const CITY_ZIPS_SCH = {"Abilene TX":"79601","Akron OH":"44301","Albany NY":"12201","Albuquerque NM":"87101","Alexandria VA":"22301","Amarillo TX":"79101","Anaheim CA":"92801","Anchorage AK":"99501","Arlington TX":"76001","Atlanta GA":"30301","Aurora CO":"80010","Austin TX":"78701","Bakersfield CA":"93301","Baltimore MD":"21201","Baton Rouge LA":"70801","Bee Cave TX":"78738","Bellevue WA":"98004","Boise ID":"83701","Boston MA":"02101","Boulder CO":"80301","Buffalo NY":"14201","Cedar Park TX":"78613","Chandler AZ":"85224","Charlotte NC":"28201","Chicago IL":"60601","Cincinnati OH":"45201","Cleveland OH":"44101","Colorado Springs CO":"80901","Columbus OH":"43201","Dallas TX":"75201","Denver CO":"80201","Des Moines IA":"50301","Detroit MI":"48201","Durham NC":"27701","El Paso TX":"79901","Fort Collins CO":"80521","Fort Lauderdale FL":"33301","Fort Worth TX":"76101","Fresno CA":"93701","Georgetown TX":"78626","Gilbert AZ":"85233","Grand Rapids MI":"49501","Henderson NV":"89011","Honolulu HI":"96801","Houston TX":"77001","Huntsville AL":"35801","Indianapolis IN":"46201","Irvine CA":"92601","Irving TX":"75014","Jacksonville FL":"32099","Jersey City NJ":"07301","Kansas City MO":"64101","Knoxville TN":"37901","Las Vegas NV":"89101","Leander TX":"78641","Lexington KY":"40501","Long Beach CA":"90801","Los Angeles CA":"90001","Louisville KY":"40201","Madison WI":"53701","Memphis TN":"38101","Mesa AZ":"85201","Miami FL":"33101","Milwaukee WI":"53201","Minneapolis MN":"55401","Nashville TN":"37201","New Orleans LA":"70112","New York NY":"10001","Newark NJ":"07101","Oakland CA":"94601","Oklahoma City OK":"73101","Omaha NE":"68101","Orlando FL":"32801","Philadelphia PA":"19101","Phoenix AZ":"85001","Pittsburgh PA":"15201","Plano TX":"75023","Portland OR":"97201","Raleigh NC":"27601","Reno NV":"89501","Richmond VA":"23219","Riverside CA":"92501","Round Rock TX":"78664","Sacramento CA":"95814","Salt Lake City UT":"84101","San Antonio TX":"78201","San Diego CA":"92101","San Francisco CA":"94101","San Jose CA":"95101","Santa Ana CA":"92701","Savannah GA":"31401","Scottsdale AZ":"85251","Seattle WA":"98101","Spokane WA":"99201","St. Louis MO":"63101","St. Petersburg FL":"33701","Tampa FL":"33601","Tucson AZ":"85701","Tulsa OK":"74101","Virginia Beach VA":"23451","Waco TX":"76701","Washington DC":"20001","Wichita KS":"67201"};

const SearchDropSch = ({ value, onSelect, items, placeholder, displayFn, listDisplayFn, filterFn, v, dark, width, dropdownMinWidth }) => {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef();
  useEffect(() => { const fn = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }; document.addEventListener("mousedown", fn); return () => document.removeEventListener("mousedown", fn); }, []);
  const filtered = q ? items.filter(i => filterFn(i, q.toLowerCase())) : items;
  const itemDisplay = listDisplayFn || displayFn;
  return (
    <div ref={ref} style={{ position: "relative", width: width || "100%" }}>
      <div onClick={() => setOpen(!open)} style={{ padding: "7px 10px", borderRadius: 8, border: "1px solid " + v.border, background: dark ? "rgba(255,255,255,0.04)" : v.surface, color: value ? v.text : v.textTer, fontSize: 12, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", height: 36, boxSizing: "border-box", fontFamily: "'DM Sans', sans-serif" }}>
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value ? displayFn(items.find(i => filterFn(i, value.toLowerCase())) || {}, value) : placeholder}</span>
        <span style={{ fontSize: 9, color: v.textTer, marginLeft: 6, flexShrink: 0 }}>▾</span>
      </div>
      {open && (
        <div style={{ position: "absolute", top: "100%", left: 0, width: dropdownMinWidth || undefined, minWidth: dropdownMinWidth ? undefined : 200, marginTop: 3, background: v.cardBg, border: "1px solid " + v.border, borderRadius: 8, boxShadow: "0 8px 24px rgba(0,0,0,0.15)", zIndex: 30, maxHeight: 200, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: 6, borderBottom: "1px solid " + v.border }}>
            <input autoFocus value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => { if (e.key === "Escape") setOpen(false); }} placeholder={"🔍 " + placeholder} style={{ width: "100%", padding: "5px 8px", borderRadius: 5, border: "1px solid " + v.border, background: dark ? "rgba(255,255,255,0.04)" : "#fff", color: v.text, fontSize: 11, outline: "none", fontFamily: "'DM Sans'", boxSizing: "border-box" }} />
          </div>
          <div style={{ overflowY: "auto", maxHeight: 160 }}>
            {filtered.slice(0, 40).map((item, i) => (
              <div key={i} onClick={() => { onSelect(item); setOpen(false); setQ(""); }} style={{ padding: "6px 10px", cursor: "pointer", fontSize: 11, color: v.text }} onMouseEnter={e => e.currentTarget.style.background = dark ? "rgba(255,255,255,0.04)" : "#F8FAFC"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>{itemDisplay(item)}</div>
            ))}
            {filtered.length === 0 && <p style={{ padding: 10, fontSize: 11, color: v.textTer, textAlign: "center" }}>No results</p>}
          </div>
        </div>
      )}
    </div>
  );
};

const PhoneFieldSch = ({ areaCode, number, onAreaChange, onNumberChange, items, v, dark, placeholder }) => (
  <div style={{ display: "flex", gap: 6 }}>
    <SearchDropSch value={areaCode} onSelect={i => onAreaChange(i.code)} items={items} placeholder={placeholder || "Cód."} displayFn={(i) => i.code ? "("+i.code+")" : ""} filterFn={(i,q) => i.code.includes(q)||i.city.toLowerCase().includes(q)} v={v} dark={dark} width={82} dropdownMinWidth={82} />
    <input value={number} onChange={e => { let val = e.target.value.replace(/[^0-9]/g, ""); if (val.length > 3) val = val.slice(0, 3) + "-" + val.slice(3); onNumberChange(val.slice(0, 8)); }} style={{ flex: 1, padding: "7px 10px", borderRadius: 8, border: "1px solid " + v.border, background: dark ? "rgba(255,255,255,0.04)" : v.surface, color: v.text, fontSize: 12, outline: "none", fontFamily: "'DM Sans', sans-serif", height: 36, boxSizing: "border-box" }} placeholder="555-0142" maxLength="8" />
  </div>
);

/* ── Custom Date Picker ── */
const CY_MONTHS_EN = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const CY_MONTHS_ES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const CY_DAYS_EN = ["Mo","Tu","We","Th","Fr","Sa","Su"];
const CY_DAYS_ES = ["Lu","Ma","Mi","Ju","Vi","Sa","Do"];

const CYDatePicker = ({ value, onChange, min, v, dark, lang, style }) => {
  const L = (en, es) => lang === "es" ? es : en;
  const [open, setOpen] = useState(false);
  const ref = useRef();
  const parsed = value ? new Date(value + "T12:00") : new Date();
  const [vY, setVY] = useState(parsed.getFullYear());
  const [vM, setVM] = useState(parsed.getMonth());

  useEffect(() => { const fn = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }; document.addEventListener("mousedown", fn); return () => document.removeEventListener("mousedown", fn); }, []);
  useEffect(() => { if (value) { const d = new Date(value + "T12:00"); setVY(d.getFullYear()); setVM(d.getMonth()); } }, [value]);

  const today = new Date(); const todayStr = today.toISOString().split("T")[0];
  const months = lang === "es" ? CY_MONTHS_ES : CY_MONTHS_EN;
  const dayNames = lang === "es" ? CY_DAYS_ES : CY_DAYS_EN;
  const daysInMonth = new Date(vY, vM + 1, 0).getDate();
  const firstDay = (new Date(vY, vM, 1).getDay() + 6) % 7;

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const toStr = d => `${vY}-${String(vM + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const isDisabled = d => d && min && toStr(d) < min;
  const isSelected = d => d && value && toStr(d) === value;
  const isToday = d => d && toStr(d) === todayStr;

  const prev = () => { if (vM === 0) { setVM(11); setVY(y => y - 1); } else setVM(m => m - 1); };
  const next = () => { if (vM === 11) { setVM(0); setVY(y => y + 1); } else setVM(m => m + 1); };
  const select = d => { if (!d || isDisabled(d)) return; onChange(toStr(d)); setOpen(false); };

  const fmt = val => { if (!val) return ""; const d = new Date(val + "T12:00"); return String(d.getDate()).padStart(2, "0") + "/" + String(d.getMonth() + 1).padStart(2, "0") + "/" + d.getFullYear(); };

  const G = "#16A34A";
  return (
    <div ref={ref} style={{ position: "relative", ...style }}>
      <div onClick={() => setOpen(!open)} style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid " + v.border, background: dark ? "rgba(255,255,255,0.04)" : v.surface, color: value ? v.text : v.textTer, fontSize: 13, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily: "'DM Sans', sans-serif", transition: "border-color 0.15s", boxSizing: "border-box" }}>
        <span>{fmt(value) || L("Select date", "Seleccionar fecha")}</span>
        <Calendar size={14} color={v.textTer}/>
      </div>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, width: 280, background: v.cardBg, border: "1px solid " + v.border, borderRadius: 12, boxShadow: "0 12px 40px rgba(0,0,0," + (dark ? "0.4" : "0.12") + ")", zIndex: 50, overflow: "hidden", fontFamily: "'DM Sans', sans-serif", animation: "cyFadeIn 0.15s ease" }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px 8px" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: v.text }}>{months[vM]} {vY}</span>
            <div style={{ display: "flex", gap: 2 }}>
              <button onClick={prev} style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid " + v.border + "60", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: v.textSec, fontSize: 14, fontWeight: 700 }}>‹</button>
              <button onClick={next} style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid " + v.border + "60", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: v.textSec, fontSize: 14, fontWeight: 700 }}>›</button>
            </div>
          </div>
          {/* Day names */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", padding: "0 10px", gap: 0 }}>
            {dayNames.map(dn => <div key={dn} style={{ textAlign: "center", fontSize: 10, fontWeight: 700, color: v.textTer, padding: "4px 0", textTransform: "uppercase", letterSpacing: "0.04em" }}>{dn}</div>)}
          </div>
          {/* Days grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", padding: "2px 10px 8px", gap: 2 }}>
            {cells.map((d, i) => {
              const sel = isSelected(d); const td = isToday(d); const dis = isDisabled(d);
              return (
                <div key={i} onClick={() => select(d)}
                  style={{ width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8, fontSize: 12, fontWeight: sel ? 700 : td ? 600 : 400, cursor: d ? (dis ? "default" : "pointer") : "default", color: !d ? "transparent" : dis ? (v.textTer + "60") : sel ? "#fff" : td ? G : v.text, background: sel ? G : td ? (G + "12") : "transparent", border: td && !sel ? ("1px solid " + G + "40") : "1px solid transparent", transition: "all 0.12s", opacity: dis ? 0.35 : 1 }}
                  onMouseEnter={e => { if (d && !dis && !sel) e.currentTarget.style.background = dark ? "rgba(255,255,255,0.06)" : "#F0FDF4"; }}
                  onMouseLeave={e => { if (!sel) e.currentTarget.style.background = td ? (G + "12") : "transparent"; }}>
                  {d || ""}
                </div>
              );
            })}
          </div>
          {/* Footer */}
          <div style={{ borderTop: "1px solid " + v.border + "40", padding: "6px 14px", display: "flex", justifyContent: "space-between" }}>
            <button onClick={() => { onChange(""); setOpen(false); }} style={{ fontSize: 11, fontWeight: 600, color: v.textTer, background: "none", border: "none", cursor: "pointer", padding: "4px 0" }}>{L("Clear", "Borrar")}</button>
            <button onClick={() => { const t = new Date(); setVY(t.getFullYear()); setVM(t.getMonth()); onChange(todayStr); setOpen(false); }} style={{ fontSize: 11, fontWeight: 600, color: G, background: "none", border: "none", cursor: "pointer", padding: "4px 0" }}>{L("Today", "Hoy")}</button>
          </div>
        </div>
      )}
    </div>
  );
};

/* ── Custom Time Picker ── */
const CY_TIME_SLOTS = (() => {
  const s = [];
  for (let h = 6; h <= 20; h++) for (let m = 0; m < 60; m += 30) {
    if (h === 20 && m > 0) break;
    const v24 = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    const hr = h > 12 ? h - 12 : h === 0 ? 12 : h;
    const label = `${hr}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
    s.push({ value: v24, label, hr: h });
  }
  return s;
})();

const CYTimePicker = ({ value, onChange, v, dark, lang, style }) => {
  const L = (en, es) => lang === "es" ? es : en;
  const [open, setOpen] = useState(false);
  const ref = useRef();
  const listRef = useRef();

  useEffect(() => { const fn = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }; document.addEventListener("mousedown", fn); return () => document.removeEventListener("mousedown", fn); }, []);
  useEffect(() => {
    if (open && listRef.current && value) {
      const idx = CY_TIME_SLOTS.findIndex(s => s.value === value);
      if (idx >= 0) { const el = listRef.current.children[idx]; if (el) el.scrollIntoView({ block: "center", behavior: "instant" }); }
    }
  }, [open]);

  const fmt = val => { if (!val) return ""; const s = CY_TIME_SLOTS.find(s => s.value === val); return s ? s.label : val; };
  const G = "#16A34A";
  const isMorning = h => h < 12;

  return (
    <div ref={ref} style={{ position: "relative", ...style }}>
      <div onClick={() => setOpen(!open)} style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid " + v.border, background: dark ? "rgba(255,255,255,0.04)" : v.surface, color: value ? v.text : v.textTer, fontSize: 13, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily: "'DM Sans', sans-serif", transition: "border-color 0.15s", boxSizing: "border-box" }}>
        <span>{fmt(value) || L("Select time", "Seleccionar hora")}</span>
        <Clock size={14} color={v.textTer}/>
      </div>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, width: "100%", minWidth: 140, background: v.cardBg, border: "1px solid " + v.border, borderRadius: 12, boxShadow: "0 12px 40px rgba(0,0,0," + (dark ? "0.4" : "0.12") + ")", zIndex: 50, overflow: "hidden", fontFamily: "'DM Sans', sans-serif", animation: "cyFadeIn 0.15s ease" }}>
          <div style={{ padding: "8px 10px 4px", borderBottom: "1px solid " + v.border + "40" }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: v.textTer, textTransform: "uppercase", letterSpacing: "0.05em" }}>{L("Select Time", "Hora")}</span>
          </div>
          <div ref={listRef} style={{ maxHeight: 220, overflowY: "auto", padding: "4px 6px" }}>
            {CY_TIME_SLOTS.map((slot, i) => {
              const sel = slot.value === value;
              const showDivider = i > 0 && isMorning(CY_TIME_SLOTS[i - 1].hr) && !isMorning(slot.hr);
              return (
                <div key={slot.value}>
                  {showDivider && <div style={{ height: 1, background: v.border + "50", margin: "3px 4px" }}/>}
                  <div onClick={() => { onChange(slot.value); setOpen(false); }}
                    style={{ padding: "7px 10px", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: sel ? 700 : 400, color: sel ? "#fff" : v.text, background: sel ? G : "transparent", display: "flex", alignItems: "center", gap: 6, transition: "all 0.12s", marginBottom: 1 }}
                    onMouseEnter={e => { if (!sel) e.currentTarget.style.background = dark ? "rgba(255,255,255,0.06)" : "#F0FDF4"; }}
                    onMouseLeave={e => { if (!sel) e.currentTarget.style.background = "transparent"; }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: sel ? "#fff" : (slot.hr < 12 ? "#FBBF24" : "#8B5CF6") + "60", flexShrink: 0 }}/>
                    {slot.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default function Scheduling({ dark, v, t, lang }) {
  const { jobs, crews, clients, services, getJobsByDate, addJob, updateJob, deleteJob, addClient, generateMonthlyJobs, completeJob, cancelJob, startJob, reassignJob, toggleServiceComplete } = useData();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin" || user?.role === "business";
  const s = t.sched;

  const [view, setView] = useState("week"); // "week" | "form" | "detail"
  const [editJob, setEditJob] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [confirmComplete, setConfirmComplete] = useState(false);
  const [summaryData, setSummaryData] = useState(null);
  const [showReschedule, setShowReschedule] = useState(false);
  const [rescheduleReason, setRescheduleReason] = useState("");
  const [rescheduleOther, setRescheduleOther] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [rescheduleDate, setRescheduleDate] = useState("");
  
  const [showNewClient, setShowNewClient] = useState(false);
  const [toast, setToast] = useState(null);
  const [jobFormError, setJobFormError] = useState(null);
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
      if (dt.getDay() >= 1 && dt.getDay() <= 6) weekdays.push(dt.toISOString().split("T")[0]);
    }
    const monthlyClients = (clients || []).filter(cl => cl.billingType === "monthly" && cl.defaultCrewId && cl.status === "active");
    let count = 0;
    monthlyClients.forEach(cl => {
      const svcs = (cl.services || []).map(cs => ({
        serviceId: typeof cs === "string" ? cs : cs.serviceId,
        qty: typeof cs === "string" ? 1 : (cs.qty || 1),
      }));
      if (svcs.length === 0) return;
      const maxVisits = Math.max(...svcs.map(s => s.qty));
      const spacing = Math.max(1, Math.floor(weekdays.length / maxVisits));
      for (let visit = 0; visit < maxVisits; visit++) {
        const dayIdx = Math.min(visit * spacing, weekdays.length - 1);
        const dateStr = weekdays[dayIdx];
        const exists = (jobs || []).some(j => j.clientId === cl.id && j.date === dateStr);
        if (!exists) count++;
      }
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
    const now = new Date();
    const h = now.getHours();
    const m = now.getMinutes();
    const nextM = m < 30 ? 30 : 0;
    const nextH = m < 30 ? h : h + 1;
    const defaultTime = (nextH >= 6 && nextH <= 19) ? `${String(nextH).padStart(2, "0")}:${String(nextM).padStart(2, "0")}` : "08:00";
    setEditJob({ clientId: "", serviceIds: [], crewId: "", date: date || new Date().toISOString().split("T")[0], time: defaultTime, duration: 1, notes: "", status: "assigned" });
    setView("form");
  };
  const openDetail = (job) => { setSelectedJob(job); setView("detail"); };
  const openEditJob = (job) => { setEditJob({ ...job }); setView("form"); };
  const closeForm = () => { setView("week"); setEditJob(null); setJobFormError(null); };

  const handleSaveJob = () => {
    const L = (en, es) => lang === "es" ? es : en;
    if (!editJob.clientId) { setJobFormError(L("Please select a client", "Selecciona un cliente")); setTimeout(() => setJobFormError(null), 4000); return; }
    if (!editJob.crewId) { setJobFormError(L("Please assign a crew", "Asigna una cuadrilla")); setTimeout(() => setJobFormError(null), 4000); return; }
    const svcCount = (editJob.serviceIds || []).filter(s => typeof s === "object" ? s.qty > 0 : true).length;
    if (svcCount === 0) { setJobFormError(L("Please add at least one service", "Agrega al menos un servicio")); setTimeout(() => setJobFormError(null), 4000); return; }
    if (!editJob.date || !editJob.time) { setJobFormError(L("Please set date and time", "Configura fecha y hora")); setTimeout(() => setJobFormError(null), 4000); return; }
    setJobFormError(null);
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

  // ── Detail view ──
  if (view === "detail" && selectedJob) {
    const job = jobs.find(j => j.id === selectedJob.id) || selectedJob;
    const client = clientMap[job.clientId];
    const crew = crewMap[job.crewId];
    const st = statusConfig(job.status, lang);
    const L = (en, es) => lang === "es" ? es : en;

    const svcNames = (job.serviceIds || []).map(entry => {
      const sid = typeof entry === "object" ? entry.serviceId : entry;
      const svc = (services || []).find(s => s.id === sid);
      return svc ? { serviceId: sid, name: lang === "es" && svc.nameEs ? svc.nameEs : svc.name, price: svc.price, qty: typeof entry === "object" ? entry.qty || 1 : 1 } : null;
    }).filter(Boolean);

    const fmtJobTime = (t) => {
      if (!t) return "";
      const [h, m] = t.split(":");
      const hr = parseInt(h);
      return (hr > 12 ? hr - 12 : hr) + ":" + m + (hr >= 12 ? " PM" : " AM");
    };

    return (
      <div>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <button onClick={() => { setView("week"); setSelectedJob(null); }} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: 6, border: "1px solid " + v.border, background: v.cardBg, cursor: "pointer" }}>
            <ChevronLeft size={16} color={v.text}/>
          </button>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: v.text, margin: 0 }}>{L("Job Detail", "Detalle del Trabajo")}</h1>
            <p style={{ fontSize: 13, color: v.textSec, margin: "2px 0 0" }}>{new Date(job.date + "T12:00:00").toLocaleDateString(lang === "es" ? "es-EC" : "en-US", { weekday: "long", month: "short", day: "numeric", year: "numeric" })} · {fmtJobTime(job.time)} · {job.duration}h</p>
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 6, background: st.color + "15", color: st.color }}>{st.label}</span>
        </div>

        {/* Status banners */}
        {job.status === "completed" && (
          <div style={{ padding: "12px 16px", borderRadius: 8, background: dark ? "rgba(22,163,74,0.08)" : "#F0FDF4", border: "1px solid #16A34A30", display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <CheckCircle size={16} color="#16A34A"/>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#16A34A" }}>{L("This job has been completed", "Este trabajo ha sido completado")}</span>
          </div>
        )}
        {job.status === "cancelled" && (
          <div style={{ padding: "12px 16px", borderRadius: 8, background: dark ? "rgba(239,68,68,0.08)" : "#FEF2F2", border: "1px solid #EF444430", display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <X size={16} color="#EF4444"/>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#EF4444" }}>{L("This job was cancelled", "Este trabajo fue cancelado")}</span>
          </div>
        )}
        {job.status === "rescheduled" && (
          <div style={{ padding: "12px 16px", borderRadius: 8, background: dark ? "rgba(148,163,184,0.08)" : "#F8FAFC", border: "1px solid #94A3B830", display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <CalendarDays size={16} color="#94A3B8"/>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#94A3B8" }}>{L("This job was rescheduled", "Este trabajo fue reprogramado")}</span>
          </div>
        )}

        {/* Action buttons */}
        {job.status !== "completed" && job.status !== "cancelled" && job.status !== "rescheduled" && (
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <button onClick={() => {
              const cs = (job.completedServices || []);
              if (cs.length === 0) return;
              const allSvcs = (job.serviceIds || []).map(entry => {
                const sid = typeof entry === "object" ? entry.serviceId : entry;
                const svc = (services || []).find(s => s.id === sid);
                const qty = typeof entry === "object" ? entry.qty || 1 : 1;
                return svc ? { serviceId: sid, name: lang === "es" && svc.nameEs ? svc.nameEs : svc.name, price: svc.price, qty, done: cs.includes(sid) } : null;
              }).filter(Boolean);
              setSummaryData({ done: allSvcs.filter(s => s.done), pending: allSvcs.filter(s => !s.done), allDone: allSvcs.every(s => s.done), clientName: clientMap[job.clientId]?.name || "—", date: job.date });
            }}
              style={{ padding: "10px 20px", borderRadius: 10, background: (job.completedServices || []).length > 0 ? "linear-gradient(135deg, #16A34A, #22C55E)" : "#D1D5DB", border: "none", color: (job.completedServices || []).length > 0 ? "#fff" : "#9CA3AF", fontSize: 13, fontWeight: 600, cursor: (job.completedServices || []).length > 0 ? "pointer" : "not-allowed", display: "flex", alignItems: "center", gap: 6, boxShadow: (job.completedServices || []).length > 0 ? "0 2px 8px rgba(22,163,74,0.3)" : "none", opacity: (job.completedServices || []).length > 0 ? 1 : 0.6 }}>
              <CheckCircle size={15}/> {L("Complete", "Completar")}
            </button>
            <button onClick={() => { setRescheduleDate(""); setRescheduleReason(""); setRescheduleOther(""); setRescheduleTime(""); setShowReschedule(true); }}
              style={{ padding: "10px 20px", borderRadius: 10, border: "2px solid #F59E0B", background: "transparent", color: "#F59E0B", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
              <CalendarDays size={15}/> {L("Reschedule", "Reprogramar")}
            </button>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {/* Left: Client + Services */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Client info */}
            <div style={{ background: v.cardBg, border: "1px solid " + v.border, borderRadius: 10, padding: "16px 18px" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: v.text, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                <Users size={13} color="#16A34A"/> {L("Client", "Cliente")}
              </div>
              {client ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: v.text }}>{client.name}</div>
                  {client.address && <div style={{ fontSize: 11, color: v.textSec }}>{client.address}</div>}
                  {client.phone && <div style={{ fontSize: 11, color: v.textSec }}>{client.phone}</div>}
                  {client.email && <div style={{ fontSize: 11, color: v.textSec }}>{client.email}</div>}
                </div>
              ) : <div style={{ fontSize: 12, color: v.textSec }}>—</div>}
            </div>

            {/* Services with toggles */}
            {(() => {
              const completedSvcs = job.completedServices || [];
              const allSvcIds = svcNames.map(s => s.serviceId);
              const doneCount = allSvcIds.filter(sid => completedSvcs.includes(sid)).length;
              const isJobActive = job.status !== "completed" && job.status !== "cancelled";
              
              return (
                <div style={{ background: v.cardBg, border: "1px solid " + v.border, borderRadius: 10, padding: "16px 18px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: v.text, display: "flex", alignItems: "center", gap: 6 }}>
                      <Leaf size={13} color="#16A34A"/> {L("Services", "Servicios")} ({svcNames.length})
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 600, color: doneCount === svcNames.length && svcNames.length > 0 ? "#16A34A" : "#F59E0B" }}>
                      {doneCount}/{svcNames.length} {L("completed", "completados")}
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div style={{ height: 4, borderRadius: 2, background: v.border, marginBottom: 12, overflow: "hidden" }}>
                    <div style={{ height: "100%", borderRadius: 2, background: doneCount === svcNames.length ? "#16A34A" : "#F59E0B", width: svcNames.length > 0 ? (doneCount / svcNames.length * 100) + "%" : "0%", transition: "width 0.4s ease" }}/>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {svcNames.map((s, i) => {
                      const isDone = completedSvcs.includes(s.serviceId);
                      return (
                        <div key={i} onClick={async () => { 
                            if (!isJobActive) return;
                            await toggleServiceComplete(job.id, s.serviceId);
                          }}
                          style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 6,
                            background: isDone ? (dark ? "rgba(22,163,74,0.08)" : "#F0FDF4") : "transparent",
                            border: "1px solid " + (isDone ? "#16A34A30" : v.border + "50"),
                            cursor: isJobActive ? "pointer" : "default", transition: "all 0.15s",
                            opacity: job.status === "cancelled" ? 0.5 : 1 }}>
                          <div style={{ width: 38, height: 22, borderRadius: 11, background: isDone ? "#16A34A" : (dark ? "rgba(255,255,255,0.15)" : "#D1D5DB"),
                            position: "relative", transition: "background 0.3s", flexShrink: 0, cursor: isJobActive ? "pointer" : "default" }}>
                            <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#fff", position: "absolute", top: 2,
                              left: isDone ? 18 : 2, transition: "left 0.3s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                              display: "flex", alignItems: "center", justifyContent: "center" }}>
                              {isDone && <CheckCircle size={10} color="#16A34A"/>}
                            </div>
                          </div>
                          <span style={{ fontSize: 12, fontWeight: isDone ? 600 : 400, color: isDone ? "#16A34A" : v.text, flex: 1,
                            textDecoration: isDone ? "line-through" : "none" }}>{s.name}</span>
                          {isAdmin && <span style={{ fontSize: 11, fontWeight: 700, color: isDone ? "#16A34A" : v.textSec }}>×{s.qty} ${s.price * s.qty}</span>}
                        </div>
                      );
                    })}
                  </div>
                  {isAdmin && svcNames.length > 0 && (
                    <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid " + v.border, display: "flex", justifyContent: "flex-end" }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: "#16A34A" }}>
                        Total: ${svcNames.reduce((s, sv) => s + sv.price * sv.qty, 0)}
                      </span>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Save Progress button — only shows when partial toggles */}
            {job.status !== "completed" && job.status !== "cancelled" && (() => {
              const completedSvcs = job.completedServices || [];
              const allSvcIds = (job.serviceIds || []).map(s => typeof s === "object" ? s.serviceId : s);
              const doneCount = allSvcIds.filter(sid => completedSvcs.includes(sid)).length;
              const hasPartial = doneCount > 0 && doneCount < allSvcIds.length;
              
              return hasPartial ? (
                <button onClick={() => {
                  setToast(L("Progress saved!", "¡Progreso guardado!"));
                  setTimeout(() => setToast(null), 3000);
                  setSelectedJob(null);
                  setView("week");
                }}
                  style={{ width: "100%", padding: "12px 20px", borderRadius: 10, border: "2px solid #F59E0B", background: "transparent", color: "#F59E0B", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 4 }}>
                  <Save size={15}/> {L("Save Progress", "Guardar Progreso")} ({doneCount}/{allSvcIds.length})
                </button>
              ) : null;
            })()}

            {/* Notes */}
            {job.notes && (
              <div style={{ background: v.cardBg, border: "1px solid " + v.border, borderRadius: 10, padding: "16px 18px" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: v.text, marginBottom: 6 }}>{L("Notes", "Notas")}</div>
                <div style={{ fontSize: 12, color: v.textSec, lineHeight: 1.5 }}>{job.notes}</div>
              </div>
            )}
          </div>

          {/* Right: Crew + Schedule */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Crew */}
            <div style={{ background: v.cardBg, border: "1px solid " + v.border, borderRadius: 10, padding: "16px 18px" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: v.text, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                <Users size={13} color="#16A34A"/> {L("Assigned Crew", "Cuadrilla Asignada")}
              </div>
              {crew ? (
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: crew.color }}/>
                    <span style={{ fontSize: 14, fontWeight: 700, color: v.text }}>{crew.name}</span>
                  </div>
                  <div style={{ fontSize: 11, color: v.textSec }}>{L("Leader", "Líder")}: {crew.leader}</div>
                  <div style={{ fontSize: 11, color: v.textSec }}>{crew.members?.length || 0} {L("members", "miembros")} · {crew.phone || ""}</div>
                  {/* Reassign dropdown */}
                  {isAdmin && job.status !== "completed" && job.status !== "cancelled" && (
                    <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid " + v.border }}>
                      <div style={{ fontSize: 10, fontWeight: 600, color: v.textSec, textTransform: "uppercase", marginBottom: 6 }}>{L("Reassign to", "Reasignar a")}</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        {(crews || []).filter(cr => cr.id !== job.crewId).map(cr => (
                          <div key={cr.id} onClick={async () => { await reassignJob(job.id, cr.id); setSelectedJob(p => ({...p, crewId: cr.id})); }}
                            style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 8px", borderRadius: 6, cursor: "pointer", border: "1px solid " + v.border + "50", transition: "all 0.15s" }}
                            onMouseEnter={e => e.currentTarget.style.background = dark ? "rgba(255,255,255,0.04)" : "#F8FAFC"}
                            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                            <div style={{ width: 8, height: 8, borderRadius: "50%", background: cr.color }}/>
                            <span style={{ fontSize: 11, color: v.text }}>{cr.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : <div style={{ fontSize: 12, color: v.textSec }}>{L("Unassigned", "Sin asignar")}</div>}
            </div>

            {/* Schedule info */}
            <div style={{ background: v.cardBg, border: "1px solid " + v.border, borderRadius: 10, padding: "16px 18px" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: v.text, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                <Calendar size={13} color="#16A34A"/> {L("Schedule", "Programación")}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 11, color: v.textSec }}>{L("Date", "Fecha")}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: v.text }}>{new Date(job.date + "T12:00:00").toLocaleDateString(lang === "es" ? "es-EC" : "en-US", { weekday: "long", month: "short", day: "numeric" })}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 11, color: v.textSec }}>{L("Time", "Hora")}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: v.text }}>{fmtJobTime(job.time)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 11, color: v.textSec }}>{L("Duration", "Duración")}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: v.text }}>{job.duration}h</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 11, color: v.textSec }}>{L("Status", "Estado")}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: st.color }}>{st.label}</span>
                </div>
                {job.autoGenerated && (
                  <div style={{ marginTop: 4, padding: "4px 8px", borderRadius: 4, background: "#F0FDF4", display: "inline-flex", alignItems: "center", gap: 4, alignSelf: "flex-start" }}>
                    <Zap size={10} color="#16A34A"/>
                    <span style={{ fontSize: 9, fontWeight: 600, color: "#16A34A" }}>{L("Auto-generated", "Auto-generado")}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      {/* Summary Modal */}
      {summaryData && (
        <div onClick={() => setSummaryData(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
          <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 420, background: v.cardBg, borderRadius: 14, border: "1px solid " + v.border, boxShadow: "0 24px 64px rgba(0,0,0,0.2)", overflow: "hidden" }}>
            <div style={{ padding: "20px 24px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: summaryData.allDone ? "#F0FDF4" : "#FFFBEB", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <CheckCircle size={20} color={summaryData.allDone ? "#16A34A" : "#F59E0B"}/>
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: v.text }}>{summaryData.allDone ? L("Job Summary", "Resumen del Trabajo") : L("Partial Completion", "Completado Parcial")}</div>
                  <div style={{ fontSize: 11, color: v.textSec }}>{summaryData.clientName} · {new Date(summaryData.date + "T12:00:00").toLocaleDateString(lang === "es" ? "es-EC" : "en-US", { month: "short", day: "numeric" })}</div>
                </div>
              </div>
            </div>
            <div style={{ padding: "0 24px 16px" }}>
              {summaryData.done.length > 0 && (
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#16A34A", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>✓ {L("Completed", "Completados")} ({summaryData.done.length})</div>
                  {summaryData.done.map((s, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 0", fontSize: 12 }}>
                      <CheckCircle size={12} color="#16A34A"/>
                      <span style={{ color: v.text, flex: 1 }}>{s.name}</span>
                      {isAdmin && <span style={{ color: "#16A34A", fontWeight: 600 }}>${s.price * s.qty}</span>}
                    </div>
                  ))}
                </div>
              )}
              {summaryData.pending.length > 0 && (
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#F59E0B", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>⏳ {L("Pending", "Pendientes")} ({summaryData.pending.length})</div>
                  {summaryData.pending.map((s, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 0", fontSize: 12 }}>
                      <Clock size={12} color="#F59E0B"/>
                      <span style={{ color: v.textSec, flex: 1 }}>{s.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={{ padding: "14px 24px", borderTop: "1px solid " + v.border, display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button onClick={() => setSummaryData(null)} style={{ padding: "9px 20px", borderRadius: 8, border: "1px solid " + v.border, background: "transparent", color: v.text, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                {L("Edit", "Editar")}
              </button>
              <button onClick={async () => {
                await completeJob(selectedJob.id);
                setSummaryData(null);
                setSelectedJob(null);
                setView("week");
                setToast(summaryData.allDone ? L("Job completed!", "¡Trabajo completado!") : L("Job saved with pending services", "Trabajo guardado con pendientes"));
                setTimeout(() => setToast(null), 3000);
              }} style={{ padding: "9px 20px", borderRadius: 8, border: "none", background: "linear-gradient(135deg, #16A34A, #22C55E)", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, boxShadow: "0 2px 8px rgba(22,163,74,0.3)" }}>
                <CheckCircle size={13}/> OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {showReschedule && (
        <div onClick={() => setShowReschedule(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
          <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 420, background: v.cardBg, borderRadius: 14, border: "1px solid " + v.border, boxShadow: "0 24px 64px rgba(0,0,0,0.2)", overflow: "hidden" }}>
            <div style={{ padding: "20px 24px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <CalendarDays size={18} color="#F59E0B"/>
                <div style={{ fontSize: 16, fontWeight: 800, color: v.text }}>{L("Reschedule Job", "Reprogramar Trabajo")}</div>
              </div>
              <div style={{ fontSize: 12, color: v.textSec, lineHeight: 1.5 }}>{L("The job will be moved to the new date.", "El trabajo se moverá a la nueva fecha.")}</div>
            </div>
            <div style={{ padding: "10px 24px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: v.textSec, textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: 4 }}>{L("Reason", "Motivo")}</label>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {[
                    { key: "rain", en: "Rain / Bad weather", es: "Lluvia / Mal clima" },
                    { key: "crew_issue", en: "Crew unavailable", es: "Cuadrilla no disponible" },
                    { key: "client_absent", en: "Client not available", es: "Cliente no disponible" },
                    { key: "equipment", en: "Equipment issue", es: "Problema de equipo" },
                    { key: "other", en: "Other", es: "Otro" },
                  ].map(r => (
                    <div key={r.key} onClick={() => setRescheduleReason(r.key)}
                      style={{ padding: "8px 12px", borderRadius: 6, cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
                        border: "1px solid " + (rescheduleReason === r.key ? "#F59E0B" : v.border + "50"),
                        background: rescheduleReason === r.key ? (dark ? "rgba(245,158,11,0.08)" : "#FFFBEB") : "transparent",
                        transition: "all 0.15s" }}>
                      <div style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid " + (rescheduleReason === r.key ? "#F59E0B" : v.border),
                        background: rescheduleReason === r.key ? "#F59E0B" : "transparent", transition: "all 0.2s", flexShrink: 0 }}/>
                      <span style={{ fontSize: 12, color: rescheduleReason === r.key ? "#F59E0B" : v.text, fontWeight: rescheduleReason === r.key ? 600 : 400 }}>{lang === "es" ? r.es : r.en}</span>
                    </div>
                  ))}
                </div>
                {rescheduleReason === "other" && (
                  <input value={rescheduleOther} onChange={e => setRescheduleOther(e.target.value)}
                    placeholder={L("Describe the reason...", "Describe el motivo...")}
                    style={{ width: "100%", marginTop: 8, padding: "9px 12px", borderRadius: 8, border: "1px solid " + v.border, background: dark ? "rgba(255,255,255,0.04)" : v.surface, color: v.text, fontSize: 12, outline: "none", fontFamily: "'DM Sans', sans-serif" }}/>
                )}
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: v.textSec, textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: 4 }}>{L("New Date", "Nueva Fecha")}</label>
                <CYDatePicker value={rescheduleDate} onChange={val => { setRescheduleDate(val); setRescheduleTime(""); }} min={new Date().toISOString().split("T")[0]} v={v} dark={dark} lang={lang} style={{ width: "100%" }}/>
                {rescheduleDate && (() => {
                  const crew = crewMap[selectedJob.crewId];
                  const dateJobs = (jobs || []).filter(j => j.date === rescheduleDate && j.crewId === selectedJob.crewId && j.status !== "rescheduled" && j.status !== "cancelled");
                  const usedTimes = dateJobs.map(j => j.time);
                  const allSlots = ["07:00","07:30","08:00","08:30","09:00","09:30","10:00","10:30","11:00","11:30","13:00","13:30","14:00","14:30","15:00","15:30","16:00"];
                  const freeSlots = allSlots.filter(t => !usedTimes.includes(t));
                  const isFull = freeSlots.length === 0;
                  const fmtTime = (t) => { const [h,m] = t.split(":"); const hr = parseInt(h); return (hr > 12 ? hr-12 : hr) + ":" + m + (hr >= 12 ? " PM" : " AM"); };
                  return (
                    <div style={{ marginTop: 8 }}>
                      {/* Crew schedule summary */}
                      <div style={{ padding: "8px 10px", borderRadius: 6, background: dark ? "rgba(255,255,255,0.02)" : "#F8FAF9", border: "1px solid " + v.border + "40", marginBottom: 8 }}>
                        <div style={{ fontSize: 10, fontWeight: 600, color: v.textSec, marginBottom: 4 }}>
                          {crew?.name || ""} · {dateJobs.length} {L("jobs that day", "trabajos ese día")}
                        </div>
                        {dateJobs.length > 0 && (
                          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                            {dateJobs.map((j, i) => {
                              const cl = clientMap[j.clientId];
                              return <span key={i} style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: v.border + "40", color: v.textSec }}>{fmtTime(j.time)} {cl?.name || ""}</span>;
                            })}
                          </div>
                        )}
                      </div>
                      {isFull ? (
                        <div style={{ padding: "10px 12px", borderRadius: 8, background: dark ? "rgba(239,68,68,0.08)" : "#FEF2F2", border: "1px solid #EF444430", display: "flex", alignItems: "center", gap: 6 }}>
                          <AlertTriangle size={14} color="#EF4444"/>
                          <span style={{ fontSize: 11, fontWeight: 600, color: "#EF4444" }}>{L("No available slots on this date. Choose another day.", "No hay horarios disponibles. Elige otro día.")}</span>
                        </div>
                      ) : (
                        <div>
                          <label style={{ fontSize: 11, fontWeight: 600, color: v.textSec, textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: 4 }}>{L("Available Time", "Horario Disponible")} ({freeSlots.length})</label>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                            {freeSlots.map(t => (
                              <div key={t} onClick={() => setRescheduleTime(t)}
                                style={{ padding: "6px 12px", borderRadius: 6, cursor: "pointer",
                                  border: "1px solid " + (rescheduleTime === t ? "#F59E0B" : v.border + "50"),
                                  background: rescheduleTime === t ? (dark ? "rgba(245,158,11,0.12)" : "#FFFBEB") : "transparent",
                                  transition: "all 0.15s" }}>
                                <span style={{ fontSize: 12, fontWeight: rescheduleTime === t ? 700 : 400, color: rescheduleTime === t ? "#F59E0B" : v.text }}>{fmtTime(t)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
            <div style={{ padding: "14px 24px", borderTop: "1px solid " + v.border, display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button onClick={() => setShowReschedule(false)} style={{ padding: "9px 18px", borderRadius: 8, border: "1px solid " + v.border, background: "transparent", color: v.text, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                {L("Cancel", "Cancelar")}
              </button>
              <button onClick={async () => {
                if (!rescheduleDate || !rescheduleReason) return;
                const reasons = { rain: L("Rain/Bad weather","Lluvia/Mal clima"), crew_issue: L("Crew unavailable","Cuadrilla no disponible"), client_absent: L("Client not available","Cliente no disponible"), equipment: L("Equipment issue","Problema de equipo") };
                const reasonText = rescheduleReason === "other" ? rescheduleOther : reasons[rescheduleReason];
                await addJob({ clientId: selectedJob.clientId, serviceIds: selectedJob.serviceIds, crewId: selectedJob.crewId, date: rescheduleDate, time: rescheduleTime, duration: selectedJob.duration, status: "assigned", notes: (selectedJob.notes ? selectedJob.notes + " | " : "") + L("Rescheduled: ","Reprogramado: ") + reasonText, autoGenerated: false });
                await updateJob(selectedJob.id, { status: "rescheduled" });
                setShowReschedule(false);
                setSelectedJob(null);
                setView("week");
                setToast(L("Job rescheduled!", "¡Trabajo reprogramado!"));
                setTimeout(() => setToast(null), 3000);
              }} disabled={!rescheduleDate || !rescheduleReason || !rescheduleTime || (rescheduleReason === "other" && !rescheduleOther)}
                style={{ padding: "9px 18px", borderRadius: 8, border: "none", background: (rescheduleDate && rescheduleReason && rescheduleTime && (rescheduleReason !== "other" || rescheduleOther)) ? "linear-gradient(135deg, #F59E0B, #FBBF24)" : "#D1D5DB", color: (rescheduleDate && rescheduleReason && rescheduleTime) ? "#fff" : "#9CA3AF", fontSize: 12, fontWeight: 600, cursor: (rescheduleDate && rescheduleReason && rescheduleTime) ? "pointer" : "not-allowed", display: "flex", alignItems: "center", gap: 6 }}>
                <CalendarDays size={13}/> {L("Reschedule", "Reprogramar")}
              </button>
            </div>
          </div>
        </div>
      )}

      </div>
    );
  }

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

        {jobFormError && (
          <div style={{ padding: "10px 16px", borderRadius: 8, background: "#FEF2F2", border: "1px solid #FECACA", color: "#DC2626", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 8, animation: "schToast 0.25s ease" }}>
            <AlertTriangle size={14}/> {jobFormError}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20, alignItems: "start" }}>
          {/* Left — Form */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Client */}
            <div style={{ background: v.cardBg, border: "1px solid " + v.border, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: v.text, marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
                <Users size={14} color="#16A34A"/> {L("Client", "Cliente")}
              </div>
              <ClientPicker clients={clients} value={editJob.clientId} onCreateClient={() => { setShowNewClient(true); setNewClientForm({ name: "", email: "", phone: "", areaCode: "", street: "", city: "", state: "", zip: "", paymentMethod: "zelle", zellePhone: "", billingType: "per_visit", services: [], notes: "" }); }} onChange={(id) => {
                setEditJob(p => ({ ...p, clientId: id, serviceIds: [] }));
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
                  <CYDatePicker value={editJob.date} onChange={val => setEditJob(p => ({ ...p, date: val }))} v={v} dark={dark} lang={lang}/>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>{L("Start Time", "Hora Inicio")}</label>
                    <CYTimePicker value={editJob.time} onChange={val => setEditJob(p => ({ ...p, time: val }))} v={v} dark={dark} lang={lang}/>
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
      <style>{`@keyframes schToast { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } } @keyframes cyFadeIn { from { opacity:0; transform:translateY(-4px); } to { opacity:1; transform:translateY(0); } }`}</style>

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
        if (!f.name || !f.email || !isValidEmail(f.email) || !f.areaCode || !f.phone || !f.street || !f.city || !f.state || !f.zip) return;
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
                  <PhoneFieldSch areaCode={f.areaCode} number={f.phone} onAreaChange={c => setF({ areaCode: c })} onNumberChange={n => setF({ phone: n })} items={US_AREA_CODES_SCH} v={v} dark={dark} placeholder={L("Code", "Cód.")} />
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
                  <SearchDropSch value={f.city} onSelect={i => setF({ city: i.name, state: i.state, zip: CITY_ZIPS_SCH[i.full] || f.zip })} items={US_CITIES_SCH} placeholder={L("Search...", "Buscar...")} displayFn={i => i.name ? i.name + ", " + i.state : ""} filterFn={(i,q) => i.name.toLowerCase().includes(q) || i.state.toLowerCase().includes(q)} v={v} dark={dark} />
                </div>
                <div style={{ width: 70 }}>
                  <label style={mLabel}>{L("State", "Estado")} *</label>
                  <input value={f.state} onChange={e => setF({ state: e.target.value.toUpperCase().slice(0, 2) })} placeholder="TX" style={{ ...mInput, background: f.state ? (dark ? "rgba(22,163,74,0.06)" : "#F0FDF4") : undefined }} maxLength={2} readOnly={!!f.state}/>
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
              if (dt.getDay() >= 1 && dt.getDay() <= 6) weekdays.push(dt.toISOString().split("T")[0]);
            }
            monthlyClients.forEach(cl => {
              const crew = (crews || []).find(cr => cr.id === cl.defaultCrewId);
              const svcs = (cl.services || []).map(cs => ({
                serviceId: typeof cs === "string" ? cs : cs.serviceId,
                qty: typeof cs === "string" ? 1 : (cs.qty || 1),
              }));
              if (svcs.length === 0) return;
              const maxVisits = Math.max(...svcs.map(s => s.qty));
              const spacing = Math.max(1, Math.floor(weekdays.length / maxVisits));
              let clientJobs = 0;
              for (let visit = 0; visit < maxVisits; visit++) {
                const dayIdx = Math.min(visit * spacing, weekdays.length - 1);
                const dateStr = weekdays[dayIdx];
                const exists = (jobs || []).some(j => j.clientId === cl.id && j.date === dateStr);
                if (!exists) clientJobs++;
              }
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
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", borderBottom: "1px solid " + v.border }}>
          {weekDates.map((date, i) => {
            const today = isToday(date);
            return (
              <div key={i} style={{ padding: "12px 14px", borderRight: i < 6 ? "1px solid " + v.border : "none", fontSize: 12, fontWeight: 700, color: today ? "#16A34A" : v.textSec, textTransform: "uppercase", letterSpacing: "0.04em", background: today ? (dark ? "rgba(22,163,74,0.06)" : "rgba(22,163,74,0.03)") : "transparent" }}>
                {fmtDayHeader(date, lang)}
                <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 400, color: v.textSec }}>
                  ({jobs.filter(j => j.date === date).length})
                </span>
              </div>
            );
          })}
        </div>

        {/* Job cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", minHeight: 400 }}>
          {weekDates.map((date, dayIdx) => {
            const dayJobs = jobs.filter(j => j.date === date && j.status !== "rescheduled").sort((a, b) => a.time.localeCompare(b.time));
            const today = isToday(date);
            return (
              <div key={dayIdx} style={{ borderRight: dayIdx < 6 ? "1px solid " + v.border : "none", padding: 8, background: today ? (dark ? "rgba(22,163,74,0.03)" : "rgba(22,163,74,0.015)") : "transparent" }}>
                {dayJobs.map(j => {
                  const st = statusConfig(j.status, lang);
                  const crew = crewMap[j.crewId];
                  const client = clientMap[j.clientId];
                  return (
                    <div key={j.id} className="cy-card-hover" style={{ padding: "8px 10px", borderRadius: 8, marginBottom: 6, background: dark ? "rgba(255,255,255,0.03)" : v.surface, border: "1px solid " + v.border, cursor: "pointer", borderLeft: "3px solid " + (crew?.color || "#94A3B8"), transition: "all 0.15s" }} onClick={() => openDetail(j)}>
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
                      {(j.notes || "").includes("Reprogramado") || (j.notes || "").includes("Rescheduled") ? <div style={{ marginTop: 3 }}><span style={{ fontSize: 8, padding: "1px 5px", borderRadius: 3, background: "#FFFBEB", color: "#F59E0B", fontWeight: 700 }}>↻ {lang === "es" ? "Reprogramado" : "Rescheduled"}</span></div> : null}
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