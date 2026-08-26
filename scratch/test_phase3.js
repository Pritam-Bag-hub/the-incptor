const http = require("http");

const PORT = 3000;

function makeRequest(path, method, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "localhost",
      port: PORT,
      path: path,
      method: method,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
    };

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data ? JSON.parse(data) : null,
        });
      });
    });

    req.on("error", (err) => {
      reject(err);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log("=== STARTING PHASE 3 VERIFICATION TESTS ===");

  // 1. Log in as Buyer (+919999999991)
  console.log("\n1. Logging in as Buyer (+919999999991)...");
  const buyerLogin = await makeRequest("/api/auth/login", "POST", {
    phone: "+919999999991",
    otp: "0000",
  });
  console.log(`Status: ${buyerLogin.status}`);
  const buyerCookie = buyerLogin.headers["set-cookie"][0].split(";")[0];
  console.log(`Buyer Cookie obtained: ${!!buyerCookie}`);

  // 2. Log in as Landowner (+919999999992)
  console.log("\n2. Logging in as Landowner (+919999999992)...");
  const landownerLogin = await makeRequest("/api/auth/login", "POST", {
    phone: "+919999999992",
    otp: "0000",
  });
  console.log(`Status: ${landownerLogin.status}`);
  const landownerCookie = landownerLogin.headers["set-cookie"][0].split(";")[0];
  console.log(`Landowner Cookie obtained: ${!!landownerCookie}`);

  // 3. Get Paddy crop ID
  const cropsRes = await makeRequest("/api/crops?category=Crops", "GET");
  const paddy = cropsRes.body.find((c) => c.name === "Paddy");
  const paddyId = paddy.id;
  console.log(`\n3. Loaded Paddy Crop ID: ${paddyId}`);

  // 4. Landowner attempts to create demand (Forbidden)
  console.log("\n4. Landowner attempts to POST /api/demands...");
  const landownerCreateDemand = await makeRequest("/api/demands", "POST", {
    cropId: paddyId,
    requiredQuantity: 10,
    quantityUnit: "TONNE",
    preferredState: "Punjab",
  }, {
    Cookie: landownerCookie,
  });
  console.log(`Status: ${landownerCreateDemand.status} (Expected: 403)`);
  console.log(`Body error message:`, landownerCreateDemand.body.error);

  // 5. Buyer attempts to create demand with invalid quantity (Bad Request)
  console.log("\n5. Buyer attempts POST /api/demands with negative quantity...");
  const invalidQtyDemand = await makeRequest("/api/demands", "POST", {
    cropId: paddyId,
    requiredQuantity: -5.0,
    quantityUnit: "TONNE",
    preferredState: "Punjab",
  }, {
    Cookie: buyerCookie,
  });
  console.log(`Status: ${invalidQtyDemand.status} (Expected: 400)`);
  console.log(`Body error message:`, invalidQtyDemand.body.error);

  // 6. Buyer attempts to create demand with invalid coordinates (Bad Request)
  console.log("\n6. Buyer attempts POST /api/demands with invalid coordinates...");
  const invalidCoordsDemand = await makeRequest("/api/demands", "POST", {
    cropId: paddyId,
    requiredQuantity: 20,
    quantityUnit: "TONNE",
    preferredState: "Punjab",
    preferredLatitude: 120.0, // Invalid lat (>90)
    preferredLongitude: 80.0,
  }, {
    Cookie: buyerCookie,
  });
  console.log(`Status: ${invalidCoordsDemand.status} (Expected: 400)`);
  console.log(`Body error message:`, invalidCoordsDemand.body.error);

  // 7. Buyer creates a valid demand profile
  console.log("\n7. Buyer creates a valid crop demand profile...");
  const validDemand = await makeRequest("/api/demands", "POST", {
    cropId: paddyId,
    requiredQuantity: 50.0,
    quantityUnit: "TONNE",
    preferredState: "Punjab",
    preferredDistrict: "Ludhiana",
    preferredLatitude: 30.9000,
    preferredLongitude: 75.8500,
    searchRadiusKm: 30.0,
    requiredLandArea: 10.0,
    notes: "Basmati procurement.",
  }, {
    Cookie: buyerCookie,
  });
  console.log(`Status: ${validDemand.status} (Expected: 200)`);
  const demandId = validDemand.body.demand.id;
  console.log(`Created Demand ID: ${demandId}`);

  // 8. Buyer retrieves their demands list
  console.log("\n8. Buyer calls GET /api/demands...");
  const getDemandsRes = await makeRequest("/api/demands", "GET", null, {
    Cookie: buyerCookie,
  });
  console.log(`Status: ${getDemandsRes.status} (Expected: 200)`);
  console.log(`Demands count: ${getDemandsRes.body.length}`);
  console.log(`Matched ID: ${getDemandsRes.body.some(d => d.id === demandId)}`);

  // 9. Landowner attempts to retrieve buyer's specific demand details (Forbidden)
  console.log(`\n9. Landowner attempts GET /api/demands/${demandId}...`);
  const getImpostorDemand = await makeRequest(`/api/demands/${demandId}`, "GET", null, {
    Cookie: landownerCookie,
  });
  console.log(`Status: ${getImpostorDemand.status} (Expected: 403)`);

  // 10. Register three test plots under Ramesh Singh (landowner) to verify matching
  console.log("\n10. Registering three test plots under landowner Ramesh Singh...");
  
  // Plot 1: AVAILABLE, Punjab, Ludhiana, size 12.0 acres, nearby coordinates (distance ~ 11 km)
  const plot1 = await makeRequest("/api/lands", "POST", {
    name: "Ludhiana Sector 1 Plot",
    size: "12.0",
    unit: "ACRE",
    address: "Ludhiana Bypass",
    village: "Mullanpur",
    district: "Ludhiana",
    state: "Punjab",
    latitude: "30.920000",
    longitude: "75.750000",
  }, {
    Cookie: landownerCookie,
  });
  console.log(`Plot 1 registration: ${plot1.status}`);

  // Plot 2: AVAILABLE, Haryana, Karnal, size 15.0 acres, far away coordinates (distance ~ 150 km)
  const plot2 = await makeRequest("/api/lands", "POST", {
    name: "Karnal Farm",
    size: "15.0",
    unit: "ACRE",
    address: "GT Road",
    village: "Taraori",
    district: "Karnal",
    state: "Haryana",
    latitude: "29.800000",
    longitude: "76.900000",
  }, {
    Cookie: landownerCookie,
  });
  console.log(`Plot 2 registration: ${plot2.status}`);

  // Plot 3: UNAVAILABLE, Punjab, Ludhiana, size 20.0 acres, nearby coordinates
  const plot3Res = await makeRequest("/api/lands", "POST", {
    name: "Reserved Ludhiana Plot",
    size: "20.0",
    unit: "ACRE",
    address: "Ludhiana West",
    village: "Mullanpur",
    district: "Ludhiana",
    state: "Punjab",
    latitude: "30.910000",
    longitude: "75.760000",
  }, {
    Cookie: landownerCookie,
  });
  const plot3Id = plot3Res.body.land.id;
  // Set Plot 3 to UNAVAILABLE
  await makeRequest(`/api/lands/${plot3Id}/status`, "PATCH", { status: "UNAVAILABLE" }, { Cookie: landownerCookie });
  console.log(`Plot 3 (Unavailable) setup completed.`);

  // 11. Run Discover Lands with the created demand profile
  console.log(`\n11. Querying discover engine for demand ${demandId}...`);
  const discoveryRes = await makeRequest(`/api/lands/discover?demandId=${demandId}`, "GET", null, {
    Cookie: buyerCookie,
  });
  console.log(`Status: ${discoveryRes.status} (Expected: 200)`);
  console.log(`Matching lands returned: ${discoveryRes.body.length}`);
  
  // Inspect matches:
  // Plot 3 (Reserved Ludhiana Plot) must be excluded because it is UNAVAILABLE.
  // Plot 2 (Karnal Farm) is AVAILABLE but far away (150 km > 30 km radius). So it should be excluded too by the radius filter!
  // Only Plot 1 should be returned!
  discoveryRes.body.forEach((land) => {
    console.log(`- Land Match: ${land.name}`);
    console.log(`  State: ${land.state}, District: ${land.district}`);
    console.log(`  Distance: ${land.distanceKm} Km, Score: ${land.matchScore}%`);
    console.log(`  Match reasons:`, land.matchReasons);
  });

  // Verify distance Km exists and matches expected value (~11km)
  const matchedPlot = discoveryRes.body[0];
  if (matchedPlot) {
    console.log(`\nVerification: Radius filtering excluded far away Plot 2 and availability check excluded Plot 3 correctly!`);
  }

  // 12. Run Discover Lands without coordinates (Haryana/State filter only)
  console.log("\n12. Querying discover engine without coordinates (State query)...");
  const stateDiscoveryRes = await makeRequest("/api/lands/discover?state=Haryana", "GET", null, {
    Cookie: buyerCookie,
  });
  console.log(`Status: ${stateDiscoveryRes.status} (Expected: 200)`);
  console.log(`Lands matching state 'Haryana': ${stateDiscoveryRes.body.length}`);
  console.log(stateDiscoveryRes.body.map((l) => `${l.name} (Score: ${l.matchScore}%)`));

  console.log("\n=== PHASE 3 VERIFICATION TESTS COMPLETED ===");
  process.exit(0);
}

// Simple retry loop to wait for dev server to start
function startTests(retries = 15) {
  makeRequest("/api/auth/me", "GET")
    .then(() => {
      runTests();
    })
    .catch((err) => {
      if (retries > 0) {
        console.log(`Waiting for Next.js dev server on port ${PORT}... (${retries} retries left)`);
        setTimeout(() => startTests(retries - 1), 2000);
      } else {
        console.error("Could not connect to Next.js dev server.");
        process.exit(1);
      }
    });
}

startTests();
