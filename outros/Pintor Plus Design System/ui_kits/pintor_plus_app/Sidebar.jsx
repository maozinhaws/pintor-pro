/* global React, Icon */

function Sidebar({ active, onNavigate, onNewOrcamento }) {
  const principal = [
    { id: "dashboard",  label: "Dashboard",   icon: "home" },
    { id: "orcamentos", label: "Orçamentos",  icon: "file-text" },
    { id: "clientes",   label: "Clientes",    icon: "users" },
    { id: "agenda",     label: "Agenda",      icon: "calendar" },
  ];
  const sistema = [
    { id: "fornecedores",  label: "Fornecedores",  icon: "package" },
    { id: "backup",        label: "Backup",        icon: "database" },
    { id: "configuracoes", label: "Configurações", icon: "settings" },
    { id: "termos",        label: "Termos",        icon: "file" },
  ];

  return (
    <aside className="sidebar">
      <div className="sb-brand">
        <div className="mark">P+</div>
        <div className="name">Pintor<span>Plus</span></div>
      </div>

      <div className="sb-section">
        <div className="sb-eyebrow">Principal</div>
        {principal.map((it) => (
          <div key={it.id}
            className={`sb-link ${active === it.id ? "active" : ""}`}
            onClick={() => onNavigate(it.id)}>
            <Icon name={it.icon} size={18}/>
            <span>{it.label}</span>
          </div>
        ))}
      </div>

      <div className="sb-section">
        <div className="sb-eyebrow">Sistema</div>
        {sistema.map((it) => (
          <div key={it.id}
            className={`sb-link ${active === it.id ? "active" : ""}`}
            onClick={() => onNavigate(it.id)}>
            <Icon name={it.icon} size={18}/>
            <span>{it.label}</span>
          </div>
        ))}
      </div>

      <div className="sb-spacer"></div>

      <button className="sb-cta" onClick={onNewOrcamento}>
        <Icon name="plus" size={16} color="#fff" strokeWidth={2.5}/>
        Novo Orçamento
      </button>
    </aside>
  );
}

Object.assign(window, { Sidebar });
