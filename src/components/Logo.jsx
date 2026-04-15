const Logo = ({ dark, full = false, size = "default" }) => {
  const s = size === "large" ? { icon: 52, font: 28, gap: 14 } : { icon: 38, font: 22, gap: 10 };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: s.gap, cursor: "pointer" }}>
      <svg width={s.icon} height={s.icon} viewBox="0 0 512 512">
        <defs>
          <linearGradient id="lbg" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="#16A34A"/><stop offset="100%" stopColor="#4ADE80"/>
          </linearGradient>
        </defs>
        <rect width="512" height="512" rx="128" fill="url(#lbg)"/>
        <path d="M256 420Q256 260 256 92Q288 132 296 196Q296 320 256 420Z" fill="#fff" opacity=".9"/>
        <path d="M256 420Q256 260 256 92Q224 132 216 196Q216 320 256 420Z" fill="#fff" opacity=".75"/>
        <path d="M244 420Q168 280 120 160Q152 168 184 220Q224 296 244 420Z" fill="#fff" opacity=".65"/>
        <path d="M268 420Q344 280 392 160Q360 168 328 220Q288 296 268 420Z" fill="#fff" opacity=".55"/>
      </svg>
      <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
        <span style={{ fontSize: s.font, fontWeight: 800, fontFamily: "'Syne', sans-serif", letterSpacing: "-0.03em" }}>
          <span style={{ color: dark ? "#22C55E" : "#16A34A" }}>cleo</span>
          <span style={{ color: "#4ADE80" }}>yards</span>
        </span>
        <div style={{ width: "100%", height: full ? 2 : 1.5, background: dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)", borderRadius: 1, overflow: "hidden", marginTop: full ? 6 : 4 }}>
          <div className="animated-line" style={{ width: "40%", height: "100%", borderRadius: 1, background: "linear-gradient(90deg, #16A34A, #4ADE80)" }} />
        </div>
        <span style={{ fontSize: full ? 9 : 7, fontWeight: 500, letterSpacing: full ? 5 : 3.5, color: dark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.3)", marginTop: full ? 5 : 3, textTransform: "uppercase", textAlign: "center" }}>POWERED BY IA</span>
      </div>
    </div>
  );
};
export default Logo;
