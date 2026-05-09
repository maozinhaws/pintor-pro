# DESIGN_AND_AUDIO — Pintor Plus MVP

> **Criado:** 2026-05-02  
> **Contexto:** Sistema de notas de voz para orçamentos e visitas técnicas

---

## Problema

Pintor durante visita técnica precisa registrar observações sem parar para digitar.
Casos de uso:
- Gravar nota rápida ao inspecionar cômodo ("parede com mofo na divisa, tratar antes de pintar")
- Anexar áudio a um item do orçamento como evidência
- Transcrever automaticamente para preencher campo de descrição

---

## Decisões de Design

| Decisão | Escolha | Motivo |
|---------|---------|--------|
| Armazenamento de blob | **IndexedDB** | localStorage não aceita binário; IndexedDB suporta Blob diretamente |
| Formato de gravação | `audio/webm;codecs=opus` → fallback `audio/ogg;codecs=opus` → `audio/mp4` | Compatibilidade Android (webm) + iOS (mp4) |
| Transcrição | **Web Speech API** (`SpeechRecognition`) em tempo real; sem cloud | Gratuito, offline parcial no Android, sem envio de áudio a servidores |
| Limite por nota | **60 segundos** (soft cap via UI) | Evitar IndexedDB crescer sem controle; suficiente para nota de campo |
| Vínculo ao orçamento | `audioRefs: string[]` no objeto `Orcamento` | IDs de registros IndexedDB; áudio vive separado do JSON |

---

## Fluxo: Gravado → Transcrito → Erro

```
[Usuário toca 🎙️]
      │
      ▼
getUserMedia({ audio: true })
      │
  ┌───┴──────────────┐
  │ SUCESSO          │ ERRO (negado / sem mic)
  ▼                  ▼
MediaRecorder      mostrar erro_mic
start()            e sair
      │
      │ SpeechRecognition.start() em paralelo
      │
      ▼
[Usuário toca ⏹️ ou 60s]
      │
      ├─ MediaRecorder.stop() → ondataavailable → Blob
      ├─ SpeechRecognition.stop()
      │
      ▼
saveAudioBlob(blob) → IndexedDB
      │
  ┌───┴──────────────┐
  │ SUCESSO          │ ERRO (quota)
  ▼                  ▼
audioId salvo     toast erro_storage
em orcamento      + oferecer download do Blob
      │
      ▼
transcrição (se disponível) → preenche campo descrição
```

---

## Código: Módulo AudioRecorder

```typescript
// src/audio.ts

export interface AudioRecord {
  id: string;
  orcId: string;       // orçamento vinculado
  itemId?: string;     // item específico (opcional)
  blob: Blob;
  mimeType: string;
  duration: number;    // segundos
  transcript?: string;
  createdAt: number;   // Date.now()
}

const DB_NAME = 'pp-audio';
const DB_VER  = 1;
const STORE   = 'recordings';

let _db: IDBDatabase | null = null;

async function openDB(): Promise<IDBDatabase> {
  if (_db) return _db;
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VER);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' });
        store.createIndex('orcId', 'orcId', { unique: false });
      }
    };
    req.onsuccess = () => { _db = req.result; resolve(_db); };
    req.onerror   = () => reject(req.error);
  });
}

export async function saveAudio(record: AudioRecord): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(record);
    tx.oncomplete = () => resolve();
    tx.onerror    = () => reject(tx.error);
  });
}

export async function getAudiosByOrc(orcId: string): Promise<AudioRecord[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE, 'readonly');
    const index = tx.objectStore(STORE).index('orcId');
    const req   = index.getAll(orcId);
    req.onsuccess = () => resolve(req.result as AudioRecord[]);
    req.onerror   = () => reject(req.error);
  });
}

export async function deleteAudio(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror    = () => reject(tx.error);
  });
}

// Estima espaço usado em bytes (aproximado)
export async function estimateAudioStorageBytes(): Promise<number> {
  if (navigator.storage?.estimate) {
    const { usage } = await navigator.storage.estimate();
    return usage ?? 0;
  }
  return 0;
}
```

---

## Código: Gravação com MediaRecorder

