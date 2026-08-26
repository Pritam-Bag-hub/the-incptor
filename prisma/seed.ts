import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient, Role } from "@prisma/client";

const adapter = new PrismaBetterSqlite3({ url: "file:./prisma/dev.db" });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding demo users...");

  // Clean existing tables to prevent duplicate key errors on seed re-run
  await prisma.session.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.crop.deleteMany({});
  await prisma.cropCategory.deleteMany({});
  await prisma.land.deleteMany({});

  // 1. Seed Users
  const buyer = await prisma.user.create({
    data: {
      phone: "+919999999991",
      name: "Rudra Sen",
      role: Role.BUYER,
    },
  });

  const landowner = await prisma.user.create({
    data: {
      phone: "+919999999992",
      name: "Ramesh Singh",
      role: Role.LANDOWNER,
    },
  });

  const worker = await prisma.user.create({
    data: {
      phone: "+919999999993",
      name: "Babu Rao",
      role: Role.WORKER,
    },
  });

  const admin = await prisma.user.create({
    data: {
      phone: "+919999999994",
      name: "Admin Controller",
      role: Role.ADMIN,
    },
  });

  console.log("Users seeded successfully.");

  // 2. Seed Crop Categories
  console.log("Seeding crop categories...");
  const categoriesData = [
    { name: "Crops", description: "Standard field crops and cereal grains." },
    { name: "Vegetables", description: "Edible plants and garden greens." },
    { name: "Fruits", description: "Fleshy tree and shrub crops." },
    { name: "Flowers", description: "Ornamental and commercial flora." },
  ];

  const categoriesMap: Record<string, string> = {};

  for (const cat of categoriesData) {
    const created = await prisma.cropCategory.create({
      data: cat,
    });
    categoriesMap[created.name] = created.id;
  }

  console.log("Crop categories seeded.");

  // 3. Seed Crop Master Data
  console.log("Seeding crop master data...");
  const cropsData = [
    // Crops
    {
      name: "Paddy",
      categoryName: "Crops",
      durationDays: 120,
      description: "Basmati and local rice varieties grown in waterlogged fields.",
      metadata: { expectedYieldPerAcre: 2.5, basePricePerTonne: 21830, laborFactor: 4.5 },
    },
    {
      name: "Wheat",
      categoryName: "Crops",
      durationDays: 110,
      description: "Rabi cereal crop cultivated in well-drained loamy soils.",
      metadata: { expectedYieldPerAcre: 1.8, basePricePerTonne: 22750, laborFactor: 3.0 },
    },
    {
      name: "Maize",
      categoryName: "Crops",
      durationDays: 100,
      description: "Versatile corn crop utilized for food, fodder, and industrial feed.",
      metadata: { expectedYieldPerAcre: 2.2, basePricePerTonne: 20900, laborFactor: 3.5 },
    },
    {
      name: "Sugarcane",
      categoryName: "Crops",
      durationDays: 300,
      description: "High-yield commercial grass crop harvesting raw cane sugars.",
      metadata: { expectedYieldPerAcre: 35.0, basePricePerTonne: 3400, laborFactor: 8.0 },
    },

    // Vegetables
    {
      name: "Potato",
      categoryName: "Vegetables",
      durationDays: 90,
      description: "Nutritious starchy root vegetable cultivar.",
      metadata: { expectedYieldPerAcre: 9.5, basePricePerTonne: 15000, laborFactor: 5.0 },
    },
    {
      name: "Tomato",
      categoryName: "Vegetables",
      durationDays: 85,
      description: "Warm-season fruit vegetable demanding high soil health.",
      metadata: { expectedYieldPerAcre: 12.0, basePricePerTonne: 18000, laborFactor: 6.0 },
    },
    {
      name: "Onion",
      categoryName: "Vegetables",
      durationDays: 120,
      description: "Allium bulb crop demanding structured nursery transplanting.",
      metadata: { expectedYieldPerAcre: 8.0, basePricePerTonne: 22000, laborFactor: 5.5 },
    },
    {
      name: "Cabbage",
      categoryName: "Vegetables",
      durationDays: 90,
      description: "Cool-season leafy head crop yielding uniform harvests.",
      metadata: { expectedYieldPerAcre: 10.0, basePricePerTonne: 12000, laborFactor: 4.0 },
    },

    // Fruits
    {
      name: "Mango",
      categoryName: "Fruits",
      durationDays: 150,
      description: "Tropical stone fruit harvested from orchard groves.",
      metadata: { expectedYieldPerAcre: 4.5, basePricePerTonne: 45000, laborFactor: 4.0 },
    },
    {
      name: "Banana",
      categoryName: "Fruits",
      durationDays: 180,
      description: "Herbaceous plant crop demanding continuous humid irrigation.",
      metadata: { expectedYieldPerAcre: 15.0, basePricePerTonne: 16000, laborFactor: 5.0 },
    },
    {
      name: "Apple",
      categoryName: "Fruits",
      durationDays: 160,
      description: "Temperate deciduous tree crop popular in cold highland regions.",
      metadata: { expectedYieldPerAcre: 6.0, basePricePerTonne: 65000, laborFactor: 4.5 },
    },

    // Flowers
    {
      name: "Rose",
      categoryName: "Flowers",
      durationDays: 60,
      description: "High-value premium cut flower crop grown in polyhouses.",
      metadata: { expectedYieldPerAcre: 1.2, basePricePerTonne: 120000, laborFactor: 7.0 },
    },
    {
      name: "Marigold",
      categoryName: "Flowers",
      durationDays: 45,
      description: "Hardy seasonal flower crop popular for festival garlands.",
      metadata: { expectedYieldPerAcre: 4.0, basePricePerTonne: 30000, laborFactor: 3.5 },
    },
    {
      name: "Sunflower",
      categoryName: "Flowers",
      durationDays: 70,
      description: "Helianthus seed crop harvested for commercial cooking oil.",
      metadata: { expectedYieldPerAcre: 0.8, basePricePerTonne: 55000, laborFactor: 2.8 },
    },
  ];

  for (const crop of cropsData) {
    const categoryId = categoriesMap[crop.categoryName];
    if (categoryId) {
      await prisma.crop.create({
        data: {
          name: crop.name,
          categoryId,
          durationDays: crop.durationDays,
          description: crop.description,
          metadataJson: JSON.stringify(crop.metadata),
        },
      });
    }
  }

  console.log("Crop master data seeded successfully.");
  console.log("Seeding complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
