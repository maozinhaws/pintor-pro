/* global React */
const { useEffect, useRef } = React;

/* ---------- Icon (Lucide via CDN) ---------- */
function Icon({ name, size = 20, color, strokeWidth = 1.75, style, ...rest }) {
  const ref = useRef(null);
  useEffect(() => {
    if (window.lucide && ref.current) {
      ref.current.setAttribute("data-lucide", name);
      ref.current.innerHTML = "";
      window.lucide.createIcons({ icons: window.lucide.icons, attrs: {}, nameAttr: "data-lucide", elements: [ref.current] });
    }
  }, [name]);
  return (
    <i
      ref={ref}
      data-lucide={name}
      style={{
        width: size, height: size,
        color: color || "currentColor",
        strokeWidth,
        display: "inline-flex",
        ...style,
      }}
      {...rest}
    />
  );
}

/* ---------- GlassCard — live top-left corner ---------- */
function GlassCard({ children, style = {}, onClick, className = "" }) {
  return (
    <div
      onClick={onClick}
      className={className}
      style={{
        background: "var(--card)",
        borderRadius: "0 32px 32px 32px",
        boxShadow: "var(--shadow-glass)",
        padding: 20,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/* ---------- GlassBrand — gradient + live top-right corner ---------- */
function GlassBrand({ children, style = {}, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        position: "relative",
        background: "var(--brand-gradient)",
        color: "#fff",
        borderRadius: "36px 0 36px 36px",
        boxShadow: "var(--shadow-brand)",
        padding: 24,
        transition: "transform 150ms ease",
        cursor: onClick ? "pointer" : "default",
        ...style,
      }}
      onPointerDown={(e) => { if (onClick) e.currentTarget.style.transform = "scale(0.98)"; }}
      onPointerUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
      onPointerLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
    >
      {children}
    </div>
  );
}

/* ---------- Pill (ink button / outline) ---------- */
function BtnDark({ children, onClick, full, style = {}, type = "button" }) {
  return (
    <button
      type={type}
      onClick={onClick}
      style={{
        background: "var(--ink)",
        color: "#fff",
        fontFamily: "var(--font-body)",
        fontWeight: 700,
        padding: "12px 24px",
        borderRadius: 9999,
        border: "none",
        fontSize: 14,
        cursor: "pointer",
        transition: "transform 150ms ease, opacity 150ms ease",
        width: full ? "100%" : "auto",
        ...style,
      }}
      onPointerDown={(e) => { e.currentTarget.style.transform = "scale(0.97)"; }}
      onPointerUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
      onPointerLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
    >
      {children}
    </button>
  );
}

function BtnOutline({ children, onClick, full, style = {} }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: "var(--card)",
        color: "var(--foreground)",
        border: "1px solid var(--border)",
        fontFamily: "var(--font-body)",
        fontWeight: 600,
        padding: "12px 20px",
        borderRadius: 9999,
        fontSize: 14,
        cursor: "pointer",
        width: full ? "100%" : "auto",
        ...style,
      }}
    >
      {children}
    </button>
  );
}

/* ---------- Field input ---------- */
function Field({ label, value, onChange, placeholder, type = "text", helper }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {label && <span className="eyebrow">{label}</span>}
      <input
        type={type}
        value={value || ""}
        onChange={(e) => onChange && onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%",
          background: "var(--card)",
          color: "var(--foreground)",
          border: "1px solid var(--border)",
          borderRadius: 16,
          padding: "12px 14px",
          fontFamily: "var(--font-body)",
          fontSize: 16,
          outline: "none",
          transition: "border-color 150ms, box-shadow 150ms",
        }}
        onFocus={(e) => {
          e.target.style.borderColor = "var(--brand)";
          e.target.style.boxShadow = "var(--shadow-focus)";
        }}
        onBlur={(e) => {
          e.target.style.borderColor = "var(--border)";
          e.target.style.boxShadow = "none";
        }}
      />
      {helper && <span className="help">{helper}</span>}
    </label>
  );
}

/* ---------- Metric pill ---------- */
function MetricPill({ dot = "var(--brand)", label, value }) {
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 8,
      background: "var(--card)", border: "1px solid var(--border)",
      borderRadius: 9999, padding: "8px 14px",
      fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 13,
      color: "var(--foreground)", whiteSpace: "nowrap",
    }}>
      <span style={{ width: 8, height: 8, background: dot, borderRadius: 9999 }} />
      {value && <span className="numeric" style={{ fontSize: 14 }}>{value}</span>}
      <span style={{ color: "var(--muted-foreground)", fontWeight: 500 }}>{label}</span>
    </div>
  );
}

/* ---------- Status pill ---------- */
const STATUS_LABELS = {
  rascunho: "Rascunho",
  enviado: "Enviado",
  aprovado: "Aprovado",
  recusado: "Recusado",
  finalizado: "Finalizado",
};
function StatusPill({ status }) {
  return (
    <span className={`status-pill status-${status}`}>{STATUS_LABELS[status] || status}</span>
  );
}

/* ---------- Brutal chip (uppercase tiny) ---------- */
function BrutalChip({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: active ? "var(--brand)" : "var(--card)",
        color: "var(--ink)",
        border: "1px solid var(--ink)",
        borderRadius: 9999,
        padding: "6px 14px",
        fontFamily: "var(--font-body)",
        fontWeight: 700,
        fontSize: 10,
        letterSpacing: "0.16em",
        textTransform: "uppercase",
        cursor: "pointer",
        whiteSpace: "nowrap",
        transition: "background 150ms",
      }}
    >
      {children}
    </button>
  );
}

/* ---------- PageHeader ---------- */
function PageHeader({ eyebrow, title, actions }) {
  return (
    <div style={{
      padding: "8px 20px 16px",
      background: "color-mix(in srgb, var(--card) 60%, transparent)",
      borderBottom: "1px solid var(--border)",
      marginBottom: 16,
    }}>
      <div className="spread" style={{ alignItems: "flex-end" }}>
        <div>
          {eyebrow && <div className="eyebrow" style={{ marginBottom: 4 }}>{eyebrow}</div>}
          <h1 className="page-title">{title}</h1>
        </div>
        {actions}
      </div>
    </div>
  );
}

Object.assign(window, {
  Icon, GlassCard, GlassBrand, BtnDark, BtnOutline,
  Field, MetricPill, StatusPill, BrutalChip, PageHeader,
  STATUS_LABELS,
});