```typescript
// src/audioRecorder.ts

import { saveAudio, type AudioRecord } from './audio';
import { toast } from './utils';

function pickMimeType(): string {
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/ogg;codecs=opus',
    'audio/webm',
    'audio/mp4',
  ];
  return candidates.find(t => MediaRecorder.isTypeSupported(t)) ?? '';
}

export interface RecorderState {
  recorder:   MediaRecorder | null;
  stream:     MediaStream | null;
  chunks:     BlobPart[];
  startedAt:  number;
  transcript: string;
  recognition: SpeechRecognition | null;
}

export const RS: RecorderState = {
  recorder: null, stream: null, chunks: [],
  startedAt: 0, transcript: '', recognition: null,
};

export async function startRecording(
  orcId: string,
  onTranscript: (t: string) => void,
): Promise<void> {
  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch (err) {
    // Permissão negada ou mic indisponível
    const msg = (err instanceof DOMException && err.name === 'NotAllowedError')
      ? 'Permissão de microfone negada. Habilite nas configurações do navegador.'
      : 'Microfone não encontrado ou indisponível.';
    toast(`<svg class="ico" aria-hidden="true"><use href="#ico-alert"/></svg> ${msg}`);
    throw err;
  }

  const mimeType = pickMimeType();
  const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);

  RS.stream    = stream;
  RS.recorder  = recorder;
  RS.chunks    = [];
  RS.startedAt = Date.now();
  RS.transcript = '';

  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) RS.chunks.push(e.data);
  };

  // Transcrição em tempo real via Web Speech API
  const SR = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
  if (SR) {
    const recog: SpeechRecognition = new SR();
    recog.lang = 'pt-BR';
    recog.continuous = true;
    recog.interimResults = true;
    recog.onresult = (ev: SpeechRecognitionEvent) => {
      let final = '';
      for (let i = 0; i < ev.results.length; i++) {
        if (ev.results[i].isFinal) final += ev.results[i][0].transcript + ' ';
      }
      RS.transcript = final.trim();
      onTranscript(RS.transcript);
    };
    recog.onerror = (ev: SpeechRecognitionErrorEvent) => {
      // Erros não-fatais: no-speech, audio-capture
      if (ev.error !== 'no-speech') {
        console.warn('SpeechRecognition error:', ev.error);
      }
    };
    RS.recognition = recog;
    recog.start();
  }

  recorder.start(250); // coleta chunks a cada 250ms para progresso visual
}

export async function stopRecording(
  orcId: string,
  itemId?: string,
): Promise<AudioRecord | null> {
  if (!RS.recorder || RS.recorder.state === 'inactive') return null;

  RS.recognition?.stop();

  return new Promise((resolve) => {
    RS.recorder!.onstop = async () => {
      const duration = (Date.now() - RS.startedAt) / 1000;
      const mimeType = RS.recorder!.mimeType || 'audio/webm';
      const blob     = new Blob(RS.chunks, { type: mimeType });

      RS.stream?.getTracks().forEach(t => t.stop());
      RS.stream = null;

      const record: AudioRecord = {
        id:         crypto.randomUUID(),
        orcId,
        itemId,
        blob,
        mimeType,
        duration,
        transcript: RS.transcript || undefined,
        createdAt:  Date.now(),
      };

      try {
        await saveAudio(record);
        resolve(record);
      } catch (err) {
        // Quota excedida: oferecer download manual
        toast(`<svg class="ico" aria-hidden="true"><use href="#ico-alert"/></svg> Armazenamento cheio. Áudio não salvo.`);
        // Baixar como fallback para o usuário não perder a gravação
        const url = URL.createObjectURL(blob);
        const a   = document.createElement('a');
        a.href     = url;
        a.download = `nota-voz-${Date.now()}.webm`;
        a.click();
        URL.revokeObjectURL(url);
        resolve(null);
      }
    };

    RS.recorder!.stop();
  });
}

export function cancelRecording(): void {
  RS.recognition?.stop();
  if (RS.recorder && RS.recorder.state !== 'inactive') {
    RS.recorder.onstop = null; // não salva
    RS.recorder.stop();
  }
  RS.stream?.getTracks().forEach(t => t.stop());
  RS.stream   = null;
  RS.recorder = null;
  RS.chunks   = [];
}
```

---

## Código: Player de Áudio

