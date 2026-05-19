import { toast } from './utils';

interface LensInfo {
  deviceId: string;
  label: string;
  tag: string;
}

let capturedPhotos: Blob[] = [];
let flash = false;
let zoom = 1;
let minZoom = 1;
let maxZoom = 1;
let zoomSupported = false;
let lenses: LensInfo[] = [];
let activeLensId: string | null = null;
let reviewIndex: number | null = null;
let flashing = false;

let videoRef: HTMLVideoElement | null = null;
let streamRef: MediaStream | null = null;
let trackRef: MediaStreamTrack | null = null;
let cameraCallback: ((photos: Blob[]) => void) | null = null;

function stopStream(): void {
  if (streamRef) {
    streamRef.getTracks().forEach(t => t.stop());
  }
  streamRef = null;
  trackRef = null;
}

async function startStream(deviceId?: string): Promise<void> {
  stopStream();
  const constraints: MediaStreamConstraints = {
    video: deviceId
      ? { deviceId: { exact: deviceId } }
      : { facingMode: { ideal: 'environment' } },
    audio: false,
  };

  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    streamRef = stream;
    if (videoRef) {
      videoRef.srcObject = stream;
    }
    const track = stream.getVideoTracks()[0];
    if (!track) throw new Error('No video track');
    trackRef = track;
    activeLensId = track.getSettings().deviceId || deviceId || null;

    const caps = (track.getCapabilities?.() || {}) as any;
    if (caps.zoom) {
      zoomSupported = true;
      minZoom = caps.zoom.min ?? 1;
      maxZoom = caps.zoom.max ?? 1;
      zoom = caps.zoom.min ?? 1;
      updateZoomDisplay();
    } else {
      zoomSupported = false;
    }
  } catch (err) {
    console.error('Camera error:', err);
    toast('<svg class="ico" aria-hidden="true"><use href="#ico-alert"/></svg> Erro ao acessar câmera');
    closeCamera();
  }
}

async function enumerateLenses(): Promise<void> {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cameras = devices.filter(d => d.kind === 'videoinput');
    const backCameras = cameras.filter(d =>
      /back|rear|environment|traseira/i.test(d.label)
    );
    const selected = (backCameras.length ? backCameras : cameras).slice(0, 3);

    lenses = selected.map((d, i) => {
      const label = d.label.toLowerCase();
      let tag = `${i + 1}x`;
      if (/ultra|wide|0\.5/.test(label)) tag = '0.5x';
      else if (/tele|2x|3x/.test(label)) tag = '2x';
      else if (i === 0) tag = '1x';
      return { deviceId: d.deviceId, label: d.label, tag };
    });
    updateLensButtons();
  } catch (err) {
    console.error('Enumerate devices error:', err);
  }
}

async function switchLens(deviceId: string): Promise<void> {
  try {
    await startStream(deviceId);
    updateLensButtons();
  } catch (e) {
    console.error('Lens switch failed', e);
  }
}

function toggleFlash(): void {
  flash = !flash;
  const btn = document.getElementById('camera-flash-btn');
  if (btn) {
    btn.style.backgroundColor = flash ? '#FBBF24' : '#FFFFFF';
    btn.style.color = flash ? '#000' : '#000';
  }
}

function setZoom(value: number): void {
  zoom = Math.max(minZoom, Math.min(maxZoom, value));
  if (trackRef && zoomSupported) {
    trackRef.applyConstraints({ advanced: [{ zoom }] } as any).catch(() => {});
  }
  updateZoomDisplay();
}

function updateZoomDisplay(): void {
  const slider = document.getElementById('camera-zoom-slider') as HTMLInputElement | null;
  if (slider) {
    slider.value = String(zoom);
    slider.min = String(minZoom);
    slider.max = String(maxZoom);
  }
  const label = document.getElementById('camera-zoom-label');
  if (label) {
    label.textContent = zoom.toFixed(1) + 'x';
  }
}

function updateLensButtons(): void {
  const container = document.getElementById('camera-lens-buttons');
  if (!container) return;

  container.innerHTML = lenses.map(lens =>
    `<button onclick="switchLens('${lens.deviceId}')"
      style="flex:1;height:40px;border-radius:10px;background:${activeLensId === lens.deviceId ? 'var(--bl)' : 'var(--bg-input)'};
      color:${activeLensId === lens.deviceId ? '#fff' : 'var(--ink)'};border:1.5px solid ${activeLensId === lens.deviceId ? 'var(--bl)' : 'var(--bdr-input)'};
      font-weight:700;font-size:12px;cursor:pointer;transition:all 0.2s;">
      ${lens.tag}
    </button>`
  ).join('');
}

