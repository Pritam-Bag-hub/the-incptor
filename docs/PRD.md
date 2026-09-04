# AgriContract AI

## Product Requirements Document (PRD)

**Version:** 2.0  
**Status:** MVP Development  
**Technology Direction:** Next.js + TypeScript + Backend APIs + Database + AI Services + Weather Services + Map/Geolocation + Logistics Intelligence

---

# 1. Product Vision

AgriContract AI is a digital demand-to-delivery agricultural coordination platform that connects:

- Buyers / Companies
- Landowners / Producers
- Farmers / Agricultural Workers
- Future FPO support
- Logistics operations
- Platform Administrators

The platform helps buyers secure agricultural production, landowners utilize available land, workers receive farming jobs, producers connect production with demand, and administrators manage contracts, verification, payments, risks, harvest, and logistics.

The expanded objective is to reduce unnecessary intermediaries and create a connected agricultural workflow from demand to production and final delivery.

The core workflow is:

Market / Buyer Demand

↓

Demand Analysis and Planning

↓

Platform calculates suitable production and land requirements

↓

Available landowners / producers receive relevant opportunities

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

Harvest is confirmed

↓

Pickup request is generated

↓

Suitable vehicle is matched

↓

Nearby pickups may be grouped

↓

Route is recommended

↓

Produce is collected and delivered

↓

Delivery is confirmed

↓

Payments and settlement are processed

The platform acts as an intelligence and coordination layer. It does not need to own farms, vehicles, or logistics infrastructure.

---

# 2. Problem Statement

Agricultural supply chains often have several disconnected participants.

Buyers need reliable crop production but may not directly control farms.

Landowners and producers may have available agricultural land but lack guaranteed buyers.

Farmers and agricultural workers may struggle to find organized, predictable work.

Crop production monitoring is often manual and difficult to verify.

Harvested produce may face inefficient collection and transportation.

Multiple small pickups can increase logistics costs.

Perishable produce may lose value because of transportation delays.

Multiple intermediaries may reduce producer earnings and increase prices for buyers or consumers.

The platform solves this by creating a connected digital ecosystem for:

- Demand planning
- Agricultural production
- Land allocation
- Contract farming
- Workforce management
- Crop monitoring
- Evidence verification
- Harvest coordination
- Smart pickup
- Logistics coordination
- Route optimization
- Payment tracking

---

# 3. User Roles

The platform will initially have four primary roles.

## 3.1 Buyer

The buyer may be:

- Food company
- Agricultural company
- Retailer
- Processing company
- Exporter
- Large agricultural purchaser
- Bulk buyer
- Institution
- Distributor

The buyer creates crop demand and contracts production through the platform.

The buyer should be able to:

- Create crop demand
- Select crop category
- Select crop
- Enter required quantity
- Select production or delivery location
- View available and suitable land
- Select one or multiple land parcels
- Submit contract proposals
- Monitor production
- Monitor milestones
- View estimated production
- View harvest readiness
- Track pickup and delivery
- Confirm delivery
- Track payment status

## 3.2 Landowner / Producer

The landowner owns or manages agricultural land.

For the MVP, a landowner and producer may share the same core role.

The landowner can:

- Register land
- Mark land as available
- View relevant crop contract offers
- Accept or reject offers
- Monitor crop progress
- Coordinate workers
- Confirm harvest readiness
- View pickup status
- Receive contract-related payments

Future versions may support:

- Individual farmers
- Producer groups
- FPOs
- Multiple land parcels under one organization

## 3.3 Farmer / Agricultural Worker

Workers perform agricultural jobs such as:

- Land preparation
- Planting
- Fertilizer application
- Irrigation
- Pest treatment
- Crop monitoring
- Harvesting
- Post-harvest work

Workers receive jobs according to crop stage and workforce requirements.

Workers can:

- View available jobs
- View assigned jobs
- Accept or decline jobs
- View work location
- Perform GPS check-in
- Upload work evidence
- Submit task completion
- View payment information

## 3.4 Admin

The platform administrator manages:

- Crop definitions
- Crop timelines
- Contract rules
- Financial ranges
- Commission
- Worker requirement rules
- AI alerts
- Weather alerts
- Disputes
- Verification
- Harvest monitoring
- Logistics records
- Vehicle records
- Route plans
- Platform monitoring

