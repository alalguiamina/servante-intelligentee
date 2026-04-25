import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🗑️  Clearing all borrows and tools...');

  await prisma.borrow.deleteMany({});
  console.log('✅ Borrows cleared');

  await prisma.tool.deleteMany({});
  console.log('✅ Tools cleared');

  // Ensure category exists
  const category = await prisma.category.upsert({
    where: { name: 'Outils' },
    update: {},
    create: { name: 'Outils' },
  });

  console.log('\n📦 Adding tools...');

  const tools = [
    // TIROIR 1 (Drawer X)
    { name: 'PINCE A DENUDER', drawer: 'x' as const, quantity: 1 },
    { name: 'Pince à bec plat', drawer: 'x' as const, quantity: 1 },
    { name: 'Mini pince à bec ROND', drawer: 'x' as const, quantity: 1 },

    // TIROIR 2 (Drawer Y)
    { name: 'Mini pince à bec demi-rond coudé', drawer: 'y' as const, quantity: 1 },
    { name: 'DENUDEUR AUTOMATIQUE', drawer: 'y' as const, quantity: 1 },
    { name: 'Mini pince COUPANTE', drawer: 'y' as const, quantity: 1 },
    { name: 'Pince COUPANTE', drawer: 'y' as const, quantity: 1 },
    { name: 'PINCE UNIVERSELLE', drawer: 'y' as const, quantity: 1 },
    { name: 'PINCE A BEC COUDE', drawer: 'y' as const, quantity: 1 },

    // TIROIR 3 (Drawer Z)
    { name: 'Clé L grande', drawer: 'z' as const, quantity: 1 },
    { name: 'Clé L petite', drawer: 'z' as const, quantity: 2 },
    { name: 'Lot de clés plates', drawer: 'z' as const, quantity: 1 },

    // TIROIR 4 (Drawer A)
    { name: 'PERCEUSE', drawer: 'a' as const, quantity: 1 },
    { name: 'PIED A COULISSE', drawer: 'a' as const, quantity: 1 },
    { name: 'MULTIMETRE', drawer: 'a' as const, quantity: 1 },
  ];

  for (const tool of tools) {
    await prisma.tool.create({
      data: {
        name: tool.name,
        category: { connect: { id: category.id } },
        drawer: tool.drawer,
        totalQuantity: tool.quantity,
        availableQuantity: tool.quantity,
        borrowedQuantity: 0,
        imageUrl: '/images/tool.png',
      },
    });
    console.log(`  ✅ ${tool.name} (${tool.drawer}) - qty: ${tool.quantity}`);
  }

  console.log(`\n✅ Done! Added ${tools.length} tools across 4 drawers`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('❌ Error:', e);
  process.exit(1);
});
