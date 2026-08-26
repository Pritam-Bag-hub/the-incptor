# AgriContract AI

## Product Requirements Document (PRD)

**Version:** 1.0  
**Status:** MVP Development  
**Technology Direction:** Next.js + TypeScript + Backend APIs + Database + AI Services

---

# 1. Product Vision

AgriContract AI is a digital agricultural contract platform that connects:

- Buyers / Companies
- Landowners
- Farmers / Agricultural Workers
- Platform Administrators

The platform helps buyers secure agricultural production, landowners utilize available land, workers receive farming jobs, and administrators manage contracts, verification, payments, and risks.

The core workflow is:

Buyer creates crop demand
↓
Platform calculates suitable land requirements
↓
Available landowners receive relevant contract opportunities
↓
Landowner accepts a contract
↓
Contract becomes active
↓
Crop timeline and farming tasks are generated
↓
Required workers are notified when their work stage arrives
↓
Workers perform tasks
↓
GPS + photo evidence is submitted
↓
Weather and AI systems analyze conditions
↓
Buyer monitors production
↓
Admin monitors risks and disputes
↓
Payments are distributed after verification

---

# 2. Problem Statement

Agricultural supply chains often have several disconnected participants.

Buyers need reliable crop production but may not directly control farms.

Landowners may have available agricultural land but lack guaranteed buyers.

Farmers and agricultural workers may struggle to find organized, predictable work.

Crop production monitoring is often manual and difficult to verify.

The platform solves this by creating a connected digital ecosystem for agricultural contracts, land allocation, workforce management, crop monitoring, evidence verification, and payment tracking.

---

# 3. User Roles

The platform will have four primary roles.

## 3.1 Buyer

The buyer may be:

- Food company
- Agricultural company
- Retailer
- Processing company
- Exporter
- Large agricultural purchaser

The buyer creates crop demand and contracts land through the platform.

## 3.2 Landowner

The landowner owns or manages agricultural land.

The landowner can:

- Register land
- Mark land as available
- View relevant crop contract offers
- Accept or reject offers
- Monitor crop progress
- Coordinate workers
- Receive contract-related payments

## 3.3 Farmer / Agricultural Worker

Workers perform agricultural jobs such as:

- Land preparation
- Planting
- Fertilizer application
- Irrigation
- Pest treatment
- Harvesting
- Post-harvest work

Workers receive jobs according to crop stage and workforce requirements.

## 3.4 Admin

The platform administrator manages:

- Crop definitions
- Crop timelines
- Contract rules
- Financial ranges
- Commission
- Worker requirement rules
- AI alerts
- Disputes
- Verification
- Platform monitoring

---

# 4. Complete Platform Workflow

The complete workflow should be:

Buyer
↓
Select category
↓
Select crop
↓
Enter quantity required
↓
Select production location on map
↓
System identifies suitable and available land
↓
Buyer selects one or multiple land parcels
↓
Buyer submits contract request and proposed amount
↓
Admin/platform validates the request
↓
Relevant landowners receive the contract opportunity
↓
Landowner accepts or declines
↓
Contract becomes active
↓
Crop plan and timeline are generated
↓
Worker requirements are calculated by crop stage
↓
Workers receive job notifications when required
↓
Workers perform tasks
↓
GPS and photo evidence are submitted
↓
AI and rule-based systems analyze evidence and progress
↓
Buyer, landowner and admin receive relevant updates
↓
Crop progresses through stages
↓
Harvest is completed
↓
Final verification occurs
↓
Payments and commission are processed
↓
Contract is completed

---

# 5. Buyer Workflow

After login, the buyer should see a dashboard containing:

- Active contracts
- Pending contracts
- Total contracted production
- Estimated production
- At-risk contracts
- Upcoming milestones
- Payment status
- Notifications

The buyer should be able to create a new crop demand.

Workflow:

Choose Category
↓
Choose Crop
↓
Enter Required Quantity
↓
Select Production Location
↓
View Available Land on Map
↓
Select One or Multiple Land Parcels
↓
Enter Contract Financial Proposal
↓
Submit Contract Request

---

# 6. Crop Category and Selection System

The buyer first selects a category.

Examples:

- Grains / Crops
- Vegetables
- Fruits
- Flowers
- Commercial Crops

After selecting a category, relevant crops should be displayed.

Example:

Grains:
- Paddy
- Wheat
- Maize

