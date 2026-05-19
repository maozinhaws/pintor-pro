export const STORAGE_DB_NAME = 'pintor-plus';
export const STORAGE_SCHEMA_VERSION = 2;

export const LEGACY_LOCAL_STORAGE_KEYS = [
  'pp-orcs',
  'pp-clientes',
  'pp-fornecedores',
  'pp-eventos',
  'pp-config',
  'orcamento-pocket-draft',
] as const;

export const LEGACY_SESSION_STORAGE_KEYS = [
  'pp-orcs-emergency',
  'pp-orcs-mirror',
] as const;

export const ALLOWED_BROWSER_STORAGE_KEYS = [
  'pp-theme',
  'pp-terms',
  'pp-pwa-dismissed',
  'pp-premium-dismissed',
] as const;

export const STORE_NAMES = {
  meta: 'app_meta',
  orcamentos: 'orcamentos',
  clientes: 'clientes',
  fornecedores: 'fornecedores',
  eventos: 'eventos',
  config: 'config',
  media: 'media',
  syncQueue: 'sync_queue',
  feedback: 'feedback_reports',
  fotos: 'fotos', // NEW: fotos como Blob
  recibos: 'recibos', // NEW: recibos de pagamento
} as const;

