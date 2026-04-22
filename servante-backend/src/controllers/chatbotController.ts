import { Request, Response } from "express";
import { chromaService } from "../services/chatbot/chromaService";
import fs from "fs/promises";
import { generateAnswer, generateAnswerStream, checkOllamaHealth } from '../services/chatbot/ragService';

class ChatbotController {
  // ============================================
  // GESTION DES DOCUMENTS
  // ============================================

  async uploadDocument(req: Request, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          error: "Aucun fichier fourni",
        });
        return;
      }

      const { originalname, filename, path: filePath, mimetype } = req.file;
      const { title, category, tags } = req.body;

      console.log(`📤 Upload du fichier: ${originalname}`);

      const content = await fs.readFile(filePath, "utf-8");
      const documentId = `doc_${Date.now()}_${filename}`;

      const metadata: any = {
        title: title || originalname,
        filename: originalname,
        mimetype,
        size: content.length,
        category: category || "general",
      };

      if (tags && tags.trim()) {
        metadata.tags = tags.split(",").map((t: string) => t.trim());
      }

      await chromaService.addDocument(documentId, content, metadata);

      res.json({
        success: true,
        message: "Document uploadé et indexé avec succès",
        document: {
          id: documentId,
          ...metadata,
        },
      });
    } catch (error) {
      console.error("❌ Erreur lors de l'upload:", error);
      res.status(500).json({
        success: false,
        error: "Erreur lors de l'upload du document",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      });
    }
  }

  async listDocuments(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const result = await chromaService.listDocuments(limit);

      res.json({
        success: true,
        count: result.count,
        documents: result.documents,
      });
    } catch (error) {
      console.error("❌ Erreur lors de la récupération des documents:", error);
      res.status(500).json({
        success: false,
        error: "Erreur lors de la récupération des documents",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      });
    }
  }

  async getDocument(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const document = await chromaService.getDocument(id);

      if (!document) {
        res.status(404).json({
          success: false,
          error: "Document non trouvé",
        });
        return;
      }

      res.json({
        success: true,
        document,
      });
    } catch (error) {
      console.error("❌ Erreur lors de la récupération du document:", error);
      res.status(500).json({
        success: false,
        error: "Erreur lors de la récupération du document",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      });
    }
  }

  async deleteDocument(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await chromaService.deleteDocument(id);

      res.json({
        success: true,
        message: "Document supprimé avec succès",
        id,
      });
    } catch (error) {
      console.error("❌ Erreur lors de la suppression:", error);
      res.status(500).json({
        success: false,
        error: "Erreur lors de la suppression du document",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      });
    }
  }

  async searchDocuments(req: Request, res: Response): Promise<void> {
    try {
      const { query, nResults } = req.body;

      if (!query) {
        res.status(400).json({
          success: false,
          error: "Le paramètre query est requis",
        });
        return;
      }

      const results = await chromaService.searchDocuments(
        query,
        nResults || 3
      );

      res.json({
        success: true,
        count: results.length,
        results,
      });
    } catch (error) {
      console.error("❌ Erreur lors de la recherche:", error);
      res.status(500).json({
        success: false,
        error: "Erreur lors de la recherche",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      });
    }
  }

  // ============================================
  // CHAT RAG (NOUVEAU)
  // ============================================

  /**
   * Endpoint principal du chatbot - Génère une réponse avec RAG
   * POST /api/chatbot/chat
   * Body: { query: string, topK?: number }
   */
  async chat(req: Request, res: Response): Promise<void> {
    try {
      const { query, topK } = req.body;

      if (!query || typeof query !== 'string' || query.trim().length === 0) {
        res.status(400).json({
          success: false,
          error: "Le paramètre 'query' est requis et doit être une chaîne non vide",
        });
        return;
      }

      console.log(`\n💬 Nouvelle question: "${query}"`);

      const result = await generateAnswer(query, topK);

      res.json(result);

    } catch (error) {
      console.error("❌ Erreur lors du chat:", error);
      res.status(500).json({
        success: false,
        error: "Erreur lors de la génération de la réponse",
        details: error instanceof Error ? error.message : "Erreur inconnue",
        answer: "Désolé, une erreur est survenue. Veuillez réessayer.",
        sources: [],
        metadata: {
          query: req.body.query || '',
          chunksUsed: 0,
          model: 'unknown',
          processingTime: 0,
        },
      });
    }
  }

  /**
   * Streaming endpoint - envoie les tokens au fur et à mesure (SSE)
   * POST /api/chatbot/chat/stream
   */
  async streamChat(req: Request, res: Response): Promise<void> {
    const { query, topK } = req.body;

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      res.status(400).json({ success: false, error: "Le paramètre 'query' est requis" });
      return;
    }

    // SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'http://localhost:5173');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.flushHeaders();

    const send = (data: object) => res.write(`data: ${JSON.stringify(data)}\n\n`);

    try {
      await generateAnswerStream(
        query.trim(),
        topK,
        (token: string) => send({ type: 'token', content: token }),
        (result) => {
          send({ type: 'done', ...result });
          res.end();
        },
        (err: string) => {
          send({ type: 'error', error: err });
          res.end();
        }
      );
    } catch (error) {
      send({ type: 'error', error: error instanceof Error ? error.message : 'Erreur inconnue' });
    } finally {
      // Garantit que la connexion SSE est toujours fermée
      if (!res.writableEnded) {
        res.end();
      }
    }
  }

  // ============================================
  // HEALTH CHECKS
  // ============================================

  async getStats(_req: Request, res: Response): Promise<void> {
    try {
      const count = await chromaService.countDocuments();

      res.json({
        success: true,
        stats: {
          totalDocuments: count,
          collectionName: chromaService.getStatus().collectionName,
        },
      });
    } catch (error) {
      console.error("❌ Erreur lors de la récupération des stats:", error);
      res.status(500).json({
        success: false,
        error: "Erreur lors de la récupération des statistiques",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      });
    }
  }

  async healthCheck(_req: Request, res: Response): Promise<void> {
    try {
      const chromaStatus = chromaService.getStatus();
      const ollamaHealth = await checkOllamaHealth();

      res.json({
        success: true,
        chromadb: {
          status: chromaStatus.initialized ? "connected" : "disconnected",
          collection: chromaStatus.collectionName,
          mode: "server",
        },
        ollama: {
          status: ollamaHealth.available ? "connected" : "disconnected",
          models: ollamaHealth.models || [],
          ...(ollamaHealth.error && { error: ollamaHealth.error }),
        },
        rag: {
          status: chromaStatus.initialized && ollamaHealth.available ? "ready" : "not_ready",
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Erreur lors du healthcheck",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      });
    }
  }

  async checkOllama(_req: Request, res: Response): Promise<void> {
    try {
      const health = await checkOllamaHealth();

      res.json({
        success: true,
        ollama: health,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Erreur lors du check de santé Ollama",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      });
    }
  }
}

export default new ChatbotController();