---

# 4. Complete Platform Workflow

The complete workflow should be:

Buyer / Market

↓

Select category

↓

Select crop

↓

Enter quantity required

↓

Select production or delivery location on map

↓

System estimates required production and land

↓

Demand intelligence may provide additional production guidance

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

Harvest quantity and quality evidence are confirmed

↓

Pickup request is generated

↓

Suitable vehicle is selected or recommended

↓

Nearby pickups may be grouped

↓

Optimized or recommended collection route is generated

↓

Produce is collected

↓

Produce is transported

↓

Buyer confirms delivery

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
- Harvest status
- Delivery status
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

Optionally select delivery destination

↓

View estimated required land

↓

View Available Land on Map

↓

Select One or Multiple Land Parcels

↓

Enter Contract Financial Proposal

↓

Submit Contract Request

After harvest:

View Harvest Availability

↓

Track Pickup

↓

Track Delivery

↓

Confirm Receipt

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

The result must be clearly marked as an estimate.

---

# 8. Land Registration and Availability

Landowners should be able to register agricultural land.

Land information may include:

- Land name
- Location
- Address
- Latitude
- Longitude
- Area
- Unit
- Availability
- Status
- Optional soil information
- Optional irrigation information
- Optional crop suitability information

Land states:

AVAILABLE

↓

RESERVED

↓

UNDER_CONTRACT

↓

AVAILABLE after completion if applicable

The system must prevent conflicting active contracts for the same land when the selected area or availability period conflicts.

---

# 9. Land Matching and Selection

The system should identify suitable land based on:

- Location
- Area
- Availability
- Crop requirements
- Contract timeline
- Distance from preferred production location
- Future suitability information

For MVP:

Use rule-based matching.

Possible match score inputs:

- Distance score
- Area suitability
- Availability
- Crop suitability
- Timeline compatibility

Example:

Match Score:

85%

This score should be treated as a recommendation rather than a guarantee.

The buyer may select:

- One land parcel
- Multiple land parcels

The total selected land should be compared with the estimated required land.

---

# 10. Buyer Demand Management

A buyer demand should contain:

- Buyer
- Crop
- Quantity
- Preferred production location
- Optional delivery location
- Required production
- Estimated land requirement
- Selected land
- Financial proposal
- Required date
- Expected harvest or delivery date
- Status

Possible statuses:

DRAFT

SUBMITTED

MATCHING

PARTIALLY_FULFILLED

FULFILLED

CANCELLED

EXPIRED

---

# 11. Demand Intelligence and Forecasting

The platform may assist with estimating possible future crop demand.

Inputs may include:

- Historical buyer demand
- Current confirmed orders
- Season
- Region
- Historical trends

Example:

Historical Demand

+

Current Orders

+

Seasonal Trend

↓

Estimated Future Demand

↓

Suggested Production Target

For MVP:

Use:

- Historical averages
- Seasonal rules
- Configurable trends
- Current demand

Future versions may use machine learning or predictive models when sufficient historical data exists.

The system must clearly distinguish:

- Confirmed demand
- Historical demand
- Estimated demand
- Predicted demand

Predictions must never be presented as guaranteed demand.

Demand forecasting is an assistance feature and should not block the normal buyer demand workflow.

---

# 12. Contract Proposal

After selecting land, the buyer creates a contract proposal.

The proposal may contain:

- Buyer
- Landowner
- Crop
- Required quantity
- Selected land
- Production timeline
- Expected harvest date
- Financial proposal
- Payment structure
- Terms
- Special requirements

The platform should validate:

- Land availability
- Buyer role
- Landowner ownership
- Quantity and land compatibility
- Timeline conflicts
- Duplicate active contracts

---

# 13. Contract Engine

Contract workflow:

DRAFT

↓

SUBMITTED

↓

OFFERED

↓

PARTIALLY_ACCEPTED if multiple land parcels are involved

↓

ACTIVE

↓

AT_RISK if necessary

↓

COMPLETED

Alternative states:

DECLINED

CANCELLED

DISPUTED

The system should maintain a complete history of important contract status changes.

