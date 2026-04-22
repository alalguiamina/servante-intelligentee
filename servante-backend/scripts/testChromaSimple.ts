import { chromaService } from '../src/services/chatbot/chromaService';

async function testChromaSimple() {
  console.log('🧪 Test simple de ChromaDB\n');

  try {
    // 1. Initialisation
    console.log('1️⃣  Initialisation...');
    await chromaService.initialize();

    // 2. Ajout de documents de test
    console.log('\n2️⃣  Ajout de documents...');
    await chromaService.addDocument(
      'doc1',
      'Ceci est un document sur la pince ampèremétrique',
      { title: 'Pince ampèremétrique', filename: 'pince.txt' }
    );
    
    await chromaService.addDocument(
      'doc2',
      'Ceci est un document sur le multimètre',
      { title: 'Multimètre', filename: 'multi.txt' }
    );

    // 3. Recherche sémantique
    console.log('\n3️⃣  Recherche sémantique...');
    const results = await chromaService.searchDocuments('mesure de courant électrique', 2);
    console.log('Résultats trouvés:', results.length);
    results.forEach((doc, i) => {
      console.log(`  ${i + 1}. ${doc.metadata.title} - ${doc.content.substring(0, 50)}...`);
    });

    // 4. Comptage
    console.log('\n4️⃣  Comptage...');
    const count = await chromaService.countDocuments();
    console.log(`Total de documents: ${count}`);

    console.log('\n🎉 Test réussi!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

testChromaSimple();