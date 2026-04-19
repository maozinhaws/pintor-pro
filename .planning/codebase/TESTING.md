# Testing - Pintor Plus

## Current Testing State

### Manual Testing
The project relies primarily on manual testing due to:
- Vanilla JavaScript (no test frameworks installed)
- Client-side only application
- No automated test suite in package.json

### Testing Utilities
The project includes several manual testing scripts:
- `check_all_scripts.js`: Validates all JavaScript files
- `check_balance.js` (v1-v3): Balance checking utilities
- `check_iframe_script.js`: iframe script checker
- `check_syntax.py`: Python syntax validation utility

## Areas Requiring Testing

### Critical Paths

#### Authentication Flow
- Google OAuth login flow
- Token refresh mechanism
- Session persistence across page reloads
- Silent reconnection when app regains focus

#### Data Synchronization
- Google Drive sync (up/down)
- Offline data persistence
- Conflict resolution (last-write-wins)
- Emergency storage fallback

#### Core Features
- Budget creation and calculation
- Room/item measurements
- Client management CRUD
- Supplier management CRUD
- Event scheduling
- PDF generation

### Edge Cases

#### Storage
- localStorage quota exceeded
- sessionStorage fallback
- Corrupted JSON data
- Encryption/decryption failures

#### Network
- Offline mode operations
- Sync failures
- Google API rate limits
- Timeout handling

#### Data Integrity
- Invalid measurements
- Missing required fields
- Duplicate entries
- Data migration scenarios

## Recommended Testing Strategy

### 1. Unit Tests
Add unit tests for utility functions:
- `ptFloat()`: Number parsing
- `getRoomMeds()`: Measurement calculations
- `_esc()`: HTML escaping
- `_safeUrl()`: URL validation

### 2. Integration Tests
Test critical integrations:
- Google OAuth flow
- Google Drive read/write
- IndexedDB (Dexie) operations
- PDF generation

### 3. E2E Tests
Test user flows:
- Complete budget creation flow
- Client CRUD workflow
- Event scheduling flow
- Offline-to-online sync

## Testing Tools

### Recommended Addictions
```json
{
  "devDependencies": {
    "vitest": "^2.0.0",
    "@playwright/test": "^1.40.0"
  }
}
```

### Mocking Requirements
- Google OAuth mock
- localStorage/sessionStorage mock
- IndexedDB mock (Dexie)
- Notification API mock

## Test File Structure
```
tests/
├── unit/
│   ├── utilities.test.js
│   ├── calculations.test.js
│   └── security.test.js
├── integration/
│   ├── auth.test.js
│   ├── gdrive.test.js
│   └── pdfgen.test.js
└── e2e/
    ├── budget-flow.test.js
    └── client-flow.test.js
```

## Known Testing Gaps

- No automated test suite
- Manual verification only
- No CI/CD pipeline for tests
- Browser console debugging used instead