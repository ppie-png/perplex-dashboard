import React, { useState, useEffect, useRef } from "react";
import { 
  Terminal, FolderOpen, Search, Database, 
  Settings, HardDrive, Sparkles, Server, Copy, Check,
  Play, RotateCcw, Square, ExternalLink, ShieldAlert,
  Layers, Rocket, Lock, User, Cpu, Shield, Activity, 
  LogOut, AlertTriangle, CheckCircle, Sliders, Menu, X
} from "lucide-react";

import { 
  ServerStatus, ServerStats, ConsoleMessage, 
  FileItem, PluginItem, DatabaseItem, BackupItem, ServerProperty 
} from "./types";

import ConsoleView from "./components/ConsoleView";
import FileManagerView from "./components/FileManagerView";
import PluginMarketplaceView from "./components/PluginMarketplaceView";
import DatabaseView from "./components/DatabaseView";
import BackupView from "./components/BackupView";
import SettingsView from "./components/SettingsView";
import CopilotView from "./components/CopilotView";
import LinuxDeploymentView from "./components/LinuxDeploymentView";
import ServerSplitterView from "./components/ServerSplitterView";
import TemplatesView from "./components/TemplatesView";
import HostMetricsView from "./components/HostMetricsView";

// Hardcoded mock data definitions
const DEFAULT_FILES: FileItem[] = [
  { name: "server.properties", type: "file", size: "1.4 KB", lastModified: "June 29, 2026", content: `# Minecraft server properties\ndifficulty=easy\npvp=true\ngamemode=survival\nmax-players=20\nwhite-list=false\nview-distance=10\nmotd=A Minecraft Server Hosted on CraftHost` },
  { name: "spigot.yml", type: "file", size: "3.2 KB", lastModified: "June 28, 2026", content: `# Spigot configuration file\nsettings:\n  save-user-cache-on-stop-only: false\n  bungeecord: false\nworld-settings:\n  default:\n    verbose: false\n    mob-spawn-range: 6` },
  { name: "bukkit.yml", type: "file", size: "1.1 KB", lastModified: "June 28, 2026", content: `# Bukkit configuration file\nsettings:\n  allow-end: true\n  warn-on-overload: true\nspawn-limits:\n  monsters: 70\n  animals: 10\n  water-animals: 15\n  ambient: 15` },
  { name: "whitelist.json", type: "file", size: "0.1 KB", lastModified: "June 28, 2026", content: `[\n  {\n    "uuid": "854ef243-7fdf-4993-979a-e89c629fb462",\n    "name": "Steve"\n  }\n]` },
  { name: "ops.json", type: "file", size: "0.1 KB", lastModified: "June 28, 2026", content: `[\n  {\n    "uuid": "d0e1b643-2940-4293-8b7a-f88c520fb232",\n    "name": "Alex",\n    "level": 4,\n    "bypassesPlayerLimit": false\n  }\n]` },
  { name: "logs/latest.log", type: "file", size: "2.1 KB", lastModified: "Just now", content: `[05:10:00] [Server thread/INFO]: Starting minecraft server version 1.20.4\n[05:10:01] [Server thread/INFO]: Loading properties\n[05:10:01] [Server thread/INFO]: Default game type: SURVIVAL\n[05:10:03] [Server thread/INFO]: Done (4.81s)! For help, type "help"` },
  { name: "plugins/Essentials/config.yml", type: "file", size: "12.8 KB", lastModified: "June 28, 2026", content: `# EssentialsX configuration\nops-name-color: '4'\nnickname-prefix: '~'\nmax-nick-length: 15\nteleport-cooldown: 0\nteleport-delay: 0` }
];

const DEFAULT_PLUGINS: PluginItem[] = [
  { id: "luckperms", name: "LuckPerms", description: "An advanced permissions plugin with a clean web editor interface.", version: "5.4.102", category: "Security", installed: true, author: "Luck", downloads: "2.8M" },
  { id: "essentialsx", name: "EssentialsX", description: "Provides over 130 core commands and utilities for player lobbies, economies, and warps.", version: "2.20.1", category: "Admin", installed: true, author: "EssentialsX Team", downloads: "6.1M" },
  { id: "worldedit", name: "WorldEdit", description: "In-game Minecraft map editor and builder brush. Perform complex terrain operations.", version: "7.2.15", category: "World", installed: true, author: "EngineHub", downloads: "9.3M" },
  { id: "geysermc", name: "GeyserMC", description: "Enables Bedrock client connections to Java servers, enabling absolute cross-play.", version: "2.2.0", category: "Developer", installed: false, author: "GeyserMC", downloads: "850K" },
  { id: "vault", name: "Vault", description: "A secure economy API integration for permissions, chat, and bank operations.", version: "1.7.3", category: "Developer", installed: false, author: "MilkBowl", downloads: "4.4M" },
  { id: "clearlag", name: "Clearlag", description: "Optimizes server TPS by sweeping unnecessary floor items and scheduling entity wipes.", version: "3.2.2", category: "Optimization", installed: false, author: "bobcat00", downloads: "1.9M" }
];

const DEFAULT_BACKUPS: BackupItem[] = [
  { id: "bk_1", name: "world-backup-20260629.zip", date: "6/29/2026 04:00 AM", size: "42.8 MB", status: "completed" },
  { id: "bk_2", name: "world-backup-20260628.zip", date: "6/28/2026 04:00 AM", size: "41.5 MB", status: "completed" }
];

