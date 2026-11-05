import { useState, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { FileText, Search, CheckCircle, Clock, AlertTriangle, DollarSign, ExternalLink, Download, Printer, ChevronLeft, Leaf, Eye } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/* ═══════════════════════════════════════════════════════════════
   CLIENT INVOICES — List + Detail with PDF/Print
   ═══════════════════════════════════════════════════════════════ */

const fmtDate = (d, lang) => d ? new Date(d + "T12:00").toLocaleDateString(lang === "es" ? "es-EC" : "en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";
const fmtMoney = (n) => "$" + (n || 0).toFixed(2);

const statusConfig = (status, lang) => {
  const L = (en, es) => lang === "es" ? es : en;
  return {
    draft: { label: L("Draft", "Borrador"), color: "#94A3B8", bg: "#F1F5F9", icon: FileText },
    sent: { label: L("Pending", "Pendiente"), color: "#0891B2", bg: "#ECFEFF", icon: Clock },
    paid: { label: L("Paid", "Pagada"), color: "#16A34A", bg: "#DCFCE7", icon: CheckCircle },
    overdue: { label: L("Overdue", "Vencida"), color: "#DC2626", bg: "#FEE2E2", icon: AlertTriangle },
    partial: { label: L("Partial", "Parcial"), color: "#D97706", bg: "#FEF3C7", icon: DollarSign },
  }[status] || { label: status, color: "#94A3B8", bg: "#F1F5F9", icon: FileText };
};

const generateInvoicePDFDoc = (invoice, client, companyProfile) => {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const W = doc.internal.pageSize.getWidth();
  const margin = 50;
  const rightCol = W - margin;
  let y = 50;
  const green = [22, 163, 74];
  const dark = [15, 26, 20];
  const gray = [122, 143, 130];
  const lightBg = [247, 249, 248];

  if (companyProfile?.logo) {
    try { doc.addImage(companyProfile.logo, "PNG", margin, y, 60, 60); y += 70; } catch (e) { y += 10; }
  }
  doc.setFont("helvetica", "bold"); doc.setFontSize(18); doc.setTextColor(...dark);
  doc.text(companyProfile?.name || "Your Company", margin, y); y += 18;
  doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(...gray);
  if (companyProfile?.address) { doc.text(companyProfile.address, margin, y); y += 12; }
  if (companyProfile?.city || companyProfile?.state || companyProfile?.zip) {
    doc.text([companyProfile.city, companyProfile.state, companyProfile.zip].filter(Boolean).join(", "), margin, y); y += 12;
  }
  if (companyProfile?.phone) { doc.text(companyProfile.phone, margin, y); y += 12; }
  if (companyProfile?.email) { doc.text(companyProfile.email, margin, y); y += 12; }
  if (companyProfile?.ein) { doc.text("EIN: " + companyProfile.ein, margin, y); y += 12; }

  doc.setFont("helvetica", "bold"); doc.setFontSize(28); doc.setTextColor(...green);
  doc.text("INVOICE", rightCol, 65, { align: "right" });
  doc.setFontSize(11); doc.setTextColor(...dark);
  doc.text(invoice.invoiceNumber || invoice.id || "", rightCol, 82, { align: "right" });

  doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(...gray);
  let metaY = 100;
  const metaLabel = (label, value) => {
    doc.setFont("helvetica", "bold"); doc.setTextColor(...gray);
    doc.text(label + ":", rightCol - 120, metaY);
    doc.setFont("helvetica", "normal"); doc.setTextColor(...dark);
    doc.text(value, rightCol, metaY, { align: "right" }); metaY += 14;
  };
  metaLabel("Date", invoice.date ? new Date(invoice.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "");
  metaLabel("Due Date", invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "");
  const statusText = (invoice.status || "draft").charAt(0).toUpperCase() + (invoice.status || "draft").slice(1);
  const statusColors = { paid: [22, 163, 74], overdue: [220, 38, 38], sent: [8, 145, 178], draft: [122, 143, 130], partial: [217, 119, 6] };
  const statusColor = statusColors[invoice.status] || gray;
  doc.setFont("helvetica", "bold"); doc.setTextColor(...gray);
  doc.text("Status:", rightCol - 120, metaY);
  doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(...statusColor);
  doc.text(statusText, rightCol, metaY, { align: "right" }); doc.setFontSize(9); metaY += 14;
  if (client?.paymentMethod) {
    const pm = { zelle: "Zelle", card: "Credit Card", cash: "Cash", ach: "ACH Transfer" };
    metaLabel("Payment", pm[client.paymentMethod] || client.paymentMethod);
  }

  y = Math.max(y, metaY) + 20;
  doc.setDrawColor(226, 232, 228); doc.setLineWidth(1); doc.line(margin, y, rightCol, y); y += 20;

  doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(...gray);
  doc.text("BILL TO", margin, y); y += 14;
  doc.setFontSize(12); doc.setTextColor(...dark);
  doc.text(client?.name || "—", margin, y); y += 14;
  doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(...gray);
  if (client?.address) { doc.text(client.address, margin, y); y += 12; }
  if (client?.phone) { doc.text(client.phone, margin, y); y += 12; }
  if (client?.email) { doc.text(client.email, margin, y); y += 12; }
  y += 16;

  const items = (invoice.items || []).map(item => {
    const qty = item.qty || 1; const price = item.price || 0;
    return [item.name || "—", qty.toString(), "$" + price.toFixed(2), "$" + (qty * price).toFixed(2)];
  });
  autoTable(doc, {
    startY: y, head: [["Description", "Qty", "Rate", "Total"]], body: items,
    margin: { left: margin, right: margin },
    styles: { font: "helvetica", fontSize: 9, cellPadding: 8, textColor: dark, lineColor: [226, 232, 228], lineWidth: 0.5 },
    headStyles: { fillColor: lightBg, textColor: gray, fontStyle: "bold", fontSize: 8, halign: "left" },
    columnStyles: { 0: { cellWidth: "auto", halign: "left" }, 1: { cellWidth: 50, halign: "center" }, 2: { cellWidth: 70, halign: "right" }, 3: { cellWidth: 80, halign: "right", fontStyle: "bold" } },
    alternateRowStyles: { fillColor: [255, 255, 255] }, theme: "grid",
  });
  y = doc.lastAutoTable.finalY + 20;

  const totalsX = rightCol - 180; const totalsValX = rightCol;
  const subtotal = invoice.subtotal || 0;
  const total = invoice.total || 0;
  doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(...gray);
  doc.text("Subtotal", totalsX, y); doc.setTextColor(...dark);
  doc.text("$" + subtotal.toFixed(2), totalsValX, y, { align: "right" }); y += 16;
  if (invoice.discountAmt && invoice.discountAmt > 0) {
    doc.setTextColor(...gray); doc.text("Discount", totalsX, y);
    doc.setTextColor(220, 38, 38); doc.text("-$" + invoice.discountAmt.toFixed(2), totalsValX, y, { align: "right" }); y += 16;
  }
  y += 6;
  doc.setDrawColor(226, 232, 228); doc.line(totalsX, y, rightCol, y); y += 16;
  doc.setFont("helvetica", "bold"); doc.setFontSize(14); doc.setTextColor(...green);
  doc.text("Total", totalsX, y); doc.text("$" + total.toFixed(2), totalsValX, y, { align: "right" }); y += 30;

  if (invoice.notes) {
    doc.setDrawColor(226, 232, 228); doc.line(margin, y, rightCol, y); y += 16;
    doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(...gray);
    doc.text("NOTES", margin, y); y += 14;
    doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(...dark);
    const noteLines = doc.splitTextToSize(invoice.notes, rightCol - margin);
    doc.text(noteLines, margin, y);
  }

  y = doc.internal.pageSize.getHeight() - 40;
  doc.setDrawColor(226, 232, 228); doc.line(margin, y, rightCol, y); y += 14;
  doc.setFont("helvetica", "normal"); doc.setFontSize(7); doc.setTextColor(...gray);
  doc.text("Thank you for your business!", margin, y);
  doc.text("Generated by Cleo Yards", rightCol, y, { align: "right" });
  return doc;
};

function generatePDF(inv, client, company) {
  const doc = generateInvoicePDFDoc(inv, client, company);
  doc.save((inv.invoiceNumber || inv.id) + ".pdf");
}

function printInvoice(inv, client, company) {
  const doc = generateInvoicePDFDoc(inv, client, company);
  const blob = doc.output("blob");
  const url = URL.createObjectURL(blob);
  const iframe = document.createElement("iframe");
  iframe.style.display = "none"; iframe.src = url;
  document.body.appendChild(iframe);
  iframe.onload = () => { setTimeout(() => { iframe.contentWindow.print(); }, 500); };
}


export default function ClientInvoices() {
  const { dark, v, lang, invoices, clientData, company } = useOutletContext();
  const L = (en, es) => lang === "es" ? es : en;
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  const stats = useMemo(() => ({
    total: invoices.length,
    unpaid: invoices.filter(i => ["sent", "overdue"].includes(i.status)).reduce((s, i) => s + (i.total || 0), 0),
    paid: invoices.filter(i => i.status === "paid").reduce((s, i) => s + (i.total || 0), 0),
    overdue: invoices.filter(i => i.status === "overdue").length,
  }), [invoices]);

  const filtered = useMemo(() => {
    let list = invoices;
    if (filter === "sent") list = list.filter(i => ["sent", "overdue"].includes(i.status));
    else if (filter !== "all") list = list.filter(i => i.status === filter);
    if (search) list = list.filter(i => (i.invoiceNumber || "").toLowerCase().includes(search.toLowerCase()));
    return list;
  }, [invoices, filter, search]);

  const filters = [
    { key: "all", label: L("All", "Todas") },
    { key: "sent", label: L("Pending", "Pendientes") },
    { key: "paid", label: L("Paid", "Pagadas") },
    { key: "overdue", label: L("Overdue", "Vencidas") },
  ];

  const G = "#16A34A";

  // ── DETAIL VIEW
  if (selected) {
    const inv = selected;
    const st = statusConfig(inv.status, lang);
    const isPayable = ["sent", "overdue"].includes(inv.status);

    return (
      <div>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
          <button onClick={() => setSelected(null)} style={{ width: 36, height: 36, borderRadius: 8, border: "1px solid " + v.border, background: v.cardBg, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ChevronLeft size={16} color={v.textSec}/>
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <h1 style={{ fontSize: 20, fontWeight: 800, color: v.text, fontFamily: "'Outfit', sans-serif", margin: 0 }}>{inv.invoiceNumber}</h1>
              <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 4, background: st.bg, color: st.color }}>{st.label}</span>
            </div>
            <p style={{ fontSize: 12, color: v.textSec, margin: "2px 0 0" }}>{fmtDate(inv.date, lang)}{inv.dueDate ? " · " + L("Due", "Vence") + " " + fmtDate(inv.dueDate, lang) : ""}</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {isPayable && (
              <button onClick={() => window.open("/pay/" + inv.id, "_blank")}
                style={{ padding: "9px 18px", borderRadius: 8, border: "none", background: G, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
                <ExternalLink size={13}/> {L("Pay Now", "Pagar Ahora")}
              </button>
            )}
            <button onClick={() => generatePDF(inv, clientData, company)}
              style={{ padding: "9px 14px", borderRadius: 8, border: "1px solid " + v.border, background: v.cardBg, color: v.text, fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
              <Download size={13}/> PDF
            </button>
            <button onClick={() => printInvoice(inv, clientData, company)}
              style={{ padding: "9px 14px", borderRadius: 8, border: "1px solid " + v.border, background: v.cardBg, color: v.text, fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
              <Printer size={13}/> {L("Print", "Imprimir")}
            </button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 20, alignItems: "start" }}>
          {/* Invoice card */}
          <div style={{ background: v.cardBg, border: "1px solid " + v.border, borderRadius: 12, overflow: "hidden" }}>
            {/* From / To */}
            <div style={{ padding: 20, borderBottom: "1px solid " + v.border, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: v.textTer, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>FROM</div>
                {company?.logo && <img src={company.logo} alt="" style={{ width: 64, height: 64, objectFit: "contain", borderRadius: 8, marginBottom: 6, border: "1px solid " + v.border + "50" }}/>}
                <div style={{ fontSize: 14, fontWeight: 700, color: v.text }}>{company?.name || ""}</div>
                <div style={{ fontSize: 11, color: v.textSec, lineHeight: 1.6, marginTop: 2 }}>
                  {company?.address && <div>{company.address}</div>}
                  {company?.phone && <div>{company.phone}</div>}
                  {company?.email && <div>{company.email}</div>}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: v.textTer, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>BILL TO</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: v.text }}>{clientData?.name || ""}</div>
                <div style={{ fontSize: 11, color: v.textSec, lineHeight: 1.6, marginTop: 2 }}>
                  {clientData?.address && <div>{clientData.address}</div>}
                  {clientData?.phone && <div>{clientData.phone}</div>}
                  {clientData?.email && <div>{clientData.email}</div>}
                </div>
              </div>
            </div>

            {/* Items table */}
            <div style={{ padding: "0 20px" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid " + v.border }}>
                    <th style={{ textAlign: "left", padding: "12px 0", fontSize: 10, fontWeight: 700, color: v.textTer, textTransform: "uppercase" }}>Service</th>
                    <th style={{ textAlign: "center", padding: "12px 0", fontSize: 10, fontWeight: 700, color: v.textTer, textTransform: "uppercase", width: 50 }}>Qty</th>
                    <th style={{ textAlign: "right", padding: "12px 0", fontSize: 10, fontWeight: 700, color: v.textTer, textTransform: "uppercase", width: 80 }}>Price</th>
                    <th style={{ textAlign: "right", padding: "12px 0", fontSize: 10, fontWeight: 700, color: v.textTer, textTransform: "uppercase", width: 80 }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(inv.items || []).map((item, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid " + v.border + "40" }}>
                      <td style={{ padding: "10px 0", fontSize: 13, color: v.text, fontWeight: 500 }}>{item.name}</td>
                      <td style={{ textAlign: "center", fontSize: 12, color: v.textSec }}>{item.qty || 1}</td>
                      <td style={{ textAlign: "right", fontSize: 12, color: v.textSec }}>{fmtMoney(item.price)}</td>
                      <td style={{ textAlign: "right", fontSize: 13, fontWeight: 600, color: v.text }}>{fmtMoney((item.qty || 1) * (item.price || 0))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div style={{ padding: "14px 20px 18px", borderTop: "1px solid " + v.border }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                <div style={{ display: "flex", justifyContent: "space-between", width: 200, fontSize: 12, color: v.textSec }}>
                  <span>Subtotal</span><span>{fmtMoney(inv.subtotal)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", width: 200, fontSize: 16, fontWeight: 800, color: v.text, borderTop: "2px solid " + v.text, paddingTop: 8, marginTop: 4 }}>
                  <span>Total</span><span>{fmtMoney(inv.total)}</span>
                </div>
              </div>
            </div>

            {inv.notes && (
              <div style={{ padding: "14px 20px 18px", borderTop: "1px solid " + v.border }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: v.textTer, textTransform: "uppercase", marginBottom: 4 }}>NOTES</div>
                <div style={{ fontSize: 12, color: v.textSec }}>{inv.notes}</div>
              </div>
            )}
          </div>

          {/* Right sidebar */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Amount box */}
            <div style={{ background: inv.status === "paid" ? G : (inv.status === "overdue" ? "#DC2626" : G), borderRadius: 12, padding: "18px 20px", color: "#fff" }}>
              <div style={{ fontSize: 10, fontWeight: 700, opacity: 0.7, textTransform: "uppercase", letterSpacing: "0.06em" }}>{inv.status === "paid" ? L("PAID", "PAGADA") : L("AMOUNT DUE", "MONTO A PAGAR")}</div>
              <div style={{ fontSize: 28, fontWeight: 800, fontFamily: "'Outfit', sans-serif" }}>{fmtMoney(inv.status === "paid" ? 0 : inv.total)}</div>
              {inv.status === "paid" && <div style={{ fontSize: 11, marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}><CheckCircle size={13}/> {L("Paid in full", "Pagada")}</div>}
            </div>

            {/* Pay button */}
            {isPayable && (
              <button onClick={() => window.open("/pay/" + inv.id, "_blank")}
                style={{ width: "100%", padding: "14px", borderRadius: 10, border: "none", background: G, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <ExternalLink size={16}/> {L("Pay Now", "Pagar Ahora")} — {fmtMoney(inv.total)}
              </button>
            )}

            {/* Payment details */}
            <div style={{ background: v.cardBg, border: "1px solid " + v.border, borderRadius: 12, padding: "14px 16px" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: v.textTer, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>{L("DETAILS", "DETALLES")}</div>
              <div style={{ fontSize: 12, color: v.textSec, lineHeight: 1.8 }}>
                <div><strong>{L("Invoice", "Factura")}:</strong> {inv.invoiceNumber}</div>
                <div><strong>{L("Date", "Fecha")}:</strong> {fmtDate(inv.date, lang)}</div>
                {inv.dueDate && <div><strong>{L("Due", "Vence")}:</strong> {fmtDate(inv.dueDate, lang)}</div>}
                {inv.paidDate && <div><strong>{L("Paid", "Pagada")}:</strong> {fmtDate(inv.paidDate, lang)}</div>}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── LIST VIEW
  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: v.text, fontFamily: "'Outfit', sans-serif", margin: 0 }}>{L("My Invoices", "Mis Facturas")}</h1>
      <p style={{ fontSize: 13, color: v.textSec, margin: "2px 0 20px" }}>{L("View and pay your invoices", "Ver y pagar tus facturas")}</p>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 20 }}>
        {[
          { label: L("Outstanding", "Pendiente"), value: fmtMoney(stats.unpaid), color: "#F59E0B", icon: Clock },
          { label: L("Total Paid", "Total Pagado"), value: fmtMoney(stats.paid), color: G, icon: CheckCircle },
          { label: L("Overdue", "Vencidas"), value: String(stats.overdue), color: "#DC2626", icon: AlertTriangle },
          { label: L("Total Invoices", "Total Facturas"), value: String(stats.total), color: "#3B82F6", icon: FileText },
        ].map((c, i) => (
          <div key={i} style={{ padding: "12px 16px", borderRadius: 10, background: v.cardBg, border: "1px solid " + v.border }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: v.textSec, textTransform: "uppercase", letterSpacing: "0.04em" }}>{c.label}</span>
              <c.icon size={13} color={c.color}/>
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: v.text, fontFamily: "'Outfit', sans-serif" }}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* Filters + Search */}
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
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={L("Search...", "Buscar...")}
            style={{ width: "100%", padding: "8px 12px 8px 32px", borderRadius: 8, border: "1px solid " + v.border, background: dark ? "rgba(255,255,255,0.04)" : v.surface, color: v.text, fontSize: 12, outline: "none", fontFamily: "'DM Sans'" }}/>
        </div>
      </div>

      {/* Invoice list */}
      <div style={{ background: v.cardBg, border: "1px solid " + v.border, borderRadius: 12, overflow: "hidden" }}>
        {filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center" }}>
            <FileText size={32} color={v.textTer}/>
            <p style={{ fontSize: 14, fontWeight: 600, color: v.text, marginTop: 12 }}>{L("No invoices found", "Sin facturas")}</p>
          </div>
        ) : filtered.map((inv, i) => {
          const st = statusConfig(inv.status, lang);
          const isPayable = ["sent", "overdue"].includes(inv.status);
          return (
            <div key={inv.id} onClick={() => setSelected(inv)} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", borderBottom: i < filtered.length - 1 ? "1px solid " + v.border + "40" : "none", cursor: "pointer", transition: "background 0.1s" }}
              onMouseEnter={e => e.currentTarget.style.background = dark ? "rgba(255,255,255,0.02)" : "#FAFAFA"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: st.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <st.icon size={16} color={st.color}/>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: v.text }}>{inv.invoiceNumber || "—"}</div>
                <div style={{ fontSize: 11, color: v.textTer }}>{fmtDate(inv.date, lang)}{inv.dueDate ? " · " + L("Due", "Vence") + " " + fmtDate(inv.dueDate, lang) : ""}</div>
              </div>
              <div style={{ textAlign: "right", marginRight: 8 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: v.text }}>{fmtMoney(inv.total)}</div>
                <span style={{ fontSize: 9, fontWeight: 600, padding: "2px 8px", borderRadius: 4, background: st.bg, color: st.color }}>{st.label}</span>
              </div>
              {isPayable && (
                <button onClick={e => { e.stopPropagation(); window.open("/pay/" + inv.id, "_blank"); }}
                  style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: G, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap" }}>
                  {L("Pay", "Pagar")} <ExternalLink size={12}/>
                </button>
              )}
              {inv.status === "paid" && (
                <span style={{ fontSize: 11, fontWeight: 600, color: G, display: "flex", alignItems: "center", gap: 4 }}>
                  <CheckCircle size={13}/>
                </span>
              )}
              <button onClick={e => { e.stopPropagation(); setSelected(inv); }}
                style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid " + v.border, background: v.cardBg, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                title={L("View", "Ver")}>
                <Eye size={14} color={v.textSec}/>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
