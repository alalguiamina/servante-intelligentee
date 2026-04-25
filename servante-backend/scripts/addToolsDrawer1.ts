import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('📦 Adding tools to Drawer 1...');

  // Get the Outils category
  const category = await prisma.category.findFirst({
    where: { name: 'Outils' }
  });

  if (!category) {
    console.error('❌ Category "Outils" not found');
    process.exit(1);
  }

  // Add Cutteur
  await prisma.tool.create({
    data: {
      name: 'Cutteur',
      category: { connect: { id: category.id } },
      drawer: 'x',
      totalQuantity: 1,
      availableQuantity: 1,
      borrowedQuantity: 0,
      imageUrl: '/images/tool.png',
    },
  });
  console.log('  ✅ Cutteur (x) - qty: 1');

  // Add Mini pince à bec plat
  await prisma.tool.create({
    data: {
      name: 'Mini pince à bec plat',
      category: { connect: { id: category.id } },
      drawer: 'x',
      totalQuantity: 1,
      availableQuantity: 1,
      borrowedQuantity: 0,
      imageUrl: '/images/tool.png',
    },
  });
  console.log('  ✅ Mini pince à bec plat (x) - qty: 1');

  console.log('\n✅ Done! Added 2 tools to Drawer 1');
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('❌ Error:', e);
  process.exit(1);
});
