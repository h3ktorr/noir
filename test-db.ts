import "dotenv/config";
import prisma from "@/lib/prisma"; // adjust path if needed

async function main() {
  try {
    const result = await prisma.$queryRaw`SELECT 1 AS test`;
    console.log("SUCCESS:", result);
  } catch (error: any) {
    console.error("FULL ERROR:");
    console.dir(error, { depth: null });

    console.error("\nCAUSE:");
    console.dir(error?.meta?.driverAdapterError?.cause, { depth: null });
  } finally {
    await prisma.$disconnect();
  }
}

main();
