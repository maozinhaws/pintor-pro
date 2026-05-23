/**
 * Backup validator — valida e sanitiza arquivos de importação
 *
 * Protege contra:
 *   - XSS via campos string com HTML/script
 *   - Prototype pollution (__proto__, constructor, prototype)
 *   - Tipos incorretos que podem crashar o app
 *   - Arquivos excessivamente grandes
 *   - Versões de schema desconhecidas
 *   - Campos numéricos com valores absurdos (injeção financeira)
 */

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB
const MAX_STRING_LENGTH = 4096;
const MAX_OBS_LENGTH = 10000;
const MAX_ITEMS = 2000;
const ALLOWED_VERSIONS = [1, 2];

// ── String sanitization ───────────────────────────────────────────────────────

// Remove tags HTML, scripts e atributos inline
function stripHTML(value: string): string {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/on\w+\s*=\s*[^\s>]*/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/javascript\s*:/gi, '')
    .replace(/data\s*:/gi, '')
    .trim();
}

function safeStr(val: unknown, maxLen = MAX_STRING_LENGTH, allowEmpty = true): string {
  if (val === null || val === undefined) return '';
  const s = String(val).slice(0, maxLen * 2); // trunca antes de sanitizar
  const clean = stripHTML(s).slice(0, maxLen);
  if (!allowEmpty && !clean) return '';
  return clean;
}

function safeNum(val: unknown, min = 0, max = 99_999_999): number {
  const n = Number(val);
  if (!isFinite(n) || isNaN(n)) return 0;
  return Math.max(min, Math.min(max, n));
}

function safeBool(val: unknown): boolean {
  return val === true || val === 1 || val === 'true';
}

// Detecta tentativa de prototype pollution
function hasPollutionKeys(obj: unknown): boolean {
  if (typeof obj !== 'object' || obj === null) return false;
  const dangerous = ['__proto__', 'constructor', 'prototype'];
  const keys = Object.keys(obj as object);
  return keys.some(k => dangerous.includes(k));
}

// Recursivo para detectar pollution em objetos aninhados
function deepCheckPollution(val: unknown, depth = 0): boolean {
  if (depth > 10) return false;
  if (typeof val !== 'object' || val === null) return false;
  if (hasPollutionKeys(val)) return true;
  if (Array.isArray(val)) return val.some(v => deepCheckPollution(v, depth + 1));
  return Object.values(val as object).some(v => deepCheckPollution(v, depth + 1));
}

// ── Entity validators ─────────────────────────────────────────────────────────

function validateOrcamento(raw: any): any {
  if (typeof raw !== 'object' || raw === null) return null;
  const rooms = Array.isArray(raw.rooms) ? raw.rooms.slice(0, 200).map(validateRoom).filter(Boolean) : [];
  return {
    id:           safeStr(raw.id, 64) || `orc-${Date.now()}`,
    ts:           safeNum(raw.ts, 0, 9_999_999_999_999),
    tsEdit:       safeNum(raw.tsEdit, 0, 9_999_999_999_999),
    nome:         safeStr(raw.nome, 200),
    tel:          safeStr(raw.tel, 30),
    email:        safeStr(raw.email, 200),
    end:          safeStr(raw.end, 500),
    cpf:          safeStr(raw.cpf, 30),
    obs:          safeStr(raw.obs, MAX_OBS_LENGTH),
    date:         safeStr(raw.date, 20),
    inicio:       safeStr(raw.inicio, 30),
    valid:        safeNum(raw.valid, 0, 3650),
    status:       safeStr(raw.status, 60),
    preco:        safeNum(raw.preco, 0, 99_999_999),
    tipoServico:  safeStr(raw.tipoServico, 200),
    pgto:         Array.isArray(raw.pgto)
                    ? raw.pgto.slice(0, 20).map((p: unknown) => safeStr(p, 100))
                    : safeStr(raw.pgto, 200),
    rooms,
    isDraft:      safeBool(raw.isDraft),
    isFlashDraft: safeBool(raw.isFlashDraft),
    clienteId:    safeStr(raw.clienteId, 64),
  };
}

