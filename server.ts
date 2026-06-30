import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import fs from "fs";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || "sovereign_panel_jwt_super_secret_key_1337";

// Authentication Middleware for Protected API Routes
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access token required. Please sign in." });
  }

  jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
    if (err) {
      return res.status(403).json({ error: "Your session has expired or is invalid. Please sign in again." });
    }
    req.user = decoded;
    next();
  });
};

const requireAdmin = (req: any, res: any, next: any) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ error: "Forbidden: Administrator privileges required." });
  }
  next();
};

// Protect all /api endpoints except auth and health endpoints
app.use((req, res, next) => {
  const path = req.path;
  if (path === "/api/login" || path === "/api/register" || path === "/api/health") {
    return next();
  }
  if (path.startsWith("/api/")) {
    return authenticateToken(req, res, next);
  }
  next();
});

const DB_FILE = path.join(process.cwd(), "db.json");

// Database Helper Functions
function readDb() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      // fallback template if file is deleted
      const defaultData = {
        users: [
          { username: "admin", email: "admin@unstableuniverse.world", password: "adminpassword", role: "admin", displayName: "strkxx (Root)" },
          { username: "client", email: "client@unstableuniverse.world", password: "clientpassword", role: "client", displayName: "unstable_user" }
        ],
        instances: [],
        errors: [],
        pressureLogs: [],
        nodeResources: { totalCpu: 16, totalRam: 64, totalDisk: 500, allocatedCpu: 0, allocatedRam: 0, allocatedDisk: 0, nodeOvercommitRatio: 150 },
        sqlHosts: []
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(defaultData, null, 2));
      return defaultData;
    }
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    const db = JSON.parse(raw);
    if (!db.sqlHosts) db.sqlHosts = [];
    if (db.nodeResources && db.nodeResources.nodeOvercommitRatio === undefined) {
      db.nodeResources.nodeOvercommitRatio = 150;
    }
    return db;
  } catch (err) {
    console.error("Error reading db.json", err);
    return { users: [], instances: [], errors: [], pressureLogs: [], nodeResources: {} };
  }
}

function writeDb(data: any) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing db.json", err);
  }
}

// REST APIs for Persistence

// Authentication
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Username/email and password are required." });
  }

  const db = readDb();
  const user = db.users.find((u: any) => 
    (u.email && u.email.toLowerCase() === email.toLowerCase().trim()) ||
    (u.username && u.username.toLowerCase() === email.toLowerCase().trim())
  );

  if (!user) {
    return res.status(401).json({ error: "Invalid username/email or password." });
  }

  // Cryptographic password check with bcrypt
  const isMatch = bcrypt.compareSync(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ error: "Invalid username/email or password." });
  }

  // Generate secure JWT token
  const token = jwt.sign(
    { 
      username: user.username, 
      email: user.email, 
      role: user.role, 
      displayName: user.displayName 
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({
    username: user.username,
    email: user.email,
    role: user.role,
    displayName: user.displayName,
    token
  });
});

app.post("/api/register", (req, res) => {
  const { username, email, password, displayName } = req.body;
  
  if (!username || !email || !password) {
    return res.status(400).json({ error: "Username, email, and password are required." });
  }

  const trimmedUsername = username.trim();
  const trimmedEmail = email.trim();

  // 1. Validation: Username length/characters
  if (trimmedUsername.length < 3) {
    return res.status(400).json({ error: "Username must be at least 3 characters long." });
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(trimmedUsername)) {
    return res.status(400).json({ error: "Username can only contain letters, numbers, underscores, and hyphens." });
  }

  // 2. Validation: Email format
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    return res.status(400).json({ error: "Please enter a valid email address." });
  }

  // 3. Validation: Password strength
  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters long." });
  }

  const db = readDb();
  const exists = db.users.find((u: any) => 
    u.username.toLowerCase() === trimmedUsername.toLowerCase() || 
    u.email.toLowerCase() === trimmedEmail.toLowerCase()
  );
  if (exists) {
    return res.status(400).json({ error: "Username or Email is already registered." });
  }

  // 4. Cryptographically secure password hashing
  const hashedPassword = bcrypt.hashSync(password, 10);

  const newUser = { 
    username: trimmedUsername, 
    email: trimmedEmail, 
    password: hashedPassword, 
    role: "client", 
    displayName: displayName?.trim() || trimmedUsername 
  };
  
  db.users.push(newUser);
  writeDb(db);

  // 5. Generate secure JWT token
  const token = jwt.sign(
    { 
      username: newUser.username, 
      email: newUser.email, 
      role: newUser.role, 
      displayName: newUser.displayName 
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.status(201).json({
    username: newUser.username,
    email: newUser.email,
    role: newUser.role,
    displayName: newUser.displayName,
    token
  });
});

// Get Database State
app.get("/api/db", (req, res) => {
  const db = readDb();
  // Strip passwords before returning
  const safeUsers = db.users.map(({ password, ...u }: any) => u);
  res.json({ ...db, users: safeUsers });
});

