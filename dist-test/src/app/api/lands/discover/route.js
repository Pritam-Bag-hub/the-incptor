"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
const server_1 = require("next/server");
const auth_1 = require("@/lib/auth");
const db_1 = require("@/lib/db");
// Haversine distance calculation
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}
async function GET(request) {
    try {
        const user = await (0, auth_1.getSessionUser)();
        if (!user) {
            return server_1.NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        if (user.role !== "BUYER") {
            return server_1.NextResponse.json({ error: "Forbidden: Buyer role required" }, { status: 403 });
        }
        const { searchParams } = new URL(request.url);
        const demandId = searchParams.get("demandId");
        let filterState = searchParams.get("state") || "";
        let filterDistrict = searchParams.get("district") || "";
        let filterLatStr = searchParams.get("latitude") || "";
        let filterLngStr = searchParams.get("longitude") || "";
        let filterRadiusStr = searchParams.get("radiusKm") || "";
        let filterCropId = searchParams.get("cropId") || "";
        let requiredLandArea = 0;
        // Load from demand if demandId is provided
        if (demandId) {
            const demand = await db_1.db.buyerDemand.findUnique({
                where: { id: demandId },
            });
            if (!demand) {
                return server_1.NextResponse.json({ error: "Selected demand profile not found." }, { status: 404 });
            }
            if (demand.buyerId !== user.id) {
                return server_1.NextResponse.json({ error: "Forbidden: You do not own this demand" }, { status: 403 });
            }
            filterState = demand.preferredState;
            filterDistrict = demand.preferredDistrict || "";
            filterLatStr = demand.preferredLatitude !== null ? demand.preferredLatitude.toString() : "";
            filterLngStr = demand.preferredLongitude !== null ? demand.preferredLongitude.toString() : "";
            filterRadiusStr = demand.searchRadiusKm !== null ? demand.searchRadiusKm.toString() : "";
            filterCropId = demand.cropId;
            requiredLandArea = demand.requiredLandArea || 0;
        }
        const lat = filterLatStr ? parseFloat(filterLatStr) : null;
        const lng = filterLngStr ? parseFloat(filterLngStr) : null;
        const radiusKm = filterRadiusStr ? parseFloat(filterRadiusStr) : null;
        // Fetch all AVAILABLE lands (exclude UNAVAILABLE, UNDER_CONTRACT)
        const lands = await db_1.db.land.findMany({
            where: {
                status: "AVAILABLE",
            },
            include: {
                owner: true,
            },
        });
        const results = [];
        for (const land of lands) {
            let score = 0;
            const reasons = [];
            let distanceKm = null;
            let passesRadiusFilter = true;
            // Calculate distance if coordinates are available
            if (lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng)) {
                distanceKm = calculateDistance(lat, lng, land.latitude, land.longitude);
                if (radiusKm !== null && !isNaN(radiusKm)) {
                    if (distanceKm > radiusKm) {
                        passesRadiusFilter = false;
                    }
                    else {
                        score += 20;
                        reasons.push(`Within selected ${radiusKm} km radius`);
                    }
                }
                else {
                    // Fallback default 50km
                    if (distanceKm <= 50) {
                        score += 15;
                        reasons.push("Within default 50 km radius");
                    }
                }
            }
            // If out of radius, exclude it
            if (!passesRadiusFilter)
                continue;
            // State match check
            if (filterState && land.state.toLowerCase() === filterState.toLowerCase()) {
                score += 50;
                reasons.push(`Matches preferred state: ${land.state}`);
            }
            // District match check
            if (filterDistrict && land.district.toLowerCase() === filterDistrict.toLowerCase()) {
                score += 30;
                reasons.push(`Matches preferred district: ${land.district}`);
            }
            // Land size match
            if (requiredLandArea > 0 && land.size >= requiredLandArea) {
                score += 10;
                reasons.push("Land area meets requirement");
            }
            const finalScore = Math.min(score, 100);
            results.push({
                id: land.id,
                name: land.name,
                size: land.size,
                unit: land.unit,
                village: land.village,
                district: land.district,
                state: land.state,
                latitude: land.latitude,
                longitude: land.longitude,
                status: land.status,
                distanceKm: distanceKm !== null ? parseFloat(distanceKm.toFixed(2)) : null,
                matchScore: finalScore,
                matchReasons: reasons,
                ownerName: land.owner.name,
            });
        }
        // Sort by highest matchScore, then by shortest distance
        results.sort((a, b) => {
            if (b.matchScore !== a.matchScore) {
                return b.matchScore - a.matchScore;
            }
            if (a.distanceKm !== null && b.distanceKm !== null) {
                return a.distanceKm - b.distanceKm;
            }
            if (a.distanceKm !== null)
                return -1;
            if (b.distanceKm !== null)
                return 1;
            return 0;
        });
        return server_1.NextResponse.json(results);
    }
    catch (error) {
        console.error("GET Lands Discover Error:", error);
        return server_1.NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