function validateRoom(raw: any): any {
  if (typeof raw !== 'object' || raw === null) return null;
  const items = Array.isArray(raw.items) ? raw.items.slice(0, 200).map(validateItem).filter(Boolean) : [];
  return {
    id:         safeStr(raw.id, 64) || `rm-${Date.now()}`,
    name:       safeStr(raw.name, 200),
    alt:        safeNum(raw.alt, 0, 9999),
    comp:       safeNum(raw.comp, 0, 9999),
    preco:      safeNum(raw.preco, 0, 99_999_999),
    precoPerM2: safeBool(raw.precoPerM2),
    collapsed:  safeBool(raw.collapsed),
    services:   Array.isArray(raw.services)
                  ? raw.services.slice(0, 100).map((s: unknown) => safeStr(s, 100))
                  : [],
    items,
    fotos:      Array.isArray(raw.fotos)
                  ? raw.fotos.slice(0, 50).map((f: unknown) => {
                      const s = safeStr(f, 2_000_000);
                      // Apenas data URLs de imagem são aceitos
                      return s.startsWith('data:image/') ? s : '';
                    }).filter(Boolean)
                  : [],
  };
}

function validateItem(raw: any): any {
  if (typeof raw !== 'object' || raw === null) return null;
  return {
    id:       safeStr(raw.id, 64) || `it-${Date.now()}`,
    name:     safeStr(raw.name, 200),
    alt:      safeNum(raw.alt, 0, 9999),
    comp:     safeNum(raw.comp, 0, 9999),
    price:    safeNum(raw.price, 0, 99_999_999),
    perMeter: safeBool(raw.perMeter),
    obs:      safeStr(raw.obs, 2000),
    fotos:    Array.isArray(raw.fotos)
                ? raw.fotos.slice(0, 20).map((f: unknown) => {
                    const s = safeStr(f, 2_000_000);
                    return s.startsWith('data:image/') ? s : '';
                  }).filter(Boolean)
                : [],
  };
}

function validateCliente(raw: any): any {
  if (typeof raw !== 'object' || raw === null) return null;
  return {
    id:    safeStr(raw.id, 64) || `cli-${Date.now()}`,
    ts:    safeNum(raw.ts, 0, 9_999_999_999_999),
    nome:  safeStr(raw.nome, 200),
    tel:   safeStr(raw.tel, 30),
    email: safeStr(raw.email, 200),
    end:   safeStr(raw.end, 500),
    cpf:   safeStr(raw.cpf, 30),
    obs:   safeStr(raw.obs, 2000),
  };
}

function validateFornecedor(raw: any): any {
  if (typeof raw !== 'object' || raw === null) return null;
  return {
    id:      safeStr(raw.id, 64) || `forn-${Date.now()}`,
    ts:      safeNum(raw.ts, 0, 9_999_999_999_999),
    nome:    safeStr(raw.nome, 200),
    tel:     safeStr(raw.tel, 30),
    email:   safeStr(raw.email, 200),
    end:     safeStr(raw.end, 500),
    servico: safeStr(raw.servico, 300),
    obs:     safeStr(raw.obs, 2000),
  };
}

function validateEvento(raw: any): any {
  if (typeof raw !== 'object' || raw === null) return null;
  return {
    id:       safeNum(raw.id, 0, 9_999_999_999_999),
    tit:      safeStr(raw.tit, 300),
    dat:      safeStr(raw.dat, 20),
    hora:     safeStr(raw.hora, 10),
    avisoVal: safeStr(raw.avisoVal, 10),
    avisoUnid:safeStr(raw.avisoUnid, 20),
    repete:   safeStr(raw.repete, 30),
    alarmado: safeBool(raw.alarmado),
    tsEdit:   safeNum(raw.tsEdit, 0, 9_999_999_999_999),
  };
}

