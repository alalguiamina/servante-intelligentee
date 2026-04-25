import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🖼️  Removing broken image URLs from all tools...');

  const result = await prisma.tool.updateMany({
    data: {
      imageUrl: '',
    },
  });

  console.log(`✅ Updated ${result.count} tools`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('❌ Error:', e);
  process.exit(1);
});
