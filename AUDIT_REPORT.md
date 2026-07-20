# EWS Repository Audit Report

Audit date: 2026-07-20
Repository: `webbcpapin/EWS`
Application: Early Warning System Media Monitoring
Target direction: Enterprise AI Media Intelligence Early Warning System

## Executive Summary

The application is a Vite React TypeScript dashboard using Tailwind CSS and shadcn/ui components, deployed to GitHub Pages. It already has the basic shape of an EWS product: dashboard, news list, risk alerts, analysis, activity log, reports, settings, local scoring logic, and a Google Apps Script endpoint integration through `useArticles`.

The system is not yet enterprise-ready. The main blockers are architecture coupling, incomplete backend API design, weak security controls, direct object mutation in UI actions, missing persistent write paths, inconsistent data schema, and missing AI/risk/alert lifecycle tables. The Apps Script endpoint is currently reachable and returns 255 records, but the frontend still treats Google Sheet data as a best-effort source and falls back silently to local demo data.

## Current Architecture

### Frontend

- Framework: React 19, TypeScript, Vite.
- Styling: Tailwind CSS with shadcn/ui and Radix UI primitives.
- Routing: `HashRouter` in `src/main.tsx` for GitHub Pages compatibility.
- Layout: `src/components/custom/Layout.tsx` wraps routes with sidebar and `ArticlesProvider`.
- Pages:
  - `Home.tsx`: dashboard summary, risk alerts, latest news, tone/risk/category distribution.
  - `Berita.tsx`: searchable/filterable paginated article table and detail dialog.
  - `Alert.tsx`: high-risk article listing.
  - `Analisis.tsx`: category, media, tone, and trend summaries.
  - `Aktivitas.tsx`: generated activity feed from articles.
  - `Laporan.tsx`: CSV export and mock PDF export.
  - `Pengaturan.tsx`: local scoring/media/keyword configuration UI.
- State management: React local state and context only. No server state cache library, no persistent mutation layer.
- Data provider: `src/hooks/useArticles.tsx` fetches a hardcoded Apps Script URL, maps rows to `NewsArticle`, and falls back to `demoArticles`.
- Risk logic: `src/lib/relevanceFilter.ts` contains keyword scoring, media priority, category, issue type, and risk level heuristics.

### Backend And Data

- Backend: Google Apps Script endpoint.
- Current endpoint status during audit: `ok: true`, `count: 255`.
- Current frontend expects a flat `data[]` response with fields such as `id`, `tahun`, `tanggal`, `bulan`, `kategori`, `media`, `judul_berita`, `tone`, `status`, and `prioritas`.
- Current Google Sheet tab appears to be a single `Berita` table rather than the requested enterprise warehouse schema.
- No discovered frontend integration for POST endpoints, writeback, analysis, alert generation, authentication key, rate limiting, or AI processing.

### Deployment

- GitHub Pages deployment exists through `.github/workflows/deploy-pages.yml`.
- Workflow restores `index.source.html` before build, then uploads `dist` and copies `dist/index.html` to `dist/404.html`.
- Root `index.html`, `404.html`, and `assets/` are also committed as static Pages artifacts for branch/root compatibility.

## Audit Validation

- `npm run lint`: failed with 14 errors and 5 warnings.
- Apps Script endpoint: reachable and returned 255 records.
- Git status before report creation: clean on `main...origin/main`.

## Findings

