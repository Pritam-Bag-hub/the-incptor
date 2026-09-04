# AgriGrowth Farmer Dashboard — Design System & Visual Specification (DESIGN.md)

## 1. Product Context
**AgriGrowth** is an AI-enabled agricultural marketplace and contract-farming platform connecting farmers, buyers, agricultural workers, inspectors, collection centers, and transporters. The platform streamlines contract farming, demand discovery, land management, crop selection, task execution, yield logging, worker hiring, and logistics tracking.

---

## 2. Farmer Dashboard Scope & Capabilities
The Farmer Dashboard serves as the command center for landowners and farmers. Based on the existing implementation (`src/app/dashboard/farmer/page.tsx`), the interface manages the following core domains:

- **Dashboard Overview**: Key telemetry metrics (Active Contracts, Total Land Acres, Active Workers, Environmental & Soil Data).
- **"Choose What to Grow" Cultivation Workflow**: A prominent 4-step wizard for matching available land parcels with active market demand and crops.
- **Nearby Farming Opportunities**: Buyer-driven contract demands discoverable by location, crop type, quantity, distance, and timeline.
- **My Land Parcels**: Interactive registry of land parcels with GPS coordinates, acreage, unit type (ACRE/HECTARE), status badges, and address details.
- **Crop Catalog**: Two-level visual directory (Level 1: Categories - Vegetables, Fruits, Flowers, Crops; Level 2: Individual crops with duration and metadata).
- **Contracts & Requests**: Comprehensive contract management table and card views for incoming buyer proposals and farmer-initiated agreements.
- **Farm Progress & Milestones**: Lifecycle tracking (Land Preparation, Sowing, Growth, Inspection, Harvest, Delivery) with milestone checklists.
- **Harvest & Verification Information**: Harvest yield logging, verification receipts, quality inspection results, and collection center delivery tracking.
- **Worker Hiring & Management**: Job posting form, required worker count, working hours, and candidate application approval/rejection workflows.
- **Collection Center Receiving**: Direct tracking of gross weight, tare weight, net harvest quantity, and collection center drop-offs.
- **Notifications & Header Controls**: Top bar user profile, notifications badge, session verification, and quick navigation actions.

---

## 3. Design Goal
Redesign the interface to transform AgriGrowth into a polished, modern, world-class agricultural SaaS product. The redesigned UI must feel authoritative, clean, and intuitive for:
1. **Real Farmers & Landowners** (accessible typography, high contrast, clear visual cues, non-technical terminology).
2. **Institutional Buyers & Agribusinesses** (data-dense tables, crisp financial metrics, structured contract flows).
3. **Field Operations & Inspectors** (mobile-friendly cards, clear status indicators, quick tap targets).
4. **Smart India Hackathon (SIH) Presentation/Demo** (visually arresting aesthetic, rich color palette, fluid component micro-interactions).

---

## 4. Visual Direction & Token System

### Color Palette
- **Primary Background**: Warm natural off-white (`#FDFBF7`) — creates an organic, earth-toned canvas that avoids eye fatigue.
- **Deep Agricultural Green (Primary Text & Headers)**: `Pine Tree` (`#202808`) and `Kombu Green` (`#33432B`) — provides strong contrast, grounded authority, and deep organic feel.
- **Secondary / Accent Green**: `Dingley Green` (`#6A784D`) and `Emerald Forest` (`#15803D`) — used for primary buttons, active states, progress bars, and positive badges.
- **Warm Earth & Accent Neutral**: `Brandy Accent` (`#DEC59E`) and `Warm Border` (`#E5E7EB`) — used for borders, card dividers, and subtle tag fills.
- **Warm Coral / Alert Accent**: `Copper Red` (`#C4866D`) and `Amber Alert` (`#D97706`) — reserved for warnings, action alerts, rejection tags, and logout actions.
- **Card Fills**: Pure White (`#FFFFFF`) with soft shadow elevation (`shadow-xs` / `shadow-sm`).

### Typography & Structure
- **Primary Font Family**: Clean Sans-Serif (`Geist Sans`, `Inter`, `Roboto`).
- **Hierarchy**:
  - H1 Page Titles: `text-2xl sm:text-3xl font-extrabold text-[#202808]`
  - Section Headers / H2: `text-lg sm:text-xl font-bold text-[#33432B]`
  - Component Titles: `text-base font-semibold text-[#202808]`
  - Body Text: `text-sm font-normal text-[#33432B]/90`
  - Subtitle / Meta Text: `text-xs font-medium text-[#6A784D]`