---

# 14. Contract Land Allocation

A contract may contain:

- One land parcel
- Multiple land parcels

Each ContractLand relationship should store:

- Contract ID
- Land ID
- Allocated area
- Landowner
- Status
- Acceptance status

The system must ensure:

- Allocated area does not exceed available area
- Land is not double-booked
- Conflicting active allocations are prevented

---

# 15. Crop Plan Generation

When a contract becomes active, the system should generate or configure a crop plan.

A crop plan may contain:

- Crop
- Duration
- Stages
- Milestones
- Tasks
- Expected dates
- Workforce requirements

Example stages:

- Preparation
- Planting
- Early Growth
- Fertilization
- Irrigation
- Monitoring
- Pest/Disease Treatment
- Harvest

The initial implementation should use configurable rule-based crop plans.

---

# 16. Crop Milestones

A milestone represents an important stage or event.

Example:

Preparation

↓

Planting

↓

Early Growth

↓

Fertilization

↓

Irrigation

↓

Monitoring

↓

Harvest

Each milestone may have:

- Name
- Description
- Expected date
- Status
- Required evidence
- Related tasks

Possible statuses:

PENDING

ACTIVE

COMPLETED

DELAYED

SKIPPED

REVIEW_REQUIRED

---

# 17. Task Generation

Each milestone may generate one or more tasks.

Example:

Milestone:

Planting

Tasks:

- Prepare soil
- Arrange seeds
- Perform planting
- Submit planting evidence

Task information should include:

- Contract
- Land
- Milestone
- Title
- Description
- Required workers
- Start date
- Deadline
- Status
- Evidence requirements

Task states:

PENDING

↓

ACTIVE

↓

SUBMITTED_FOR_REVIEW

↓

COMPLETED

Alternative states:

SKIPPED

DELAYED

REJECTED

REVIEW_REQUIRED

---

# 18. Worker Requirement Calculation

Worker requirements should depend on:

- Crop
- Crop stage
- Land area
- Task type
- Configured productivity rules

Example:

5 Acres

×

4 Workers Per Acre

=

20 Required Workers

For MVP:

Use configurable rule-based productivity values.

Example:

Crop: Paddy

Stage: Planting

Worker Rule:

X workers per acre

The system should calculate required workers dynamically.

---

# 19. Worker Job Creation

When a task requires workers, the system should create a WorkerJob.

A job may contain:

- Task
- Contract
- Crop
- Location
- Required workers
- Start date
- Estimated duration
- Payment information
- Status

Job states:

OPEN

↓

PARTIALLY_FILLED

↓

FILLED

↓

IN_PROGRESS

↓

COMPLETED

Alternative states may include:

CANCELLED

EXPIRED

---

# 20. Worker Matching

Workers may be selected based on:

- Location
- Availability
- Skill
- Previous performance
- Job type

For the MVP:

Location and availability are sufficient.

The system should:

- Identify eligible workers
- Notify workers
- Allow workers to accept or decline
- Track filled positions

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

ACCEPT

DECLINE

The backend must prevent:

- Double booking
- Over-assignment
- Accepting already filled jobs

---

# 23. Contact Sharing

After the required contract and job conditions are satisfied:

The system may share:

- Landowner contact information with the assigned worker
- Worker contact information with the landowner

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

VERIFIED

TOO_FAR

LOW_ACCURACY

LOCATION_DENIED

REVIEW_REQUIRED

GPS verification must not be treated as perfect proof because location accuracy can vary.

The verification should consider:

- Distance
- GPS accuracy
- Timestamp
- Optional evidence consistency

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

NORMAL

WARNING

HIGH_RISK

REVIEW_REQUIRED

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
- Land matching
- Vehicle matching
- Pickup grouping
- Basic route recommendation
- Demand estimation

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
- Demand forecasting
- Advanced logistics optimization

The system should function even when advanced AI is unavailable.

---

# 32. Weather Intelligence

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

PROCEED

SKIP

DELAY

REVIEW

Example:

Irrigation Task

↓

Check Recent Rainfall

↓

Check Weather Forecast

↓

Check Crop Stage

↓

Recommendation

Weather intelligence should assist users rather than automatically making critical agricultural decisions.

