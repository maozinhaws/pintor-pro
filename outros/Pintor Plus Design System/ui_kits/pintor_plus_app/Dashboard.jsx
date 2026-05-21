/* global React, Icon */

function Dashboard({ onNewOrcamento }) {
  return (
    <React.Fragment>
      {/* Page header */}
      <div className="page-hdr" style={{ flexDirection: "column", alignItems: "flex-start", gap: 14, marginBottom: 24 }}>
        <div className="col-eyebrow-title">
          <span className="page-eyebrow">Painel · System Active</span>
          <h1 className="page-title">Performance Hub</h1>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <span className="metric-pill">
            <span className="dot" style={{ background: "var(--bl)" }}></span>
            R$ 0 Faturamento
          </span>
          <span className="metric-pill">
            <span className="dot" style={{ background: "var(--brand-2)" }}></span>
            0 Clientes
          </span>
        </div>
      </div>

      {/* Hero gradient card */}
      <div className="hero" onClick={onNewOrcamento}>
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 18 }}>
          <span className="hero-toque-pill">Toque para iniciar</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
          <div className="hero-plus-pill" style={{ flexShrink: 0 }}>
            <Icon name="plus" size={28} strokeWidth={2.5} color="#ffffff"/>
          </div>
          <h2 className="hero-title" style={{ margin: 0 }}>Novo<br/>Orçamento</h2>
        </div>
        <p className="hero-sub" style={{ marginTop: 14 }}>Comece a transformar um novo ambiente hoje.</p>
      </div>

      {/* Fluxo de orçamentos */}
      <div className="glass-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <span className="glass-title">Fluxo de Orçamentos</span>
          <a className="inline-link">Histórico <Icon name="arrow-up-right" size={12}/></a>
        </div>
        <div className="empty-state">
          <div className="empty-icon">
            <Icon name="file-text" size={26}/>
          </div>
          <span className="empty-text">Nenhum orçamento ainda</span>
          <button className="btn-ink-pill" onClick={onNewOrcamento}>Criar Primeiro</button>
        </div>
      </div>

      {/* Agenda livre */}
      <div className="glass-card">
        <div className="agenda-row">
          <div className="agenda-info">
            <span className="agenda-eyebrow">
              <span className="agenda-dot"></span>
              Sem eventos
            </span>
            <div className="agenda-title">Agenda Livre</div>
            <a className="inline-link" style={{ marginTop: 8, display: "inline-flex" }}>
              Ver agenda <Icon name="arrow-up-right" size={12}/>
            </a>
          </div>
          <div className="agenda-icon-tile">
            <Icon name="calendar" size={28}/>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
}

Object.assign(window, { Dashboard });
