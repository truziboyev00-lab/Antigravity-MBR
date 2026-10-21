// server.ts
import express from "express";
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { GoogleGenAI, Modality } from "@google/genai";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
dotenv.config();
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var app = express();
var httpServer = createServer(app);
var PORT = process.env.PORT || 3e3;
app.use(express.json({ limit: "15mb" }));
var ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build"
    }
  }
});
var DEFAULT_SYSTEM_INSTRUCTION = `You are the Senior Process Automation & Chemical Engineering Specialist for Unit 77 and the Universal Multi-Plant Industrial Membrane Bioreactor (MBR) Fleet (T01-T07).
Plant Topology: 7 canonical trains (T01 to T07), each with 4,800 m\xB2 membrane area (total fleet: 33,600 m\xB2). PVDF hollow-fiber 0.04 \xB5m pore size. Design flux 24.0 LMH, maximum 35.0 LMH.
Process Conditions: Water temp 15-20\xB0C, MLSS 7,000-10,000 mg/L, aeration basin DO 2.0-2.5 mg/L, biological target SRT 25 days.
Standard Cleaning: Maintenance CIP (weekly NaOCl 500-1000 mg/L or citric acid 0.2-0.5 wt%), Recovery CIP (semi-annual NaOCl 2000 mg/L + citric acid 1-2 wt%).
You provide authoritative, mathematically rigorous engineering advice on membrane hydraulics, TMP compensation, fouling diagnosis, chemical cleaning recipes, aeration scour, and biological SRT. Always cite specific engineering units and equations where appropriate.`;
app.get("/api/health", (_req, res) => {
  res.json({
    status: "online",
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    geminiKeyConfigured: !!process.env.GEMINI_API_KEY
  });
});
app.post("/api/gemini/chat", async (req, res) => {
  try {
    const {
      messages = [],
      model = "gemini-3.5-flash",
      enableSearch = false,
      systemInstruction = DEFAULT_SYSTEM_INSTRUCTION
    } = req.body;
    if (!messages.length) {
      return res.status(400).json({ error: "Messages array cannot be empty." });
    }
    const contents = messages.map((m) => ({
      role: m.role === "assistant" || m.role === "model" ? "model" : "user",
      parts: [{ text: m.content }]
    }));
    const config = {
      systemInstruction
    };
    if (enableSearch) {
      config.tools = [{ googleSearch: {} }];
    }
    let targetModel = model;
    const validModels = ["gemini-3.1-pro-preview", "gemini-3.5-flash", "gemini-3.1-flash-lite"];
    if (!validModels.includes(targetModel)) {
      targetModel = "gemini-3.5-flash";
    }
    let response;
    let modelActuallyUsed = targetModel;
    try {
      response = await ai.models.generateContent({
        model: targetModel,
        contents,
        config
      });
    } catch (apiErr) {
      console.warn(`Primary model ${targetModel} encountered error:`, apiErr.message);
      if (targetModel === "gemini-3.1-pro-preview") {
        targetModel = "gemini-3.5-flash";
        modelActuallyUsed = "gemini-3.5-flash (Auto-fallback from 3.1-pro)";
        response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents,
          config: {
            ...config,
            tools: enableSearch ? [{ googleSearch: {} }] : void 0
          }
        });
      } else if (enableSearch && apiErr.message?.includes("429")) {
        targetModel = "gemini-3.1-flash-lite";
        modelActuallyUsed = "gemini-3.1-flash-lite";
        response = await ai.models.generateContent({
          model: "gemini-3.1-flash-lite",
          contents,
          config: { systemInstruction }
        });
      } else {
        throw apiErr;
      }
    }
    const candidate = response.candidates?.[0];
    const text = response.text || candidate?.content?.parts?.[0]?.text || "";
    const groundingChunks = candidate?.groundingMetadata?.groundingChunks || [];
    const webSearchQueries = candidate?.groundingMetadata?.webSearchQueries || [];
    res.json({
      text,
      modelUsed: modelActuallyUsed,
      groundingChunks,
      webSearchQueries
    });
  } catch (error) {
    console.error("Gemini chat error:", error);
    res.status(500).json({
      error: error.message || "An error occurred while generating response from Gemini."
    });
  }
});
app.post("/api/gemini/search", async (req, res) => {
  try {
    const { query, topic = "Water & MBR Engineering" } = req.body;
    if (!query) {
      return res.status(400).json({ error: "Search query is required." });
    }
    const prompt = `Topic: ${topic}
User Query: ${query}
Provide an up-to-date, scientifically accurate, and industry-grounded analysis.`;
    let response;
    try {
      response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are an industrial water treatment researcher. Provide concise, cited, grounded technical answers using the googleSearch tool.",
          tools: [{ googleSearch: {} }]
        }
      });
    } catch (searchErr) {
      response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: prompt,
        config: {
          systemInstruction: "You are an industrial water treatment researcher. Provide concise technical answers."
        }
      });
    }
    const candidate = response.candidates?.[0];
    const text = response.text || "";
    const groundingChunks = candidate?.groundingMetadata?.groundingChunks || [];
    const webSearchQueries = candidate?.groundingMetadata?.webSearchQueries || [];
    res.json({
      answer: text,
      groundingChunks,
      webSearchQueries
    });
  } catch (error) {
    console.error("Search grounding error:", error);
    res.status(500).json({
      error: error.message || "Failed to perform search grounded generation."
    });
  }
});
var wss = new WebSocketServer({ noServer: true });
httpServer.on("upgrade", (request, socket, head) => {
  const { pathname } = new URL(request.url || "", `http://${request.headers.host}`);
  if (pathname === "/api/live" || pathname === "/live") {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request);
    });
  } else {
    socket.destroy();
  }
});
wss.on("connection", async (clientWs) => {
  console.log("Client connected to Live API WebSocket");
  let session = null;
  let isClosing = false;
  try {
    session = await ai.live.connect({
      model: "gemini-3.8-live",
      config: {
        responseModalities: [Modality.AUDIO],
        inputAudioTranscription: {},
        outputAudioTranscription: {},
        systemInstruction: "You are the Unit 77 MBR Live Voice Operator Assistant. You assist field engineers verbally with membrane diagnostics, flux, TMP, CIP wash cycles, and train states in concise, clear spoken engineering English.",
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: "Aoede"
            }
          }
        }
      },
      callbacks: {
        onmessage: (message) => {
          if (isClosing || clientWs.readyState !== WebSocket.OPEN) return;
          const parts = message.serverContent?.modelTurn?.parts || [];
          let audioData = void 0;
          let textData = void 0;
          for (const p of parts) {
            if (p.inlineData?.data) {
              audioData = p.inlineData.data;
            }
            if (p.text) {
              textData = p.text;
            }
          }
          const interrupted = message.serverContent?.interrupted;
          const outputTranscription = message.serverContent?.outputAudioTranscription?.text;
          const inputTranscription = message.serverContent?.inputAudioTranscription?.text;
          clientWs.send(JSON.stringify({
            audio: audioData,
            text: textData,
            outputTranscription,
            inputTranscription,
            interrupted
          }));
        },
        onerror: (err) => {
          console.error("Live session internal error:", err?.message);
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({ error: err?.message || "Live session error" }));
          }
        },
        onclose: () => {
          console.log("Live session closed from remote");
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({ closed: true }));
          }
        }
      }
    });
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(JSON.stringify({ status: "CONNECTED", model: "gemini-3.8-live" }));
    }
  } catch (err) {
    console.error("Failed to establish Live session:", err?.message);
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(JSON.stringify({ error: `Live API connect failed: ${err?.message}` }));
    }
  }
  clientWs.on("message", (raw) => {
    try {
      const data = JSON.parse(raw.toString());
      if (!session) {
        clientWs.send(JSON.stringify({ error: "Session not established yet" }));
        return;
      }
      if (data.audio) {
        session.sendRealtimeInput({
          audio: { data: data.audio, mimeType: "audio/pcm;rate=16000" }
        });
      } else if (data.text) {
        session.sendRealtimeInput({
          text: data.text
        });
      } else if (data.interrupt) {
        session.sendRealtimeInput({ text: " " });
      }
    } catch (parseErr) {
      console.warn("Malformed client message:", parseErr?.message);
    }
  });
  clientWs.on("close", () => {
    isClosing = true;
    console.log("Client WebSocket closed");
    try {
      if (session) session.close();
    } catch (closeErr) {
    }
  });
  clientWs.on("error", (wsErr) => {
    console.error("WebSocket error:", wsErr);
  });
});
async function startServer() {
  const isProd = process.env.NODE_ENV === "production";
  if (!isProd) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, "dist")));
    app.get("*", (_req, res) => {
      res.sendFile(path.resolve(__dirname, "dist", "index.html"));
    });
  }
  httpServer.listen(PORT, () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}
startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
