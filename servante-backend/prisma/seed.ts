import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Début du seed...');

  await prisma.borrow.deleteMany({});
  await prisma.tool.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.user.deleteMany({});

  // ========== UTILISATEURS ==========
  await prisma.user.create({ data: { fullName: 'Ahmed Benali', email: 'ahmed.benali@emines.um6p.ma', badgeId: '537342B7', role: 'STUDENT', password: 'ahmed123' } });
  await prisma.user.create({ data: { fullName: 'Fatima Zahra', email: 'fatima.zahra@emines.um6p.ma', badgeId: '53877F35', role: 'STUDENT', password: 'fatima123' } });
  await prisma.user.create({ data: { fullName: 'Karim Mansouri', email: 'karim.mansouri@emines.um6p.ma', badgeId: 'TEST202', role: 'PROFESSOR', password: 'karim123' } });
  await prisma.user.create({ data: { fullName: 'Leila Berrada', email: 'leila.berrada@emines.um6p.ma', badgeId: 'test123', role: 'TECHNICIAN', password: 'leila123' } });
  await prisma.user.create({ data: { fullName: 'Sara Bennani', email: 'sara.bennani@emines.um6p.ma', badgeId: 'TEST101', role: 'STUDENT', password: 'sara123' } });
  await prisma.user.create({ data: { fullName: 'Youssef Alami', email: 'youssef.alami@emines.um6p.ma', badgeId: 'TEST789', role: 'STUDENT', password: 'youssef123' } });

  console.log('✅ 6 utilisateur(s) créé(s)');

  // ========== CATÉGORIES ==========
  const cat = await prisma.category.create({ data: { name: 'Outils' } });

  console.log('✅ 1 catégorie(s) créée(s)');

  // ========== OUTILS ==========
  await prisma.tool.create({ data: { name: 'Cutteur', categoryId: cat.id, imageUrl: '/images/CUTTEUR.avif', size: 'Moyen', drawer: '1', totalQuantity: 1, availableQuantity: 1, borrowedQuantity: 0 } });
  await prisma.tool.create({ data: { name: 'Mini pince à bec plat', categoryId: cat.id, imageUrl: '/images/Mini pince à bec plat.jpg', size: 'Moyen', drawer: '1', totalQuantity: 1, availableQuantity: 1, borrowedQuantity: 0 } });
  await prisma.tool.create({ data: { name: 'Mini pince à bec rond', categoryId: cat.id, imageUrl: '/images/Mini pince à bec ROND.jpg', size: 'Moyen', drawer: '1', totalQuantity: 1, availableQuantity: 1, borrowedQuantity: 0 } });
  await prisma.tool.create({ data: { name: 'Pince à bec plat', categoryId: cat.id, imageUrl: '/images/pince à bec plat.jpg', size: 'Moyen', drawer: '1', totalQuantity: 1, availableQuantity: 1, borrowedQuantity: 0 } });
  await prisma.tool.create({ data: { name: 'Pince à dénuder', categoryId: cat.id, imageUrl: '/images/PINCE A DENUDER.webp', size: 'Moyen', drawer: '1', totalQuantity: 1, availableQuantity: 1, borrowedQuantity: 0 } });
  await prisma.tool.create({ data: { name: 'Clé 1', categoryId: cat.id, imageUrl: '/images/lot de cles plate.webp', size: 'Moyen', drawer: '2', totalQuantity: 1, availableQuantity: 1, borrowedQuantity: 0 } });
  await prisma.tool.create({ data: { name: 'Clé 2', categoryId: cat.id, imageUrl: '/images/lot de cles plate.webp', size: 'Moyen', drawer: '2', totalQuantity: 1, availableQuantity: 1, borrowedQuantity: 0 } });
  await prisma.tool.create({ data: { name: 'Clé 4', categoryId: cat.id, imageUrl: '/images/lot de cles plate.webp', size: 'Moyen', drawer: '2', totalQuantity: 1, availableQuantity: 1, borrowedQuantity: 0 } });
  await prisma.tool.create({ data: { name: 'Clé 6', categoryId: cat.id, imageUrl: '/images/lot de cles plate.webp', size: 'Moyen', drawer: '2', totalQuantity: 1, availableQuantity: 1, borrowedQuantity: 0 } });
  await prisma.tool.create({ data: { name: 'Clé L grande', categoryId: cat.id, imageUrl: '/images/cle L grande.webp', size: 'Moyen', drawer: '2', totalQuantity: 1, availableQuantity: 1, borrowedQuantity: 0 } });
  await prisma.tool.create({ data: { name: 'Clé L petite', categoryId: cat.id, imageUrl: '/images/cle L petite.webp', size: 'Moyen', drawer: '2', totalQuantity: 2, availableQuantity: 2, borrowedQuantity: 0 } });
  await prisma.tool.create({ data: { name: 'Tournevis américain', categoryId: cat.id, imageUrl: '/images/Tournevis/tournevis-americain-moyen.jpg', size: 'Moyen', drawer: '2', totalQuantity: 1, availableQuantity: 1, borrowedQuantity: 0 } });
  await prisma.tool.create({ data: { name: 'Tournevis plat', categoryId: cat.id, imageUrl: '/images/Tournevis/tournevis-plat-moyen.webp', size: 'Moyen', drawer: '2', totalQuantity: 1, availableQuantity: 1, borrowedQuantity: 0 } });
  await prisma.tool.create({ data: { name: 'Dénudeur automatique', categoryId: cat.id, imageUrl: '/images/DENUDEUR AUTOMATIQUE.webp', size: 'Moyen', drawer: '3', totalQuantity: 1, availableQuantity: 1, borrowedQuantity: 0 } });
  await prisma.tool.create({ data: { name: 'Mini pince coupante', categoryId: cat.id, imageUrl: '/images/Mini pince COUPANTE.jpg', size: 'Moyen', drawer: '3', totalQuantity: 1, availableQuantity: 1, borrowedQuantity: 0 } });
  await prisma.tool.create({ data: { name: 'Mini pince à bec demi-rond coudée', categoryId: cat.id, imageUrl: '/images/Mini pince à bec demi-rond coudé.webp', size: 'Moyen', drawer: '3', totalQuantity: 1, availableQuantity: 1, borrowedQuantity: 0 } });
  await prisma.tool.create({ data: { name: 'Pince coupante', categoryId: cat.id, imageUrl: '/images/pince COUPANTE.webp', size: 'Moyen', drawer: '3', totalQuantity: 1, availableQuantity: 1, borrowedQuantity: 0 } });
  await prisma.tool.create({ data: { name: 'Pince universelle', categoryId: cat.id, imageUrl: '/images/PINCE UNIVERSELLE.webp', size: 'Moyen', drawer: '3', totalQuantity: 1, availableQuantity: 1, borrowedQuantity: 0 } });
  await prisma.tool.create({ data: { name: 'Pince à bec coudée', categoryId: cat.id, imageUrl: '/images/PINCE A BEC COUDE.webp', size: 'Moyen', drawer: '3', totalQuantity: 1, availableQuantity: 1, borrowedQuantity: 0 } });
  await prisma.tool.create({ data: { name: 'Multimètre', categoryId: cat.id, imageUrl: '/images/MULTIMETRE.jpg', size: 'Moyen', drawer: '4', totalQuantity: 1, availableQuantity: 1, borrowedQuantity: 0 } });
  await prisma.tool.create({ data: { name: 'Perceuse', categoryId: cat.id, imageUrl: '/images/PERCEUSE.webp', size: 'Moyen', drawer: '4', totalQuantity: 1, availableQuantity: 1, borrowedQuantity: 0 } });
  await prisma.tool.create({ data: { name: 'Pied à coulisse', categoryId: cat.id, imageUrl: '/images/PIED A COULISSE.jpg', size: 'Moyen', drawer: '4', totalQuantity: 1, availableQuantity: 1, borrowedQuantity: 0 } });

  console.log('✅ 22 outil(s) créé(s) (tous disponibles)');
  console.log('🎉 Seed terminé avec succès !');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
