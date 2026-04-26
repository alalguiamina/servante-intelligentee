import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

const SEED_PATH = path.join(process.cwd(), 'prisma', 'seed.ts');

function str(s: string | null | undefined): string {
  if (s === null || s === undefined) return 'null';
  return `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

export async function syncSeed(): Promise<void> {
  try {
    const [users, categories, tools] = await Promise.all([
      prisma.user.findMany({ orderBy: { fullName: 'asc' } }),
      prisma.category.findMany({ orderBy: { name: 'asc' } }),
      prisma.tool.findMany({ orderBy: [{ drawer: 'asc' }, { name: 'asc' }] }),
    ]);

    // Users block
    const userLines = users
      .map(u =>
        `  await prisma.user.create({ data: { fullName: ${str(u.fullName)}, email: ${str(u.email)}, badgeId: ${str(u.badgeId)}, role: '${u.role}', password: ${str(u.password)} } });`
      )
      .join('\n');

    // Categories block — each gets a variable so tools can reference it
    const catVarMap: Record<string, string> = {};
    const catLines = categories
      .map((c, i) => {
        const varName = i === 0 ? 'cat' : `cat${i}`;
        catVarMap[c.id] = varName;
        return `  const ${varName} = await prisma.category.create({ data: { name: ${str(c.name)} } });`;
      })
      .join('\n');

    // Tools block — reset quantities to full available (seed = clean state)
    const toolLines = tools
      .map(t => {
        const catVar = catVarMap[t.categoryId] ?? 'cat';
        return (
          `  await prisma.tool.create({ data: { name: ${str(t.name)}, categoryId: ${catVar}.id, ` +
          `imageUrl: ${str(t.imageUrl)}, size: ${str(t.size)}, drawer: ${str(t.drawer)}, ` +
          `totalQuantity: ${t.totalQuantity}, availableQuantity: ${t.totalQuantity}, borrowedQuantity: 0 } });`
        );
      })
      .join('\n');

    const content = `import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Début du seed...');

  await prisma.borrow.deleteMany({});
  await prisma.tool.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.user.deleteMany({});

  // ========== UTILISATEURS ==========
${userLines}

  console.log('✅ ${users.length} utilisateur(s) créé(s)');

  // ========== CATÉGORIES ==========
${catLines}

  console.log('✅ ${categories.length} catégorie(s) créée(s)');

  // ========== OUTILS ==========
${toolLines}

  console.log('✅ ${tools.length} outil(s) créé(s) (tous disponibles)');
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
`;

    fs.writeFileSync(SEED_PATH, content, 'utf-8');
    console.log('📝 seed.ts mis à jour automatiquement');
  } catch (err) {
    console.error('⚠️ Impossible de synchroniser seed.ts:', err);
  }
}