| Priority | Area | Problem | Risk Impact | Recommended Solution |
|---|---|---|---|---|
| P0 Critical | Frontend state | `Berita.tsx` and `Alert.tsx` mutate article objects directly (`article.validationStatus = ...`, `article.statusPenanganan = ...`). | UI can become stale, React compiler/lint fails, updates are not persisted to Google Sheet, audit trail is invalid. | Introduce immutable state update functions in article service/hook and Apps Script mutation endpoints for validation/follow-up updates. |
| P0 Critical | Backend security | Apps Script endpoint is public and no frontend API key/header contract exists. | Anyone with URL can call backend; future POST endpoints could be abused or overwrite data. | Add API key validation, method allowlist, request schema validation, basic rate limiting, and structured error responses in Apps Script. |
| P0 Critical | Backend architecture | Current backend only exposes a generic data response; required `/articles`, `/risks`, `/alerts`, `/analyze`, `/generate-alert`, `/process-news` API design is missing. | Frontend cannot support enterprise workflows, AI analysis, lifecycle state, or automated alerts reliably. | Build Apps Script service modules: ArticleService, RiskService, AlertService, AIService, Validation, Logger. |
| P0 Critical | Data model | Google Sheet is currently a single news table, not the required warehouse schema (`ARTICLES`, `AI_ANALYSIS`, `RISK_SCORE`, `ALERTS`, `SOURCES`, `KEYWORDS`). | AI outputs, risk scores, alerts, source credibility, and keywords cannot be normalized, joined, audited, or recalculated cleanly. | Create `GOOGLE_SHEET_SCHEMA.md` and migrate Sheet tabs to normalized required schema with stable IDs. |
| P1 Important | Data fetching | Apps Script URL is hardcoded in `useArticles.tsx`. | Environment-specific backend changes require code edits; endpoint is exposed in source. | Move endpoint and API key to Vite environment variables with safe documented setup. |
| P1 Important | Architecture | Data fetching, mapping, fallback, and risk enrichment live inside a hook. No `api/` or `services/` layer exists. | Hard to test, hard to reuse, and future endpoints will create duplication across pages. | Create `src/api/apiClient.ts`, `src/services/articleService.ts`, `riskService.ts`, `alertService.ts`, and slim hooks. |
| P1 Important | Loading/error states | `ArticlesProvider` exposes `loading` and `error`, but pages do not render global loading/error/partial fallback notices. | Users may unknowingly operate on fallback demo data while believing it is live Google Sheet data. | Add shared loading, error, empty state, and data-source status components in layout/dashboard. |
| P1 Important | Lint/build quality | `npm run lint` fails in UI primitives, `useArticles`, `Alert`, `Berita`, `Home`, and `Laporan`. | Quality gate cannot pass; future CI/CD should not be trusted until errors are resolved. | Fix hook dependency arrays, remove direct mutation, split non-component exports or tune lint config for shadcn/ui generated files. |
| P1 Important | Risk scoring | Current risk logic is keyword heuristic only and does not implement enterprise formula: severity, sentiment, source credibility, velocity, recency, impact scope. | Risk scores are not explainable enough for management decisions and can over/under-prioritize. | Implement `RiskService` and Apps Script risk scoring engine with traceable component scores. |
| P1 Important | AI processing | No Gemini/OpenAI integration exists in Apps Script. | System cannot generate summaries, entities, confidence, or risk classification. | Add AIService with prompt templates, JSON schema validation, retry, and storage in `AI_ANALYSIS`. |
| P1 Important | Alert lifecycle | Alerts are derived from articles in the frontend only. No `Generated > Reviewed > Assigned > Resolved > Archived` lifecycle exists. | Alerts cannot be owned, audited, notified, or closed consistently. | Add `ALERTS` sheet and AlertService endpoints; render real alert records in dashboard. |
| P1 Important | Deployment model | Root committed build artifacts coexist with source and workflow-generated artifacts. | Local `npm run build` can behave differently depending on whether `index.html` is source or built output; deploy workflow has hidden restore step. | Prefer a single deployment path: GitHub Actions artifact deploy. Keep source `index.html` in repo; do not commit generated root assets unless branch/root Pages mode is required. |
| P1 Important | Data quality | Endpoint returns date strings like `Thu Oct 05 2023 00:00:00 GMT+0700`, month typo (`Janauri`), mixed category casing (`rokok ilegal`, `Rokok Ilegal`), and some blank tone/date fields. | Sorting, filters, trends, risk calculations, and report exports can be inaccurate. | Normalize dates as `yyyy-MM-dd`, canonicalize category/tone/source values in Apps Script before returning data. |
| P1 Important | Navigation | Routes such as `/berita/:id` are used in navigation but no matching route exists in `App.tsx`. | Clicking detail routes may show no page or broken state depending on current UI. | Add a risk/article detail route or keep details modal-only and remove unreachable route navigation. |
| P2 Enhancement | UI/UX | Current UI is a good operational dashboard but not yet enterprise intelligence style. | Does not meet requested Bloomberg/Palantir-like decision-support experience. | Redesign dashboard with executive risk index, heatmap, intelligence feed, emerging risks, and timeline. |
| P2 Enhancement | Responsive/accessibility | Many clickable cards/divs use `onClick` without keyboard semantics; icon-only buttons lack clear labels in some areas. | Lower accessibility and poorer keyboard/screen reader support. | Use semantic buttons/links, aria labels, focus rings, and keyboard interaction patterns. |
| P2 Enhancement | Reports | CSV export exists; PDF export is a simulated toast. | Users may believe a report was produced when none exists. | Implement real report generation/export or disable/mock label clearly until implemented. |
| P2 Enhancement | Settings | Settings are local UI state only and not persisted to Google Sheet. | Keyword/media/scoring changes vanish on refresh and do not affect backend processing. | Store settings in `KEYWORDS` and `SOURCES` sheets, expose read/write endpoints, and refresh scoring rules from backend. |
| P2 Enhancement | Performance | Pages recalculate summaries client-side over all articles. Current 255 records are fine, but pagination/filtering is frontend-only. | Larger sheets will increase payload size and render cost. | Add backend pagination/filtering/sorting and use server-state caching with retry/backoff. |
| P2 Enhancement | Documentation | README is still the default Vite template; no Apps Script or Sheet setup guide exists. | Maintenance and onboarding are fragile. | Replace README with system overview, architecture, setup, deployment, API, and maintenance guide. |

