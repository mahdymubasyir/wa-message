import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import {
  checkStatusWhatsApp,
  getContacts,
  getGroups,
  sendMessage,
} from "../controllers/whatsapp.controller.js";

const router = Router();

router.get("/status", authenticate, checkStatusWhatsApp); // Check Status WhatsApp
router.get("/contacts", authenticate, getContacts); // Get All Contacts
router.get("/groups", authenticate, getGroups); // Get All Groups
router.post("/send-message", authenticate, sendMessage); // Kirim Pesan

// Health Check
router.get("/health", (req, res) => {
  res.json({
    success: true,
    service: "whatsapp-gateway",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    // node: "online",
    // whatsapp: "ready",
  });
});

export default router;
