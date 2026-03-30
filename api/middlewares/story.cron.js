import cron from "node-cron";
import prisma from "../lib/prisma.js";

cron.schedule("0 * * * *", async () => {
  // كل ساعة

  try {
    const result = await prisma.story.deleteMany({
      where: {
        createdAt: {
          lt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    });

    console.log(`Deleted ${result.count} expired stories`);
  } catch (error) {
    console.error("Cron error:", error);
  }
});