## Current Technical Debt

1. Generated shadcn/ui files trigger strict React refresh lint rules.
2. Pages use domain logic directly instead of service abstractions.
3. `demoArticles` remains a large fallback dataset embedded in the bundle.
4. Backend response mapping transforms `content` to the same value as title; article body is not preserved.
5. No shared domain model for backend rows, analysis rows, risk rows, and alert rows.
6. No end-to-end test for live Google Sheet data loading.
7. No runtime display showing whether data source is Google Sheet or local fallback.
8. No persistent update mechanism for validation/follow-up actions.
9. No security boundary for future POST operations.
10. No audit log in backend for risk decisions or user actions.

## Recommended Implementation Sequence

### Phase 1A: Stabilize Before Expansion

- Fix lint blockers caused by direct mutation and missing hook dependencies.
- Add visible data-source status, loading, error, retry, and empty states.
- Move API URL to environment config.
- Add `apiClient` and `articleService` without changing UI behavior.

Expected impact: safer foundation with no visible feature regression.

### Phase 1B: Normalize Backend Contract

- Document and implement `GOOGLE_SHEET_SCHEMA.md`.
- Normalize Apps Script response dates, category, tone, source, and IDs.
- Add `/articles` endpoint with pagination/filter/sort.

Expected impact: frontend becomes scalable and predictable with real backend ownership.

### Phase 1C: Add Enterprise Risk Domain

- Add `AI_ANALYSIS`, `RISK_SCORE`, `ALERTS`, `SOURCES`, and `KEYWORDS` sheets.
- Implement Apps Script services and utility modules.
- Add AI analysis and risk scoring as asynchronous/backend-driven operations.

Expected impact: application becomes a risk intelligence system rather than a dashboard over news rows.

### Phase 1D: Redesign Decision Dashboard

- Add executive risk overview, risk heatmap, intelligence feed, emerging risks, and timeline.
- Create Risk Detail page and alert lifecycle views.

Expected impact: management-ready UI and clearer operational workflow.

## Security Recommendations

- Use Apps Script API key validation for all non-public endpoints.
- Store Gemini/OpenAI keys in Apps Script Properties, never in frontend code or Google Sheet cells.
- Add request validation for every POST body.
- Add rate limiting based on user/API key/time bucket.
- Add audit logs for analysis, alert generation, status updates, and failed requests.
- Avoid exposing SharePoint archive links to unauthorized users if the GitHub Pages app remains public.

## Performance Recommendations

- Avoid fetching all records for list pages when row count grows beyond a few thousand.
- Implement server-side pagination and sorting in Apps Script.
- Cache read responses briefly in Apps Script `CacheService`.
- Use stable `yyyy-MM-dd` strings for dates to avoid repeated browser parsing of localized date strings.
- Split dashboard widgets into memoized components after service architecture is in place.

## Accessibility And UX Recommendations

- Replace clickable non-button cards with semantic links/buttons.
- Add accessible labels to icon-only actions.
- Add clear loading skeletons and empty states for each major table/list.
- Surface backend status: `Google Sheet connected`, `Using local fallback`, or `Backend error`.
- Avoid claiming PDF export success until actual file generation exists.

## Phase 0 Conclusion

The current EWS is a functional prototype with a live Google Sheet read path, but it is not yet an enterprise AI media intelligence platform. The immediate next step should be a stabilization refactor: introduce service architecture, fix lint/state bugs, surface backend state, and formalize the Google Sheet schema. After that, backend AI analysis, risk scoring, and alert lifecycle can be added without rewriting the application from zero.