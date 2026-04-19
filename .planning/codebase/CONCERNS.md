# Concerns & Technical Debt - Pintor Plus

## Security Concerns

### Client-Side Data Protection
- **Encryption limitations**: `_Vault` provides client-side encryption but key management is not robust
- **localStorage exposure**: Sensitive data in localStorage can be accessed via XSS
- **No secure HTTP**: Data transmitted without additional encryption layer over HTTPS

### OAuth Token Handling
- Token stored in memory only (lost on page refresh)
- No refresh token persistence
- Silent reconnection depends on JavaScript state

### Input Validation
- Basic HTML escaping (`_esc()`) but limited sanitization
- URL validation exists but may have edge cases
- No server-side validation (client-only app)

## Performance Concerns

### Large File Size
- **app_script.js**: ~4,300 lines, ~240KB (single large file)
- **app.html**: ~500KB (entire UI in one file)
- No code splitting or lazy loading for initial bundle
- All JavaScript loads on initial page load

### Memory Usage
- Global `S` object stores all data in memory
- No pagination for large datasets (budgets, clients, events)
- DOM manipulation without virtual DOM can cause reflows

### Storage
- localStorage has ~5-10MB limit
- No automatic cleanup of old data
- sessionStorage fallback exists but ad-hoc

## Scalability Concerns

### Data Model
- No database indexing (plain JSON arrays)
- Linear search for all operations
- No query capabilities beyond basic filtering

### Offline-First Limitations
- Sync queue can grow large
- Conflict resolution is basic (last-write-wins)
- No offline undo/redo for operations

### Google Drive API
- No pagination for file listing
- Rate limiting not handled gracefully
- Single file per data type (no sharding)

## Technical Debt

### Code Organization
- Single monolithic JavaScript file
- No module system (ES6 modules, CommonJS)
- Global namespace pollution
- No clear separation of concerns

### Architecture
- No testing framework
- No linting/formatting tools
- No build pipeline
- No TypeScript or static typing

### UI/UX Debt
- Mixed Portuguese/English in code
- Inconsistent naming conventions
- Some CSS inline or scattered
- Accessibility partially implemented

### Data Management
- IndexedDB (Dexie) added but inconsistent usage
- Dual storage patterns (localStorage + Dexie)
- Migration paths unclear

## Known Issues

### Recent Fixes (from git history)
- Login loop in Google auth flow (ctos/fix-login-loop)
- GDrive state management issues
- Keyboard handling in PDF modal

### Potential Issues
- Complex nested async operations in sync logic
- Race conditions in background sync
- Error handling not comprehensive

## Recommendations

### High Priority
1. Add automated testing framework
2. Implement proper error boundaries
3. Add loading states for all async operations

### Medium Priority
4. Split app_script.js into modules
5. Add pagination for lists
6. Implement proper logging
7. Add CI/CD pipeline

### Lower Priority
8. Migrate to TypeScript
9. Add end-to-end tests
10. Improve accessibility
11. Add comprehensive error messages

## Dependencies Risk

### Third-Party Libraries
- **dexie**: IndexedDB wrapper (recently added, still integrating)
- **lucide-react**: Icons (lightweight)
- **pdfmake**: PDF generation (reliable, widely used)

### External APIs
- Google Drive API: Stable
- Google Maps Places API: Stable
- No backup if APIs change

## Browser Compatibility

### Supported Browsers
- Chrome/Edge 80+
- Firefox 75+
- Safari 14+
- Mobile Chrome/Safari

### Known Limitations
- Service Worker not in all browsers
- Background Sync API limited
- Push Notifications require HTTPS