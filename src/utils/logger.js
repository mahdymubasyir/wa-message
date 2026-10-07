import { appendFile, mkdir, open } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const logsDirectory = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../logs",
);
const logFiles = ["app.log", "error.log", "whatsapp.log"];
let logsReady;

function timestamp() {
  const date = new Date();
  const pad = (value) => String(value).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(
    date.getSeconds(),
  )}`;
}

function oneLine(value) {
  return String(value ?? "").replace(/[\r\n]+/g, " ");
}

async function initializeLogs() {
  if (!logsReady) {
    logsReady = (async () => {
      await mkdir(logsDirectory, { recursive: true });
      await Promise.all(
        logFiles.map(async (file) => {
          const handle = await open(path.join(logsDirectory, file), "a");
          await handle.close();
        }),
      );
    })();
  }

  await logsReady;
}

async function writeLog(file, entry) {
  try {
    await initializeLogs();
    await appendFile(path.join(logsDirectory, file), `${entry}\n`, "utf8");
  } catch (error) {
    console.error(`Gagal menulis ${file}:`, error);
  }
}

export function logApp(message) {
  return writeLog("app.log", `[${timestamp()}] ${oneLine(message)}`);
}

export function logError(context, error) {
  const name = error?.name || "Error";
  const message = error?.message || error;
  const stack = error?.stack;

  return writeLog(
    "error.log",
    [
      `[${timestamp()}] ${oneLine(context)}`,
      `error: ${oneLine(`${name}: ${message}`)}`,
      ...(stack ? [`stack: ${oneLine(stack)}`] : []),
    ].join("\n"),
  );
}

export function logWhatsAppMessage({
  chatId,
  message,
  status,
  messageId,
  error,
}) {
  const lines = [
    `[${timestamp()}] SEND MESSAGE`,
    `chatId: ${oneLine(chatId)}`,
  ];

  if (message !== undefined) {
    lines.push(`message: ${oneLine(message)}`);
  }

  lines.push(`status: ${status}`);

  if (status === "SUCCESS") {
    lines.push(`messageId: ${oneLine(messageId || "unavailable")}`);
  } else {
    lines.push(`error: ${oneLine(error || "Unknown error")}`);
  }

  return writeLog("whatsapp.log", lines.join("\n"));
}
