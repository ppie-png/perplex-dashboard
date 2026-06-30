import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Trash2, 
  Layers, 
  Cpu, 
  HardDrive, 
  Database as DbIcon, 
  Activity, 
  Sliders, 
  ArrowUpRight, 
  Check, 
  ShieldAlert, 
  Info,
  ExternalLink,
  Edit2
} from "lucide-react";

interface NodeResource {
  totalCpu: number; // in cores
  totalRam: number; // in GB
  totalDisk: number; // in GB
  allocatedCpu: number;
  allocatedRam: number;
  allocatedDisk: number;
}

interface SplitInstance {
  id: string;
  name: string;
  type: string;
  owner: string;
  cpuLimit: number; // cores
  ramLimit: number; // GB
  diskLimit: number; // GB
  status: "active" | "offline" | "installing";
  port: number;
}

export default function ServerSplitterView({ userRole = "admin", username = "admin" }: { userRole?: string; username?: string }) {
  const [node, setNode] = useState<NodeResource>({
    totalCpu: 16,
    totalRam: 64,
    totalDisk: 500,
    allocatedCpu: 9.5,
    allocatedRam: 38,
    allocatedDisk: 280
  });

  const [instances, setInstances] = useState<SplitInstance[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("Paper Minecraft");
  const [newOwner, setNewOwner] = useState("client");
  const [newCpu, setNewCpu] = useState(2);
  const [newRam, setNewRam] = useState(8);
  const [newDisk, setNewDisk] = useState(50);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Smart Overcommit / Overallocation system
  const [overcommitRatio, setOvercommitRatio] = useState<number>(() => {
    const cached = localStorage.getItem("node_overcommit_ratio");
    return cached ? Number(cached) : 150; // default to 150% overcommit (industry standard smart hosting)
  });

  const virtualTotalCpu = Number((node.totalCpu * (overcommitRatio / 100)).toFixed(1));
  const virtualTotalRam = Math.floor(node.totalRam * (overcommitRatio / 100));

  const freeCpu = virtualTotalCpu - node.allocatedCpu;
  const freeRam = virtualTotalRam - node.allocatedRam;
  const freeDisk = node.totalDisk - node.allocatedDisk;

  const handleOvercommitChange = (val: number) => {
    setOvercommitRatio(val);
    localStorage.setItem("node_overcommit_ratio", val.toString());
  };

  const refreshData = async () => {
    try {
      const res = await fetch("/api/db");
      if (res.ok) {
        const data = await res.json();
        setInstances(data.instances || []);
        if (data.nodeResources) {
          setNode(data.nodeResources);
        }
      }
    } catch (err) {
      console.error("Failed to load server partitions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleCreateSplit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userRole !== "admin") {
      setErrorMsg("Access Denied: Only root administrators can partition host resources.");
      return;
    }

    if (!newName.trim()) {
      setErrorMsg("Please specify a unique instance name.");
      return;
    }

    if (newCpu > freeCpu) {
      setErrorMsg(`Insufficient CPU cores available! (Need ${newCpu} Cores, only ${freeCpu.toFixed(1)} free under ${overcommitRatio}% Overcommit).`);
      return;
    }
    if (newRam > freeRam) {
      setErrorMsg(`Insufficient Node RAM available! (Need ${newRam} GB, only ${freeRam} GB free under ${overcommitRatio}% Overcommit).`);
      return;
    }
    if (newDisk > freeDisk) {
      setErrorMsg(`Insufficient Disk storage available! (Need ${newDisk} GB, only ${freeDisk} GB free).`);
      return;
    }

    try {
      const randomPort = Math.floor(Math.random() * 9000) + 10000;
      const res = await fetch("/api/instances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          type: newType,
          owner: newOwner,
          cpuLimit: newCpu,
          ramLimit: newRam,
          diskLimit: newDisk,
          port: randomPort
        })
      });

      if (res.ok) {
        setSuccessMsg(`Successfully partitioned & allocated server "${newName}" on Port ${randomPort}!`);
        setNewName("");
        setErrorMsg("");
        refreshData();
        setTimeout(() => setSuccessMsg(""), 5000);
      } else {
        const err = await res.json();
        setErrorMsg(err.error || "Failed to create partition");
      }
    } catch (err) {
      setErrorMsg("Network error trying to contact the host agent.");
    }
  };

  const handleDeleteSplit = async (id: string) => {
    if (userRole !== "admin") {
      alert("Access Denied: Only root administrators can delete server partitions.");
      return;
    }

    const inst = instances.find(i => i.id === id);
    if (!inst) return;

    if (confirm(`Are you absolutely sure you want to delete and destroy "${inst.name}"? All data inside this split container will be permanently wiped!`)) {
      try {
        const res = await fetch(`/api/instances/${id}`, { method: "DELETE" });
        if (res.ok) {
          refreshData();
        } else {
          alert("Failed to destroy server partition.");
        }
      } catch (err) {
        console.error("Error deleting partition:", err);
      }
    }
  };

  return (
    <div className="space-y-6" id="server-splitter-view">
      {/* Overview Block */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <Layers className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                Server Splitter & Node Partitioning
                <span className="text-[10px] bg-slate-950 text-emerald-400 font-mono font-bold px-2 py-0.5 rounded border border-emerald-500/20">ROOT ACTIVE</span>
              </h3>
              <p className="text-xs text-slate-400 max-w-xl">
                Divide your primary dedicated host node into multiple individual VPS/container server instances with isolated ports, memory limits, and file networks.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
            <Activity className="h-4 w-4 text-emerald-400 animate-pulse" />
            <span>Master Node: <strong className="text-slate-200">node-01.perplex.host</strong></span>
          </div>
        </div>

        {/* Smart Overcommit Panel / Overallocation Ratio */}
        <div className="bg-slate-950/40 border border-violet-950/40 rounded-xl p-4 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5 font-mono">
              <span className="h-2 w-2 rounded-full bg-purple-500 animate-pulse"></span>
              Smart Overcommit & Overallocation System
            </h4>
            <p className="text-[11px] text-slate-400 max-w-xl">
              Since game servers rarely hit maximum memory/CPU limits simultaneously, you can overallocate resources to accommodate more clients. Currently overcommitting at <strong className="text-purple-400 font-mono">{overcommitRatio}%</strong>.
            </p>
          </div>
          <div className="flex items-center gap-3 bg-slate-950/80 border border-violet-900/30 rounded-xl p-2 font-mono text-[11px] min-w-[240px]">
            <span className="text-slate-500 font-bold">Ratio:</span>
            <input 
              type="range"
              min="100"
              max="200"
              step="5"
              value={overcommitRatio}
              onChange={e => handleOvercommitChange(Number(e.target.value))}
              className="flex-1 accent-purple-500 h-1 bg-slate-800 rounded outline-none cursor-pointer"
            />
            <span className="text-purple-300 font-bold w-12 text-right">{overcommitRatio}%</span>
          </div>
        </div>

        {/* Node Stats Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* CPU Core Allocation */}
          <div className="bg-slate-950/60 rounded-xl p-4 border border-violet-950/20 space-y-3 shadow-inner">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium flex items-center gap-1.5">
                <Cpu className="h-4 w-4 text-purple-400" /> CPU Cores Allocated
              </span>
              <span className="font-mono font-bold text-slate-200">
                {node.allocatedCpu} / <span className="text-purple-400 font-extrabold">{virtualTotalCpu}</span> vCores
              </span>
            </div>
            <div className="h-2 w-full bg-slate-850 rounded-full overflow-hidden">
              <div 
                className="h-full bg-purple-500 rounded-full transition-all duration-500 shadow-neon-purple"
                style={{ width: `${Math.min(100, (node.allocatedCpu / virtualTotalCpu) * 100)}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>{Math.min(100, Number((node.allocatedCpu / virtualTotalCpu * 100).toFixed(0)))}% Virtual Load</span>
              <span className="text-slate-400 font-bold">{freeCpu.toFixed(1)} vCores Free</span>
            </div>
          </div>

          {/* RAM Allocation */}
          <div className="bg-slate-950/60 rounded-xl p-4 border border-violet-950/20 space-y-3 shadow-inner">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium flex items-center gap-1.5">
                <Sliders className="h-4 w-4 text-emerald-400" /> Memory Resource Allocation
              </span>
              <span className="font-mono font-bold text-slate-200">
                {node.allocatedRam} GB / <span className="text-emerald-400 font-extrabold">{virtualTotalRam}</span> GB
              </span>
            </div>
            <div className="h-2 w-full bg-slate-850 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (node.allocatedRam / virtualTotalRam) * 100)}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>{Math.min(100, Number((node.allocatedRam / virtualTotalRam * 100).toFixed(0)))}% Allocated</span>
              <span className="text-emerald-400 font-bold">{freeRam} GB Virtual Free</span>
            </div>
          </div>

          {/* Disk Allocation */}
          <div className="bg-slate-950/60 rounded-xl p-4 border border-violet-950/20 space-y-3 shadow-inner">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium flex items-center gap-1.5">
                <HardDrive className="h-4 w-4 text-sky-400" /> SSD Storage Allocated
              </span>
              <span className="font-mono font-bold text-slate-200">
                {node.allocatedDisk} GB / {node.totalDisk} GB
              </span>
            </div>
            <div className="h-2 w-full bg-slate-850 rounded-full overflow-hidden">
              <div 
                className="h-full bg-sky-500 rounded-full transition-all duration-500"
                style={{ width: `${(node.allocatedDisk / node.totalDisk) * 100}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>{(node.allocatedDisk / node.totalDisk * 100).toFixed(0)}% Occupied</span>
              <span className="text-sky-400 font-bold">{freeDisk} GB Remaining</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Partition Form Panel */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 lg:col-span-1">
          <div className="border-b border-slate-800 pb-3">
            <h4 className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
              <Plus className="h-4 w-4 text-emerald-400" /> Partition New Server
            </h4>
            <p className="text-[11px] text-slate-400 mt-1">
              Select resources to carve out from your main dedicated host.
            </p>
          </div>

          <form onSubmit={handleCreateSplit} className="space-y-4 text-xs">
            {/* Instance Name */}
            <div className="space-y-1.5">
              <label className="text-slate-400 font-medium block">Instance Name</label>
              <input 
                type="text"
                placeholder="e.g. survival-smp-2"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500/50 rounded-lg p-2.5 font-mono text-slate-200 outline-none"
              />
            </div>

            {/* Template Selector */}
            <div className="space-y-1.5">
              <label className="text-slate-400 font-medium block">Instance Base Engine</label>
              <select 
                value={newType}
                onChange={e => setNewType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500/50 rounded-lg p-2.5 font-mono text-slate-300 outline-none"
              >
                <option value="Paper Minecraft">Paper Minecraft (Java Edition)</option>
                <option value="BungeeCord Proxy">BungeeCord Network Proxy</option>
                <option value="Discord Bot (Node.js)">Discord Bot (Node.js/Python)</option>
                <option value="MySQL Database">Isolated MySQL Container</option>
                <option value="Linux Core (Debian)">Core Shell Debian Instance</option>
                <option value="Palworld Server">Palworld Dedicated Server</option>
              </select>
            </div>

            {/* Owner Selector */}
            <div className="space-y-1.5">
              <label className="text-slate-400 font-medium block">Owner Permission Access</label>
              <select 
                value={newOwner}
                onChange={e => setNewOwner(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500/50 rounded-lg p-2.5 text-slate-300 outline-none font-mono"
              >
                <option value="strkxx">strkxx (Root Administrator)</option>
                <option value="moderator">moderator (Sub-user)</option>
                <option value="external_client">external_client (Developer)</option>
              </select>
            </div>

            {/* CPU Slider */}
            <div className="space-y-1.5 bg-slate-950/40 p-3 rounded-lg border border-slate-800/60">
              <div className="flex items-center justify-between font-mono text-[11px] mb-1">
                <span className="text-slate-400">Allocate CPU Cores</span>
                <span className="text-emerald-400 font-bold">{newCpu} Cores</span>
              </div>
              <input 
                type="range"
                min="0.5"
                max="8"
                step="0.5"
                value={newCpu}
                onChange={e => setNewCpu(parseFloat(e.target.value))}
                className="w-full accent-emerald-500 bg-slate-800 h-1 rounded-lg outline-none cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                <span>Min: 0.5 Cores</span>
                <span>Max: 8.0 Cores</span>
              </div>
            </div>

            {/* RAM Slider */}
            <div className="space-y-1.5 bg-slate-950/40 p-3 rounded-lg border border-slate-800/60">
              <div className="flex items-center justify-between font-mono text-[11px] mb-1">
                <span className="text-slate-400">Allocate RAM Memory</span>
                <span className="text-emerald-400 font-bold">{newRam} GB</span>
              </div>
              <input 
                type="range"
                min="1"
                max="32"
                step="1"
                value={newRam}
                onChange={e => setNewRam(parseInt(e.target.value))}
                className="w-full accent-emerald-500 bg-slate-800 h-1 rounded-lg outline-none cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                <span>Min: 1 GB</span>
                <span>Max: 32 GB</span>
              </div>
            </div>

            {/* Disk Slider */}
            <div className="space-y-1.5 bg-slate-950/40 p-3 rounded-lg border border-slate-800/60">
              <div className="flex items-center justify-between font-mono text-[11px] mb-1">
                <span className="text-slate-400">Allocate NVMe SSD Storage</span>
                <span className="text-emerald-400 font-bold">{newDisk} GB</span>
              </div>
              <input 
                type="range"
                min="5"
                max="250"
                step="5"
                value={newDisk}
                onChange={e => setNewDisk(parseInt(e.target.value))}
                className="w-full accent-emerald-500 bg-slate-800 h-1 rounded-lg outline-none cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                <span>Min: 5 GB</span>
                <span>Max: 250 GB</span>
              </div>
            </div>

            {/* Messages alerts */}
            {errorMsg && (
              <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-[10px] flex items-start gap-1.5">
                <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-[10px] flex items-start gap-1.5">
                <Check className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Split Node & Provision
            </button>
          </form>
        </div>

        {/* Existing Instances Grid */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-sm font-bold text-slate-200">Current Split Server Instances ({instances.length})</h4>
              <p className="text-[11px] text-slate-400 mt-1">Containers currently active and drawing resources from this host node.</p>
            </div>
            <span className="text-[10px] bg-slate-950 border border-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">
              Dockerized Core
            </span>
          </div>

          <div className="space-y-3">
            {instances.map(inst => (
              <div 
                key={inst.id}
                className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-700 transition-all"
              >
                {/* Info */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${
                      inst.status === "active" ? "bg-emerald-500" :
                      inst.status === "installing" ? "bg-amber-500 animate-pulse" : "bg-slate-500"
                    }`}></span>
                    <h5 className="font-bold text-sm text-slate-200">{inst.name}</h5>
                    <span className="text-[9px] bg-slate-900 border border-slate-800 text-slate-400 font-mono px-1.5 py-0.5 rounded">
                      Port: {inst.port}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400 font-mono">
                    <span>Base: <strong className="text-slate-300">{inst.type}</strong></span>
                    <span>•</span>
                    <span>Owner: <strong className="text-slate-300">{inst.owner}</strong></span>
                  </div>
                </div>

                {/* Allocated resource pills */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="bg-slate-900/80 border border-slate-800 text-[10px] text-slate-300 px-2.5 py-1 rounded-lg flex items-center gap-1">
                    <Cpu className="h-3 w-3 text-amber-400" />
                    <span className="font-mono">{inst.cpuLimit} vCores</span>
                  </span>
                  <span className="bg-slate-900/80 border border-slate-800 text-[10px] text-slate-300 px-2.5 py-1 rounded-lg flex items-center gap-1">
                    <Sliders className="h-3 w-3 text-emerald-400" />
                    <span className="font-mono">{inst.ramLimit} GB RAM</span>
                  </span>
                  <span className="bg-slate-900/80 border border-slate-800 text-[10px] text-slate-300 px-2.5 py-1 rounded-lg flex items-center gap-1">
                    <HardDrive className="h-3 w-3 text-sky-400" />
                    <span className="font-mono">{inst.diskLimit} GB NVMe</span>
                  </span>
                </div>

                {/* Operations */}
                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                  <button 
                    onClick={() => alert(`Redirecting console view to manage child server: ${inst.name}`)}
                    className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg border border-slate-800 transition-all cursor-pointer flex items-center gap-1 text-[10px]"
                    title="Open Console View"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>Manage</span>
                  </button>
                  <button 
                    onClick={() => handleDeleteSplit(inst.id)}
                    className="p-1.5 bg-slate-900 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 rounded-lg border border-slate-800 hover:border-rose-900/50 transition-all cursor-pointer"
                    title="Destroy Partition"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-emerald-950/10 border border-emerald-900/20 rounded-xl p-4 flex items-start gap-2.5 text-xs text-slate-400 leading-normal">
            <Info className="h-4.5 w-4.5 text-emerald-400 shrink-0 mt-0.5" />
            <p>
              <strong>Security & Port Guarding Isolation:</strong> Each partitioned container is securely jailed inside a dedicated Linux CGroups and Linux Namespace environment on <code className="text-emerald-400 font-mono">node-01.perplex.host</code>. Network firewall ports are isolated automatically to prevent cross-container traffic spying.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
