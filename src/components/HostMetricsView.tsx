import React, { useState, useEffect } from "react";
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Cpu, 
  HardDrive, 
  Zap, 
  Trash2, 
  PlusCircle, 
  Clock, 
  RefreshCw,
  Sliders,
  AlertCircle
} from "lucide-react";

interface ErrorLog {
  id: string;
  timestamp: string;
  type: string;
  message: string;
  severity: "info" | "warning" | "critical";
  resolved: boolean;
}

interface PressureLog {
  time: string;
  cpu: number;
  ram: number;
  disk: number;
  network: number;
}

interface NodeResources {
  totalCpu: number;
  totalRam: number;
  totalDisk: number;
  allocatedCpu: number;
  allocatedRam: number;
  allocatedDisk: number;
}

export default function HostMetricsView({ userRole }: { userRole: string }) {
  const [errors, setErrors] = useState<ErrorLog[]>([]);
  const [pressure, setPressure] = useState<PressureLog[]>([]);
  const [nodeRes, setNodeRes] = useState<NodeResources | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Form states to log a custom simulated error
  const [simErrorType, setSimErrorType] = useState("OOM_KILLER");
  const [simErrorMessage, setSimErrorMessage] = useState("Process 'java' (Minecraft SMP) terminated by Linux OOM manager.");
  const [simErrorSeverity, setSimErrorSeverity] = useState<"info" | "warning" | "critical">("critical");

  const fetchData = async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/db");
      if (res.ok) {
        const data = await res.json();
        setErrors(data.errors || []);
        setPressure(data.pressureLogs || []);
        setNodeRes(data.nodeResources || null);
      }
    } catch (err) {
      console.error("Failed to fetch host telemetry databases:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleResolveError = async (id: string) => {
    try {
      const res = await fetch(`/api/errors/${id}/resolve`, { method: "POST" });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error("Failed to resolve error:", err);
    }
  };

  const handleInjectError = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/errors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: simErrorType,
          message: simErrorMessage,
          severity: simErrorSeverity
        })
      });
      if (res.ok) {
        fetchData();
        setSimErrorMessage("");
      }
    } catch (err) {
      console.error("Failed to inject test error:", err);
    }
  };

  const handleInjectPressure = async () => {
    // Generate simulated spike
    const cpuSpike = Math.floor(Math.random() * 30) + 65; // 65% - 95%
    const ramSpike = Math.floor(Math.random() * 20) + 70; // 70% - 90%
    const diskSpike = Math.floor(Math.random() * 10) + 40;
    const netSpike = Math.floor(Math.random() * 80) + 120; // Mbps

    try {
      const res = await fetch("/api/pressure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cpu: cpuSpike,
          ram: ramSpike,
          disk: diskSpike,
          network: netSpike
        })
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error("Failed to submit telemetry pressure entry:", err);
    }
  };

  // Compute stats helper
  const unhandledErrors = errors.filter(e => !e.resolved);

  return (
    <div className="space-y-6" id="host-metrics-telemetry-view">
      {/* Telemetry Header */}
      <div className="bg-slate-900 border border-violet-950/40 rounded-2xl p-6 relative overflow-hidden shadow-neon-purple/5">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Activity className="h-5 w-5 text-purple-400 animate-pulse" />
              Node Host Telemetry & Error Databases
            </h3>
            <p className="text-xs text-slate-400 max-w-xl">
              Inspect persistent logs, hardware stress factors, kernel warnings, and error triggers backed by our secure file database.
            </p>
          </div>
          <button 
            onClick={fetchData} 
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950 hover:bg-slate-850 rounded-lg border border-violet-950/50 text-xs text-purple-300 font-mono transition-all cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin text-purple-400" : ""}`} />
            <span>Sync Live DB</span>
          </button>
        </div>
      </div>

      {/* Grid of indicators */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-950/90 border border-violet-950/30 rounded-xl p-4 flex items-center gap-3 shadow-inner">
          <div className="p-2.5 bg-red-500/10 text-red-400 rounded-lg border border-red-500/20">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Unresolved Faults</p>
            <p className="font-mono text-xl font-extrabold text-red-400">{unhandledErrors.length}</p>
          </div>
        </div>

        <div className="bg-slate-950/90 border border-violet-950/30 rounded-xl p-4 flex items-center gap-3 shadow-inner">
          <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/20">
            <Cpu className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Host Cores (VM Limit)</p>
            <p className="font-mono text-xl font-extrabold text-amber-400">
              {nodeRes ? `${nodeRes.allocatedCpu} / ${nodeRes.totalCpu}` : "16"} Cores
            </p>
          </div>
        </div>

        <div className="bg-slate-950/90 border border-violet-950/30 rounded-xl p-4 flex items-center gap-3 shadow-inner">
          <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
            <Sliders className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Node Memory Total</p>
            <p className="font-mono text-xl font-extrabold text-emerald-400">
              {nodeRes ? `${nodeRes.allocatedRam} / ${nodeRes.totalRam}` : "64"} GB
            </p>
          </div>
        </div>

        <div className="bg-slate-950/90 border border-violet-950/30 rounded-xl p-4 flex items-center gap-3 shadow-inner">
          <div className="p-2.5 bg-purple-500/10 text-purple-400 rounded-lg border border-purple-500/20">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Persistent Logs Active</p>
            <p className="font-mono text-xl font-extrabold text-purple-400">{errors.length + pressure.length}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pressure Stress Chart & Injector */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-sm font-bold text-slate-200">Host Core Stress Factors (Pressure Logs)</h4>
              <p className="text-[11px] text-slate-400 mt-1">Real-time database records tracking system loads against physical restarts.</p>
            </div>
            <button
              onClick={handleInjectPressure}
              className="px-2.5 py-1 bg-purple-900/40 hover:bg-purple-900/70 text-purple-300 rounded border border-purple-800/40 text-[10px] font-mono transition-all flex items-center gap-1 cursor-pointer"
            >
              <Zap className="h-3.5 w-3.5" />
              <span>Simulate Load Spike</span>
            </button>
          </div>

          {/* Custom SVG Glowing Line Chart */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 h-56 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_bottom,rgba(168,85,247,0.03)_0%,transparent_70%)]"></div>
            
            {pressure.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-500 space-y-1">
                <AlertCircle className="h-8 w-8 text-purple-400/50 animate-bounce" />
                <span className="text-xs font-mono">No load pressure data logged in db.json yet.</span>
                <span className="text-[10px] text-slate-600">Click "Simulate Load Spike" to seed the database!</span>
              </div>
            ) : (
              <div className="flex-1 w-full flex items-end justify-between relative h-40 pt-4">
                {/* SVG Rendered Line for CPU & RAM Stress */}
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 100" preserveAspectRatio="none">
                  {/* Grid Lines */}
                  <line x1="0" y1="25" x2="400" y2="25" stroke="rgba(139, 92, 246, 0.05)" strokeWidth="1" />
                  <line x1="0" y1="50" x2="400" y2="50" stroke="rgba(139, 92, 246, 0.05)" strokeWidth="1" />
                  <line x1="0" y1="75" x2="400" y2="75" stroke="rgba(139, 92, 246, 0.05)" strokeWidth="1" />

                  {/* CPU Line */}
                  <path
                    d={`M ${pressure.map((p, i) => `${(i / (pressure.length - 1)) * 400},${100 - p.cpu}`).join(" L ")}`}
                    fill="none"
                    stroke="#a855f7"
                    strokeWidth="2.5"
                    className="drop-shadow-[0_0_4px_rgba(168,85,247,0.8)]"
                  />
                  {/* RAM Line */}
                  <path
                    d={`M ${pressure.map((p, i) => `${(i / (pressure.length - 1)) * 400},${100 - p.ram}`).join(" L ")}`}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="1.5"
                    strokeDasharray="4"
                  />
                </svg>

                {/* Display Columns */}
                {pressure.map((p, i) => (
                  <div key={i} className="flex flex-col items-center z-10 w-full group">
                    <div className="absolute bottom-16 bg-slate-900 border border-purple-950 px-2 py-1 rounded text-[9px] font-mono text-purple-300 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                      <div>CPU: {p.cpu}%</div>
                      <div>RAM: {p.ram}%</div>
                      <div>Net: {p.network} Mbps</div>
                    </div>
                    <span className="text-[8px] text-slate-500 font-mono mt-auto">{p.time}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="border-t border-slate-900 pt-2 flex items-center justify-between text-[10px] text-slate-500 font-mono shrink-0">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-purple-500"></span> CPU Cores Load</span>
                <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span> Memory Pressure</span>
              </div>
              <span>Database Size: {pressure.length}/15 history rows</span>
            </div>
          </div>

          {/* Custom Error Logger Form */}
          <div className="bg-slate-950/50 rounded-xl p-4 border border-slate-800 space-y-3">
            <h5 className="text-xs font-bold text-slate-300 flex items-center gap-1">
              <PlusCircle className="h-4 w-4 text-purple-400" />
              Inject Simulated Host Error (Testing Persistence)
            </h5>
            
            <form onSubmit={handleInjectError} className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="space-y-1">
                <label className="text-slate-400 font-medium block">Fault Signature / Code</label>
                <select 
                  value={simErrorType}
                  onChange={e => setSimErrorType(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 focus:border-purple-500/50 rounded-lg p-2 font-mono text-slate-200 outline-none"
                >
                  <option value="DOCKER_CONTAINER_FAULT">DOCKER_CONTAINER_FAULT</option>
                  <option value="OOM_KILLER">OOM_KILLER (Kernel Event)</option>
                  <option value="DISK_SPACE_EXHAUSTED">DISK_SPACE_EXHAUSTED</option>
                  <option value="SSL_EXPIRED_CERTIFICATE">SSL_EXPIRED_CERTIFICATE</option>
                  <option value="MYSQL_CONNECTION_FAILURE">MYSQL_CONNECTION_FAILURE</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-medium block">Severity Level</label>
                <select 
                  value={simErrorSeverity}
                  onChange={e => setSimErrorSeverity(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-800 focus:border-purple-500/50 rounded-lg p-2 text-slate-300 outline-none font-mono"
                >
                  <option value="info">Info (Non-critical)</option>
                  <option value="warning">Warning (Requires Attention)</option>
                  <option value="critical">Critical (Service Interruption)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-medium block">Custom Incident Log Description</label>
                <input 
                  type="text"
                  placeholder="e.g. Partition /dev/sdb1 space at 98%..."
                  value={simErrorMessage}
                  onChange={e => setSimErrorMessage(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 focus:border-purple-500/50 rounded-lg p-2 text-slate-200 outline-none"
                />
              </div>

              <div className="md:col-span-3 flex justify-end">
                <button
                  type="submit"
                  disabled={!simErrorMessage.trim()}
                  className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-4 py-1.5 rounded-lg text-xs transition-all cursor-pointer flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <PlusCircle className="h-3.5 w-3.5" />
                  <span>Log to db.json</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Persistent Error Logs Side panel */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 lg:col-span-1">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-sm font-bold text-slate-200">Active Incidents ({unhandledErrors.length})</h4>
              <p className="text-[11px] text-slate-400 mt-1">Pending host node anomalies stored persistently.</p>
            </div>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {errors.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-xs font-mono">
                🎉 Absolute peaceful tranquility. No errors logged in database.
              </div>
            ) : (
              [...errors].reverse().map(err => (
                <div 
                  key={err.id}
                  className={`border rounded-xl p-3 space-y-2 transition-all ${
                    err.resolved 
                      ? "bg-slate-950/40 border-slate-900 opacity-60" 
                      : err.severity === "critical"
                      ? "bg-red-950/15 border-red-900/40 hover:border-red-900/70"
                      : err.severity === "warning"
                      ? "bg-amber-950/15 border-amber-900/40 hover:border-amber-900/70"
                      : "bg-blue-950/15 border-blue-900/40 hover:border-blue-900/70"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${
                      err.severity === "critical" ? "bg-red-500/20 text-red-400" :
                      err.severity === "warning" ? "bg-amber-500/20 text-amber-400" :
                      "bg-blue-500/20 text-blue-400"
                    }`}>
                      {err.severity}
                    </span>
                    <span className="text-[9px] text-slate-500 font-mono flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(err.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h6 className="font-mono text-xs font-extrabold text-slate-200">{err.type}</h6>
                    <p className="text-[11px] text-slate-400 leading-normal">{err.message}</p>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-950">
                    <span className="text-[10px] text-slate-500 font-mono">ID: {err.id.slice(0, 10)}...</span>
                    
                    {err.resolved ? (
                      <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
                        <CheckCircle className="h-3.5 w-3.5" /> Resolved
                      </span>
                    ) : (
                      userRole === "admin" ? (
                        <button
                          onClick={() => handleResolveError(err.id)}
                          className="px-2 py-1 bg-slate-950 hover:bg-emerald-950 hover:text-emerald-400 rounded text-[9px] font-mono border border-slate-800 hover:border-emerald-900 transition-all cursor-pointer"
                        >
                          Resolve & Clear
                        </button>
                      ) : (
                        <span className="text-[9px] text-slate-600 font-mono">Locked (Admin Only)</span>
                      )
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
