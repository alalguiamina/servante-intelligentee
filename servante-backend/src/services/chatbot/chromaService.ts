import { ChromaClient } from "chromadb";
import { DefaultEmbeddingFunction } from "@chroma-core/default-embed";
import type { Collection } from "chromadb";
import { 
  DocumentMetadata, 
  StoredDocument, 
  DocumentListResult, 
  ChromaServiceConfig,
  toDocumentMetadata 
} from "./types";

class ChromaService {
  private client: ChromaClient | null = null;
  private collection: Collection | null = null;
  private embeddingFunction: DefaultEmbeddingFunction | null = null;
  private isInitialized: boolean = false;
  private config: ChromaServiceConfig;

  constructor() {
    this.config = {
      collectionName: process.env.CHROMA_COLLECTION_NAME || "documents_servante",
      host: process.env.CHROMA_HOST || "localhost",
      port: parseInt(process.env.CHROMA_PORT || "8001"),
    };
  }

  async initialize(): Promise<boolean> {
    const maxRetries = 5;
    const baseDelay = 2000; // 2 seconds

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 Initialisation de ChromaDB (tentative ${attempt}/${maxRetries})...`);
        console.log(`📍 Serveur: ${this.config.host}:${this.config.port}`);
        
        this.client = new ChromaClient({
          host: this.config.host,
          port: this.config.port,
        });

        console.log("✅ Client ChromaDB créé");

        this.embeddingFunction = new DefaultEmbeddingFunction();

        this.collection = await this.client.getOrCreateCollection({
          name: this.config.collectionName,
          embeddingFunction: this.embeddingFunction,
          metadata: { 
            description: "Documents pour le chatbot de la servante",
            createdAt: new Date().toISOString(),
          },
        });

        console.log(`✅ Collection "${this.config.collectionName}" prête`);

        this.isInitialized = true;
        console.log("✅ ChromaDB initialisé avec succès");
        return true;
      } catch (error) {
        console.error(`❌ Tentative ${attempt} échouée:`, error instanceof Error ? error.message : error);
        
        if (attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt - 1);
          console.log(`⏳ Attente ${delay}ms avant nouvelle tentative...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    console.error("❌ Échec de la connexion à ChromaDB après tous les essais");
    throw new Error("ChromaDB initialization failed after retries");
  }

  private ensureInitialized(): void {
    if (!this.isInitialized || !this.collection) {
      throw new Error("ChromaDB n est pas initialisé. Appelez initialize() d abord.");
    }
  }

  async addDocument(
    id: string,
    content: string,
    metadata: Partial<DocumentMetadata>
  ): Promise<{ success: boolean; id: string }> {
    this.ensureInitialized();

    try {
      const fullMetadata: DocumentMetadata = {
        title: metadata.title || "Sans titre",
        filename: metadata.filename || "unknown",
        mimetype: metadata.mimetype,
        uploadedAt: new Date().toISOString(),
        size: content.length,
        category: metadata.category,
        tags: metadata.tags,
      };

      await this.collection!.upsert({
        ids: [id],
        documents: [content],
        metadatas: [fullMetadata],
      });

      console.log(`✅ Document "${id}" ajouté/mis à jour avec succès`);
      return { success: true, id };
    } catch (error) {
      console.error(`❌ Erreur lors de l ajout du document "${id}":`, error);
      throw error;
    }
  }

  async searchDocuments(
    query: string,
    nResults: number = 3
  ): Promise<StoredDocument[]> {
    this.ensureInitialized();

    try {
      const results = await this.collection!.query({
        queryTexts: [query],
        nResults,
      });

      if (!results.ids[0] || results.ids[0].length === 0) {
        return [];
      }

      const documents: StoredDocument[] = results.ids[0].map((id: string, index: number) => ({
        id,
        content: results.documents[0]?.[index] || "",
        metadata: toDocumentMetadata(results.metadatas[0]?.[index]),
      }));

      return documents;
    } catch (error) {
      console.error("❌ Erreur lors de la recherche:", error);
      throw error;
    }
  }

  async listDocuments(limit: number = 100): Promise<DocumentListResult> {
    this.ensureInitialized();

    try {
      const result = await this.collection!.get({
        limit,
      });

      const documents: StoredDocument[] = result.ids.map((id: string, index: number) => ({
        id,
        content: result.documents?.[index] || "",
        metadata: toDocumentMetadata(result.metadatas?.[index]),
      }));

      return {
        count: result.ids.length,
        documents,
      };
    } catch (error) {
      console.error("❌ Erreur lors de la récupération des documents:", error);
      throw error;
    }
  }

  async getDocument(id: string): Promise<StoredDocument | null> {
    this.ensureInitialized();

    try {
      const result = await this.collection!.get({
        ids: [id],
      });

      if (result.ids.length === 0) {
        return null;
      }

      return {
        id: result.ids[0],
        content: result.documents?.[0] || "",
        metadata: toDocumentMetadata(result.metadatas?.[0]),
      };
    } catch (error) {
      console.error(`❌ Erreur lors de la récupération du document "${id}":`, error);
      throw error;
    }
  }

  async deleteDocument(id: string): Promise<{ success: boolean; id: string }> {
    this.ensureInitialized();

    try {
      await this.collection!.delete({
        ids: [id],
      });

      console.log(`✅ Document "${id}" supprimé avec succès`);
      return { success: true, id };
    } catch (error) {
      console.error(`❌ Erreur lors de la suppression du document "${id}":`, error);
      throw error;
    }
  }

  async countDocuments(): Promise<number> {
    this.ensureInitialized();

    try {
      const result = await this.collection!.count();
      return result;
    } catch (error) {
      console.error("❌ Erreur lors du comptage des documents:", error);
      throw error;
    }
  }

  async resetCollection(): Promise<{ success: boolean }> {
    this.ensureInitialized();

    try {
      const collectionName = this.collection!.name;
      await this.client!.deleteCollection({ name: collectionName });
      
      this.collection = await this.client!.createCollection({
        name: collectionName,
        embeddingFunction: this.embeddingFunction!,
        metadata: { 
          description: "Documents pour le chatbot de la servante",
          createdAt: new Date().toISOString(),
        },
      });

      console.log(`✅ Collection "${collectionName}" réinitialisée`);
      return { success: true };
    } catch (error) {
      console.error("❌ Erreur lors de la réinitialisation:", error);
      throw error;
    }
  }

  getStatus(): { initialized: boolean; collectionName: string | null } {
    return {
      initialized: this.isInitialized,
      collectionName: this.collection?.name || null,
    };
  }
}

export const chromaService = new ChromaService();
