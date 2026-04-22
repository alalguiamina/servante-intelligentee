import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

export interface ChunkResult {
  chunks: string[];
  metadata: {
    originalLength: number;
    chunkCount: number;
    avgChunkSize: number;
  };
}

class DocumentSplitter {
  private splitter: RecursiveCharacterTextSplitter;

  constructor() {
    this.splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
      separators: ["\n\n", "\n", ". ", " ", ""],
    });
  }

  async splitDocument(content: string): Promise<ChunkResult> {
    const chunks = await this.splitter.splitText(content);
    
    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const avgChunkSize = chunks.length > 0 ? Math.round(totalLength / chunks.length) : 0;

    return {
      chunks,
      metadata: {
        originalLength: content.length,
        chunkCount: chunks.length,
        avgChunkSize,
      },
    };
  }

  async splitDocuments(documents: string[]): Promise<string[]> {
    const allChunks: string[] = [];
    
    for (const doc of documents) {
      const result = await this.splitDocument(doc);
      allChunks.push(...result.chunks);
    }
    
    return allChunks;
  }
}

export const documentSplitter = new DocumentSplitter();
