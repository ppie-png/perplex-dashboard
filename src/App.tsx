import React, { useState, useEffect, useRef } from "react";
import { 
  Terminal, FolderOpen, Search, Database, 
  Settings, HardDrive, Sparkles, Server, Copy, Check,
  Play, RotateCcw, Square, ExternalLink, ShieldAlert,
  Layers, Rocket
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

export default function App() {
  const [activeTab, setActiveTab] = useState<"console" | "files" | "plugins" | "databases" | "backups" | "settings" | "copilot" | "deploy" | "splitter" | "templates">("console");
  const [status, setStatus] = useState<ServerStatus>("online");
  const [copiedIp, setCopiedIp] = useState(false);

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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased">
      {/* Top Navbar */}
      <header className="bg-slate-900 border-b border-slate-800 shrink-0 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3 select-none">
            <div className="p-2.5 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-900/20">
              <Server className="h-5 w-5 text-white animate-pulse" />
            </div>
            <div>
              <h1 className="text-base font-extrabold tracking-tight text-slate-100 flex items-center gap-2">
                CraftHost Panel
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-bold px-2 py-0.5 rounded-full font-mono uppercase">PRO</span>
              </h1>
              <p className="text-[10px] text-slate-400 font-medium">Next-Generation Game Server Console</p>
            </div>
          </div>

          {/* Quick Info & IP */}
          <div className="flex items-center gap-4">
            {/* Server IP Card */}
            <div className="hidden sm:flex items-center gap-3 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 shadow-inner">
              <div className="text-right">
                <p className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">Server Address</p>
                <p className="font-mono text-xs font-extrabold text-emerald-400">142.250.200.35:25565</p>
              </div>
              <button
                onClick={handleCopyIp}
                className="p-1.5 hover:bg-slate-800/80 rounded-lg text-slate-400 hover:text-slate-100 transition-all cursor-pointer"
                title="Copy Server Connection IP"
              >
                {copiedIp ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>

            {/* Quick Status Light */}
            <div className="flex items-center gap-2 bg-slate-950/60 border border-slate-800 rounded-full px-3 py-1.5">
              <span className={`h-2.5 w-2.5 rounded-full animate-pulse ${
                status === "online" ? "bg-emerald-500" :
                status === "starting" ? "bg-amber-500" :
                status === "stopping" ? "bg-orange-500" : "bg-rose-500"
              }`}></span>
              <span className="text-xs uppercase font-mono tracking-wider font-extrabold hidden md:inline text-slate-300">
                {status}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Dashboard Panel Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
        
        {/* Navigation Selector Tabs Bar */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-2 flex flex-wrap gap-1 shadow-sm shrink-0" id="dashboard-navigation-tabs">
          <button
            onClick={() => setActiveTab("console")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-semibold transition-all cursor-pointer ${
              activeTab === "console" 
                ? "bg-slate-800 text-white shadow-md border-b-2 border-emerald-500" 
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/30"
            }`}
          >
            <Terminal className="h-4 w-4" />
            Console
          </button>

          <button
            onClick={() => setActiveTab("files")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-semibold transition-all cursor-pointer ${
              activeTab === "files" 
                ? "bg-slate-800 text-white shadow-md border-b-2 border-emerald-500" 
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/30"
            }`}
          >
            <FolderOpen className="h-4 w-4" />
            Files
          </button>

          <button
            onClick={() => setActiveTab("plugins")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-semibold transition-all cursor-pointer ${
              activeTab === "plugins" 
                ? "bg-slate-800 text-white shadow-md border-b-2 border-emerald-500" 
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/30"
            }`}
          >
            <Search className="h-4 w-4" />
            Plugins
          </button>

          <button
            onClick={() => setActiveTab("databases")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-semibold transition-all cursor-pointer ${
              activeTab === "databases" 
                ? "bg-slate-800 text-white shadow-md border-b-2 border-emerald-500" 
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/30"
            }`}
          >
            <Database className="h-4 w-4" />
            Databases
          </button>

          <button
            onClick={() => setActiveTab("backups")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-semibold transition-all cursor-pointer ${
              activeTab === "backups" 
                ? "bg-slate-800 text-white shadow-md border-b-2 border-emerald-500" 
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/30"
            }`}
          >
            <HardDrive className="h-4 w-4" />
            Backups
          </button>

          <button
            onClick={() => setActiveTab("settings")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-semibold transition-all cursor-pointer ${
              activeTab === "settings" 
                ? "bg-slate-800 text-white shadow-md border-b-2 border-emerald-500" 
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/30"
            }`}
          >
            <Settings className="h-4 w-4" />
            Properties
          </button>

          <button
            onClick={() => setActiveTab("deploy")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-semibold transition-all cursor-pointer ${
              activeTab === "deploy" 
                ? "bg-slate-800 text-white shadow-md border-b-2 border-emerald-500" 
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/30"
            }`}
          >
            <Server className="h-4 w-4 text-indigo-400" />
            Linux Deploy
          </button>

          <button
            onClick={() => setActiveTab("splitter")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-semibold transition-all cursor-pointer ${
              activeTab === "splitter" 
                ? "bg-slate-800 text-white shadow-md border-b-2 border-emerald-500" 
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/30"
            }`}
          >
            <Layers className="h-4 w-4 text-emerald-400" />
            Server Splitter
          </button>

          <button
            onClick={() => setActiveTab("templates")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-semibold transition-all cursor-pointer ${
              activeTab === "templates" 
                ? "bg-slate-800 text-white shadow-md border-b-2 border-emerald-500" 
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/30"
            }`}
          >
            <Rocket className="h-4 w-4 text-indigo-400 animate-pulse" />
            Templates
          </button>

          <div className="flex-1"></div>

          {/* AI Copilot Tab Trigger */}
          <button
            onClick={() => setActiveTab("copilot")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs md:text-sm font-extrabold tracking-tight transition-all cursor-pointer bg-gradient-to-r relative group overflow-hidden ${
              activeTab === "copilot"
                ? "from-emerald-500 to-indigo-600 text-white shadow-lg shadow-emerald-500/20"
                : "from-slate-900 to-slate-900 border border-slate-800 text-slate-300 hover:text-white"
            }`}
          >
            <Sparkles className={`h-4 w-4 text-amber-400 group-hover:animate-bounce ${activeTab === 'copilot' ? 'animate-pulse' : ''}`} />
            <span>AI Copilot</span>
            <span className="text-[8px] bg-amber-400 text-slate-950 px-1 py-0.5 rounded ml-1 font-mono font-bold">NEW</span>
          </button>
        </div>

        {/* Tab Content Canvas with transition fades */}
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
            <ServerSplitterView />
          )}

          {activeTab === "templates" && (
            <TemplatesView />
          )}
        </div>
      </main>

      {/* App Footer */}
      <footer className="bg-slate-950/80 border-t border-slate-900 py-4 text-center text-xs text-slate-500 shrink-0">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-2">
          <p>© 2026 CraftHost Panel. All rights and systems reserved.</p>
          <p className="flex items-center gap-1.5">
            Powered by 
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              Gemini 3.5 <Sparkles className="h-3 w-3 fill-current text-amber-400" />
            </span>
          </p>
        </div>
      </footer>
    </div>
  );
}
