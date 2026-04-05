import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer as createViteServer } from "vite";

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const isPreview = process.argv.includes("--preview");
const port = Number(process.env.PORT ?? (isPreview ? 4173 : 5173));
const host = process.env.HOST ?? "127.0.0.1";

loadLocalEnv(path.join(rootDir, ".env"));
loadLocalEnv(path.join(rootDir, ".env.local"));

const mimeTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".mjs", "text/javascript; charset=utf-8"],
  [".svg", "image/svg+xml"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".webp", "image/webp"],
  [".pdf", "application/pdf"],
  [".ico", "image/x-icon"],
  [".txt", "text/plain; charset=utf-8"],
]);

const server = isPreview ? await createPreviewServer() : await createDevServer();
server.listen(port, host, () => {
  console.log(`Navigator server running at http://${host}:${port}`);
});

async function createDevServer() {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });

  return createServer(async (request, response) => {
    if (await handleTtsRequest(request, response)) {
      return;
    }

    vite.middlewares(request, response, (error) => {
      if (error) {
        vite.ssrFixStacktrace(error);
        response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
        response.end(error.message);
      } else {
        response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
        response.end("Not found.");
      }
    });
  });
}

async function createPreviewServer() {
  const distDir = path.join(rootDir, "dist");

  return createServer(async (request, response) => {
    if (await handleTtsRequest(request, response)) {
      return;
    }

    const served = await servePreviewAsset(request, response, distDir);
    if (!served) {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Not found.");
    }
  });
}

async function handleTtsRequest(request, response) {
  const requestUrl = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);
  if (requestUrl.pathname !== "/api/tts") {
    return false;
  }

  if (request.method !== "POST") {
    respondJson(response, 405, { error: "Method not allowed." });
    return true;
  }

  const provider = pickTtsProvider();
  if (!provider) {
    respondJson(response, 503, {
      error: "No TTS provider key is configured. Add ELEVENLABS_API_KEY or OPENAI_API_KEY.",
    });
    return true;
  }

  let payload;
  try {
    payload = await readJsonBody(request);
  } catch {
    respondJson(response, 400, { error: "Invalid JSON request body." });
    return true;
  }

  const text = typeof payload?.text === "string" ? payload.text.trim() : "";
  const language = payload?.language === "es" ? "es" : "en";

  if (!text) {
    respondJson(response, 400, { error: "A non-empty text value is required." });
    return true;
  }

  try {
    const upstreamResponse =
      provider === "elevenlabs"
        ? await createElevenLabsSpeech(text, language)
        : await createOpenAiSpeech(text, language);

    if (!upstreamResponse.ok) {
      const detail = await safeReadError(upstreamResponse);
      respondJson(response, upstreamResponse.status, {
        error:
          provider === "elevenlabs" ? "ElevenLabs TTS request failed." : "OpenAI TTS request failed.",
        detail,
      });
      return true;
    }

    const audioBuffer = Buffer.from(await upstreamResponse.arrayBuffer());
    response.writeHead(200, {
      "Cache-Control": "no-store",
      "Content-Length": String(audioBuffer.byteLength),
      "Content-Type": upstreamResponse.headers.get("content-type") ?? "audio/mpeg",
    });
    response.end(audioBuffer);
    return true;
  } catch (error) {
    respondJson(response, 502, {
      error: "Unable to reach OpenAI TTS.",
      detail: error instanceof Error ? error.message : "Unknown error.",
    });
    return true;
  }
}

async function servePreviewAsset(request, response, distDir) {
  const requestUrl = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);
  const pathname = decodeURIComponent(requestUrl.pathname);
  const acceptsHtml = (request.headers.accept ?? "").includes("text/html");
  const assetPath = pathname === "/" ? "/index.html" : pathname;

  const directFile = await readAsset(path.join(distDir, assetPath), distDir);
  if (directFile) {
    writeAssetResponse(response, directFile.body, directFile.filePath);
    return true;
  }

  if (request.method === "GET" && acceptsHtml) {
    const indexFile = await readAsset(path.join(distDir, "index.html"), distDir);
    if (indexFile) {
      writeAssetResponse(response, indexFile.body, indexFile.filePath);
      return true;
    }
  }

  return false;
}

async function readAsset(filePath, allowedRoot) {
  const normalizedPath = path.normalize(filePath);
  const normalizedRoot = path.normalize(allowedRoot);
  if (
    normalizedPath !== normalizedRoot &&
    !normalizedPath.startsWith(`${normalizedRoot}${path.sep}`)
  ) {
    return null;
  }

  try {
    const fileStats = await stat(normalizedPath);
    if (!fileStats.isFile()) {
      return null;
    }

    return {
      body: await readFile(normalizedPath),
      filePath: normalizedPath,
    };
  } catch {
    return null;
  }
}

