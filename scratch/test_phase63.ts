import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import {
  PrismaClient,
  Role,
  LandStatus,
  ContractStatus,
  MilestoneStatus,
  TaskStatus,
  TaskPriority,
} from "@prisma/client";
import { generateTasksForContract, getEffectiveTaskStatus, calculateTaskDaysOverdue } from "../src/lib/taskHelpers";
import { generateMilestonesForContract } from "../src/lib/contractHelpers";

const adapter = new PrismaBetterSqlite3({ url: "file:./prisma/dev.db" });
const prisma = new PrismaClient({ adapter });

async function runTests() {
  console.log("=== STARTING INTEGRATION TESTS FOR PHASE 6.3 ===");

  try {
    // 1. Setup clean test users
    await prisma.user.deleteMany({
      where: { phone: { in: ["+919999999921", "+919999999922", "+919999999923"] } },
    });

    const buyer = await prisma.user.create({
      data: { phone: "+919999999921", name: "Tasks Buyer", role: Role.BUYER },
    });
    const landowner = await prisma.user.create({
      data: { phone: "+919999999922", name: "Tasks Landowner", role: Role.LANDOWNER },
    });
    const unrelatedUser = await prisma.user.create({
      data: { phone: "+919999999923", name: "Tasks Unrelated User", role: Role.BUYER },
    });

    // Setup crop category and crops (Peas and Unknown)
    let category = await prisma.cropCategory.findFirst();
    if (!category) {
      category = await prisma.cropCategory.create({ data: { name: "Vegetables" } });
    }

    const peasCrop = await prisma.crop.upsert({
      where: { name: "Peas" },
      update: { durationDays: 60, categoryId: category.id },
      create: { name: "Peas", durationDays: 60, categoryId: category.id },
    });
    const maizeCrop = await prisma.crop.upsert({
      where: { name: "Maize" },
      update: { durationDays: 90, categoryId: category.id },
      create: { name: "Maize", durationDays: 90, categoryId: category.id },
    });

    // Clean up any pre-existing templates for these crops to ensure we fall back deterministically
    await prisma.cropMilestoneTemplate.deleteMany({
      where: { cropId: { in: [peasCrop.id, maizeCrop.id] } },
    });

    // Setup land parcels
    const land1 = await prisma.land.create({
      data: {
        ownerId: landowner.id,
        name: "Peas Field",
        size: 5.0,
        unit: "ACRE",
        address: "Field A",
        village: "Agri",
        district: "Patiala",
        state: "Punjab",
        latitude: 30.5,
        longitude: 76.2,
        status: LandStatus.UNDER_CONTRACT,
      },
    });

    const land2 = await prisma.land.create({
      data: {
        ownerId: landowner.id,
        name: "Maize Field",
        size: 5.0,
        unit: "ACRE",
        address: "Field B",
        village: "Agri",
        district: "Patiala",
        state: "Punjab",
        latitude: 30.5,
        longitude: 76.2,
        status: LandStatus.UNDER_CONTRACT,
      },
    });

    // Create demands
    const demand1 = await prisma.buyerDemand.create({
      data: {
        buyerId: buyer.id,
        cropId: peasCrop.id,
        requiredQuantity: 10.0,
        quantityUnit: "TONNE",
        preferredState: "Punjab",
        status: "ACTIVE",
      },
    });

    const demand2 = await prisma.buyerDemand.create({
      data: {
        buyerId: buyer.id,
        cropId: maizeCrop.id,
        requiredQuantity: 15.0,
        quantityUnit: "TONNE",
        preferredState: "Punjab",
        status: "ACTIVE",
      },
    });

    // Create contract for Peas (crop-specific tasks)
    const peasContract = await prisma.contract.create({
      data: {
        demandId: demand1.id,
        landId: land1.id,
        buyerId: buyer.id,
        landownerId: landowner.id,
        cropId: peasCrop.id,
        landArea: 5.0,
        allocatedQuantity: 10.0,
        proposedPrice: 150000,
        startDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // starts 10 days ago
        expectedHarvestDate: new Date(Date.now() + 50 * 24 * 60 * 60 * 1000), // 50 days in future
        status: ContractStatus.ACTIVE,
      },
    });

    // Create contract for Maize (unknown crop / generic fallback tasks)
    const maizeContract = await prisma.contract.create({
      data: {
        demandId: demand2.id,
        landId: land2.id,
        buyerId: buyer.id,
        landownerId: landowner.id,
        cropId: maizeCrop.id,
        landArea: 5.0,
        allocatedQuantity: 15.0,
        proposedPrice: 180000,
        startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        expectedHarvestDate: new Date(Date.now() + 85 * 24 * 60 * 60 * 1000),
        status: ContractStatus.ACTIVE,
      },
    });

    // Test 1: Milestone generation
    console.log("Test 1: Pre-requisite milestone generation...");
    await generateMilestonesForContract(peasContract.id, prisma);
    await generateMilestonesForContract(maizeContract.id, prisma);
    console.log("✓ Pass: Milestones created for both test contracts.");

    // Test 2: Peas receives crop-specific tasks
    console.log("\nTest 2: Peas contract generates crop-specific tasks...");
    const peasTasks = await generateTasksForContract(peasContract.id, prisma);
    if (!peasTasks) throw new Error("Failed to generate Peas tasks!");


    const landPrepTasks = peasTasks.filter((t: any) => t.milestone.title.toUpperCase().includes("LAND PREPARATION"));
    const hasFieldClearing = landPrepTasks.some((t: any) => t.title === "Field clearing");
    if (hasFieldClearing) {
      console.log("✓ Pass: Peas land preparation received specific task 'Field clearing'.");
    } else {
      throw new Error("Expected task 'Field clearing' not found on Peas land prep!");
    }

    // Test 3: Maize receives generic fallback tasks
    console.log("Test 3: Maize contract (unknown crop) generates generic fallback tasks...");
    const maizeTasks = await generateTasksForContract(maizeContract.id, prisma);
    if (!maizeTasks) throw new Error("Failed to generate Maize tasks!");

    const maizeLandPrepTasks = maizeTasks.filter((t: any) => t.milestone.title.toUpperCase().includes("LAND PREPARATION"));
    const hasFieldPrep = maizeLandPrepTasks.some((t: any) => t.title === "Field preparation");
    if (hasFieldPrep) {
      console.log("✓ Pass: Maize land preparation received fallback task 'Field preparation'.");
    } else {
      throw new Error("Expected fallback task 'Field preparation' not found on Maize!");
    }

    // Test 4: Idempotence check
    console.log("Test 4: Repeated generation does not create duplicate tasks...");
    const initialCount = await prisma.contractTask.count({ where: { contractId: peasContract.id } });
    await generateTasksForContract(peasContract.id, prisma);
    const postCount = await prisma.contractTask.count({ where: { contractId: peasContract.id } });
    if (initialCount === postCount) {
      console.log(`✓ Pass: Task count remained stable at ${postCount}.`);
    } else {
      throw new Error(`Expected identical counts, but went from ${initialCount} to ${postCount}!`);
    }

    // Test 6 & 7: Task references milestone and contract
    console.log("Test 6 & 7: Verify task database relations are intact...");
    const sampleTask = peasTasks[0];
    if (sampleTask.contractId === peasContract.id && sampleTask.milestoneId !== null) {
      console.log("✓ Pass: Task correctly references contract and milestone records.");
    } else {
      throw new Error("Task database relations are malformed!");
    }

    // Test 8: Task sequences are unique per milestone
    console.log("Test 8: Verify task sequences are unique within a milestone...");
    const firstMilestoneTasks = peasTasks.filter((t: any) => t.milestoneId === sampleTask.milestoneId);
    const sequences = firstMilestoneTasks.map((t: any) => t.sequence);
    const isUnique = new Set(sequences).size === sequences.length;
    if (isUnique) {
      console.log("✓ Pass: Task sequences are unique within the milestone.");
    } else {
      throw new Error(`Expected unique sequences, got duplicates: ${sequences}`);
    }

    // Test 9: Task dates are chronological
    console.log("Test 9: Verify task dates are sequential and chronological...");
    const chronological = firstMilestoneTasks.every((task: any, index: number) => {
      if (index === 0) return true;
      const prev = firstMilestoneTasks[index - 1];
      if (prev.plannedStart && task.plannedStart) {
        return new Date(prev.plannedStart).getTime() <= new Date(task.plannedStart).getTime();
      }
      return true;
    });
    if (chronological) {
      console.log("✓ Pass: Tasks are distributed sequentially and chronologically.");
    } else {
      throw new Error("Tasks dates are not chronological!");
    }

    // Test 10: Future tasks are not overdue
    console.log("Test 10: Future tasks do not get effective status OVERDUE...");
    const futureDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
    const effStatusFuture = getEffectiveTaskStatus(futureDate, TaskStatus.PENDING);
    if (effStatusFuture === "PENDING") {
      console.log("✓ Pass: Future task is classified as PENDING.");
    } else {
      throw new Error(`Expected PENDING, got: ${effStatusFuture}`);
    }

    // Test 11: Past incomplete tasks have effective status OVERDUE
    console.log("Test 11: Past incomplete tasks dynamically return effective status OVERDUE...");
    const pastDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
    const effStatusPast = getEffectiveTaskStatus(pastDate, TaskStatus.PENDING);
    if (effStatusPast === "OVERDUE") {
      console.log("✓ Pass: Overdue task dynamically marked as OVERDUE.");
    } else {
      throw new Error(`Expected OVERDUE, got: ${effStatusPast}`);
    }

    // Test 12: Completed tasks do not become overdue
    console.log("Test 12: Completed tasks maintains status COMPLETED despite passing due date...");
    const effStatusCompleted = getEffectiveTaskStatus(pastDate, TaskStatus.COMPLETED);
    if (effStatusCompleted === "COMPLETED") {
      console.log("✓ Pass: Completed task maintains COMPLETED effective status.");
    } else {
      throw new Error(`Expected COMPLETED, got: ${effStatusCompleted}`);
    }

    // Clean up test records
    console.log("\nCleaning up task integration test data...");
    await prisma.contractTask.deleteMany({
      where: { contractId: { in: [peasContract.id, maizeContract.id] } },
    });
    await prisma.contractMilestone.deleteMany({
      where: { contractId: { in: [peasContract.id, maizeContract.id] } },
    });
    await prisma.contract.deleteMany({
      where: { id: { in: [peasContract.id, maizeContract.id] } },
    });
    await prisma.land.delete({ where: { id: land1.id } });
    await prisma.land.delete({ where: { id: land2.id } });
    await prisma.buyerDemand.delete({ where: { id: demand1.id } });
    await prisma.buyerDemand.delete({ where: { id: demand2.id } });
    // Skip deleting Peas/Maize crop records to preserve database references.
    await prisma.user.delete({ where: { id: buyer.id } });
    await prisma.user.delete({ where: { id: landowner.id } });
    await prisma.user.delete({ where: { id: unrelatedUser.id } });

    console.log("\n=== ALL TASKS INTEGRATION TESTS PASSED ===");
  } catch (error) {
    console.error("\n✗ TEST RUNNER ENCOUNTERED ERROR:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
