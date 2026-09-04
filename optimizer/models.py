import math

class OptimizationInput:
    """
    Structured data model representing the JSON input payload sent to the optimizer.
    """
    def __init__(self, data):
        self.raw_data = data
        self.locations = data.get("locations", [])
        self.matrix = data.get("matrix", [])
        self.lots = data.get("lots", [])
        self.vehicles = data.get("vehicles", [])
        self.destination = data.get("destination", {})
        self.config = data.get("config", {})
        self.demand_kg = float(data.get("demandKg", 0))

        # Config parameters & defaults
        self.distance_cost_per_km = float(self.config.get("distanceCostPerKm", 15.0))
        self.time_cost_per_hour = float(self.config.get("timeCostPerHour", 250.0))
        self.vehicle_fixed_cost = float(self.config.get("vehicleFixedCost", 1500.0))
        self.unmet_demand_penalty_per_kg = float(self.config.get("unmetDemandPenaltyPerKg", 100.0))
        self.time_limit_seconds = float(self.config.get("timeLimitSeconds", 10.0))

        # Index lookup maps
        self.loc_id_to_idx = {loc["id"]: i for i, loc in enumerate(self.locations)}
        self.matrix_map = {}
        for elem in self.matrix:
            o_id = elem.get("originId")
            d_id = elem.get("destinationId")
            if elem.get("status") == "OK":
                self.matrix_map[(o_id, d_id)] = (
                    int(elem.get("distanceMeters", 0)),
                    int(elem.get("durationSeconds", 0))
                )
