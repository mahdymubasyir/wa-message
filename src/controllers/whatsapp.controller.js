import { client, isReady } from "../app.js";
import { logError, logWhatsAppMessage } from "../utils/logger.js";

export const checkStatusWhatsApp = async (req, res) => {
  try {
    const state = await client.getState();

    res.json({
      success: true,
      ready: isReady,
      state: state,
    });
  } catch (error) {
    console.error(error);
    await logError("Failed to check WhatsApp status", error);

    res.status(503).json({
      success: false,
      ready: false,
      state: "DISCONNECTED",
      message: "WhatsApp belum tersedia",
      error: {
        name: error?.name,
        message: error?.message,
      },
    });
  }
};

export const getContacts = async (req, res) => {
  try {
    if (!isReady) {
      return res.status(503).json({
        success: false,
        message: "WhatsApp belum siap. Tunggu sampai event ready.",
      });
    }

    const contacts = await client.getContacts();
    console.log("Total contacts:", contacts.length);
    const formatted = contacts
      .filter((c) => c.isWAContact && !c.isGroup)
      .map((c) => ({
        id: c.id._serialized,
        name: c.name || c.pushname || "Tanpa Nama",
        number: c.number,
      }));

    res.json({ success: true, total: formatted.length, data: formatted });
  } catch (error) {
    await logError("Failed to get WhatsApp contacts", error);
    res
      .status(500)
      .json({ success: false, message: "Gagal mengambil kontak", error });
  }
};

export const getGroups = async (req, res) => {
  try {
    if (!isReady) {
      return res.status(503).json({
        success: false,
        message: "WhatsApp belum siap. Tunggu sampai event ready.",
      });
    }

    const groups = await client.pupPage.evaluate(() => {
      const chats = window.require("WAWebCollections").Chat.getModelsArray();

      return chats
        .filter((chat) => chat.groupMetadata)
        .map((chat) => {
          const chatId = chat.id._serialized;

          return {
            id: chatId,
            chatId,
            name: chat.formattedTitle || chat.name || "Tanpa Nama",
          };
        });
    });

    console.log("Total groups:", groups.length);

    return res.json({
      success: true,
      total: groups.length,
      data: groups,
    });
  } catch (error) {
    console.error("================================");
    console.error("GAGAL MENGAMBIL GROUP");
    console.error("================================");

    console.error("Error:", error);
    console.error("Name:", error?.name);
    console.error("Message:", error?.message);
    console.error("Stack:", error?.stack);
    await logError("Failed to get WhatsApp groups", error);

    return res.status(500).json({
      success: false,
      message: "Gagal mengambil grup",
      error: {
        name: error?.name,
        message: error?.message,
        stack: error?.stack,
      },
    });
  }
};

export const sendMessage = async (req, res) => {
  const { chatId, message } = req.body;

  try {
    if (!isReady) {
      await logWhatsAppMessage({
        chatId,
        message,
        status: "FAILED",
        error: "WhatsApp belum siap.",
      });
      return res.status(503).json({
        success: false,
        message: "WhatsApp belum siap.",
      });
    }

    if (!chatId) {
      await logWhatsAppMessage({
        chatId,
        message,
        status: "FAILED",
        error: "chatId wajib diisi.",
      });
      return res.status(400).json({
        success: false,
        message: "chatId wajib diisi.",
      });
    }

    if (!message) {
      await logWhatsAppMessage({
        chatId,
        message,
        status: "FAILED",
        error: "message wajib diisi.",
      });
      return res.status(400).json({
        success: false,
        message: "message wajib diisi.",
      });
    }

    const result = await client.sendMessage(chatId, message);
    await logWhatsAppMessage({
      chatId,
      message,
      status: "SUCCESS",
      messageId: result?.id?._serialized,
    });

    return res.json({
      success: true,
      message: result
        ? "Pesan berhasil dikirim."
        : "Pesan dikirim, tetapi metadata pesan tidak tersedia.",
      data: result
        ? {
            id: result.id?._serialized ?? null,
            timestamp: result.timestamp ?? null,
          }
        : null,
    });
  } catch (error) {
    console.error("Gagal mengirim pesan:", error);
    await Promise.all([
        logWhatsAppMessage({
          chatId,
          message,
          status: "FAILED",
          error: error?.message || error,
        }),
        logError("Failed to send WhatsApp message", error),
    ]);

    return res.status(500).json({
      success: false,
      message: "Gagal mengirim pesan.",
      error: {
        name: error?.name,
        message: error?.message,
      },
    });
  }
};
