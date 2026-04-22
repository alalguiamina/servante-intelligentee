import { chromaService } from './chromaService';

// ============================================
// TYPES ET INTERFACES
// ============================================

interface SearchResult {
  id: string;
  content: string;
  metadata: {
    title: string;
    filename: string;
    category?: string;
    chunkIndex?: number;
    totalChunks?: number;
    mimetype?: string;
    uploadedAt?: string;
    size?: number;
    tags?: string[];
    [key: string]: any;
  };
  distance?: number;
}

interface OllamaResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
  context?: number[];
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

interface OllamaHealthStatus {
  available: boolean;
  models: string[];
  error?: string;
}

interface GenerateAnswerResult {
  success: boolean;
  answer: string;
  sources: Array<{
    title: string;
    filename: string;
    category?: string;
    chunkIndex?: number;
    relevance: number;
  }>;
  metadata: {
    query: string;
    chunksUsed: number;
    model: string;
    processingTime: number;
  };
  error?: string;
}

// ============================================
// CONFIGURATION
// ============================================

const OLLAMA_CONFIG = {
  baseUrl: process.env.OLLAMA_BASE_URL || process.env.OLLAMA_URL || 'http://servante_ollama:11434',
  model: process.env.OLLAMA_MODEL || 'neural-chat:latest',
  timeout: 60000,
};

const RAG_CONFIG = {
  topK: 3,
  maxContextLength: 2000,
  temperature: 0.3,
  systemPrompt: `Tu es un assistant virtuel de la Servante Intelligente EMINES. Réponds de façon concise et directe en français, en te basant uniquement sur le CONTEXTE fourni. Si l'information est absente, dis-le brièvement.`,
};

// Cache du health check Ollama (30 secondes)
let ollamaHealthCache: { available: boolean; timestamp: number } | null = null;
const HEALTH_CACHE_TTL = 30_000;

// ============================================
// FONCTIONS UTILITAIRES
// ============================================

/**
 * Vérifie la santé du service Ollama
 */
