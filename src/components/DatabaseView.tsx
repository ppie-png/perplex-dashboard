import React, { useState } from "react";
import { Database, Plus, Check, Loader2, Key, HelpCircle, Shield, Trash2, Copy } from "lucide-react";
import { DatabaseItem } from "../types";

interface DatabaseViewProps {
  databases: DatabaseItem[];
  onCreateDatabase: (name: string, username: string) => void;
  onDeleteDatabase: (id: string) => void;
}

export default function DatabaseView({
  databases,
  onCreateDatabase,
  onDeleteDatabase
}: DatabaseViewProps) {
  const [dbName, setDbName] = useState("");
  const [dbUser, setDbUser] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeCredentials, setActiveCredentials] = useState<DatabaseItem | null>(null);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dbName.trim() || !dbUser.trim()) return;

    setIsCreating(true);
    // Simulate creation latency
    setTimeout(() => {
      onCreateDatabase(dbName.trim(), dbUser.trim());
      setDbName("");
      setDbUser("");
      setIsCreating(false);
    }, 1500);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="database-view-container">
      {/* DB Creation Form */}
      <div className="lg:col-span-1 bg-slate-900/40 border border-slate-800 rounded-xl p-5 h-fit">
        <h3 className="text-sm font-bold text-slate-200 mb-2 flex items-center gap-2">
          <Database className="h-4 w-4 text-emerald-400" />
          Provision Database
        </h3>
        <p className="text-xs text-slate-400 mb-5 leading-relaxed">
          Create an isolated database instance for high-performance plugins like LuckPerms, CoreProtect, or Vault Economy.
        </p>

        <form onSubmit={handleCreate} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Database Name</label>
            <input
              type="text"
              required
              value={dbName}
              onChange={(e) => setDbName(e.target.value)}
              placeholder="e.g. survival_luckperms"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs md:text-sm text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
              id="db-name-input"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Username</label>
            <input
              type="text"
              required
              value={dbUser}
              onChange={(e) => setDbUser(e.target.value)}
              placeholder="e.g. u4258_admin"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs md:text-sm text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
              id="db-user-input"
            />
          </div>

          <button
            type="submit"
            disabled={isCreating}
            className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs md:text-sm font-semibold py-2.5 rounded-lg cursor-pointer transition-colors active:scale-95 disabled:opacity-50"
            id="create-db-btn"
          >
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-white" />
                Allocating Resources...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Provision MySQL Instance
              </>
            )}
          </button>
        </form>

        <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3.5 mt-5 text-[11px] text-slate-400 space-y-1.5">
          <p className="font-bold text-slate-300 flex items-center gap-1.5">
            <Shield className="h-3.5 w-3.5 text-emerald-400" />
            Security & Performance
          </p>
          <p className="leading-relaxed">
            All databases are hosted on standard low-latency solid-state storage. External client connections are restricted to authorized server instances by default.
          </p>
        </div>
      </div>

      {/* Databases List */}
      <div className="lg:col-span-2 space-y-4" id="databases-list-wrapper">
        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Active Database Instances</h3>

        {databases.length === 0 ? (
          <div className="py-16 text-center text-slate-500 bg-slate-950/20 border border-slate-800 rounded-xl">
            <Database className="h-10 w-10 text-slate-700 mx-auto mb-2 animate-pulse" />
            <p className="font-medium text-sm">No databases configured yet.</p>
            <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">Use the left panel to provision your first MySQL database instantly.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4" id="databases-grid">
            {databases.map((db) => (
              <div 
                key={db.id}
                className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                id={`db-card-${db.id}`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-emerald-400" />
                    <span className="font-mono font-bold text-slate-200 text-sm md:text-base">{db.name}</span>
                    <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full font-bold">
                      MySQL v8.0
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-400 font-mono mt-2">
                    <p><span className="text-slate-500">Host:</span> {db.host}</p>
                    <p><span className="text-slate-500">User:</span> {db.username}</p>
                    <p><span className="text-slate-500">Port:</span> 3306</p>
                    <p><span className="text-slate-500">Storage:</span> {db.size}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto shrink-0 pt-3 md:pt-0 border-t border-slate-800 md:border-none">
                  <button
                    onClick={() => setActiveCredentials(activeCredentials?.id === db.id ? null : db)}
                    className="flex-1 md:flex-none flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs px-3 py-1.5 rounded-lg font-medium cursor-pointer transition-all"
                    id={`view-creds-${db.id}`}
                  >
                    <Key className="h-3.5 w-3.5" />
                    Credentials
                  </button>
                  <button
                    onClick={() => onDeleteDatabase(db.id)}
                    className="p-2 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 rounded-lg text-slate-500 hover:text-rose-400 cursor-pointer transition-all"
                    title="Delete database"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Credentials Details Overlay Modal */}
        {activeCredentials && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mt-4 space-y-4 shadow-xl relative animate-fadeIn" id="db-credentials-card">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-2">
                <Key className="h-4 w-4 text-emerald-400" />
                Connection Credentials: {activeCredentials.name}
              </h4>
              <button 
                onClick={() => setActiveCredentials(null)}
                className="text-slate-500 hover:text-slate-300 text-xs px-2 py-0.5 rounded hover:bg-slate-800 font-mono"
              >
                CLOSE
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <p className="text-[10px] text-slate-500 uppercase font-semibold">JDBC JDBC URL</p>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-slate-300 truncate mr-2">
                    jdbc:mysql://{activeCredentials.host}:3306/{activeCredentials.name}
                  </span>
                  <button 
                    onClick={() => handleCopy("url", `jdbc:mysql://${activeCredentials.host}:3306/${activeCredentials.name}`)}
                    className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition-colors shrink-0 cursor-pointer"
                  >
                    {copiedId === "url" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <p className="text-[10px] text-slate-500 uppercase font-semibold">Database Host</p>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-slate-300">{activeCredentials.host}</span>
                  <button 
                    onClick={() => handleCopy("host", activeCredentials.host)}
                    className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                  >
                    {copiedId === "host" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <p className="text-[10px] text-slate-500 uppercase font-semibold">Database User</p>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-slate-300">{activeCredentials.username}</span>
                  <button 
                    onClick={() => handleCopy("user", activeCredentials.username)}
                    className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                  >
                    {copiedId === "user" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <p className="text-[10px] text-slate-500 uppercase font-semibold">Password</p>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-slate-300">•••••••••••••</span>
                  <button 
                    onClick={() => handleCopy("pass", "mc_secure_pass_" + activeCredentials.id)}
                    className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                  >
                    {copiedId === "pass" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
