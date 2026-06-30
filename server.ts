import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini API client
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// AI Copilot Endpoint
app.post("/api/copilot", async (req, res) => {
  try {
    const { logs, question, currentConfig } = req.body;

    const ai = getGeminiClient();

    if (!ai) {
      // High-fidelity fallback responses for when the Gemini API key is not configured
      let fallbackText = "";
      const q = (question || "").toLowerCase();

      if (q.includes("crash") || q.includes("error") || q.includes("why")) {
        fallbackText = `### 🔍 Server Log Analysis (Simulated)
No critical errors or crashes are found in the recent logs. However, the server is allocating 3.8GB of RAM. If you experience ticking lag (TPS drops below 20), consider these actions:
1. **Garbage Collection (GC) Flags**: We recommend running your server with **Aikar's Flags** to optimize JVM garbage collection pauses.
2. **Entity Limits**: Check if entity ticking is bottlenecking CPU by using \`/spark profiler\` on Spigot/Paper.

---
💡 *Note: Please configure a real \`GEMINI_API_KEY\` in the **Settings > Secrets** panel in the top-right to activate full AI diagnostics on your custom console logs!*`;
      } else if (q.includes("plugin") || q.includes("worldedit") || q.includes("install")) {
        fallbackText = `### 📦 Plugin Setup Guide
To install plugins like **WorldEdit** or **EssentialsX**:
1. Click the **Plugin Marketplace** tab in this panel.
2. Search or find the plugin you want, and click **Install**.
3. Once downloaded, either run \`/reload\` in the console or click **Restart** in the power controls to load the plugin.
4. Verify by running \`/plugins\` or \`/pl\` inside the console terminal.

---
💡 *Note: Please configure a real \`GEMINI_API_KEY\` in the **Settings > Secrets** panel in the top-right to activate full AI diagnostics on your custom console logs!*`;
      } else if (q.includes("optimize") || q.includes("lag") || q.includes("tps")) {
        fallbackText = `### ⚡ Server Performance & TPS Optimization
If your TPS (Ticks Per Second) is dropping below 20.0, apply these Spigot/Paper config optimizations:
* **view-distance**: Reduce to \`4\` or \`6\` in \`server.properties\`.
* **simulation-distance**: Reduce to \`4\` in \`server.properties\` (separates player ticking from rendering).
* **spawn-limits**: In \`spigot.yml\`, reduce monsters to \`50\` and animals to \`10\`.
* **despawn-ranges**: Adjust soft/hard ranges in \`paper-world-defaults.yml\` to remove distant unneeded entities quickly.

---
💡 *Note: Please configure a real \`GEMINI_API_KEY\` in the **Settings > Secrets** panel in the top-right to activate full AI diagnostics on your custom console logs!*`;
      } else {
        fallbackText = `### 👋 Welcome to CraftPilot (Simulation Mode)
I'm your AI Server Admin Assistant. Here are some things you can ask me:
* *"Can you analyze my console logs for errors?"*
* *"How do I fix severe lag on a Spigot server?"*
* *"How can I set up a MySQL database for my LuckPerms plugin?"*
* *"What is the difference between Paper and Purpur?"*

---
⚠️ **Simulation Active**: To enable full, unrestricted AI reasoning on any question you ask, please set your \`GEMINI_API_KEY\` in the **Settings > Secrets** panel of the AI Studio UI!`;
      }

      return res.json({ response: fallbackText, simulated: true });
    }

    // Construct rich prompt
    let prompt = "User request:\n";
    if (question) {
      prompt += `User Question: "${question}"\n\n`;
    } else {
      prompt += "Please analyze the server state and log history for warnings/errors and provide general maintenance suggestions.\n\n";
    }

    if (logs && Array.isArray(logs) && logs.length > 0) {
      prompt += "--- SERVER CONSOLE LOG HISTORY ---\n";
      const formattedLogs = logs.map(l => `[${l.timestamp}] [${l.type.toUpperCase()}] ${l.line}`).join("\n");
      prompt += formattedLogs + "\n";
      prompt += "----------------------------------\n\n";
    }

    if (currentConfig) {
      prompt += "--- CURRENT SERVER PROPERTIES CONFIG ---\n";
      prompt += JSON.stringify(currentConfig, null, 2) + "\n";
      prompt += "----------------------------------------\n\n";
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: `You are "CraftPilot", an expert Minecraft Server Administrator and systems engineer.
Your job is to assist Minecraft server operators with technical diagnostics, configurations, optimization, and plugin setup.
You are extremely familiar with PaperMC, Purpur, Spigot, Forge, Fabric, Aikar's GC Flags, memory allocations, server.properties settings, MySQL/PostgreSQL databases for plugins, and standard diagnostic logs.

Always respond in highly structured, professional Markdown format with neat headings, bullet points, and copy-pasteable configuration files or commands in backticks where useful.
If analyzing server logs, point out exact error patterns (like Thread Starvation, OutOfMemoryError, Ticking Entity lag, plugin loading conflicts) and suggest detailed, actionable fixes. Keep your advice precise, modern (referencing current Minecraft optimization guides), and free of generic corporate introductory sentences.`
      }
    });

    res.json({ response: response.text, simulated: false });
  } catch (error: any) {
    console.error("Gemini Copilot API error:", error);
    res.status(500).json({ error: error.message || "An error occurred during Gemini API generation" });
  }
});

// Serve health status
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
