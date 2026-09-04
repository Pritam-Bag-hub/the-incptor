# AgriGrowth Technical Debt & Code Health Roadmap

This document records identified technical debt and refactoring recommendations for future iterations.

---

## 📌 Technical Debt Backlog

### 1. Monolithic Farmer Dashboard Component (`src/app/dashboard/farmer/page.tsx`)
- **Current State**: `page.tsx` is 3,347 lines long in a single file. It manages state, tabs (Overview, Land, Crops, Contracts), modal wizards ("Choose What to Grow", Worker Hiring, Harvest Receipts, Contract Details), and API fetch calls inline.
- **Impact**: Increased compilation surface, higher risk of regression during isolated UI edits.
- **Recommended Refactor**:
  - Extract tab views into `src/components/farmer/tabs/`:
    - `FarmerOverviewTab.tsx`
    - `LandParcelsTab.tsx`
    - `CropCatalogTab.tsx`
    - `ContractsTab.tsx`
  - Extract modals into `src/components/farmer/modals/`:
    - `CultivationWizardModal.tsx`
    - `ContractDetailsDrawer.tsx`
    - `WorkerHiringModal.tsx`
  - Extract custom React hooks into `src/hooks/`:
    - `useFarmerLands.ts`
    - `useIncomingContracts.ts`

### 2. Consolidated API Route Grouping
- **Current State**: Roles interact with both role-scoped endpoints (`/api/landowner/contracts`) and general resource endpoints (`/api/contracts`).
- **Impact**: Mild overlap in route naming conventions.
- **Recommended Refactor**: Standardize all resource actions under unified REST resources with middleware role verification.

### 3. Automated E2E Cypress/Playwright Test Integration
- **Current State**: Integration test suite runs via `npm test` (`ts-node tests/run_all.ts`).
- **Recommended Extension**: Add Playwright E2E browser tests for full visual regression testing.
