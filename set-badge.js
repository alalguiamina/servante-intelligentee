// Quick script to set a badge ID for a user
// Run with: node set-badge.js <email> <badgeId>
// Example: node set-badge.js admin@emines.um6p.ma D3C44823

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const email = process.argv[2];
    const badgeId = process.argv[3];

    if (!email || !badgeId) {
        console.error('\n❌ Usage: node set-badge.js <email> <badgeId>');
        console.error('\nExample: node set-badge.js admin@emines.um6p.ma D3C44823\n');
        process.exit(1);
    }

    console.log(`\n🔍 Looking for user: ${email}`);

    // Find user
    const user = await prisma.user.findUnique({
        where: { email }
    });

    if (!user) {
        console.error(`\n❌ User not found with email: ${email}`);

        // Show available users
        const allUsers = await prisma.user.findMany({
            select: { email: true, fullName: true }
        });
        console.log('\n📋 Available users:');
        allUsers.forEach(u => console.log(`   - ${u.email} (${u.fullName})`));
        console.log('');
        process.exit(1);
    }

    console.log(`✓ Found: ${user.fullName}`);
    console.log(`  Current badge ID: ${user.badgeId || '(none)'}`);
    console.log(`  Setting new badge ID: ${badgeId}`);

    // Update badge ID
    const updated = await prisma.user.update({
        where: { email },
        data: { badgeId: badgeId.toUpperCase() }
    });

    console.log(`\n✅ Success! Badge ID updated for ${updated.fullName}`);
    console.log(`   Badge ID: ${updated.badgeId}`);
    console.log(`\nYou can now scan this badge to login!\n`);
}

main()
    .catch((e) => {
        console.error('Error:', e);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
