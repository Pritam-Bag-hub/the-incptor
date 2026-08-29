import { TaskPriority } from "@prisma/client";

export interface TaskTemplate {
  title: string;
  description?: string;
  sequence: number;
  priority: TaskPriority;
  estimatedWorkHours?: number;
}

/**
 * Returns normalized crop task templates for a given crop name and milestone title.
 */
export function getCropTasks(cropName: string, milestoneTitle: string): TaskTemplate[] {
  const normalizedCrop = cropName.toLowerCase().trim();
  const normalizedMilestone = milestoneTitle.toUpperCase().trim();

  const isPeas = normalizedCrop === "peas" || normalizedCrop === "pea";

  if (isPeas) {
    if (normalizedMilestone.includes("LAND PREPARATION")) {
      return [
        { title: "Field clearing", description: "Clear rocks, weed debris, and pre-existing crop residues from the plot.", sequence: 1, priority: TaskPriority.MEDIUM, estimatedWorkHours: 4.0 },
        { title: "Primary soil preparation", description: "Till the soil to improve aeration, depth, and drainage.", sequence: 2, priority: TaskPriority.HIGH, estimatedWorkHours: 6.0 },
        { title: "Seedbed preparation", description: "Level the soil surface and form raised sowing rows.", sequence: 3, priority: TaskPriority.MEDIUM, estimatedWorkHours: 3.5 },
      ];
    }
    if (normalizedMilestone.includes("SEED TREATMENT")) {
      return [
        { title: "Select quality seeds", description: "Inspect and isolate healthy pea seeds free from physical deformities.", sequence: 1, priority: TaskPriority.HIGH, estimatedWorkHours: 2.0 },
        { title: "Treat seeds", description: "Apply Rhizobium inoculant or protective fungicides to promote nitrogen fixation and prevent dampening.", sequence: 2, priority: TaskPriority.HIGH, estimatedWorkHours: 3.0 },
        { title: "Prepare treated seed batch", description: "Dry treated seeds under shade and package them ready for sowing.", sequence: 3, priority: TaskPriority.MEDIUM, estimatedWorkHours: 1.5 },
      ];
    }
    if (normalizedMilestone.includes("SOWING")) {
      return [
        { title: "Prepare sowing lines", description: "Mark parallel lines with appropriate distance matching target spacing.", sequence: 1, priority: TaskPriority.LOW, estimatedWorkHours: 2.5 },
        { title: "Sow seeds", description: "Place seeds at correct depth and space uniformly.", sequence: 2, priority: TaskPriority.HIGH, estimatedWorkHours: 5.0 },
        { title: "Check sowing depth/spacing", description: "Verify spacing and depth measurements on sample rows.", sequence: 3, priority: TaskPriority.MEDIUM, estimatedWorkHours: 2.0 },
      ];
    }
    if (normalizedMilestone.includes("GERMINATION")) {
      return [
        { title: "Check germination", description: "Walk through the fields to record the germination rate and identify empty patches.", sequence: 1, priority: TaskPriority.MEDIUM, estimatedWorkHours: 3.0 },
        { title: "Inspect missing patches", description: "Document coordinates of patches showing poor seed germination.", sequence: 2, priority: TaskPriority.LOW, estimatedWorkHours: 1.5 },
        { title: "Perform gap filling if required", description: "Re-sow fresh seeds in identified patches to maintain plant density.", sequence: 3, priority: TaskPriority.MEDIUM, estimatedWorkHours: 4.0 },
      ];
    }
    if (normalizedMilestone.includes("VEGETATIVE GROWTH")) {
      return [
        { title: "Monitor crop growth", description: "Track shoot height, leaf development, and nitrogen nodules formation.", sequence: 1, priority: TaskPriority.LOW, estimatedWorkHours: 2.0 },
        { title: "Weed management", description: "Perform mechanical weeding or organic mulching to limit nutrient competition.", sequence: 2, priority: TaskPriority.MEDIUM, estimatedWorkHours: 6.0 },
        { title: "Irrigation management", description: "Maintain soil moisture at rooting depth without overwatering.", sequence: 3, priority: TaskPriority.HIGH, estimatedWorkHours: 3.0 },
      ];
    }
    if (normalizedMilestone.includes("FLOWERING")) {
      return [
        { title: "Monitor flowering", description: "Log flowering percentage and initial flower drop rates.", sequence: 1, priority: TaskPriority.LOW, estimatedWorkHours: 2.0 },
        { title: "Irrigation check", description: "Ensure stable watering cycles as stress during flowering limits pod yields.", sequence: 2, priority: TaskPriority.HIGH, estimatedWorkHours: 2.5 },
        { title: "Pest/disease observation", description: "Scan for pod borers, aphids, and powdery mildew signs.", sequence: 3, priority: TaskPriority.HIGH, estimatedWorkHours: 3.0 },
      ];
    }
    if (normalizedMilestone.includes("POD DEVELOPMENT")) {
      return [
        { title: "Monitor pod development", description: "Inspect pod size, shape, seed counts, and filling density.", sequence: 1, priority: TaskPriority.MEDIUM, estimatedWorkHours: 2.5 },
        { title: "Irrigation check", description: "Increase watering spacing slightly as pods fill and swell.", sequence: 2, priority: TaskPriority.MEDIUM, estimatedWorkHours: 2.0 },
        { title: "Pest/disease observation", description: "Observe crop closely to check for late pest infestations.", sequence: 3, priority: TaskPriority.HIGH, estimatedWorkHours: 3.0 },
      ];
    }
    if (normalizedMilestone.includes("HARVESTING") || normalizedMilestone.includes("HARVEST COMPLETED")) {
      return [
        { title: "Prepare harvesting equipment", description: "Sterilize and sharpen harvesting sickles, baskets, and clean collection bags.", sequence: 1, priority: TaskPriority.MEDIUM, estimatedWorkHours: 2.0 },
        { title: "Harvest crop", description: "Gently pick full green pods by hand or harvest vines during cool early morning hours.", sequence: 2, priority: TaskPriority.HIGH, estimatedWorkHours: 8.0 },
        { title: "Move harvested crop to collection point", description: "Transport harvested bags to the shade collection station to avoid heat spoilage.", sequence: 3, priority: TaskPriority.HIGH, estimatedWorkHours: 4.0 },
      ];
    }
  }

  // Generic Fallback Templates for other crops
  if (normalizedMilestone.includes("LAND PREPARATION")) {
    return [
      { title: "Field preparation", description: "Perform basic ground clearance and weed removal.", sequence: 1, priority: TaskPriority.MEDIUM, estimatedWorkHours: 4.0 },
      { title: "Soil preparation", description: "Till and plow field to cultivate suitable seed bed.", sequence: 2, priority: TaskPriority.MEDIUM, estimatedWorkHours: 5.0 },
    ];
  }
  if (normalizedMilestone.includes("SOWING")) {
    return [
      { title: "Seed preparation", description: "Prepare seed lot and ensure clean moisture levels.", sequence: 1, priority: TaskPriority.HIGH, estimatedWorkHours: 2.0 },
      { title: "Sowing", description: "Distribute and plant seeds along the field rows.", sequence: 2, priority: TaskPriority.HIGH, estimatedWorkHours: 6.0 },
    ];
  }
  if (
    normalizedMilestone.includes("GROWING") ||
    normalizedMilestone.includes("VEGETATIVE") ||
    normalizedMilestone.includes("GERMINATION") ||
    normalizedMilestone.includes("FLOWERING") ||
    normalizedMilestone.includes("POD")
  ) {
    return [
      { title: "Crop monitoring", description: "Regular walk-through checking growth stages and crop health.", sequence: 1, priority: TaskPriority.LOW, estimatedWorkHours: 3.0 },
      { title: "Weed management", description: "Manual weeding to prevent resource competition.", sequence: 2, priority: TaskPriority.MEDIUM, estimatedWorkHours: 5.0 },
      { title: "Irrigation check", description: "Check channels and ensure standard moisture rates.", sequence: 3, priority: TaskPriority.HIGH, estimatedWorkHours: 2.0 },
    ];
  }
  if (normalizedMilestone.includes("HARVEST READY") || normalizedMilestone.includes("PRE-HARVEST")) {
    return [
      { title: "Harvest preparation", description: "Arrange logistics, labor, and cleaning storage space.", sequence: 1, priority: TaskPriority.MEDIUM, estimatedWorkHours: 3.0 },
      { title: "Final crop inspection", description: "Verify ripeness indices and moisture levels before harvest.", sequence: 2, priority: TaskPriority.HIGH, estimatedWorkHours: 2.0 },
    ];
  }
  if (normalizedMilestone.includes("HARVEST COMPLETED") || normalizedMilestone.includes("HARVESTING")) {
    return [
      { title: "Harvest collection", description: "Reap and pile crop yield safely.", sequence: 1, priority: TaskPriority.HIGH, estimatedWorkHours: 7.0 },
      { title: "Prepare produce for collection/delivery", description: "Clean, pack, weigh, and tag harvested bags for distribution.", sequence: 2, priority: TaskPriority.HIGH, estimatedWorkHours: 4.0 },
    ];
  }

  // Fallback for custom milestone stages
  return [
    { title: "Milestone stage check", description: "Regular agricultural check matching milestone requirements.", sequence: 1, priority: TaskPriority.MEDIUM, estimatedWorkHours: 2.0 },
    { title: "Quality review", description: "Verify crop development status conforms to expectations.", sequence: 2, priority: TaskPriority.LOW, estimatedWorkHours: 1.5 },
  ];
}