- **Iconography**: Clean, single-weight vector icons from `lucide-react` with 1.75px–2px stroke widths.
- **Spacing & Layout**: Generous whitespace (`gap-6`, `p-6`, `rounded-2xl` containers), grid alignment, and desktop-first layout with smooth fluid downscaling.
- **Gradients & Imagery**: Restrained, purposeful subtle radial or linear gradients on primary CTA cards. High-resolution imagery restricted to crop category cards and hero banners.

---

## 5. Key UX Principles
1. **Immediate Visibility of Core Actions**: Primary tasks (e.g. *"Choose What to Grow"*, *"Register Land"*, *"View Opportunities"*) must feature prominent button styling, distinct icons, and hero placement.
2. **Clear Opportunity Discovery**: Nearby market demands must display key metrics (crop, buyer name, required volume, distance, start date) cleanly without visual clutter.
3. **Scannable Contract Status & Lifecycle**: Use color-coded status badges (`PROPOSED`, `ACCEPTED`, `IN_PROGRESS`, `HARVESTED`, `COMPLETED`, `REJECTED`) and horizontal stage progress indicators.
4. **No Excessive Cards or Artificial AI Clutter**: Eliminate redundant widget boxes. Group related information into structured, collapsible, or tabbed cards.
5. **Clarity for Non-Technical Users**: Use simple, direct labels (e.g. *"Your Farm Parcels"*, *"Buyer Demands"*, *"Required Quantity"*) instead of obscure technical jargon.
6. **Zero Feature Modification**: Preserve all state hooks, API endpoints, backend contracts, and existing modal triggers in `src/app/dashboard/farmer/page.tsx`.

---

## 6. Primary Hero Action: "Choose What to Grow"
The **"Choose What to Grow"** feature is the signature workflow for farmers on AgriGrowth.

### Design Treatment:
- **Hero Banner Placement**: Prominently pinned at the top of the Dashboard Overview tab.
- **Visual Styling**:
  - Deep green background (`#33432B`) with subtle warm gradient overlay and soft inner glow.
  - Large accent icon badge (`Sprout` icon in `#DEC59E` rounded tile).
  - High-contrast text with clear subhead: *"Match your available land parcels with active buyer demands to secure guaranteed price contracts before planting."*
  - Primary CTA Button: Large, vibrant button (`bg-[#6A784D] hover:bg-[#202808] text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-md transition-all`).

---

## 7. Nearby Farming Opportunities Section
Dedicated section showcasing high-value buyer demand postings available for nearby farmers.

### Card Structure & Information Architecture:
Each **Opportunity Card** displays:
- **Crop Badge**: Crop name with visual thumbnail or category tag (e.g., *Tomato - Hybrid*, *Wheat*, *Marigold*).
- **Buyer Information**: Verified buyer name & badge (e.g., *AgroFoods India Pvt Ltd* `[Verified Buyer]`).
- **Demand Quantity & Price**: Target harvest volume (e.g., *50 Tonnes*) and offering rate (e.g., *₹24,000 / Tonne*).
- **Location & Distance**: Village/District with approximate distance pill (e.g., *Karnal, Haryana • 12 km away*).
- **Target Timeline**: Sowing & Harvest dates (e.g., *Starts Oct 15, 2026*).
- **Action**: `"View Opportunity"` button that launches the contract initiation wizard pre-filled with the selected crop and buyer demand.

---

## 8. Navigation Hierarchy
The dashboard features an intuitive, accessible dual-level navigation structure:

### Header Navigation Bar (Global):
- **Brand Identity**: AgriGrowth logo with green gradient emblem.
- **Navigation Controls**: Back button with reset trigger, search field, notifications icon badge, user avatar profile menu, Home link, and Logout button.

### Primary Tab Navigation Bar (Farmer Workspace):
1. `Dashboard Overview`: Main KPI summaries, weather/soil metrics, hero action banner, active contracts summary.
2. `Farming Opportunities`: Filterable list of all nearby buyer market demands.
3. `My Lands`: Land parcel registry, map/GPS coordinates, acreage specs, status indicators, and land creation/edit modal triggers.
4. `My Crops`: Interactive 2-level crop catalog explorer (Categories -> Specific crops with duration & agronomic metadata).
5. `My Contracts`: Filterable table and detail inspector for active, pending, and past contracts.
6. `Harvest & Delivery`: Logging interface for harvest yields, quality receipts, and collection center drop-offs.
7. `Notifications`: Alerts for contract approvals, inspection reports, and worker applications.
8. `Profile & Settings`: Farmer details, village location, contact details, and bank settlement verification.

