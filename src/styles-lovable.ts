/**
 * Lovable Design System - Integrated from Obras Rápido
 * Modern, professional UI/UX with glass morphism and brutal design
 */

export const LOVABLE_DESIGN = `
/* Lovable Color Palette */
:root {
  --brand: #ff6b35;
  --brand-2: #7b5cff;
  --bl: #ff6b35;
  --bld: #ff6b35;
  --bll: #fff3e0;
  --ink: #111111;
  --ink2: #374151;
  --ink3: #6b7280;
  --success: #16a34a;
  --warning: #f59e0b;
  --destructive: #ef4444;
  --bg: #f4f4f6;
  --bg2: #f4f4f6;
  --bg-input: #ffffff;
  --bg-card: #ffffff;
  --bg-modal: #ffffff;
  --bdr: #ececef;
  --bdr-input: #e5e7eb;
  --sh: 0 8px 30px rgba(0, 0, 0, 0.04);
  --radius-sm: 10px;
  --radius-md: 16px;
  --radius-lg: 24px;
  --radius-xl: 28px;
}

/* Dark Theme - Lovable Dark */
:root[data-theme="escuro"],
:root.dark {
  --brand: #ff6b35;
  --brand-2: #7b5cff;
  --bl: #7b5cff;
  --bld: #7b5cff;
  --bll: #4c1d95;
  --ink: #ededf0;
  --ink2: #d1d5db;
  --ink3: #9aa0aa;
  --success: #16a34a;
  --warning: #f59e0b;
  --destructive: #ef4444;
  --bg: #0b0d12;
  --bg2: #1c2027;
  --bg-input: #14171d;
  --bg-card: #14171d;
  --bg-modal: #14171d;
  --bdr: #262932;
  --bdr-input: #3f4451;
  --sh: 0 8px 30px rgba(0, 0, 0, 0.4);
}

/* Fonts */
html, body {
  font-family: 'Manrope', 'Sora', system-ui, sans-serif;
}

h1, h2, h3, h4, h5, h6 {
  font-family: 'Sora', system-ui, sans-serif;
  letter-spacing: -0.02em;
}

/* Glass Morphism */
.glass {
  background: var(--bg-card);
  border: 1px solid var(--bdr);
  border-radius: 0 32px 32px 32px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.04);
}

.glass-strong {
  background: var(--bg-card);
  border: 1px solid var(--bdr);
  border-radius: 0 32px 32px 32px;
  box-shadow: 0 14px 40px rgba(0, 0, 0, 0.06);
}

:root[data-theme="escuro"] .glass,
:root.dark .glass {
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4);
}

:root[data-theme="escuro"] .glass-strong,
:root.dark .glass-strong {
  box-shadow: 0 14px 40px rgba(0, 0, 0, 0.5);
}

.glass-brand {
  background: linear-gradient(135deg, #ff6b35 0%, #ff6b35 45%, #7b5cff 100%);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 36px 0 36px 36px;
  color: #ffffff;
  box-shadow: 0 20px 50px -15px rgba(123, 92, 255, 0.35);
}

.glass-brand-glow {
  position: relative;
  isolation: isolate;
}

.glass-brand-glow::before {
  content: "";
  position: absolute;
  inset: -2px;
  border-radius: inherit;
  background: linear-gradient(135deg, #ff6b35, #7b5cff);
  filter: blur(22px);
  opacity: 0.22;
  z-index: -1;
  pointer-events: none;
}

.glass-press {
  transition: transform 150ms cubic-bezier(.2,.8,.2,1), box-shadow 150ms ease;
}

.glass-press:active {
  transform: scale(0.98);
}

/* Brutal Design */
.brutal-border {
  border: 1px solid var(--bdr);
  border-radius: var(--radius-md);
}

.brutal-border-thin {
  border: 1px solid var(--bdr);
  border-radius: var(--radius-md);
}

.brutal-shadow {
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.06);
}

.brutal-shadow-brand {
  box-shadow: 0 20px 50px -15px rgba(123, 92, 255, 0.35);
}

.brutal-shadow-sm {
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.05);
}

.brutal-press {
  transition: transform 120ms cubic-bezier(.2,.8,.2,1), box-shadow 120ms ease;
}

.brutal-press:active {
  transform: scale(0.98);
}

/* Buttons */
.btn-dark {
  background: #0a0a0a;
  color: #ffffff;
  border-radius: 9999px;
  padding: 0.75rem 1.5rem;
  font-weight: 700;
  font-size: 0.8rem;
  transition: background 150ms ease, transform 100ms ease;
  border: none;
  cursor: pointer;
}

.btn-dark:hover {
  background: #1f1f1f;
}

.btn-dark:active {
  transform: scale(0.97);
}

:root[data-theme="escuro"] .btn-dark,
:root.dark .btn-dark {
  background: #ededf0;
  color: #0b0d12;
}

:root[data-theme="escuro"] .btn-dark:hover,
:root.dark .btn-dark:hover {
  background: #ffffff;
}

/* Text Utilities */
.text-display {
  font-family: 'Sora', system-ui, sans-serif;
  font-weight: 800;
  letter-spacing: -0.025em;
}

.text-mono {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
}

.text-brand {
  color: var(--brand);
}

.text-brand-2 {
  color: var(--brand-2);
}

.bg-brand {
  background-color: var(--brand);
}

.bg-brand-2 {
  background-color: var(--brand-2);
}

/* Hide Lovable Badge */
#lovable-badge,
#lovable-badge-v2,
[id^="lovable-badge"],
a[href*="lovable.dev"][target="_blank"] {
  display: none !important;
}

/* Accessibility */
:root[data-fonte="pequeno"] {
  font-size: 14px;
}

:root[data-fonte="normal"] {
  font-size: 16px;
}

:root[data-fonte="grande"] {
  font-size: 18px;
}

:root[data-contraste="alto"] {
  --ink: #000000;
  --ink2: #1f1f1f;
  --bdr: #000000;
}

/* Selection */
::selection {
  background-color: var(--brand);
  color: #ffffff;
}
`;

// Inject styles into document
export function injectLovableStyles() {
  const style = document.createElement('style');
  style.textContent = LOVABLE_DESIGN;
  style.id = 'lovable-design-system';
  document.head.appendChild(style);
}

// Call on app load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectLovableStyles);
} else {
  injectLovableStyles();
}
