"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCropStages = getCropStages;
const db_1 = require("./db");
/**
 * 1. Database Template Provider
 * Fetches templates already stored/cached in the local database.
 */
class DatabaseTemplateProvider {
    async getStages(cropId, cropName) {
        const templates = await db_1.db.cropMilestoneTemplate.findMany({
            where: { cropId },
            orderBy: { sequence: "asc" },
        });
        if (templates.length === 0) {
            return null;
        }
        return templates.map((t) => ({
            title: t.title,
            sequence: t.sequence,
            recommendedDurationDays: t.recommendedDurationDays,
            durationPercentage: t.durationPercentage,
        }));
    }
}
/**
 * 2. External Crop API Provider
 * Isolated layer to fetch templates from external APIs.
 */
class ExternalCropAPIProvider {
    async getStages(cropId, cropName) {
        const apiUrl = process.env.CROP_API_URL;
        const apiKey = process.env.CROP_API_KEY;
        if (!apiUrl || !apiKey) {
            // API credentials not configured, fallback gracefully
            return null;
        }
        try {
            const response = await fetch(`${apiUrl}/crops/${encodeURIComponent(cropName)}/stages`, {
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                },
            });
            if (!response.ok) {
                return null;
            }
            const data = await response.json();
            if (data && Array.isArray(data.stages)) {
                return data.stages.map((s, idx) => ({
                    title: s.title,
                    sequence: s.sequence || (idx + 1),
                    recommendedDurationDays: s.recommendedDurationDays || null,
                    durationPercentage: s.durationPercentage || null,
                }));
            }
        }
        catch (error) {
            console.error("ExternalCropAPIProvider Error:", error);
        }
        return null;
    }
}
/**
 * 3. Fallback Provider
 * Serves Peas fallback template or generic fallback template.
 */
class FallbackProvider {
    async getStages(cropId, cropName) {
        const nameLower = cropName.toLowerCase();
        if (nameLower === "peas" || nameLower === "pea") {
            return [
                { title: "Land Preparation", sequence: 1, durationPercentage: 10 },
                { title: "Seed Treatment", sequence: 2, durationPercentage: 5 },
                { title: "Sowing", sequence: 3, durationPercentage: 5 },
                { title: "Germination", sequence: 4, durationPercentage: 10 },
                { title: "Vegetative Growth", sequence: 5, durationPercentage: 30 },
                { title: "Flowering", sequence: 6, durationPercentage: 20 },
                { title: "Pod Development", sequence: 7, durationPercentage: 10 },
                { title: "Harvesting", sequence: 8, durationPercentage: 10 },
            ];
        }
        // Generic fallback template
        return [
            { title: "Land Preparation", sequence: 1, durationPercentage: 10 },
            { title: "Sowing", sequence: 2, durationPercentage: 20 },
            { title: "Growing", sequence: 3, durationPercentage: 40 },
            { title: "Harvest Ready", sequence: 4, durationPercentage: 20 },
            { title: "Harvest Completed", sequence: 5, durationPercentage: 10 },
        ];
    }
}
/**
 * Unified Crop Milestone Provider
 * Orchestrates template lookups across database, API, and fallbacks,
 * then caches resolved templates back to the local database.
 */
async function getCropStages(cropId, cropName) {
    const dbProvider = new DatabaseTemplateProvider();
    const apiProvider = new ExternalCropAPIProvider();
    const fallbackProvider = new FallbackProvider();
    // 1. Try Database
    let stages = await dbProvider.getStages(cropId, cropName);
    if (stages) {
        return stages;
    }
    // 2. Try External API
    stages = await apiProvider.getStages(cropId, cropName);
    // 3. Try Fallback
    if (!stages) {
        stages = await fallbackProvider.getStages(cropId, cropName);
    }
    // Fallback will always return at least the generic template, so stages is guaranteed to be non-null here
    const finalStages = stages;
    // 4. Cache resolved templates in the database asynchronously/idempotently
    try {
        await db_1.db.$transaction(finalStages.map((stage) => db_1.db.cropMilestoneTemplate.upsert({
            where: {
                cropId_sequence: {
                    cropId,
                    sequence: stage.sequence,
                },
            },
            create: {
                cropId,
                title: stage.title,
                sequence: stage.sequence,
                recommendedDurationDays: stage.recommendedDurationDays,
                durationPercentage: stage.durationPercentage,
            },
            update: {
                title: stage.title,
                recommendedDurationDays: stage.recommendedDurationDays,
                durationPercentage: stage.durationPercentage,
            },
        })));
    }
    catch (err) {
        console.error("Failed to cache CropMilestoneTemplate in database:", err);
    }
    return finalStages;
}
