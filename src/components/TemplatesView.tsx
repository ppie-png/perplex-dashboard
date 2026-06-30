import React, { useState } from "react";
import { 
  Download, 
  Search, 
  Cpu, 
  HardDrive, 
  Terminal, 
  Clock, 
  Check, 
  Layers, 
  Info, 
  Tag,
  Rocket,
  ArrowRight,
  Sparkles,
  Zap,
  Filter
} from "lucide-react";

interface TemplateItem {
  id: string;
  name: string;
  category: "games" | "bots" | "database" | "web" | "dev";
  description: string;
  version: string;
  requirements: {
    cpu: number;
    ram: number;
    disk: number;
  };
  variables: { key: string; label: string; placeholder: string; defaultValue: string; isSecret?: boolean }[];
  tags: string[];
  icon: string;
}

const TEMPLATES_LIST: TemplateItem[] = [
  {
    id: "tpl_minecraft_paper",
    name: "Paper Minecraft Server",
    category: "games",
    description: "Highly optimized Minecraft Java Edition server engine with full plugin compatibility, performance tweaks, and automated backup cycles pre-configured.",
    version: "1.20.4",
    requirements: { cpu: 2, ram: 4, disk: 15 },
    variables: [
      { key: "SERVER_NAME", label: "Server Motd & Name", placeholder: "survival-smp-01", defaultValue: "Perplex Host Minecraft Server" },
      { key: "MINECRAFT_VERSION", label: "Minecraft Core Version", placeholder: "1.20.4", defaultValue: "1.20.4" },
      { key: "MAX_PLAYERS", label: "Max Players Limit", placeholder: "20", defaultValue: "20" }
    ],
    tags: ["Minecraft", "Java", "PaperMC", "Gaming"],
    icon: "🎮"
  },
  {
    id: "tpl_discord_node",
    name: "Discord Bot (Node.js/TS)",
    category: "bots",
    description: "Complete boilerplate for Discord.js or Eris bots. Preloaded with Node v20 LTS, Git sync hook integration, and PM2 auto-restart configuration.",
    version: "v20.11.0",
    requirements: { cpu: 0.5, ram: 1, disk: 2 },
    variables: [
      { key: "BOT_TOKEN", label: "Discord Application Token", placeholder: "ghp_...", defaultValue: "", isSecret: true },
      { key: "CLIENT_ID", label: "Discord Client ID", placeholder: "12345678...", defaultValue: "" }
    ],
    tags: ["Node.js", "TypeScript", "DiscordJS", "Bot"],
    icon: "🤖"
  },
  {
    id: "tpl_bungeecord",
    name: "BungeeCord Proxy Router",
    category: "games",
    description: "Lightweight proxy server used to connect multiple Minecraft game servers together. Automatically isolates lobbies, survival, and mini-game modules.",
    version: "1.20.x",
    requirements: { cpu: 1, ram: 2, disk: 5 },
    variables: [
      { key: "MAX_PLAYERS", label: "Bungee Player Limit", placeholder: "100", defaultValue: "100" },
      { key: "CONNECTION_THROTTLE", label: "Connection Throttle Rate (ms)", placeholder: "4000", defaultValue: "4000" }
    ],
    tags: ["Minecraft", "Proxy", "Lobby", "BungeeMC"],
    icon: "🔌"
  },
  {
    id: "tpl_postgres",
    name: "PostgreSQL Database Stack",
    category: "database",
    description: "Enterprise relational database system. Includes pg_cron scheduling, automated pg_dump daily backup jobs, and custom security rules tailored for game servers.",
    version: "v16.2",
    requirements: { cpu: 2, ram: 4, disk: 25 },
    variables: [
      { key: "POSTGRES_DB", label: "Database Schema Name", placeholder: "perplex_db", defaultValue: "perplex_main" },
      { key: "POSTGRES_USER", label: "Database Admin User", placeholder: "postgres", defaultValue: "admin" },
      { key: "POSTGRES_PASSWORD", label: "Database Password", placeholder: "Enter strong password", defaultValue: "", isSecret: true }
    ],
    tags: ["PostgreSQL", "Database", "Relational", "SQL"],
    icon: "🗄️"
  },
  {
    id: "tpl_discord_python",
    name: "Python Discord Bot (discord.py)",
    category: "bots",
    description: "Production ready Python template utilizing discord.py v2.3. Preloaded with pip dependencies, SQLite configurations, and continuous loop cron jobs.",
    version: "v3.11.8",
    requirements: { cpu: 0.5, ram: 1, disk: 2 },
    variables: [
      { key: "DISCORD_TOKEN", label: "Discord Python Token", placeholder: "Enter classic bot token", defaultValue: "", isSecret: true },
      { key: "PREFIX", label: "Default Command Prefix", placeholder: "!", defaultValue: "!" }
    ],
    tags: ["Python", "discord.py", "Bots", "Scripting"],
    icon: "🐍"
  },
  {
    id: "tpl_nginx_static",
    name: "Nginx Web Hosting Server",
    category: "web",
    description: "A secure Nginx web gateway to host custom frontends, HTML landing pages, and static documentation portals. Includes Let's Encrypt SSL auto-renewal scripts.",
    version: "v1.24.0",
    requirements: { cpu: 1, ram: 1, disk: 5 },
    variables: [
      { key: "DOMAIN_NAME", label: "Target Domain Name", placeholder: "dashboard.yourdomain.com", defaultValue: "" }
    ],
    tags: ["Nginx", "Web Server", "HTML", "SSL"],
    icon: "🌐"
  }
];

