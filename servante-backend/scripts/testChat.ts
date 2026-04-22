import axios from 'axios';

const API_URL = 'http://localhost:5000/api/chatbot';

interface ChatResponse {
  success: boolean;
  data: {
    answer: string;
    sources: Array<{
      title: string;
      category: string;
      chunkIndex: number;
      distance: number;
    }>;
    model: string;
    timestamp: string;
  };
}

async function testChat(query: string) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`❓ QUESTION: ${query}`);
  console.log('='.repeat(80));

  try {
    const response = await axios.post<ChatResponse>(`${API_URL}/chat`, {
      query,
    });

    if (response.data.success) {
      console.log(`\n💬 RÉPONSE:\n${response.data.data.answer}`);
      console.log(`\n📚 SOURCES UTILISÉES (${response.data.data.sources.length}):`);
      response.data.data.sources.forEach((source, idx) => {
        console.log(
          `  ${idx + 1}. ${source.title} (${source.category}) - Chunk ${source.chunkIndex} - Distance: ${source.distance.toFixed(4)}`
        );
      });
      console.log(`\n🤖 Modèle: ${response.data.data.model}`);
    } else {
      console.error('❌ Erreur:', response.data);
    }
  } catch (error: any) {
    console.error('❌ Erreur requête:', error.message);
    if (error.response) {
      console.error('Détails:', error.response.data);
    }
  }
}

async function runTests() {
  console.log('🚀 Test du système de chatbot RAG avec Ollama\n');

  // Test 1: Question sur l'emprunt
  await testChat('Comment emprunter un outil ?');

  // Pause de 2 secondes entre chaque test
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Test 2: Question sur les outils
  await testChat('Quels outils sont disponibles pour mesurer le courant électrique ?');

  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Test 3: Question sur les horaires
  await testChat('Quels sont les horaires d\'ouverture de ToolShare ?');

  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Test 4: Question hors contexte
  await testChat('Quelle est la capitale de la France ?');

  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Test 5: Question administrative
  await testChat('Comment réinitialiser mon mot de passe ?');

  console.log('\n\n✅ Tests terminés!');
}

runTests();