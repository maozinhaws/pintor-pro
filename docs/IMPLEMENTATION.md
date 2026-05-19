# Implementation Guide & Development Roadmap

Development guidelines, setup procedures, and phase-based roadmap.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Git
- Browser with DevTools

### Local Development

```bash
# Clone repo
git clone <repo>
cd pintor-plus-mvc

# Option 1: Direct file open
open app.html  # macOS
start app.html # Windows
# or just drag app.html to browser

# Option 2: HTTP server (recommended for PWA testing)
npx serve .
# Then open http://localhost:3000/app.html

# Option 3: Python server
python -m http.server 8000
# Then open http://localhost:8000/app.html
```

### Development Workflow

1. Edit HTML/CSS/JS directly in files
2. Save changes
3. Reload browser (or DevTools → Service Workers → Update)
4. Test in browser DevTools (Console, Application tab for localStorage)

**No build step** — changes immediate.

---

## 📋 Getting Started Checklist

- [ ] Clone repository
- [ ] Open `app.html` locally
- [ ] Go to Settings → fill company info
- [ ] Create a test budget
- [ ] Test budget export to WhatsApp
- [ ] Read `ARCHITECTURE.md` for patterns
- [ ] Explore `src/types.ts` and `src/state.ts`
- [ ] Review `app.html` structure (inline JavaScript)

---

## 🏗️ Refactoring Roadmap

### Phase 1: Consolidate TypeScript (2-3 days)

**Goal:** Fix orphaned modules, unify state object.

1. **Merge `main.ts` + `state.ts` + `ui.ts`**
   - Remove inline 2,540-line JavaScript from `app.html`
   - Move to `src/app.ts`
   - One `const S` object, one source of truth

2. **Activate orphaned modules**
   - `rooms.ts` → import and use in room logic
   - `data.ts` → import for initial data
   - `ui.ts` → refactor into smaller components

3. **Remove inline script**
   - Replace with `<script type="module" src="src/app.ts"></script>`
   - Verify all functionality still works

4. **Testing**
   - Manual test: create budget → edit → save → reload page
   - Verify data persists
   - Test dark mode toggle

### Phase 2: Clean Architecture (5-7 days)

**Goal:** Separate domain, application, infrastructure, and presentation layers.

1. **Create domain layer**
   ```
   src/domain/
   ├── entities/budget.ts
   ├── entities/client.ts
   ├── usecases/createBudget.ts
   ├── usecases/editBudget.ts
   └── repositories/IBudgetRepository.ts
   ```

2. **Create infrastructure layer**
   ```
   src/infrastructure/
   ├── persistence/LocalStorageAdapter.ts
   ├── repositories/BudgetRepository.ts
   └── external/WhatsAppService.ts
   ```

3. **Create application layer**
   ```
   src/application/
   ├── services/BudgetService.ts
   └── dto/BudgetDTO.ts
   ```

4. **Refactor presentation**
   ```
   src/presentation/
   ├── pages/HomePage.ts
   ├── components/BudgetCard.ts
   └── utils/formatters.ts
   ```

5. **Wire dependencies**
   - Create `ServiceLocator.ts` for DI
   - Inject repositories into use cases
   - Update `main.ts` to use new architecture

### Phase 3: Testing (3-5 days)

**Goal:** Comprehensive test coverage.

1. **Unit tests**
   ```bash
   npm install --save-dev vitest
   ```
   - Test domain logic (budget calculation, validation)
   - Test use cases with mock repositories
   - Test formatters and utilities

2. **Integration tests**
   - Test BudgetService with real LocalStorageAdapter
   - Test state persistence
   - Test navigation flows

3. **Example test**
   ```typescript
   // domain/usecases/__tests__/CreateBudget.test.ts
   import { CreateBudgetUseCase } from '../CreateBudget';
   import { MockBudgetRepository } from '../__mocks__/BudgetRepository';
   
   describe('CreateBudgetUseCase', () => {
     it('should create a budget with valid input', async () => {
       const repo = new MockBudgetRepository();
       const useCase = new CreateBudgetUseCase(repo);
       
       const result = useCase.execute({
         nome: 'João Silva',
         tel: '11999999999',
         rooms: [],
       });
       
       expect(result.ok).toBe(true);
       expect(result.value.id).toBeDefined();
     });
   });
   ```

