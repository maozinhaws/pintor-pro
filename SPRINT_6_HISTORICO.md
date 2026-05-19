# 📋 Sprint 6: Histórico de Alterações - CONCLUÍDO

**Data**: Maio 2026  
**Status**: ✅ Implementado  
**Objetivo**: Rastrear automaticamente todas as mudanças em cada orçamento com timestamp e visualização de histórico

---

## 🎯 O que foi implementado

### 1. Sistema de Detecção de Mudanças

**Arquivo**: `src/services/orcamentos.ts`

Função `buildHistoricoEntries(anterior, novo)` que:
- Compara versão anterior com nova versão do orçamento
- Detecta mudanças em campos simples: nome, tel, email, status, obs, preço, modo, formato
- Calcula mudança automática de total (recalculando baseado em ambientes/itens)
- Rastreia mudanças estruturais: quantidade de ambientes, quantidade de itens
- Retorna array de `HistoricoOrcamentoEntry` com:
  - `timestamp`: momento da mudança (ms)
  - `campo`: qual campo mudou
  - `valorAnterior`: valor antes
  - `valorNovo`: valor depois
  - `usuario`: 'sistema' (pronto para futuro multi-user)

**Exemplo de entrada histórico:**
```json
{
  "timestamp": 1684924800000,
  "campo": "total",
  "valorAnterior": 1500.00,
  "valorNovo": 2100.00,
  "usuario": "sistema"
}
```

### 2. Integração com Salvamento

**Arquivo**: `src/budgets.ts` - função `saveOrc()`

Quando um orçamento é salvo:
1. Busca versão anterior do orçamento (se existir)
2. Chama `buildHistoricoEntries(anterior, novo)`
3. Concatena novas entradas ao array `orc.historico`
4. Salva com histórico atualizado

**Fluxo:**
- Novo orçamento → `historico = [criação]`
- Edição existente → `historico = [...anterior, ...novas mudanças]`

### 3. Armazenamento

**Arquivo**: `src/types.ts`

Campo adicionado à interface `Orcamento`:
```typescript
historico?: HistoricoOrcamentoEntry[];
```

Persiste automaticamente com o orçamento no localStorage/Dexie/SQLite

### 4. Página de Visualização do Histórico

**Arquivo**: `dist/app.html` - página `pg-historico`

Nova página dedicada que exibe:
- Lista cronológica de todas as mudanças (mais recentes primeiro)
- Para cada entrada:
  - Data e hora formatada em pt-BR
  - Nome do campo alterado (em português)
  - Valor anterior → Valor novo (com destaque visual)

**Exemplo visual:**
```
19/05/2026 14:35
Nome do Cliente
(sem nome) → João Silva

19/05/2026 14:36
Total
R$ 1500.00 → R$ 2100.00

19/05/2026 14:37
Status
Pendente → Aprovado
```

### 5. Menu de Ações

**Arquivo**: `dist/app.html` - função `_buildCardMenu()`

