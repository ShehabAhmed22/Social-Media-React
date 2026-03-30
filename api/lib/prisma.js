import { PrismaClient } from "@prisma/client"; // correct import for v6

const prisma = new PrismaClient(); // still PrismaClient

// Connection
async function connectDB() {
  try {
    await prisma.$connect();
    console.log("DB Work 😍");
  } catch (err) {
    console.log(`Error ${err.message}`);
    process.exit(1);
  }
}

// Initialize database connection
connectDB();

// Handle graceful shutdown
process.on("beforeExit", async () => {
  await prisma.$disconnect();
});

export default prisma;
