import math

def calculate_spatial_cost_proxy(lot, vehicles, destination, matrix_map, opt_input):
    """
    Calculates a spatial transport cost proxy for a harvest lot.
    Estimated cost proxy = (Min distance from any vehicle start -> lot) + (distance from lot -> destination).
    This cost proxy is used strictly in Stage 1 CP-SAT lot selection to prioritize spatially optimal lots.
    Exact VRP routing cost is determined by Stage 2 RoutingModel using the road matrix.
    """
    lot_id = f"LOT_{lot.get('receiptId')}"
    dest_id = "DESTINATION"

    # 1. Distance from lot to destination
    pair_to_dest = matrix_map.get((lot_id, dest_id))
    if pair_to_dest:
        dist_to_dest_m = pair_to_dest[0]
        dur_to_dest_s = pair_to_dest[1]
    else:
        # Fallback to straight-line estimation if edge missing
        lot_lat = lot.get("latitude", 0)
        lot_lng = lot.get("longitude", 0)
        dest_lat = destination.get("latitude", 0)
        dest_lng = destination.get("longitude", 0)
        d_lat = lot_lat - dest_lat
        d_lng = lot_lng - dest_lng
        dist_to_dest_m = int(math.sqrt(d_lat*d_lat + d_lng*d_lng) * 111000)
        dur_to_dest_s = int(dist_to_dest_m / 13.88)

    # 2. Min distance from any vehicle start location to lot
    min_start_dist_m = float("inf")
    min_start_dur_s = 0

    for v in vehicles:
        v_id = v.get("vehicleId")
        v_matrix_id = f"VEHICLE_{v_id}"
        pair_from_v = matrix_map.get((v_matrix_id, lot_id))
        if pair_from_v:
            if pair_from_v[0] < min_start_dist_m:
                min_start_dist_m = pair_from_v[0]
                min_start_dur_s = pair_from_v[1]
        else:
            cur_loc = v.get("currentLocation", {})
            v_lat = cur_loc.get("latitude", destination.get("latitude", 0))
            v_lng = cur_loc.get("longitude", destination.get("longitude", 0))
            lot_lat = lot.get("latitude", 0)
            lot_lng = lot.get("longitude", 0)
            d_lat = v_lat - lot_lat
            d_lng = v_lng - lot_lng
            est_m = int(math.sqrt(d_lat*d_lat + d_lng*d_lng) * 111000)
            if est_m < min_start_dist_m:
                min_start_dist_m = est_m
                min_start_dur_s = int(est_m / 13.88)

    if min_start_dist_m == float("inf"):
        min_start_dist_m = 10000
        min_start_dur_s = 900

    total_dist_km = (min_start_dist_m + dist_to_dest_m) / 1000.0
    total_dur_hr = (min_start_dur_s + dur_to_dest_s) / 3600.0

    cost_rupees = (total_dist_km * opt_input.distance_cost_per_km) + (total_dur_hr * opt_input.time_cost_per_hour)
    # Convert to integer cost proxy in paise
    return int(round(cost_rupees * 100))
