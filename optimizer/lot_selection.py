import math
import time
from ortools.sat.python import cp_model
from cost import calculate_spatial_cost_proxy

def select_optimal_lots_cpsat(opt_input, remaining_time_sec=10.0):
    """
    STAGE 1: Demand-Aware Lot Selection using Google OR-Tools CP-SAT.
    
    Linearized Shortage & Excess Model:
    - Decision variables: x_i in {0, 1} for each eligible harvest lot i.
    - selectedQuantity = SUM(quantity_i * x_i)
    - shortage = max(0, demandKg - selectedQuantity)
    - excess = max(0, selectedQuantity - demandKg)
    
    Objective Hierarchy:
    1. Satisfy requested buyer demand as much as feasible (minimize shortage * unmetDemandPenaltyPerKg).
    2. Minimize unneeded excess produce beyond requested demand (minimize excess * excessPenaltyPerKg).
    3. Minimize spatial transport cost proxy (minimize SUM(x_i * costProxy_i)).
    
    Returns:
    - selected_lots: Subset of eligible harvest lots selected by CP-SAT.
    - runtime_ms: Execution duration in milliseconds.
    - selection_summary: Shortage, excess, and total selected quantity.
    """
    t0 = time.time()
    
    lots = opt_input.lots
    vehicles = opt_input.vehicles
    demand_kg = opt_input.demand_kg
    matrix_map = opt_input.matrix_map
    destination = opt_input.destination

    N = len(lots)
    if N == 0:
        return [], 0.0, {"selectedQuantityKg": 0, "shortageKg": demand_kg, "excessKg": 0}

    total_supply_kg = sum(int(math.ceil(float(l.get("quantityKg", 0)))) for l in lots)
    target_demand = int(math.ceil(demand_kg)) if demand_kg > 0 else total_supply_kg

    model = cp_model.CpModel()

    # 1. Binary decision variables x_i for lot selection
    x = [model.new_bool_var(f"x_{i}") for i in range(N)]

    # Lot quantities as integer values (in KG)
    lot_qtys = [int(math.ceil(float(l.get("quantityKg", 0)))) for l in lots]

    # 1b. Individual vehicle capacity feasibility constraints
    M = len(vehicles)
    vehicle_caps = [int(math.floor(float(v.get("capacityKg", 0)))) for v in vehicles]

    y = {}
    for i in range(N):
        for v in range(M):
            y[(i, v)] = model.new_bool_var(f"y_{i}_{v}")

    # Constraint: Each selected lot i (x_i = 1) must be assigned to exactly 1 vehicle v
    for i in range(N):
        model.add(sum(y[(i, v)] for v in range(M)) == x[i])

    # Constraint: Total lot load assigned to vehicle v cannot exceed its capacity
    for v in range(M):
        cap = vehicle_caps[v]
        model.add(sum(y[(i, v)] * lot_qtys[i] for i in range(N)) <= cap)

    # 2. total_selected_qty variable
    max_possible_qty = max(total_supply_kg, target_demand * 2)
    total_selected_qty = model.new_int_var(0, max_possible_qty, "total_selected_qty")
    model.add(total_selected_qty == sum(x[i] * lot_qtys[i] for i in range(N)))

    # 3. Shortage and Excess variables & linearized constraints
    shortage = model.new_int_var(0, target_demand, "shortage")
    model.add(shortage >= target_demand - total_selected_qty)

    excess = model.new_int_var(0, max_possible_qty, "excess")
    model.add(excess >= total_selected_qty - target_demand)

    # 4. Spatial transport cost proxy for each lot
    cost_proxies = []
    for i, lot in enumerate(lots):
        c_proxy = calculate_spatial_cost_proxy(lot, vehicles, destination, matrix_map, opt_input)
        cost_proxies.append(c_proxy)

    # 5. Objective Coefficients
    # unmetDemandPenaltyPerKg is in INR per KG. In paise, it is * 100.
    unmet_penalty_paise_per_kg = int(round(opt_input.unmet_demand_penalty_per_kg * 100))
    # Excess penalty: small cost (e.g., 10 INR = 1000 paise per excess KG) to prevent collecting unnecessary excess produce
    excess_penalty_paise_per_kg = 1000

    # Total Objective = (shortage * unmet_penalty) + (excess * excess_penalty) + sum(x_i * costProxy_i)
    shortage_term = shortage * unmet_penalty_paise_per_kg
    excess_term = excess * excess_penalty_paise_per_kg
    transport_term = sum(x[i] * cost_proxies[i] for i in range(N))

    model.minimize(shortage_term + excess_term + transport_term)

    # 6. Solve CP-SAT model
    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = max(0.5, remaining_time_sec)
    
    status = solver.solve(model)
    t1 = time.time()
    runtime_ms = round((t1 - t0) * 1000, 2)

    selected_lots = []
    if status in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        for i in range(N):
            if solver.value(x[i]) == 1:
                selected_lots.append(lots[i])
        
        sel_qty = solver.value(total_selected_qty)
        sh_qty = solver.value(shortage)
        ex_qty = solver.value(excess)
    else:
        selected_lots = list(lots)
        sel_qty = total_supply_kg
        sh_qty = max(0, target_demand - total_supply_kg)
        ex_qty = max(0, total_supply_kg - target_demand)

    return selected_lots, runtime_ms, {
        "selectedQuantityKg": sel_qty,
        "shortageKg": sh_qty,
        "excessKg": ex_qty
    }
