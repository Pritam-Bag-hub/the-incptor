# AgriGrowth API Architecture Document

This document outlines the REST API route handlers implemented in `src/app/api/`.

---

## 🌐 API Route Hierarchy & Role Access Matrix

The system provides specialized API endpoints organized by domain and role permissions:

```
src/app/api/
├── auth/                       # Session authentication
├── demands/                    # Buyer demand management
├── lands/                      # Farmer land parcel management
├── landowner/contracts/        # Landowner-specific contract actions
├── contracts/                  # Generic & shared contract operations
├── worker/                     # Worker dashboard actions & daily reporting
├── worker-jobs/                # Job requirement postings
├── worker-applications/        # Application approval workflows
├── collection-centers/         # Collection Center management
├── inspections/                # Quality inspection logging
├── vehicles/                   # Transporter fleet management
├── shipments/                  # Logistics shipment tracking
└── route-optimization/         # Solver matrix & route solver endpoints
```

---

## 📂 Endpoint Specifications

### 1. Authentication APIs (`/api/auth/`)
- **`POST /api/auth/login`**: Authenticate via phone number and OTP (`0000` for demo). Sets session cookie.
- **`POST /api/auth/logout`**: Clears active session cookie.
- **`GET /api/auth/me`**: Returns currently authenticated user profile and role.

### 2. Buyer Demand APIs (`/api/demands/`)
- **`GET /api/demands`**: List active buyer demands (used by farmers to discover opportunities).
- **`POST /api/demands`**: Create new buyer demand posting (*Buyer only*).
- **`PATCH /api/demands/[id]/status`**: Pause, resume, or close demand posting.

### 3. Land Parcel APIs (`/api/lands/`)
- **`GET /api/lands`**: Fetch farmer's registered land parcels (*Landowner only*).
- **`POST /api/lands`**: Register new farm parcel with coordinates, size (ACRE/HECTARE), address (*Landowner only*).
- **`GET /api/lands/[id]`**: Fetch specific land parcel details.
- **`PUT /api/lands/[id]`**: Update land details (Restricted if status is `UNDER_CONTRACT`).
- **`GET /api/lands/discover`**: Find land parcels matching buyer demand filters.

### 4. Contract APIs (`/api/contracts/` & `/api/landowner/contracts/`)
- **`GET /api/landowner/contracts`**: Fetch contracts for current landowner.
- **`POST /api/landowner/contracts`**: Initiate farmer-driven contract proposal from "Choose What to Grow" wizard.
- **`PATCH /api/landowner/contracts/[id]/accept`**: Farmer accepts contract proposal.
- **`PATCH /api/landowner/contracts/[id]/reject`**: Farmer rejects proposal with reason.
- **`GET /api/contracts/[id]`**: Detailed contract inspector data.
- **`GET /api/contracts/[id]/overview`**: Financial breakdown & yield metrics.
- **`GET /api/contracts/[id]/milestones`**: Planned milestone schedule.
- **`GET /api/contracts/[id]/tasks`**: Milestone task checklist.
- **`PATCH /api/contracts/[id]/tasks`**: Update task completion status (`PENDING`, `IN_PROGRESS`, `COMPLETED`).
- **`POST /api/contracts/[id]/progress`**: Log stage progress update (`LAND_PREPARATION` -> `HARVEST_COMPLETED`).
- **`POST /api/contracts/[id]/yield`**: Record actual harvest quantity.
- **`POST /api/contracts/[id]/complete`**: Mark contract as `COMPLETED`.

### 5. Field Worker APIs (`/api/worker/`, `/api/worker-jobs/`, `/api/worker-applications/`)
- **`GET /api/worker/jobs`**: List available farm job opportunities (*Worker only*).
- **`POST /api/worker/jobs/[id]/apply`**: Submit job application (*Worker only*).
- **`POST /api/contracts/[id]/worker-jobs`**: Create worker requirement posting for a contract (*Landowner only*).
- **`PATCH /api/worker-applications/[id]`**: Accept or reject worker job application (*Landowner only*).
- **`GET /api/worker/assignment`**: Fetch active worker contract & daily assignment details (*Worker only*).
- **`POST /api/worker/daily-report/check-in`**: GPS check-in (*Worker only*).
- **`POST /api/worker/daily-report/submit`**: Submit daily work report (`COMPLETED`, `PARTIAL`, `NOT_COMPLETED`) with field issue flags (*Worker only*).

### 6. Collection Center & Quality Inspection APIs (`/api/collection-centers/`, `/api/inspections/`)
- **`GET /api/collection-centers`**: List active Collection Centers.
- **`POST /api/contracts/[id]/receipts`**: Log harvest receipt drop-off at Collection Center (*Center Manager / Farmer*).
- **`GET /api/contracts/[id]/receipts`**: Fetch harvest receipts for a contract.
- **`POST /api/inspections`**: Submit produce quality inspection report (Accepted weight, Rejected weight, Grade A/B/C, Moisture %) (*Inspector only*).

### 7. Logistics & Route Optimization APIs (`/api/route-optimization/`, `/api/vehicles/`, `/api/shipments/`)
- **`GET /api/vehicles`**: Manage transporter vehicles (*Transporter only*).
- **`POST /api/route-optimization/solve`**: Execute OR-Tools CP-SAT Vehicle Routing Problem (VRP) solver. Returns selected harvest lots and optimal vehicle routes.
- **`POST /api/route-optimization/matrix`**: Query Google Routes API for distance/time matrix.
- **`POST /api/shipments`**: Create shipment from aggregated harvest receipts (*Transporter only*).
- **`PATCH /api/shipments/[id]/assign-vehicle`**: Assign vehicle to shipment.
- **`PATCH /api/shipments/[id]/status`**: Update shipment status (`READY_FOR_DISPATCH`, `IN_TRANSIT`, `DELIVERED_CONFIRMED`).

---

## 🔒 Endpoint Security & Verification
All API handlers check session authentication via `getSessionUser()` in `src/lib/auth.ts`. Role guards verify user permissions (`BUYER`, `LANDOWNER`, `WORKER`, `ADMIN`, `INSPECTOR`, `CENTER_MANAGER`, `TRANSPORTER`) before processing state mutations.
