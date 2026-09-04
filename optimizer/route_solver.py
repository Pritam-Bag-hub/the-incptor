import math
import time
from ortools.constraint_solver import routing_enums_pb2
from ortools.constraint_solver import pywrapcp

def solve_vrp_routes(opt_input, selected_lots, remaining_time_sec=8.0):
    """
    STAGE 2: Multi-Vehicle Route Optimization using ONE OR-Tools RoutingModel pass.
    
    Receives ONLY the selected lots S* from Stage 1.
    Solves VRP route optimization, vehicle capacities, stop sequencing, vehicle start locations,
    and road transport costs in 1 single RoutingModel pass.
    
    Returns:
    - routes: List of optimized vehicle routes with stops, load, distance, duration, and cost.
    - runtime_ms: Execution duration in milliseconds.
    - status_str: 'OPTIMAL', 'FEASIBLE_NOT_OPTIMAL', or 'NO_FEASIBLE_SOLUTION'.
    - total_metrics: Total distance, duration, estimated cost, and fulfilled load.
    """
    t0 = time.time()
    raw_locations = opt_input.locations
    matrix_elements = opt_input.matrix
    vehicles = opt_input.vehicles
    destination = opt_input.destination

    if not selected_lots or not vehicles:
        return {
            "status": "NO_FEASIBLE_SOLUTION",
            "routes": [],
            "totalDistanceMeters": 0,
            "totalDurationSeconds": 0,
            "estimatedCost": 0,
            "totalFulfilledKg": 0,
            "runtimeMs": 0,
        }

    raw_loc_id_to_idx = opt_input.loc_id_to_idx

    # Build locations array specifically for this subset: DESTINATION (idx 0), selected_lots, vehicle start nodes
    locations = [raw_locations[0]] # DESTINATION is always index 0
    lot_node_indices = []

    lot_by_loc_idx = {}
    for lot in selected_lots:
        l_id = f"LOT_{lot['receiptId']}"
        if l_id in raw_loc_id_to_idx:
            orig_idx = raw_loc_id_to_idx[l_id]
            curr_idx = len(locations)
            locations.append(raw_locations[orig_idx])
            lot_node_indices.append(curr_idx)
            lot_by_loc_idx[curr_idx] = lot

    num_vehicles = len(vehicles)
    vehicle_capacities = [int(math.floor(float(v.get("capacityKg", 0)))) for v in vehicles]

    vehicle_start_indices = []
    for v in vehicles:
        v_id = v["vehicleId"]
        v_matrix_node_id = f"VEHICLE_{v_id}"

        if v_matrix_node_id in raw_loc_id_to_idx:
            orig_idx = raw_loc_id_to_idx[v_matrix_node_id]
            curr_idx = len(locations)
            locations.append(raw_locations[orig_idx])
            vehicle_start_indices.append(curr_idx)
        else:
            cur_loc = v.get("currentLocation", {})
            lat = cur_loc.get("latitude", destination.get("latitude", 0))
            lng = cur_loc.get("longitude", destination.get("longitude", 0))

            v_node_id = f"START_VEHICLE_{v_id}"
            curr_idx = len(locations)
            locations.append({
                "id": v_node_id,
                "type": "VEHICLE_START",
                "latitude": lat,
                "longitude": lng,
                "label": f"Start Location ({v.get('vehicleNumber', v_id)})"
            })
            vehicle_start_indices.append(curr_idx)

    N = len(locations)

    node_demands = [0] * N
    for curr_idx, lot in lot_by_loc_idx.items():
        qty = int(math.ceil(float(lot.get("quantityKg", lot.get("quantity", 0)))))
        node_demands[curr_idx] = qty

    def norm_id(nid):
        if nid.startswith("START_VEHICLE_"):
            return "VEHICLE_" + nid[len("START_VEHICLE_"):]
        return nid

    matrix_map = opt_input.matrix_map

    dist_matrix = [[0] * N for _ in range(N)]
    dur_matrix = [[0] * N for _ in range(N)]

    for i in range(N):
        for j in range(N):
            if i == j:
                dist_matrix[i][j] = 0
                dur_matrix[i][j] = 0
            else:
                o_id = norm_id(locations[i]["id"])
                d_id = norm_id(locations[j]["id"])
                pair = matrix_map.get((o_id, d_id))
                if pair:
                    dist_matrix[i][j] = pair[0]
                    dur_matrix[i][j] = pair[1]
                else:
                    d_lat = locations[i]["latitude"] - locations[j]["latitude"]
                    d_lng = locations[i]["longitude"] - locations[j]["longitude"]
                    est_m = int(math.sqrt(d_lat*d_lat + d_lng*d_lng) * 111000)
                    dist_matrix[i][j] = est_m
                    dur_matrix[i][j] = int(est_m / 13.88)

    dest_idx = 0
    starts = vehicle_start_indices
    ends = [dest_idx] * num_vehicles

    manager = pywrapcp.RoutingIndexManager(N, num_vehicles, starts, ends)
    routing = pywrapcp.RoutingModel(manager)

    distance_cost_per_km = opt_input.distance_cost_per_km
    time_cost_per_hour = opt_input.time_cost_per_hour
    vehicle_fixed_cost = opt_input.vehicle_fixed_cost

    def cost_callback(from_index, to_index):
        try:
            from_node = manager.IndexToNode(from_index)
            to_node = manager.IndexToNode(to_index)
            if from_node < 0 or from_node >= N or to_node < 0 or to_node >= N:
                return 0
            dist_m = dist_matrix[from_node][to_node]
            dur_s = dur_matrix[from_node][to_node]
            cost_paise = int(
                (dist_m / 1000.0) * distance_cost_per_km * 100 +
                (dur_s / 3600.0) * time_cost_per_hour * 100
            )
            return max(0, cost_paise)
        except Exception:
            return 0

    transit_callback_index = routing.RegisterTransitCallback(cost_callback)
    routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)

    def demand_callback(from_index):
        try:
            from_node = manager.IndexToNode(from_index)
            if from_node < 0 or from_node >= N:
                return 0
            return node_demands[from_node]
        except Exception:
            return 0

    demand_callback_index = routing.RegisterUnaryTransitCallback(demand_callback)
    routing.AddDimensionWithVehicleCapacity(
        demand_callback_index,
        0,
        vehicle_capacities,
        True,
        "Capacity"
    )

    # Optional disjunctions for selected lots
    for curr_idx in lot_node_indices:
        try:
            index = manager.NodeToIndex(curr_idx)
            if index >= 0 and not routing.IsStart(index) and not routing.IsEnd(index):
                routing.AddDisjunction([index], 1000000)
        except Exception:
            pass

    for v_idx in range(num_vehicles):
        routing.SetFixedCostOfVehicle(int(vehicle_fixed_cost * 100), v_idx)

    search_parameters = pywrapcp.DefaultRoutingSearchParameters()
    search_parameters.first_solution_strategy = (
        routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
    )
    search_parameters.local_search_metaheuristic = (
        routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH
    )
    search_parameters.time_limit.seconds = max(1, min(5, int(math.floor(remaining_time_sec))))

    solution = routing.SolveWithParameters(search_parameters)
    t1 = time.time()
    vrp_runtime_ms = round((t1 - t0) * 1000, 2)

    if not solution:
        return {
            "status": "NO_FEASIBLE_SOLUTION",
            "routes": [],
            "totalDistanceMeters": 0,
            "totalDurationSeconds": 0,
            "estimatedCost": 0,
            "totalFulfilledKg": 0,
            "runtimeMs": vrp_runtime_ms,
        }

    solver_status_code = routing.status()
    status_str = "OPTIMAL" if solver_status_code == 1 else "FEASIBLE_NOT_OPTIMAL"

    routes = []
    total_distance_m = 0
    total_duration_s = 0
    total_fulfilled_kg = 0

    for v_idx in range(num_vehicles):
        v_info = vehicles[v_idx]
        index = routing.Start(v_idx)

        route_stops = []
        route_dist_m = 0
        route_dur_s = 0
        route_load_kg = 0
        seq = 1

        while not routing.IsEnd(index):
            node_idx = manager.IndexToNode(index)
            loc_data = locations[node_idx]

            next_index = solution.Value(routing.NextVar(index))
            next_node_idx = manager.IndexToNode(next_index)

            step_dist = dist_matrix[node_idx][next_node_idx]
            step_dur = dur_matrix[node_idx][next_node_idx]
            route_dist_m += step_dist
            route_dur_s += step_dur

            if loc_data["type"] not in ["DESTINATION", "VEHICLE_START", "VEHICLE"]:
                lot_info = lot_by_loc_idx.get(node_idx, {})
                qty = node_demands[node_idx]
                route_load_kg += qty

                route_stops.append({
                    "sequence": seq,
                    "type": loc_data["type"],
                    "lotId": lot_info.get("receiptId"),
                    "receiptNumber": lot_info.get("receiptNumber"),
                    "farmerName": lot_info.get("farmerName"),
                    "crop": lot_info.get("cropName"),
                    "quantityKg": qty,
                    "latitude": loc_data["latitude"],
                    "longitude": loc_data["longitude"],
                    "address": loc_data.get("label"),
                })
                seq += 1

            index = next_index

        if route_stops:
            start_loc = locations[starts[v_idx]]
            dest_loc = locations[dest_idx]

            cap_kg = float(v_info.get("capacityKg", 1))
            util_pct = round(min(100.0, (route_load_kg / cap_kg) * 100.0), 2)

            dist_km = route_dist_m / 1000.0
            dur_hr = route_dur_s / 3600.0
            est_cost = (
                (dist_km * distance_cost_per_km) +
                (dur_hr * time_cost_per_hour) +
                vehicle_fixed_cost
            )

            routes.append({
                "vehicleId": v_info["vehicleId"],
                "vehicleNumber": v_info["vehicleNumber"],
                "vehicleType": v_info["vehicleType"],
                "transporterName": v_info.get("transporterName"),
                "capacityKg": cap_kg,
                "assignedLoadKg": route_load_kg,
                "utilizationPercent": util_pct,
                "startLocation": {
                    "latitude": start_loc["latitude"],
                    "longitude": start_loc["longitude"]
                },
                "destinationLocation": {
                    "latitude": dest_loc["latitude"],
                    "longitude": dest_loc["longitude"]
                },
                "stops": route_stops,
                "distanceMeters": route_dist_m,
                "durationSeconds": route_dur_s,
                "estimatedCost": round(est_cost, 2),
            })

            total_distance_m += route_dist_m
            total_duration_s += route_dur_s
            total_fulfilled_kg += route_load_kg

    total_est_cost = sum(r["estimatedCost"] for r in routes)

    return {
        "status": status_str,
        "routes": routes,
        "totalDistanceMeters": total_distance_m,
        "totalDurationSeconds": total_duration_s,
        "estimatedCost": round(total_est_cost, 2),
        "totalFulfilledKg": total_fulfilled_kg,
        "runtimeMs": vrp_runtime_ms,
    }