const DEFAULT_PROPERTIES: ServerProperty[] = [
  { key: "gamemode", value: "survival", defaultValue: "survival", description: "The default game mode (survival, creative, adventure, spectator) for players joining.", type: "string" },
  { key: "difficulty", value: "easy", defaultValue: "easy", description: "The difficulty setting (peaceful, easy, normal, hard) for survival parameters.", type: "string" },
  { key: "pvp", value: "true", defaultValue: "true", description: "Allows or prohibits player-versus-player combat.", type: "boolean" },
  { key: "white-list", value: "false", defaultValue: "false", description: "Enables or disables standard whitelisting of authorized access.", type: "boolean" },
  { key: "max-players", value: "20", defaultValue: "20", description: "The absolute maximum number of concurrent online players.", type: "number" },
  { key: "view-distance", value: "10", defaultValue: "10", description: "The chunk render radius configured on the server side.", type: "number" },
  { key: "motd", value: "A Minecraft Server Hosted on CraftHost", defaultValue: "A Minecraft Server", description: "Message of the Day shown in the multiplayer server browser selection.", type: "string" }
];

const SIMULATED_USERNAMES = [
  "Steve", "Alex", "GamerPro99", "Notch", "Herobrine", "Dream", 
  "Skeppy", "Technoblade", "CaptainSparklez", "DanTDM", "Stampy", 
  "MinecraftGal", "CreepCrusher", "RedstoneWiz", "PVP_God"
];

let idCounter = 0;
const generateId = (prefix: string = "id"): string => {
  idCounter += 1;
  return `${prefix}_${Date.now()}_${idCounter}_${Math.random().toString(36).substring(2, 9)}`;
};

interface SessionUser {
  username: string;
  role: string;
  displayName: string;
  token: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<
    "console" | "files" | "plugins" | "databases" | "backups" | "settings" | "copilot" | "deploy" | "splitter" | "templates" | "metrics"
  >("console");
  const [status, setStatus] = useState<ServerStatus>("online");
  const [copiedIp, setCopiedIp] = useState(false);

  // Mobile navigation trigger
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Secure User Session
  const [session, setSession] = useState<SessionUser | null>(() => {
    const cached = localStorage.getItem("craft_session");
    return cached ? JSON.parse(cached) : null;
  });

  // DB Sync State for persistent error logging and node indicators
  const [dbData, setDbData] = useState<{
    instances: any[];
    errors: any[];
    pressureLogs: any[];
    nodeResources: any;
  } | null>(null);

  // Login Screen states
  const [loginUser, setLoginUser] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Core database states
  const [logs, setLogs] = useState<ConsoleMessage[]>([]);
  const [stats, setStats] = useState<ServerStats>({
    cpu: 18.5,
    ramUsed: 2.65,
    ramMax: 4.0,
    diskUsed: 12.4,
    diskMax: 20.0,
    networkIn: 0.1,
    networkOut: 0.2,
    playersOnline: 4,
    playersMax: 20
  });

  const statsRef = useRef<ServerStats>(stats);
  useEffect(() => {
    statsRef.current = stats;
  }, [stats]);

  const [files, setFiles] = useState<FileItem[]>(DEFAULT_FILES);
  const [plugins, setPlugins] = useState<PluginItem[]>(DEFAULT_PLUGINS);
  const [databases, setDatabases] = useState<DatabaseItem[]>([]);
  const [backups, setBackups] = useState<BackupItem[]>(DEFAULT_BACKUPS);
  const [properties, setProperties] = useState<ServerProperty[]>(DEFAULT_PROPERTIES);

  // Scroll Parallax Moving Background Listener
  useEffect(() => {
    const handleScroll = () => {
      const scrollPercentY = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight || 1);
      const scrollPercentX = window.scrollX / (document.documentElement.scrollWidth - window.innerWidth || 1);
      document.documentElement.style.setProperty('--scroll-y', `${scrollPercentY * 100}%`);
      document.documentElement.style.setProperty('--scroll-x', `${scrollPercentX * 100}%`);
    };
    
    // Also track mouse movement on window for ambient kinetic parallax shift
    const handleMouseMove = (e: MouseEvent) => {
      const xPercent = e.clientX / window.innerWidth;
      const yPercent = e.clientY / window.innerHeight;
      document.documentElement.style.setProperty('--scroll-x', `${50 + (xPercent - 0.5) * 15}%`);
      document.documentElement.style.setProperty('--scroll-y', `${50 + (yPercent - 0.5) * 15}%`);
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // Sync DB state
  const syncDatabase = async () => {
    try {
      const res = await fetch("/api/db");
      if (res.ok) {
        const data = await res.json();
        setDbData(data);
      }
    } catch (err) {
      console.error("Error syncing server-side DB:", err);
    }
  };

  useEffect(() => {
    if (session) {
      syncDatabase();
      const interval = setInterval(syncDatabase, 4000);
      return () => clearInterval(interval);
    }
  }, [session]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    if (!loginUser.trim() || !loginPass.trim()) {
      setLoginError("Please fill out both credentials.");
      return;
    }

    setLoginLoading(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginUser, password: loginPass })
      });

