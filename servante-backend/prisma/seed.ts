import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Début du seed...');

  // Nettoyer les données existantes
  await prisma.borrow.deleteMany({});
  await prisma.tool.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.user.deleteMany({});

  // ========== CRÉER LES UTILISATEURS ==========
  const ahmed = await prisma.user.create({
    data: {
      fullName: 'Ahmed Benali',
      email: 'ahmed.benali@emines.um6p.ma',
      badgeId: 'TEST123',
      role: 'STUDENT',
      password: 'ahmed123'
    }
  });

  const fatima = await prisma.user.create({
    data: {
      fullName: 'Fatima Zahra',
      email: 'fatima.zahra@emines.um6p.ma',
      badgeId: 'TEST456',
      role: 'STUDENT',
      password: 'fatima123'
    }
  });

  const youssef = await prisma.user.create({
    data: {
      fullName: 'Youssef Alami',
      email: 'youssef.alami@emines.um6p.ma',
      badgeId: 'TEST789',
      role: 'STUDENT',
      password: 'youssef123'
    }
  });

  const sara = await prisma.user.create({
    data: {
      fullName: 'Sara Bennani',
      email: 'sara.bennani@emines.um6p.ma',
      badgeId: 'TEST101',
      role: 'STUDENT',
      password: 'sara123'
    }
  });

  const karim = await prisma.user.create({
    data: {
      fullName: 'Karim Mansouri',
      email: 'karim.mansouri@emines.um6p.ma',
      badgeId: 'TEST202',
      role: 'PROFESSOR',
      password: 'karim123'
    }
  });

  const leila = await prisma.user.create({
    data: {
      fullName: 'Leila Berrada',
      email: 'leila.berrada@emines.um6p.ma',
      badgeId: 'TEST303',
      role: 'TECHNICIAN',
      password: 'leila123'
    }
  });

  console.log('✅ 6 utilisateurs créés');

  // ========== CRÉER LES CATÉGORIES ==========
  const categoryOutils = await prisma.category.create({
    data: { name: 'Outils' }
  });

  console.log('✅ 1 catégorie créée');

  // ========== OUTILS (19 outils) ==========
  const tool1 = await prisma.tool.create({
    data: { name: 'Clé L grande', categoryId: categoryOutils.id, imageUrl: '/images/cle L grande.webp', size: 'Moyen', drawer: '1', totalQuantity: 1, availableQuantity: 1, borrowedQuantity: 0 }
  });
  
  const tool2 = await prisma.tool.create({
    data: { name: 'Clé L petite', categoryId: categoryOutils.id, imageUrl: '/images/cle L petite.webp', size: 'Moyen', drawer: '3', totalQuantity: 2, availableQuantity: 2, borrowedQuantity: 0 }
  });
  
  const tool3 = await prisma.tool.create({
    data: { name: 'Cutteur', categoryId: categoryOutils.id, imageUrl: '/images/CUTTEUR.avif', size: 'Moyen', drawer: '1', totalQuantity: 1, availableQuantity: 1, borrowedQuantity: 0 }
  });
  
  const tool4 = await prisma.tool.create({
    data: { name: 'Dénudeur automatique', categoryId: categoryOutils.id, imageUrl: '/images/DENUDEUR AUTOMATIQUE.webp', size: 'Moyen', drawer: '2', totalQuantity: 1, availableQuantity: 1, borrowedQuantity: 0 }
  });
  
  const tool5 = await prisma.tool.create({
    data: { name: 'Lot de clés plates', categoryId: categoryOutils.id, imageUrl: '/images/lot de cles plate.webp', size: 'Moyen', drawer: '3', totalQuantity: 1, availableQuantity: 1, borrowedQuantity: 0 }
  });
  
  const tool6 = await prisma.tool.create({
    data: { name: 'Multimètre', categoryId: categoryOutils.id, imageUrl: '/images/MULTIMETRE.jpg', size: 'Moyen', drawer: '4', totalQuantity: 1, availableQuantity: 1, borrowedQuantity: 0 }
  });
  
  const tool7 = await prisma.tool.create({
    data: { name: 'Mini pince coupante', categoryId: categoryOutils.id, imageUrl: '/images/Mini pince COUPANTE.jpg', size: 'Moyen', drawer: '2', totalQuantity: 1, availableQuantity: 1, borrowedQuantity: 0 }
  });
  
  const tool8 = await prisma.tool.create({
    data: { name: 'Mini pince à bec rond', categoryId: categoryOutils.id, imageUrl: '/images/Mini pince à bec ROND.jpg', size: 'Moyen', drawer: '1', totalQuantity: 1, availableQuantity: 1, borrowedQuantity: 0 }
  });
  
  const tool9 = await prisma.tool.create({
    data: { name: 'Mini pince à bec demi-rond coudé', categoryId: categoryOutils.id, imageUrl: '/images/Mini pince à bec demi-rond coudé.webp', size: 'Moyen', drawer: '2', totalQuantity: 1, availableQuantity: 1, borrowedQuantity: 0 }
  });
  
  const tool10 = await prisma.tool.create({
    data: { name: 'Mini pince à bec plat', categoryId: categoryOutils.id, imageUrl: '/images/Mini pince à bec plat.jpg', size: 'Moyen', drawer: '1', totalQuantity: 1, availableQuantity: 1, borrowedQuantity: 0 }
  });
  
  const tool11 = await prisma.tool.create({
    data: { name: 'Perceuse', categoryId: categoryOutils.id, imageUrl: '/images/PERCEUSE.webp', size: 'Moyen', drawer: '4', totalQuantity: 1, availableQuantity: 1, borrowedQuantity: 0 }
  });
  
  const tool12 = await prisma.tool.create({
    data: { name: 'Pied à coulisse', categoryId: categoryOutils.id, imageUrl: '/images/PIED A COULISSE.jpg', size: 'Moyen', drawer: '4', totalQuantity: 1, availableQuantity: 1, borrowedQuantity: 0 }
  });
  
  const tool13 = await prisma.tool.create({
    data: { name: 'Pince à bec coudé', categoryId: categoryOutils.id, imageUrl: '/images/PINCE A BEC COUDE.webp', size: 'Moyen', drawer: '2', totalQuantity: 1, availableQuantity: 1, borrowedQuantity: 0 }
  });
  
  const tool14 = await prisma.tool.create({
    data: { name: 'Pince à dénuder', categoryId: categoryOutils.id, imageUrl: '/images/PINCE A DENUDER.webp', size: 'Moyen', drawer: '1', totalQuantity: 1, availableQuantity: 1, borrowedQuantity: 0 }
  });
  
  const tool15 = await prisma.tool.create({
    data: { name: 'Pince universelle', categoryId: categoryOutils.id, imageUrl: '/images/PINCE UNIVERSELLE.webp', size: 'Moyen', drawer: '2', totalQuantity: 1, availableQuantity: 1, borrowedQuantity: 0 }
  });
  
  const tool16 = await prisma.tool.create({
    data: { name: 'Pince coupante', categoryId: categoryOutils.id, imageUrl: '/images/pince COUPANTE.webp', size: 'Moyen', drawer: '2', totalQuantity: 1, availableQuantity: 1, borrowedQuantity: 0 }
  });
  
  const tool17 = await prisma.tool.create({
    data: { name: 'Pince à bec plat', categoryId: categoryOutils.id, imageUrl: '/images/pince à bec plat.jpg', size: 'Moyen', drawer: '1', totalQuantity: 1, availableQuantity: 1, borrowedQuantity: 0 }
  });
  
  const tool18 = await prisma.tool.create({
    data: { name: 'Tournevis américain moyen', categoryId: categoryOutils.id, imageUrl: '/images/Tournevis/tournevis-americain-moyen.jpg', size: 'Moyen', drawer: '3', totalQuantity: 1, availableQuantity: 1, borrowedQuantity: 0 }
  });
  
  const tool19 = await prisma.tool.create({
    data: { name: 'Tournevis plat moyen', categoryId: categoryOutils.id, imageUrl: '/images/Tournevis/tournevis-plat-moyen.webp', size: 'Moyen', drawer: '3', totalQuantity: 1, availableQuantity: 1, borrowedQuantity: 0 }
  });

  console.log('✅ 19 outils créés');

  // ========== CRÉER LES EMPRUNTS ==========
  const now = new Date();
  const daysAgo = (days: number) => {
    const date = new Date(now);
    date.setDate(date.getDate() - days);
    return date;
  };
  const daysFromNow = (days: number) => {
    const date = new Date(now);
    date.setDate(date.getDate() + days);
    return date;
  };

  // Emprunts d'exemple
  // Emprunt 1 - Ahmed (Clé L grande)
  await prisma.borrow.create({
    data: {
      userId: ahmed.id,
      toolId: tool1.id,
      borrowDate: daysAgo(3),
      dueDate: daysFromNow(4),
      status: 'ACTIVE'
    }
  });

  // Emprunt 2 - Fatima (Cutteur, EN RETARD)
  await prisma.borrow.create({
    data: {
      userId: fatima.id,
      toolId: tool3.id,
      borrowDate: daysAgo(10),
      dueDate: daysAgo(3),
      status: 'ACTIVE'
    }
  });

  // Emprunt 3 - Youssef (Multimètre, BIENTÔT EN RETARD)
  await prisma.borrow.create({
    data: {
      userId: youssef.id,
      toolId: tool6.id,
      borrowDate: daysAgo(5),
      dueDate: daysFromNow(2),
      status: 'ACTIVE'
    }
  });

  // Emprunt 4 - Sara (Mini pince coupante)
  await prisma.borrow.create({
    data: {
      userId: sara.id,
      toolId: tool7.id,
      borrowDate: daysAgo(2),
      dueDate: daysFromNow(5),
      status: 'ACTIVE'
    }
  });

  // Emprunt 5 - Karim (Perceuse, TRÈS EN RETARD)
  await prisma.borrow.create({
    data: {
      userId: karim.id,
      toolId: tool11.id,
      borrowDate: daysAgo(17),
      dueDate: daysAgo(10),
      status: 'ACTIVE'
    }
  });

  // Emprunt 6 - Leila (Pied à coulisse, CRITIQUE - 1 jour restant)
  await prisma.borrow.create({
    data: {
      userId: leila.id,
      toolId: tool12.id,
      borrowDate: daysAgo(6),
      dueDate: daysFromNow(1),
      status: 'ACTIVE'
    }
  });

  console.log('✅ 6 emprunts créés');
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