Vegetables:
- Potato
- Tomato
- Onion

Fruits:
- Mango
- Banana

The crop list must be managed by the backend and admin, not hardcoded permanently in the frontend.

---

# 7. Quantity and Land Requirement Calculation

The buyer enters the required crop quantity.

Example:

Required quantity:
100 tonnes of paddy

The system should estimate how much land is required.

The calculation may use:

- Expected crop yield
- Region
- Soil suitability
- Historical productivity
- Crop type
- Safety buffer

Example:

Required Production / Expected Yield per Acre
=
Estimated Required Land Area

This should initially use configurable rule-based estimates.

Later, AI or predictive models can improve the estimate.

---

# 8. Map-Based Land Selection

After entering crop requirements, the buyer sees a map.

The map should display:

- Available land parcels
- Approximate location
- Land area
- Crop suitability
- Availability status
- Optional land score

The buyer can select:

- One land parcel
- Multiple land parcels

The selected land should collectively help satisfy the required production quantity.

The system should prevent selection of land that is:

- Already under an active contract
- Unavailable
- Incompatible with the crop
- Restricted by admin rules

---

# 9. Land Suitability Scoring

Each land parcel may receive a suitability score.

Example:

Suitability Score = 0 to 100

Factors may include:

- Soil information
- Crop compatibility
- Climate
- Water availability
- Historical crop information
- Geographic region

For the MVP, this can initially be rule-based.

Example:

Suitable crop region: +30
Suitable soil: +25
Adequate water availability: +20
Good historical performance: +15
Other factors: +10

The score should not be presented as a scientifically guaranteed prediction unless validated data is available.

---

# 10. Contract Offer System

The buyer does not directly negotiate with the landowner.

The buyer submits a contract request to the platform.

The platform defines financial rules.

Example:

Admin-approved range:

₹5,00,000
to
₹5,50,000

The buyer selects or proposes an amount within the allowed range.

The platform then sends relevant contract offers to landowners.

Landowners can:

- Accept
- Decline

For the MVP, there should not be open-ended negotiation between buyers and landowners.

This simplifies contract management.

---

# 11. Financial Allocation

The total buyer contract amount should be divided logically.

Example:

Buyer Contract Amount
↓
Platform Commission
↓
Landowner Allocation
↓
Worker Budget
↓
Operational / Service Allocation if applicable

Example:

Total Contract Value = ₹10,00,000

Platform Commission = configurable

Remaining amount is allocated according to contract rules.

The exact payment structure must be configurable by the admin.

The system must not hardcode financial percentages directly into frontend components.

---

# 12. Landowner Registration and Land Management

The landowner should register:

- Name
- Contact information
- Location
- Land size
- Land coordinates
- Availability
- Optional soil information
- Optional irrigation information

A land parcel should have statuses such as:

- AVAILABLE
- RESERVED
- UNDER_CONTRACT
- UNAVAILABLE

The landowner dashboard should display:

- Available land
- Contract offers
- Active contracts
- Crop progress
- Upcoming tasks
- Worker requirements
- Weather alerts
- Payments

---

# 13. Landowner Contract Workflow

After login:

Landowner Dashboard
↓
View Available Land
↓
Receive Relevant Crop Contract Offers
↓
Open Contract Details
↓
Review Crop
↓
Review Duration
↓
Review Land Requirement
↓
Review Financial Information
↓
Accept or Decline

If accepted:

Contract Status = ACTIVE

The selected land becomes unavailable for conflicting contracts.

---

# 14. Contract Fulfillment

A contract should not become active until the required conditions are satisfied.

Possible contract statuses:

- DRAFT
- SUBMITTED
- UNDER_REVIEW
- OFFERED
- PARTIALLY_ACCEPTED
- ACTIVE
- AT_RISK
- COMPLETED
- CANCELLED
- DISPUTED

For contracts involving multiple land parcels, the system should track:

- Required production
- Land accepted
- Estimated production capacity
- Remaining production requirement

The contract may remain partially fulfilled until sufficient land is accepted.

---

# 15. Crop Plan System

Each crop should have a configurable crop plan.

A crop plan contains:

- Crop name
- Expected duration
- Growth stages
- Required activities
- Evidence requirements
- Worker requirements
- Notification rules

Example stages:

1. Preparation
2. Planting
3. Early Growth
4. Vegetative Growth
5. Reproductive / Flowering
6. Maturity
7. Harvest

The timeline must be crop-specific.

