import { useState, useMemo, useEffect, useRef } from "react";
import { useData } from "../../context/DataContext";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  FileText, Plus, Search, Filter, ChevronLeft, Send, CheckCircle,
  Clock, AlertTriangle, DollarSign, Trash2, Download,
  MoreHorizontal, Eye, Printer, Mail, ChevronDown, X, Leaf,
  Calendar, Hash, User, MapPin, Phone, Building2, Receipt,
  ArrowUpRight, ArrowDownRight, TrendingUp, Check
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   INVOICING MODULE — Cleo Yards (Bilingual EN/ES)
   3 Views: List · Create · Detail
   ═══════════════════════════════════════════════════════════════ */

// ── CountUp animation hook ────────────────────────────────
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

// ── Brand tokens ─────────────────────────────────────────────
const G = {
  green:     "#16A34A",
  greenLt:   "#4ADE80",
  bg:        "#F7F9F8",
  card:      "#FFFFFF",
  surface:   "#F1F5F3",
  border:    "#E2E8E4",
  borderLt:  "#EEF2EF",
  text:      "#0F1A14",
  textSec:   "#3D5347",
  dim:       "#7A8F82",
  accent:    "#16A34A",
  accentGlow:"rgba(22,163,74,0.08)",
  danger:    "#DC2626",
  dangerBg:  "#FEF2F2",
  warn:      "#D97706",
  warnBg:    "#FFFBEB",
  cyan:      "#0891B2",
  cyanBg:    "#ECFEFF",
  shadow:    "0 1px 3px rgba(15,26,20,0.06), 0 1px 2px rgba(15,26,20,0.04)",
  shadowLg:  "0 4px 12px rgba(15,26,20,0.08), 0 2px 4px rgba(15,26,20,0.04)",
  radius:    10,
  radiusSm:  6,
  font:      "'DM Sans', 'Inter', system-ui, sans-serif",
  fontDisplay:"'Outfit', 'DM Sans', sans-serif",
};

// ── Status config (bilingual via d) ──────────────────────────
const getStatus = (d) => ({
  draft:   { label: d.draft,   color: G.dim,    bg: G.surface,   icon: FileText },
  sent:    { label: d.sent,    color: G.cyan,   bg: G.cyanBg,    icon: Send },
  paid:    { label: d.paid,    color: G.green,  bg: "#F0FDF4",   icon: CheckCircle },
  overdue: { label: d.overdue, color: G.danger, bg: G.dangerBg,  icon: AlertTriangle },
  partial: { label: d.partial, color: G.warn,   bg: G.warnBg,    icon: Clock },
});

// ── Helpers ──────────────────────────────────────────────────
const fmt = (n) => new Intl.NumberFormat("en-US", { style:"currency", currency:"USD" }).format(n || 0);
const fmtDate = (d, lang) => d ? new Date(d).toLocaleDateString(lang === "es" ? "es-EC" : "en-US", { month:"short", day:"numeric", year:"numeric" }) : "—";
const fmtShort = (d, lang) => d ? new Date(d).toLocaleDateString(lang === "es" ? "es-EC" : "en-US", { month:"short", day:"numeric" }) : "";
const uid = () => "INV-" + Date.now().toString(36).toUpperCase().slice(-6);
const daysDiff = (d) => d ? Math.ceil((new Date(d) - new Date()) / 86400000) : null;

// ── PDF Generator ────────────────────────────────────────
const generateInvoicePDFDoc = (invoice, client, companyProfile) => {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const W = doc.internal.pageSize.getWidth();
  const margin = 50;
  const rightCol = W - margin;
  let y = 50;

  // ── Colors
  const green = [22, 163, 74];
  const dark = [15, 26, 20];
  const gray = [122, 143, 130];
  const lightBg = [247, 249, 248];

  // ── Logo
  if (companyProfile?.logo) {
    try {
      doc.addImage(companyProfile.logo, "PNG", margin, y, 60, 60);
      y += 70;
    } catch (e) {
      y += 10;
    }
  }

  // ── Company name large
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...dark);
  doc.text(companyProfile?.name || "Your Company", margin, y);
  y += 18;

  // ── Company details
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...gray);
  if (companyProfile?.address) { doc.text(companyProfile.address, margin, y); y += 12; }
  if (companyProfile?.city || companyProfile?.state || companyProfile?.zip) {
    doc.text([companyProfile.city, companyProfile.state, companyProfile.zip].filter(Boolean).join(", "), margin, y); y += 12;
  }
  if (companyProfile?.phone) { doc.text(companyProfile.phone, margin, y); y += 12; }
  if (companyProfile?.email) { doc.text(companyProfile.email, margin, y); y += 12; }
  if (companyProfile?.ein) { doc.text("EIN: " + companyProfile.ein, margin, y); y += 12; }

  // ── INVOICE title + number (right aligned)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.setTextColor(...green);
  doc.text("INVOICE", rightCol, 65, { align: "right" });

  doc.setFontSize(11);
  doc.setTextColor(...dark);
  doc.text(invoice.invoiceNumber || invoice.id || "", rightCol, 82, { align: "right" });

  // ── Invoice meta (right side)
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...gray);
  let metaY = 100;
  const metaLabel = (label, value) => {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...gray);
    doc.text(label + ":", rightCol - 120, metaY);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...dark);
    doc.text(value, rightCol, metaY, { align: "right" });
    metaY += 14;
  };
  metaLabel("Date", invoice.date ? new Date(invoice.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "");
  metaLabel("Due Date", invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "");
  // Status with color
  const statusText = (invoice.status || "draft").charAt(0).toUpperCase() + (invoice.status || "draft").slice(1);
  const statusColors = { paid: [22, 163, 74], overdue: [220, 38, 38], sent: [8, 145, 178], draft: [122, 143, 130], partial: [217, 119, 6] };
  const statusColor = statusColors[invoice.status] || gray;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...gray);
  doc.text("Status:", rightCol - 120, metaY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...statusColor);
  doc.text(statusText, rightCol, metaY, { align: "right" });
  doc.setFontSize(9);
  metaY += 14;
  if (client?.paymentMethod) {
    const pm = { zelle: "Zelle", card: "Credit Card", cash: "Cash", ach: "ACH Transfer" };
    metaLabel("Payment", pm[client.paymentMethod] || client.paymentMethod);
  }

  // ── Divider
  y = Math.max(y, metaY) + 20;
  doc.setDrawColor(226, 232, 228);
  doc.setLineWidth(1);
  doc.line(margin, y, rightCol, y);
  y += 20;

  // ── BILL TO
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...gray);
  doc.text("BILL TO", margin, y);
  y += 14;

  doc.setFontSize(12);
  doc.setTextColor(...dark);
  doc.text(client?.name || "—", margin, y);
  y += 14;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...gray);
  if (client?.address) { doc.text(client.address, margin, y); y += 12; }
  if (client?.phone) { doc.text(client.phone, margin, y); y += 12; }
  if (client?.email) { doc.text(client.email, margin, y); y += 12; }

  y += 16;

  // ── Items table
  const items = (invoice.items || []).map(item => {
    const qty = item.qty || 1;
    const price = item.price || 0;
    return [
      item.name || item.nameEs || "—",
      qty.toString(),
      "$" + price.toFixed(2),
      "$" + (qty * price).toFixed(2),
    ];
  });

  autoTable(doc, {
    startY: y,
    head: [["Description", "Qty", "Rate", "Total"]],
    body: items,
    margin: { left: margin, right: margin },
    styles: {
      font: "helvetica",
      fontSize: 9,
      cellPadding: 8,
      textColor: dark,
      lineColor: [226, 232, 228],
      lineWidth: 0.5,
    },
    headStyles: {
      fillColor: lightBg,
      textColor: gray,
      fontStyle: "bold",
      fontSize: 8,
      halign: "left",
    },
    columnStyles: {
      0: { cellWidth: "auto", halign: "left" },
      1: { cellWidth: 50, halign: "center" },
      2: { cellWidth: 70, halign: "right" },
      3: { cellWidth: 80, halign: "right", fontStyle: "bold" },
    },
    alternateRowStyles: { fillColor: [255, 255, 255] },
    theme: "grid",
  });

  y = doc.lastAutoTable.finalY + 20;

  // ── Totals
  const totalsX = rightCol - 180;
  const totalsValX = rightCol;
  const subtotal = invoice.subtotal || 0;
  const taxAmt = invoice.taxAmount || 0;
  const total = invoice.total || 0;
  const taxRate = invoice.taxRate || 6.25;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...gray);
  doc.text("Subtotal", totalsX, y);
  doc.setTextColor(...dark);
  doc.text("$" + subtotal.toFixed(2), totalsValX, y, { align: "right" });
  y += 16;

  if (invoice.discountAmt && invoice.discountAmt > 0) {
    doc.setTextColor(...gray);
    doc.text("Discount", totalsX, y);
    doc.setTextColor(220, 38, 38);
    doc.text("-$" + invoice.discountAmt.toFixed(2), totalsValX, y, { align: "right" });
    y += 16;
  }

  doc.setTextColor(...gray);
  doc.text("Tax (" + taxRate + "%)", totalsX, y);
  doc.setTextColor(...dark);
  doc.text("$" + taxAmt.toFixed(2), totalsValX, y, { align: "right" });
  y += 6;

  doc.setDrawColor(226, 232, 228);
  doc.line(totalsX, y, rightCol, y);
  y += 16;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...green);
  doc.text("Total", totalsX, y);
  doc.text("$" + total.toFixed(2), totalsValX, y, { align: "right" });

  y += 30;

  // ── Notes
  if (invoice.notes) {
    doc.setDrawColor(226, 232, 228);
    doc.line(margin, y, rightCol, y);
    y += 16;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...gray);
    doc.text("NOTES", margin, y);
    y += 14;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...dark);
    const noteLines = doc.splitTextToSize(invoice.notes, rightCol - margin);
    doc.text(noteLines, margin, y);
    y += noteLines.length * 12;
  }

  // ── Footer
  y = doc.internal.pageSize.getHeight() - 40;
  doc.setDrawColor(226, 232, 228);
  doc.line(margin, y, rightCol, y);
  y += 14;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...gray);
  doc.text("Thank you for your business!", margin, y);
  doc.text("Generated by Cleo Yards", rightCol, y, { align: "right" });

  return doc;
};

