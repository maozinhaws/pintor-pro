# Feat_Cam — Sistema de Câmera com Anotação Visual

## Contexto

O Pintor Plus precisa de um sistema de câmera diferenciado para documentação de serviços. O pintor fotografa ambientes e superfícies durante visitas técnicas e precisa marcar problemas, indicar áreas de trabalho e registrar o estado antes/depois com precisão visual.

---

## Estado Atual da Câmera

Ambas as versões (MVP e APK backup mar/2026) usam a mesma abordagem:

| Aspecto | Implementação atual |
|---|---|
| API | `navigator.mediaDevices.getUserMedia` (WebRTC) |
| Plugin Capacitor Camera | Nenhum |
| Qualidade câmera | JPEG 75% — resolução nativa |
| Qualidade galeria | JPEG 60% — máx 1024px |
| Captura múltipla | Sim (sem fechar modal entre fotos) |
| Torch/Flash | Sim (detectado via `getCapabilities()`) |
| Zoom | Sim (slider dinâmico via `applyConstraints`) |
| Armazenamento | Base64 DataURL dentro do JSON no localStorage |
| Fallback | `<input type="file" capture="environment">` |

**Problemas conhecidos do sistema atual:**
- Fotos em Base64 no localStorage — cada foto ~500KB+, limite de ~5–10MB total
- Câmera e galeria usam qualidades diferentes (inconsistência)
- `facingMode: exact` falha em alguns Android antes do fallback para `ideal`
- Sem compressão pós-captura da câmera (apenas na importação de galeria)
- Código enterrado no inline JS de 3500+ linhas — impossível de testar isolado

---

## A Feature

### Fluxo principal

```
Câmera abre (stream contínuo)
    ↓
Usuário tira fotos em sequência — sem review entre capturas
    ↓
Thumbnails aparecem em tempo real
    ↓
Usuário toca em uma thumbnail
    ↓
Editor de anotação abre sobre a imagem (fullscreen)
    ↓
Usuário anota: texto / desenho / seta / círculo
    ↓
Confirma → anotação é "baked in" na imagem (canvas flatten)
    ↓
Foto salva no item com edições permanentes
```

### Casos de uso

- **Indicar problema** — circular uma trinca, apontar infiltração com seta
- **Informação de medida** — escrever dimensão sobre a parede fotografada
- **Antes e depois** — foto anotada como referência do estado inicial
- **Prova em disputa** — registro visual datado e anotado do estado do ambiente
- **Instrução de execução** — marcar área que NÃO deve ser pintada

---

## Arquitetura do Módulo

### Decisão: módulo separado

O editor de anotação deve ser construído como módulo standalone independente, fora do inline JS do app.

**Por quê:**
- Canvas com eventos de toque é um subsistema complexo — não cabe no inline JS de 3500 linhas sem criar um monstro
- Contrato simples: **recebe DataURL → retorna DataURL anotada** — zero acoplamento
- Testável isoladamente
- Reutilizável na migração futura para React Native (mesma lógica, diferente renderer)

### Estrutura de arquivos

```
src/
└── photo-annotator/
    ├── photo-annotator.js    ← módulo principal (autocontido)
    └── photo-annotator.css   ← estilos do editor fullscreen
```

### Interface pública

```javascript
// Abre o editor sobre uma foto
PhotoAnnotator.open(dataUrl, {
  onSave: (annotatedDataUrl) => { /* salva no item */ },
  onCancel: () => { /* descarta edição */ }
});
```

---

## Ferramentas do Editor

| Ferramenta | Implementação técnica |
|---|---|
| Caneta livre | `touchmove` → `ctx.lineTo()` com `lineJoin: round`, `lineCap: round` |
| Texto | `touchstart` → posiciona `<input>` overlay → `ctx.fillText()` ao confirmar |
| Seta | drag → `Math.atan2` para ângulo → linha + triângulo preenchido na ponta |
| Círculo | drag → rubber-band preview → `ctx.ellipse()` ao soltar |
| Cores | Preset: branco, preto, vermelho, amarelo, azul, verde |
| Espessura | 3 opções: fino (2px), médio (5px), grosso (10px) |
| Desfazer | Stack de snapshots via `ctx.getImageData` / `ctx.putImageData` |

