import path from "path";
import fs from "fs";
import { spawn } from "child_process";
import { buildOptimizationInput, BuildOptimizationInputOptions } from "./optimizationHelpers";
import { buildRouteMatrix, MockFetchFn } from "./matrixHelpers";
import {
  SolverConfig,
  OptimizationSolveResponse,
  OptimizedRoute,
  DemandFulfillmentSummary,
  BaselineComparison,
  SavingsMetrics,
  ExcludedLotResult,
  ExcludedVehicleResult,
  SolverSolutionStatus,
} from "./solverTypes";
import { EligibleLot, EligibleVehicle } from "./optimizationTypes";
import { db } from "./db";
import { normalizeQuantityToKg } from "./quantityHelpers";

export interface SolveRouteOptimizationOptions extends BuildOptimizationInputOptions {
  commodityId?: string;
  demandKg?: number;
  config?: SolverConfig;
  mockFetch?: MockFetchFn;
  mockPythonSolver?: (inputData: any) => Promise<any>;
}

/**
 * Executes Python OR-Tools VRP solver via stdin/stdout IPC.
 */
async function runPythonSolver(inputData: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const projectRoot = process.cwd();
    const venvPythonWin = path.join(projectRoot, ".venv", "Scripts", "python.exe");
    const venvPythonUnix = path.join(projectRoot, ".venv", "bin", "python");

    let pythonPath = "python";
    if (fs.existsSync(venvPythonWin)) {
      pythonPath = venvPythonWin;
    } else if (fs.existsSync(venvPythonUnix)) {
      pythonPath = venvPythonUnix;
    }

    const scriptPath = path.join(projectRoot, "optimizer", "solve.py");
    const pyProcess = spawn(pythonPath, [scriptPath]);

    let stdoutData = "";
    let stderrData = "";

    pyProcess.stdout.on("data", (chunk) => {
      stdoutData += chunk.toString();
    });

    pyProcess.stderr.on("data", (chunk) => {
      stderrData += chunk.toString();
    });

    pyProcess.on("close", (code) => {
      if (code !== 0) {
        return reject(
          new Error(`Python optimizer process exited with code ${code}. Stderr: ${stderrData}`)
        );
      }

      try {
        const parsed = JSON.parse(stdoutData);
        resolve(parsed);
      } catch (err: any) {
        reject(
          new Error(`Failed to parse Python optimizer stdout: ${err.message}. Raw output: ${stdoutData}`)
        );
      }
    });

    pyProcess.on("error", (err) => {
      reject(new Error(`Failed to spawn Python process (${pythonPath}): ${err.message}`));
    });

    pyProcess.stdin.on("error", (_err) => {
      // Ignore EPIPE / EOF errors on stdin if process closes early
    });

    pyProcess.stdin.write(JSON.stringify(inputData));
    pyProcess.stdin.end();
  });
}

/**
 * Main Entry Point for Multi-Vehicle Route Optimization (Phase 7.4.3).
 * Solves Capacitated VRP using Google OR-Tools.
 * Strictly READ-ONLY — zero database modifications.
 */