// Update Node Resources (Admin Only)
app.patch("/api/admin/node-resources", requireAdmin, (req, res) => {
  const { totalCpu, totalRam, totalDisk, nodeOvercommitRatio } = req.body;
  const db = readDb();
  if (totalCpu !== undefined) db.nodeResources.totalCpu = Number(totalCpu);
  if (totalRam !== undefined) db.nodeResources.totalRam = Number(totalRam);
  if (totalDisk !== undefined) db.nodeResources.totalDisk = Number(totalDisk);
  if (nodeOvercommitRatio !== undefined) db.nodeResources.nodeOvercommitRatio = Number(nodeOvercommitRatio);
  writeDb(db);
  res.json({ success: true, nodeResources: db.nodeResources });
});

// Admin User management APIs
app.get("/api/admin/users", requireAdmin, (req, res) => {
  const db = readDb();
  // Strip passwords before returning
  const safeUsers = db.users.map(({ password, ...u }: any) => u);
  res.json(safeUsers);
});

app.post("/api/admin/users", requireAdmin, (req, res) => {
  const { username, email, password, role, displayName } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ error: "Username, email and password are required." });
  }
  const db = readDb();
  const exists = db.users.find((u: any) => u.username.toLowerCase() === username.trim().toLowerCase() || u.email.toLowerCase() === email.trim().toLowerCase());
  if (exists) {
    return res.status(400).json({ error: "Username or Email already registered." });
  }
  const hashedPassword = bcrypt.hashSync(password, 10);
  const newUser = { username: username.trim(), email: email.trim(), password: hashedPassword, role: role || "client", displayName: displayName || username };
  db.users.push(newUser);
  writeDb(db);
  res.status(201).json({ username: newUser.username, email: newUser.email, role: newUser.role, displayName: newUser.displayName });
});

app.patch("/api/admin/users/:username", requireAdmin, (req, res) => {
  const { username } = req.params;
  const { email, password, role, displayName } = req.body;
  const db = readDb();
  const uIdx = db.users.findIndex((u: any) => u.username.toLowerCase() === username.toLowerCase());
  if (uIdx === -1) {
    return res.status(404).json({ error: "User not found." });
  }
  if (email !== undefined) db.users[uIdx].email = email;
  if (password !== undefined) db.users[uIdx].password = bcrypt.hashSync(password, 10);
  if (role !== undefined) db.users[uIdx].role = role;
  if (displayName !== undefined) db.users[uIdx].displayName = displayName;
  writeDb(db);
  res.json({ success: true, user: { username: db.users[uIdx].username, email: db.users[uIdx].email, role: db.users[uIdx].role, displayName: db.users[uIdx].displayName } });
});

app.delete("/api/admin/users/:username", requireAdmin, (req, res) => {
  const { username } = req.params;
  const db = readDb();
  db.users = db.users.filter((u: any) => u.username.toLowerCase() !== username.toLowerCase());
  writeDb(db);
  res.json({ success: true, message: `User ${username} deleted.` });
});

// Admin SQL Host management APIs
app.post("/api/admin/sql-hosts", requireAdmin, (req, res) => {
  const { name, host, port, driver, user, maxDbs, description } = req.body;
  if (!name || !host) {
    return res.status(400).json({ error: "Host name and IP address are required." });
  }
  const db = readDb();
  const newHost = {
    id: `host_${Date.now()}`,
    name,
    host,
    port: Number(port) || 3306,
    driver: driver || "mysql",
    user: user || "root",
    maxDbs: Number(maxDbs) || 50,
    description: description || ""
  };
  db.sqlHosts.push(newHost);
  writeDb(db);
  res.status(201).json(newHost);
});

app.delete("/api/admin/sql-hosts/:id", requireAdmin, (req, res) => {
  const { id } = req.params;
  const db = readDb();
  db.sqlHosts = db.sqlHosts.filter((h: any) => h.id !== id);
  writeDb(db);
  res.json({ success: true, message: "SQL Host deleted successfully." });
});

// Add Split Server Instance
app.post("/api/instances", (req, res) => {
  const { name, type, owner, cpuLimit, ramLimit, diskLimit, port } = req.body;
  if (!name) return res.status(400).json({ error: "Name is required" });

  const db = readDb();
  
  // Create instance
  const newInst = {
    id: `inst_${Date.now()}`,
    name,
    type,
    owner,
    cpuLimit: Number(cpuLimit) || 1,
    ramLimit: Number(ramLimit) || 2,
    diskLimit: Number(diskLimit) || 10,
    status: "installing",
    port: Number(port) || (Math.floor(Math.random() * 9000) + 10000)
  };

  db.instances.push(newInst);

  // Re-calculate resources
  const totalAllocCpu = db.instances.reduce((acc: number, item: any) => acc + item.cpuLimit, 0);
  const totalAllocRam = db.instances.reduce((acc: number, item: any) => acc + item.ramLimit, 0);
  const totalAllocDisk = db.instances.reduce((acc: number, item: any) => acc + item.diskLimit, 0);

  db.nodeResources.allocatedCpu = totalAllocCpu;
  db.nodeResources.allocatedRam = totalAllocRam;
  db.nodeResources.allocatedDisk = totalAllocDisk;

  writeDb(db);
  res.status(201).json(newInst);

  // Simulated auto-installation transition
  setTimeout(() => {
    const updatedDb = readDb();
    const instIdx = updatedDb.instances.findIndex((i: any) => i.id === newInst.id);
    if (instIdx !== -1) {
      updatedDb.instances[instIdx].status = "active";
      writeDb(updatedDb);
    }
  }, 4000);
});