Different crops must not use the same fixed schedule.

---

# 16. Adaptive Crop Timeline

Each crop has a different duration.

Example:

Paddy may have one timeline.

Wheat may have another.

Tomato may have another.

Therefore, tasks must be generated based on:

Crop
+
Planting Date
+
Crop Stage Rules
+
Weather Conditions
+
Actual Progress

The system should not simply say:

Day 5 → same task for every crop.

Instead:

Crop Plan
↓
Planting Date
↓
Generate Initial Milestones
↓
Monitor Actual Conditions
↓
Adjust Future Tasks if Required

---

# 17. Task and Milestone System

A contract should generate milestones.

Each milestone can contain:

- Title
- Description
- Crop stage
- Planned start date
- Planned end date
- Priority
- Required workers
- Evidence requirements
- Status

Example:

Planting
↓
Upload evidence

Fertilizer application
↓
Upload evidence if required

Irrigation
↓
Can be automatically reviewed against weather

Harvest
↓
GPS + evidence + completion verification

Task statuses:

- PENDING
- UPCOMING
- ACTIVE
- COMPLETED
- SKIPPED
- DELAYED
- UNDER_REVIEW

---

# 18. Weather-Based Decision Logic

Weather must affect agricultural task recommendations.

Example:

A scheduled irrigation task exists.

The weather system detects heavy rainfall.

The system should not blindly ask the worker to irrigate.

Instead:

Task: Irrigation
↓
Check Recent Rainfall
↓
Check Forecast
↓
Check Crop Stage
↓
Decision

Possible decisions:

- PROCEED
- SKIP
- DELAY
- REVIEW

Example:

Heavy rainfall detected
↓
Irrigation unnecessary
↓
Task marked SKIPPED or DELAYED
↓
Landowner receives explanation

The weather system should assist decisions, not automatically make unsafe agricultural decisions without configurable rules.

---

# 19. Farmer / Worker Workforce Model

Workers are not necessarily required every day.

Different crop stages require different workforce levels.

Example:

Paddy:

Preparation Stage:
High worker requirement

Planting Stage:
High worker requirement

Growing Stage:
Low worker requirement

Harvest Stage:
High worker requirement

Therefore, the system must calculate workers by:

Crop
+
Stage
+
Land Area
+
Task Type
+
Configured Productivity Rules

---

# 20. Workforce Requirement Calculation

Example formula:

Required Workers =
Land Area × Worker Factor × Task Factor

Example:

5 acres
×
4 workers per acre for planting
=
20 workers

This must be configurable by the admin.

The system should support different rules for:

- Planting
- Fertilization
- Irrigation
- Pest treatment
- Harvesting

The workforce requirement should not be permanently hardcoded.

---

# 21. Initial Worker Recruitment

When a contract becomes active, the system should calculate whether workers are immediately required.

If workers are required:

Contract Activated
↓
Determine Current Crop Stage
↓
Calculate Worker Requirement
↓
Find Eligible Workers
↓
Send Notifications
↓
Workers Accept or Decline
↓
Fill Required Positions

Workers may be selected based on:

- Location
- Availability
- Skill
- Previous performance
- Job type

For the MVP, location and availability are sufficient.

---

# 22. Farmer Job Acceptance

Workers should see:

- Job title
- Crop
- Location
- Date
- Estimated duration
- Payment information
- Landowner information after acceptance if appropriate

Worker actions:

- ACCEPT
- DECLINE

The backend must prevent:

- Double booking
- Over-assignment
- Accepting already filled jobs

---

# 23. Contact Sharing

After the required contract and job conditions are satisfied:

The system may share:

Landowner contact information with the assigned worker.

Worker contact information with the landowner.

Contact information should only be shared after:

- Worker assignment
- Job acceptance
- Relevant privacy and platform rules

---

# 24. Growing Stage Workforce

During crop growth, workers may not be continuously required.

The system should generate jobs only when needed.

Example:

Fertilizer required
↓
Create Job

Irrigation required
↓
Create Job

Disease treatment required
↓
Create Job

Harvest begins
↓
Create Larger Workforce Requirement

This reduces unnecessary worker notifications.

---

# 25. Work Verification

A worker should not simply press:

"Task Completed"

Verification should include configurable evidence.

Possible evidence:

- GPS check-in
- GPS check-out
- Timestamp
- Photo
- Optional AI analysis
- Landowner confirmation
- Admin review for exceptions

