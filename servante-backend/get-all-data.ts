import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function getAllData() {
  try {
    console.log('========================================');
    console.log('RETRIEVING ALL DATABASE INFORMATION');
    console.log('========================================\n');

    // Get all Categories
    console.log('--- CATEGORIES ---');
    const categories = await prisma.category.findMany({
      include: {
        tools: true,
      },
    });
    console.log(JSON.stringify(categories, null, 2));
    console.log(`Total Categories: ${categories.length}\n`);

    // Get all Tools
    console.log('--- TOOLS ---');
    const tools = await prisma.tool.findMany({
      include: {
        category: true,
        borrows: true,
      },
    });
    console.log(JSON.stringify(tools, null, 2));
    console.log(`Total Tools: ${tools.length}\n`);

    // Get all Users
    console.log('--- USERS ---');
    const users = await prisma.user.findMany({
      include: {
        borrows: true,
      },
    });
    console.log(JSON.stringify(users, null, 2));
    console.log(`Total Users: ${users.length}\n`);

    // Get all Borrows
    console.log('--- BORROWS ---');
    const borrows = await prisma.borrow.findMany({
      include: {
        user: true,
        tool: true,
      },
    });
    console.log(JSON.stringify(borrows, null, 2));
    console.log(`Total Borrows: ${borrows.length}\n`);

    // Summary
    console.log('========================================');
    console.log('SUMMARY');
    console.log('========================================');
    console.log(`Categories: ${categories.length}`);
    console.log(`Tools: ${tools.length}`);
    console.log(`Users: ${users.length}`);
    console.log(`Borrows: ${borrows.length}`);

  } catch (error) {
    console.error('Error retrieving data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

getAllData();
