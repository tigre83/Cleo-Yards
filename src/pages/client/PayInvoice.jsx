import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { CheckCircle, Upload, Clock, AlertTriangle, Leaf, FileText, X, Loader } from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   PAY INVOICE — Public client-facing payment page
   Route: /pay/:invoiceId (no auth required)
   ═══════════════════════════════════════════════════════════════ */

const G = {
  green: "#16A34A", greenLight: "#4ADE80", greenBg: "#DCFCE7",
  text: "#0F172A", textSec: "#475569", dim: "#94A3B8",
  bg: "#F8FAFC", surface: "#FFFFFF", card: "#FFFFFF",
  border: "#E2E8F0", borderLt: "#F1F5F9",
  danger: "#DC2626", dangerBg: "#FEE2E2",
  font: "'DM Sans', sans-serif", fontDisplay: "'Outfit', sans-serif",
};

const fmtDate = (d) => {
  if (!d) return "";
  const dt = new Date(d + "T12:00");
  return dt.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
};

const toCamel = (obj) => {
  if (!obj || typeof obj !== "object") return obj;
  const n = {};
  Object.entries(obj).forEach(([k, v]) => {
    const ck = k.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    n[ck] = v;
  });
  return n;
};

export default function PayInvoice() {
  const { invoiceId } = useParams();
  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState(null);
  const [items, setItems] = useState([]);
  const [company, setCompany] = useState(null);
  const [client, setClient] = useState(null);
  const [error, setError] = useState(null);

  // Payment flow
  const [uploading, setUploading] = useState(false);
  const [uploadDone, setUploadDone] = useState(false);
  const [proofUrl, setProofUrl] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        // Fetch invoice
        const { data: inv, error: invErr } = await supabase.from("invoices").select("*").eq("id", invoiceId).single();
        if (invErr || !inv) { setError("Invoice not found"); setLoading(false); return; }
        const invC = toCamel(inv);
        setInvoice(invC);

        // Check if already has proof
        if (invC.paymentProofUrl) setProofUrl(invC.paymentProofUrl);

        // Fetch items
        const { data: iiData } = await supabase.from("invoice_items").select("*").eq("invoice_id", invoiceId);
        setItems((iiData || []).map(toCamel));

        // Fetch company (explicit columns including logo)
        const { data: comp, error: compErr } = await supabase.from("companies").select("id,name,email,phone,address,city,state,zip,logo,area_code,phone_number").eq("id", inv.company_id).single();
        if (comp) {
          const compCamel = toCamel(comp);
          setCompany(compCamel);
          if (!compCamel.logo) {
            // Retry fetching just the logo if it wasn't included
            const { data: logoData } = await supabase.from("companies").select("logo").eq("id", inv.company_id).single();
            if (logoData?.logo) setCompany(prev => ({ ...prev, logo: logoData.logo }));
          }
        }

        // Fetch client
        const { data: cl } = await supabase.from("clients").select("*").eq("id", inv.client_id).single();
        if (cl) setClient(toCamel(cl));
      } catch (err) {
        setError("Error loading invoice");
      } finally {
        setLoading(false);
      }
    };
    if (invoiceId) load();
  }, [invoiceId]);

  const handleFile = async (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${invoiceId}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("payment-proofs").upload(path, file, { cacheControl: "3600", upsert: false });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from("payment-proofs").getPublicUrl(path);
      const publicUrl = urlData?.publicUrl;
      if (publicUrl) {
        setProofUrl(publicUrl);
        // Update invoice with proof URL
        await supabase.from("invoices").update({ payment_proof_url: publicUrl }).eq("id", invoiceId);
        setUploadDone(true);
      }
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => { e.preventDefault(); setDragOver(false); const file = e.dataTransfer.files[0]; handleFile(file); };
  const handleDragOver = (e) => { e.preventDefault(); setDragOver(true); };
  const handleDragLeave = () => setDragOver(false);

  // ── Loading
  if (loading) return (
    <div style={{ minHeight: "100vh", background: G.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: G.font }}>
      <div style={{ textAlign: "center" }}>
        <Loader size={28} color={G.green} style={{ animation: "spin 1s linear infinite" }}/>
        <p style={{ marginTop: 12, color: G.dim, fontSize: 13 }}>Loading invoice...</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  // ── Error
  if (error || !invoice) return (
    <div style={{ minHeight: "100vh", background: G.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: G.font }}>
      <div style={{ textAlign: "center", maxWidth: 360, padding: 40 }}>
        <AlertTriangle size={40} color={G.danger}/>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: G.text, marginTop: 16 }}>Invoice Not Found</h2>
        <p style={{ fontSize: 13, color: G.dim, marginTop: 6 }}>This invoice link may be expired or invalid.</p>
      </div>
    </div>
  );

  const isPaid = invoice.status === "paid";
  const isOverdue = invoice.status === "overdue";
  const zellePhone = client?.zellePhone || client?.phone || company?.phone || "";

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(180deg, #F0FDF4 0%, #F8FAFC 30%)", fontFamily: G.font }}>
      {/* Header */}
      <div style={{ background: G.surface, borderBottom: `1px solid ${G.border}`, padding: "16px 0" }}>
        <div style={{ maxWidth: 640, margin: "0 auto", padding: "0 20px", display: "flex", alignItems: "center", gap: 12 }}>
          {company?.logo ? (
            <img src={company.logo} alt="" style={{ width: 72, height: 72, borderRadius: 12, objectFit: "contain", background: "#fff", border: "1px solid #E2E8F0" }}/>
          ) : (
            <div style={{ width: 72, height: 72, borderRadius: 12, background: `linear-gradient(135deg, ${G.green}, ${G.greenLight})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 800, color: "#fff" }}>
              {(company?.name || "C").charAt(0)}
            </div>
          )}
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: G.text }}>{company?.name || "Cleo Yards"}</div>
            <div style={{ fontSize: 13, color: G.dim }}>{company?.email || ""}</div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "24px 20px 60px" }}>
        {/* Status Banner */}
        {isPaid && (
          <div style={{ background: G.greenBg, border: `1px solid ${G.green}30`, borderRadius: 12, padding: "16px 20px", marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
            <CheckCircle size={24} color={G.green}/>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: G.green }}>Payment Received</div>
              <div style={{ fontSize: 12, color: G.textSec }}>Thank you! This invoice has been paid{invoice.paidDate ? ` on ${fmtDate(invoice.paidDate)}` : ""}.</div>
            </div>
          </div>
        )}
        {isOverdue && (
          <div style={{ background: G.dangerBg, border: `1px solid ${G.danger}30`, borderRadius: 12, padding: "16px 20px", marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
            <AlertTriangle size={24} color={G.danger}/>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: G.danger }}>Payment Overdue</div>
              <div style={{ fontSize: 12, color: G.textSec }}>This invoice was due on {fmtDate(invoice.dueDate)}. Please pay as soon as possible.</div>
            </div>
          </div>
        )}
        {uploadDone && !isPaid && (
          <div style={{ background: "#FFFBEB", border: "1px solid #F59E0B30", borderRadius: 12, padding: "16px 20px", marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
            <Clock size={24} color="#F59E0B"/>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#92400E" }}>Payment Proof Submitted</div>
              <div style={{ fontSize: 12, color: G.textSec }}>We've received your screenshot. Your payment will be confirmed shortly.</div>
            </div>
          </div>
        )}

        {/* Invoice Card */}
        <div style={{ background: G.card, border: `1px solid ${G.border}`, borderRadius: 16, overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
          {/* Invoice Header */}
          <div style={{ padding: "24px 24px 18px", borderBottom: `1px solid ${G.borderLt}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: G.dim, textTransform: "uppercase", letterSpacing: "0.06em" }}>INVOICE</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: G.text, fontFamily: G.fontDisplay }}>{invoice.invoiceNumber || "—"}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 11, color: G.dim }}>Date: {fmtDate(invoice.date)}</div>
                {invoice.dueDate && <div style={{ fontSize: 11, color: isOverdue ? G.danger : G.dim, fontWeight: isOverdue ? 700 : 400 }}>Due: {fmtDate(invoice.dueDate)}</div>}
              </div>
            </div>
            <div style={{ marginTop: 14, fontSize: 12, color: G.textSec, lineHeight: 1.6 }}>
              <strong style={{ color: G.text }}>{client?.name || ""}</strong>
              {client?.address && <div>{client.address}</div>}
              {client?.email && <div>{client.email}</div>}
            </div>
          </div>

          {/* Items */}
          <div style={{ padding: "0 24px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${G.border}` }}>
                  <th style={{ textAlign: "left", padding: "12px 0", fontSize: 10, fontWeight: 700, color: G.dim, textTransform: "uppercase", letterSpacing: "0.05em" }}>Service</th>
                  <th style={{ textAlign: "center", padding: "12px 0", fontSize: 10, fontWeight: 700, color: G.dim, textTransform: "uppercase", width: 50 }}>Qty</th>
                  <th style={{ textAlign: "right", padding: "12px 0", fontSize: 10, fontWeight: 700, color: G.dim, textTransform: "uppercase", width: 80 }}>Price</th>
                  <th style={{ textAlign: "right", padding: "12px 0", fontSize: 10, fontWeight: 700, color: G.dim, textTransform: "uppercase", width: 80 }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${G.borderLt}` }}>
                    <td style={{ padding: "10px 0", fontSize: 13, color: G.text, fontWeight: 500 }}>{item.name}</td>
                    <td style={{ textAlign: "center", fontSize: 12, color: G.textSec }}>{item.qty || 1}</td>
                    <td style={{ textAlign: "right", fontSize: 12, color: G.textSec }}>${(item.price || 0).toFixed(2)}</td>
                    <td style={{ textAlign: "right", fontSize: 13, fontWeight: 600, color: G.text }}>${((item.qty || 1) * (item.price || 0)).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div style={{ padding: "16px 24px 20px", borderTop: `1px solid ${G.border}` }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
              <div style={{ display: "flex", justifyContent: "space-between", width: 200, fontSize: 12, color: G.textSec }}>
                <span>Subtotal</span><span>${(invoice.subtotal || 0).toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", width: 200, fontSize: 12, color: G.textSec }}>
                <span>Tax ({(invoice.taxRate || 6.25).toFixed(2)}%)</span><span>${(invoice.taxAmount || 0).toFixed(2)}</span>
              </div>
              {(invoice.discountAmt > 0) && (
                <div style={{ display: "flex", justifyContent: "space-between", width: 200, fontSize: 12, color: G.green }}>
                  <span>Discount</span><span>-${(invoice.discountAmt || 0).toFixed(2)}</span>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", width: 200, fontSize: 16, fontWeight: 800, color: G.text, borderTop: `2px solid ${G.text}`, paddingTop: 8, marginTop: 4 }}>
                <span>Total</span><span>${(invoice.total || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Payment Section ── */}
        {!isPaid && (
          <div style={{ marginTop: 24 }}>
            {/* Zelle Payment */}
            <div style={{ background: G.card, border: `1px solid ${G.border}`, borderRadius: 16, overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
              <div style={{ padding: "20px 24px 14px", borderBottom: `1px solid ${G.borderLt}` }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: G.text, fontFamily: G.fontDisplay }}>Pay with Zelle</div>
                <div style={{ fontSize: 12, color: G.dim, marginTop: 2 }}>Send ${(invoice.total || 0).toFixed(2)} via Zelle, then upload a screenshot to confirm.</div>
              </div>

              <div style={{ padding: "18px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
                {/* Zelle Info */}
                <div style={{ background: "#F0FDF4", border: `1px solid ${G.green}20`, borderRadius: 10, padding: "14px 18px" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: G.dim, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Send Zelle payment to:</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: G.green, letterSpacing: "0.02em" }}>{zellePhone || company?.email || "—"}</div>
                  <div style={{ fontSize: 12, color: G.textSec, marginTop: 4 }}>{company?.name || ""}</div>
                  <div style={{ fontSize: 11, color: G.dim, marginTop: 8, padding: "6px 10px", background: "#fff", borderRadius: 6, border: `1px solid ${G.border}` }}>
                    Reference: <strong>{invoice.invoiceNumber}</strong>
                  </div>
                </div>

                {/* Upload Screenshot */}
                {!uploadDone && !proofUrl ? (
                  <div
                    onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave}
                    style={{
                      border: `2px dashed ${dragOver ? G.green : G.border}`,
                      borderRadius: 12, padding: "28px 20px", textAlign: "center",
                      background: dragOver ? `${G.green}06` : G.borderLt,
                      cursor: "pointer", transition: "all 0.2s",
                    }}
                    onClick={() => document.getElementById("proof-upload").click()}>
                    <input id="proof-upload" type="file" accept="image/*" style={{ display: "none" }}
                      onChange={e => { if (e.target.files[0]) handleFile(e.target.files[0]); }}/>
                    {uploading ? (
                      <>
                        <Loader size={28} color={G.green} style={{ animation: "spin 1s linear infinite" }}/>
                        <p style={{ fontSize: 13, color: G.green, fontWeight: 600, marginTop: 10 }}>Uploading...</p>
                      </>
                    ) : (
                      <>
                        <Upload size={28} color={G.dim}/>
                        <p style={{ fontSize: 13, fontWeight: 600, color: G.text, marginTop: 10 }}>Upload payment screenshot</p>
                        <p style={{ fontSize: 11, color: G.dim, marginTop: 4 }}>Drag & drop or click to select · PNG, JPG</p>
                      </>
                    )}
                  </div>
                ) : (
                  <div style={{ border: `1px solid ${G.green}30`, borderRadius: 12, padding: 16, background: `${G.green}06` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                      <CheckCircle size={18} color={G.green}/>
                      <span style={{ fontSize: 13, fontWeight: 700, color: G.green }}>Screenshot uploaded</span>
                    </div>
                    {proofUrl && (
                      <img src={proofUrl} alt="Payment proof" style={{ width: "100%", maxHeight: 300, objectFit: "contain", borderRadius: 8, border: `1px solid ${G.border}` }}/>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ marginTop: 32, textAlign: "center" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <svg width="24" height="24" viewBox="0 0 512 512">
              <defs><linearGradient id="lbg" x1="0" y1="1" x2="1" y2="0"><stop offset="0%" stopColor="#16A34A"/><stop offset="100%" stopColor="#4ADE80"/></linearGradient></defs>
              <rect width="512" height="512" rx="128" fill="url(#lbg)"/>
              <path d="M256 420Q256 260 256 92Q288 132 296 196Q296 320 256 420Z" fill="#fff" opacity=".9"/>
              <path d="M256 420Q256 260 256 92Q224 132 216 196Q216 320 256 420Z" fill="#fff" opacity=".75"/>
              <path d="M244 420Q168 280 120 160Q152 168 184 220Q224 296 244 420Z" fill="#fff" opacity=".65"/>
              <path d="M268 420Q344 280 392 160Q360 168 328 220Q288 296 268 420Z" fill="#fff" opacity=".55"/>
            </svg>
            <span style={{ fontSize: 14, fontWeight: 800, fontFamily: "'Syne', sans-serif" }}>
              <span style={{ color: G.green }}>cleo</span><span style={{ color: G.greenLight }}>yards</span>
            </span>
          </div>
          <p style={{ fontSize: 10, color: G.dim, marginTop: 6 }}>Powered by Cleo Yards · yards.cleoia.app</p>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