### Paleta de cores sugerida

```
⬜ Branco   — contraste em superfícies escuras
⬛ Preto    — contraste em superfícies claras  
🔴 Vermelho — problemas, alertas
🟡 Amarelo  — atenção, destaques
🔵 Azul     — informação, medidas
🟢 Verde    — OK, aprovado, referência
```

---

## Desafios Técnicos

### 1. HiDPI / devicePixelRatio
Canvas precisa compensar o pixel ratio da tela para não ficarem traços borrados em telas de alta densidade.

```javascript
const dpr = window.devicePixelRatio || 1;
canvas.width = displayWidth * dpr;
canvas.height = displayHeight * dpr;
ctx.scale(dpr, dpr);
canvas.style.width = displayWidth + 'px';
canvas.style.height = displayHeight + 'px';
```

### 2. Touch e Mouse simultaneamente
Precisa funcionar em Android (touch) e no browser desktop (mouse) para desenvolvimento e testes.

```javascript
// Normaliza ambos os tipos de evento
function getPoint(e) {
  const touch = e.touches?.[0] ?? e;
  const rect = canvas.getBoundingClientRect();
  return {
    x: (touch.clientX - rect.left),
    y: (touch.clientY - rect.top)
  };
}
```

### 3. Teclado Android ao digitar texto
Ao posicionar um `<input>` overlay para texto, o teclado pode empurrar o layout. Usar `position: fixed` no container e escutar `visualViewport.resize` para reposicionar.

### 4. Cálculo de seta

```javascript
function drawArrow(ctx, x1, y1, x2, y2, headSize = 16) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  // Ponta da seta
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - headSize * Math.cos(angle - Math.PI / 6), y2 - headSize * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(x2 - headSize * Math.cos(angle + Math.PI / 6), y2 - headSize * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();
}
```

### 5. Flatten final (bake)
Ao salvar, compor foto + anotações em um único canvas e exportar como JPEG.

```javascript
function flattenAndExport(photoDataUrl, annotationCanvas, quality = 0.85) {
  return new Promise(resolve => {
    const final = document.createElement('canvas');
    final.width = annotationCanvas.width;
    final.height = annotationCanvas.height;
    const ctx = final.getContext('2d');
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, final.width, final.height);   // foto base
      ctx.drawImage(annotationCanvas, 0, 0);                  // anotações
      resolve(final.toDataURL('image/jpeg', quality));
    };
    img.src = photoDataUrl;
  });
}
```

---

## Plano de Implementação

### Fase 1 — Canvas base + caneta
- [ ] Estrutura do módulo (`photo-annotator.js` + CSS)
- [ ] Modal fullscreen com foto de fundo
- [ ] Ferramenta caneta (touch + mouse)
- [ ] Seletor de cor e espessura
- [ ] Desfazer (undo stack)
- [ ] Flatten e retorno da DataURL anotada

### Fase 2 — Formas e texto
- [ ] Ferramenta seta
- [ ] Ferramenta círculo/elipse
- [ ] Ferramenta texto (input overlay + render no canvas)
- [ ] HiDPI fix (devicePixelRatio)

### Fase 3 — Integração no app
- [ ] Integrar módulo no fluxo de câmera do `app.html`
- [ ] Toque na thumbnail abre o editor
- [ ] Foto anotada substitui a original no item
- [ ] Indicador visual de "foto anotada" na thumbnail

---

## Referência de UX — WhatsApp Image Editor

O editor do WhatsApp serve como referência de UX por ser familiar ao usuário:
- Toolbar no topo com ferramentas
- Paleta de cores horizontal
- Botão de desfazer
- Confirmar / cancelar no topo
- Preview em tempo real das anotações

A diferença é que o Pintor Plus **não precisa de emojis, stickers ou crop** — foco em: caneta, texto, seta e círculo.

---

## Notas de Integração Futura (React Native)

Quando o app migrar para React Native + Expo, o módulo pode ser reescrito usando:
- `react-native-sketch-canvas` — canvas com suporte a touch nativo
- `react-native-image-editor` — crop e composição
- Ou canvas customizado via `expo-gl`

A lógica de negócio (ferramentas, flatten, contrato open/save) permanece a mesma — só muda o renderer.