---

# 33. Harvest Management

When crop production reaches the harvest stage:

Harvest Ready

↓

Producer / Landowner Confirms Availability

↓

Estimated Quantity Recorded

↓

Confirmed Quantity Recorded

↓

Quality and Evidence Verification

↓

Harvest Ready for Pickup

Harvest information may include:

- Contract
- Crop
- Land
- Estimated quantity
- Confirmed quantity
- Pickup location
- Ready date
- Perishability priority
- Delivery destination
- Status

Harvest states:

ESTIMATED

↓

READY

↓

PICKUP_REQUESTED

↓

COLLECTED

↓

DELIVERED

---

# 34. Pickup Request Management

When harvest is ready, the system can create a PickupRequest.

A pickup request should contain:

- Harvest
- Contract
- Crop
- Quantity
- Pickup coordinates
- Ready time
- Delivery destination
- Priority
- Perishability information
- Status

Possible statuses:

PICKUP_REQUESTED

PICKUP_SCHEDULED

VEHICLE_ASSIGNED

OUT_FOR_COLLECTION

COLLECTED

CANCELLED

---

# 35. Logistics Vehicle Management

The platform may maintain vehicle records.

Vehicle information may include:

- Vehicle ID
- Vehicle type
- Capacity
- Current location
- Availability
- Logistics provider
- Supported cargo type

For the MVP, vehicles may be managed by the admin.

A dedicated logistics provider role can be added later.

---

# 36. Vehicle Matching

The platform should evaluate:

Vehicle Capacity

+

Distance to Pickup

+

Availability

+

Quantity Requirement

+

Destination

+

Priority

The system recommends suitable vehicles.

Example:

Pickup:

3 tonnes of tomato

Vehicle A:

2 km away

Capacity: 1 tonne

Result:

Insufficient capacity

Vehicle B:

7 km away

Capacity: 5 tonnes

Result:

Recommended

For the MVP:

Use a rule-based scoring algorithm.

Example factors:

- Capacity suitability
- Distance
- Availability
- Priority
- Destination compatibility

The recommendation must be treated as a suggestion.

---

# 37. Pickup Grouping

Nearby pickup requests may be grouped when:

- Locations are reasonably close
- Vehicle capacity allows collection
- Pickup time windows are compatible
- Crop handling requirements are compatible
- Delivery destinations are compatible

Example:

Farm A

↓

Farm B

↓

Farm C

↓

Collection Vehicle

↓

Buyer

The objective is to reduce unnecessary trips and empty vehicle movement.

For the MVP:

Use configurable distance thresholds and capacity checks.

---

# 38. Route Optimization and Recommendation

The route system aims to reduce:

- Total travel distance
- Empty vehicle movement
- Transportation delays
- Logistics costs
- Post-harvest losses

It should consider:

- Pickup locations
- Delivery destination
- Vehicle capacity
- Pickup readiness
- Perishable crop priority

Example:

Vehicle

↓

Farm B

↓

Farm A

↓

Farm C

↓

Buyer / Distribution Point

For the MVP:

- Calculate distances
- Group nearby pickups
- Generate simple route recommendations
- Respect basic capacity constraints

Future versions may support:

- Advanced multi-stop optimization
- Multiple vehicles
- Time windows
- Dynamic traffic
- Real-time route changes

---

# 39. Delivery Tracking and Verification

Delivery workflow:

PICKUP_REQUESTED

↓

PICKUP_SCHEDULED

↓

VEHICLE_ASSIGNED

↓

OUT_FOR_COLLECTION

↓

COLLECTED

↓

IN_TRANSIT

↓

DELIVERED

↓

CONFIRMED

Delivery records may contain:

- Vehicle
- Driver or logistics partner
- Pickup time
- Delivery time
- Quantity
- GPS information
- Timestamp
- Delivery proof
- Buyer confirmation

The system should maintain delivery status history.

---

# 40. Frontend Architecture

The existing frontend should be reused where possible.

Do not rebuild working pages unnecessarily.

Current prototype pages should gradually become functional.

Recommended areas:

Buyer:

- Dashboard
- Demand creation
- Land matching
- Contracts
- Production monitoring
- Harvest
- Delivery tracking

