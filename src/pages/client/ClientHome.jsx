import { useAuth } from "../../context/AuthContext";

export default function ClientHome({ dark, v }) {
  const { user } = useAuth();
  return (
    <div>
      <h1 style={{ fontSize: 26, fontWeight: 800, fontFamily: "'Syne', sans-serif", color: v.text, marginBottom: 4 }}>Welcome, {user?.name} 👋</h1>
      <p style={{ fontSize: 14, color: v.textSec, marginBottom: 28 }}>{user?.address} — Your property portal</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 32 }}>
        {[
          { label: "Next Service", value: "Apr 18", sub: "Full lawn maintenance", color: "#16A34A" },
          { label: "Open Estimate", value: "$1,240", sub: "Landscape redesign", color: "#3B82F6" },
          { label: "Balance Due", value: "$450", sub: "Invoice #1042", color: "#F59E0B" },
        ].map((c, i) => (
          <div key={i} style={{ padding: 22, borderRadius: 14, background: v.cardBg, border: "1px solid " + v.border }}>
            <p style={{ fontSize: 12, color: v.textSec, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>{c.label}</p>
            <p style={{ fontSize: 28, fontWeight: 800, fontFamily: "'Syne', sans-serif", color: v.text }}>{c.value}</p>
            <p style={{ fontSize: 12, color: c.color, marginTop: 4, fontWeight: 500 }}>{c.sub}</p>
          </div>
        ))}
      </div>

      <div style={{ padding: 24, borderRadius: 14, background: v.cardBg, border: "1px solid " + v.border }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: v.text, marginBottom: 16 }}>Service History</h3>
        {[
          { date: "Apr 5, 2026", service: "Weekly lawn mowing", amount: "$85.00", status: "Paid" },
          { date: "Mar 29, 2026", service: "Weekly lawn mowing", amount: "$85.00", status: "Paid" },
          { date: "Mar 22, 2026", service: "Spring cleanup + mulching", amount: "$450.00", status: "Paid" },
          { date: "Mar 15, 2026", service: "Weekly lawn mowing", amount: "$85.00", status: "Paid" },
        ].map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 0", borderBottom: i < 3 ? "1px solid " + v.border : "none" }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: v.textTer, minWidth: 100 }}>{s.date}</span>
            <p style={{ flex: 1, fontSize: 13, fontWeight: 600, color: v.text }}>{s.service}</p>
            <span style={{ fontSize: 13, color: v.textSec, fontWeight: 500 }}>{s.amount}</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: "#16A34A" }}>{s.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