Task:

Worker assigned
↓
GPS Check-in
↓
Perform Work
↓
Upload Evidence
↓
Submit Completion
↓
System Verification
↓
Completed / Review Required

---

# 26. GPS Verification

GPS verification should use browser or mobile device geolocation.

The application can request:

navigator.geolocation

The backend should receive:

- Latitude
- Longitude
- Timestamp
- Accuracy

The system compares worker coordinates with the contract land coordinates.

Example:

Distance between worker and farm:

Within allowed radius:
PASS

Outside allowed radius:
FLAG

Example statuses:

- VERIFIED
- TOO_FAR
- LOW_ACCURACY
- LOCATION_DENIED
- REVIEW_REQUIRED

GPS verification must not be treated as perfect proof because location accuracy can vary.

---

# 27. Evidence Photo Submission

Workers or landowners may submit photos for milestones.

Examples:

- Planting evidence
- Crop growth
- Fertilizer application
- Disease symptoms
- Harvest completion

Each uploaded image should be linked to:

- Contract
- Land parcel
- Milestone
- Task
- User
- Timestamp
- Optional location data

Images should be stored using a proper storage service, not directly inside the database.

The database should store the image URL and metadata.

---

# 28. AI Crop Image Analysis

AI should analyze submitted crop images.

The initial AI workflow:

Image Uploaded
↓
Image Validation
↓
AI Service
↓
Analysis Result
↓
Confidence Score
↓
Potential Issue Detection
↓
Store Result
↓
Generate Alert if Required

Possible analysis:

- Crop health indication
- Disease possibility
- Pest symptoms
- Growth stage indication
- Image quality check

AI results must include confidence and should not be treated as guaranteed agricultural diagnosis.

---

# 29. AI Confidence and Review Logic

Example:

Confidence ≥ 85%
↓
High-confidence result

Confidence 60% to 84%
↓
Show result but mark as moderate confidence

Confidence below 60%
↓
Request additional evidence or manual review

Example statuses:

- NORMAL
- WARNING
- HIGH_RISK
- REVIEW_REQUIRED

Admin or authorized users should be able to review important AI alerts.

---

# 30. Production Forecasting

The platform may estimate expected production.

Inputs may include:

- Land area
- Crop type
- Historical yield estimates
- Crop health signals
- Weather conditions
- Growth progress

For MVP:

Use rule-based estimation.

Later:

Use machine learning or predictive models.

The system must clearly distinguish:

Estimated production
from
Guaranteed production.

---

# 31. AI and Smart Logic Strategy

The MVP should not attempt to train large machine learning models from scratch.

Use a layered approach.

## Layer 1: Rule-Based Logic

Used for:

- Crop timelines
- Worker requirements
- Task generation
- Weather decisions
- Suitability scoring
- Basic risk scoring

## Layer 2: External AI / ML APIs

Used for:

- Crop image analysis
- Disease identification
- Image classification

## Layer 3: Predictive Models

Future implementation:

- Yield prediction
- Disease risk prediction
- Production forecasting

The system should function even when advanced AI is unavailable.

---

# 32. System Architecture

Recommended architecture:

Frontend
Next.js
↓
Application API Layer
↓
Business Logic
↓
Database
+
External APIs
+
AI Services
+
Weather Services
+
Map / Geolocation Services
+
Image Storage

The frontend should not directly contain secret API keys.

All sensitive API calls should be handled securely through the backend.

---

# 33. Backend API Architecture

Use organized API routes or server-side actions.

Recommended structure:

src/
  app/
  api/
    auth/
    users/
    crops/
    lands/
    contracts/
    tasks/
    evidence/
    workforce/
    weather/
    ai/
    payments/
    notifications/

Each API should:

- Validate input
- Authenticate the user
- Check authorization
- Execute business logic
- Return structured responses
- Handle errors safely

---

# 34. Authentication APIs

Required capabilities:

- Register
- Login
- Logout
- Session management
- Role management

Example role protection:

Buyer cannot access admin-only APIs.

Worker cannot modify buyer contracts.

Landowner cannot access another landowner's private contracts.

Authentication must eventually replace the current hardcoded demo OTP logic.

---

# 35. Crop and Category APIs

Example endpoints:

GET /api/categories

GET /api/categories/{id}/crops

GET /api/crops

GET /api/crops/{id}

Admin endpoints:

POST /api/crops