Landowner / Producer:

- Dashboard
- Land management
- Contract offers
- Active contracts
- Crop progress
- Harvest confirmation
- Pickup status

Worker:

- Available jobs
- Assigned jobs
- GPS verification
- Evidence submission
- Job history

Admin:

- User management
- Crop management
- Contract monitoring
- Verification review
- AI alerts
- Weather risks
- Harvest monitoring
- Vehicle management
- Logistics monitoring
- Route review
- Disputes
- Payments

---

# 41. System Architecture

The system should follow this general architecture:

Frontend

↓

Next.js Application

↓

Backend APIs / Server Logic

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

+

Optional Route / Distance Services

The frontend should not directly contain secret API keys.

All sensitive API calls should be handled securely through the backend.

---

# 42. Backend API Architecture

Use organized API routes or server-side actions.

Recommended structure:

src/

  app/

    api/

      auth/

      users/

      crops/

      lands/

      demands/

      forecasts/

      contracts/

      milestones/

      tasks/

      evidence/

      workforce/

      weather/

      ai/

      harvest/

      logistics/

      routes/

      deliveries/

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

# 43. Authentication APIs

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

# 44. Crop and Category APIs

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

# 45. Land APIs

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

# 46. Buyer Demand APIs

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

# 47. Demand Forecast APIs

The demand intelligence module may support:

GET /api/forecasts

GET /api/forecasts/{cropId}

POST /api/forecasts/generate

The initial forecasting logic may use:

- Historical demand
- Current orders
- Seasonal configuration
- Region

Outputs should clearly contain:

- Historical values
- Estimated demand
- Confidence or reliability information where applicable
- Calculation method

---

# 48. Contract APIs

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

# 49. Task and Milestone APIs

Required operations:

GET /api/contracts/{id}/tasks

POST /api/tasks

GET /api/tasks/{id}

PATCH /api/tasks/{id}

POST /api/tasks/{id}/complete

Task completion should trigger verification logic.

---

# 50. Evidence APIs

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

# 51. Workforce APIs

Required operations:

GET /api/jobs

POST /api/jobs

GET /api/jobs/{id}

POST /api/jobs/{id}/accept

POST /api/jobs/{id}/decline

GET /api/workers/available

The backend must prevent overbooking.

---

# 52. Weather APIs

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

# 53. AI APIs

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

# 54. Harvest APIs

Required operations:

POST /api/harvests

GET /api/harvests

GET /api/harvests/{id}

PATCH /api/harvests/{id}

POST /api/harvests/{id}/confirm

POST /api/harvests/{id}/request-pickup

Harvest APIs should validate:

- Contract state
- User authorization
- Quantity
- Harvest status

---

# 55. Logistics APIs

Required operations:

POST /api/logistics/pickups

GET /api/logistics/pickups

GET /api/logistics/pickups/{id}

PATCH /api/logistics/pickups/{id}

POST /api/logistics/vehicles

GET /api/logistics/vehicles

PATCH /api/logistics/vehicles/{id}

POST /api/logistics/match-vehicle

The matching system should consider:

- Vehicle capacity
- Availability
- Distance
- Pickup quantity
- Priority

---

# 56. Route APIs

Required operations:

POST /api/routes/generate

GET /api/routes

GET /api/routes/{id}

The route engine should support:

- Pickup grouping
- Distance calculation
- Stop ordering
- Capacity checks

The MVP may use a simple rule-based route recommendation algorithm.

---

# 57. Delivery APIs

Required operations:

POST /api/deliveries

GET /api/deliveries

GET /api/deliveries/{id}

PATCH /api/deliveries/{id}

POST /api/deliveries/{id}/confirm

Delivery information may include:

- Pickup
- Vehicle
- Route
- Quantity
- Pickup timestamp
- Delivery timestamp
- GPS information
- Delivery proof
- Confirmation

---

# 58. Payment APIs and Platform Commission

The payment system should track:

- Buyer payment status
- Contract value
- Landowner allocation
- Worker payment
- Logistics cost
- Platform commission

Example statuses:

- PENDING
- AUTHORIZED
- PAID
- FAILED
- REFUNDED
- DISPUTED

