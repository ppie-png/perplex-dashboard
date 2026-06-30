import React, { useState, useEffect, useRef } from "react";
import { 
  Terminal, Play, Square, RotateCcw, Skull, 
  Cpu, HardDrive, Users, Activity, ChevronRight 
} from "lucide-react";
import { ServerStatus, ServerStats, ConsoleMessage } from "../types";

interface ConsoleViewProps {
  status: ServerStatus;
  stats: ServerStats;
  logs: ConsoleMessage[];
  onPowerAction: (action: 'start' | 'stop' | 'restart' | 'kill') => void;
  onSendCommand: (command: string) => void;
}

export default function ConsoleView({
  status,
  stats,
  logs,
  onPowerAction,
  onSendCommand
}: ConsoleViewProps) {
  const [commandInput, setCommandInput] = useState("");
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll terminal to bottom on new logs
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commandInput.trim()) return;
    onSendCommand(commandInput);
    setCommandInput("");
  };

  const getStatusColor = (s: ServerStatus) => {
    switch (s) {
      case "online": return "bg-emerald-500 text-emerald-500";
      case "starting": return "bg-amber-500 text-amber-500";
      case "stopping": return "bg-orange-500 text-orange-500";
      case "offline": return "bg-rose-500 text-rose-500";
    }
  };

  const getLogColor = (type: string) => {
    switch (type) {
      case "warn": return "text-amber-400";
      case "error": return "text-rose-400 font-semibold";
      case "command": return "text-sky-400 font-mono";
      case "success": return "text-emerald-400 font-medium";
      default: return "text-slate-200";
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6" id="console-view-container">
      {/* Metrics Header Dashboard */}
      <div className="lg:col-span-4 grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* CPU */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-center gap-4 shadow-sm" id="metric-cpu">
          <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-400">
            <Cpu className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase font-semibold tracking-wider">CPU Usage</p>
            <p className="text-xl font-bold font-mono text-slate-100">{status === 'offline' ? '0.0' : stats.cpu.toFixed(1)}%</p>
          </div>
        </div>

        {/* RAM */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-center gap-4 shadow-sm" id="metric-ram">
          <div className="p-3 rounded-lg bg-sky-500/10 text-sky-400">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase font-semibold tracking-wider">Memory (RAM)</p>
            <p className="text-xl font-bold font-mono text-slate-100">
              {status === 'offline' ? '0.0' : stats.ramUsed.toFixed(2)} <span className="text-xs text-slate-500 font-sans">/ {stats.ramMax} GB</span>
            </p>
          </div>
        </div>

        {/* Disk */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-center gap-4 shadow-sm" id="metric-disk">
          <div className="p-3 rounded-lg bg-indigo-500/10 text-indigo-400">
            <HardDrive className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase font-semibold tracking-wider">Disk Storage</p>
            <p className="text-xl font-bold font-mono text-slate-100">
              {stats.diskUsed.toFixed(1)} <span className="text-xs text-slate-500 font-sans">/ {stats.diskMax} GB</span>
            </p>
          </div>
        </div>

        {/* Players */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-center gap-4 shadow-sm" id="metric-players">
          <div className="p-3 rounded-lg bg-purple-500/10 text-purple-400">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase font-semibold tracking-wider">Players Online</p>
            <p className="text-xl font-bold font-mono text-slate-100">
              {status === 'offline' ? '0' : stats.playersOnline} <span className="text-xs text-slate-500 font-sans">/ {stats.playersMax}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Terminal and Power controls */}
      <div className="lg:col-span-3 flex flex-col h-[520px] bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl relative" id="console-terminal-wrapper">
        {/* Terminal Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-900/80 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-emerald-400" />
            <span className="text-sm font-semibold text-slate-200">Server Terminal Console</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-xs text-slate-400">
              <span className={`h-2.5 w-2.5 rounded-full animate-pulse ${getStatusColor(status).split(" ")[0]}`}></span>
              <span className="capitalize font-mono font-medium text-slate-300">{status}</span>
            </span>
            <div className="flex gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-700"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-slate-700"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-slate-700"></span>
            </div>
          </div>
        </div>

        {/* Logs Output */}
        <div className="flex-1 overflow-y-auto p-4 font-mono text-xs md:text-sm leading-relaxed space-y-1 select-text bg-slate-950/95 shadow-inner" id="terminal-logs-box">
          {logs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-2">
              <Terminal className="h-8 w-8 text-slate-700" />
              <p>Terminal is idle. Start the server to see logs output.</p>
            </div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="group hover:bg-slate-900/40 px-1 py-[1px] rounded transition-colors duration-150 flex items-start gap-2">
                <span className="text-slate-600 select-none shrink-0">[{log.timestamp}]</span>
                <span className={`${getLogColor(log.type)} break-all`}>{log.line}</span>
              </div>
            ))
          )}
          <div ref={terminalEndRef} />
        </div>

        {/* Command Input Form */}
        <form onSubmit={handleSubmit} className="p-3 bg-slate-900 border-t border-slate-800 flex gap-2 items-center">
          <ChevronRight className="h-4 w-4 text-slate-500 shrink-0" />
          <input
            type="text"
            value={commandInput}
            onChange={(e) => setCommandInput(e.target.value)}
            disabled={status === "offline"}
            placeholder={status === "offline" ? "Start the server to execute commands..." : "Type server command (e.g. /op steve, /say Hello!) and press Enter..."}
            className="flex-1 bg-transparent text-slate-100 placeholder-slate-500 font-mono text-sm focus:outline-none disabled:cursor-not-allowed"
            id="console-input"
          />
          <button
            type="submit"
            disabled={status === "offline" || !commandInput.trim()}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs px-3 py-1 rounded transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            id="send-command-btn"
          >
            EXECUTE
          </button>
        </form>
      </div>

      {/* Power Operations Panel */}
      <div className="lg:col-span-1 bg-slate-900/40 border border-slate-800 rounded-xl p-5 flex flex-col justify-between" id="power-operations-panel">
        <div>
          <h3 className="text-sm font-semibold text-slate-200 mb-3 uppercase tracking-wider">Power Controls</h3>
          <p className="text-xs text-slate-400 mb-6 leading-relaxed">
            Manage the server power cycle. Performing a hard kill might corrupt chunks. Use stop or restart for standard graceful procedures.
          </p>

          <div className="space-y-3">
            {/* Start Button */}
            <button
              onClick={() => onPowerAction("start")}
              disabled={status !== "offline"}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border font-semibold text-sm transition-all focus:outline-none active:scale-98 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20"
              id="power-start-btn"
            >
              <Play className="h-4 w-4 fill-current" />
              Start Server
            </button>

            {/* Restart Button */}
            <button
              onClick={() => onPowerAction("restart")}
              disabled={status !== "online"}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border font-semibold text-sm transition-all focus:outline-none active:scale-98 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500/20"
              id="power-restart-btn"
            >
              <RotateCcw className="h-4 w-4" />
              Restart Server
            </button>

            {/* Stop Button */}
            <button
              onClick={() => onPowerAction("stop")}
              disabled={status !== "online"}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border font-semibold text-sm transition-all focus:outline-none active:scale-98 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer bg-orange-500/10 border-orange-500/20 text-orange-400 hover:bg-orange-500/20"
              id="power-stop-btn"
            >
              <Square className="h-4 w-4 fill-current" />
              Stop Gracefully
            </button>

            {/* Kill Button */}
            <button
              onClick={() => onPowerAction("kill")}
              disabled={status === "offline"}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border font-semibold text-sm transition-all focus:outline-none active:scale-98 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20"
              id="power-kill-btn"
            >
              <Skull className="h-4 w-4" />
              Force Stop (Kill)
            </button>
          </div>
        </div>

        {/* Server Connection details card */}
        <div className="mt-6 pt-5 border-t border-slate-800/80">
          <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3">
            <p className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider mb-1">Server Connection IP</p>
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-emerald-400">142.250.200.35:25565</span>
              <span className="text-[9px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400 font-mono">JAVA</span>
            </div>
            <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-900">
              <span className="text-[10px] text-slate-500">Software</span>
              <span className="text-[10px] font-mono text-slate-300 font-semibold">Paper-1.20.4 (Git 352)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