export async function checkOllamaHealth(): Promise<OllamaHealthStatus> {
  // Return cached result if still fresh
  if (ollamaHealthCache && Date.now() - ollamaHealthCache.timestamp < HEALTH_CACHE_TTL) {
    return { available: ollamaHealthCache.available, models: [] };
  }

  try {
    const response = await fetch(`${OLLAMA_CONFIG.baseUrl}/api/tags`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) throw new Error(`Ollama status ${response.status}`);

    const data = (await response.json()) as { models?: Array<{ name: string }> };
    const models = data.models?.map((m) => m.name) || [];

    ollamaHealthCache = { available: true, timestamp: Date.now() };
    console.log(`✅ Ollama disponible avec ${models.length} modèle(s):`, models);
    return { available: true, models };
  } catch (error) {
    ollamaHealthCache = { available: false, timestamp: Date.now() };
    console.error('❌ Ollama non disponible:', error);
    return {
      available: false,
      models: [],
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

/**
 * Construit le prompt enrichi avec le contexte RAG
 */
function buildPrompt(query: string, contexts: SearchResult[]): string {
  const contextText = contexts
    .map((ctx: SearchResult, idx: number) => {
      const source = `[Source ${idx + 1}: ${ctx.metadata.title || ctx.metadata.filename}]`;
      return `${source}\n${ctx.content}\n`;
    })
    .join('\n---\n\n');

  return `${RAG_CONFIG.systemPrompt}

CONTEXTE:
${contextText}

QUESTION DE L'UTILISATEUR:
${query}

RÉPONSE:`;
}

/**
 * Appelle Ollama pour générer une réponse
 */
async function callOllama(prompt: string): Promise<string> {
  console.log('🤖 Appel à Ollama pour génération...');
  
  const requestBody = {
    model: OLLAMA_CONFIG.model,
    prompt: prompt,
    stream: false,
    options: {
      temperature: RAG_CONFIG.temperature,
      num_predict: 400,
      num_ctx: 2048,
      top_k: 20,
      top_p: 0.9,
    },
  };

  console.log(`📤 Modèle: ${OLLAMA_CONFIG.model}`);
  console.log(`📤 Prompt length: ${prompt.length} caractères`);

  const response = await fetch(`${OLLAMA_CONFIG.baseUrl}/api/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
    signal: AbortSignal.timeout(OLLAMA_CONFIG.timeout),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Ollama API erreur (${response.status}): ${errorText}`);
  }

  const data = (await response.json()) as OllamaResponse;
  
  console.log('✅ Réponse générée par Ollama');
  console.log(`📊 Tokens générés: ${data.eval_count || 'N/A'}`);
  
  return data.response.trim();
}

/**
 * Calcule un score de pertinence (0-100)
 */
function calculateRelevance(distance?: number): number {
  if (distance === undefined) return 80;
  const relevance = Math.max(0, Math.min(100, (1 - distance / 2) * 100));
  return Math.round(relevance);
}

// ============================================
// FONCTION PRINCIPALE RAG
// ============================================

/**
 * Génère une réponse à partir d'une question en utilisant RAG
 */
export async function generateAnswer(
  query: string,
  topK: number = RAG_CONFIG.topK
): Promise<GenerateAnswerResult> {
  const startTime = Date.now();

  try {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🔍 GÉNÉRATION DE RÉPONSE RAG`);
    console.log(`${'='.repeat(60)}`);
    console.log(`📝 Question: "${query}"`);
    console.log(`🔢 Top-K: ${topK}`);

    // 1. Recherche sémantique dans ChromaDB
    console.log(`\n📚 Recherche de chunks pertinents...`);
    const searchResults = await chromaService.searchDocuments(query, topK);

    if (!searchResults || searchResults.length === 0) {
      console.log('⚠️ Aucun chunk pertinent trouvé');
      return {
        success: true,
        answer: 'Je n\'ai trouvé aucune information pertinente dans ma base de connaissances pour répondre à votre question. Pourriez-vous reformuler ou préciser votre demande ?',
        sources: [],
        metadata: {
          query,
          chunksUsed: 0,
          model: OLLAMA_CONFIG.model,
          processingTime: Date.now() - startTime,
        },
      };
    }

    console.log(`✅ ${searchResults.length} chunk(s) trouvé(s)`);
    
    // Convertir les résultats de votre chromaService vers SearchResult
    const typedResults: SearchResult[] = searchResults.map((result: any) => ({
      id: result.id,
      content: result.content,
      metadata: result.metadata,
      distance: result.distance,
    }));

    typedResults.forEach((result: SearchResult, idx: number) => {
      const relevance = calculateRelevance(result.distance);
      console.log(`   ${idx + 1}. ${result.metadata.title} (pertinence: ${relevance}%)`);
    });

    // 2. Construire le prompt avec contexte
    const prompt = buildPrompt(query, typedResults);

    // 3. Générer la réponse avec Ollama
    const answer = await callOllama(prompt);

    // 5. Préparer les sources
    const sources = typedResults.map((result: SearchResult) => ({
      title: result.metadata.title || 'Sans titre',
      filename: result.metadata.filename || 'Inconnu',
      category: result.metadata.category || 'general',
      chunkIndex: result.metadata.chunkIndex,
      relevance: calculateRelevance(result.distance),
    }));

    const processingTime = Date.now() - startTime;

    console.log(`\n✅ Réponse générée avec succès`);
    console.log(`⏱️  Temps de traitement: ${processingTime}ms`);
    console.log(`📊 Longueur réponse: ${answer.length} caractères`);
    console.log(`${'='.repeat(60)}\n`);

    return {
      success: true,
      answer,
      sources,
      metadata: {
        query,
        chunksUsed: typedResults.length,
        model: OLLAMA_CONFIG.model,
        processingTime,
      },
    };
  } catch (error) {
    console.error('❌ Erreur lors de la génération:', error);
    
    return {
      success: false,
      answer: 'Désolé, une erreur est survenue lors de la génération de la réponse. Veuillez réessayer.',
      sources: [],
      metadata: {
        query,
        chunksUsed: 0,
        model: OLLAMA_CONFIG.model,
        processingTime: Date.now() - startTime,
      },
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

/**
 * Génère une réponse en streaming réel (SSE)
 * Appelle Ollama avec stream:true et transmet chaque token via onChunk
 */
export async function generateAnswerStream(
  query: string,
  topK: number = RAG_CONFIG.topK,
  onChunk: (token: string) => void,
  onDone: (result: GenerateAnswerResult) => void,
  onError: (err: string) => void
): Promise<void> {
  const startTime = Date.now();

  try {
    // 1. Recherche ChromaDB
    const searchResults = await chromaService.searchDocuments(query, topK);

    const noResults = !searchResults || searchResults.length === 0;
    const fallbackAnswer =
      'Je n\'ai trouvé aucune information pertinente dans ma base de connaissances.';

    if (noResults) {
      onChunk(fallbackAnswer);
      onDone({
        success: true,
        answer: fallbackAnswer,
        sources: [],
        metadata: { query, chunksUsed: 0, model: OLLAMA_CONFIG.model, processingTime: Date.now() - startTime },
      });
      return;
    }

    const typedResults: SearchResult[] = searchResults.map((r: any) => ({
      id: r.id,
      content: r.content,
      metadata: r.metadata,
      distance: r.distance,
    }));

    // 2. Build prompt
    const prompt = buildPrompt(query, typedResults);

    // 3. Stream from Ollama
    const response = await fetch(`${OLLAMA_CONFIG.baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_CONFIG.model,
        prompt,
        stream: true,
        options: {
          temperature: RAG_CONFIG.temperature,
          num_predict: 400,
          num_ctx: 2048,
          top_k: 20,
          top_p: 0.9,
        },
      }),
      signal: AbortSignal.timeout(OLLAMA_CONFIG.timeout),
    });

    if (!response.ok || !response.body) {
      throw new Error(`Ollama stream error: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullAnswer = '';
    let doneCalled = false;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const text = decoder.decode(value, { stream: true });
      // Ollama streams NDJSON — each line is a JSON object
      for (const line of text.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          const data = JSON.parse(trimmed);
          if (data.response) {
            onChunk(data.response);
            fullAnswer += data.response;
          }
          if (data.done) {
            doneCalled = true;
            const sources = typedResults.map((r: SearchResult) => ({
              title: r.metadata.title || 'Sans titre',
              filename: r.metadata.filename || 'Inconnu',
              category: r.metadata.category || 'general',
              chunkIndex: r.metadata.chunkIndex,
              relevance: calculateRelevance(r.distance),
            }));
            onDone({
              success: true,
              answer: fullAnswer,
              sources,
              metadata: {
                query,
                chunksUsed: typedResults.length,
                model: OLLAMA_CONFIG.model,
                processingTime: Date.now() - startTime,
              },
            });
            return;
          }
        } catch {
          // skip malformed line
        }
      }
    }

    // Le stream s'est fermé sans que Ollama envoie done:true — appel de secours
    if (!doneCalled) {
      const sources = typedResults.map((r: SearchResult) => ({
        title: r.metadata.title || 'Sans titre',
        filename: r.metadata.filename || 'Inconnu',
        category: r.metadata.category || 'general',
        chunkIndex: r.metadata.chunkIndex,
        relevance: calculateRelevance(r.distance),
      }));
      onDone({
        success: true,
        answer: fullAnswer || 'Réponse incomplète reçue.',
        sources,
        metadata: {
          query,
          chunksUsed: typedResults.length,
          model: OLLAMA_CONFIG.model,
          processingTime: Date.now() - startTime,
        },
      });
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erreur inconnue';
    onError(msg);
  }
}