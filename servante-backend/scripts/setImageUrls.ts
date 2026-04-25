import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🖼️  Setting image URLs for tools...');

  const imageMap: Record<string, string> = {
    'Clé L grande': '/images/cle L grande.webp',
    'Clé L petite': '/images/cle L petite.webp',
    'Cutteur': '/images/CUTTEUR.avif',
    'DENUDEUR AUTOMATIQUE': '/images/DENUDEUR AUTOMATIQUE.webp',
    'Lot de clés plates': '/images/lot de cles plate.webp',
    'Mini pince COUPANTE': '/images/Mini pince COUPANTE.jpg',
    'Mini pince à bec demi-rond coudé': '/images/Mini pince à bec demi-rond coudé.webp',
    'Mini pince à bec plat': '/images/Mini pince à bec plat.jpg',
    'Mini pince à bec ROND': '/images/Mini pince à bec ROND.jpg',
    'MULTIMETRE': '/images/MULTIMETRE.jpg',
    'PERCEUSE': '/images/PERCEUSE.webp',
    'PIED A COULISSE': '/images/PIED A COULISSE.jpg',
    'PINCE A BEC COUDE': '/images/PINCE A BEC COUDE.webp',
    'PINCE A DENUDER': '/images/PINCE A DENUDER.webp',
    'Pince COUPANTE': '/images/pince COUPANTE.webp',
    'PINCE UNIVERSELLE': '/images/PINCE UNIVERSELLE.webp',
    'Pince à bec plat': '/images/pince à bec plat.jpg',
  };

  for (const [toolName, imagePath] of Object.entries(imageMap)) {
    try {
      await prisma.tool.updateMany({
        where: { name: toolName },
        data: { imageUrl: imagePath },
      });
      console.log(`  ✅ ${toolName}`);
    } catch (e) {
      console.log(`  ⏭️  ${toolName} (not found or error)`);
    }
  }

  console.log('\n✅ Done! Image URLs updated');
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('❌ Error:', e);
  process.exit(1);
});
