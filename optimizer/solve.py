import sys
import json
import time
from models import OptimizationInput
from lot_selection import select_optimal_lots_cpsat
from route_solver import solve_vrp_routes

def solve_vrp_two_stage(data):
    """
    Two-Stage Optimization Architecture for Phase 7.4.3:
    - STAGE 1: CP-SAT demand-aware lot selection (ortools.sat.python.cp_model).
               Linearized shortage and excess penalties + spatial transport cost proxies.
    - STAGE 2: Multi-Vehicle Route Optimization using ONE OR-Tools RoutingModel pass.
               Solves VRP routing, capacities, vehicle starts, matrix costs, and sequences for S*.
    """
    start_monotonic = time.monotonic()
    
    opt_input = OptimizationInput(data)
    
    if not opt_input.locations or not opt_input.lots or not opt_input.vehicles:
        return {
            "status": "NO_FEASIBLE_SOLUTION",
            "routes": [],
            "error": "Insufficient locations, lots, or vehicles to solve VRP.",
            "solverRuntimeMs": 0,
        }

    global_time_limit = float(opt_input.time_limit_seconds)
    deadline = start_monotonic + global_time_limit

    # 1. STAGE 1: CP-SAT Lot Selection
    rem_stage1 = max(0.5, deadline - time.monotonic())
    selected_lots, cp_sat_runtime_ms, stage1_summary = select_optimal_lots_cpsat(
        opt_input, remaining_time_sec=rem_stage1
    )

    # Calculate remaining time for Stage 2
    rem_stage2 = deadline - time.monotonic()

    if rem_stage2 <= 0.1:
        elapsed_ms = round((time.monotonic() - start_monotonic) * 1000, 2)
        return {
            "solutionStatus": "NO_FEASIBLE_SOLUTION",
            "demand": {
                "requestedDemandKg": opt_input.demand_kg,
                "availableSupplyKg": sum(l.get("quantityKg", 0) for l in opt_input.lots),
                "selectedQuantityKg": stage1_summary.get("selectedQuantityKg", 0),
                "fulfilledQuantityKg": 0,
                "shortageQuantityKg": stage1_summary.get("shortageKg", opt_input.demand_kg),
                "fulfillmentPercentage": 0,
            },
            "vehiclesUsed": 0,
            "totalDistanceMeters": 0,
            "totalDurationSeconds": 0,
            "estimatedCost": 0,
            "baseline": {"distanceMeters": 0, "durationSeconds": 0, "estimatedCost": 0, "vehiclesUsed": 0},
            "savings": {"distanceMeters": 0, "distancePercent": 0, "cost": 0, "costPercent": 0},
            "routes": [],
            "selectedLots": [],
            "excludedLots": opt_input.excluded_lots,
            "excludedVehicles": opt_input.excluded_vehicles,
            "warnings": ["Global time limit reached before Stage 2 execution."],
            "solverMetadata": {
                "solverEngine": "Google OR-Tools VRP",
                "solverDurationMs": elapsed_ms,
                "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            },
            "solverRuntimeMs": elapsed_ms,
            "stage1RuntimeMs": cp_sat_runtime_ms,
            "stage2RuntimeMs": 0,
            "stage1Summary": stage1_summary,
        }

    # 2. STAGE 2: Single-Model RoutingModel VRP Solver
    vrp_result = solve_vrp_routes(
        opt_input, selected_lots, remaining_time_sec=rem_stage2
    )

    total_wall_runtime_ms = round((time.monotonic() - start_monotonic) * 1000, 2)

    # Combine metrics and status
    vrp_result["solverRuntimeMs"] = total_wall_runtime_ms
    vrp_result["stage1RuntimeMs"] = cp_sat_runtime_ms
    vrp_result["stage2RuntimeMs"] = vrp_result.get("runtimeMs", 0)
    vrp_result["stage1Summary"] = stage1_summary

    return vrp_result

if __name__ == "__main__":
    try:
        input_raw = sys.stdin.read()
        if not input_raw:
            print(json.dumps({"error": "No input JSON received on stdin."}))
            sys.exit(1)

        input_data = json.loads(input_raw)
        result = solve_vrp_two_stage(input_data)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"error": str(e), "status": "NO_FEASIBLE_SOLUTION", "solverRuntimeMs": 0}))
        sys.exit(1)