### Phase 4: Features & Polish (7-10 days)

**Goal:** New features, improvements.

1. **PDF Export**
   - Integrate `pdfkit` or `html2pdf`
   - Add "Download PDF" button to budget detail

2. **Google Drive Sync**
   - OAuth integration
   - Backup/restore functionality

3. **Google Calendar**
   - Sync budget dates to user's calendar
   - Show appointments in app

4. **Offline Improvements**
   - Add "Sync Status" indicator
   - Queue actions while offline, replay on reconnect

5. **UI Enhancements**
   - Dark mode improvements
   - Mobile-first responsive design
   - Accessibility (WCAG 2.1 AA)

### Phase 5: Deployment & CI/CD (3-5 days)

**Goal:** Production-ready pipeline.

1. **GitHub Actions**
   ```yaml
   # .github/workflows/deploy.yml
   on:
     push:
       branches: [main]
   
   jobs:
     test:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v2
         - run: npm ci
         - run: npm test
         - run: npm run build
     
     deploy:
       needs: test
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v2
         - run: npx vercel --prod --token ${{ secrets.VERCEL_TOKEN }}
   ```

2. **Environment variables**
   - `.env.local` (git-ignored)
   - `SUPABASE_URL`, `SUPABASE_KEY`
   - Sensitive keys in Vercel dashboard

3. **Monitoring**
   - Sentry for error tracking
   - Vercel Analytics for performance

---

## 🔧 Development Best Practices

### State Management

```typescript
// ✅ GOOD: Immutable updates
const newBudget = { ...budget, nome: newName };
S.orcs = S.orcs.map(o => o.id === budget.id ? newBudget : o);
saveOrcs();

// ❌ BAD: Direct mutation without save
S.orcs[0].nome = newName; // May lose data on reload
```

### Error Handling

```typescript
// ✅ GOOD: Use Result pattern
const result = createBudgetUseCase.execute(input);
if (result.ok) {
  showSuccessNotification();
} else {
  showErrorNotification(result.error);
}

// ❌ BAD: Unhandled promise rejection
createBudgetUseCase.execute(input).then(showSuccess); // No error path
```

### Navigation

```typescript
// ✅ GOOD: Check isDirty before navigation
function goToHome() {
  if (S.isDirty) {
    showConfirmDialog('Discard changes?', () => {
      S.isDirty = false;
      showPage('pg-home');
    });
  } else {
    showPage('pg-home');
  }
}

// ❌ BAD: Silent data loss
function goToHome() {
  showPage('pg-home'); // User loses unsaved changes
}
```

### Persistence

```typescript
// ✅ GOOD: Always save after mutation
function addItem(item: Item) {
  S.currentOrc.rooms[0].items.push(item);
  saveOrcs(); // Persist immediately
}

// ❌ BAD: Delayed or forgotten save
function addItem(item: Item) {
  S.currentOrc.rooms[0].items.push(item);
  // Forgot saveOrcs() → reload loses data
}
```

---

## 🎯 Future: React Native + Expo

### Architecture Consistency

The Clean Architecture will make React Native migration straightforward:

```
React Native:
src/
├── domain/              ← Reuse 100%
│   ├── entities/
│   ├── usecases/
│   └── repositories/
├── infrastructure/      ← Adapt (SQLite instead of localStorage)
│   ├── persistence/sqlite/  (replaces localStorage)
│   ├── repositories/        (same interfaces, new impl)
│   └── external/           (same)
└── presentation/        ← Rewrite (React Native instead of HTML)
    ├── screens/             (replaces pages/)
    ├── components/          (replaces components/)
    └── navigation/          (React Navigation instead of hash)
```

### Timeline (Rough Estimate)

- **Phase 1-2:** 1-2 weeks (TypeScript consolidation + Clean Architecture)
- **Phase 3:** 1 week (testing)
- **Phase 4:** 1-2 weeks (features, polish)
- **Phase 5:** 3-5 days (CI/CD)
- **React Native:** 4-6 weeks (domain reuse saves 20-30% time)

**Total MVP Web:** 4-5 weeks  
**Total React Native:** 4-6 weeks

