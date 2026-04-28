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

interface GroqHealthStatus {
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

const GROQ_CONFIG = {
  apiKey: process.env.GROQ_API_KEY || '',
  baseUrl: 'https://api.groq.com/openai/v1',
  model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
  timeout: 60000,
};

const RAG_CONFIG = {
  topK: 3,
  maxChunkLength: 800,  // truncate each chunk to this many chars before sending to LLM
  temperature: 0.3,
  systemPrompt: `Tu es un assistant virtuel de la Servante Intelligente EMINES. Réponds en français en te basant UNIQUEMENT sur le CONTEXTE fourni. Reproduis les informations avec précision, sans raccourcir les mots ni tronquer les phrases. Si l'information demandée est absente du contexte, dis-le clairement.`,
};

// Cache du health check Groq (30 secondes)
let groqHealthCache: { available: boolean; timestamp: number } | null = null;
const HEALTH_CACHE_TTL = 30_000;

// ============================================
// FONCTIONS UTILITAIRES
// ============================================

export async function checkGroqHealth(): Promise<GroqHealthStatus> {
  if (groqHealthCache && Date.now() - groqHealthCache.timestamp < HEALTH_CACHE_TTL) {
    return { available: groqHealthCache.available, models: [] };
  }

  if (!GROQ_CONFIG.apiKey) {
    groqHealthCache = { available: false, timestamp: Date.now() };
    return { available: false, models: [], error: 'GROQ_API_KEY manquant' };
  }

  try {
    const response = await fetch(`${GROQ_CONFIG.baseUrl}/models`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${GROQ_CONFIG.apiKey}` },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) throw new Error(`Groq status ${response.status}`);

    const data = (await response.json()) as { data?: Array<{ id: string }> };
    const models = data.data?.map((m) => m.id) || [];

    groqHealthCache = { available: true, timestamp: Date.now() };
    console.log(`✅ Groq disponible avec ${models.length} modèle(s)`);
    return { available: true, models };
  } catch (error) {
    groqHealthCache = { available: false, timestamp: Date.now() };
    console.error('❌ Groq non disponible:', error);
    return {
      available: false,
      models: [],
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

// Keep legacy export name so controller doesn't need to change
export { checkGroqHealth as checkOllamaHealth };

function buildMessages(
  query: string,
  contexts: SearchResult[],
): Array<{ role: string; content: string }> {
  const contextText = contexts
    .map((ctx, idx) => {
      const source = `[Source ${idx + 1}: ${ctx.metadata.title || ctx.metadata.filename}]`;
      const content = ctx.content.length > RAG_CONFIG.maxChunkLength
        ? ctx.content.slice(0, RAG_CONFIG.maxChunkLength) + '...'
        : ctx.content;
      return `${source}\n${content}\n`;
    })
    .join('\n---\n\n');

  return [
    { role: 'system', content: RAG_CONFIG.systemPrompt },
    { role: 'user', content: `CONTEXTE:\n${contextText}\n\nQUESTION:\n${query}` },
  ];
}

async function callGroq(messages: Array<{ role: string; content: string }>): Promise<string> {
  console.log('🤖 Appel à Groq pour génération...');
  console.log(`📤 Modèle: ${GROQ_CONFIG.model}`);

  const response = await fetch(`${GROQ_CONFIG.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${GROQ_CONFIG.apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_CONFIG.model,
      messages,
      temperature: RAG_CONFIG.temperature,
      max_tokens: 1024,
    }),
    signal: AbortSignal.timeout(GROQ_CONFIG.timeout),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq API erreur (${response.status}): ${errorText}`);
  }

  const data = (await response.json()) as {
    choices: Array<{ message: { content: string } }>;
    usage?: { completion_tokens?: number };
  };

  const answer = data.choices[0]?.message?.content?.trim() ?? '';
  console.log('✅ Réponse générée par Groq');
  console.log(`📊 Tokens générés: ${data.usage?.completion_tokens ?? 'N/A'}`);
  return answer;
}

function calculateRelevance(distance?: number): number {
  if (distance === undefined) return 80;
  return Math.round(Math.max(0, Math.min(100, (1 - distance / 2) * 100)));
}

// ============================================
// FONCTION PRINCIPALE RAG
// ============================================

export async function generateAnswer(
  query: string,
  topK: number = RAG_CONFIG.topK,
): Promise<GenerateAnswerResult> {
  const startTime = Date.now();

  try {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🔍 GÉNÉRATION DE RÉPONSE RAG`);
    console.log(`${'='.repeat(60)}`);
    console.log(`📝 Question: "${query}"`);

    const searchResults = await chromaService.searchDocuments(query, topK);

    if (!searchResults || searchResults.length === 0) {
      console.log('⚠️ Aucun chunk pertinent trouvé');
      return {
        success: true,
        answer: "Je n'ai trouvé aucune information pertinente dans ma base de connaissances pour répondre à votre question. Pourriez-vous reformuler ou préciser votre demande ?",
        sources: [],
        metadata: { query, chunksUsed: 0, model: GROQ_CONFIG.model, processingTime: Date.now() - startTime },
      };
    }

    const typedResults: SearchResult[] = searchResults.map((r: any) => ({
      id: r.id,
      content: r.content,
      metadata: r.metadata,
      distance: r.distance,
    }));

    typedResults.forEach((r, idx) => {
      console.log(`   ${idx + 1}. ${r.metadata.title} (pertinence: ${calculateRelevance(r.distance)}%)`);
    });

    const messages = buildMessages(query, typedResults);
    const answer = await callGroq(messages);

    const sources = typedResults.map((r) => ({
      title: r.metadata.title || 'Sans titre',
      filename: r.metadata.filename || 'Inconnu',
      category: r.metadata.category || 'general',
      chunkIndex: r.metadata.chunkIndex,
      relevance: calculateRelevance(r.distance),
    }));

    const processingTime = Date.now() - startTime;
    console.log(`✅ Réponse générée (${processingTime}ms, ${answer.length} chars)`);
    console.log(`${'='.repeat(60)}\n`);

    return {
      success: true,
      answer,
      sources,
      metadata: { query, chunksUsed: typedResults.length, model: GROQ_CONFIG.model, processingTime },
    };
  } catch (error) {
    console.error('❌ Erreur lors de la génération:', error);
    return {
      success: false,
      answer: 'Désolé, une erreur est survenue lors de la génération de la réponse. Veuillez réessayer.',
      sources: [],
      metadata: { query, chunksUsed: 0, model: GROQ_CONFIG.model, processingTime: Date.now() - startTime },
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

export async function generateAnswerStream(
  query: string,
  topK: number = RAG_CONFIG.topK,
  onChunk: (token: string) => void,
  onDone: (result: GenerateAnswerResult) => void,
  onError: (err: string) => void,
): Promise<void> {
  const startTime = Date.now();

  try {
    const searchResults = await chromaService.searchDocuments(query, topK);

    if (!searchResults || searchResults.length === 0) {
      const fallback = "Je n'ai trouvé aucune information pertinente dans ma base de connaissances.";
      onChunk(fallback);
      onDone({
        success: true,
        answer: fallback,
        sources: [],
        metadata: { query, chunksUsed: 0, model: GROQ_CONFIG.model, processingTime: Date.now() - startTime },
      });
      return;
    }

    const typedResults: SearchResult[] = searchResults.map((r: any) => ({
      id: r.id,
      content: r.content,
      metadata: r.metadata,
      distance: r.distance,
    }));

    const messages = buildMessages(query, typedResults);

    const response = await fetch(`${GROQ_CONFIG.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GROQ_CONFIG.apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_CONFIG.model,
        messages,
        temperature: RAG_CONFIG.temperature,
        max_tokens: 1024,
        stream: true,
      }),
      signal: AbortSignal.timeout(GROQ_CONFIG.timeout),
    });

    if (!response.ok || !response.body) {
      const errBody = await response.text().catch(() => '');
      throw new Error(`Groq stream error: ${response.status} — ${errBody}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullAnswer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const text = decoder.decode(value, { stream: true });
      // Groq streams SSE: "data: {...}\n\n" lines
      for (const line of text.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data:')) continue;
        const jsonStr = trimmed.slice(5).trim();
        if (jsonStr === '[DONE]') break;
        try {
          const data = JSON.parse(jsonStr) as {
            choices: Array<{ delta: { content?: string }; finish_reason?: string }>;
          };
          const token = data.choices[0]?.delta?.content;
          if (token) {
            onChunk(token);
            fullAnswer += token;
          }
        } catch {
          // skip malformed line
        }
      }
    }

    const sources = typedResults.map((r) => ({
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
        model: GROQ_CONFIG.model,
        processingTime: Date.now() - startTime,
      },
    });
  } catch (error) {
    onError(error instanceof Error ? error.message : 'Erreur inconnue');
  }
}