const generateInvoicePDF = (invoice, client, companyProfile) => {
  const doc = generateInvoicePDFDoc(invoice, client, companyProfile);
  doc.save((invoice.invoiceNumber || invoice.id) + ".pdf");
};

// ── Shared UI atoms ─────────────────────────────────────────
const sBtn = (primary) => ({
  display:"inline-flex", alignItems:"center", gap:6, padding: primary ? "9px 18px" : "8px 14px",
  borderRadius: G.radiusSm, border: primary ? "none" : `1px solid ${G.border}`,
  background: primary ? G.green : G.card, color: primary ? "#FFF" : G.text,
  fontSize:13, fontWeight:600, cursor:"pointer", fontFamily: G.font,
  transition:"all 0.15s", boxShadow: primary ? "0 1px 3px rgba(22,163,74,0.3)" : "none",
});
const sInput = {
  width:"100%", padding:"9px 12px", borderRadius: G.radiusSm,
  border:`1px solid ${G.border}`, background: G.card, color: G.text,
  fontSize:13, fontFamily: G.font, outline:"none", transition:"border 0.15s",
};
const sLabel = { fontSize:11, fontWeight:600, color: G.dim, letterSpacing:"0.04em", textTransform:"uppercase", marginBottom:4, display:"block" };

const CHEVRON_SVG = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%237A8F82' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")";
const selStyle = (extra = {}) => ({ ...sInput, cursor:"pointer", appearance:"none", backgroundImage: CHEVRON_SVG, backgroundRepeat:"no-repeat", backgroundPosition:"right 8px center", ...extra });

function Badge({ status, d }) {
  const S = getStatus(d);
  const s = S[status] || S.draft;
  const Icon = s.icon;
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"4px 10px", borderRadius:50,
      background: s.bg, color: s.color, fontSize:11, fontWeight:600, whiteSpace:"nowrap" }}>
      <Icon size={12} strokeWidth={2.5}/> {s.label}
    </span>
  );
}

function EmptyState({ icon: Icon, title, sub, action, onAction }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
      padding:"64px 24px", textAlign:"center" }}>
      <div style={{ width:56, height:56, borderRadius:14, background: G.accentGlow,
        display:"flex", alignItems:"center", justifyContent:"center", marginBottom:16 }}>
        <Icon size={24} color={G.green}/>
      </div>
      <div style={{ fontSize:16, fontWeight:700, color: G.text, fontFamily: G.fontDisplay, marginBottom:4 }}>{title}</div>
      <div style={{ fontSize:13, color: G.dim, maxWidth:300, lineHeight:1.5, marginBottom: action ? 20 : 0 }}>{sub}</div>
      {action && (
        <button onClick={onAction} style={sBtn(true)}>
          <Plus size={14}/> {action}
        </button>
      )}
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════
   VIEW 1 — INVOICE LIST
   ═════════════════════════════════════════════════════════════ */
