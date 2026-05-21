/* global React, Icon */

function TipoOrcamentoModal({ onPick, onClose }) {
  const opts = [
    { id: "flash",     icon: "zap",          title: "Modo Flash", sub: "Rápido e prático" },
    { id: "foto",      icon: "image",        title: "Modo Foto",  sub: "Análise por imagem" },
    { id: "detalhado", icon: "clipboard-list", title: "Detalhado",  sub: "Relatório completo" },
  ];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-hdr">
          <div className="modal-title">Tipo de Orçamento</div>
          <button className="modal-close" onClick={onClose}>
            <Icon name="x" size={16}/>
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {opts.map((o) => (
            <div key={o.id} className="mode-option" onClick={() => onPick(o.id)}>
              <div className="mode-avatar">
                <Icon name={o.icon} size={22} color="#fff"/>
              </div>
              <div className="mode-text">
                <span className="mode-title">{o.title}</span>
                <span className="mode-sub">{o.sub}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { TipoOrcamentoModal });
