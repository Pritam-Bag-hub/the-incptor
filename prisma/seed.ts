import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient, Role } from "@prisma/client";

const adapter = new PrismaBetterSqlite3({ url: "file:./prisma/dev.db" });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding demo users...");

  // Clean existing sessions and users
  await prisma.session.deleteMany({});
  await prisma.user.deleteMany({});

  const buyer = await prisma.user.upsert({
    where: { phone: "+919999999991" },
    update: {},
    create: {
      phone: "+919999999991",
      name: "Rudra Sen",
      role: Role.BUYER,
    },
  });

  const landowner = await prisma.user.upsert({
    where: { phone: "+919999999992" },
    update: {},
    create: {
      phone: "+919999999992",
      name: "Ramesh Singh",
      role: Role.LANDOWNER,
    },
  });

  const worker = await prisma.user.upsert({
    where: { phone: "+919999999993" },
    update: {},
    create: {
      phone: "+919999999993",
      name: "Babu Rao",
      role: Role.WORKER,
    },
  });

  const admin = await prisma.user.upsert({
    where: { phone: "+919999999994" },
    update: {},
    create: {
      phone: "+919999999994",
      name: "Admin Controller",
      role: Role.ADMIN,
    },
  });

  console.log("Seed completed successfully:", { buyer, landowner, worker, admin });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