PATCH /api/crops/{id}

DELETE /api/crops/{id}

Crop data should include:

- Name
- Category
- Duration
- Expected yield
- Timeline
- Workforce rules

---

# 36. Land APIs

Required operations:

POST /api/lands

GET /api/lands

GET /api/lands/{id}

PATCH /api/lands/{id}

DELETE /api/lands/{id}

Additional capabilities:

GET /api/lands/available

GET /api/lands/search

Land data should include:

- Owner
- Coordinates
- Area
- Status
- Availability
- Suitability information

---

# 37. Buyer Demand APIs

Required operations:

POST /api/demands

GET /api/demands

GET /api/demands/{id}

PATCH /api/demands/{id}

A demand contains:

- Buyer
- Crop
- Quantity
- Location
- Required production
- Selected land
- Financial proposal
- Status

---

# 38. Contract APIs

Required operations:

POST /api/contracts

GET /api/contracts

GET /api/contracts/{id}

PATCH /api/contracts/{id}

POST /api/contracts/{id}/accept

POST /api/contracts/{id}/decline

Contract logic must validate:

- User role
- Land availability
- Financial rules
- Contract state
- Duplicate conflicts

---

# 39. Task and Milestone APIs

Required operations:

GET /api/contracts/{id}/tasks

POST /api/tasks

GET /api/tasks/{id}

PATCH /api/tasks/{id}

POST /api/tasks/{id}/complete

Task completion should trigger verification logic.

---

# 40. Evidence APIs

Required operations:

POST /api/evidence/upload

GET /api/evidence/{id}

GET /api/tasks/{id}/evidence

Evidence metadata should include:

- User ID
- Task ID
- Contract ID
- Image URL
- Timestamp
- GPS information
- Verification status

---

# 41. Workforce APIs

Required operations:

GET /api/jobs

POST /api/jobs

GET /api/jobs/{id}

POST /api/jobs/{id}/accept

POST /api/jobs/{id}/decline

GET /api/workers/available

The backend must prevent overbooking.

---

# 42. Weather APIs

The weather module should support:

- Current weather
- Rainfall
- Forecast
- Temperature
- Weather alerts

Weather data should be connected to land location.

The system should evaluate:

Task
+
Crop
+
Weather
+
Rules

Possible output:

- PROCEED
- SKIP
- DELAY
- REVIEW

---

# 43. AI APIs

Recommended AI flow:

POST /api/ai/analyze-crop

Input:

- Image
- Crop type
- Optional location
- Optional growth stage

Output:

- Analysis result
- Confidence
- Risk level
- Recommendations
- Review requirement

AI API providers should be abstracted so they can be replaced later.

---

# 44. Payment APIs and Platform Commission

The payment system should track:

- Buyer payment status
- Contract value
- Landowner allocation
- Worker payment
- Platform commission

Example statuses:

- PENDING
- AUTHORIZED
- PAID
- FAILED
- REFUNDED

The MVP may initially simulate payments while keeping the backend structure ready for real payment integration.

Financial records should be stored server-side.

---

# 45. Core Database Entities

Recommended initial database entities:

User

UserRole

Land

CropCategory

Crop

CropPlan

CropStage

BuyerDemand

Contract

ContractLand

Milestone

Task

WorkerJob

WorkerAssignment

GPSCheckIn

Evidence

AIAnalysis

WeatherRecord

Notification

Payment

Transaction

Dispute

AuditLog

Important relationships:

User
↓
Landowner owns Land

Buyer
↓
Creates BuyerDemand

BuyerDemand
↓
Creates Contract

Contract
↓
Contains one or multiple Land parcels

Contract
↓
Generates Milestones

Milestone
↓
Contains Tasks

Task
↓
May create WorkerJob

WorkerJob
↓
Assigned to Worker

Task
↓
Has Evidence

Evidence
↓
May have AIAnalysis

---

# 46. Important State Machines

## Land

AVAILABLE
↓
RESERVED
↓
UNDER_CONTRACT
↓
AVAILABLE after completion if applicable

## Contract

DRAFT
↓
SUBMITTED
↓
OFFERED
↓
PARTIALLY_ACCEPTED
↓
ACTIVE
↓
AT_RISK if necessary
↓
COMPLETED

Alternative:

DECLINED
CANCELLED
DISPUTED

## Task

PENDING
↓
ACTIVE
↓
SUBMITTED_FOR_REVIEW
↓
COMPLETED

