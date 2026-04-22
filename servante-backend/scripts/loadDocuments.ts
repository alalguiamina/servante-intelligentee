import { chromaService } from "../src/services/chatbot/chromaService";
import { documentSplitter } from "../src/services/chatbot/documentSplitter";
import fs from "fs/promises";
import path from "path";

interface DocumentFile {
  path: string;
  title: string;
  category: string;
}

async function loadDocuments() {
  console.log("═══════════════════════════════════════════");
  console.log("   📚 CHARGEMENT DES DOCUMENTS");
  console.log("═══════════════════════════════════════════\n");

  try {
    await chromaService.initialize();
    console.log("✅ ChromaDB initialisé\n");

    const documentsDir = path.resolve("./documents");
    
    const documentFiles: DocumentFile[] = [
      {
        path: path.join(documentsDir, "base_connaissances", "chatbot_knowledge_base.md"),
        title: "Base de connaissances du chatbot",
        category: "base_connaissances"
      },
      {
        path: path.join(documentsDir, "guide_admin", "index_outils.md"),
        title: "Index des outils",
        category: "base_connaissances"
      },
      {
        path: path.join(documentsDir, "faq", "FAQ_generale.md"),
        title: "FAQ Générale",
        category: "faq"
      },
      {
        path: path.join(documentsDir, "faq", "FAQ_utilisateurs.md"),
        title: "FAQ Utilisateurs",
        category: "faq"
      },
      {
        path: path.join(documentsDir, "guide_admin", "authentification.md"),
        title: "Guide Admin - Authentification",
        category: "guide_admin"
      },
      {
        path: path.join(documentsDir, "guide_admin", "gestion_outils.md"),
        title: "Guide Admin - Gestion des outils",
        category: "guide_admin"
      },
      {
        path: path.join(documentsDir, "guide_admin", "systeme_emprunt.md"),
        title: "Guide Admin - Système d emprunt",
        category: "guide_admin"
      },
      {
        path: path.join(documentsDir, "guide_utilisateur", "guide_rapide.md"),
        title: "Guide rapide utilisateur",
        category: "guide_utilisateur"
      },
    ];

    let totalChunks = 0;
    let totalDocuments = 0;

    for (const doc of documentFiles) {
      try {
        console.log(`📄 Traitement: ${doc.title}`);
        
        const content = await fs.readFile(doc.path, "utf-8");
        console.log(`   Taille originale: ${content.length} caractères`);

        const splitResult = await documentSplitter.splitDocument(content);
        console.log(`   📊 Divisé en ${splitResult.metadata.chunkCount} chunks`);
        console.log(`   📏 Taille moyenne des chunks: ${splitResult.metadata.avgChunkSize} caractères`);

        for (let i = 0; i < splitResult.chunks.length; i++) {
          const chunkId = `${doc.category}_${path.basename(doc.path, ".md")}_chunk_${i}`;
          
          await chromaService.addDocument(chunkId, splitResult.chunks[i], {
            title: doc.title,
            filename: path.basename(doc.path),
            category: doc.category,
            chunkIndex: i,
            totalChunks: splitResult.chunks.length,
          });
        }

        totalChunks += splitResult.chunks.length;
        totalDocuments++;
        console.log(`   ✅ ${splitResult.chunks.length} chunks ajoutés\n`);

      } catch (error) {
        console.error(`   ❌ Erreur pour ${doc.title}:`, error instanceof Error ? error.message : error);
        console.log();
      }
    }

    const finalCount = await chromaService.countDocuments();
    
    console.log("═══════════════════════════════════════════");
    console.log("   📊 STATISTIQUES FINALES");
    console.log("═══════════════════════════════════════════");
    console.log(`✅ Documents traités: ${totalDocuments}`);
    console.log(`✅ Chunks créés: ${totalChunks}`);
    console.log(`✅ Total dans ChromaDB: ${finalCount}`);
    console.log("═══════════════════════════════════════════\n");

    console.log("🎉 CHARGEMENT TERMINÉ AVEC SUCCÈS!\n");
    process.exit(0);

  } catch (error) {
    console.error("❌ Erreur fatale:", error);
    process.exit(1);
  }
}

loadDocuments();
