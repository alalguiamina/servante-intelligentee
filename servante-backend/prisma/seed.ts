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
  const categoryTournevis = await prisma.category.create({
    data: { name: 'Tournevis' }
  });

  const categoryCles = await prisma.category.create({
    data: { name: 'Clés' }
  });

  const categoryPinces = await prisma.category.create({
    data: { name: 'Pinces' }
  });

  const categoryMarquage = await prisma.category.create({
    data: { name: 'Outils de marquage' }
  });

  const categoryCoupe = await prisma.category.create({
    data: { name: 'Outils de coupe' }
  });

  console.log('✅ 5 catégories créées');

  // ========== TIROIR 1: Tournevis (8 outils) ==========
  const tool1 = await prisma.tool.create({
    data: { name: 'Tournevis Plat Grand', categoryId: categoryTournevis.id, imageUrl: '/images/Tournevis/tournevis-plat-grand.jpg', size: 'Grand', drawer: '1', totalQuantity: 4, availableQuantity: 2, borrowedQuantity: 2 }
  });
  
  const tool2 = await prisma.tool.create({
    data: { name: 'Tournevis Plat Moyen', categoryId: categoryTournevis.id, imageUrl: '/images/Tournevis/tournevis-plat-moyen.webp', size: 'Moyen', drawer: '1', totalQuantity: 5, availableQuantity: 5, borrowedQuantity: 0 }
  });
  
  const tool3 = await prisma.tool.create({
    data: { name: 'Tournevis Plat Petit', categoryId: categoryTournevis.id, imageUrl: '/images/Tournevis/tournevis-plat-petit.webp', size: 'Petit', drawer: '1', totalQuantity: 3, availableQuantity: 2, borrowedQuantity: 1 }
  });
  
  const tool4 = await prisma.tool.create({
    data: { name: 'Tournevis Plat Mini', categoryId: categoryTournevis.id, imageUrl: '/images/Tournevis/tournevis-plat-mini.jpg', size: 'Mini', drawer: '1', totalQuantity: 6, availableQuantity: 4, borrowedQuantity: 2 }
  });
  
  const tool5 = await prisma.tool.create({
    data: { name: 'Tournevis Américain Grand', categoryId: categoryTournevis.id, imageUrl: '/images/Tournevis/tournevis-americain-grand.jpg', size: 'Grand', drawer: '1', totalQuantity: 4, availableQuantity: 4, borrowedQuantity: 0 }
  });
  
  const tool6 = await prisma.tool.create({
    data: { name: 'Tournevis Américain Moyen', categoryId: categoryTournevis.id, imageUrl: '/images/Tournevis/tournevis-americain-moyen.jpg', size: 'Moyen', drawer: '1', totalQuantity: 5, availableQuantity: 3, borrowedQuantity: 2 }
  });
  
  const tool7 = await prisma.tool.create({
    data: { name: 'Tournevis Américain Petit', categoryId: categoryTournevis.id, imageUrl: '/images/Tournevis/tournevis-americain-petit.jpg', size: 'Petit', drawer: '1', totalQuantity: 4, availableQuantity: 2, borrowedQuantity: 2 }
  });
  
  const tool8 = await prisma.tool.create({
    data: { name: 'Tournevis Américain Mini', categoryId: categoryTournevis.id, imageUrl: '/images/Tournevis/tournevis-americain-mini.jpg', size: 'Mini', drawer: '1', totalQuantity: 3, availableQuantity: 3, borrowedQuantity: 0 }
  });

  // ========== TIROIR 2: Clés (4 outils) ==========
  const tool9 = await prisma.tool.create({
    data: { name: 'Clé à Molette', categoryId: categoryCles.id, imageUrl: '/images/Clés/cle-molette.webp', drawer: '2', totalQuantity: 6, availableQuantity: 5, borrowedQuantity: 1 }
  });
  
  const tool10 = await prisma.tool.create({
    data: { name: 'Jeu de Clés Six Pans Coudées', categoryId: categoryCles.id, imageUrl: '/images/Clés/jeu-cles-six-pans-coudees.webp', drawer: '2', totalQuantity: 3, availableQuantity: 2, borrowedQuantity: 1 }
  });
  
  const tool11 = await prisma.tool.create({
    data: { name: 'Jeu de Clés Six Pans Droites', categoryId: categoryCles.id, imageUrl: '/images/Clés/jeu-cles-six-pans-droites.jpeg', drawer: '2', totalQuantity: 4, availableQuantity: 3, borrowedQuantity: 1 }
  });
  
  const tool12 = await prisma.tool.create({
    data: { name: 'Jeu de Clés en Étoile', categoryId: categoryCles.id, imageUrl: '/images/Clés/jeu-de-cles-en-etoile-a-extremite-creuse-cles-plat.webp', drawer: '2', totalQuantity: 5, availableQuantity: 4, borrowedQuantity: 1 }
  });

  // ========== TIROIR 3: Pinces (5 outils) ==========
  const tool13 = await prisma.tool.create({
    data: { name: 'Pince Électronique de Précision', categoryId: categoryPinces.id, imageUrl: '/images/Pinces/pince-electronique-precision.jpg', drawer: '3', totalQuantity: 7, availableQuantity: 6, borrowedQuantity: 1 }
  });
  
  const tool14 = await prisma.tool.create({
    data: { name: 'Mini Pince Coupante', categoryId: categoryPinces.id, imageUrl: '/images/Pinces/mini-pince-coupante.webp', drawer: '3', totalQuantity: 4, availableQuantity: 3, borrowedQuantity: 1 }
  });
  
  const tool15 = await prisma.tool.create({
    data: { name: 'Mini Pince Bec Demi-Rond Coudé', categoryId: categoryPinces.id, imageUrl: '/images/Pinces/mini-pince-bec-demi-rond-coude.webp', drawer: '3', totalQuantity: 5, availableQuantity: 3, borrowedQuantity: 2 }
  });
  
  const tool16 = await prisma.tool.create({
    data: { name: 'Mini Pince Bec Demi-Rond', categoryId: categoryPinces.id, imageUrl: '/images/Pinces/mini-pince-bec-demi-rond.webp', drawer: '3', totalQuantity: 6, availableQuantity: 4, borrowedQuantity: 2 }
  });
  
  const tool17 = await prisma.tool.create({
    data: { name: 'Mini Pince Bec Plat', categoryId: categoryPinces.id, imageUrl: '/images/Pinces/mini-pince-bec-plat.jpg', drawer: '3', totalQuantity: 8, availableQuantity: 6, borrowedQuantity: 2 }
  });

  // ========== TIROIR 4: Marquage & Coupe (4 outils) ==========
  const tool18 = await prisma.tool.create({
    data: { name: 'Pointe à Tracer', categoryId: categoryMarquage.id, imageUrl: '/images/Outils de marquage/pointe-a-tracer.jpg', drawer: '4', totalQuantity: 8, availableQuantity: 7, borrowedQuantity: 1 }
  });
  
  const tool19 = await prisma.tool.create({
    data: { name: 'Pointeau Automatique', categoryId: categoryMarquage.id, imageUrl: '/images/Outils de marquage/pointeau-automatique.png', drawer: '4', totalQuantity: 5, availableQuantity: 4, borrowedQuantity: 1 }
  });
  
  const tool20 = await prisma.tool.create({
    data: { name: 'Ciseaux', categoryId: categoryCoupe.id, imageUrl: '/images/Outils de coupe/ciseaux.jpeg', drawer: '4', totalQuantity: 10, availableQuantity: 8, borrowedQuantity: 2 }
  });
  
  const tool21 = await prisma.tool.create({
    data: { name: 'Cutteur', categoryId: categoryCoupe.id, imageUrl: '/images/Outils de coupe/cutteur.webp', drawer: '4', totalQuantity: 12, availableQuantity: 11, borrowedQuantity: 1 }
  });

  console.log('✅ 21 outils créés');

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

  // Emprunts d'Ahmed (2 actifs, 3 retournés)
  await prisma.borrow.create({
    data: {
      userId: ahmed.id,
      toolId: tool1.id,
      borrowDate: daysAgo(3),
      dueDate: daysFromNow(4),
      status: 'ACTIVE'
    }
  });

  await prisma.borrow.create({
    data: {
      userId: ahmed.id,
      toolId: tool9.id,
      borrowDate: daysAgo(2),
      dueDate: daysFromNow(5),
      status: 'ACTIVE'
    }
  });

  await prisma.borrow.create({
    data: {
      userId: ahmed.id,
      toolId: tool18.id,
      borrowDate: daysAgo(30),
      dueDate: daysAgo(23),
      returnDate: daysAgo(25),
      status: 'RETURNED'
    }
  });

  await prisma.borrow.create({
    data: {
      userId: ahmed.id,
      toolId: tool13.id,
      borrowDate: daysAgo(50),
      dueDate: daysAgo(43),
      returnDate: daysAgo(40),
      status: 'RETURNED'
    }
  });

  await prisma.borrow.create({
    data: {
      userId: ahmed.id,
      toolId: tool20.id,
      borrowDate: daysAgo(70),
      dueDate: daysAgo(63),
      returnDate: daysAgo(56),
      status: 'RETURNED'
    }
  });

  // Emprunt de Fatima (EN RETARD)
  await prisma.borrow.create({
    data: {
      userId: fatima.id,
      toolId: tool3.id,
      borrowDate: daysAgo(10),
      dueDate: daysAgo(3),
      status: 'ACTIVE'
    }
  });

  // Emprunt de Youssef (BIENTÔT EN RETARD)
  await prisma.borrow.create({
    data: {
      userId: youssef.id,
      toolId: tool14.id,
      borrowDate: daysAgo(5),
      dueDate: daysFromNow(2),
      status: 'ACTIVE'
    }
  });

  // Emprunt de Sara (OK)
  await prisma.borrow.create({
    data: {
      userId: sara.id,
      toolId: tool21.id,
      borrowDate: daysAgo(2),
      dueDate: daysFromNow(5),
      status: 'ACTIVE'
    }
  });

  // Emprunt de Karim (TRÈS EN RETARD)
  await prisma.borrow.create({
    data: {
      userId: karim.id,
      toolId: tool10.id,
      borrowDate: daysAgo(17),
      dueDate: daysAgo(10),
      status: 'ACTIVE'
    }
  });

  // Emprunt de Leila (CRITIQUE - 1 jour restant)
  await prisma.borrow.create({
    data: {
      userId: leila.id,
      toolId: tool19.id,
      borrowDate: daysAgo(6),
      dueDate: daysFromNow(1),
      status: 'ACTIVE'
    }
  });

  console.log('✅ 10 emprunts créés');
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