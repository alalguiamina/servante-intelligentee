import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteAllBorrows() {
  try {
    console.log('Deleting all borrows...');
    const result = await prisma.borrow.deleteMany({});
    console.log(`✅ Deleted ${result.count} borrows`);
  } catch (error) {
    console.error('❌ Error deleting borrows:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteAllBorrows();