      if (res.ok) {
        const sessionData = await res.json();
        setSession(sessionData);
        localStorage.setItem("craft_session", JSON.stringify(sessionData));
      } else {
        const err = await res.json();
        setLoginError(err.error || "Authentication failed.");
      }
    } catch (err) {
      setLoginError("Failed to connect to the panel backend.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogOut = () => {
    setSession(null);
    localStorage.removeItem("craft_session");
  };

  // Initialize logs on boot
  useEffect(() => {
    const initialLogs: ConsoleMessage[] = [
      { id: "log_1", timestamp: "05:10:00", type: "info", line: "Starting minecraft server version 1.20.4" },
      { id: "log_2", timestamp: "05:10:01", type: "info", line: "Loading properties" },
      { id: "log_3", timestamp: "05:10:01", type: "info", line: "Default game type: SURVIVAL" },
      { id: "log_4", timestamp: "05:10:02", type: "info", line: "Generating keypair" },
      { id: "log_5", timestamp: "05:10:02", type: "info", line: "Starting Minecraft server on 142.250.200.35:25565" },
      { id: "log_6", timestamp: "05:10:03", type: "info", line: "Preparing level \"world\"" },
      { id: "log_7", timestamp: "05:10:04", type: "info", line: "Preparing spawn area: 0%... 48%... 96%..." },
      { id: "log_8", timestamp: "05:10:05", type: "info", line: "Done (4.81s)! For help, type \"help\"" },
      { id: "log_9", timestamp: "05:10:05", type: "success", line: "[LuckPerms] Enabling LuckPerms v5.4.102" },
      { id: "log_10", timestamp: "05:10:06", type: "info", line: "[LuckPerms] Connected to SQLite database successfully." },
      { id: "log_11", timestamp: "05:10:06", type: "success", line: "[EssentialsX] Enabling Essentials v2.20.1" },
      { id: "log_12", timestamp: "05:10:07", type: "success", line: "[WorldEdit] Enabling WorldEdit v7.2.15" },
      { id: "log_13", timestamp: "05:10:12", type: "info", line: "GamerPro99 joined the game" },
      { id: "log_14", timestamp: "05:11:05", type: "info", line: "Steve joined the game" },
      { id: "log_15", timestamp: "05:12:30", type: "info", line: "Alex joined the game" },
      { id: "log_16", timestamp: "05:13:42", type: "info", line: "RedstoneWiz joined the game" }
    ];
    setLogs(initialLogs);
  }, []);

  // Real-time server statistics and player join/leave simulation
  useEffect(() => {
    if (status !== "online") return;

    const statsInterval = setInterval(() => {
      setStats(prev => {
        // Random CPU fluctuations (spike slightly occasionally)
        const cpuChange = (Math.random() - 0.5) * 8;
        const newCpu = Math.max(8.0, Math.min(85.0, prev.cpu + cpuChange));

        // Slow memory drift (based on player counts)
        const memoryOffset = prev.playersOnline * 0.05;
        const ramDrift = (Math.random() - 0.5) * 0.05;
        const newRam = Math.max(1.8, Math.min(prev.ramMax - 0.2, 2.2 + memoryOffset + ramDrift));

        // Network activity spikes
        const newNetIn = Math.max(0.01, Math.min(2.5, prev.networkIn + (Math.random() - 0.5) * 0.1));
        const newNetOut = Math.max(0.02, Math.min(4.8, prev.networkOut + (Math.random() - 0.5) * 0.2));

        return {
          ...prev,
          cpu: newCpu,
          ramUsed: newRam,
          networkIn: newNetIn,
          networkOut: newNetOut
        };
      });
    }, 2000);

    // Player Join/Leave Simulator (triggers every 35 seconds randomly)
    const playerInterval = setInterval(() => {
      const currentStats = statsRef.current;
      const joinChance = Math.random() > 0.4; // 60% chance of join, 40% chance of leave
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      if (joinChance && currentStats.playersOnline < currentStats.playersMax) {
        // Find player who is not online
        const randomName = SIMULATED_USERNAMES[Math.floor(Math.random() * SIMULATED_USERNAMES.length)];
        
        setLogs(prevLogs => [
          ...prevLogs,
          {
            id: generateId("player_join"),
            timestamp: timeStr,
            type: "info",
            line: `${randomName} joined the game`
          }
        ]);

        setStats(prev => ({ ...prev, playersOnline: prev.playersOnline + 1 }));
      } else if (!joinChance && currentStats.playersOnline > 0) {
        // Player left
        const activeOnlineNames = ["Steve", "Alex", "GamerPro99", "RedstoneWiz", "Technoblade", "Dream"];
        const leaveName = activeOnlineNames[Math.floor(Math.random() * activeOnlineNames.length)];
        
        setLogs(prevLogs => [
          ...prevLogs,
          {
            id: generateId("player_leave"),
            timestamp: timeStr,
            type: "info",
            line: `${leaveName} left the game`
          }
        ]);

        setStats(prev => ({ ...prev, playersOnline: prev.playersOnline - 1 }));
      }
    }, 35000);

    return () => {
      clearInterval(statsInterval);
      clearInterval(playerInterval);
    };
  }, [status]);

  // Copy IP command helper
  const handleCopyIp = () => {
    navigator.clipboard.writeText("142.250.200.35:25565");
    setCopiedIp(true);
    setTimeout(() => setCopiedIp(false), 2000);
  };

  // State machine power controllers
  const handlePowerAction = (action: 'start' | 'stop' | 'restart' | 'kill') => {
    const timeStr = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    if (action === "kill") {
      setStatus("offline");
      setStats(prev => ({ ...prev, cpu: 0, ramUsed: 0, networkIn: 0, networkOut: 0, playersOnline: 0 }));
      setLogs(prev => [
        ...prev,
        { id: generateId("kill_log"), timestamp: timeStr(), type: "error", line: "⚠️ Server process terminated abruptly (Forced Kill)." }
      ]);
      return;
    }

    if (action === "stop") {
      setStatus("stopping");
      
      const stopLogs = [
        "Stopping the server gracefully...",
        "Saving players & flushing user profiles...",
        "Saving worlds (level files and dimensions)...",
        "Disabling plugins...",
        "[LuckPerms] Disabling plugin LuckPerms",
        "[EssentialsX] Disabling plugin EssentialsX",
        "[WorldEdit] Disabling plugin WorldEdit",
        "Server closed successfully."
      ];

      let delay = 0;
      stopLogs.forEach((line, idx) => {
        setTimeout(() => {
          setLogs(prev => [
            ...prev,
            { id: generateId(`stop_${idx}`), timestamp: timeStr(), type: idx === 0 || idx === 7 ? "warn" : "info", line }
          ]);
          if (idx === stopLogs.length - 1) {
            setStatus("offline");
            setStats(prev => ({ ...prev, cpu: 0, ramUsed: 0, networkIn: 0, networkOut: 0, playersOnline: 0 }));
          }
        }, delay);
        delay += 600;
      });
    }

    if (action === "start") {
      setStatus("starting");
      setLogs([]); // Clear terminal for fresh boot
      
      const startSteps = [
        "Starting minecraft server version 1.20.4 (Java 17.0.8)",
        "Loading server properties...",
        `Default game mode: ${properties.find(p => p.key === "gamemode")?.value.toUpperCase() || "SURVIVAL"}`,
        `PvP status: ${properties.find(p => p.key === "pvp")?.value.toUpperCase() || "TRUE"}`,
        "Generating internal keypair...",
        "Starting Minecraft server engine on *:25565",
        "Loading level \"world\"...",
        "Preparing spawn area: 0%...",
        "Preparing spawn area: 42%...",
        "Preparing spawn area: 85%...",
        "Done (3.42s)! For help, type \"help\" or \"?\"",
        "[LuckPerms] Enabling LuckPerms v5.4.102",
        "[LuckPerms] Local SQLite database connection initiated.",
        "[Essentials] Enabling Essentials v2.20.1",
        "[WorldEdit] Enabling WorldEdit v7.2.15"
      ];

      let delay = 0;
      startSteps.forEach((line, idx) => {
        setTimeout(() => {
          setLogs(prev => [
            ...prev,
            { 
              id: generateId(`start_${idx}`), 
              timestamp: timeStr(), 
              type: line.includes("Enabling") ? "success" : "info", 
              line 
            }
          ]);
          if (idx === startSteps.length - 1) {
            setStatus("online");
            setStats(prev => ({
              ...prev,
              cpu: 15.2,
              ramUsed: 2.1,
              playersOnline: 0
            }));
          }
        }, delay);
        delay += 500;
      });
    }

    if (action === "restart") {
      handlePowerAction("stop");
      setTimeout(() => {
        handlePowerAction("start");
      }, 5500);
    }
  };

  // Commands terminal input override
  const handleSendCommand = (command: string) => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const cleanCmd = command.trim();

    // Log the typed command
    setLogs(prev => [...prev, { id: generateId("cmd"), timestamp: timeStr, type: "command", line: `> ${cleanCmd}` }]);

    setTimeout(() => {
      const parts = cleanCmd.split(" ");
      const root = parts[0].toLowerCase();

      switch (root) {
        case "/help":
        case "help":
          setLogs(prev => [
            ...prev,
            { id: generateId("help"), timestamp: timeStr, type: "info", line: "=== Panel Terminal Help ===" },
            { id: generateId("help_1"), timestamp: timeStr, type: "info", line: "Commands available: /op <player>, /deop <player>, /stop, /say <text>, /plugins, /whitelist, /list, /clear" }
          ]);
          break;
        case "/op":
          const player = parts[1] || "operator";
          setLogs(prev => [
            ...prev,
            { id: generateId("op"), timestamp: timeStr, type: "success", line: `Made ${player} a server operator.` }
          ]);
          break;
        case "/deop":
          const deopPlayer = parts[1] || "operator";
          setLogs(prev => [
            ...prev,
            { id: generateId("deop"), timestamp: timeStr, type: "warn", line: `Demoted ${deopPlayer} from server operator.` }
          ]);
          break;
        case "/stop":
          handlePowerAction("stop");
          break;
        case "/say":
          const sayMsg = parts.slice(1).join(" ");
          setLogs(prev => [
            ...prev,
            { id: generateId("say"), timestamp: timeStr, type: "info", line: `[Server] ${sayMsg || "Hello everyone!"}` }
          ]);
          break;
        case "/plugins":
        case "/pl":
          const listStr = plugins.filter(p => p.installed).map(p => p.name).join(", ");
          setLogs(prev => [
            ...prev,
            { id: generateId("plugins"), timestamp: timeStr, type: "info", line: `Plugins (${plugins.filter(p => p.installed).length}): ${listStr}` }
          ]);
          break;
        case "/list":
          setLogs(prev => [
            ...prev,
            { id: generateId("list"), timestamp: timeStr, type: "info", line: `There are ${stats.playersOnline} of ${stats.playersMax} players online.` }
          ]);
          break;
        case "/whitelist":
          const action = parts[1]?.toLowerCase();
          const target = parts[2] || "steve";
          if (action === "add") {
            setLogs(prev => [...prev, { id: generateId("wl_add"), timestamp: timeStr, type: "success", line: `Added ${target} to the whitelist.` }]);
          } else if (action === "remove") {
            setLogs(prev => [...prev, { id: generateId("wl_remove"), timestamp: timeStr, type: "warn", line: `Removed ${target} from the whitelist.` }]);
          } else {
            setLogs(prev => [...prev, { id: generateId("wl_info"), timestamp: timeStr, type: "info", line: "Whitelist commands: /whitelist add <player>, /whitelist remove <player>" }]);
          }
          break;
        case "clear":
        case "/clear":
          setLogs([]);
          break;
        default:
          setLogs(prev => [
            ...prev,
            { id: generateId("err"), timestamp: timeStr, type: "error", line: `Unknown command "${root}". Type "help" or "/help" for help.` }
          ]);
      }
    }, 200);
  };

  // FileManager callbacks
  const handleSaveFile = (fileName: string, content: string) => {
    setFiles(prev => prev.map(f => f.name === fileName ? { ...f, content } : f));
    
    // If user edited server.properties, parse variables and sync with Properties tab
    if (fileName === "server.properties") {
      const updatedProps = [...properties];
      const lines = content.split("\n");
      lines.forEach(line => {
        if (line.startsWith("#") || !line.includes("=")) return;
        const [key, value] = line.split("=");
        const cleanKey = key.trim();
        const cleanVal = value.trim();

        const pIdx = updatedProps.findIndex(p => p.key === cleanKey);
        if (pIdx > -1) {
          updatedProps[pIdx].value = cleanVal;
        }
      });
      setProperties(updatedProps);
    }
  };

  const handleDeleteFile = (fileName: string) => {
    setFiles(prev => prev.filter(f => f.name !== fileName));
  };

  const handleCreateFile = (fileName: string, content: string) => {
    const timestamp = new Date();
    const dateStr = timestamp.toLocaleDateString() + " " + timestamp.toLocaleTimeString();
    
    setFiles(prev => [
      ...prev,
      {
        name: fileName,
        type: "file",
        size: "0.2 KB",
        lastModified: dateStr,
        content
      }
    ]);
  };

  // Plugins callbacks
  const handleInstallPlugin = (pluginId: string) => {
    setPlugins(prev => prev.map(p => p.id === pluginId ? { ...p, installed: true } : p));
    const target = plugins.find(p => p.id === pluginId);
    
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs(prev => [
      ...prev,
      { id: generateId("pl_install"), timestamp: timeStr, type: "success", line: `[Panel] Plugin ${target?.name || pluginId} installed successfully to /plugins/ folder.` },
      { id: generateId("pl_warn"), timestamp: timeStr, type: "warn", line: `[Panel] Please reload or restart the server to enable ${target?.name || pluginId}.` }
    ]);

    // Create default config folder / files visually in File Manager
    const defaultConfPath = `plugins/${target?.name || pluginId}/config.yml`;
    handleCreateFile(defaultConfPath, `# Configuration file for ${target?.name || pluginId}\nenabled: true\n# Autogenerated upon panel marketplace install.`);
  };

  const handleUninstallPlugin = (pluginId: string) => {
    setPlugins(prev => prev.map(p => p.id === pluginId ? { ...p, installed: false } : p));
    const target = plugins.find(p => p.id === pluginId);

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs(prev => [
      ...prev,
      { id: generateId("pl_uninstall"), timestamp: timeStr, type: "error", line: `[Panel] Uninstalled plugin ${target?.name || pluginId}.` }
    ]);
    
    // Clean up virtual config file
    const defaultConfPath = `plugins/${target?.name || pluginId}/config.yml`;
    handleDeleteFile(defaultConfPath);
  };

  // Databases callbacks
  const handleCreateDatabase = (name: string, username: string) => {
    const idStr = generateId("db_item");
    const dbItem: DatabaseItem = {
      id: idStr,
      name,
      username,
      host: "db-eu-west2.crafthost.internal",
      size: "0 B",
      status: "active"
    };
    setDatabases(prev => [...prev, dbItem]);

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs(prev => [
      ...prev,
      { id: generateId("db_log"), timestamp: timeStr, type: "success", line: `[Panel] Created MySQL database instance "${name}" successfully.` }
    ]);
  };

  const handleDeleteDatabase = (id: string) => {
    const target = databases.find(d => d.id === id);
    setDatabases(prev => prev.filter(d => d.id !== id));

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs(prev => [
      ...prev,
      { id: generateId("db_del"), timestamp: timeStr, type: "warn", line: `[Panel] Destroyed MySQL database instance "${target?.name || id}".` }
    ]);
  };

  // Backups callbacks
  const handleCreateBackup = (newBackup: BackupItem) => {
    setBackups(prev => [newBackup, ...prev]);
    
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs(prev => [
      ...prev,
      { id: generateId("bk_log"), timestamp: timeStr, type: "success", line: `[Backup] Created world snapshot file "${newBackup.name}" successfully.` }
    ]);
  };

  const handleDeleteBackup = (id: string) => {
    setBackups(prev => prev.filter(b => b.id !== id));
  };

  // Settings callbacks (server.properties)
  const handleSaveProperties = (updatedProperties: ServerProperty[]) => {
    setProperties(updatedProperties);
    
    // Sync back to files state (modify server.properties text content)
    let propertiesContent = "# Minecraft server properties\n# Updated via visual configuration settings panel\n";
    updatedProperties.forEach(p => {
      propertiesContent += `${p.key}=${p.value}\n`;
    });

    setFiles(prev => prev.map(f => f.name === "server.properties" ? { ...f, content: propertiesContent } : f));

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs(prev => [
      ...prev,
      { id: generateId("prop_save"), timestamp: timeStr, type: "info", line: "[Config] Visual settings saved to server.properties. Restart is pending." }
    ]);
  };

  return (
    <div className="min-h-screen bg-[#120c2b] text-slate-100 flex flex-col antialiased relative overflow-x-hidden">
      {/* Ambient Moving Nebula Background */}
      <div className="scrolling-nebula" />

      {/* SECURE CYBERPUNK LOGIN SCREEN */}
      {!session ? (
        <div className="flex-1 min-h-screen flex items-center justify-center p-4 relative z-10 select-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl animate-pulse"></div>
          
          <div className="w-full max-w-md bg-slate-900/80 border border-violet-500/30 rounded-3xl p-8 shadow-neon-purple-lg backdrop-blur-md space-y-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-600 via-purple-500 to-indigo-600 animate-pulse"></div>
            
            <div className="text-center space-y-1">
              <div className="inline-flex p-3 bg-purple-500/10 border border-purple-500/25 text-purple-400 rounded-2xl mb-2">
                <Shield className="h-6 w-6 text-purple-400 animate-pulse" />
              </div>
              <h2 className="text-xl font-extrabold tracking-tight text-white flex items-center justify-center gap-2">
                Perplex Panel <span className="text-[10px] bg-purple-500/20 text-purple-300 font-mono px-2 py-0.5 rounded border border-purple-500/30">SECURE v2.5</span>
              </h2>
              <p className="text-xs text-slate-400">Authenticating connection to panel.unstableuniverse.world</p>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-slate-300 font-bold block uppercase tracking-wider">Email Address / User</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-purple-400/60" />
                  <input 
                    type="text"
                    required
                    placeholder="e.g. admin@unstableuniverse.world"
                    value={loginUser}
                    onChange={e => setLoginUser(e.target.value)}
                    className="w-full bg-slate-950/60 border border-violet-900 focus:border-purple-500/50 rounded-xl pl-10 pr-4 py-3 text-slate-200 outline-none text-xs transition-all font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-bold block uppercase tracking-wider">Secret Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-purple-400/60" />
                  <input 
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={loginPass}
                    onChange={e => setLoginPass(e.target.value)}
                    className="w-full bg-slate-950/60 border border-violet-900 focus:border-purple-500/50 rounded-xl pl-10 pr-4 py-3 text-slate-200 outline-none text-xs transition-all font-mono"
                  />
                </div>
              </div>

              {loginError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-[10px] flex items-start gap-1.5 leading-normal">
                  <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-red-400" />
                  <span>{loginError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-xl transition-all shadow-neon-purple shrink-0 flex items-center justify-center gap-2 cursor-pointer text-xs disabled:opacity-50"
              >
                {loginLoading ? (
                  <span>Accessing Node Securely...</span>
                ) : (
                  <>
                    <Lock className="h-4 w-4" />
                    <span>Authorize Login & Mount</span>
                  </>
                )}
              </button>
            </form>

            <div className="border-t border-violet-950/60 pt-4 text-[10px] text-slate-400 space-y-2 leading-relaxed">
              <span className="font-bold text-purple-400 block uppercase tracking-wide text-[9px]">Demo Sign-In credentials:</span>
              <div className="flex justify-between items-center bg-slate-950/40 p-2.5 rounded-lg border border-violet-900/30 font-mono">
                <div>
                  <div className="text-slate-300">Admin Email:</div>
                  <strong className="text-purple-300">admin@unstableuniverse.world</strong>
                  <div className="text-slate-500 mt-1">Pass: <span className="text-slate-400">adminpassword</span></div>
                </div>
                <div className="text-right border-l border-violet-950/40 pl-3">
                  <div className="text-slate-300">Client Email:</div>
                  <strong className="text-indigo-300">client@unstableuniverse.world</strong>
                  <div className="text-slate-500 mt-1">Pass: <span className="text-slate-400">clientpassword</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* FULL REMODELED SIDE-BY-SIDE SIDEBAR LAYOUT (PELICAN AESTHETIC) */
        <div className="flex-1 flex flex-col lg:flex-row relative z-10 min-h-screen">
          
          {/* Mobile Header bar */}
          <div className="lg:hidden bg-slate-950 border-b border-violet-950/40 p-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-purple-600 rounded-lg">
                <Server className="h-4 w-4 text-white" />
              </div>
              <span className="font-extrabold text-sm tracking-tight text-white">Perplex Panel</span>
            </div>
            <button 
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              className="p-2 bg-slate-900 hover:bg-slate-850 rounded border border-violet-950 text-slate-300"
            >
              {mobileSidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>

          {/* LEFT SIDEBAR (MAIN SORTED PANEL HUB) */}
          <aside className={`
            ${mobileSidebarOpen ? "block" : "hidden"} 
            lg:block w-full lg:w-72 bg-[#160f35]/85 border-b lg:border-b-0 lg:border-r border-violet-500/20 p-5 shrink-0 flex flex-col justify-between overflow-y-auto backdrop-blur-md z-30 shadow-2xl
          `}>
            <div className="space-y-6">
              {/* Profile & Node Header */}
              <div className="flex items-center gap-3 border-b border-violet-950/40 pb-5">
                <div className="p-2.5 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl shadow-lg flex items-center justify-center">
                  <Shield className="h-5 w-5 text-white animate-pulse" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-mono font-extrabold text-white truncate">{session.displayName}</h4>
                  <p className="text-[10px] text-purple-400 uppercase font-bold tracking-wider">{session.role} Account</p>
                </div>
              </div>

              {/* Sidebar Navigation Blocks */}
              <nav className="space-y-5 text-xs">
                
                {/* Section: Main Server Panel */}
                <div className="space-y-1">
                  <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest pl-2">Server Management</span>
                  
                  <button
                    onClick={() => { setActiveTab("console"); setMobileSidebarOpen(false); }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl font-bold transition-all cursor-pointer ${
                      activeTab === "console" 
                        ? "bg-purple-900/30 text-purple-200 border-l-2 border-purple-500" 
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
                    }`}
                  >
                    <Terminal className="h-4 w-4 shrink-0 text-purple-400" />
                    <span>Terminal Console</span>
                  </button>

                  <button
                    onClick={() => { setActiveTab("files"); setMobileSidebarOpen(false); }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl font-bold transition-all cursor-pointer ${
                      activeTab === "files" 
                        ? "bg-purple-900/30 text-purple-200 border-l-2 border-purple-500" 
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
                    }`}
                  >
                    <FolderOpen className="h-4 w-4 shrink-0 text-purple-400" />
                    <span>File Manager</span>
                  </button>

                  <button
                    onClick={() => { setActiveTab("plugins"); setMobileSidebarOpen(false); }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl font-bold transition-all cursor-pointer ${
                      activeTab === "plugins" 
                        ? "bg-purple-900/30 text-purple-200 border-l-2 border-purple-500" 
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
                    }`}
                  >
                    <Search className="h-4 w-4 shrink-0 text-purple-400" />
                    <span>Plugin Marketplace</span>
                  </button>

                  <button
                    onClick={() => { setActiveTab("databases"); setMobileSidebarOpen(false); }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl font-bold transition-all cursor-pointer ${
                      activeTab === "databases" 
                        ? "bg-purple-900/30 text-purple-200 border-l-2 border-purple-500" 
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
                    }`}
                  >
                    <Database className="h-4 w-4 shrink-0 text-purple-400" />
                    <span>Database Hub</span>
                  </button>

                  <button
                    onClick={() => { setActiveTab("backups"); setMobileSidebarOpen(false); }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl font-bold transition-all cursor-pointer ${
                      activeTab === "backups" 
                        ? "bg-purple-900/30 text-purple-200 border-l-2 border-purple-500" 
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
                    }`}
                  >
                    <HardDrive className="h-4 w-4 shrink-0 text-purple-400" />
                    <span>Backups & Saves</span>
                  </button>

                  <button
                    onClick={() => { setActiveTab("settings"); setMobileSidebarOpen(false); }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl font-bold transition-all cursor-pointer ${
                      activeTab === "settings" 
                        ? "bg-purple-900/30 text-purple-200 border-l-2 border-purple-500" 
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
                    }`}
                  >
                    <Settings className="h-4 w-4 shrink-0 text-purple-400" />
                    <span>Config Properties</span>
                  </button>
                </div>

                {/* Section: Virtualization */}
                <div className="space-y-1">
                  <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest pl-2">Virtualization Core</span>
                  
                  <button
                    onClick={() => { setActiveTab("splitter"); setMobileSidebarOpen(false); }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl font-bold transition-all cursor-pointer ${
                      activeTab === "splitter" 
                        ? "bg-purple-900/30 text-purple-200 border-l-2 border-purple-500" 
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
                    }`}
                  >
                    <Layers className="h-4 w-4 shrink-0 text-purple-400" />
                    <div className="flex items-center justify-between w-full">
                      <span>Server Splitter</span>
                      {session.role === "admin" && (
                        <span className="text-[7px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1 rounded uppercase">Root</span>
                      )}
                    </div>
                  </button>

                  <button
                    onClick={() => { setActiveTab("templates"); setMobileSidebarOpen(false); }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl font-bold transition-all cursor-pointer ${
                      activeTab === "templates" 
                        ? "bg-purple-900/30 text-purple-200 border-l-2 border-purple-500" 
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
                    }`}
                  >
                    <Rocket className="h-4 w-4 shrink-0 text-purple-400" />
                    <span>Engine Templates</span>
                  </button>
                </div>

                {/* Section: Host Administration */}
                <div className="space-y-1">
                  <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest pl-2">Infrastructure & Logs</span>
                  
                  <button
                    onClick={() => { setActiveTab("metrics"); setMobileSidebarOpen(false); }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl font-bold transition-all cursor-pointer ${
                      activeTab === "metrics" 
                        ? "bg-purple-900/30 text-purple-200 border-l-2 border-purple-500" 
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
                    }`}
                  >
                    <Activity className="h-4 w-4 shrink-0 text-purple-400" />
                    <div className="flex items-center justify-between w-full">
                      <span>Host Metrics & DB</span>
                      {dbData && dbData.errors?.filter(e => !e.resolved).length > 0 && (
                        <span className="text-[8px] bg-red-500 text-white font-mono px-1.5 py-0.2 rounded-full font-extrabold animate-pulse">
                          {dbData.errors.filter(e => !e.resolved).length}
                        </span>
                      )}
                    </div>
                  </button>

                  <button
                    onClick={() => { setActiveTab("deploy"); setMobileSidebarOpen(false); }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl font-bold transition-all cursor-pointer ${
                      activeTab === "deploy" 
                        ? "bg-purple-900/30 text-purple-200 border-l-2 border-purple-500" 
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
                    }`}
                  >
                    <Server className="h-4 w-4 shrink-0 text-purple-400" />
                    <span>Linux Deployment</span>
                  </button>
                </div>

                {/* Section: AI Companion */}
                <div className="space-y-1">
                  <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest pl-2">AI Services</span>
                  
                  <button
                    onClick={() => { setActiveTab("copilot"); setMobileSidebarOpen(false); }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl font-bold transition-all cursor-pointer ${
                      activeTab === "copilot" 
                        ? "bg-purple-900/30 text-purple-200 border-l-2 border-purple-500" 
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
                    }`}
                  >
                    <Sparkles className="h-4 w-4 shrink-0 text-purple-400 animate-pulse" />
                    <span className="flex items-center gap-1.5">
                      <span>AI CraftPilot</span>
                      <span className="text-[7px] bg-indigo-500/10 text-indigo-300 px-1 rounded font-mono font-bold">GPT</span>
                    </span>
                  </button>
                </div>

              </nav>
            </div>

            {/* User Log-Out Footer bar */}
            <div className="mt-6 pt-4 border-t border-violet-950/40 flex flex-col gap-3">
              {dbData && (
                <div className="p-3 bg-slate-900/50 rounded-xl border border-violet-950/40 text-[10px] space-y-2 font-mono text-slate-400">
                  <div className="flex justify-between">
                    <span>Active Splits:</span>
                    <strong className="text-purple-300">{dbData.instances?.length || 0}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Host Memory:</span>
                    <strong className="text-purple-300">{(dbData.nodeResources?.allocatedRam || 38)}/64 GB</strong>
                  </div>
                </div>
              )}
              
              <button 
                onClick={handleLogOut}
                className="w-full bg-slate-900 hover:bg-rose-950/40 border border-violet-950/40 hover:border-rose-950/70 text-slate-300 hover:text-rose-400 rounded-xl py-2 px-3 font-bold flex items-center justify-center gap-2 transition-all cursor-pointer text-xs"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out Panel</span>
              </button>
            </div>
          </aside>

          {/* MAIN WORKSPACE WRAPPER (PANEL VIEW CANVAS) */}
          <div className="flex-1 flex flex-col min-h-screen overflow-y-auto">
            
            {/* Top Workspace Navbar */}
            <header className="bg-slate-950/40 border-b border-violet-950/20 p-4 shrink-0 sticky top-0 backdrop-blur-md z-20">
              <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <h2 className="text-base font-extrabold text-white tracking-tight flex items-center gap-2">
                    Master Cluster Instance
                    <span className="text-[10px] bg-purple-500/10 text-purple-400 font-mono font-extrabold px-2 py-0.5 rounded border border-purple-500/20 uppercase">
                      unstableuniverse.world
                    </span>
                  </h2>
                  <p className="text-[10px] text-slate-400 font-medium">Node Location: <strong className="text-slate-300">node-01.perplex.host</strong></p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {/* IP address widget */}
                  <div className="flex items-center gap-2.5 bg-slate-950/80 border border-violet-950/40 rounded-xl px-3 py-1.5 shadow-inner">
                    <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Address:</span>
                    <span className="font-mono text-xs font-bold text-purple-300">panel.unstableuniverse.world</span>
                    <button 
                      onClick={handleCopyIp}
                      className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-purple-300 transition-all cursor-pointer"
                    >
                      {copiedIp ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>

                  {/* Node health/status bubble */}
                  <div className="flex items-center gap-2 bg-slate-950/50 border border-violet-950/30 rounded-full px-3 py-1.5">
                    <span className={`h-2 w-2 rounded-full animate-pulse ${
                      status === "online" ? "bg-emerald-400" :
                      status === "starting" ? "bg-amber-400" : "bg-rose-500"
                    }`}></span>
                    <span className="text-[10px] uppercase font-mono tracking-widest text-slate-300 font-bold">{status}</span>
                  </div>
                </div>
              </div>
            </header>

            {/* Workspace Canvas Inner Panel */}
            <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
              
              <div className="flex-1 animate-fadeIn bg-transparent" id="tab-canvas-window">
                {activeTab === "console" && (
                  <ConsoleView 
                    status={status}
                    stats={stats}
                    logs={logs}
                    onPowerAction={handlePowerAction}
                    onSendCommand={handleSendCommand}
                  />
                )}

                {activeTab === "files" && (
                  <FileManagerView 
                    files={files}
                    onSaveFile={handleSaveFile}
                    onDeleteFile={handleDeleteFile}
                    onCreateFile={handleCreateFile}
                  />
                )}

                {activeTab === "plugins" && (
                  <PluginMarketplaceView 
                    plugins={plugins}
                    onInstallPlugin={handleInstallPlugin}
                    onUninstallPlugin={handleUninstallPlugin}
                  />
                )}

                {activeTab === "databases" && (
                  <DatabaseView 
                    databases={databases}
                    onCreateDatabase={handleCreateDatabase}
                    onDeleteDatabase={handleDeleteDatabase}
                  />
                )}

                {activeTab === "backups" && (
                  <BackupView 
                    backups={backups}
                    onCreateBackup={handleCreateBackup}
                    onDeleteBackup={handleDeleteBackup}
                  />
                )}

                {activeTab === "settings" && (
                  <SettingsView 
                    properties={properties}
                    onSaveProperties={handleSaveProperties}
                  />
                )}

                {activeTab === "copilot" && (
                  <CopilotView 
                    logs={logs}
                    properties={properties}
                  />
                )}

                {activeTab === "deploy" && (
                  <LinuxDeploymentView />
                )}

                {activeTab === "splitter" && (
                  <ServerSplitterView userRole={session.role} username={session.username} />
                )}

                {activeTab === "templates" && (
                  <TemplatesView />
                )}

                {activeTab === "metrics" && (
                  <HostMetricsView userRole={session.role} />
                )}
              </div>
            </main>

            {/* Unified App Footer */}
            <footer className="bg-slate-950/50 border-t border-violet-950/20 py-4 text-center text-xs text-slate-500 shrink-0 mt-auto">
              <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-2">
                <p>© 2026 Perplex Panel Host. Operating securely on unstableuniverse.world.</p>
                <p className="flex items-center gap-1.5">
                  Cluster Orchestration: 
                  <span className="text-purple-400 font-semibold flex items-center gap-1">
                    Node Master <Sparkles className="h-3 w-3 text-amber-400 animate-pulse" />
                  </span>
                </p>
              </div>
            </footer>
          </div>
          
        </div>
      )}
    </div>
  );
}
