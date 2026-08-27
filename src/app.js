import express from "express";
import cors from "cors";
import pkg from "whatsapp-web.js";
import qrcode from "qrcode-terminal";

const app = express();

const { Client, LocalAuth } = pkg;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  },
});

let isReady = false;

client.on("qr", (qr) => {
  console.log("Scan QR Code berikut:");
  qrcode.generate(qr, { small: true });
});

client.on("ready", () => {
  isReady = true;
  console.log("Bot WhatsApp siap digunakan!");
});

client.initialize();

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "REST API Maintenance berjalan",
  });
});

// GET: Ambil Daftar Kontak
app.get("/api/contacts", async (req, res) => {
  try {
    const contacts = await client.getContacts();
    const formatted = contacts
      .filter((c) => c.isWAContact && !c.isGroup)
      .map((c) => ({
        id: c.id._serialized,
        name: c.name || c.pushname || "Tanpa Nama",
        number: c.number,
      }));

    res.json({ success: true, total: formatted.length, data: formatted });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Gagal mengambil kontak", error });
  }
});

// GET: Ambil Daftar Grup
app.get("/api/groups", async (req, res) => {
  try {
    const chats = await client.getChats();
    const groups = chats
      .filter((chat) => chat.isGroup)
      .map((chat) => ({
        id: chat.id._serialized,
        name: chat.name,
      }));

    res.json({ success: true, total: groups.length, data: groups });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Gagal mengambil grup", error });
  }
});

export default app;