---

## 📦 Deployment

### Vercel (Current)

```bash
# Push to main branch
git add .
git commit -m "feat: add budget export"
git push origin main

# Automatic deploy happens
# Check https://vercel.com/[project]
```

### Manual Deploy

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to staging
vercel

# Deploy to production
vercel --prod
```

### Environment Setup in Vercel Dashboard

1. Go to **Settings → Environment Variables**
2. Add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_KEY`
   - Any other secrets

3. Redeploy after adding variables

### Build & Serve Locally

```bash
# If Vite is set up
npm run build
npm run preview

# Or use any static server
npx serve dist/
```

---

## 🐛 Troubleshooting

### Service Worker Issues

```
Problem: Changes not showing after reload
Solution: DevTools → Application → Service Workers → Unregister, then reload
```

### localStorage Quota Exceeded

```
Problem: "QuotaExceededError" in console
Solution: App automatically falls back to sessionStorage, but:
  1. Check what's taking space: dev console → Application → Local Storage
  2. Export and clear old budgets
  3. Browser cache may be bloated → Clear cache
```

### Orphaned Modules Not Running

```
Problem: changes in src/ui.ts don't take effect
Reason: Not imported in main.ts
Solution: 
  1. Import in src/main.ts: import './ui.ts'
  2. Or refactor into main.ts directly
```

### Dark Mode Not Persisting

```
Problem: Theme resets on reload
Fix in src/state.ts:
  const savedTheme = localStorage.getItem('pp-theme');
  if (savedTheme) S.config.tema = savedTheme;
```

---

## 📚 Code Organization

### File Naming Conventions

```
features/
├── budgets/
│   ├── types.ts           (Orcamento interface)
│   ├── budgets.ts         (CRUD logic)
│   └── __tests__/
│       └── budgets.test.ts

clients/
├── types.ts               (Cliente interface)
├── clients.ts             (CRUD logic)
└── __tests__/

utils/
├── formatters.ts          (Formatting functions)
├── validators.ts          (Validation rules)
└── __tests__/
```

### Import Organization

```typescript
// 1. External imports (node_modules)
import type { Result } from '../shared/result';

// 2. Internal domain imports
import { Orcamento } from '../domain/entities/Orcamento';
import { CreateBudgetUseCase } from '../domain/usecases/CreateBudget';

// 3. Infrastructure imports
import { BudgetRepository } from '../infrastructure/repositories/BudgetRepository';

// 4. Presentation/app imports
import { showNotification } from './notifications';
```

---

## 🔐 Security Checklist

- [ ] No API keys in frontend code
- [ ] HTTPS enforced (Vercel default)
- [ ] CSP headers configured (`vercel.json`)
- [ ] localStorage used only for non-sensitive data
- [ ] User phone numbers/emails hashed before sending to WhatsApp
- [ ] No personal data logged to console in production
- [ ] Input validation on all forms
- [ ] OWASP Top 10 review done

---

## 📊 Performance Checklist

- [ ] Code splitting if > 100KB
- [ ] Service Worker caching strategy defined
- [ ] Lazy load modals/pages
- [ ] Images optimized (WebP fallback)
- [ ] No memory leaks from event listeners
- [ ] Lighthouse score > 90
- [ ] First Contentful Paint < 2s
- [ ] Time to Interactive < 5s

---

## 👥 Contribution Guidelines

When adding a feature:

1. **Create feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Follow architecture**
   - Define types in domain/entities/
   - Implement use case in domain/usecases/
   - Implement repository in infrastructure/
   - Add UI in presentation/

3. **Write tests**
   - Unit tests for domain logic
   - Integration tests for full flows

4. **Update documentation**
   - Add to ARCHITECTURE.md if schema changes
   - Update this IMPLEMENTATION.md if process changes

5. **Commit with conventional commits**
   ```
   feat: add PDF export
   fix: correct budget total calculation
   refactor: consolidate state management
   docs: update deployment guide
   ```

6. **Create PR**
   - Describe what changed
   - Link related issues
   - Ask for review

---

**Last updated:** 2026-05-13  
**Next:** React Native migration phase  
**See also:** `OVERVIEW.md`, `ARCHITECTURE.md`
