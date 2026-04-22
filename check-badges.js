// Quick script to check and set badge IDs in the database
// Run with: node check-badges.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('\n🔍 Checking badges in database...\n');

    // Get all users
    const users = await prisma.user.findMany({
        select: {
            id: true,
            badgeId: true,
            fullName: true,
            email: true,
            role: true
        }
    });

    console.log('📋 Current users and their badge IDs:\n');
    console.table(users);

    // Check if any user needs a badge
    const noBadgeUsers = users.filter(u => !u.badgeId || u.badgeId === '');

    if (noBadgeUsers.length > 0) {
        console.log('\n⚠️  Users without badge IDs:', noBadgeUsers.length);
        console.log('\nTo set a badge ID, run:');
        console.log('node set-badge.js <email> <badgeId>');
        console.log('\nExample:');
        console.log('node set-badge.js user@emines.um6p.ma D3C44823');
    } else {
        console.log('\n✅ All users have badge IDs configured!');
    }
}

main()
    .catch((e) => {
        console.error('Error:', e);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
