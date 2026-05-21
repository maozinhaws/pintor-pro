/* global React, Icon */

function OrcamentosList({ onNewOrcamento }) {
  const [filter, setFilter] = React.useState("todos");
  const chips = ["todos", "rascunho", "enviado", "aprovado", "em andamento", "finalizado", "cancelado"];

  return (
    <React.Fragment>
      <div className="page-hdr">
        <div className="col-eyebrow-title">
          <span className="page-eyebrow">Histórico · 1 Total</span>
          <h1 className="page-title">Orçamentos</h1>
        </div>
        <button className="cta-pill" onClick={onNewOrcamento}>
          <Icon name="plus" size={14} color="#fff" strokeWidth={2.5}/> Novo
        </button>
      </div>

      <div className="search-wrap">
        <Icon name="search" size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--ink3)" }}/>
        <input className="search-input" placeholder="Buscar por cliente..."/>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 18, alignItems: "center" }}>
        <div style={{ position: "relative", flex: "0 0 200px" }}>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{
              width: "100%", height: 40,
              background: "var(--bg-modal)",
              border: "1px solid var(--bdr)",
              borderRadius: 9999,
              padding: "0 36px 0 14px",
              fontFamily: "var(--font-display)",
              fontWeight: 700, fontSize: 11,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "var(--ink)",
              outline: "none",
              cursor: "pointer",
              appearance: "none",
              WebkitAppearance: "none",
              boxShadow: "var(--sh)",
            }}
          >
            {chips.map((c) => (
              <option key={c} value={c}>{c.toUpperCase()}</option>
            ))}
          </select>
          <Icon name="chevron-down" size={14} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", color: "var(--ink2)", pointerEvents: "none" }}/>
        </div>
        <span style={{ fontSize: 11, color: "var(--ink3)", fontFamily: "var(--font-body)" }}>{filter === "todos" ? "todos os status" : "filtrando por " + filter}</span>
      </div>

      {/* One sample card */}
      <div style={{
        background: "var(--bg-modal)",
        border: "1px solid var(--bdr)",
        borderRadius: "0 24px 24px 24px",
        padding: 18,
        boxShadow: "var(--sh)",
        maxWidth: 520,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 15, color: "var(--ink)", letterSpacing: "0.02em", textTransform: "uppercase" }}>Sem Cliente</div>
            <div className="eyebrow-cmd" style={{ marginTop: 4 }}>#1 · 20 Mai 26, 17:48</div>
          </div>
          <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 800, fontSize: 22, color: "var(--bl)", letterSpacing: "-0.02em" }}>R$ 0</div>
        </div>

        <div style={{ position: "relative", marginBottom: 12 }}>
          <select style={{
            width: "100%", height: 40,
            background: "var(--bg-modal)",
            border: "1.5px solid var(--bl)",
            borderRadius: 10,
            padding: "0 36px 0 14px",
            fontFamily: "var(--font-display)",
            fontWeight: 700, fontSize: 11,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: "var(--bl)",
            outline: "none",
            cursor: "pointer",
            appearance: "none",
            WebkitAppearance: "none",
          }}>
            <option>Rascunho</option>
            <option>Enviado</option>
            <option>Aprovado</option>
          </select>
          <Icon name="chevron-down" size={16} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "var(--bl)", pointerEvents: "none" }}/>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button style={{ flex: 1, height: 38, borderRadius: 10, border: "1px solid var(--bdr)", background: "var(--bg-modal)", color: "var(--ink)", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", cursor: "pointer" }}>Ver</button>
          <button style={{ width: 56, height: 38, borderRadius: 10, border: "1px solid var(--bdr)", background: "var(--bg-modal)", color: "var(--ink2)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <Icon name="file-text" size={15}/>
          </button>
          <button style={{ width: 38, height: 38, borderRadius: 10, border: "1px solid var(--bdr)", background: "var(--bg-modal)", color: "var(--rd)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <Icon name="trash-2" size={15}/>
          </button>
        </div>
      </div>
    </React.Fragment>
  );
}

Object.assign(window, { OrcamentosList });
