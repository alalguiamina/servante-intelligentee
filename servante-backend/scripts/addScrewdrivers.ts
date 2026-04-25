import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('📦 Adding screwdrivers to Drawer 3...');

  const category = await prisma.category.findFirst({
    where: { name: 'Outils' }
  });

  if (!category) {
    console.error('❌ Category "Outils" not found');
    process.exit(1);
  }

  // Add Tournevis Plat Moyen to Drawer 3 (z)
  await prisma.tool.create({
    data: {
      name: 'Tournevis Plat Moyen',
      category: { connect: { id: category.id } },
      drawer: 'z',
      totalQuantity: 1,
      availableQuantity: 1,
      borrowedQuantity: 0,
      imageUrl: '/images/tool.png',
    },
  });
  console.log('  ✅ Tournevis Plat Moyen (z) - qty: 1');

  // Add Tournevis Américain Moyen to Drawer 3 (z)
  await prisma.tool.create({
    data: {
      name: 'Tournevis Américain Moyen',
      category: { connect: { id: category.id } },
      drawer: 'z',
      totalQuantity: 1,
      availableQuantity: 1,
      borrowedQuantity: 0,
      imageUrl: '/images/tool.png',
    },
  });
  console.log('  ✅ Tournevis Américain Moyen (z) - qty: 1');

  console.log('\n✅ Done! Added 2 screwdrivers to Drawer 3');
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('❌ Error:', e);
  process.exit(1);
});
