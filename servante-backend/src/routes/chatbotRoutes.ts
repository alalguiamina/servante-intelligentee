import express from "express";
import chatbotController from "../controllers/chatbotController";
import { uploadMiddleware } from "../middleware/uploadMiddleware";

const router = express.Router();

router.get("/health", chatbotController.healthCheck);

router.post(
  "/admin/upload",
  uploadMiddleware.single("document"),
  chatbotController.uploadDocument
);

router.get("/admin/documents", chatbotController.listDocuments);
router.get("/admin/stats", chatbotController.getStats);
router.get("/admin/documents/:id", chatbotController.getDocument);
router.delete("/admin/documents/:id", chatbotController.deleteDocument);
router.post("/search", chatbotController.searchDocuments);
router.post("/chat", chatbotController.chat);
router.post("/chat/stream", chatbotController.streamChat);

export default router;