---

## 9. Responsive Behavior & Adaptive Layout

### Desktop (>= 1024px):
- 4-column KPI metric grid.
- Split-pane contract detailed inspector modal.
- Multi-column opportunity and land card grids (`grid-cols-3`).
- Persistent top bar and tabbed navigation row.

### Tablet (768px – 1023px):
- 2-column KPI metric grid.
- 2-column card layouts for land and opportunities.
- Tables support horizontal scrolling with sticky primary column (`Contract ID` / `Crop`).
- Full-width modal overlays with back-button headers.

### Mobile (< 768px):
- Single-column stacked layout (`grid-cols-1`).
- Bottom sticky bar for primary actions (*"Choose What to Grow"* / *"Add Land"*).
- Collapsible filter controls and search inputs.
- Touch-friendly tap targets (minimum `44px x 44px`).

---

## 10. Component Visual Design Patterns

### Stat Cards (KPI Overview)
- **Container**: White background (`bg-white`), subtle border (`border-[#DEC59E]/40`), `rounded-2xl`, `p-5`, `shadow-xs hover:shadow-sm transition-all`.
- **Icon Accent**: Top-right icon container with light green or earth background tint (`bg-[#6A784D]/10 text-[#33432B] p-2.5 rounded-xl`).
- **Content**: Bold metric display (`text-2xl font-black text-[#202808]`), clear descriptive label (`text-xs font-semibold uppercase tracking-wider text-[#6A784D]`), sub-label trend or meta info (`text-xs text-emerald-600 font-medium`).

### Opportunity Cards
- **Container**: Elevated white card (`bg-white border border-gray-200 rounded-2xl p-5 hover:border-[#6A784D] transition-all duration-200 shadow-xs hover:shadow-md`).
- **Header**: Crop icon/image thumbnail left, crop name + category top, verified buyer tag right.
- **Metrics Grid**: 2x2 inner grid highlighting *Required Quantity*, *Price per Unit*, *Location*, and *Distance*.
- **Footer**: Start date timeline left, `"View Opportunity"` primary outline button right.

### Contract Cards & Table Rows
- **Status Badges**:
  - `PROPOSED`: Amber fill (`bg-amber-50 text-amber-800 border-amber-200`).
  - `ACCEPTED` / `IN_PROGRESS`: Green fill (`bg-emerald-50 text-emerald-800 border-emerald-200`).
  - `HARVESTED`: Blue fill (`bg-blue-50 text-blue-800 border-blue-200`).
  - `COMPLETED`: Deep Forest fill (`bg-[#33432B] text-white`).
  - `REJECTED`: Red fill (`bg-rose-50 text-rose-800 border-rose-200`).
- **Row Action**: `"Inspect Contract"` icon button opening the multi-tab detail drawer.

### Progress Indicators
- **Horizontal Stage Bar**: Stepper track representing lifecycle stages (*Land Prep -> Sowing -> Growth -> Inspection -> Harvest -> Delivered*).
- **Completed Stages**: Solid green circle (`bg-[#6A784D] text-white checkmark`).
- **Active Stage**: Pulse ring green border (`border-2 border-[#33432B] bg-white text-[#33432B] font-bold`).
- **Upcoming Stages**: Light gray circle (`bg-gray-100 text-gray-400`).

### Crop Catalog Cards
- **Level 1 Category Card**: Image card with dark gradient overlay, category title (*Vegetables*, *Fruits*, *Flowers*, *Crops*), crop count badge, and smooth zoom hover effect.
- **Level 2 Crop Item Card**: White card with crop name, scientific/common name, growth duration pill (e.g. *90 Days*), and description summary.

### Modals & Drawers
- **Backdrop**: Semi-transparent dark overlay (`bg-black/50 backdrop-blur-xs z-50`).
- **Dialog Box**: Rounded white modal (`bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto shadow-2xl`).
- **Header**: Bold title left, close button (`X` icon in rounded button) right.
