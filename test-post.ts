import "dotenv/config";
import prisma from "@/lib/prisma";

async function main() {
  const count = await prisma.post.count();
  console.log("POST COUNT:", count);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