// Delete Split Server Instance
app.delete("/api/instances/:id", (req, res) => {
  const { id } = req.params;
  const db = readDb();

  db.instances = db.instances.filter((i: any) => i.id !== id);

  // Re-calculate resources
  const totalAllocCpu = db.instances.reduce((acc: number, item: any) => acc + item.cpuLimit, 0);
  const totalAllocRam = db.instances.reduce((acc: number, item: any) => acc + item.ramLimit, 0);
  const totalAllocDisk = db.instances.reduce((acc: number, item: any) => acc + item.diskLimit, 0);

  db.nodeResources.allocatedCpu = totalAllocCpu;
  db.nodeResources.allocatedRam = totalAllocRam;
  db.nodeResources.allocatedDisk = totalAllocDisk;

  writeDb(db);
  res.json({ success: true, message: `Instance ${id} removed successfully.` });
});

// Log System Error
app.post("/api/errors", (req, res) => {
  const { type, message, severity } = req.body;
  const db = readDb();

  const newErr = {
    id: `err_${Date.now()}`,
    timestamp: new Date().toISOString(),
    type: type || "GENERIC",
    message: message || "An unknown system anomaly was logged",
    severity: severity || "warning",
    resolved: false
  };

  db.errors.push(newErr);
  writeDb(db);
  res.status(201).json(newErr);
});

// Resolve Error Log
app.post("/api/errors/:id/resolve", (req, res) => {
  const { id } = req.params;
  const db = readDb();
  
  const errIdx = db.errors.findIndex((e: any) => e.id === id);
  if (errIdx !== -1) {
    db.errors[errIdx].resolved = true;
    writeDb(db);
    return res.json({ success: true, error: db.errors[errIdx] });
  }
  res.status(404).json({ error: "Error log not found" });
});

// Submit / Log Host Resource Pressure
app.post("/api/pressure", (req, res) => {
  const { cpu, ram, disk, network } = req.body;
  const db = readDb();

  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  const newLog = {
    time: timeStr,
    cpu: Number(cpu) || 10,
    ram: Number(ram) || 20,
    disk: Number(disk) || 50,
    network: Number(network) || 5
  };

  db.pressureLogs.push(newLog);
  // Keep only the last 15 entries for performance
  if (db.pressureLogs.length > 15) {
    db.pressureLogs.shift();
  }

  writeDb(db);
  res.status(201).json(newLog);
});

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
  // Migrate plain text passwords to secure bcrypt hashes on startup
  try {
    const dbOnBoot = readDb();
    let updatedDb = false;
    if (dbOnBoot && dbOnBoot.users) {
      dbOnBoot.users.forEach((u: any) => {
        if (u.password && !u.password.startsWith("$2a$") && !u.password.startsWith("$2b$")) {
          u.password = bcrypt.hashSync(u.password, 10);
          updatedDb = true;
        }
      });
      if (updatedDb) {
        writeDb(dbOnBoot);
        console.log("[BIG SYSTEM AUTH] Legacy plain text user passwords successfully migrated to secure 10-round bcrypt hashes.");
      }
    }
  } catch (err) {
    console.error("[BIG SYSTEM AUTH] Migration of legacy passwords failed:", err);
  }

  // Robust production detection: check if NODE_ENV is "production" OR if we are running from the compiled server.cjs
  const isProd = process.env.NODE_ENV === "production" || __filename.endsWith("server.cjs");

  if (!isProd) {
    console.log("Starting server in DEVELOPMENT mode (Vite middleware)...");
    try {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } catch (err) {
      console.error("Failed to start Vite dev server, falling back to static files:", err);
      serveStaticFiles();
    }
  } else {
    console.log("Starting server in PRODUCTION mode...");
    serveStaticFiles();
  }

  function serveStaticFiles() {
    const distPath = path.join(process.cwd(), 'dist');
    console.log(`Serving static files from: ${distPath}`);
    
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      const indexPath = path.join(distPath, 'index.html');
      res.sendFile(indexPath, (err) => {
        if (err) {
          console.error(`Error sending index.html from ${indexPath}:`, err);
          res.status(500).send("500 Internal Server Error: Static build files are missing or unreadable. Please run 'npm run build' first.");
        }
      });
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
