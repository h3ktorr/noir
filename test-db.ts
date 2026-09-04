import prisma from "@/lib/prisma"; // adjust path if needed

async function main() {
  const result = await prisma.$queryRaw`SELECT 1 as test`;
  console.log(result);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