The MVP may initially simulate payments while keeping the backend structure ready for real payment integration.

Financial records should be stored server-side.

---

# 59. Core Database Entities

Recommended initial database entities:

User

UserRole

Land

CropCategory

Crop

CropPlan

CropStage

BuyerDemand

DemandForecast

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

Harvest

PickupRequest

LogisticsVehicle

VehicleAssignment

RoutePlan

RouteStop

Delivery

DeliveryProof

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

Contract

↓

Produces Harvest

Harvest

↓

Creates PickupRequest

PickupRequest

↓

Assigned to Vehicle

Vehicle

↓

Follows RoutePlan

RoutePlan

↓

Contains RouteStops

RouteStop

↓

Creates Delivery

Delivery

↓

Buyer Confirmation

↓

Payment / Settlement

---

# 60. Important State Machines

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

## Harvest

ESTIMATED

↓

READY

↓

PICKUP_REQUESTED

↓

COLLECTED

↓

DELIVERED

## Pickup

PICKUP_REQUESTED

↓

PICKUP_SCHEDULED

↓

VEHICLE_ASSIGNED

↓

OUT_FOR_COLLECTION

↓

COLLECTED

## Delivery

COLLECTED

↓

IN_TRANSIT

↓

DELIVERED

↓

CONFIRMED

---

# 61. Frontend, Implementation Strategy and MVP Success

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
- Crop categories
- Crop data

## Phase 4 — Buyer Demand and Land Matching

Implement:

- Category selection
- Crop selection
- Quantity input
- Land requirement estimation
- Map
- Available land selection
- Multiple land selection
- Match scoring
- Buyer demand workflow

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

## Phase 11 — Harvest Management

Implement:

- Harvest readiness
- Quantity confirmation
- Harvest evidence
- Harvest status
- Pickup request generation

## Phase 12 — Demand Intelligence (future enhancement)

Implement:

- Historical demand records
- Seasonal trends
- Current order analysis
- Forecast assistance
- Suggested production targets

## Phase 13 — Smart Logistics

Implement:

- Pickup requests
- Vehicle records
- Vehicle availability
- Vehicle matching
- Pickup grouping
- Delivery tracking

## Phase 14 — Route Optimization

Implement:

- Distance calculation
- Pickup grouping
- Stop ordering
- Capacity-aware route planning
- Route recommendation

## Phase 15 — Payments and Settlement

Implement:

- Contract financial tracking
- Landowner allocation
- Worker payments
- Logistics cost tracking
- Platform commission
- Payment statuses
- Settlement records

---

# 62. MVP Success Criteria

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
19. Harvest quantity is confirmed.
20. Pickup request is created.
21. Vehicle is matched.
22. Nearby pickups may be grouped.
23. A route is recommended.
24. Produce is collected.
25. Delivery status is tracked.
26. Buyer confirms delivery.
27. Admin can review risks and disputes.
28. Payment, logistics cost, and commission records are tracked.

---

# 63. Final Development Principles

1. Do not rebuild the entire existing frontend unless necessary.
2. Reuse existing components and pages wherever possible.
3. Convert mock data into real backend-connected data gradually.
4. Keep frontend, backend, database, AI, weather, logistics, and payment logic separated.
5. Do not expose API keys in frontend code.
6. Validate important business rules on the backend.
7. Do not implement every feature in one step.
8. Complete one phase, test it, then continue.
9. Use rule-based logic where real machine learning is not yet required.
10. Clearly distinguish demo data, estimated data, AI predictions, and verified data.
11. Do not present AI results as guaranteed agricultural, financial, or medical outcomes.
12. Preserve a clean and understandable folder structure.
13. Every major feature must connect to the database rather than relying only on frontend state.
14. Existing functionality should not be broken when adding new features.
15. Demand forecasting should assist production planning but must not replace confirmed buyer demand.
16. Logistics recommendations should be transparent and explainable.
17. Route recommendations should be treated as suggestions unless connected to verified real-time logistics data.
18. The MVP should prioritize a complete working flow over excessive complexity.
19. Each new phase should build on the previous phase without unnecessary redesign.
20. Preserve backward compatibility with completed project phases wherever practical.