# Code Conventions - Pintor Plus

## Naming Conventions

### Functions
- **camelCase**: All function names use camelCase
  - Example: `toast()`, `ptFloat()`, `getRoomMeds()`, `loadGoogleMaps()`
- **Prefix underscore (`_`)**: Internal/helper functions use underscore prefix
  - Example: `_ico()`, `_tt()`, `_ppRead()`, `_esc()`, `_Vault`
- **Portuguese names**: Business logic functions often use Portuguese
  - Example: `orcamento`, `cliente`, `fornecedor`, `evento`

### Variables
- **camelCase**: Variable names use camelCase
  - Example: `isDirty`, `curStep`, `editId`, `GMAPS_KEY`
- **Global state**: Single uppercase `S` object holds all application state
- **Constants**: Uppercase with underscore
  - Example: `defCfg`, `GMAPS_KEY`

### HTML Elements
- **ID-based targeting**: Elements accessed by ID attributes
  - Example: `pg-orc`, `pg-clientes`, `cli-logradouro`, `toast`
- **Class-based styling**: CSS classes for presentation
  - Example: `ico`, `hbg`, `hbb`, `hbr`, `hby` (status badges)

## Code Structure

### Global Scope
- Single large file (`app_script.js`) with all business logic
- No module bundling or ES6 modules
- All functions are globally accessible
- State managed through global `S` object

### Function Organization (app_script.js)
```
Lines 1-50:    Utility functions and global constants
Lines 50-150:  Google Maps integration
Lines 150-250: Notification and alarm systems
Lines 250-400: Navigation and UI state management
Lines 400-800: Budget creation and management logic
Lines 800-1500: Room/item management
Lines 1500-2000: Client management
Lines 2000-2500: Supplier management
Lines 2500-3000: Scheduling and events
Lines 3000-3500: Settings and configuration
Lines 3500-4000: Google Drive integration
Lines 4000-4300: Vault encryption layer and initialization
```

### HTML Organization (app.html)
- Single-page application with hash-based routing
- All pages defined in one HTML file with `display:none` toggling
- Inline SVG icons defined in HTML
- Modals defined as hidden elements

## Coding Patterns

### State Management
```javascript
// Global state object
const S = {
  orcs: [],           // Budgets
  clientes: [],      // Clients
  fornecedores: [],  // Suppliers
  eventos: [],        // Events
  config: {},        // Configuration
  isDirty: false     // Change tracking
};
```

### Storage Pattern
```javascript
// Read with fallback
function _ppRead(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch(e) { return fallback; }
}

// Save with error handling
function _saveOrcs() {
  try { _Vault.save('pp-orcs', JSON.stringify(S.orcs)); }
  catch(e) { /* fallback */ }
}
```

### DOM Manipulation
- Direct document.getElementById() access
- Function-based rendering (not reactive)
- Event delegation for dynamic elements

### Error Handling
- Try-catch for storage operations
- Toast notifications for user feedback
- Fallback to sessionStorage when localStorage fails

## Style Conventions

### CSS
- CSS custom properties for theming
- Utility classes (e.g., `hbg`, `hbb`, `hbr`, `hby` for status badges)
- Mobile-first responsive design
- Flexbox and Grid for layouts

### HTML
- Semantic HTML5 elements
- Inline SVG for icons
- Accessibility attributes (aria-hidden, role)

## Security Patterns

### Input Sanitization
```javascript
function _esc(s) {
  return String(s||'')
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#39;');
}
```

### URL Validation
```javascript
function _safeUrl(u) {
  try { const p = new URL(u); return (p.protocol==='https:'||p.protocol==='http:') ? u : ''; }
  catch(e) { return ''; }
}
```

### Encryption
- `_Vault` module for client-side data encryption
- Encrypted data stored in localStorage with `pp-` prefix

## Git Conventions

### Commit Messages
- Portuguese language
- Type prefixes: `fix:`, `feat:`, `refactor:`, `chore:`
- Example: `fix: prevent Google auth login loop`

### Branch Naming
- Feature branches: `feat/feature-name`
- Bug fixes: `cto/fix-description`
- Example: `cto/fix-login-loop-gdrive-auth-flow`

## Build & Deployment

### Dependencies
- Minimal package.json (only dexie, lucide-react, pdfmake)
- No build scripts (vanilla JS)
- Vercel for static hosting

### PWA
- Service worker: `sw.js`
- Manifest: `site.webmanifest`
- Offline-first architecture