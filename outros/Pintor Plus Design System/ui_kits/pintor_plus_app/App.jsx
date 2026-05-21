/* global React, ReactDOM, Sidebar, Dashboard, TipoOrcamentoModal, WizardScreen, OrcamentosList, Icon */
const { useState, useEffect } = React;

function App() {
  const [theme, setTheme]   = useState("claro");          // claro | escuro
  const [tema, setTema]     = useState("suave");          // suave | minimalista | brutalista
  const [screen, setScreen] = useState("dashboard");
  const [wizardMode, setWizardMode] = useState(null);
  const [sheetOpen, setSheetOpen]   = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "escuro");
  }, [theme]);
  useEffect(() => {
    if (tema === "suave") delete document.documentElement.dataset.tema;
    else document.documentElement.dataset.tema = tema;
  }, [tema]);
  useEffect(() => { if (window.lucide) window.lucide.createIcons(); });

  const openTipoOrcamento = () => setSheetOpen(true);
  const pickMode = (m) => { setWizardMode(m); setSheetOpen(false); setScreen("wizard"); };

  const renderScreen = () => {
    if (screen === "dashboard")   return <Dashboard onNewOrcamento={openTipoOrcamento}/>;
    if (screen === "orcamentos")  return <OrcamentosList onNewOrcamento={openTipoOrcamento}/>;
    if (screen === "wizard")      return <WizardScreen mode={wizardMode} onClose={() => setScreen("dashboard")}/>;
    if (screen === "configuracoes") return <ConfiguracoesScreen tema={tema} setTema={setTema}/>;
    return <StubScreen name={screen}/>;
  };

  return (
    <React.Fragment>
      <div className="app-shell">
        <Sidebar
          active={screen}
          onNavigate={(id) => setScreen(id)}
          onNewOrcamento={openTipoOrcamento}
        />
        <main className="main">
          <button className="theme-toggle" onClick={() => setTheme(theme === "claro" ? "escuro" : "claro")} aria-label="Tema">
            <Icon name={theme === "claro" ? "moon" : "sun"} size={18}/>
          </button>
          {renderScreen()}
        </main>
      </div>

      {sheetOpen && <TipoOrcamentoModal onPick={pickMode} onClose={() => setSheetOpen(false)}/>}
    </React.Fragment>
  );
}

/* ---------- Configurações (Aparência picker) ---------- */
function ConfiguracoesScreen({ tema, setTema }) {
  const themes = [
    { id: "suave",        title: "Suave",        sub: "Glass & cores",   render: () => (
      <div style={{ width: "100%", height: 60, borderRadius: 12, background: "linear-gradient(135deg,#ff6b35,#7b5cff)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(255,255,255,0.4)", backdropFilter: "blur(10px)" }}/>
      </div>
    )},
    { id: "minimalista",  title: "Minimalista", sub: "Sólido & direto",  render: () => (
      <div style={{ width: "100%", height: 60, background: "#f4f4f6", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 30, height: 30, background: "#111" }}/>
      </div>
    )},
    { id: "brutalista",   title: "Brutalista",  sub: "Contraste alto",   render: () => (
      <div style={{ width: "100%", height: 60, background: "#fff", border: "2px solid #000", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 40, height: 14, background: "#000" }}/>
      </div>
    )},
  ];

  return (
    <React.Fragment>
      <div className="page-hdr">
        <div className="col-eyebrow-title">
          <span className="page-eyebrow">Sistema · Empresa</span>
          <h1 className="page-title">Configurações</h1>
        </div>
        <button className="cta-pill"><Icon name="save" size={14} color="#fff" strokeWidth={2.5}/> Salvar</button>
      </div>

      <div className="glass-card" style={{ borderRadius: "20px", maxWidth: 720 }}>
        <div className="eyebrow-cmd" style={{ marginBottom: 14 }}>Aparência</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          {themes.map((t) => (
            <div
              key={t.id}
              onClick={() => setTema(t.id)}
              style={{
                background: "var(--bg-modal)",
                border: tema === t.id ? "1.5px solid var(--bl)" : "1px solid var(--bdr)",
                boxShadow: tema === t.id ? "0 0 0 3px rgba(255,107,53,0.18), var(--sh)" : "var(--sh)",
                borderRadius: 16,
                padding: 14,
                textAlign: "center",
                cursor: "pointer",
                transition: "border-color 150ms, box-shadow 150ms",
              }}
            >
              <div style={{ marginBottom: 10 }}>{t.render()}</div>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 14, color: "var(--ink)", letterSpacing: "-0.01em" }}>{t.title}</div>
              <div style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--ink3)", marginTop: 3, fontWeight: 500 }}>{t.sub}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card" style={{ borderRadius: "20px", maxWidth: 720 }}>
        <div className="eyebrow-cmd" style={{ marginBottom: 14 }}>Empresa</div>
        <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 16, alignItems: "start" }}>
          <div style={{ background: "var(--bg2)", borderRadius: 14, height: 110, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink3)" }}>
            <Icon name="building" size={28}/>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label className="field-label">Nome da empresa</label>
              <input className="field-input"/>
            </div>
            <div>
              <label className="field-label">CNPJ / CPF</label>
              <input className="field-input"/>
            </div>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
}

/* ---------- Stub for screens not yet built ---------- */
function StubScreen({ name }) {
  const titles = {
    clientes:      ["Base · 0 Contatos",  "Clientes"],
    agenda:        ["Calendário · 0 Eventos", "Agenda"],
    fornecedores:  ["Catálogo · 0 Itens", "Fornecedores"],
    backup:        ["Sistema · Dados",    "Backup"],
    termos:        ["Sistema · Legal",    "Termos"],
  };
  const [eyebrow, title] = titles[name] || ["Página", name];

  return (
    <React.Fragment>
      <div className="page-hdr">
        <div className="col-eyebrow-title">
          <span className="page-eyebrow">{eyebrow}</span>
          <h1 className="page-title">{title}</h1>
        </div>
      </div>
      <div className="glass-card" style={{ borderRadius: 20, padding: 40, textAlign: "center" }}>
        <div className="eyebrow-cmd" style={{ marginBottom: 12 }}>Em construção</div>
        <p style={{ fontSize: 13, color: "var(--ink3)", maxWidth: 320, margin: "0 auto" }}>
          Esta tela existe no Pintor Plus real, mas não está recriada no UI Kit. Veja o protótipo Lovable para a versão completa.
        </p>
      </div>
    </React.Fragment>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App/>);