Adicionado ao menu de cada orçamento:
- Novo botão "Histórico" (apenas aparece se houver histórico)
- Ícone de clock/história (#ico-history)
- Abre página pg-historico ao clicar

**SVG Icon adicionado**: `<symbol id="ico-history">` (relógio com seta)

### 6. Funções de Formatação

**Arquivo**: `src/services/orcamentos.ts`

Funções auxiliares:

#### `formatHistoricoEntrada(entrada)`
Formata entrada em string legível:
```
"19/05/2026 14:35 - Nome: (sem nome) → João Silva"
```

#### `calcularTotalOrcamento(orc)`
Recalcula total para comparação no histórico
- Considera m² de ambientes
- Preços por m² e preços fixos
- Retorna número final

#### `agruparHistoricoPorDia(historico)`
Retorna `Map<string, HistoricoOrcamentoEntry[]>` agrupadas por dia
Útil para futuras timeline visuals

#### `ultimasEntradasHistorico(historico, limite = 5)`
Retorna últimas N entradas (padrão 5)
Útil para widgets resumidos

### 7. Funções de Exibição (app.html)

#### `openHistorico(orcId)`
- Busca orçamento
- Renderiza histórico em pg-historico
- Exibe mensagem se vazio

#### `closeHistorico()`
- Fecha pg-historico
- Volta para aba de orçamentos

#### `getCampoLabelHistorico(campo)`
Mapeia nome técnico para rótulo legível em português

#### `formatarValorHistorico(valor)`
Formata valores para exibição:
- `null/undefined` → "—"
- Números > 100 → "R$ 123,45"
- Booleanos → "Sim" / "Não"

---

## 📊 Estrutura de Dados

### HistoricoOrcamentoEntry (tipos.ts)
```typescript
interface HistoricoOrcamentoEntry {
  timestamp: number;        // ms desde epoch
  campo: string;           // nome do campo alterado
  valorAnterior: any;      // valor anterior
  valorNovo: any;          // novo valor
  usuario?: string;        // 'sistema' ou ID de usuário
}
```

### Campos rastreados
- `nome` - Nome do cliente
- `tel` - Telefone
- `email` - Email
- `status` - Status do orçamento
- `obs` - Observações
- `preco` - Preço base/m²
- `precoAdicionalM2` - Preço adicional por m²
- `fmt` - Formato (simples/area/completo)
- `mode` - Modo (flash/foto/detalhado)
- `total` - Total calculado
- `ambientes` - Quantidade de ambientes
- `itens` - Total de itens
- `criado` - Orçamento criado

---

## 🎨 Integração Visual

### Menu de orçamentos
Cada card agora mostra:
- Menu "⋯" com opção "📜 Histórico"
- Apenas visível se houver histórico registrado
- Click abre página full-screen de histórico

### Página de Histórico
- Topbar com close button
- Scroll de entradas
- Card por mudança com:
  - Data/hora pequena (gray)
  - Campo em negrito (ink)
  - Valor anterior em cinza (com bg)
  - Seta →
  - Valor novo em verde (com bg success)
- Mensagem "Sem alterações registradas" se vazio

---

## 🔧 Modo de Uso

### Para Usuário Final
1. Abre orçamento existente
2. Edita campos
3. Clica "Salvar"
4. Histórico é atualizado automaticamente
5. Volta ao card, clica "⋯" → "Histórico"
6. Vê toda trajetória de mudanças com datas

### Para Desenvolvedor
```typescript
// Importar funções
import { buildHistoricoEntries, formatHistoricoEntrada } from './services/orcamentos';

// Chamar manual (já feito em saveOrc, mas disponível)
const anterior = S.orcs[idx];
const novo = collectOrc();
const entradas = buildHistoricoEntries(anterior, novo);
console.log(entradas.map(e => formatHistoricoEntrada(e)));
```

---

## 📁 Arquivos Modificados

1. **src/services/orcamentos.ts**
   - Adicionado `buildHistoricoEntries()`
   - Adicionado `calcularTotalOrcamento()`
   - Adicionado `formatHistoricoEntrada()`
   - Adicionado `agruparHistoricoPorDia()`
   - Adicionado `ultimasEntradasHistorico()`
   - Exportado no `orcamentosService`

2. **src/budgets.ts**
   - Importado `buildHistoricoEntries`
   - Modificado `saveOrc()` para chamar history builder
   - Adicionado stubs `openHistorico()` e `closeHistorico()`
   - Exportado no window object

3. **dist/app.html**
   - Adicionada página `pg-historico` (após pg-termos)
   - Adicionadas funções JS: `openHistorico()`, `closeHistorico()`, etc
   - Modificada `_buildCardMenu()` para incluir botão Histórico
   - Adicionado SVG icon `ico-history`

4. **src/types.ts**
   - Adicionada interface `HistoricoOrcamentoEntry`
   - Adicionado campo `historico?: HistoricoOrcamentoEntry[]` em `Orcamento`

---

## ✅ Checklist de Implementação

- [x] Interface `HistoricoOrcamentoEntry` criada
- [x] Função `buildHistoricoEntries()` implementada
- [x] Cálculo automático de total para histórico
- [x] Integração em `saveOrc()`
- [x] Página de visualização criada
- [x] Menu de ações adicionado
- [x] Ícone SVG adicionado
- [x] Funções de formatação implementadas
- [x] Funções de agrupamento implementadas
- [x] Armazenamento em histórico
- [x] Dark mode compatible
- [x] Responsivo para mobile

---

## 🚀 Próximas Melhorias (Opcionais)

1. **Timeline Visual** - Mostrar histórico em timeline interativa com linha vertical
2. **Comparativo Side-by-Side** - Ver orçamento em estado anterior vs atual
3. **Filtro por Campo** - Mostrar apenas mudanças de um campo específico
4. **Reverter Mudanças** - Botão para reverter a versão anterior
5. **Exportar Relatório** - Gerar PDF com histórico completo
6. **Multi-user Attribution** - Mostrar quem fez cada mudança
7. **Notificações** - Alert quando orçamento muda (para time)
8. **Auditoria Completa** - Log de todas as ações, não apenas mudanças de campo

---

## 🎉 Conclusão

Sprint 6 implementa rastreamento automático e completo de todas as mudanças em orçamentos. Cada editando é gravado com timestamp, campo alterado, valores anterior/novo. A visualização é simples, clara, e integrada ao menu existente.

A implementação segue padrão production-ready com:
- ✅ Tipos TypeScript completos
- ✅ Formatação em português
- ✅ UX clara e intuitiva
- ✅ Performance sem overhead
- ✅ Pronto para expansão futura

---

**Status Final**: ✅ CONCLUÍDO E PRONTO PARA USO  
**Tempo Estimado de Implementação**: ~2-3 horas  
**Complexidade**: Média (detecção + persistência + UI)