```typescript
// src/audioPlayer.ts — renderiza lista de gravações de um orçamento

import { getAudiosByOrc, deleteAudio, type AudioRecord } from './audio';
import { ico, toast } from './utils';

export async function renderAudioList(
  orcId: string,
  container: HTMLElement,
  onDelete?: (id: string) => void,
): Promise<void> {
  const records = await getAudiosByOrc(orcId);
  if (!records.length) {
    container.innerHTML = '<p class="empty">Nenhuma nota de voz.</p>';
    return;
  }

  container.innerHTML = records.map(r => {
    const min = String(Math.floor(r.duration / 60)).padStart(2, '0');
    const sec = String(Math.floor(r.duration % 60)).padStart(2, '0');
    const dt  = new Date(r.createdAt).toLocaleString('pt-BR');
    return `
      <div class="audio-item" data-id="${r.id}">
        <audio controls preload="none" src="${URL.createObjectURL(r.blob)}"
               aria-label="Nota de voz ${dt}"></audio>
        <div class="audio-meta">
          <span>${min}:${sec}</span>
          <span class="ink3">${dt}</span>
        </div>
        ${r.transcript
          ? `<p class="audio-transcript">"${r.transcript}"</p>`
          : ''}
        <button class="btn-icon del-audio" aria-label="Excluir nota de voz">
          ${ico('trash')}
        </button>
      </div>
    `;
  }).join('');

  container.querySelectorAll('.del-audio').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = (btn.closest('[data-id]') as HTMLElement)?.dataset.id;
      if (!id) return;
      await deleteAudio(id);
      toast('Nota de voz excluída.');
      onDelete?.(id);
      await renderAudioList(orcId, container, onDelete);
    });
  });
}
```

---

## Integração no Orçamento

Adicionar campo `audioRefs` ao tipo `Orcamento` (não armazena o blob, só o ID):

```typescript
// src/types.ts — adicionar ao tipo Orcamento existente
interface Orcamento {
  // ... campos existentes ...
  audioRefs?: string[];  // IDs de AudioRecord no IndexedDB
}
```

Ao salvar orçamento após gravação:

```typescript
import { stopRecording } from './audioRecorder';
import { S, saveOrcs } from './state';

async function handleStopAudio(orcId: string) {
  const record = await stopRecording(orcId);
  if (!record) return;

  const orc = S.orcs.find(o => o.id === orcId);
  if (orc) {
    orc.audioRefs = [...(orc.audioRefs ?? []), record.id];
    saveOrcs();
    // preenche campo descrição com transcrição se vazio
    if (record.transcript && !orc.obs) {
      orc.obs = record.transcript;
      saveOrcs();
    }
  }
}
```

---

## Tratamento de Erros — Matriz

| Cenário | Erro | Resposta UI |
|---------|------|-------------|
| Permissão negada | `DOMException: NotAllowedError` | Toast: "Permissão negada. Habilite nas configurações." |
| Sem microfone | `DOMException: NotFoundError` | Toast: "Microfone não encontrado." |
| Navegador não suporta | `navigator.mediaDevices === undefined` | Esconder botão 🎙️ antes de renderizar |
| IndexedDB cheio/quota | `DOMException: QuotaExceededError` | Toast + download automático do blob |
| SpeechRecognition não disponível | `SR === undefined` | Gravar sem transcrição (degradação elegante) |
| SpeechRecognition error: `no-speech` | Silencioso | Ignorar (comum em ambiente ruidoso) |
| SpeechRecognition error: outros | `console.warn` | Continuar gravação sem transcrição |

---

## Verificação de Suporte (antes de renderizar botão)

```typescript
export function isAudioSupported(): boolean {
  return !!(
    navigator.mediaDevices?.getUserMedia &&
    typeof MediaRecorder !== 'undefined'
  );
}

// No HTML, chamar antes de montar botão de gravação:
// if (!isAudioSupported()) btn.hidden = true;
```

---

## Estimativa de Armazenamento

- ~1 minuto de áudio `opus/webm` ≈ 30–60 KB
- IndexedDB quota típica: 500 MB–1 GB (50% do espaço livre)
- 1000 notas de 60s ≈ 60 MB — margem confortável

Exibir aviso ao usuário quando `estimateAudioStorageBytes() > 50_000_000` (50 MB).

---

## CSS Mínimo

```css
.audio-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px;
  border: 1px solid var(--bdr);
  border-radius: 8px;
  background: var(--bg2);
  margin-bottom: 8px;
}

.audio-item audio {
  width: 100%;
  height: 36px;
}

.audio-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--ink3);
}

.audio-transcript {
  font-size: 13px;
  color: var(--ink2);
  font-style: italic;
  margin: 0;
  padding: 6px 8px;
  background: var(--bll);
  border-radius: 6px;
}
```

---

## Roadmap Pós-MVP

| Fase | Feature |
|------|---------|
| v2 | Upload automático dos áudios para Google Drive ao sincronizar |
| v2 | Transcrição via API (Whisper/Google Speech) para maior precisão |
| v3 | Nota de voz no Orçamento Flash (campo rápido durante visita) |
| v3 | Exportar transcrições junto ao PDF do orçamento |
