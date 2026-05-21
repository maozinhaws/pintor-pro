/* global React, Icon */

function WizardScreen({ mode, onClose }) {
  const [nome, setNome] = React.useState("");
  const [tel, setTel]   = React.useState("");
  const [end, setEnd]   = React.useState("");

  return (
    <React.Fragment>
      <div className="wizard-page-hdr">
        <div>
          <div className="wizard-eyebrow">Passo 1 de 4</div>
          <h1 className="page-title">Cliente</h1>
        </div>
        <button className="wizard-close" onClick={onClose}>
          <Icon name="x" size={18}/>
        </button>
      </div>

      <div className="stepper">
        <div className="seg active"></div>
        <div className="seg"></div>
        <div className="seg"></div>
        <div className="seg"></div>
      </div>

      <div className="glass-card" style={{ borderRadius: "20px" }}>
        <div className="eyebrow-cmd" style={{ marginBottom: 14 }}>Cadastrar Novo</div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
          <div>
            <label className="field-label">Nome *</label>
            <input className="field-input" value={nome} onChange={(e) => setNome(e.target.value)} autoFocus/>
          </div>
          <div>
            <label className="field-label">Telefone</label>
            <input className="field-input" value={tel} onChange={(e) => setTel(e.target.value)}/>
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label className="field-label">Endereço</label>
          <input className="field-input" value={end} onChange={(e) => setEnd(e.target.value)}/>
        </div>

        <button style={{
          background: "var(--bg2)",
          border: "1px solid var(--bdr)",
          color: "var(--ink2)",
          padding: "9px 18px",
          borderRadius: 9999,
          fontFamily: "var(--font-display)",
          fontWeight: 700, fontSize: 11,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          cursor: "pointer",
        }}>Salvar e Usar</button>
      </div>

      <div className="wizard-footer">
        <button className="cta-pill" onClick={onClose}>
          Próximo <Icon name="chevron-right" size={14} color="#fff"/>
        </button>
      </div>
    </React.Fragment>
  );
}

Object.assign(window, { WizardScreen });