function InvoiceList({ invoices, onNew, onView, clients, d, lang }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date_desc");

  const custMap = useMemo(() => {
    const m = {};
    (clients || []).forEach(c => { m[c.id] = c; });
    return m;
  }, [clients]);

  const filtered = useMemo(() => {
    let list = [...(invoices || [])];
    if (statusFilter !== "all") list = list.filter(i => i.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(i =>
        i.id?.toLowerCase().includes(q) ||
        (custMap[i.clientId]?.name || "").toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      if (sortBy === "date_desc") return new Date(b.created_at) - new Date(a.created_at);
      if (sortBy === "date_asc")  return new Date(a.created_at) - new Date(b.created_at);
      if (sortBy === "amount")    return (b.total || 0) - (a.total || 0);
      return 0;
    });
    return list;
  }, [invoices, search, statusFilter, sortBy, custMap]);

  const stats = useMemo(() => {
    const all = invoices || [];
    return {
      total:     all.reduce((s, i) => s + (i.total || 0), 0),
      paid:      all.filter(i => i.status === "paid").reduce((s, i) => s + (i.total || 0), 0),
      pending:   all.filter(i => ["sent","partial"].includes(i.status)).reduce((s, i) => s + (i.total || 0), 0),
      overdue:   all.filter(i => i.status === "overdue").reduce((s, i) => s + (i.total || 0), 0),
      countPaid: all.filter(i => i.status === "paid").length,
      count:     all.length,
    };
  }, [invoices]);

  const animTotal = useCountUp(stats.total);
  const animPaid = useCountUp(stats.paid);
  const animPending = useCountUp(stats.pending);
  const animOverdue = useCountUp(stats.overdue);

  const statCards = [
    { label: d.totalInvoiced, value: fmt(animTotal), icon: Receipt, color: G.text, bg: G.surface },
    { label: d.collected,     value: fmt(animPaid),  icon: CheckCircle, color: G.green, bg:"#F0FDF4" },
    { label: d.outstanding,   value: fmt(animPending), icon: Clock, color: G.cyan, bg: G.cyanBg },
    { label: d.overdue,       value: fmt(animOverdue), icon: AlertTriangle, color: G.danger, bg: G.dangerBg },
  ];

  const filters = [
    { key:"all", label: d.all },
    { key:"draft", label: d.draft },
    { key:"sent", label: d.sent },
    { key:"paid", label: d.paid },
    { key:"overdue", label: d.overdue },
    { key:"partial", label: d.partial },
  ];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, color: G.text, fontFamily: G.fontDisplay, margin:0 }}>{d.title}</h1>
          <p style={{ fontSize:13, color: G.dim, margin:"2px 0 0" }}>{stats.count} total · {stats.countPaid} {d.paid.toLowerCase()}</p>
        </div>
        <button onClick={onNew} style={sBtn(true)}><Plus size={15}/> {d.newInv}</button>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(180px, 1fr))", gap:12 }}>
        {statCards.map((sc, i) => {
          const Icon = sc.icon;
          return (
            <div key={i} style={{ background: G.card, border:`1px solid ${G.borderLt}`, borderRadius: G.radius, padding:"16px 18px", boxShadow: G.shadow, transition:"all 0.2s ease", cursor:"default" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = G.shadowLg; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = G.shadow; }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
                <span style={{ fontSize:11, fontWeight:600, color: G.dim, textTransform:"uppercase", letterSpacing:"0.04em" }}>{sc.label}</span>
                <div style={{ width:28, height:28, borderRadius:7, background: sc.bg, display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <Icon size={14} color={sc.color}/>
                </div>
              </div>
              <div style={{ fontSize:20, fontWeight:800, color: sc.color, fontFamily: G.fontDisplay, textAlign:"center" }}>{sc.value}</div>
            </div>
          );
        })}
      </div>

      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
        {filters.map(f => (
          <button key={f.key} onClick={() => setStatusFilter(f.key)}
            style={{ padding:"7px 12px", borderRadius:50, border:`1px solid ${statusFilter === f.key ? G.green : G.border}`,
              background: statusFilter === f.key ? G.accentGlow : G.card, color: statusFilter === f.key ? G.green : G.dim,
              fontSize:12, fontWeight:600, cursor:"pointer", fontFamily: G.font, transition:"all 0.15s" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.05)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}>
            {f.label}
          </button>
        ))}
        <div style={{ position:"relative", width:130, flexShrink:0 }}>
          <Search size={13} color={G.dim} style={{ position:"absolute", left:8, top:"50%", transform:"translateY(-50%)" }}/>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="" style={{ ...sInput, paddingLeft:28, padding:"7px 8px 7px 28px", fontSize:12 }}/>
        </div>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)}
          style={selStyle({ width:"auto", padding:"7px 28px 7px 10px", fontSize:12, marginLeft:"auto" })}>
          <option value="date_desc">{d.newestFirst}</option>
          <option value="date_asc">{d.oldestFirst}</option>
          <option value="amount">{d.highestAmount}</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={FileText} title={d.noInvoices} sub={d.noInvoicesSub} action={d.createInvoice} onAction={onNew}/>
      ) : (
        <div style={{ background: G.card, border:`1px solid ${G.borderLt}`, borderRadius: G.radius, boxShadow: G.shadow, overflow:"hidden" }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 2fr 1.2fr 1fr 1fr 56px", padding:"10px 18px", borderBottom:`1px solid ${G.border}`, background: G.surface }}>
            {[d.invoice, d.client, d.date, d.amount, d.status, ""].map((h,i) => (
              <span key={i} style={{ fontSize:10, fontWeight:700, color: G.dim, textTransform:"uppercase", letterSpacing:"0.06em" }}>{h}</span>
            ))}
          </div>
          {filtered.map((inv, idx) => {
            const cust = custMap[inv.clientId];
            return (
              <div key={inv.id || idx} onClick={() => onView(inv)}
                style={{ display:"grid", gridTemplateColumns:"1fr 2fr 1.2fr 1fr 1fr 56px", padding:"14px 18px",
                  borderBottom: idx < filtered.length - 1 ? `1px solid ${G.borderLt}` : "none",
                  cursor:"pointer", transition:"all 0.18s ease", alignItems:"center" }}
                onMouseEnter={e => { e.currentTarget.style.background = G.accentGlow; e.currentTarget.style.transform = "translateX(4px)"; e.currentTarget.style.boxShadow = "inset 3px 0 0 " + G.green; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.transform = "translateX(0)"; e.currentTarget.style.boxShadow = "none"; }}>
                <span style={{ fontSize:13, fontWeight:700, color: G.green, fontFamily:"'JetBrains Mono','Fira Code',monospace" }}>{inv.invoiceNumber || inv.id || "—"}</span>
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color: G.text }}>{cust?.name || "—"}</div>
                  {cust?.address && <div style={{ fontSize:11, color: G.dim, marginTop:1 }}>{cust.address}</div>}
                </div>
                <div>
                  <div style={{ fontSize:13, color: G.text }}>{fmtDate(inv.date, lang)}</div>
                  {inv.dueDate && <div style={{ fontSize:11, color: inv.status === "overdue" ? G.danger : G.dim, marginTop:1 }}>{d.due} {fmtShort(inv.dueDate, lang)}</div>}
                </div>
                <span style={{ fontSize:14, fontWeight:700, color: G.text }}>{fmt(inv.total)}</span>
                <Badge status={inv.status} d={d}/>
                <div style={{ display:"flex", justifyContent:"flex-end" }}><Eye size={14} color={G.dim}/></div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}


/* ═════════════════════════════════════════════════════════════
   VIEW 2 — CREATE / EDIT INVOICE
   ═════════════════════════════════════════════════════════════ */
function InvoiceForm({ onCancel, onSave, clients, services, editInvoice, d, lang }) {
  const { STATE_TAX, calculateInvoice } = useData();

  const [form, setForm] = useState(() => {
    if (editInvoice) return { ...editInvoice };
    return { id: uid(), clientId: "", date: new Date().toISOString().slice(0, 10), dueDate: "", notes: "",
      items: [{ id: Date.now(), serviceId: "", name: "", qty: 1, price: 0 }], discount: 0, discount_type: "percent" };
  });

  const [clientSearch, setClientSearch] = useState(() => {
    if (editInvoice) { const cl = (clients || []).find(c => c.id === editInvoice.clientId); return cl?.name || ""; }
    return "";
  });
  const [showClientDrop, setShowClientDrop] = useState(false);
  const clientRef = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (clientRef.current && !clientRef.current.contains(e.target)) setShowClientDrop(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
  const [openSvcDrop, setOpenSvcDrop] = useState(null);
  const filteredClients = useMemo(() => {
    if (!clientSearch.trim()) return clients || [];
    const q = clientSearch.toLowerCase();
    return (clients || []).filter(c => c.name.toLowerCase().includes(q) || (c.address||"").toLowerCase().includes(q));
  }, [clientSearch, clients]);

  const setField = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const addItem = () => setForm(p => ({ ...p, items: [...p.items, { id: Date.now(), serviceId: "", name: "", qty: 1, price: 0 }] }));
  const updateItem = (id, key, val) => setForm(p => ({ ...p, items: p.items.map(it => it.id === id ? { ...it, [key]: val } : it) }));
  const removeItem = (id) => setForm(p => ({ ...p, items: p.items.filter(it => it.id !== id) }));

  const applyService = (itemId, serviceId) => {
    const svc = (services || []).find(s => s.id === serviceId);
    if (!svc) return;
    setForm(p => ({ ...p, items: p.items.map(it => it.id === itemId ? { ...it, serviceId, name: lang === "es" && svc.nameEs ? svc.nameEs : svc.name, price: svc.price || 0 } : it) }));
  };

  const calc = useMemo(() => {
    const items = form.items || [];
    const subtotal = items.reduce((s, it) => s + (it.qty || 0) * (it.price || 0), 0);
    const discountAmt = form.discount_type === "percent" ? subtotal * ((form.discount || 0) / 100) : (form.discount || 0);
    const taxable = subtotal - discountAmt;
    let taxRate = 0;
    if (form.clientId && calculateInvoice) {
      try { taxRate = calculateInvoice(form.clientId, items).taxRate || 0; } catch(e) {}
    }
    const taxAmount = form.clientId ? Math.round(taxable * taxRate) / 100 : 0;
    return { subtotal, discountAmt, taxable, tax: taxAmount, taxRate, total: taxable + taxAmount };
  }, [form.items, form.discount, form.discount_type, form.clientId, calculateInvoice]);

  const [formError, setFormError] = useState("");

  const handleSave = (status = "draft") => {
    if (status !== "draft" && !form.clientId) {
      setFormError(lang === "es" ? "Selecciona un cliente" : "Select a client");
      setTimeout(() => setFormError(""), 3000);
      return;
    }
    if (!form.dueDate) {
      setFormError(lang === "es" ? "La fecha de vencimiento es obligatoria" : "Due date is required");
      setTimeout(() => setFormError(""), 3000);
      return;
    }
    setFormError("");
    onSave({ ...form, status, ...calc, created_at: form.date || new Date().toISOString().split("T")[0] });
  };

  const selectedCustomer = (clients || []).find(c => c.id === form.clientId);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      <div style={{ display:"flex", alignItems:"center", gap:12 }}>
        <button onClick={onCancel} style={{ ...sBtn(false), padding:"8px 10px" }}><ChevronLeft size={16}/></button>
        <div style={{ flex:1 }}>
          <h1 style={{ fontSize:20, fontWeight:800, color: G.text, fontFamily: G.fontDisplay, margin:0 }}>{editInvoice ? d.editInvoice : d.newInv}</h1>
          <span style={{ fontSize:13, color: G.dim }}>{form.id}</span>
        </div>
        <button onClick={() => handleSave("draft")} style={sBtn(false)}><FileText size={14}/> {d.saveDraft}</button>
        <button onClick={() => handleSave("sent")} style={sBtn(true)}><Send size={14}/> {d.saveAndSend}</button>
      </div>
      {formError && (
        <div style={{ padding:"10px 14px", borderRadius:G.radiusSm, background:G.dangerBg, border:`1px solid ${G.danger}30`,
          color:G.danger, fontSize:13, fontWeight:600, display:"flex", alignItems:"center", gap:8,
          animation:"slideUp 0.2s ease" }}>
          <AlertTriangle size={14}/> {formError}
        </div>
      )}

      <div style={{ display:"grid", gridTemplateColumns:"1fr 360px", gap:20, alignItems:"start" }}>
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          {/* Customer + Dates */}
          <div style={{ background: G.card, border:`1px solid ${G.borderLt}`, borderRadius: G.radius, padding:20, boxShadow: G.shadow }}>
            <div style={{ fontSize:13, fontWeight:700, color: G.text, marginBottom:14, display:"flex", alignItems:"center", gap:6 }}>
              <User size={14} color={G.green}/> {d.customerDetails}
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
              <div ref={clientRef} style={{ position:"relative", marginBottom:14 }}>
                <label style={sLabel}>{d.customer}</label>
                <div style={{ position:"relative" }}>
                  <input value={clientSearch} onChange={e => { setClientSearch(e.target.value); setField("clientId",""); setShowClientDrop(true); }}
                    onFocus={() => setShowClientDrop(true)}
                    placeholder={d.selectCustomer} style={{ ...sInput, paddingRight: clientSearch ? 32 : 12 }}/>
                  {clientSearch && (
                    <button onClick={() => { setClientSearch(""); setField("clientId",""); setShowClientDrop(true); }}
                      style={{ position:"absolute", right:8, top:"50%", transform:"translateY(-50%)", background:"none",
                        border:"none", cursor:"pointer", padding:2, display:"flex" }}>
                      <X size={14} color={G.dim}/>
                    </button>
                  )}
                </div>
                {showClientDrop && filteredClients.length > 0 && (
                  <div style={{ position:"absolute", top:"100%", left:0, right:0, marginTop:4, background:G.card,
                    border:`1px solid ${G.border}`, borderRadius:G.radiusSm, boxShadow:G.shadowLg, zIndex:20,
                    maxHeight:180, overflowY:"auto" }}>
                    {filteredClients.map(cl => (
                      <div key={cl.id} onClick={() => { 
                        setField("clientId", cl.id); 
                        setClientSearch(cl.name); 
                        setShowClientDrop(false);
                        // Auto-load client services as line items
                        if (cl.services && cl.services.length > 0) {
                          const svcItems = cl.services.map(cs => {
                            const sid = typeof cs === "string" ? cs : cs.serviceId;
                            const qty = typeof cs === "string" ? 1 : (cs.qty || 1);
                            const svc = (services || []).find(s => s.id === sid);
                            if (!svc) return null;
                            return { id: Date.now() + Math.random(), serviceId: sid, name: lang === "es" && svc.nameEs ? svc.nameEs : svc.name, qty, price: svc.price || 0 };
                          }).filter(Boolean);
                          if (svcItems.length > 0) setForm(p => ({ ...p, clientId: cl.id, items: svcItems }));
                        }
                      }}
                        style={{ padding:"8px 12px", cursor:"pointer", fontSize:13, color:G.text, transition:"background 0.1s" }}
                        onMouseEnter={e => e.currentTarget.style.background = G.accentGlow}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                        <div style={{ fontWeight:600 }}>{cl.name}</div>
                        {cl.address && <div style={{ fontSize:11, color:G.dim, marginTop:1 }}>{cl.address}</div>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ borderTop:`1px solid ${G.borderLt}`, paddingTop:14, display:"flex", gap:14 }}>
                <div style={{ flex:1 }}>
                  <label style={sLabel}>{d.invoiceDate}</label>
                  <input type="date" value={form.date} onChange={e => setField("date", e.target.value)} style={sInput}/>
                </div>
                <div style={{ width:1, background:G.borderLt }}/>
                <div style={{ flex:1 }}>
                  <label style={sLabel}>{d.dueDate}</label>
                  <input type="date" value={form.dueDate} onChange={e => setField("dueDate", e.target.value)} style={sInput}/>
                </div>
              </div>
            </div>
            {selectedCustomer && (
              <div style={{ marginTop:12, padding:"10px 12px", background: G.surface, borderRadius: G.radiusSm, fontSize:12, color: G.textSec, lineHeight:1.6 }}>
                <strong>{selectedCustomer.name}</strong>
                {selectedCustomer.address && <div>{selectedCustomer.address}</div>}
                {selectedCustomer.phone && <div>{selectedCustomer.phone}</div>}
                {selectedCustomer.email && <div>{selectedCustomer.email}</div>}
                {selectedCustomer.paymentMethod && (
                  <div style={{ marginTop:6, paddingTop:6, borderTop:`1px solid ${G.borderLt}`, display:"flex", alignItems:"center", gap:6 }}>
                    <DollarSign size={12} color={G.green}/>
                    <span style={{ fontWeight:600, color: G.text }}>
                      {{ zelle:"Zelle", card: lang === "es" ? "Tarjeta de Crédito" : "Credit Card", cash: lang === "es" ? "Efectivo" : "Cash", ach:"ACH Transfer" }[selectedCustomer.paymentMethod] || selectedCustomer.paymentMethod}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Line items */}
          <div style={{ background: G.card, border:`1px solid ${G.borderLt}`, borderRadius: G.radius, padding:20, boxShadow: G.shadow }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
              <div style={{ fontSize:13, fontWeight:700, color: G.text, display:"flex", alignItems:"center", gap:6 }}>
                <Leaf size={14} color={G.green}/> {d.lineItems}
              </div>
              <button onClick={addItem} style={{ ...sBtn(false), padding:"6px 10px", fontSize:11 }}><Plus size={12}/> {d.addLine}</button>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 55px 80px 80px 28px", gap:8, padding:"0 0 8px", borderBottom:`1px solid ${G.border}` }}>
              {[d.description, d.qty, d.rate, d.total, ""].map((h,i) => (
                <span key={i} style={{ fontSize:10, fontWeight:700, color: G.dim, textTransform:"uppercase", letterSpacing:"0.05em",
                  textAlign: i === 0 ? "left" : "center" }}>{h}</span>
              ))}
            </div>
            {form.items.map((item, idx) => (
              <div key={item.id} style={{ display:"grid", gridTemplateColumns:"1fr 55px 80px 80px 28px", gap:8, padding:"10px 0",
                borderBottom: idx < form.items.length - 1 ? `1px solid ${G.borderLt}` : "none", alignItems:"center" }}>
                <div style={{ position:"relative" }}>
                  <input value={item.name || ""} 
                    onChange={e => { updateItem(item.id, "name", e.target.value); updateItem(item.id, "serviceId", ""); updateItem(item.id, "price", 0); setOpenSvcDrop(item.id); }}
                    onFocus={() => setOpenSvcDrop(item.id)}
                    onBlur={() => setTimeout(() => setOpenSvcDrop(null), 200)}
                    placeholder={d.description + "..."}
                    style={{ ...sInput, padding:"7px 8px", fontSize:12 }}/>
                  {openSvcDrop === item.id && (() => {
                    const q = (item.name || "").toLowerCase();
                    const filtered = (services || []).filter(s => {
                      const label = lang === "es" && s.nameEs ? s.nameEs : s.name;
                      return !q || label.toLowerCase().includes(q);
                    });
                    if (filtered.length === 0) return null;
                    return (
                      <div style={{ position:"absolute", top:"100%", left:0, right:0, marginTop:4, background:G.card,
                        border:`1px solid ${G.border}`, borderRadius:G.radiusSm, boxShadow:G.shadowLg, zIndex:20,
                        maxHeight:200, overflowY:"auto", minWidth:220 }}>
                        {filtered.map(s => {
                          const label = lang === "es" && s.nameEs ? s.nameEs : s.name;
                          return (
                            <div key={s.id} onMouseDown={(e) => { e.preventDefault(); applyService(item.id, s.id); setOpenSvcDrop(null); }}
                              style={{ padding:"7px 10px", cursor:"pointer", fontSize:12, color:G.text, transition:"background 0.1s",
                                display:"flex", justifyContent:"space-between", alignItems:"center" }}
                              onMouseEnter={e => e.currentTarget.style.background = G.accentGlow}
                              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                              <span>{label}</span>
                              <span style={{ fontSize:11, color:G.green, fontWeight:700 }}>${s.price}</span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
                <input type="number" min="1" value={item.qty} onChange={e => updateItem(item.id, "qty", +e.target.value || 1)}
                  style={{ ...sInput, padding:"7px 4px", fontSize:12, textAlign:"center" }}/>
                <div style={{ position:"relative" }}>
                  <span style={{ position:"absolute", left:8, top:"50%", transform:"translateY(-50%)", fontSize:12, color: G.dim }}>$</span>
                  <input type="number" min="0" step="0.01" value={item.price}
                    onChange={e => { if (!item.serviceId) updateItem(item.id, "price", +e.target.value || 0); }}
                    readOnly={!!item.serviceId}
                    style={{ ...sInput, padding:"7px 8px 7px 20px", fontSize:12, background: item.serviceId ? G.surface : G.card, cursor: item.serviceId ? "default" : "text" }}/>
                </div>
                <span style={{ fontSize:13, fontWeight:700, color: G.text, textAlign:"right", paddingRight:4 }}>{fmt((item.qty || 0) * (item.price || 0))}</span>
                <button onClick={() => form.items.length > 1 && removeItem(item.id)}
                  style={{ background:"none", border:"none", cursor: form.items.length > 1 ? "pointer" : "default", opacity: form.items.length > 1 ? 1 : 0.3, padding:4, display:"flex" }}>
                  <Trash2 size={14} color={G.danger}/>
                </button>
              </div>
            ))}
          </div>

          {/* Notes */}
          <div style={{ background: G.card, border:`1px solid ${G.borderLt}`, borderRadius: G.radius, padding:20, boxShadow: G.shadow }}>
            <label style={sLabel}>{d.noteTerms}</label>
            <textarea value={form.notes} onChange={e => setField("notes", e.target.value)} rows={3} placeholder={d.notePlaceholder}
              style={{ ...sInput, resize:"vertical", lineHeight:1.5 }}/>
          </div>
        </div>

        {/* Right — Summary */}
        <div style={{ position:"sticky", top:20 }}>
          <div style={{ background: G.card, border:`1px solid ${G.borderLt}`, borderRadius: G.radius, padding:20, boxShadow: G.shadow }}>
            <div style={{ fontSize:13, fontWeight:700, color: G.text, marginBottom:16, display:"flex", alignItems:"center", gap:6 }}>
              <DollarSign size={14} color={G.green}/> {d.invoiceSummary}
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, color: G.textSec }}>
                <span>{d.subtotal} ({form.items.length} {form.items.length !== 1 ? d.items : d.item})</span>
                <span style={{ fontWeight:600 }}>{fmt(calc.subtotal)}</span>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:8, paddingBottom:10, borderBottom:`1px solid ${G.borderLt}` }}>
                <span style={{ fontSize:12, color: G.dim, whiteSpace:"nowrap" }}>{d.discount}</span>
                <input type="number" min="0" value={form.discount} onChange={e => setField("discount", +e.target.value || 0)}
                  style={{ ...sInput, width:60, padding:"5px 6px", fontSize:12, textAlign:"center" }}/>
                <select value={form.discount_type} onChange={e => setField("discount_type", e.target.value)}
                  style={selStyle({ width:"auto", padding:"5px 22px 5px 6px", fontSize:12, backgroundPosition:"right 4px center" })}>
                  <option value="percent">%</option>
                  <option value="fixed">$</option>
                </select>
                <span style={{ fontSize:12, color: G.danger, fontWeight:600, marginLeft:"auto" }}>−{fmt(calc.discountAmt)}</span>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, color: G.textSec }}>
                <span>{d.taxableAmount}</span><span>{fmt(calc.taxable)}</span>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, color: G.textSec, paddingBottom:12, borderBottom:`1px solid ${G.borderLt}` }}>
                <span>{d.tax} ({(calc.taxRate || 6.25).toFixed(2)}%)</span><span>{fmt(calc.tax)}</span>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"4px 0" }}>
                <span style={{ fontSize:15, fontWeight:800, color: G.text, fontFamily: G.fontDisplay }}>{d.total}</span>
                <span style={{ fontSize:22, fontWeight:800, color: G.green, fontFamily: G.fontDisplay }}>{fmt(calc.total)}</span>
              </div>
            </div>
          </div>
          {selectedCustomer && (
            <div style={{ marginTop:12, background: G.accentGlow, border:`1px solid ${G.green}20`, borderRadius: G.radius, padding:"14px 16px" }}>
              <div style={{ fontSize:11, fontWeight:700, color: G.green, textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:6 }}>{d.billingTo}</div>
              <div style={{ fontSize:13, fontWeight:600, color: G.text }}>{selectedCustomer.name}</div>
              {selectedCustomer.address && <div style={{ fontSize:12, color: G.textSec, marginTop:2 }}>{selectedCustomer.address}</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


/* ═════════════════════════════════════════════════════════════
   VIEW 3 — INVOICE DETAIL
   ═════════════════════════════════════════════════════════════ */
function InvoiceDetail({ invoice, onBack, onEdit, clients, d, lang, companyProfile }) {
  const { sendInvoice, markPaid, STATE_TAX } = useData();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [payForm, setPayForm] = useState({ paidDate: "", paymentMethod: "zelle", amount: "", notes: "" });
  const [payLoading, setPayLoading] = useState(false);
  const [payToast, setPayToast] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const close = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  if (!invoice) return null;
  const cust = (clients || []).find(c => c.id === invoice.clientId);
  const dueDays = daysDiff(invoice.dueDate);
  const taxRate = (invoice.taxRate || 6.25).toFixed(2);
  const handleSend = async () => { if (sendInvoice) await sendInvoice(invoice.id); };
  const openPayModal = () => {
    setPayForm({
      paidDate: new Date().toISOString().split("T")[0],
      paymentMethod: cust?.paymentMethod || invoice.paymentMethod || "zelle",
      amount: (invoice.total || 0).toFixed(2),
      notes: "",
    });
    setShowPayModal(true);
  };
  const confirmPay = async () => {
    setPayLoading(true);
    await markPaid(invoice.id, {
      paidDate: payForm.paidDate,
      paymentMethod: payForm.paymentMethod,
      notes: payForm.notes || undefined,
    });
    setPayLoading(false);
    setShowPayModal(false);
    setPayToast(L("Payment recorded successfully!", "¡Pago registrado exitosamente!"));
    setTimeout(() => setPayToast(null), 3000);
  };
  const L = (en, es) => lang === "es" ? es : en;
  const payMethods = [
    { key: "zelle", label: "Zelle", icon: "⚡" },
    { key: "cash", label: L("Cash", "Efectivo"), icon: "💵" },
    { key: "check", label: L("Check", "Cheque"), icon: "📄" },
    { key: "card", label: L("Credit Card", "Tarjeta"), icon: "💳" },
    { key: "ach", label: "ACH Transfer", icon: "🏦" },
  ];
  const fmtPayDate = (val) => {
    if (!val) return "";
    const dt = new Date(val + "T12:00");
    return String(dt.getDate()).padStart(2,"0") + "/" + String(dt.getMonth()+1).padStart(2,"0") + "/" + dt.getFullYear();
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      <div style={{ display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
        <button onClick={onBack} style={{ ...sBtn(false), padding:"8px 10px" }}><ChevronLeft size={16}/></button>
        <div style={{ flex:1 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <h1 style={{ fontSize:20, fontWeight:800, color: G.text, fontFamily: G.fontDisplay, margin:0 }}>{invoice.invoiceNumber || invoice.id}</h1>
            <Badge status={invoice.status} d={{draft:"Draft",sent:"Sent",paid:"Paid",overdue:"Overdue",partial:"Partial"}}/>
          </div>
          <p style={{ fontSize:13, color: G.dim, margin:"2px 0 0" }}>
            Created {fmtDate(invoice.date, "en")}
            {invoice.dueDate && <> · Due {fmtDate(invoice.dueDate, "en")}</>}
            {dueDays !== null && dueDays < 0 && invoice.status !== "paid" && (
              <span style={{ color: G.danger, fontWeight:600 }}> · {Math.abs(dueDays)}d overdue</span>
            )}
          </p>
        </div>
        <div style={{ display:"flex", gap:8, position:"relative" }} ref={menuRef}>
          {invoice.status === "draft" && <button onClick={handleSend} style={sBtn(true)}><Send size={14}/> {d.sendInvoice}</button>}
          {["sent","partial","overdue"].includes(invoice.status) && <button onClick={openPayModal} style={sBtn(true)}><CheckCircle size={14}/> {d.markPaid}</button>}
          <button onClick={() => onEdit(invoice)} style={sBtn(false)}><FileText size={14}/> {d.edit}</button>
          <button onClick={() => setMenuOpen(!menuOpen)} style={{ ...sBtn(false), padding:"8px 8px" }}><MoreHorizontal size={16}/></button>
          {menuOpen && (
            <div style={{ position:"absolute", top:"100%", right:0, marginTop:6, background: G.card,
              border:`1px solid ${G.border}`, borderRadius: G.radius, boxShadow: G.shadowLg, overflow:"hidden", zIndex:10, minWidth:160 }}>
              {[
                { icon: Download, label: d.downloadPdf, action:() => generateInvoicePDF(invoice, cust, companyProfile) },
                { icon: Printer, label: d.print, action:() => { const doc = generateInvoicePDFDoc(invoice, cust, companyProfile); const blob = doc.output("blob"); const url = URL.createObjectURL(blob); const iframe = document.createElement("iframe"); iframe.style.display = "none"; iframe.src = url; document.body.appendChild(iframe); iframe.onload = () => { setTimeout(() => { iframe.contentWindow.print(); }, 500); iframe.contentWindow.onafterprint = () => { document.body.removeChild(iframe); URL.revokeObjectURL(url); }; }; } },
                { icon: Mail, label: d.resendEmail, action: handleSend },
              ].map((m, i) => (
                <button key={i} onClick={() => { m.action(); setMenuOpen(false); }}
                  style={{ display:"flex", alignItems:"center", gap:8, width:"100%", padding:"10px 14px",
                    background:"none", border:"none", fontSize:13, color: G.text, cursor:"pointer",
                    fontFamily: G.font, transition:"background 0.1s", textAlign:"left" }}
                  onMouseEnter={e => e.currentTarget.style.background = G.surface}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <m.icon size={14} color={G.dim}/> {m.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 340px", gap:20, alignItems:"start" }}>
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          {/* From / To */}
          <div style={{ background: G.card, border:`1px solid ${G.borderLt}`, borderRadius: G.radius, padding:20, boxShadow: G.shadow, display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
            <div>
              <div style={{ fontSize:10, fontWeight:700, color: G.dim, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:8 }}>FROM</div>
              {companyProfile?.logo && (
                <img src={companyProfile.logo} alt="Logo" style={{ width:48, height:48, objectFit:"contain", borderRadius:6, marginBottom:6 }}/>
              )}
              <div style={{ fontSize:14, fontWeight:700, color: G.text }}>{companyProfile?.name || "Your Company"}</div>
              <div style={{ fontSize:12, color: G.textSec, lineHeight:1.6, marginTop:4 }}>
                {companyProfile?.address && <div>{companyProfile.address}</div>}
                {(companyProfile?.city || companyProfile?.state || companyProfile?.zip) && (
                  <div>{[companyProfile.city, companyProfile.state, companyProfile.zip].filter(Boolean).join(", ")}</div>
                )}
                {companyProfile?.phone && <div>{companyProfile.phone}</div>}
                {companyProfile?.email && <div>{companyProfile.email}</div>}
                {companyProfile?.ein && <div>EIN: {companyProfile.ein}</div>}
              </div>
            </div>
            <div>
              <div style={{ fontSize:10, fontWeight:700, color: G.dim, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:8 }}>BILL TO</div>
              {cust ? (
                <>
                  <div style={{ fontSize:14, fontWeight:700, color: G.text }}>{cust.name}</div>
                  <div style={{ fontSize:12, color: G.textSec, lineHeight:1.6, marginTop:4 }}>
                    {cust.address && <div>{cust.address}</div>}
                    {cust.phone && <div>{cust.phone}</div>}
                    {cust.email && <div>{cust.email}</div>}
                    {cust.paymentMethod && (
                      <div style={{ marginTop:4, paddingTop:4, borderTop:`1px dashed ${G.borderLt}`, fontWeight:600, color:G.text }}>
                        Payment: {{ zelle:"Zelle", card:"Credit Card", cash:"Cash", ach:"ACH Transfer" }[cust.paymentMethod] || cust.paymentMethod}
                      </div>
                    )}
                  </div>
                </>
              ) : <div style={{ fontSize:13, color: G.dim }}>No customer selected</div>}
            </div>
          </div>

          {/* Line items */}
          <div style={{ background: G.card, border:`1px solid ${G.borderLt}`, borderRadius: G.radius, boxShadow: G.shadow, overflow:"hidden" }}>
            <div style={{ padding:"14px 18px", borderBottom:`1px solid ${G.border}` }}>
              <span style={{ fontSize:13, fontWeight:700, color: G.text, display:"flex", alignItems:"center", gap:6 }}>
                <Leaf size={14} color={G.green}/> Services & Items
              </span>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"3fr 80px 100px 100px", padding:"10px 18px", background: G.surface, borderBottom:`1px solid ${G.border}` }}>
              {["Description", "Qty", "Rate", "Total"].map((h,i) => (
                <span key={i} style={{ fontSize:10, fontWeight:700, color: G.dim, textTransform:"uppercase", letterSpacing:"0.06em", textAlign: i > 0 ? "right" : "left" }}>{h}</span>
              ))}
            </div>
            {(invoice.items || []).map((item, idx) => (
              <div key={idx} style={{ display:"grid", gridTemplateColumns:"3fr 80px 100px 100px", padding:"12px 18px",
                borderBottom: idx < invoice.items.length - 1 ? `1px solid ${G.borderLt}` : "none", alignItems:"center" }}>
                <span style={{ fontSize:13, color: G.text }}>{item.name || item.nameEs || "—"}</span>
                <span style={{ fontSize:13, color: G.textSec, textAlign:"right" }}>{item.qty}</span>
                <span style={{ fontSize:13, color: G.textSec, textAlign:"right" }}>{fmt(item.price)}</span>
                <span style={{ fontSize:13, fontWeight:700, color: G.text, textAlign:"right" }}>{fmt((item.qty || 0) * (item.price || 0))}</span>
              </div>
            ))}
            <div style={{ borderTop:`2px solid ${G.border}`, padding:"14px 18px", display:"flex", flexDirection:"column", gap:6, alignItems:"flex-end" }}>
              <div style={{ display:"grid", gridTemplateColumns:"120px 100px", gap:4 }}>
                <span style={{ fontSize:12, color: G.dim, textAlign:"right" }}>Subtotal</span>
                <span style={{ fontSize:13, fontWeight:600, color: G.text, textAlign:"right" }}>{fmt(invoice.subtotal)}</span>
              </div>
              {(invoice.discountAmt || 0) > 0 && (
                <div style={{ display:"grid", gridTemplateColumns:"120px 100px", gap:4 }}>
                  <span style={{ fontSize:12, color: G.dim, textAlign:"right" }}>Discount</span>
                  <span style={{ fontSize:13, fontWeight:600, color: G.danger, textAlign:"right" }}>−{fmt(invoice.discountAmt)}</span>
                </div>
              )}
              <div style={{ display:"grid", gridTemplateColumns:"120px 100px", gap:4 }}>
                <span style={{ fontSize:12, color: G.dim, textAlign:"right" }}>Tax ({taxRate}%)</span>
                <span style={{ fontSize:13, fontWeight:600, color: G.text, textAlign:"right" }}>{fmt(invoice.taxAmount)}</span>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"120px 100px", gap:4, paddingTop:8, borderTop:`1px solid ${G.border}` }}>
                <span style={{ fontSize:14, fontWeight:800, color: G.text, textAlign:"right", fontFamily: G.fontDisplay }}>Total</span>
                <span style={{ fontSize:18, fontWeight:800, color: G.green, textAlign:"right", fontFamily: G.fontDisplay }}>{fmt(invoice.total)}</span>
              </div>
            </div>
          </div>

          {invoice.notes && (
            <div style={{ background: G.card, border:`1px solid ${G.borderLt}`, borderRadius: G.radius, padding:"16px 18px", boxShadow: G.shadow }}>
              <div style={{ fontSize:11, fontWeight:700, color: G.dim, textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:6 }}>Notes</div>
              <div style={{ fontSize:13, color: G.textSec, lineHeight:1.6, whiteSpace:"pre-line" }}>{invoice.notes}</div>
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div style={{ display:"flex", flexDirection:"column", gap:12, position:"sticky", top:20 }}>
          <div style={{ background:`linear-gradient(135deg, ${G.green}, #22C55E)`, borderRadius: G.radius, padding:20, color:"#FFF" }}>
            <div style={{ fontSize:11, fontWeight:600, opacity:0.8, textTransform:"uppercase", letterSpacing:"0.05em" }}>AMOUNT DUE</div>
            <div style={{ fontSize:28, fontWeight:800, fontFamily: G.fontDisplay, marginTop:4 }}>{fmt(invoice.status === "paid" ? 0 : invoice.total)}</div>
            {invoice.status === "paid" && (
              <div style={{ display:"flex", alignItems:"center", gap:4, marginTop:8, fontSize:12, fontWeight:600 }}>
                <Check size={14}/> Paid in full
              </div>
            )}
          </div>

          <div style={{ background: G.card, border:`1px solid ${G.borderLt}`, borderRadius: G.radius, padding:"16px 18px", boxShadow: G.shadow }}>
            <div style={{ fontSize:11, fontWeight:700, color: G.dim, textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:12 }}>TIMELINE</div>
            {[
              { label: "Created", date: invoice.date, done: true },
              { label: "Sent",    date: invoice.sentDate,    done: !!invoice.sentDate },
              { label: "Due",     date: invoice.dueDate,   done: invoice.status === "paid" },
              { label: "Paid",    date: invoice.paidDate,    done: invoice.status === "paid" },
            ].map((step, i) => (
              <div key={i} style={{ display:"flex", gap:12, paddingBottom: i < 3 ? 14 : 0, position:"relative" }}>
                {i < 3 && <div style={{ position:"absolute", left:7, top:18, width:2, height:"calc(100% - 4px)", background: step.done ? `${G.green}30` : G.borderLt }}/>}
                <div style={{ width:16, height:16, borderRadius:"50%", flexShrink:0, marginTop:1,
                  background: step.done ? G.green : G.surface, border: step.done ? "none" : `2px solid ${G.border}`,
                  display:"flex", alignItems:"center", justifyContent:"center" }}>
                  {step.done && <Check size={10} color="#FFF" strokeWidth={3}/>}
                </div>
                <div>
                  <div style={{ fontSize:12, fontWeight:600, color: step.done ? G.text : G.dim }}>{step.label}</div>
                  <div style={{ fontSize:11, color: G.dim, marginTop:1 }}>{step.date ? fmtDate(step.date, "en") : "—"}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ background: G.surface, border:`1px solid ${G.borderLt}`, borderRadius: G.radius, padding:"14px 16px" }}>
            <div style={{ fontSize:11, fontWeight:700, color: G.dim, textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:8 }}>PAYMENT DETAILS</div>
            <div style={{ fontSize:12, color: G.textSec, lineHeight:1.7 }}>
              <div><strong>Invoice #:</strong> {invoice.invoiceNumber || invoice.id}</div>
              <div><strong>Tax Rate:</strong> {taxRate}%</div>
              {invoice.dueDate && <div><strong>Due Date:</strong> {fmtDate(invoice.dueDate, "en")}</div>}
              {cust?.paymentMethod && <div><strong>Payment:</strong> {{ zelle:"Zelle", card:"Credit Card", cash:"Cash", ach:"ACH Transfer" }[cust.paymentMethod] || cust.paymentMethod}</div>}
              
            </div>
          </div>
        </div>
      </div>

      {/* ── Payment Toast ── */}
      {payToast && (
        <div style={{ position:"fixed", bottom:24, right:24, padding:"12px 20px", borderRadius:8,
          background: G.green, color:"#FFF", fontSize:13, fontWeight:600,
          fontFamily: G.font, boxShadow:"0 8px 24px rgba(0,0,0,0.2)", display:"flex", alignItems:"center", gap:8, zIndex:300,
          animation:"slideUp 0.3s ease" }}>
          <CheckCircle size={16}/> {payToast}
        </div>
      )}

      {/* ── Mark Paid Modal ── */}
      {showPayModal && (
        <div onClick={() => setShowPayModal(false)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", backdropFilter:"blur(4px)" }}>
          <div onClick={e => e.stopPropagation()} style={{ width:"100%", maxWidth:420, background: G.card, borderRadius:16, border:`1px solid ${G.border}`, boxShadow:"0 24px 64px rgba(0,0,0,0.25)", overflow:"hidden", fontFamily: G.font }}>
            {/* Header */}
            <div style={{ padding:"18px 24px 14px", borderBottom:`1px solid ${G.borderLt}`, display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ width:36, height:36, borderRadius:10, background:`${G.green}12`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                <CheckCircle size={18} color={G.green}/>
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:16, fontWeight:800, color: G.text }}>{L("Confirm Payment", "Confirmar Pago")}</div>
                <div style={{ fontSize:11, color: G.dim }}>{invoice.invoiceNumber} · {cust?.name || ""}</div>
              </div>
              <button onClick={() => setShowPayModal(false)} style={{ background:"none", border:"none", cursor:"pointer", padding:4 }}>
                <X size={16} color={G.dim}/>
              </button>
            </div>

            {/* Body */}
            <div style={{ padding:"18px 24px", display:"flex", flexDirection:"column", gap:16 }}>
              {/* Total highlight */}
              <div style={{ background:`${G.green}08`, border:`1px solid ${G.green}25`, borderRadius:12, padding:"16px 18px", textAlign:"center" }}>
                <div style={{ fontSize:11, fontWeight:700, color: G.dim, textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:4 }}>{L("Amount Due", "Monto a Pagar")}</div>
                <div style={{ fontSize:32, fontWeight:800, color: G.green, fontFamily: G.fontDisplay }}>${(invoice.total || 0).toFixed(2)}</div>
              </div>

              {/* Payment Method */}
              <div>
                <label style={{ fontSize:10, fontWeight:600, color: G.dim, textTransform:"uppercase", letterSpacing:"0.04em", display:"block", marginBottom:6 }}>{L("Payment Method", "Método de Pago")}</label>
                <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                  {payMethods.map(pm => {
                    const sel = payForm.paymentMethod === pm.key;
                    return (
                      <div key={pm.key} onClick={() => setPayForm(p => ({ ...p, paymentMethod: pm.key }))}
                        style={{ padding:"8px 14px", borderRadius:8, cursor:"pointer", fontSize:12, fontWeight:sel ? 700 : 500,
                          border:`2px solid ${sel ? G.green : G.border}`,
                          background: sel ? `${G.green}10` : "transparent",
                          color: sel ? G.green : G.textSec, display:"flex", alignItems:"center", gap:5, transition:"all 0.15s" }}>
                        <span style={{ fontSize:14 }}>{pm.icon}</span> {pm.label}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Payment Date */}
              <div style={{ display:"flex", gap:12 }}>
                <div style={{ flex:1 }}>
                  <label style={{ fontSize:10, fontWeight:600, color: G.dim, textTransform:"uppercase", letterSpacing:"0.04em", display:"block", marginBottom:4 }}>{L("Payment Date", "Fecha de Pago")}</label>
                  <input type="date" value={payForm.paidDate} onChange={e => setPayForm(p => ({ ...p, paidDate: e.target.value }))}
                    style={{ width:"100%", padding:"9px 12px", borderRadius:8, border:`1px solid ${G.border}`, background: G.surface, color: G.text, fontSize:12, outline:"none", fontFamily: G.font, boxSizing:"border-box" }}/>
                </div>
                <div style={{ flex:1 }}>
                  <label style={{ fontSize:10, fontWeight:600, color: G.dim, textTransform:"uppercase", letterSpacing:"0.04em", display:"block", marginBottom:4 }}>{L("Amount Received", "Monto Recibido")}</label>
                  <div style={{ position:"relative" }}>
                    <span style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", fontSize:13, fontWeight:700, color: G.dim }}>$</span>
                    <input value={payForm.amount} onChange={e => setPayForm(p => ({ ...p, amount: e.target.value }))}
                      style={{ width:"100%", padding:"9px 12px 9px 22px", borderRadius:8, border:`1px solid ${G.border}`, background: G.surface, color: G.text, fontSize:12, fontWeight:700, outline:"none", fontFamily: G.font, boxSizing:"border-box" }}/>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label style={{ fontSize:10, fontWeight:600, color: G.dim, textTransform:"uppercase", letterSpacing:"0.04em", display:"block", marginBottom:4 }}>{L("Notes (optional)", "Notas (opcional)")}</label>
                <input value={payForm.notes} onChange={e => setPayForm(p => ({ ...p, notes: e.target.value }))}
                  placeholder={L("e.g. Zelle confirmation #1234", "ej. Confirmación Zelle #1234")}
                  style={{ width:"100%", padding:"9px 12px", borderRadius:8, border:`1px solid ${G.border}`, background: G.surface, color: G.text, fontSize:12, outline:"none", fontFamily: G.font, boxSizing:"border-box" }}/>
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding:"14px 24px 18px", borderTop:`1px solid ${G.borderLt}`, display:"flex", gap:10, justifyContent:"flex-end" }}>
              <button onClick={() => setShowPayModal(false)}
                style={{ padding:"10px 18px", borderRadius:8, border:`1px solid ${G.border}`, background:"transparent", color: G.textSec, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily: G.font }}>
                {L("Cancel", "Cancelar")}
              </button>
              <button onClick={confirmPay} disabled={payLoading}
                style={{ padding:"10px 22px", borderRadius:8, border:"none", background: G.green, color:"#FFF", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily: G.font, display:"flex", alignItems:"center", gap:6, opacity: payLoading ? 0.7 : 1 }}>
                <CheckCircle size={14}/> {payLoading ? L("Saving...", "Guardando...") : L("Confirm Payment", "Confirmar Pago")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════
   MAIN EXPORT
   ═════════════════════════════════════════════════════════════ */
export default function Invoicing({ dark, v, t, lang }) {
  const { invoices, clients, services, addInvoice, updateInvoice, companyProfile } = useData();
  const d = t.inv;

  const [view, setView] = useState("list");
  const [selected, setSelected] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleNew = () => { setSelected(null); setView("create"); };
  const handleView = (inv) => { setSelected(inv); setView("detail"); };
  const handleEdit = (inv) => { setSelected(inv); setView("edit"); };
  const handleBack = () => { setView("list"); setSelected(null); };

  const handleSave = (invoiceData) => {
    if (view === "edit" && selected?.id) {
      if (updateInvoice) updateInvoice(selected.id, invoiceData);
      showToast(lang === "es" ? "Factura actualizada" : "Invoice updated");
    } else {
      if (addInvoice) addInvoice({ ...invoiceData, id: invoiceData.id || Date.now().toString() });
      showToast(
        invoiceData.status === "sent"
          ? (lang === "es" ? "Factura creada y enviada" : "Invoice created & sent")
          : (lang === "es" ? "Borrador guardado" : "Draft saved")
      );
    }
    setView("list");
    setSelected(null);
  };

  return (
    <div style={{ fontFamily: G.font, color: G.text }}>
      {view === "list" && <InvoiceList invoices={invoices} clients={clients} onNew={handleNew} onView={handleView} d={d} lang={lang}/>}
      {(view === "create" || view === "edit") && (
        <InvoiceForm onCancel={handleBack} onSave={handleSave} clients={clients} services={services} editInvoice={view === "edit" ? selected : null} d={d} lang={lang}/>
      )}
      {view === "detail" && <InvoiceDetail invoice={selected} clients={clients} onBack={handleBack} onEdit={handleEdit} d={d} lang={lang} companyProfile={companyProfile}/>}

      {toast && (
        <div style={{ position:"fixed", bottom:24, right:24, padding:"12px 20px", borderRadius: G.radiusSm,
          background: toast.type === "success" ? G.green : G.danger, color:"#FFF", fontSize:13, fontWeight:600,
          fontFamily: G.font, boxShadow: G.shadowLg, display:"flex", alignItems:"center", gap:8, zIndex:100,
          animation:"slideUp 0.3s ease" }}>
          <CheckCircle size={16}/> {toast.msg}
        </div>
      )}
      <style>{`@keyframes slideUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </div>
  );
}