export default function TemplatesView() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<"all" | "games" | "bots" | "database" | "web" | "dev">("all");
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateItem | null>(null);
  const [deployStep, setDeployStep] = useState<"idle" | "config" | "deploying" | "success">("idle");
  const [formVariables, setFormVariables] = useState<Record<string, string>>({});
  const [deployLogs, setDeployLogs] = useState<string[]>([]);
  const [deployedPort, setDeployedPort] = useState(25565);

  const filteredTemplates = TEMPLATES_LIST.filter(tpl => {
    const matchesSearch = tpl.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          tpl.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          tpl.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = activeCategory === "all" || tpl.category === activeCategory;
    
    return matchesSearch && matchesCategory;
  });

  const handleOpenDeploy = (tpl: TemplateItem) => {
    setSelectedTemplate(tpl);
    const initialVars: Record<string, string> = {};
    tpl.variables.forEach(v => {
      initialVars[v.key] = v.defaultValue;
    });
    setFormVariables(initialVars);
    setDeployStep("config");
  };

  const handleVariableChange = (key: string, val: string) => {
    setFormVariables(prev => ({
      ...prev,
      [key]: val
    }));
  };

  const handleStartDeploy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplate) return;

    setDeployStep("deploying");
    setDeployLogs(["[Template Deployer] Initiating template verification...", "✔ Target platform specifications OK."]);

    const logsList = [
      `[Docker] Allocating container network namespace: perplex-jail-${selectedTemplate.id}`,
      `[Server] Carving hardware limits (vCores: ${selectedTemplate.requirements.cpu}, RAM: ${selectedTemplate.requirements.ram}GB)`,
      "[Templates] Downloading core engine binary package...",
      "[Templates] Injecting environment startup variables...",
      "[File System] Setting up local directory configuration trees...",
      "[NPM / Pip] Installing core dependencies...",
      "[Docker] Launching isolated environment and exposing service port...",
      "✨ Template deployed successfully!"
    ];

    let delay = 600;
    logsList.forEach((line, idx) => {
      setTimeout(() => {
        setDeployLogs(prev => [...prev, line]);
        if (idx === logsList.length - 1) {
          const randomPort = Math.floor(Math.random() * 8000) + 20000;
          setDeployedPort(randomPort);
          setDeployStep("success");
        }
      }, delay);
      delay += 800;
    });
  };

  return (
    <div className="space-y-6" id="templates-marketplace-view">
      {/* Search Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Rocket className="h-5 w-5 text-indigo-400" />
              Pre-Configured Installation Templates
            </h3>
            <p className="text-xs text-slate-400 max-w-xl">
              Launch perfectly tuned games servers, script runtimes, bots, and databases instantly using official preconfigured template stacks.
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72 shrink-0">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input 
              type="text"
              placeholder="Search templates & tags..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500/50 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 outline-none"
            />
          </div>
        </div>

        {/* Categories Tab Selector */}
        <div className="flex items-center gap-1 mt-6 overflow-x-auto whitespace-nowrap border-t border-slate-800/60 pt-4">
          <button 
            onClick={() => setActiveCategory("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeCategory === "all" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <Filter className="h-3 w-3" /> All Stacks
          </button>
          <button 
            onClick={() => setActiveCategory("games")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeCategory === "games" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            🎮 Games
          </button>
          <button 
            onClick={() => setActiveCategory("bots")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeCategory === "bots" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            🤖 Bots
          </button>
          <button 
            onClick={() => setActiveCategory("database")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeCategory === "database" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            🗄️ Database
          </button>
          <button 
            onClick={() => setActiveCategory("web")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeCategory === "web" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            🌐 Web Services
          </button>
        </div>
      </div>

      {deployStep === "idle" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map(tpl => (
            <div 
              key={tpl.id}
              className="bg-slate-900 border border-slate-800 hover:border-indigo-500/30 rounded-2xl p-5 flex flex-col justify-between gap-5 hover:shadow-lg transition-all relative group"
            >
              <div className="space-y-3">
                {/* Icon & Version Header */}
                <div className="flex items-center justify-between">
                  <div className="text-3xl bg-slate-950 p-2 rounded-xl border border-slate-800 select-none">
                    {tpl.icon}
                  </div>
                  <span className="text-[10px] bg-slate-950 text-indigo-400 border border-indigo-500/10 font-mono font-extrabold px-2.5 py-0.5 rounded-full">
                    {tpl.version}
                  </span>
                </div>

                {/* Name & Desc */}
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-slate-100 group-hover:text-indigo-400 transition-colors">
                    {tpl.name}
                  </h4>
                  <p className="text-xs text-slate-400 leading-normal line-clamp-3">
                    {tpl.description}
                  </p>
                </div>

                {/* Requirements badges */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="bg-slate-950 text-[10px] text-slate-400 font-mono px-2 py-0.5 rounded border border-slate-800/80 flex items-center gap-1">
                    <Cpu className="h-3 w-3 text-amber-500" /> {tpl.requirements.cpu} vCores
                  </span>
                  <span className="bg-slate-950 text-[10px] text-slate-400 font-mono px-2 py-0.5 rounded border border-slate-800/80 flex items-center gap-1">
                    <Zap className="h-3 w-3 text-emerald-500" /> {tpl.requirements.ram}GB RAM
                  </span>
                  <span className="bg-slate-950 text-[10px] text-slate-400 font-mono px-2 py-0.5 rounded border border-slate-800/80 flex items-center gap-1">
                    <HardDrive className="h-3 w-3 text-sky-500" /> {tpl.requirements.disk}GB SSD
                  </span>
                </div>
              </div>

              {/* Action deploy footer bar */}
              <div className="border-t border-slate-800/60 pt-4 flex items-center justify-between">
                {/* tags */}
                <div className="flex flex-wrap items-center gap-1.5 max-w-[150px] overflow-hidden">
                  {tpl.tags.slice(0, 2).map((tg, i) => (
                    <span key={i} className="text-[9px] font-mono text-slate-500 bg-slate-950/60 px-1.5 py-0.5 rounded">
                      #{tg}
                    </span>
                  ))}
                </div>

                <button 
                  onClick={() => handleOpenDeploy(tpl)}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 group-hover:translate-x-0.5"
                >
                  Deploy
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}

          {filteredTemplates.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-500 border border-dashed border-slate-800 rounded-2xl">
              <Info className="h-8 w-8 text-slate-600 mx-auto mb-2" />
              <p className="text-xs">No installation templates found matching your filter criteria.</p>
            </div>
          )}
        </div>
      )}

      {/* Deployment Configuration Setup Form */}
      {deployStep === "config" && selectedTemplate && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-xl mx-auto space-y-5 animate-scaleUp">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-3">
              <span className="text-3xl bg-slate-950 p-1.5 rounded-lg border border-slate-800">
                {selectedTemplate.icon}
              </span>
              <div>
                <h4 className="text-sm font-bold text-slate-200">Configure {selectedTemplate.name}</h4>
                <p className="text-[10px] text-slate-400">Specify environment arguments and provision sizes.</p>
              </div>
            </div>
            <button 
              onClick={() => setDeployStep("idle")}
              className="text-slate-500 hover:text-slate-300 text-xs font-mono"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleStartDeploy} className="space-y-4 text-xs">
            {selectedTemplate.variables.map(v => (
              <div key={v.key} className="space-y-1.5">
                <label className="text-slate-400 font-semibold block">{v.label}</label>
                <input 
                  type={v.isSecret ? "password" : "text"}
                  placeholder={v.placeholder}
                  value={formVariables[v.key] || ""}
                  onChange={e => handleVariableChange(v.key, e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500/50 rounded-lg p-2.5 font-mono text-slate-200 outline-none"
                  required
                />
              </div>
            ))}

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-400">
                <Layers className="h-4 w-4" /> System Allocation Matrix
              </div>
              <p className="text-[10px] text-slate-500 leading-normal">
                This templates will provision a container and auto-deduct the following limits from your perplex node:
              </p>
              <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono font-semibold text-slate-300 pt-1">
                <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800/40">
                  <span className="text-amber-500 block text-[9px] uppercase font-bold">CPU Limit</span>
                  {selectedTemplate.requirements.cpu} vCores
                </div>
                <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800/40">
                  <span className="text-emerald-500 block text-[9px] uppercase font-bold">RAM Limit</span>
                  {selectedTemplate.requirements.ram} GB
                </div>
                <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800/40">
                  <span className="text-sky-500 block text-[9px] uppercase font-bold">Disk Space</span>
                  {selectedTemplate.requirements.disk} GB
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Rocket className="h-4 w-4 animate-bounce" />
              Instantly Provision Template
            </button>
          </form>
        </div>
      )}

      {/* Deployment Progress Visualizer logs Terminal */}
      {deployStep === "deploying" && (
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 max-w-xl mx-auto space-y-4 animate-scaleUp">
          <div className="flex items-center justify-between border-b border-slate-900 pb-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
              <Terminal className="h-4 w-4 text-indigo-400" /> Template Deployment Stream
            </div>
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-indigo-500 animate-ping"></span>
              <span className="text-[10px] text-slate-500 font-mono">INSTALLING</span>
            </div>
          </div>

          <div className="bg-slate-900 p-4 rounded-xl font-mono text-[10px] text-indigo-300 space-y-1.5 h-64 overflow-y-auto scrollbar-thin">
            {deployLogs.map((log, index) => (
              <div key={index} className="flex items-start gap-1">
                <span className="text-slate-600 select-none">[{index + 1}]</span>
                <span>{log}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Success deployment panel screen */}
      {deployStep === "success" && selectedTemplate && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-xl mx-auto text-center space-y-5 animate-fadeIn">
          <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-3xl">
            ✨
          </div>
          
          <div className="space-y-1.5">
            <h4 className="font-extrabold text-base text-slate-100">Template Installed successfully!</h4>
            <p className="text-xs text-slate-400">
              Your template configuration for <strong className="text-slate-200">{selectedTemplate.name}</strong> was provisioned in record time.
            </p>
          </div>

          {/* Allocation Details */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 text-xs font-mono text-left space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Service URL / IP:</span>
              <span className="text-emerald-400 font-bold">142.250.200.35:{deployedPort}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Service Status:</span>
              <span className="bg-emerald-500/10 text-emerald-400 text-[10px] px-2 py-0.5 rounded font-bold uppercase">Active & Online</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Exposed isolated port:</span>
              <span className="text-slate-300 font-bold">{deployedPort}</span>
            </div>
          </div>

          <button
            onClick={() => setDeployStep("idle")}
            className="w-full bg-slate-950 hover:bg-slate-850 text-slate-300 hover:text-white border border-slate-800 font-bold py-2 rounded-xl transition-all cursor-pointer"
          >
            Return to templates list
          </button>
        </div>
      )}
    </div>
  );
}