Alternative:

SKIPPED
DELAYED
REJECTED
REVIEW_REQUIRED

## Worker Job

OPEN
↓
PARTIALLY_FILLED
↓
FILLED
↓
IN_PROGRESS
↓
COMPLETED

---

# 47. Frontend, Implementation Strategy and MVP Success

The existing frontend should be reused where possible.

Do not rebuild working pages unnecessarily.

Current prototype pages should gradually become functional.

Recommended implementation order:

## Phase 0 — Repository Audit

- Read PRD
- Inspect existing frontend
- Identify reusable pages
- Identify missing features
- Do not modify working functionality unnecessarily

## Phase 1 — Foundation

Implement:

- Database
- ORM
- Environment variables
- API structure
- Validation
- Error handling
- Seed data

## Phase 2 — Authentication and Roles

Implement:

- Real users
- Buyer role
- Landowner role
- Worker role
- Admin role
- Protected routes
- Session management

## Phase 3 — Land Management

Implement:

- Land registration
- Coordinates
- Area
- Availability
- Land status

## Phase 4 — Buyer Demand Flow

Implement:

- Category selection
- Crop selection
- Quantity input
- Land requirement estimation
- Map
- Available land selection
- Multiple land selection
- Contract proposal

## Phase 5 — Contract Engine

Implement:

- Contract creation
- Offer generation
- Landowner acceptance
- Partial fulfillment
- Contract activation
- Financial allocation

## Phase 6 — Crop Timeline and Tasks

Implement:

- Crop-specific timelines
- Milestones
- Tasks
- Notifications
- Adaptive scheduling

## Phase 7 — Workforce System

Implement:

- Worker requirement calculation
- Job creation
- Worker notifications
- Acceptance
- Assignment
- Contact sharing

## Phase 8 — GPS and Evidence

Implement:

- Geolocation
- GPS check-in
- GPS validation
- Photo upload
- Evidence storage
- Verification

## Phase 9 — Weather Intelligence

Implement:

- Weather API
- Rainfall detection
- Forecast evaluation
- Task recommendations

## Phase 10 — AI Integration

Implement:

- Crop image upload
- AI analysis
- Confidence scoring
- Risk flags
- Dashboard alerts
- Admin review

## Phase 11 — Payments

Implement:

- Contract financial tracking
- Landowner allocation
- Worker payments
- Platform commission
- Payment statuses

---

# MVP Success Criteria

The MVP should demonstrate the complete end-to-end flow:

1. Buyer logs in.
2. Buyer selects a crop.
3. Buyer enters required quantity.
4. System estimates required land.
5. Buyer selects available land.
6. Buyer submits a contract request.
7. Landowner receives and accepts the offer.
8. Contract becomes active.
9. Crop-specific milestones are generated.
10. Required workers receive jobs.
11. Workers accept jobs.
12. Workers perform GPS check-in.
13. Workers upload evidence.
14. Evidence is stored.
15. AI analysis can analyze crop images.
16. Weather can affect task recommendations.
17. Buyer can monitor contract progress.
18. Landowner can monitor farming progress.
19. Admin can review risks and disputes.
20. Payment and commission records are tracked.

---

# Final Development Principles

1. Do not rebuild the entire existing frontend unless necessary.
2. Reuse existing components and pages wherever possible.
3. Convert mock data into real backend-connected data gradually.
4. Keep frontend, backend, database, AI, weather, and payment logic separated.
5. Do not expose API keys in frontend code.
6. Validate important business rules on the backend.
7. Do not implement every feature in one step.
8. Complete one phase, test it, then continue.
9. Use rule-based logic where real machine learning is not yet required.
10. Clearly distinguish demo data, estimated data, AI predictions, and verified data.
11. Do not present AI results as guaranteed agricultural or financial outcomes.
12. Preserve a clean and understandable folder structure.
13. Every major feature must connect to the database rather than relying only on frontend state.
14. Existing functionality should not be broken when adding new features.
15. Before major code changes, inspect relevant existing files and dependencies.

# AI Agent Instructions

Before implementing any major feature:

1. Read this `docs/PRD.md`.
2. Inspect the relevant existing code.
3. Identify reusable components.
4. Explain the implementation plan.
5. Make changes incrementally.
6. Test the application.
7. Report changed files.
8. Report any required environment variables.
9. Do not silently replace working architecture.
10. Ask before making destructive or major architectural changes.