import express from "express";
import cors from "cors";
import pkg from "whatsapp-web.js";
import qrcode from "qrcode-terminal";
import mainRouter from "./routes/main.route.js";
import { logApp, logError } from "./utils/logger.js";

const app = express();

const { Client, LocalAuth } = pkg;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api", mainRouter);

export let isReady = false;

export const client = new Client({
  authStrategy: new LocalAuth({
    clientId: "main",
  }),
  puppeteer: {
    headless: false,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  },
});

client.on("qr", (qr) => {
  console.log("Scan QR Code berikut:");
  void logApp("WhatsApp QR code generated");
  qrcode.generate(qr, { small: true });
});

client.on("ready", () => {
  isReady = true;
  console.log("Bot WhatsApp siap digunakan!");
  void logApp("WhatsApp client ready");
});

client.on("authenticated", () => {
  console.log("WhatsApp authenticated");
  void logApp("WhatsApp authenticated");
});

client.on("auth_failure", (message) => {
  isReady = false;
  console.error("Authentication failure:", message);
  void logError("WhatsApp authentication failure", new Error(message));
});

client.on("disconnected", (reason) => {
  isReady = false;
  console.log("WhatsApp disconnected:", reason);
  void logApp(`WhatsApp disconnected: ${reason}`);
});

client.initialize();

export default app;
