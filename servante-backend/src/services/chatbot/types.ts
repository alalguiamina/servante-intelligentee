export interface DocumentMetadata extends Record<string, any> {
  title: string;
  filename: string;
  mimetype?: string;
  uploadedAt: string;
  size: number;
  category?: string;
  tags?: string[];
}

export interface StoredDocument {
  id: string;
  content: string;
  metadata: DocumentMetadata;
}

export interface DocumentListResult {
  count: number;
  documents: StoredDocument[];
}

export interface ChromaServiceConfig {
  collectionName: string;
  host: string;
  port: number;
}

export function toDocumentMetadata(metadata: any): DocumentMetadata {
  if (!metadata) {
    return {
      title: "Sans titre",
      filename: "unknown",
      uploadedAt: new Date().toISOString(),
      size: 0,
    };
  }

  return {
    title: (metadata.title as string) || "Sans titre",
    filename: (metadata.filename as string) || "unknown",
    mimetype: metadata.mimetype as string | undefined,
    uploadedAt: (metadata.uploadedAt as string) || new Date().toISOString(),
    size: typeof metadata.size === "number" ? metadata.size : 0,
    category: metadata.category as string | undefined,
    tags: Array.isArray(metadata.tags) ? metadata.tags as string[] : undefined,
  };
}