export async function solveRouteOptimization(
  options: SolveRouteOptimizationOptions = {}
): Promise<OptimizationSolveResponse> {
  const startTime = Date.now();
  const warnings: string[] = [];

  // Config parameters & defaults
  const distanceCostPerKm = options.config?.distanceCostPerKm ?? 15.0;
  const timeCostPerHour = options.config?.timeCostPerHour ?? 250.0;
  const vehicleFixedCost = options.config?.vehicleFixedCost ?? 1500.0;
  const unmetDemandPenaltyPerKg = options.config?.unmetDemandPenaltyPerKg ?? 100.0;
  const timeLimitSeconds = options.config?.timeLimitSeconds ?? 10;

  const configUsed: Required<SolverConfig> = {
    distanceCostPerKm,
    timeCostPerHour,
    vehicleFixedCost,
    unmetDemandPenaltyPerKg,
    timeLimitSeconds,
  };

  // 1. Fetch normalized input from Phase 7.4.1 helper
  const optInput = await buildOptimizationInput(options);

  let eligibleLots: EligibleLot[] = [...optInput.lots];
  const excludedLotsList: ExcludedLotResult[] = optInput.excludedLots.map((el) => ({
    receiptId: el.receiptId,
    receiptNumber: el.receiptNumber,
    reason: el.reason,
  }));

  let eligibleVehicles: EligibleVehicle[] = [...optInput.vehicles];
  const excludedVehiclesList: ExcludedVehicleResult[] = optInput.excludedVehicles.map((ev) => ({
    vehicleId: ev.vehicleId,
    vehicleNumber: ev.vehicleNumber,
    reason: ev.reason,
  }));

  // 2. Enforce Commodity Compatibility Rule (Section 10)
  let targetCommodityId = options.commodityId;

  if (!targetCommodityId && options.demandId) {
    const demand = await db.buyerDemand.findUnique({
      where: { id: options.demandId },
      select: { cropId: true },
    });
    if (demand) {
      targetCommodityId = demand.cropId;
    }
  }

  if (targetCommodityId) {
    const filteredLots: EligibleLot[] = [];
    for (const lot of eligibleLots) {
      if (lot.cropId === targetCommodityId) {
        filteredLots.push(lot);
      } else {
        excludedLotsList.push({
          receiptId: lot.receiptId,
          receiptNumber: lot.receiptNumber,
          reason: `COMMODITY_MISMATCH: Lot crop (${lot.cropName}) does not match requested commodity filter`,
        });
      }
    }
    eligibleLots = filteredLots;
  } else {
    // Check if multiple crops present
    const cropSet = new Set(eligibleLots.map((l) => l.cropId));
    if (cropSet.size > 1) {
      throw new Error(
        "MULTIPLE_COMMODITIES_PRESENT: Multiple crops detected in eligible harvest lots. Please specify a commodityId/cropId filter."
      );
    }
  }

  // 3. Strict Vehicle Eligibility Validation (Section 8)
  const validVehicles: EligibleVehicle[] = [];
  for (const v of eligibleVehicles) {
    if (!v.isAvailable || v.status !== "IDLE") {
      excludedVehiclesList.push({
        vehicleId: v.vehicleId,
        vehicleNumber: v.vehicleNumber,
        reason: !v.isAvailable ? "NOT_AVAILABLE" : "NOT_IDLE",
      });
      continue;
    }

    if (v.capacityKg <= 0) {
      excludedVehiclesList.push({
        vehicleId: v.vehicleId,
        vehicleNumber: v.vehicleNumber,
        reason: "INVALID_CAPACITY",
      });
      continue;
    }

    if (!v.currentLocation || typeof v.currentLocation.latitude !== "number" || typeof v.currentLocation.longitude !== "number") {
      excludedVehiclesList.push({
        vehicleId: v.vehicleId,
        vehicleNumber: v.vehicleNumber,
        reason: "MISSING_START_LOCATION",
      });
      continue;
    }

    validVehicles.push(v);
  }
  eligibleVehicles = validVehicles;

  // 4. Vehicle Capacity & Oversized Lot Filtering (Section 7)
  const maxVehicleCapacityKg = eligibleVehicles.reduce(
    (max, v) => Math.max(max, v.capacityKg),
    0
  );

  const nonOversizedLots: EligibleLot[] = [];
  for (const lot of eligibleLots) {
    if (lot.quantityKg > maxVehicleCapacityKg) {
      excludedLotsList.push({
        receiptId: lot.receiptId,
        receiptNumber: lot.receiptNumber,
        reason: `OVERSIZED_LOT: Lot quantity (${lot.quantityKg} KG) exceeds maximum available vehicle capacity (${maxVehicleCapacityKg} KG)`,
      });
    } else {
      nonOversizedLots.push(lot);
    }
  }
  eligibleLots = nonOversizedLots;

  // 5. Determine Demand KG & Total Available Supply
  const totalAvailableSupplyKg = eligibleLots.reduce((sum, l) => sum + l.quantityKg, 0);

  let requestedDemandKg = options.demandKg;
  if (requestedDemandKg === undefined || requestedDemandKg <= 0) {
    if (options.demandId) {
      const demandRecord = await db.buyerDemand.findUnique({
        where: { id: options.demandId },
      });
      if (demandRecord) {
        requestedDemandKg = normalizeQuantityToKg(
          demandRecord.requiredQuantity,
          demandRecord.quantityUnit
        );
      }
    }
  }

  if (requestedDemandKg === undefined || requestedDemandKg <= 0) {
    requestedDemandKg = totalAvailableSupplyKg;
  }

  // NOTE: All eligible lots are passed directly to OR-Tools without any straight-line pre-selection.

  // Check feasibility
  if (eligibleLots.length === 0 || eligibleVehicles.length === 0) {
    const status: SolverSolutionStatus = "NO_FEASIBLE_SOLUTION";
    return {
      solutionStatus: status,
      demand: {
        requestedDemandKg,
        availableSupplyKg: totalAvailableSupplyKg,
        selectedQuantityKg: 0,
        fulfilledQuantityKg: 0,
        shortageQuantityKg: requestedDemandKg,
        fulfillmentPercentage: 0,
      },
      vehiclesUsed: 0,
      totalDistanceMeters: 0,
      totalDurationSeconds: 0,
      estimatedCost: 0,
      baseline: { distanceMeters: 0, durationSeconds: 0, estimatedCost: 0, vehiclesUsed: 0 },
      savings: { distanceMeters: 0, distancePercent: 0, cost: 0, costPercent: 0 },
      routes: [],
      selectedLots: [],
      excludedLots: excludedLotsList,
      excludedVehicles: excludedVehiclesList,
      warnings: ["Insufficient eligible lots or vehicles to perform optimization."],
      solverMetadata: {
        solverEngine: "Google OR-Tools VRP",
        solverDurationMs: Date.now() - startTime,
        configUsed,
        timestamp: new Date().toISOString(),
      },
    };
  }

  // 6. Build Road Matrix (Phase 7.4.2)
  const matrixResponse = await buildRouteMatrix(options);

  // 7. Invoke Python OR-Tools VRP Engine
  const solverInputData = {
    locations: matrixResponse.locations,
    matrix: matrixResponse.matrix,
    lots: eligibleLots,
    vehicles: eligibleVehicles,
    destination: optInput.destination,
    demandKg: requestedDemandKg,
    config: configUsed,
  };

  let solverRawResult: any;
  if (options.mockPythonSolver) {
    solverRawResult = await options.mockPythonSolver(solverInputData);
  } else {
    solverRawResult = await runPythonSolver(solverInputData);
  }

  if (solverRawResult.error || solverRawResult.status === "NO_FEASIBLE_SOLUTION") {
    return {
      solutionStatus: "NO_FEASIBLE_SOLUTION",
      demand: {
        requestedDemandKg,
        availableSupplyKg: totalAvailableSupplyKg,
        selectedQuantityKg: 0,
        fulfilledQuantityKg: 0,
        shortageQuantityKg: requestedDemandKg,
        fulfillmentPercentage: 0,
      },
      vehiclesUsed: 0,
      totalDistanceMeters: 0,
      totalDurationSeconds: 0,
      estimatedCost: 0,
      baseline: { distanceMeters: 0, durationSeconds: 0, estimatedCost: 0, vehiclesUsed: 0 },
      savings: { distanceMeters: 0, distancePercent: 0, cost: 0, costPercent: 0 },
      routes: [],
      selectedLots: [],
      excludedLots: excludedLotsList,
      excludedVehicles: excludedVehiclesList,
      warnings: [solverRawResult.error || "OR-Tools solver could not find a feasible solution."],
      solverMetadata: {
        solverEngine: "Google OR-Tools VRP",
        solverDurationMs: Date.now() - startTime,
        configUsed,
        timestamp: new Date().toISOString(),
      },
    };
  }

  // 8. Post-Solver Independent Route Validation (Section 19)
  const rawRoutes: any[] = solverRawResult.routes || [];
  const selectedLotIds = new Set<string>();
  let validationPassed = true;
  let validationErrorMsg = "";

  const matrixEdgeMap = new Map<string, any>();
  for (const elem of matrixResponse.matrix) {
    matrixEdgeMap.set(`${elem.originId}->${elem.destinationId}`, elem);
  }

  const eligibleLotMap = new Map<string, EligibleLot>();
  for (const lot of eligibleLots) {
    eligibleLotMap.set(lot.receiptId, lot);
  }

  const eligibleVehicleMap = new Map<string, EligibleVehicle>();
  for (const v of eligibleVehicles) {
    eligibleVehicleMap.set(v.vehicleId, v);
  }

  for (const r of rawRoutes) {
    const vehicle = eligibleVehicleMap.get(r.vehicleId);
    if (!vehicle) {
      validationPassed = false;
      validationErrorMsg = `VALIDATION_FAILED: Route assigned to invalid or non-eligible vehicle (${r.vehicleId})`;
      break;
    }

    if (r.assignedLoadKg > vehicle.capacityKg) {
      validationPassed = false;
      validationErrorMsg = `VALIDATION_FAILED: Route assigned load (${r.assignedLoadKg} KG) exceeds vehicle capacity (${vehicle.capacityKg} KG)`;
      break;
    }

    for (const stop of r.stops || []) {
      if (stop.lotId) {
        if (selectedLotIds.has(stop.lotId)) {
          validationPassed = false;
          validationErrorMsg = `VALIDATION_FAILED: Harvest Lot ${stop.lotId} appeared more than once across routes`;
          break;
        }

        const lot = eligibleLotMap.get(stop.lotId);
        if (!lot) {
          validationPassed = false;
          validationErrorMsg = `VALIDATION_FAILED: Route includes non-eligible or rejected Lot (${stop.lotId})`;
          break;
        }

        selectedLotIds.add(stop.lotId);
      }
    }

    if (!validationPassed) break;
  }

  if (!validationPassed) {
    return {
      solutionStatus: "NO_FEASIBLE_SOLUTION",
      demand: {
        requestedDemandKg,
        availableSupplyKg: totalAvailableSupplyKg,
        selectedQuantityKg: 0,
        fulfilledQuantityKg: 0,
        shortageQuantityKg: requestedDemandKg,
        fulfillmentPercentage: 0,
      },
      vehiclesUsed: 0,
      totalDistanceMeters: 0,
      totalDurationSeconds: 0,
      estimatedCost: 0,
      baseline: { distanceMeters: 0, durationSeconds: 0, estimatedCost: 0, vehiclesUsed: 0 },
      savings: { distanceMeters: 0, distancePercent: 0, cost: 0, costPercent: 0 },
      routes: [],
      selectedLots: [],
      excludedLots: excludedLotsList,
      excludedVehicles: excludedVehiclesList,
      warnings: [validationErrorMsg],
      solverMetadata: {
        solverEngine: "Google OR-Tools VRP",
        solverDurationMs: Date.now() - startTime,
        configUsed,
        timestamp: new Date().toISOString(),
      },
    };
  }

  // 9. Build Selected Lots List & Categorize Unselected Eligible Lots
  const selectedLotsDetails: EligibleLot[] = [];
  let selectedQuantityKg = 0;

  for (const lotId of selectedLotIds) {
    const lot = eligibleLotMap.get(lotId);
    if (lot) {
      selectedLotsDetails.push(lot);
      selectedQuantityKg += lot.quantityKg;
    }
  }

  for (const lot of eligibleLots) {
    if (!selectedLotIds.has(lot.receiptId)) {
      excludedLotsList.push({
        receiptId: lot.receiptId,
        receiptNumber: lot.receiptNumber,
        reason: "NOT_SELECTED_BY_OPTIMIZER (Excess supply or higher modeled transport cost)",
      });
    }
  }

  const fulfilledQuantityKg = Math.min(requestedDemandKg, selectedQuantityKg);
  const shortageQuantityKg = Math.max(0, requestedDemandKg - fulfilledQuantityKg);
  const fulfillmentPercentage =
    requestedDemandKg > 0
      ? Math.round((fulfilledQuantityKg / requestedDemandKg) * 10000) / 100
      : 100;

  if (shortageQuantityKg > 0) {
    warnings.push(
      `DEMAND_SHORTAGE: Unfulfilled demand of ${shortageQuantityKg.toLocaleString()} KG. Requested: ${requestedDemandKg.toLocaleString()} KG, Fulfilled: ${fulfilledQuantityKg.toLocaleString()} KG.`
    );
  }

  // 10. Direct-Trip Baseline & Savings Calculation (Section 13)
  let baselineDistanceMeters = 0;
  let baselineDurationSeconds = 0;

  for (const lot of selectedLotsDetails) {
    const lotNodeId = `LOT_${lot.receiptId}`;
    const edgeKey = `${lotNodeId}->DESTINATION`;
    const edge = matrixEdgeMap.get(edgeKey);

    if (edge && edge.status === "OK") {
      baselineDistanceMeters += edge.distanceMeters;
      baselineDurationSeconds += edge.durationSeconds;
    } else {
      baselineDistanceMeters += 10000;
      baselineDurationSeconds += 900;
    }
  }

  const baselineDistKm = baselineDistanceMeters / 1000.0;
  const baselineDurHr = baselineDurationSeconds / 3600.0;
  const baselineEstimatedCost = Math.round(
    (baselineDistKm * distanceCostPerKm) +
    (baselineDurHr * timeCostPerHour) +
    (selectedLotsDetails.length * vehicleFixedCost)
  );

  const baseline: BaselineComparison = {
    distanceMeters: baselineDistanceMeters,
    durationSeconds: baselineDurationSeconds,
    estimatedCost: baselineEstimatedCost,
    vehiclesUsed: selectedLotsDetails.length,
  };

  const optDistanceMeters = solverRawResult.totalDistanceMeters || 0;
  const optDurationSeconds = solverRawResult.totalDurationSeconds || 0;

  let optEstimatedCost = 0;
  for (const r of rawRoutes) {
    optEstimatedCost += r.estimatedCost || 0;
  }
  optEstimatedCost = Math.round(optEstimatedCost * 100) / 100;

  const distanceSavedMeters = Math.max(0, baselineDistanceMeters - optDistanceMeters);
  const distanceSavingsPercent =
    baselineDistanceMeters > 0
      ? Math.round(((baselineDistanceMeters - optDistanceMeters) / baselineDistanceMeters) * 10000) / 100
      : 0;

  const costSaved = Math.max(0, Math.round((baselineEstimatedCost - optEstimatedCost) * 100) / 100);
  const costSavingsPercent =
    baselineEstimatedCost > 0
      ? Math.round(((baselineEstimatedCost - optEstimatedCost) / baselineEstimatedCost) * 10000) / 100
      : 0;

  const savings: SavingsMetrics = {
    distanceMeters: distanceSavedMeters,
    distancePercent: distanceSavingsPercent,
    cost: costSaved,
    costPercent: costSavingsPercent,
  };

  const solutionStatus: SolverSolutionStatus =
    (solverRawResult.status as SolverSolutionStatus) || "FEASIBLE";

  return {
    solutionStatus,
    demand: {
      requestedDemandKg,
      availableSupplyKg: totalAvailableSupplyKg,
      selectedQuantityKg,
      fulfilledQuantityKg,
      shortageQuantityKg,
      fulfillmentPercentage,
    },
    vehiclesUsed: rawRoutes.length,
    totalDistanceMeters: optDistanceMeters,
    totalDurationSeconds: optDurationSeconds,
    estimatedCost: optEstimatedCost,
    baseline,
    savings,
    routes: rawRoutes as OptimizedRoute[],
    selectedLots: selectedLotsDetails,
    excludedLots: excludedLotsList,
    excludedVehicles: excludedVehiclesList,
    warnings,
    solverMetadata: {
      solverEngine: "Google OR-Tools VRP",
      solverDurationMs: Date.now() - startTime,
      configUsed,
      timestamp: new Date().toISOString(),
    },
  };
}