async function capture(): Promise<void> {
  if (!videoRef || !videoRef.videoWidth) return;

  const track = trackRef;
  const caps = (track?.getCapabilities?.() || {}) as any;
  const hasTorch = !!caps.torch;

  if (flash && hasTorch && track) {
    try {
      await track.applyConstraints({ advanced: [{ torch: true }] } as any);
      await new Promise(r => setTimeout(r, 80));
    } catch {}
  } else if (flash && !hasTorch) {
    flashing = true;
    const overlay = document.getElementById('camera-flash-overlay');
    if (overlay) {
      overlay.style.opacity = '1';
      setTimeout(() => {
        if (overlay) overlay.style.opacity = '0';
        flashing = false;
      }, 150);
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = videoRef.videoWidth;
  canvas.height = videoRef.videoHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.drawImage(videoRef, 0, 0);

  canvas.toBlob((blob) => {
    if (track && hasTorch && flash) {
      try {
        track.applyConstraints({ advanced: [{ torch: false }] } as any).catch(() => {});
      } catch {}
    }
    if (!blob) return;
    capturedPhotos.push(blob);
    reviewIndex = capturedPhotos.length - 1;
    updateCameraUI();
  }, 'image/jpeg', 0.85);
}

function removePhoto(idx: number): void {
  capturedPhotos.splice(idx, 1);
  if (reviewIndex !== null) {
    if (capturedPhotos.length === 0) {
      reviewIndex = null;
    } else {
      reviewIndex = Math.min(reviewIndex, capturedPhotos.length - 1);
    }
  }
  updateCameraUI();
}

function nextPhoto(): void {
  if (reviewIndex === null) return;
  if (reviewIndex >= capturedPhotos.length - 1) {
    reviewIndex = null;
  } else {
    reviewIndex++;
  }
  updateCameraUI();
}

function prevPhoto(): void {
  if (reviewIndex === null || reviewIndex === 0) return;
  reviewIndex--;
  updateCameraUI();
}

function updateCameraUI(): void {
  const video = document.getElementById('camera-video') as HTMLVideoElement | null;
  const review = document.getElementById('camera-review-pane');
  const controls = document.getElementById('camera-controls');

  if (reviewIndex !== null && capturedPhotos.length > 0) {
    if (video) video.style.opacity = '0';
    if (review) {
      review.style.display = 'flex';
      const blob = capturedPhotos[reviewIndex];
      const preview = document.getElementById('camera-review-preview') as HTMLImageElement | null;
      if (preview && blob) {
        preview.src = URL.createObjectURL(blob);
      }
      const counter = document.getElementById('camera-review-counter');
      if (counter) {
        counter.textContent = `${reviewIndex + 1}/${capturedPhotos.length}`;
      }
    }
    if (controls) controls.style.display = 'none';
  } else {
    if (video) video.style.opacity = '1';
    if (review) review.style.display = 'none';
    if (controls) controls.style.display = 'flex';
  }
}

function finishCapture(): void {
  if (cameraCallback) {
    cameraCallback(capturedPhotos);
  }
  closeCamera();
}

function closeCamera(): void {
  stopStream();
  capturedPhotos = [];
  flash = false;
  zoom = 1;
  reviewIndex = null;
  const modal = document.getElementById('camera-modal');
  if (modal) modal.style.display = 'none';
}

async function openCamera(callback: (photos: Blob[]) => void): Promise<void> {
  cameraCallback = callback;
  capturedPhotos = [];
  reviewIndex = null;
  flash = false;

  const modal = document.getElementById('camera-modal');
  if (modal) modal.style.display = 'flex';

  videoRef = document.getElementById('camera-video') as HTMLVideoElement;

  try {
    await startStream();
    await enumerateLenses();
    updateZoomDisplay();
    updateCameraUI();
  } catch (err) {
    console.error('Failed to open camera:', err);
    closeCamera();
  }
}

// Expose on window
(window as any).openCamera = openCamera;
(window as any).closeCamera = closeCamera;
(window as any).toggleFlash = toggleFlash;
(window as any).setZoom = setZoom;
(window as any).capture = capture;
(window as any).switchLens = switchLens;
(window as any).nextPhoto = nextPhoto;
(window as any).prevPhoto = prevPhoto;
(window as any).removePhoto = removePhoto;
(window as any).finishCapture = finishCapture;

export { openCamera, closeCamera, capture };