function validateConfig(raw: any): any {
  if (typeof raw !== 'object' || raw === null) return {};
  return {
    empresa:         safeStr(raw.empresa, 200),
    tel:             safeStr(raw.tel, 30),
    emailEmpresa:    safeStr(raw.emailEmpresa, 200),
    endEmpresa:      safeStr(raw.endEmpresa, 500),
    doc:             safeStr(raw.doc, 50),
    msg:             safeStr(raw.msg, 2000),
    servicos:        safeStr(raw.servicos, 5000),
    pgto:            safeStr(raw.pgto, 500),
    statusList:      safeStr(raw.statusList, 500),
    logo:            (() => {
                       const l = safeStr(raw.logo, 2_000_000);
                       // Logo: apenas data:image/* ou URL https (sem javascript:)
                       if (l.startsWith('data:image/')) return l;
                       if (l.startsWith('https://')) return l;
                       return '';
                     })(),
    assinatura:      (() => {
                       const a = safeStr(raw.assinatura, 2_000_000);
                       return a.startsWith('data:image/') ? a : '';
                     })(),
    flashNomes:      safeStr(raw.flashNomes, 2000),
    flashServicos:   safeStr(raw.flashServicos, 2000),
    flashMateriais:  safeStr(raw.flashMateriais, 2000),
    skipDelConfirm:  safeBool(raw.skipDelConfirm),
    skipDirtyConfirm:safeBool(raw.skipDirtyConfirm),
    acessibilidade:  safeBool(raw.acessibilidade),
  };
}

// ── Main export ───────────────────────────────────────────────────────────────

export interface ValidationResult {
  ok: boolean;
  error?: string;
  data?: {
    versao: number;
    config: any;
    orcs: any[];
    clientes: any[];
    fornecedores: any[];
    eventos: any[];
  };
  warnings: string[];
}

export function validateBackup(raw: unknown, fileSizeBytes = 0): ValidationResult {
  const warnings: string[] = [];

  // 1. Tamanho
  if (fileSizeBytes > MAX_FILE_SIZE_BYTES) {
    return { ok: false, error: `Arquivo muito grande (${(fileSizeBytes / 1024 / 1024).toFixed(1)} MB). Máximo: 50 MB.`, warnings };
  }

  // 2. Estrutura básica
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return { ok: false, error: 'Formato inválido: o arquivo não é um objeto JSON válido.', warnings };
  }

  const obj = raw as Record<string, unknown>;

  // 3. Prototype pollution
  if (deepCheckPollution(obj)) {
    return { ok: false, error: 'Arquivo rejeitado: conteúdo potencialmente malicioso detectado.', warnings };
  }

  // 4. Versão
  const versao = Number(obj.versao);
  if (!ALLOWED_VERSIONS.includes(versao)) {
    warnings.push(`Versão de backup desconhecida (${obj.versao}). Tentando importar mesmo assim.`);
  }

  // 5. Campos obrigatórios
  if (!Array.isArray(obj.orcs)) {
    return { ok: false, error: 'Campo "orcs" ausente ou inválido.', warnings };
  }
  if (typeof obj.config !== 'object' || obj.config === null) {
    return { ok: false, error: 'Campo "config" ausente ou inválido.', warnings };
  }

  // 6. Limites de quantidade
  const orcsRaw = (obj.orcs as unknown[]).slice(0, MAX_ITEMS);
  const clientesRaw = Array.isArray(obj.clientes) ? (obj.clientes as unknown[]).slice(0, MAX_ITEMS) : [];
  const fornsRaw = Array.isArray(obj.fornecedores) ? (obj.fornecedores as unknown[]).slice(0, MAX_ITEMS) : [];
  const evtsRaw = Array.isArray(obj.eventos) ? (obj.eventos as unknown[]).slice(0, MAX_ITEMS) : [];

  if ((obj.orcs as unknown[]).length > MAX_ITEMS) {
    warnings.push(`Backup contém mais de ${MAX_ITEMS} orçamentos. Somente os primeiros ${MAX_ITEMS} serão importados.`);
  }

  // 7. Validar e sanitizar cada entidade
  const orcs = orcsRaw.map(validateOrcamento).filter(Boolean);
  const clientes = clientesRaw.map(validateCliente).filter(Boolean);
  const fornecedores = fornsRaw.map(validateFornecedor).filter(Boolean);
  const eventos = evtsRaw.map(validateEvento).filter(Boolean);
  const config = validateConfig(obj.config);

  if (orcs.length === 0 && (obj.orcs as unknown[]).length > 0) {
    warnings.push('Nenhum orçamento válido encontrado após validação.');
  }

  return {
    ok: true,
    data: { versao: versao || 1, config, orcs, clientes, fornecedores, eventos },
    warnings,
  };
}

// ── Register on window ────────────────────────────────────────────────────────

export function registerBackupValidatorOnWindow(): void {
  (window as any).validateBackup = validateBackup;
}
