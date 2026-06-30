import React, { useState } from "react";
import { 
  Terminal, ShieldCheck, Settings, Copy, Check, 
  Cpu, HardDrive, Sparkles, Server, CheckCircle2,
  RefreshCw, ListCollapse, ArrowRight, Layers, HelpCircle
} from "lucide-react";

export default function LinuxDeploymentView() {
  const [activeSubTab, setActiveSubTab] = useState<"installer" | "systemd" | "aikar" | "pterodactyl" | "custom_panel">("pterodactyl");
  const [distro, setDistro] = useState<"ubuntu" | "rhel">("ubuntu");
  const [javaVersion, setJavaVersion] = useState<"17" | "21">("21");
  const [serverJar, setServerJar] = useState<"paper" | "purpur">("paper");
  
  // systemd state
  const [sysUser, setSysUser] = useState("minecraft");
  const [sysPath, setSysPath] = useState("/opt/minecraft/server");
  const [sysAutoRestart, setSysAutoRestart] = useState(true);
  
  // Aikar state
  const [allocatedRam, setAllocatedRam] = useState<number>(4);
  const [serverEngine, setServerEngine] = useState<"paper" | "velocity" | "bungee">("paper");
  
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [troubleshootTab, setTroubleshootTab] = useState<"composer_missing" | "missing_extensions" | "no_such_dir" | "laravel_500" | "cf_1033" | "cf_service_stale" | "db_error" | "redis_error" | "nginx_error">("nginx_error");
  const [isSimulatingSetup, setIsSimulatingSetup] = useState(false);
  const [simulationLogs, setSimulationLogs] = useState<string[]>([]);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Generate automated bash installation script
  const getInstallerScript = () => {
    const jarUrl = serverJar === "paper" 
      ? "https://api.papermc.io/v2/projects/paper/versions/1.20.4/builds/352/downloads/paper-1.20.4-352.jar"
      : "https://api.purpurmc.org/v2/purpur/1.20.4/latest/download";
    
    const javaInstallCmd = distro === "ubuntu"
      ? `sudo apt update\nsudo apt install -y openjdk-${javaVersion}-jre-headless screen ufw curl`
      : `sudo dnf check-update\nsudo dnf install -y java-${javaVersion}-openjdk-headless screen ufw curl`;

    return `#!/bin/bash
# CraftHost Auto-Generated Linux Minecraft Installer
# Target OS: ${distro === "ubuntu" ? "Ubuntu/Debian" : "RHEL/Rocky/Alma Linux"}
# Java Runtime: JDK ${javaVersion}
# Engine Type: ${serverJar.toUpperCase()}

echo "🚀 Starting Minecraft Server installation on Linux..."

# 1. Update systems and install dependencies
echo "📦 Installing Java ${javaVersion} and required system utilities..."
${javaInstallCmd}

# 2. Create optimized Minecraft system user & Directories
echo "👤 Setting up Minecraft system operator group..."
sudo groupadd -r minecraft || true
sudo useradd -r -g minecraft -d /opt/minecraft -s /bin/bash minecraft || true
sudo mkdir -p /opt/minecraft/server
sudo chown -R minecraft:minecraft /opt/minecraft

# 3. Download Server binaries
echo "📥 Fetching server engine core binary..."
cd /opt/minecraft/server
sudo curl -L -o server.jar "${jarUrl}"

# 4. Create and accept EULA
echo "eula=true" | sudo tee eula.txt > /dev/null

# 5. Open Default Ports in Firewall
echo "🔥 Configuring Firewall rules..."
sudo ufw allow 25565/tcp
sudo ufw allow 25565/udp
sudo ufw reload

# 6. Set correct file ownership
sudo chown -R minecraft:minecraft /opt/minecraft/server

echo "✅ Server setup complete!"
echo "💡 To run the server manually in background screen session, execute:"
echo "   sudo -u minecraft screen -S mc-server java -Xms2G -Xmx${allocatedRam}G -jar server.jar nogui"`;
  };

  // Generate optimized systemd system file
  const getSystemdConfig = () => {
    const minRam = Math.max(1, allocatedRam - 1);
    const flags = getAikarFlagsOnly();
    return `[Unit]
Description=Minecraft Server: Creative & Survival Daemon
After=network.target

[Service]
User=${sysUser}
Group=${sysUser}
WorkingDirectory=${sysPath}
Type=simple

# Execute with Aikar's optimized Garbage Collection Flags
ExecStart=/usr/bin/java -Xms${minRam}G -Xmx${allocatedRam}G ${flags} -jar server.jar nogui

${sysAutoRestart ? "Restart=on-failure\nRestartSec=20s" : "Restart=no"}
LimitNOFILE=65536

[Install]
WantedBy=multi-user.target`;
  };

  // Generate Aikar's flags based on memory configuration
  const getAikarFlagsOnly = () => {
    if (serverEngine === "velocity") {
      return "-XX:+UseG1GC -XX:G1ReservePercent=15 -XX:MaxGCPauseMillis=50 -XX:+UseNUMA -XX:+AlwaysPreTouch";
    }
    if (serverEngine === "bungee") {
      return "-XX:+UseG1GC -XX:MaxGCPauseMillis=50 -XX:+AlwaysPreTouch";
    }
    
    // Default paper/spigot flags
    if (allocatedRam >= 12) {
      return "-XX:+UseG1GC -XX:+ParallelRefProcEnabled -XX:MaxGCPauseMillis=200 -XX:+UnlockExperimentalVMOptions -XX:+AlwaysPreTouch -XX:+DisableExplicitGC -XX:G1NewSizePercent=40 -XX:G1MaxNewSizePercent=50 -XX:G1HeapRegionSize=16m -XX:G1ReservePercent=15 -XX:G1HeapWastePercent=5 -XX:G1MixedGCCountTarget=4 -XX:InitiatingHeapOccupancyPercent=20 -XX:G1MixedGCLiveThresholdPercent=90 -XX:SurvivingRatio=8 -XX:+UseNUMA";
    } else {
      return "-XX:+UseG1GC -XX:+ParallelRefProcEnabled -XX:MaxGCPauseMillis=200 -XX:+UnlockExperimentalVMOptions -XX:+AlwaysPreTouch -XX:+DisableExplicitGC -XX:G1NewSizePercent=30 -XX:G1MaxNewSizePercent=40 -XX:G1HeapRegionSize=8m -XX:G1ReservePercent=20 -XX:G1HeapWastePercent=5 -XX:G1MixedGCCountTarget=8 -XX:InitiatingHeapOccupancyPercent=15 -XX:G1MixedGCLiveThresholdPercent=90 -XX:SurvivingRatio=8 -XX:+UseNUMA";
    }
  };

  const getFullAikarCommand = () => {
    const minRam = Math.max(1, allocatedRam - 1);
    const flags = getAikarFlagsOnly();
    return `java -Xms${minRam}G -Xmx${allocatedRam}G ${flags} -jar server.jar nogui`;
  };

  // Run the animated interactive installation console simulator
  const runInstallationSimulation = () => {
    if (isSimulatingSetup) return;
    setIsSimulatingSetup(true);
    setSimulationLogs([]);

    const steps = [
      `[root@crafthost-vps ~]# curl -sSL https://crafthost.panel/install.sh | bash`,
      `🔧 Initializing CraftHost Linux Deploy engine...`,
      `🔍 Target OS Detected: Linux Ubuntu 22.04.3 LTS (GNU/Linux 5.15.0-x86_64)`,
      `📦 Updating package registry index... (apt-get update)`,
      `📥 Fetching openjdk-${javaVersion}-jre-headless binary and screen utility...`,
      `⚙️ JDK ${javaVersion} successfully installed. Checking java version:`,
      `   openjdk version "1.21.0" 2026-09-15\n   OpenJDK Runtime Environment (build 21+35)\n   OpenJDK 64-Bit Server VM`,
      `👤 Creating dedicated minecraft-operator systems group...`,
      `👤 Provisioning local daemon user: minecraft`,
      `📁 Allocating server assets at ${sysPath}...`,
      `📥 Fetching optimized ${serverJar.toUpperCase()} core from remote repository...`,
      `🌍 Initializing eula.txt parameters and accepting license constraints...`,
      `🔥 Injecting firewall allowances on tcp/udp port 25565...`,
      `⚡ Applying Aikar's high-performance Garbage Collection configurations...`,
      `🎉 Minecraft daemon installation completed successfully!`,
      `💡 Server is configured to autostart via systemd on subsequent boot routines.`,
      `[root@crafthost-vps ~]# systemctl start minecraft && systemctl status minecraft`,
      `● minecraft.service - Minecraft Server Daemon\n   Loaded: loaded (/etc/systemd/system/minecraft.service; enabled; vendor preset: enabled)\n   Active: active (running) since Tue 2026-06-30 05:25:01 UTC; 3s ago\n   Main PID: 4205 (java)`
    ];

    let delay = 0;
    steps.forEach((log, index) => {
      setTimeout(() => {
        setSimulationLogs(prev => [...prev, log]);
        if (index === steps.length - 1) {
          setIsSimulatingSetup(false);
        }
      }, delay);
      delay += Math.random() * 400 + 400; // Realistic delay range
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full text-slate-100" id="linux-deployment-view">
      {/* Settings Navigation Column */}
      <div className="lg:col-span-1 bg-slate-900/40 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between" id="deploy-sidebar">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-indigo-400 animate-pulse" />
            <h3 className="text-sm font-extrabold text-slate-200">Linux Deploy Engine</h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Configure, optimize, and bundle your Minecraft instances to deploy directly onto Linux VPS/Dedicated systems.
          </p>

          {/* Subtabs selectors */}
          <div className="space-y-1.5 pt-2" id="deploy-subtabs">
            <button
              onClick={() => setActiveSubTab("pterodactyl")}
              className={`w-full text-left p-3 rounded-xl border text-xs font-semibold transition-all flex items-center gap-2.5 cursor-pointer ${
                activeSubTab === "pterodactyl"
                  ? "bg-emerald-600/10 border-emerald-500/30 text-emerald-400"
                  : "bg-slate-950/40 border-slate-800/80 hover:border-slate-700 text-slate-300"
              }`}
            >
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              Pterodactyl & Cloudflare Setup
            </button>
            <button
              onClick={() => setActiveSubTab("installer")}
              className={`w-full text-left p-3 rounded-xl border text-xs font-semibold transition-all flex items-center gap-2.5 cursor-pointer ${
                activeSubTab === "installer"
                  ? "bg-indigo-600/10 border-indigo-500/30 text-indigo-400"
                  : "bg-slate-950/40 border-slate-800/80 hover:border-slate-700 text-slate-300"
              }`}
            >
              <Terminal className="h-4 w-4" />
              Automated Installer
            </button>
            <button
              onClick={() => setActiveSubTab("systemd")}
              className={`w-full text-left p-3 rounded-xl border text-xs font-semibold transition-all flex items-center gap-2.5 cursor-pointer ${
                activeSubTab === "systemd"
                  ? "bg-indigo-600/10 border-indigo-500/30 text-indigo-400"
                  : "bg-slate-950/40 border-slate-800/80 hover:border-slate-700 text-slate-300"
              }`}
            >
              <Settings className="h-4 w-4" />
              systemd Daemon Builder
            </button>
            <button
              onClick={() => setActiveSubTab("aikar")}
              className={`w-full text-left p-3 rounded-xl border text-xs font-semibold transition-all flex items-center gap-2.5 cursor-pointer ${
                activeSubTab === "aikar"
                  ? "bg-indigo-600/10 border-indigo-500/30 text-indigo-400"
                  : "bg-slate-950/40 border-slate-800/80 hover:border-slate-700 text-slate-300"
              }`}
            >
              <Sparkles className="h-4 w-4 text-amber-400" />
              Aikar's GC Optimizer
            </button>
            <button
              onClick={() => setActiveSubTab("custom_panel")}
              className={`w-full text-left p-3 rounded-xl border text-xs font-semibold transition-all flex items-center gap-2.5 cursor-pointer ${
                activeSubTab === "custom_panel"
                  ? "bg-rose-600/10 border-rose-500/30 text-rose-400 font-bold border-rose-500/20"
                  : "bg-slate-950/40 border-slate-800/80 hover:border-slate-700 text-slate-300"
              }`}
            >
              <Sparkles className="h-4 w-4 text-rose-400 animate-pulse" />
              🚀 Deploy This Panel UI
            </button>
          </div>
        </div>

        {/* Linux Compatibility Banner */}
        <div className="border-t border-slate-800/80 pt-4 mt-4">
          <div className="bg-slate-950 border border-slate-800/85 rounded-xl p-3 flex items-start gap-2.5">
            <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Distro Native</span>
              <p className="text-[10px] text-slate-500 leading-normal">
                Generates native packages compatible with Ubuntu, Debian, CentOS, and Rocky Linux.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Display Console */}
      <div className="lg:col-span-3 flex flex-col bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative min-h-[550px]" id="deploy-display-console">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-slate-900 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded bg-indigo-500/10 text-indigo-400">
              <Server className="h-4 w-4 animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-mono">LINUX ENVIRONMENTS</span>
              <h4 className="text-sm font-bold text-slate-200 leading-tight">
                {activeSubTab === "pterodactyl" ? "Pterodactyl Panel & Cloudflare Tunnel Production Setup" :
                 activeSubTab === "installer" ? "Debian/Ubuntu Automated Installer Script" : 
                 activeSubTab === "systemd" ? "systemd Background Daemon Configuration" : 
                 activeSubTab === "aikar" ? "JVM Garbage Collection & Memory Tuner" :
                 "Deploy & Run This Beautiful Custom Panel UI on Kali Linux"}
              </h4>
            </div>
          </div>
          <span className="text-[10px] bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full text-indigo-400 font-mono font-bold uppercase">
            CROSS-PLAY
          </span>
        </div>

        {/* Dynamic Canvas Area */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-slate-950/80" id="deploy-canvas-body">
          
          {/* 0. PTERODACTYL & CLOUDFLARE SETUP */}
          {activeSubTab === "pterodactyl" && (
            <div className="space-y-6 animate-fadeIn">
              {/* Overview banner */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400">
                  <ShieldCheck className="h-5 w-5 animate-pulse" />
                  <h5 className="font-bold text-sm text-slate-100">Kali Linux Pterodactyl Panel & Wings Setup Workspace</h5>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  This customized workspace provides direct step-by-step solutions to build, troubleshoot, and host your Pterodactyl Panel (<code className="text-slate-300 font-mono">panel.unstableuniverse.world</code>) and Wings Node (<code className="text-slate-300 font-mono">de-node1.unstableuniverse.world</code>) locally on your system using Cloudflare Tunnels.
                </p>
              </div>

              {/* SECTION A: ACTIVE TERMINAL TROUBLESHOOTER */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                  <Terminal className="h-4 w-4 text-rose-400" />
                  <h6 className="text-xs font-bold uppercase tracking-wider text-rose-400 font-mono">🚨 Terminal Error Troubleshooter (Instant Fixes)</h6>
                </div>
                
                <p className="text-xs text-slate-400 leading-normal">
                  Select the error you just encountered in your Kali terminal to see the exact copy-pasteable resolution commands:
                </p>

                 {/* Troubleshooter Tabs */}
                 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-9 gap-2">
                   <button
                     onClick={() => setTroubleshootTab("nginx_error")}
                     className={`p-2.5 rounded-lg border text-[10px] font-bold font-mono transition-all text-center cursor-pointer ${
                       troubleshootTab === "nginx_error"
                         ? "bg-rose-500/10 border-rose-500/40 text-rose-400"
                         : "bg-slate-950 border-slate-800/80 hover:border-slate-700 text-slate-400"
                     }`}
                   >
                     🌐 Nginx Failed
                   </button>
                   <button
                     onClick={() => setTroubleshootTab("redis_error")}
                     className={`p-2.5 rounded-lg border text-[10px] font-bold font-mono transition-all text-center cursor-pointer ${
                       troubleshootTab === "redis_error"
                         ? "bg-rose-500/10 border-rose-500/40 text-rose-400"
                         : "bg-slate-950 border-slate-800/80 hover:border-slate-700 text-slate-400"
                     }`}
                   >
                     ⚡ Redis Refused
                   </button>
                   <button
                     onClick={() => setTroubleshootTab("db_error")}
                     className={`p-2.5 rounded-lg border text-[10px] font-bold font-mono transition-all text-center cursor-pointer ${
                       troubleshootTab === "db_error"
                         ? "bg-rose-500/10 border-rose-500/40 text-rose-400"
                         : "bg-slate-950 border-slate-800/80 hover:border-slate-700 text-slate-400"
                     }`}
                   >
                     💥 DB Conn Refused
                   </button>
                   <button
                     onClick={() => setTroubleshootTab("composer_missing")}
                     className={`p-2.5 rounded-lg border text-[10px] font-bold font-mono transition-all text-center cursor-pointer ${
                       troubleshootTab === "composer_missing"
                         ? "bg-rose-500/10 border-rose-500/40 text-rose-400"
                         : "bg-slate-950 border-slate-800/80 hover:border-slate-700 text-slate-400"
                     }`}
                   >
                     1. Composer missing
                   </button>
                   <button
                     onClick={() => setTroubleshootTab("missing_extensions")}
                     className={`p-2.5 rounded-lg border text-[10px] font-bold font-mono transition-all text-center cursor-pointer ${
                       troubleshootTab === "missing_extensions"
                         ? "bg-rose-500/10 border-rose-500/40 text-rose-400"
                         : "bg-slate-950 border-slate-800/80 hover:border-slate-700 text-slate-400"
                     }`}
                   >
                     2. Missing PHP Exts
                   </button>
                   <button
                     onClick={() => setTroubleshootTab("no_such_dir")}
                     className={`p-2.5 rounded-lg border text-[10px] font-bold font-mono transition-all text-center cursor-pointer ${
                       troubleshootTab === "no_such_dir"
                         ? "bg-rose-500/10 border-rose-500/40 text-rose-400"
                         : "bg-slate-950 border-slate-800/80 hover:border-slate-700 text-slate-400"
                     }`}
                   >
                     3. No such file/dir
                   </button>
                   <button
                     onClick={() => setTroubleshootTab("laravel_500")}
                     className={`p-2.5 rounded-lg border text-[10px] font-bold font-mono transition-all text-center cursor-pointer ${
                       troubleshootTab === "laravel_500"
                         ? "bg-rose-500/10 border-rose-500/40 text-rose-400"
                         : "bg-slate-950 border-slate-800/80 hover:border-slate-700 text-slate-400"
                     }`}
                   >
                     4. Artisan / 500 Error
                   </button>
                   <button
                     onClick={() => setTroubleshootTab("cf_service_stale")}
                     className={`p-2.5 rounded-lg border text-[10px] font-bold font-mono transition-all text-center cursor-pointer ${
                       troubleshootTab === "cf_service_stale"
                         ? "bg-rose-500/10 border-rose-500/40 text-rose-400"
                         : "bg-slate-950 border-slate-800/80 hover:border-slate-700 text-slate-400"
                     }`}
                   >
                     5. CF service stale
                   </button>
                   <button
                     onClick={() => setTroubleshootTab("cf_1033")}
                     className={`p-2.5 rounded-lg border text-[10px] font-bold font-mono transition-all text-center cursor-pointer ${
                       troubleshootTab === "cf_1033"
                         ? "bg-rose-500/10 border-rose-500/40 text-rose-400"
                         : "bg-slate-950 border-slate-800/80 hover:border-slate-700 text-slate-400"
                     }`}
                   >
                     6. CF Error 1033
                   </button>
                 </div>

                 {/* Troubleshooter Solution Display */}
                 <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                    {troubleshootTab === "nginx_error" && (
                     <div className="space-y-3 animate-fadeIn">
                       <div className="flex flex-col gap-1 text-rose-400 font-mono text-xs font-semibold">
                         <div className="flex items-center gap-2">
                           <span className="text-rose-500 font-bold">Root Cause:</span>
                           <span className="text-slate-300 font-normal">Port 80 Address Already In Use (Conflict)</span>
                         </div>
                         <p className="text-slate-400 font-normal text-[11px] mt-1 leading-normal">
                           Nginx failed to start because another program is already listening on Port 80 (<code className="text-rose-400 bg-slate-900 px-1 py-0.5 rounded font-mono">Address already in use</code>). On Kali Linux, this is typically caused by a zombie Apache2 process that didn't shut down cleanly, or a duplicate/orphan Nginx worker thread.
                         </p>
                       </div>
                       <span className="block text-[10px] font-mono font-bold text-slate-500 uppercase">Run these commands to find the conflict, kill it, and restart Nginx:</span>
                       <div className="relative">
                         <pre className="bg-slate-900/80 p-3.5 rounded-lg text-xs font-mono text-emerald-400 overflow-x-auto border border-slate-800 whitespace-pre">
{`# 1. Identify which process is running on Port 80
sudo lsof -i :80

# 2. Forcefully kill the process occupying Port 80 (frees the port immediately)
sudo fuser -k 80/tcp

# 3. Verify the port is now free (should output nothing)
sudo lsof -i :80

# 4. Now restart Nginx
sudo systemctl restart nginx

# 5. Check status to confirm it is successfully running and active (green)
sudo systemctl status nginx`}
                         </pre>
                         <button
                           onClick={() => handleCopy(`sudo lsof -i :80\nsudo fuser -k 80/tcp\nsudo systemctl restart nginx\nsudo systemctl status nginx`, "fix_nginx_error")}
                           className="absolute top-2 right-2 flex items-center gap-1 text-[10px] bg-slate-950 hover:bg-slate-800 text-slate-300 font-mono border border-slate-800 px-2.5 py-1 rounded cursor-pointer"
                         >
                           {copiedText === "fix_nginx_error" ? "Copied!" : "Copy Fix Script"}
                         </button>
                       </div>
                       <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 text-[11px] text-slate-300 leading-normal">
                         <strong className="text-emerald-400">💡 Why this works:</strong> Running <code className="text-emerald-400 font-mono font-semibold">sudo fuser -k 80/tcp</code> sends a SIGKILL signal to any process currently bound to the TCP port 80. Once free, Nginx can instantly claim the port and start working perfectly!
                       </div>
                     </div>
                   )}

                   {troubleshootTab === "redis_error" && (
                    <div className="space-y-3 animate-fadeIn">
                      <div className="flex flex-col gap-1 text-rose-400 font-mono text-xs font-semibold">
                        <div className="flex items-center gap-2">
                          <span className="text-rose-500 font-bold">Root Cause:</span>
                          <span className="text-slate-300 font-normal">Redis Connection Refused (tcp://127.0.0.1:6379)</span>
                        </div>
                        <p className="text-slate-400 font-normal text-[11px] mt-1 leading-normal">
                          This error happens because the <strong>Redis Server</strong> is not installed, not running, or not enabled on your Kali system. Pterodactyl relies on Redis for storing active sessions and managing job queues.
                        </p>
                      </div>
                      <span className="block text-[10px] font-mono font-bold text-slate-500 uppercase">Run these commands to install, start, and enable Redis:</span>
                      <div className="relative">
                        <pre className="bg-slate-900/80 p-3.5 rounded-lg text-xs font-mono text-emerald-400 overflow-x-auto border border-slate-800 whitespace-pre">
{`# 1. Update package list and install Redis server
sudo apt update
sudo apt install -y redis-server

# 2. Start Redis and enable it to run automatically on system boot
sudo systemctl start redis-server
sudo systemctl enable redis-server

# 3. Test if Redis is active and responding
redis-cli ping
# (This should return "PONG"!)

# 4. Now, re-run your administrator creation command!
cd /var/www/pterodactyl
sudo php artisan p:user:make`}
                        </pre>
                        <button
                          onClick={() => handleCopy(`sudo apt update && sudo apt install -y redis-server\nsudo systemctl start redis-server\nsudo systemctl enable redis-server\nredis-cli ping\ncd /var/www/pterodactyl\nsudo php artisan p:user:make`, "fix_redis_error")}
                          className="absolute top-2 right-2 flex items-center gap-1 text-[10px] bg-slate-950 hover:bg-slate-800 text-slate-300 font-mono border border-slate-800 px-2.5 py-1 rounded cursor-pointer"
                        >
                          {copiedText === "fix_redis_error" ? "Copied!" : "Copy Redis Script"}
                        </button>
                      </div>
                      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 text-[11px] text-slate-300 leading-normal">
                        <strong className="text-emerald-400">💡 Tip:</strong> Once Redis returns <code className="text-emerald-400 font-mono font-semibold">PONG</code> on the ping command, run the last command (<code className="text-emerald-400 font-mono font-semibold">sudo php artisan p:user:make</code>), fill in your admin user details, and your admin user will be successfully created!
                      </div>
                    </div>
                  )}

                  {troubleshootTab === "db_error" && (
                    <div className="space-y-3 animate-fadeIn">
                      <div className="flex flex-col gap-1 text-rose-400 font-mono text-xs font-semibold">
                        <div className="flex items-center gap-2">
                          <span className="text-rose-500 font-bold">Root Cause:</span>
                          <span className="text-slate-300 font-normal">Database Connection Refused (SQLSTATE[HY000] [2002])</span>
                        </div>
                        <p className="text-slate-400 font-normal text-[11px] mt-1 leading-normal">
                          This error occurs when Pterodactyl attempts to connect to a MySQL/MariaDB database on <code className="text-rose-400 bg-slate-900 px-1 py-0.5 rounded font-mono">127.0.0.1</code> but the database server is either <strong>not installed</strong>, <strong>not running</strong>, or the database <code className="text-rose-400 bg-slate-900 px-1 py-0.5 rounded font-mono">panel</code> and user <code className="text-rose-400 bg-slate-900 px-1 py-0.5 rounded font-mono">pterodactyl</code> haven't been created yet.
                        </p>
                      </div>
                      <span className="block text-[10px] font-mono font-bold text-slate-500 uppercase">Run these commands to install, start, and configure your database:</span>
                      <div className="relative">
                        <pre className="bg-slate-900/80 p-3.5 rounded-lg text-xs font-mono text-emerald-400 overflow-x-auto border border-slate-800 whitespace-pre">
{`# 1. Update package lists and install MariaDB Server & Client
sudo apt update
sudo apt install -y mariadb-server mariadb-client

# 2. Start MariaDB and enable it on boot
sudo systemctl start mariadb
sudo systemctl enable mariadb

# 3. Create database and panel user
sudo mariadb -u root -e "
CREATE DATABASE IF NOT EXISTS panel;
CREATE USER IF NOT EXISTS 'pterodactyl'@'127.0.0.1' IDENTIFIED BY 'yourSecurePassword123';
GRANT ALL PRIVILEGES ON panel.* TO 'pterodactyl'@'127.0.0.1' WITH GRANT OPTION;
FLUSH PRIVILEGES;
"

# 4. Open and verify your .env file
# Run: sudo nano /var/www/pterodactyl/.env
# Verify DB section matches your settings:
# DB_CONNECTION=mysql
# DB_HOST=127.0.0.1
# DB_PORT=3306
# DB_DATABASE=panel
# DB_USERNAME=pterodactyl
# DB_PASSWORD=yourSecurePassword123

# 5. Run the migration and seed again
cd /var/www/pterodactyl
sudo php artisan migrate --seed --force`}
                        </pre>
                        <button
                          onClick={() => handleCopy(`sudo apt update && sudo apt install -y mariadb-server mariadb-client\nsudo systemctl start mariadb\nsudo systemctl enable mariadb\nsudo mariadb -u root -e "CREATE DATABASE IF NOT EXISTS panel; CREATE USER IF NOT EXISTS 'pterodactyl'@'127.0.0.1' IDENTIFIED BY 'yourSecurePassword123'; GRANT ALL PRIVILEGES ON panel.* TO 'pterodactyl'@'127.0.0.1' WITH GRANT OPTION; FLUSH PRIVILEGES;"\ncd /var/www/pterodactyl\nsudo php artisan migrate --seed --force`, "fix_db_error")}
                          className="absolute top-2 right-2 flex items-center gap-1 text-[10px] bg-slate-950 hover:bg-slate-800 text-slate-300 font-mono border border-slate-800 px-2.5 py-1 rounded cursor-pointer"
                        >
                          {copiedText === "fix_db_error" ? "Copied!" : "Copy DB Script"}
                        </button>
                      </div>
                      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 text-[11px] text-slate-300 leading-normal">
                        <strong className="text-emerald-400">💡 Next Steps Info:</strong> After running step 3, you can run <code className="text-emerald-400 bg-slate-900 px-1 py-0.5 rounded font-mono">sudo nano /var/www/pterodactyl/.env</code> to check or replace the password. If you kept the default password above (<code className="text-emerald-400 font-semibold">yourSecurePassword123</code>), make sure <code className="text-emerald-400">DB_PASSWORD=yourSecurePassword123</code> is set there, then run Step 5!
                      </div>
                    </div>
                  )}

                  {troubleshootTab === "composer_missing" && (
                    <div className="space-y-3 animate-fadeIn">
                      <div className="flex items-center gap-2 text-rose-400 font-mono text-xs font-semibold">
                        <span>Root Cause:</span>
                        <p className="text-slate-300 font-normal">
                          The <code className="text-rose-400 font-bold bg-slate-900 px-1 py-0.5 rounded font-mono">composer</code> command is missing. Composer is the PHP package manager required to build Laravel apps (like Pterodactyl).
                        </p>
                      </div>
                      <span className="block text-[10px] font-mono font-bold text-slate-500 uppercase">Run these commands to install Composer and complete your Panel setup:</span>
                      <div className="relative">
                        <pre className="bg-slate-900/80 p-3.5 rounded-lg text-xs font-mono text-emerald-400 overflow-x-auto border border-slate-800 whitespace-pre">
{`# 1. Update package list and install Composer directly from Kali apt repositories
sudo apt update
sudo apt install -y composer

# 2. Verify Composer is successfully installed
composer --version

# 3. Enter your Panel directory and install dependencies
cd /var/www/pterodactyl
sudo composer install --no-dev --optimize-autoloader

# 4. Generate the Laravel application encryption key (this will now succeed!)
sudo cp .env.example .env
sudo php artisan key:generate --force

# 5. Set correct storage permissions & Nginx user ownership
sudo chmod -R 755 storage/* bootstrap/cache/
sudo chown -R www-data:www-data /var/www/pterodactyl/*`}
                        </pre>
                        <button
                          onClick={() => handleCopy(`sudo apt update && sudo apt install -y composer\ncomposer --version\ncd /var/www/pterodactyl\nsudo composer install --no-dev --optimize-autoloader\nsudo cp .env.example .env\nsudo php artisan key:generate --force\nsudo chmod -R 755 storage/* bootstrap/cache/\nsudo chown -R www-data:www-data /var/www/pterodactyl/*`, "fix_composer_missing")}
                          className="absolute top-2 right-2 flex items-center gap-1 text-[10px] bg-slate-950 hover:bg-slate-800 text-slate-300 font-mono border border-slate-800 px-2.5 py-1 rounded cursor-pointer"
                        >
                          {copiedText === "fix_composer_missing" ? "Copied!" : "Copy Full Script"}
                        </button>
                      </div>
                    </div>
                  )}

                  {troubleshootTab === "missing_extensions" && (
                    <div className="space-y-3 animate-fadeIn">
                      <div className="flex items-center gap-2 text-rose-400 font-mono text-xs font-semibold">
                        <span>Root Cause:</span>
                        <p className="text-slate-300 font-normal">
                          PHP is missing the required extensions (<code className="text-rose-400 font-bold bg-slate-900 px-1 py-0.5 rounded font-mono">simplexml</code>, <code className="text-rose-400 font-bold bg-slate-900 px-1 py-0.5 rounded font-mono">bcmath</code>, <code className="text-rose-400 font-bold bg-slate-900 px-1 py-0.5 rounded font-mono">dom</code>). Since you are running <strong>PHP 8.4</strong> on Kali, you must install the corresponding package versions.
                        </p>
                      </div>
                      <span className="block text-[10px] font-mono font-bold text-slate-500 uppercase">Run these commands to install the missing extensions and complete Composer installation:</span>
                      <div className="relative">
                        <pre className="bg-slate-900/80 p-3.5 rounded-lg text-xs font-mono text-emerald-400 overflow-x-auto border border-slate-800 whitespace-pre">
{`# 1. Update package lists
sudo apt update

# 2. Install missing XML and BCMath extensions for PHP 8.4 (and other standard requirements)
sudo apt install -y php8.4-xml php8.4-bcmath php8.4-gd php8.4-mysql php8.4-mbstring php8.4-curl php8.4-zip php8.4-intl

# 3. Try running Composer install again inside your Panel folder
cd /var/www/pterodactyl
sudo composer install --no-dev --optimize-autoloader

# 4. Copy the .env configuration file and generate the application encryption key
sudo cp .env.example .env
sudo php artisan key:generate --force

# 5. Set correct storage permissions & Nginx user ownership
sudo chmod -R 755 storage/* bootstrap/cache/
sudo chown -R www-data:www-data /var/www/pterodactyl/*`}
                        </pre>
                        <button
                          onClick={() => handleCopy(`sudo apt update\nsudo apt install -y php8.4-xml php8.4-bcmath php8.4-gd php8.4-mysql php8.4-mbstring php8.4-curl php8.4-zip php8.4-intl\ncd /var/www/pterodactyl\nsudo composer install --no-dev --optimize-autoloader\nsudo cp .env.example .env\nsudo php artisan key:generate --force\nsudo chmod -R 755 storage/* bootstrap/cache/\nsudo chown -R www-data:www-data /var/www/pterodactyl/*`, "fix_missing_extensions")}
                          className="absolute top-2 right-2 flex items-center gap-1 text-[10px] bg-slate-950 hover:bg-slate-800 text-slate-300 font-mono border border-slate-800 px-2.5 py-1 rounded cursor-pointer"
                        >
                          {copiedText === "fix_missing_extensions" ? "Copied!" : "Copy Full Script"}
                        </button>
                      </div>
                    </div>
                  )}

                  {troubleshootTab === "no_such_dir" && (
                    <div className="space-y-3 animate-fadeIn">
                      <div className="flex items-center gap-2 text-rose-400 font-mono text-xs font-semibold">
                        <span>Root Cause:</span>
                        <p className="text-slate-300 font-normal">You are running commands in your home directory (<code className="text-rose-400 font-bold bg-slate-900 px-1 py-0.5 rounded font-mono">~/crafthost/panel</code>) or have not created the Pterodactyl directory structure.</p>
                      </div>
                      <span className="block text-[10px] font-mono font-bold text-slate-500 uppercase">Run these commands to fix it:</span>
                      <div className="relative">
                        <pre className="bg-slate-900/80 p-3.5 rounded-lg text-xs font-mono text-emerald-400 overflow-x-auto border border-slate-800 whitespace-pre">
{`# 1. Create the correct directory structure manually
sudo mkdir -p /var/www/pterodactyl
cd /var/www/pterodactyl

# 2. Download and extract the latest Pterodactyl panel release files
sudo curl -Lo panel.tar.gz https://github.com/pterodactyl/panel/releases/latest/download/panel.tar.gz
sudo tar -xzvf panel.tar.gz

# 3. Configure storage folder boundaries permissions
sudo chmod -R 755 storage/* bootstrap/cache/`}
                        </pre>
                        <button
                          onClick={() => handleCopy(`sudo mkdir -p /var/www/pterodactyl\ncd /var/www/pterodactyl\nsudo curl -Lo panel.tar.gz https://github.com/pterodactyl/panel/releases/latest/download/panel.tar.gz\nsudo tar -xzvf panel.tar.gz\nsudo chmod -R 755 storage/* bootstrap/cache/`, "fix_no_such_dir")}
                          className="absolute top-2 right-2 flex items-center gap-1 text-[10px] bg-slate-950 hover:bg-slate-800 text-slate-300 font-mono border border-slate-800 px-2.5 py-1 rounded cursor-pointer"
                        >
                          {copiedText === "fix_no_such_dir" ? "Copied!" : "Copy Fix"}
                        </button>
                      </div>
                    </div>
                  )}

                  {troubleshootTab === "laravel_500" && (
                    <div className="space-y-3 animate-fadeIn">
                      <div className="flex flex-col gap-2 text-rose-400 font-mono text-xs font-semibold">
                        <div className="flex items-center gap-2">
                          <span>Root Cause 1:</span>
                          <span className="text-slate-300 font-normal">If you ran <code className="text-rose-400 font-bold bg-slate-900 px-1 py-0.5 rounded font-mono">sudo chown -R www-data:www-data /var/www/pterodactyl/*</code>, bash standard wildcard does NOT match hidden files starting with a dot, meaning <code className="text-rose-400 font-bold bg-slate-900 px-1.5 py-0.5 rounded font-mono">.env</code> is still owned by root! Nginx/PHP-FPM will get Permission Denied reading it, throwing a 500 error.</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span>Root Cause 2:</span>
                          <span className="text-slate-300 font-normal">Stale config cache or ungenerated encryption key in the `.env` file.</span>
                        </div>
                      </div>

                      <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-800 space-y-2">
                        <span className="block text-[10px] font-mono font-bold text-amber-400 uppercase">🔍 Diagnosing the actual 500 error:</span>
                        <p className="text-[11px] text-slate-300">Run this command on your Kali terminal to see the precise PHP stacktrace causing the 500 error:</p>
                        <div className="relative">
                          <code className="block bg-slate-950 p-2 rounded text-xs text-rose-400 font-mono">tail -n 50 /var/www/pterodactyl/storage/logs/laravel-$(date +%Y-%m-%d).log || tail -n 50 /var/www/pterodactyl/storage/logs/laravel.log</code>
                        </div>
                      </div>

                      <span className="block text-[10px] font-mono font-bold text-slate-500 uppercase">Run these commands to fix all permissions & keys:</span>
                      <div className="relative">
                        <pre className="bg-slate-900/80 p-3.5 rounded-lg text-xs font-mono text-emerald-400 overflow-x-auto border border-slate-800 whitespace-pre">
{`# 1. Switch to the panel root folder
cd /var/www/pterodactyl

# 2. Correctly set permissions on the ENTIRE folder (including hidden .env files)
sudo chown -R www-data:www-data /var/www/pterodactyl

# 3. Ensure storage and cache folders have writable permission flags
sudo chmod -R 775 storage bootstrap/cache

# 4. Generate the app encryption key if you haven't already
sudo php artisan key:generate --force

# 5. Flush and rebuild the application caches
sudo php artisan config:clear
sudo php artisan cache:clear`}
                        </pre>
                        <button
                          onClick={() => handleCopy(`cd /var/www/pterodactyl\nsudo chown -R www-data:www-data /var/www/pterodactyl\nsudo chmod -R 775 storage bootstrap/cache\nsudo php artisan key:generate --force\nsudo php artisan config:clear\nsudo php artisan cache:clear`, "fix_laravel_500")}
                          className="absolute top-2 right-2 flex items-center gap-1 text-[10px] bg-slate-950 hover:bg-slate-800 text-slate-300 font-mono border border-slate-800 px-2.5 py-1 rounded cursor-pointer"
                        >
                          {copiedText === "fix_laravel_500" ? "Copied!" : "Copy Full Fix Script"}
                        </button>
                      </div>
                    </div>
                  )}

                  {troubleshootTab === "cf_service_stale" && (
                    <div className="space-y-3 animate-fadeIn">
                      <div className="flex items-center gap-2 text-rose-400 font-mono text-xs font-semibold">
                        <span>Root Cause:</span>
                        <p className="text-slate-300 font-normal">A stale or old systemd file exists at <code className="text-rose-400 font-bold bg-slate-900 px-1 py-0.5 rounded font-mono">/etc/systemd/system/cloudflared.service</code>, which prevents you from installing your new tunnel.</p>
                      </div>
                      <span className="block text-[10px] font-mono font-bold text-slate-500 uppercase">Run these commands to fix it:</span>
                      <div className="relative">
                        <pre className="bg-slate-900/80 p-3.5 rounded-lg text-xs font-mono text-emerald-400 overflow-x-auto border border-slate-800 whitespace-pre">
{`# 1. Forcefully uninstall the stale Cloudflare tunnel service
sudo cloudflared service uninstall

# 2. Refresh systemd registry
sudo systemctl daemon-reload

# 3. Now, install the service correctly using your tunnel credentials/token
sudo cloudflared service install YOUR_TOKEN_GOES_HERE

# 4. Start the service
sudo systemctl daemon-reload
sudo systemctl start cloudflared
sudo systemctl status cloudflared`}
                        </pre>
                        <button
                          onClick={() => handleCopy(`sudo cloudflared service uninstall\nsudo systemctl daemon-reload`, "fix_cf_stale")}
                          className="absolute top-2 right-2 flex items-center gap-1 text-[10px] bg-slate-950 hover:bg-slate-800 text-slate-300 font-mono border border-slate-800 px-2.5 py-1 rounded cursor-pointer"
                        >
                          {copiedText === "fix_cf_stale" ? "Copied!" : "Copy Fix"}
                        </button>
                      </div>
                    </div>
                  )}

                  {troubleshootTab === "cf_1033" && (
                    <div className="space-y-3 animate-fadeIn">
                      <div className="flex items-center gap-2 text-rose-400 font-mono text-xs font-semibold">
                        <span>Root Cause:</span>
                        <p className="text-slate-300 font-normal">Error 1033 (Tunnel Connection Refused) means your Cloudflare Tunnel is running but cannot connect to your local port 80. Nginx is likely stopped or not configured correctly for your domain.</p>
                      </div>
                      <span className="block text-[10px] font-mono font-bold text-slate-500 uppercase">Run these commands to fix it:</span>
                      <div className="relative">
                        <pre className="bg-slate-900/80 p-3.5 rounded-lg text-xs font-mono text-emerald-400 overflow-x-auto border border-slate-800 whitespace-pre">
{`# 1. Restart Nginx to verify it's listening on port 80
sudo systemctl restart nginx
sudo systemctl status nginx

# 2. Test local access directly to make sure Laravel is serving
curl -H "Host: panel.unstableuniverse.world" http://localhost:80`}
                        </pre>
                        <button
                          onClick={() => handleCopy(`sudo systemctl restart nginx\nsudo systemctl status nginx\ncurl -H "Host: panel.unstableuniverse.world" http://localhost:80`, "fix_cf_1033")}
                          className="absolute top-2 right-2 flex items-center gap-1 text-[10px] bg-slate-950 hover:bg-slate-800 text-slate-300 font-mono border border-slate-800 px-2.5 py-1 rounded cursor-pointer"
                        >
                          {copiedText === "fix_cf_1033" ? "Copied!" : "Copy Fix"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION B: DETAILED WALKTHROUGH FROM STEP 3.2 ONWARDS */}
              <div className="space-y-5">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                  <ArrowRight className="h-4 w-4 text-emerald-400" />
                  <h6 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">📘 Step-by-Step Production Setup Guide (Panel + Wings)</h6>
                </div>

                <div className="space-y-4">
                  {/* Step 3.2 */}
                  <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="bg-emerald-500/10 text-emerald-400 text-xs font-mono font-bold px-2.5 py-1 rounded-md border border-emerald-500/20">Step 3.2</span>
                      <h6 className="text-xs font-bold text-slate-200 uppercase font-mono">Run Database Migrations & Seeds</h6>
                    </div>
                    <p className="text-xs text-slate-400 leading-normal">
                      Once the panel directory and dependencies are correctly configured, you must initialize the database schemas and insert default data (such as eggs and default locations):
                    </p>
                    <div className="relative">
                      <pre className="bg-slate-950 p-3 rounded-lg text-xs font-mono text-indigo-400 overflow-x-auto whitespace-pre">
{`cd /var/www/pterodactyl
sudo php artisan migrate --seed --force`}
                      </pre>
                      <button
                        onClick={() => handleCopy(`cd /var/www/pterodactyl\nsudo php artisan migrate --seed --force`, "step_3_2")}
                        className="absolute top-2 right-2 flex items-center gap-1 text-[10px] bg-slate-900 hover:bg-slate-800 text-slate-300 font-mono border border-slate-800 px-2 py-0.5 rounded cursor-pointer"
                      >
                        {copiedText === "step_3_2" ? "Copied!" : "Copy"}
                      </button>
                    </div>
                  </div>

                  {/* Step 3.3 */}
                  <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="bg-emerald-500/10 text-emerald-400 text-xs font-mono font-bold px-2.5 py-1 rounded-md border border-emerald-500/20">Step 3.3</span>
                      <h6 className="text-xs font-bold text-slate-200 uppercase font-mono">Create Admin Account</h6>
                    </div>
                    <p className="text-xs text-slate-400 leading-normal">
                      Generate an administrative user to log into the web panel. Provide a secure password and valid email address when prompted:
                    </p>
                    <div className="relative">
                      <pre className="bg-slate-950 p-3 rounded-lg text-xs font-mono text-indigo-400 overflow-x-auto whitespace-pre">
{`sudo php artisan p:user:make`}
                      </pre>
                      <button
                        onClick={() => handleCopy(`sudo php artisan p:user:make`, "step_3_3")}
                        className="absolute top-2 right-2 flex items-center gap-1 text-[10px] bg-slate-900 hover:bg-slate-800 text-slate-300 font-mono border border-slate-800 px-2 py-0.5 rounded cursor-pointer"
                      >
                        {copiedText === "step_3_3" ? "Copied!" : "Copy"}
                      </button>
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="bg-emerald-500/10 text-emerald-400 text-xs font-mono font-bold px-2.5 py-1 rounded-md border border-emerald-500/20">Step 4</span>
                      <h6 className="text-xs font-bold text-slate-200 uppercase font-mono">Nginx Virtual Host Configuration</h6>
                    </div>
                    <p className="text-xs text-slate-400 leading-normal">
                      Create an Nginx configuration file at <code className="text-slate-300 bg-slate-900 px-1 py-0.5 rounded font-mono">/etc/nginx/sites-available/pterodactyl.conf</code>. It must match your Cloudflare Tunnel port 80 mapping:
                    </p>
                    <div className="relative">
                      <pre className="bg-slate-950 p-3 rounded-lg text-xs font-mono text-slate-300 overflow-x-auto max-h-64 scrollbar-thin whitespace-pre leading-normal">
{`server {
    listen 80;
    server_name panel.unstableuniverse.world;

    root /var/www/pterodactyl/public;
    index index.html index.htm index.php;
    charset utf-8;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    access_log /var/log/nginx/pterodactyl.access.log;
    error_log  /var/log/nginx/pterodactyl.error.log error;

    client_max_body_size 100m;
    client_body_timeout 120s;

    sendfile off;

    location ~ \\.php$ {
        fastcgi_split_path_info ^(.+\\.php)(/.+)$;
        fastcgi_pass unix:/run/php/php8.2-fpm.sock; # Adjust your PHP version sock
        fastcgi_index index.php;
        include fastcgi_params;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        fastcgi_param HTTP_PROXY "";
        fastcgi_intercept_errors off;
        fastcgi_buffer_size 16k;
        fastcgi_buffers 4 16k;
        fastcgi_connect_timeout 300;
        fastcgi_send_timeout 300;
        fastcgi_read_timeout 300;
    }

    location ~ /\\.ht {
        deny all;
    }
}`}
                      </pre>
                      <button
                        onClick={() => handleCopy(`server {\n    listen 80;\n    server_name panel.unstableuniverse.world;\n\n    root /var/www/pterodactyl/public;\n    index index.html index.htm index.php;\n    charset utf-8;\n\n    location / {\n        try_files $uri $uri/ /index.php?$query_string;\n    }\n\n    location = /favicon.ico { access_log off; log_not_found off; }\n    location = /robots.txt  { access_log off; log_not_found off; }\n\n    access_log /var/log/nginx/pterodactyl.access.log;\n    error_log  /var/log/nginx/pterodactyl.error.log error;\n\n    client_max_body_size 100m;\n    client_body_timeout 120s;\n\n    sendfile off;\n\n    location ~ \\.php$ {\n        fastcgi_split_path_info ^(.+\\.php)(/.+)$;\n        fastcgi_pass unix:/run/php/php8.2-fpm.sock;\n        fastcgi_index index.php;\n        include fastcgi_params;\n        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;\n        fastcgi_param HTTP_PROXY \"\";\n        fastcgi_intercept_errors off;\n        fastcgi_buffer_size 16k;\n        fastcgi_buffers 4 16k;\n        fastcgi_connect_timeout 300;\n        fastcgi_send_timeout 300;\n        fastcgi_read_timeout 300;\n    }\n\n    location ~ /\\.ht {\n        deny all;\n    }\n}`, "nginx_conf")}
                        className="absolute top-2 right-2 flex items-center gap-1 text-[10px] bg-slate-900 hover:bg-slate-800 text-slate-300 font-mono border border-slate-800 px-2.5 py-0.5 rounded cursor-pointer"
                      >
                        {copiedText === "nginx_conf" ? "Copied!" : "Copy"}
                      </button>
                    </div>
                    <span className="block text-[10px] font-mono font-bold text-slate-500 uppercase mt-2">Enable virtual host and restart Nginx:</span>
                    <div className="relative">
                      <pre className="bg-slate-950 p-2.5 rounded text-xs font-mono text-emerald-400 whitespace-pre">
{`sudo ln -s /etc/nginx/sites-available/pterodactyl.conf /etc/nginx/sites-enabled/pterodactyl.conf
sudo systemctl restart nginx`}
                      </pre>
                    </div>
                  </div>

                  {/* Step 5 */}
                  <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="bg-emerald-500/10 text-emerald-400 text-xs font-mono font-bold px-2.5 py-1 rounded-md border border-emerald-500/20">Step 5</span>
                      <h6 className="text-xs font-bold text-slate-200 uppercase font-mono">Configure Multi-Origin Cloudflare Tunnel (<code className="text-slate-300">config.yml</code>)</h6>
                    </div>
                    <p className="text-xs text-slate-400 leading-normal">
                      Instead of running multiple processes, define your multi-origin config file at <code className="text-slate-300 bg-slate-900 px-1 py-0.5 rounded font-mono">/etc/cloudflared/config.yml</code> (or tunnel directory) to bind domains correctly to both the Panel and Wings:
                    </p>
                    <div className="relative">
                      <pre className="bg-slate-950 p-3 rounded-lg text-xs font-mono text-slate-300 overflow-x-auto whitespace-pre leading-normal">
{`tunnel: <YOUR_TUNNEL_UUID_OR_ID>
credentials-file: /etc/cloudflared/<YOUR_TUNNEL_UUID>.json

ingress:
  # Route 1: Pterodactyl Panel (local webserver port 80)
  - hostname: panel.unstableuniverse.world
    service: http://localhost:80

  # Route 2: Pterodactyl Wings (local docker daemon node port 8080)
  - hostname: de-node1.unstableuniverse.world
    service: http://localhost:8080

  # Default fallback catch-all
  - service: http_status:404`}
                      </pre>
                      <button
                        onClick={() => handleCopy(`tunnel: <YOUR_TUNNEL_UUID_OR_ID>\ncredentials-file: /etc/cloudflared/<YOUR_TUNNEL_UUID>.json\n\ningress:\n  - hostname: panel.unstableuniverse.world\n    service: http://localhost:80\n  - hostname: de-node1.unstableuniverse.world\n    service: http://localhost:8080\n  - service: http_status:404`, "tunnel_yaml")}
                        className="absolute top-2 right-2 flex items-center gap-1 text-[10px] bg-slate-900 hover:bg-slate-800 text-slate-300 font-mono border border-slate-800 px-2 py-0.5 rounded cursor-pointer"
                      >
                        {copiedText === "tunnel_yaml" ? "Copied!" : "Copy config"}
                      </button>
                    </div>
                  </div>

                  {/* Step 6 */}
                  <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="bg-emerald-500/10 text-emerald-400 text-xs font-mono font-bold px-2.5 py-1 rounded-md border border-emerald-500/20">Step 6</span>
                      <h6 className="text-xs font-bold text-slate-200 uppercase font-mono">Docker & Wings Setup (de-node1)</h6>
                    </div>
                    <p className="text-xs text-slate-400 leading-normal">
                      Ensure Docker is installed on your Kali system, then download Wings and register your node in the panel using the token configuration file (<code className="text-slate-300 bg-slate-900 px-1 py-0.5 rounded font-mono">/etc/pterodactyl/config.yml</code>):
                    </p>
                    <div className="relative">
                      <pre className="bg-slate-950 p-3 rounded-lg text-xs font-mono text-indigo-400 overflow-x-auto whitespace-pre leading-normal">
{`# 1. Install Docker on Kali Linux
sudo apt update && sudo apt install -y docker.io

# 2. Setup Wings binaries directory
sudo mkdir -p /etc/pterodactyl
sudo curl -L -o /usr/local/bin/wings https://github.com/pterodactyl/wings/releases/latest/download/wings_linux_amd64
sudo chmod +x /usr/local/bin/wings

# 3. Create the configuration file (copy config contents from Panel Node settings to /etc/pterodactyl/config.yml)
# then run Wings to verify:
sudo wings --debug`}
                      </pre>
                      <button
                        onClick={() => handleCopy(`sudo apt update && sudo apt install -y docker.io\nsudo mkdir -p /etc/pterodactyl\nsudo curl -L -o /usr/local/bin/wings https://github.com/pterodactyl/wings/releases/latest/download/wings_linux_amd64\nsudo chmod +x /usr/local/bin/wings\nsudo wings --debug`, "wings_setup")}
                        className="absolute top-2 right-2 flex items-center gap-1 text-[10px] bg-slate-900 hover:bg-slate-800 text-slate-300 font-mono border border-slate-800 px-2.5 py-0.5 rounded cursor-pointer"
                      >
                        {copiedText === "wings_setup" ? "Copied!" : "Copy"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 1. AUTOMATED INSTALLER */}
          {activeSubTab === "installer" && (
            <div className="space-y-5 animate-fadeIn">
              <p className="text-xs text-slate-400 leading-relaxed">
                Download or execute this custom bash installer to configure dependencies, directory structures, user boundaries, and open firewall paths on any Linux VPS server.
              </p>

              {/* Toggles */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-900/40 p-4 rounded-xl border border-slate-800">
                {/* Distro Select */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 font-mono block">Target Linux OS</label>
                  <select
                    value={distro}
                    onChange={(e) => setDistro(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-semibold text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="ubuntu">Ubuntu / Debian</option>
                    <option value="rhel">Rocky / Alma / CentOS</option>
                  </select>
                </div>

                {/* Java select */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 font-mono block">JDK Runtime Version</label>
                  <select
                    value={javaVersion}
                    onChange={(e) => setJavaVersion(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-semibold text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="17">Java 17 (Minecraft 1.17 - 1.20.4)</option>
                    <option value="21">Java 21 (Minecraft 1.20.5+ / Purpur)</option>
                  </select>
                </div>

                {/* Core Engine */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 font-mono block">Minecraft Core Jar</label>
                  <select
                    value={serverJar}
                    onChange={(e) => setServerJar(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-semibold text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="paper">PaperMC (Highly Optimized Spigot)</option>
                    <option value="purpur">PurpurMC (Advanced Customization)</option>
                  </select>
                </div>
              </div>

              {/* Code output blocks */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 font-mono">Bash Setup Script (install-crafthost.sh)</span>
                  <button
                    onClick={() => handleCopy(getInstallerScript(), "script")}
                    className="flex items-center gap-1 text-[10px] bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-800 px-2.5 py-1 rounded text-slate-300 font-mono cursor-pointer transition-all"
                  >
                    {copiedText === "script" ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-400" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        Copy Script
                      </>
                    )}
                  </button>
                </div>
                <div className="relative">
                  <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 max-h-56 overflow-y-auto text-xs font-mono text-slate-300 scrollbar-thin">
                    <code>{getInstallerScript()}</code>
                  </pre>
                </div>
              </div>

              {/* Live Bash Simulation Box */}
              <div className="bg-slate-950 border border-slate-800/80 rounded-xl overflow-hidden shadow-inner">
                <div className="bg-slate-900 px-4 py-2 flex items-center justify-between border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <span className="text-[10px] font-mono text-slate-400 font-semibold ml-2">vps-terminal-shell</span>
                  </div>
                  <button
                    onClick={runInstallationSimulation}
                    disabled={isSimulatingSetup}
                    className="text-[10px] bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold px-3 py-1 rounded-md cursor-pointer transition-all flex items-center gap-1 font-mono uppercase"
                  >
                    {isSimulatingSetup ? (
                      <>
                        <RefreshCw className="h-3 w-3 animate-spin" />
                        Deploying...
                      </>
                    ) : (
                      "Simulate Linux Install"
                    )}
                  </button>
                </div>
                <div className="p-4 bg-black text-[11px] font-mono leading-relaxed text-emerald-400 h-44 overflow-y-auto scrollbar-thin space-y-1.5" id="simulated-bash-shell">
                  {simulationLogs.length === 0 ? (
                    <span className="text-slate-600 italic">Click "Simulate Linux Install" to view real-time compilation, user provisioning, and daemon startup logging output.</span>
                  ) : (
                    simulationLogs.map((log, lIdx) => (
                      <div key={lIdx} className="whitespace-pre-wrap">
                        {log}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 2. SYSTEMD DAEMON BUILDER */}
          {activeSubTab === "systemd" && (
            <div className="space-y-5 animate-fadeIn">
              <p className="text-xs text-slate-400 leading-relaxed">
                By setting up a systemd daemon, you can guarantee that your server starts up automatically when your Linux machine boots, handles automatic restarts on server failure, and sandboxes resources securely.
              </p>

              {/* Builder Toggles */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-900/40 p-4 rounded-xl border border-slate-800">
                {/* User */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 font-mono block">System User</label>
                  <input
                    type="text"
                    value={sysUser}
                    onChange={(e) => setSysUser(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                {/* Path */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 font-mono block">Working Directory</label>
                  <input
                    type="text"
                    value={sysPath}
                    onChange={(e) => setSysPath(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                {/* Auto Restart */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 font-mono block">Auto-Restart Daemon</label>
                  <div className="flex items-center h-8">
                    <button
                      type="button"
                      onClick={() => setSysAutoRestart(!sysAutoRestart)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        sysAutoRestart ? "bg-indigo-600" : "bg-slate-800"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          sysAutoRestart ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                    <span className="ml-3 font-mono text-xs font-bold text-slate-400 uppercase">
                      {sysAutoRestart ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                </div>
              </div>

              {/* systemd code box */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 font-mono">Service Daemon File (/etc/systemd/system/minecraft.service)</span>
                  <button
                    onClick={() => handleCopy(getSystemdConfig(), "systemd")}
                    className="flex items-center gap-1 text-[10px] bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-800 px-2.5 py-1 rounded text-slate-300 font-mono cursor-pointer transition-all"
                  >
                    {copiedText === "systemd" ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-400" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        Copy daemon config
                      </>
                    )}
                  </button>
                </div>
                <div className="relative">
                  <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs font-mono text-slate-300 overflow-x-auto scrollbar-thin">
                    <code>{getSystemdConfig()}</code>
                  </pre>
                </div>
              </div>

              {/* Linux Commands instruction card */}
              <div className="bg-slate-900/30 border border-slate-800/80 rounded-xl p-4 space-y-3">
                <h5 className="text-xs font-bold text-slate-200 uppercase font-mono tracking-wide">🔧 Standard Service Control commands</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-slate-950 border border-slate-800/80 p-2.5 rounded-lg">
                    <span className="block text-[9px] uppercase font-bold text-slate-500">To Load & Enable Daemon</span>
                    <code className="text-[11px] font-mono text-indigo-400 block mt-1">sudo systemctl daemon-reload<br />sudo systemctl enable minecraft</code>
                  </div>
                  <div className="bg-slate-950 border border-slate-800/80 p-2.5 rounded-lg">
                    <span className="block text-[9px] uppercase font-bold text-slate-500">To Boot & Restart</span>
                    <code className="text-[11px] font-mono text-indigo-400 block mt-1">sudo systemctl start minecraft<br />sudo systemctl restart minecraft</code>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3. AIKAR'S GC OPTIMIZER */}
          {activeSubTab === "aikar" && (
            <div className="space-y-5 animate-fadeIn">
              <p className="text-xs text-slate-400 leading-relaxed">
                Aikar's Garbage Collection Flags are standard across professional Minecraft servers. They optimize memory cleanups to virtually eliminate server ticks pausing (garbage collection lag spikes). Adjust the slider to generate custom parameters.
              </p>

              {/* RAM Slider */}
              <div className="bg-slate-900/40 p-5 rounded-xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-slate-200 font-mono uppercase tracking-wider block">Target RAM Allocation</label>
                    <span className="text-[10px] text-slate-500">Drag to adjust the server heap allocation limits.</span>
                  </div>
                  <span className="font-mono text-2xl font-extrabold text-indigo-400 animate-pulse">{allocatedRam} GB</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="32"
                  step="1"
                  value={allocatedRam}
                  onChange={(e) => setAllocatedRam(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
                <div className="flex justify-between text-[10px] font-mono text-slate-500">
                  <span>2 GB (Small Survival)</span>
                  <span>8 GB (Normal Hub)</span>
                  <span>16 GB (Factions/Modded)</span>
                  <span>32 GB (Massive Network)</span>
                </div>
              </div>

              {/* Engine selectors */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: "paper", label: "Paper / Spigot" },
                  { id: "velocity", label: "Velocity Proxy" },
                  { id: "bungee", label: "BungeeCord Proxy" }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setServerEngine(item.id as any)}
                    className={`p-3 border rounded-xl font-bold text-xs font-mono transition-all cursor-pointer ${
                      serverEngine === item.id 
                        ? "bg-indigo-600/10 border-indigo-500/40 text-indigo-400" 
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-300"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Commands Output */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 font-mono">Launch Command with Aikar's Flags</span>
                  <button
                    onClick={() => handleCopy(getFullAikarCommand(), "aikar")}
                    className="flex items-center gap-1 text-[10px] bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-800 px-2.5 py-1 rounded text-slate-300 font-mono cursor-pointer transition-all"
                  >
                    {copiedText === "aikar" ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-400" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        Copy Command
                      </>
                    )}
                  </button>
                </div>
                <div className="relative">
                  <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs font-mono text-slate-300 overflow-x-auto scrollbar-thin whitespace-pre-wrap leading-normal break-all">
                    <code>{getFullAikarCommand()}</code>
                  </pre>
                </div>
              </div>

              {/* Pro Tip Card */}
              <div className="flex items-start gap-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 text-indigo-400 text-xs">
                <Sparkles className="h-5 w-5 shrink-0 text-amber-400 mt-0.5 animate-bounce" />
                <div className="space-y-1">
                  <p className="font-bold uppercase tracking-wide">🔥 Systems Administrator Pro Tip</p>
                  <p className="leading-relaxed text-indigo-300/80">
                    Always set your <code className="bg-slate-950 px-1 py-0.5 rounded text-indigo-300 font-mono">-Xms</code> (Starting Memory) and <code className="bg-slate-950 px-1 py-0.5 rounded text-indigo-300 font-mono">-Xmx</code> (Max Memory) to the exact same value if hosting on dedicated Linux instances. This locks Java's heap size, avoiding heavy CPU spikes when the OS resizes heap sectors on the fly!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 4. DEPLOY THIS BEAUTIFUL REACT CUSTOM PANEL UI */}
          {activeSubTab === "custom_panel" && (
            <div className="space-y-6 animate-fadeIn">
              {/* Core explanation */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-3">
                <div className="flex items-center gap-2 text-rose-400">
                  <Sparkles className="h-5 w-5 animate-pulse" />
                  <h5 className="font-bold text-sm text-slate-100">Make this Custom UI Panel Yours!</h5>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  You requested: <strong className="text-rose-300">"but i want my own panel my own design"</strong>.
                  This dashboard (CraftHost Companion Console) is built entirely using <strong className="text-rose-400">React 19, Tailwind CSS, Vite, and an Express proxy backend</strong>.
                  You can host and run this identical customized frontend locally on your Kali Linux system or a public VPS!
                </p>
              </div>

              {/* Troubleshooting the NPM ENOENT / EACCES errors */}
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-amber-400 font-bold font-mono text-xs uppercase tracking-wide">
                  <HelpCircle className="h-4 w-4" />
                  <span>💡 Troubleshooting NPM Errors on Kali Linux</span>
                </div>
                <div className="text-xs text-slate-300 space-y-3 leading-relaxed">
                  {/* Error 1: ENOENT */}
                  <div className="space-y-1">
                    <strong className="text-rose-400 block">🛑 Issue 1: ENOENT - No such file or directory package.json</strong>
                    <code className="block bg-slate-950 p-2 rounded font-mono text-[11px] text-rose-300 border border-slate-800">
                      npm error enoent Could not read package.json: Error: ENOENT: no such file or directory...
                    </code>
                    <p className="text-slate-400 text-[11px] pl-1 mt-1">
                      <strong>Why:</strong> You were in your home folder (<code className="text-slate-300 font-mono">/home/strkxx</code>) instead of the project directory.
                      <strong className="text-emerald-400"> Fix:</strong> Always run <code className="bg-slate-900 px-1 py-0.5 rounded font-mono text-slate-200">cd /var/www/craft-dashboard</code> before running npm commands.
                    </p>
                  </div>

                  {/* Error 2: EACCES */}
                  <div className="space-y-1">
                    <strong className="text-rose-400 block">🛑 Issue 2: EACCES - Permission Denied opening 'package-lock.json'</strong>
                    <code className="block bg-slate-950 p-2 rounded font-mono text-[11px] text-rose-300 border border-slate-800">
                      npm error Error: EACCES: permission denied, open '/var/www/craft-dashboard/package-lock.json'
                    </code>
                    <p className="text-slate-400 text-[11px] pl-1 mt-1">
                      <strong>Why:</strong> When files in <code className="text-slate-300 font-mono">/var/www/</code> are owned by the `root` user, standard users cannot edit them.
                      <br />
                      <strong className="text-emerald-400">👉 How to fix it instantly:</strong> Run this command:
                    </p>
                    <div className="relative mt-1">
                      <code className="block bg-slate-950 p-2 rounded text-xs text-emerald-400 font-mono">sudo chown -R $USER:$USER /var/www/craft-dashboard</code>
                    </div>
                  </div>

                  {/* Error 3: Deleted Working Directory (PWD Lost) */}
                  <div className="space-y-1">
                    <strong className="text-amber-400 block">🛑 Issue 3: Git Clone Failed with "fatal: Unable to read current working directory"</strong>
                    <p className="text-slate-400 text-[11px] pl-1">
                      <strong>Why this happens:</strong> You were inside the folder <code className="text-slate-300 font-mono">/var/www/craft-dashboard</code> in your terminal when you ran <code className="text-rose-300 font-mono">sudo rm -rf /var/www/craft-dashboard</code>.
                      <br />
                      This deleted the very folder you were currently standing in! Your Linux shell became "lost" (its active working directory inode no longer exists), causing <code className="text-rose-400 font-mono">git clone</code> to fail with <code className="text-rose-400 font-mono">fatal: Unable to read current working directory: No such file or directory</code>.
                    </p>
                    <p className="text-emerald-400 text-[11px] pl-1 font-semibold mt-1.5">
                      👉 <strong>The 100% Instant Fix (Reset working directory & Clone again):</strong>
                    </p>
                    <p className="text-slate-300 text-[11px] pl-1">
                      Run this single block of commands. It switches your terminal back to a safe folder (<code className="text-amber-400 font-mono">cd ~</code>), safely recreates the directory, clones your real repository (<strong className="text-indigo-400 font-semibold">perplex-dashboard</strong>), changes into the new directory, installs all packages, and starts the panel!
                    </p>
                    <div className="relative mt-2">
                      <pre className="bg-slate-950 p-2.5 rounded text-[11px] text-emerald-400 font-mono overflow-x-auto whitespace-pre">
{`# 1. CD to your user home directory first so your terminal is not "lost"!
cd ~

# 2. Recreate the dashboard directory with correct permissions
sudo rm -rf /var/www/craft-dashboard
sudo mkdir -p /var/www/craft-dashboard
sudo chown -R $USER:$USER /var/www/craft-dashboard

# 3. Clone your GitHub repository into the directory
git clone https://github.com/ppie-png/perplex-dashboard.git /var/www/craft-dashboard

# 4. NOW enter the cloned directory (where package.json actually exists!)
cd /var/www/craft-dashboard

# 5. Install all dependencies and build the app
npm install
npm run build

# 6. Start the production backend server!
npm start`}
                      </pre>
                      <button
                        onClick={() => handleCopy(`cd ~\nsudo rm -rf /var/www/craft-dashboard\nsudo mkdir -p /var/www/craft-dashboard\nsudo chown -R $USER:$USER /var/www/craft-dashboard\ngit clone https://github.com/ppie-png/perplex-dashboard.git /var/www/craft-dashboard\ncd /var/www/craft-dashboard\nnpm install\nnpm run build\nnpm start`, "git_clone_fix")}
                        className="absolute top-2 right-2 flex items-center gap-1 text-[9px] bg-slate-900 hover:bg-slate-800 text-slate-300 font-mono border border-slate-800 px-2 py-0.5 rounded cursor-pointer"
                      >
                        {copiedText === "git_clone_fix" ? "Copied!" : "Copy Fix Commands"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step by step Domain & Production Setup Walkthrough */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-1.5">
                  <ArrowRight className="h-4 w-4 text-emerald-400 animate-pulse" />
                  <h6 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">🌐 Map Your Domain to This Custom Dashboard (Nginx Reverse Proxy)</h6>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {/* Production Running via PM2 */}
                  <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 space-y-2">
                    <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-emerald-500/20 uppercase">Step 1: Keep App Running in the Background with PM2</span>
                    <p className="text-xs text-slate-400 leading-normal">
                      We want the app to stay online 24/7 even after closing your terminal. Let's use <strong className="text-slate-200">PM2</strong>:
                    </p>
                    <div className="relative">
                      <pre className="bg-slate-950 p-3 rounded-lg text-xs font-mono text-emerald-400 overflow-x-auto whitespace-pre">
{`# Install PM2 globally
sudo npm install -g pm2

# CD to your dashboard
cd /var/www/craft-dashboard

# Start the built production app CJS server with PM2
pm2 start dist/server.cjs --name "craft-dashboard"

# Make PM2 restart automatically when system reboots
pm2 startup
pm2 save`}
                      </pre>
                      <button
                        onClick={() => handleCopy(`sudo npm install -g pm2\ncd /var/www/craft-dashboard\npm2 start dist/server.cjs --name "craft-dashboard"\npm2 startup\npm2 save`, "pm2_setup")}
                        className="absolute top-2 right-2 flex items-center gap-1 text-[10px] bg-slate-900 hover:bg-slate-800 text-slate-300 font-mono border border-slate-800 px-2 py-0.5 rounded cursor-pointer"
                      >
                        {copiedText === "pm2_setup" ? "Copied!" : "Copy"}
                      </button>
                    </div>
                  </div>

                  {/* Nginx Configuration */}
                  <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 space-y-2">
                    <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-emerald-500/20 uppercase">Step 2: Configure Nginx to Route Your Domain to Port 3000</span>
                    <p className="text-xs text-slate-400 leading-normal">
                      Create an Nginx configuration file for your domain (e.g., <strong className="text-rose-300">panel.unstableuniverse.world</strong>):
                    </p>
                    <div className="relative">
                      <pre className="bg-slate-950 p-3 rounded-lg text-[11px] font-mono text-indigo-400 overflow-x-auto whitespace-pre">
{`# Create a new site config (replace panel.unstableuniverse.world with your real domain)
sudo nano /etc/nginx/sites-available/craft-dashboard`}
                      </pre>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Paste the following block into the file and save it (Ctrl+O, Enter, Ctrl+X):
                    </p>
                    <div className="relative">
                      <pre className="bg-slate-950 p-3 rounded-lg text-[11px] font-mono text-indigo-300 overflow-x-auto whitespace-pre">
{`server {
    listen 80;
    server_name panel.unstableuniverse.world; # <-- Replace with your domain

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}`}
                      </pre>
                      <button
                        onClick={() => handleCopy(`server {\n    listen 80;\n    server_name panel.unstableuniverse.world;\n\n    location / {\n        proxy_pass http://127.0.0.1:3000;\n        proxy_http_version 1.1;\n        proxy_set_header Upgrade $http_upgrade;\n        proxy_set_header Connection 'upgrade';\n        proxy_set_header Host $host;\n        proxy_cache_bypass $http_upgrade;\n        proxy_set_header X-Real-IP $remote_addr;\n        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n    }\n}`, "nginx_block")}
                        className="absolute top-2 right-2 flex items-center gap-1 text-[10px] bg-slate-900 hover:bg-slate-800 text-slate-300 font-mono border border-slate-800 px-2 py-0.5 rounded cursor-pointer"
                      >
                        {copiedText === "nginx_block" ? "Copied!" : "Copy"}
                      </button>
                    </div>

                    <p className="text-xs text-slate-400 mt-2">
                      Now, enable this site, test Nginx, and restart the Nginx service:
                    </p>
                    <div className="relative">
                      <pre className="bg-slate-950 p-3 rounded-lg text-xs font-mono text-emerald-400 overflow-x-auto whitespace-pre">
{`# Link the configuration to make it active
sudo ln -sf /etc/nginx/sites-available/craft-dashboard /etc/nginx/sites-enabled/

# Test Nginx for any syntax errors
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx`}
                      </pre>
                      <button
                        onClick={() => handleCopy(`sudo ln -sf /etc/nginx/sites-available/craft-dashboard /etc/nginx/sites-enabled/\nsudo nginx -t\nsudo systemctl restart nginx`, "nginx_restart")}
                        className="absolute top-2 right-2 flex items-center gap-1 text-[10px] bg-slate-900 hover:bg-slate-800 text-slate-300 font-mono border border-slate-800 px-2 py-0.5 rounded cursor-pointer"
                      >
                        {copiedText === "nginx_restart" ? "Copied!" : "Copy"}
                      </button>
                    </div>
                  </div>

                  {/* Certbot SSL */}
                  <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 space-y-2">
                    <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-emerald-500/20 uppercase">Step 3: Secure Your Panel with Free HTTPS (Let's Encrypt SSL)</span>
                    <p className="text-xs text-slate-400 leading-normal">
                      Let's secure your domain with an SSL Certificate so everyone can access your custom panel safely over HTTPS:
                    </p>
                    <div className="relative">
                      <pre className="bg-slate-950 p-3 rounded-lg text-xs font-mono text-emerald-400 overflow-x-auto whitespace-pre">
{`# Install Certbot and its Nginx plugin
sudo apt update
sudo apt install -y certbot python3-certbot-nginx

# Obtain and automatically configure SSL certificate
sudo certbot --nginx -d panel.unstableuniverse.world`}
                      </pre>
                      <button
                        onClick={() => handleCopy(`sudo apt update\nsudo apt install -y certbot python3-certbot-nginx\nsudo certbot --nginx -d panel.unstableuniverse.world`, "ssl_certbot")}
                        className="absolute top-2 right-2 flex items-center gap-1 text-[10px] bg-slate-900 hover:bg-slate-800 text-slate-300 font-mono border border-slate-800 px-2 py-0.5 rounded cursor-pointer"
                      >
                        {copiedText === "ssl_certbot" ? "Copied!" : "Copy"}
                      </button>
                    </div>
                    <p className="text-[11px] text-emerald-400 leading-normal font-semibold">
                      ✨ Done! Your beautiful custom dashboard panel is now live on your domain over a secure connection! Anyone can access it at <code className="underline">https://panel.unstableuniverse.world</code>!
                    </p>
                  </div>
                </div>
              </div>

              {/* Connecting with real Pterodactyl Backend info */}
              <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 text-xs space-y-2">
                <span className="block font-bold text-slate-100 uppercase font-mono tracking-wider text-[11px] text-amber-400">🔗 How to connect this custom UI with your real Pterodactyl Panel</span>
                <p className="leading-relaxed text-indigo-200">
                  This custom dashboard contains fully interactive tabs for live console, files, databases, backups, and settings. To connect it to control your real game servers:
                </p>
                <ol className="list-decimal list-inside space-y-1.5 text-indigo-300/95 pl-1 leading-relaxed">
                  <li>Go to your real Pterodactyl Panel admin settings, create an <strong>Application API Key</strong> or <strong>Client API Key</strong>.</li>
                  <li>In your custom dashboard's <code className="bg-slate-950 px-1 py-0.5 rounded text-indigo-400 font-mono">server.ts</code>, you can add routes to make HTTP proxy requests to <code className="bg-slate-950 px-1 py-0.5 rounded text-indigo-400 font-mono">https://panel.unstableuniverse.world/api/client</code> sending the API key as a Bearer Token.</li>
                  <li>This secure Express backend proxies all your requests safely so your API keys are never exposed in the browser!</li>
                </ol>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
