import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixIncorrectBorrow() {
  try {
    console.log('🔍 Recherche des emprunts incorrects...');

    // Find the incorrect borrow: "Pince coupante" (from drawer 3) but status says drawer 1
    const incorrectBorrow = await prisma.borrow.findMany({
      include: {
        tool: true,
        user: true
      }
    });

    // Filter for "Pince coupante" borrows
    const pinceCoupanteBorrows = incorrectBorrow.filter(b => b.tool.name === 'Pince coupante');

    if (pinceCoupanteBorrows.length === 0) {
      console.log('✅ Aucun emprunt "Pince coupante" trouvé.');
      return;
    }

    console.log(`\n📋 Emprunts "Pince coupante" trouvés: ${pinceCoupanteBorrows.length}`);

    for (const borrow of pinceCoupanteBorrows) {
      console.log(`\n  ID: ${borrow.id}`);
      console.log(`  Utilisateur: ${borrow.user.fullName}`);
      console.log(`  Outil: ${borrow.tool.name} (Tiroir ${borrow.tool.drawer})`);
      console.log(`  Statut: ${borrow.status}`);
      console.log(`  Date d'emprunt: ${borrow.borrowDate}`);

      // Delete the borrow
      await prisma.borrow.delete({
        where: { id: borrow.id }
      });

      // Restore tool availability
      await prisma.tool.update({
        where: { id: borrow.toolId },
        data: {
          availableQuantity: { increment: 1 },
          borrowedQuantity: { decrement: 1 }
        }
      });

      console.log(`  ✅ Supprimé et outil restauré`);
    }

    console.log('\n🎉 Nettoyage terminé!');
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixIncorrectBorrow();