function writeAssetResponse(response, body, filePath) {
  const extension = path.extname(filePath).toLowerCase();
  response.writeHead(200, {
    "Cache-Control": extension === ".html" ? "no-store" : "public, max-age=31536000, immutable",
    "Content-Length": String(body.byteLength),
    "Content-Type": mimeTypes.get(extension) ?? "application/octet-stream",
  });
  response.end(body);
}

function respondJson(response, statusCode, payload) {
  const body = Buffer.from(JSON.stringify(payload));
  response.writeHead(statusCode, {
    "Cache-Control": "no-store",
    "Content-Length": String(body.byteLength),
    "Content-Type": "application/json; charset=utf-8",
  });
  response.end(body);
}

async function readJsonBody(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const rawBody = Buffer.concat(chunks).toString("utf8");
  return rawBody ? JSON.parse(rawBody) : {};
}

async function safeReadError(response) {
  try {
    const text = await response.text();
    return text.slice(0, 500);
  } catch {
    return "Unable to read error response.";
  }
}

function pickTtsProvider() {
  if (process.env.ELEVENLABS_API_KEY) {
    return "elevenlabs";
  }

  if (process.env.OPENAI_API_KEY) {
    return "openai";
  }

  return null;
}

function pickVoice(language) {
  if (language === "es") {
    return process.env.OPENAI_TTS_VOICE_ES ?? "sage";
  }

  return process.env.OPENAI_TTS_VOICE_EN ?? "coral";
}

function pickSpeed(language) {
  const rawValue =
    language === "es"
      ? process.env.OPENAI_TTS_SPEED_ES ?? "0.92"
      : process.env.OPENAI_TTS_SPEED_EN ?? "0.88";
  const parsed = Number(rawValue);

  if (!Number.isFinite(parsed)) {
    return 1;
  }

  return Math.min(4, Math.max(0.25, parsed));
}

function buildVoiceInstructions(language) {
  if (language === "es") {
    return "Habla como una persona real, no como un asistente virtual. Usa un ritmo conversacional con pausas naturales entre ideas. Enfatiza suavemente las palabras clave. Suena como una vecina amable que conoce bien los beneficios y quiere ayudar de verdad. Evita completamente la cadencia plana de centro de llamadas o asistente de voz. Varia tu entonacion de forma organica, como lo harias en una conversacion cara a cara.";
  }

  return "Speak like a real person, not a voice assistant. Use a conversational rhythm with natural pauses between ideas. Gently emphasize key words. Sound like a knowledgeable neighbor who genuinely wants to help someone navigate benefits — warm, unhurried, and human. Never use a flat call-center cadence. Let your intonation rise and fall organically, the way it would in a real face-to-face conversation. Take brief natural pauses after commas and before important information.";
}

async function createElevenLabsSpeech(text, language) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = process.env.ELEVENLABS_VOICE_ID ?? "JBFqnCBsd6RMkjVDRZzb";
  const outputFormat = process.env.ELEVENLABS_OUTPUT_FORMAT ?? "mp3_44100_128";
  const modelId = process.env.ELEVENLABS_MODEL_ID ?? "eleven_multilingual_v2";
  const speechUrl = new URL(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`,
  );
  speechUrl.searchParams.set("output_format", outputFormat);

  return fetch(speechUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "xi-api-key": apiKey,
    },
    body: JSON.stringify({
      text: text.slice(0, 5000),
      model_id: modelId,
      language_code: language,
      voice_settings: {
        similarity_boost: 0.80,
        stability: 0.32,
        style: 0.40,
        use_speaker_boost: true,
      },
    }),
  });
}

async function createOpenAiSpeech(text, language) {
  const apiKey = process.env.OPENAI_API_KEY;
  const requestBody = {
    model: process.env.OPENAI_TTS_MODEL ?? "gpt-4o-mini-tts",
    voice: pickVoice(language),
    input: text.slice(0, 4096),
    instructions: buildVoiceInstructions(language),
    response_format: process.env.OPENAI_TTS_FORMAT ?? "mp3",
    speed: pickSpeed(language),
  };

  return fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });
}

function loadLocalEnv(filePath) {
  try {
    const rawFile = readFileSyncSafe(filePath);
    if (!rawFile) {
      return;
    }

    for (const line of rawFile.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }

      const separatorIndex = trimmed.indexOf("=");
      if (separatorIndex < 1) {
        continue;
      }

      const key = trimmed.slice(0, separatorIndex).trim();
      const rawValue = trimmed.slice(separatorIndex + 1).trim();

      if (!key || key in process.env) {
        continue;
      }

      process.env[key] = stripWrappingQuotes(rawValue);
    }
  } catch {
    // Ignore local env parsing issues and continue with system env.
  }
}

function readFileSyncSafe(filePath) {
  try {
    return readFileSync(filePath, "utf8");
  } catch {
    return null;
  }
}

function stripWrappingQuotes(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}
