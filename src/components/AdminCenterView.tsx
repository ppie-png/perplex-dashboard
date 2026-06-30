import React, { useState, useEffect } from "react";
import { 
  Shield, Cpu, Sliders, HardDrive, Server, Plus, 
  Trash2, Users, Database, CheckCircle, AlertCircle, Key, RefreshCw
} from "lucide-react";

interface AdminCenterViewProps {
  userRole: string;
}

interface SQLHost {
  id: string;
  name: string;
  host: string;
  port: number;
  driver: 'mysql' | 'postgresql';
  user: string;
  maxDbs: number;
  description: string;
}

interface UserAccount {
  username: string;
  email: string;
  password?: string;
  role: 'admin' | 'client' | 'viewer';
  displayName: string;
}

interface NodeResources {
  totalCpu: number;
  totalRam: number;
  totalDisk: number;
  allocatedCpu: number;
  allocatedRam: number;
  allocatedDisk: number;
  nodeOvercommitRatio: number;
}

export default function AdminCenterView({ userRole }: AdminCenterViewProps) {
  const [activeTab, setActiveTab] = useState<"node" | "users" | "sql" | "servers">("node");
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // States
  const [nodeRes, setNodeRes] = useState<NodeResources | null>(null);
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [sqlHosts, setSqlHosts] = useState<SQLHost[]>([]);

  // Form states - Node
  const [nodeCpu, setNodeCpu] = useState(16);
  const [nodeRam, setNodeRam] = useState(64);
  const [nodeDisk, setNodeDisk] = useState(500);
  const [nodeOvercommit, setNodeOvercommit] = useState(150);

  // Form states - User
  const [newUsername, setNewUsername] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPass, setNewUserPass] = useState("");
  const [newUserRole, setNewUserRole] = useState<'admin' | 'client' | 'viewer'>("client");
  const [newUserDisplay, setNewUserDisplay] = useState("");

  // Form states - SQL Host
  const [sqlName, setSqlName] = useState("");
  const [sqlIp, setSqlIp] = useState("");
  const [sqlPort, setSqlPort] = useState(3306);
  const [sqlDriver, setSqlDriver] = useState<'mysql' | 'postgresql'>("mysql");
  const [sqlUser, setSqlUser] = useState("root");
  const [sqlMax, setSqlMax] = useState(50);
  const [sqlDesc, setSqlDesc] = useState("");

  // Form states - Server deploy
  const [srvName, setSrvName] = useState("");
  const [srvType, setSrvType] = useState("Paper Minecraft");
  const [srvOwner, setSrvOwner] = useState("");
  const [srvCpu, setSrvCpu] = useState(2);
  const [srvRam, setSrvRam] = useState(4);
  const [srvDisk, setSrvDisk] = useState(20);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/db");
      if (res.ok) {
        const data = await res.json();
        setNodeRes(data.nodeResources);
        setSqlHosts(data.sqlHosts || []);
        
        // Load initial limits
        if (data.nodeResources) {
          setNodeCpu(data.nodeResources.totalCpu);
          setNodeRam(data.nodeResources.totalRam);
          setNodeDisk(data.nodeResources.totalDisk);
          setNodeOvercommit(data.nodeResources.nodeOvercommitRatio || 150);
        }
      }

      // Load full users with passwords
      const usersRes = await fetch("/api/admin/users");
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to synchronize admin panel data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const triggerAlert = (success: string, error: string = "") => {
    if (success) {
      setSuccessMsg(success);
      setTimeout(() => setSuccessMsg(""), 4000);
    }
    if (error) {
      setErrorMsg(error);
      setTimeout(() => setErrorMsg(""), 4000);
    }
  };

  // Node Limits Form
  const handleUpdateNode = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/node-resources", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          totalCpu: nodeCpu,
          totalRam: nodeRam,
          totalDisk: nodeDisk,
          nodeOvercommitRatio: nodeOvercommit
        })
      });
      if (res.ok) {
        triggerAlert("Node resource and overcommit limits updated successfully!");
        fetchData();
      } else {
        const err = await res.json();
        triggerAlert("", err.error || "Failed to update node configuration.");
      }
    } catch (err) {
      triggerAlert("", "Server communication failure.");
    }
  };

  // User Administration
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername || !newUserEmail || !newUserPass) {
      triggerAlert("", "Please specify a username, email and default password.");
      return;
    }
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: newUsername,
          email: newUserEmail,
          password: newUserPass,
          role: newUserRole,
          displayName: newUserDisplay || newUsername
        })
      });
      if (res.ok) {
        triggerAlert(`Account for ${newUsername} registered successfully!`);
        setNewUsername("");
        setNewUserEmail("");
        setNewUserPass("");
        setNewUserDisplay("");
        fetchData();
      } else {
        const err = await res.json();
        triggerAlert("", err.error || "Failed to create user account.");
      }
    } catch (err) {
      triggerAlert("", "Server communication error.");
    }
  };

  const handleUpdateUserRole = async (username: string, currentRole: string) => {
    const nextRole = currentRole === "admin" ? "client" : currentRole === "client" ? "viewer" : "admin";
    try {
      const res = await fetch(`/api/admin/users/${username}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: nextRole })
      });
      if (res.ok) {
        triggerAlert(`Updated permissions for ${username} to ${nextRole.toUpperCase()}`);
        fetchData();
      }
    } catch (err) {
      triggerAlert("", "Failed to update user privilege level.");
    }
  };

  const handleDeleteUser = async (username: string) => {
    if (username === "admin") {
      triggerAlert("", "Protection mechanism: Cannot delete primary admin account.");
      return;
    }
    if (!window.confirm(`Are you absolutely sure you want to delete user account ${username}?`)) return;
    try {
      const res = await fetch(`/api/admin/users/${username}`, { method: "DELETE" });
      if (res.ok) {
        triggerAlert(`Account ${username} deleted successfully.`);
        fetchData();
      }
    } catch (err) {
      triggerAlert("", "Failed to delete user account.");
    }
  };

  // SQL Hosts
  const handleCreateSqlHost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sqlName || !sqlIp) {
      triggerAlert("", "Please specify a unique database host name and IP address.");
      return;
    }
    try {
      const res = await fetch("/api/admin/sql-hosts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: sqlName,
          host: sqlIp,
          port: sqlPort,
          driver: sqlDriver,
          user: sqlUser,
          maxDbs: sqlMax,
          description: sqlDesc
        })
      });
      if (res.ok) {
        triggerAlert(`Database host ${sqlName} mapped successfully!`);
        setSqlName("");
        setSqlIp("");
        setSqlDesc("");
        fetchData();
      } else {
        const err = await res.json();
        triggerAlert("", err.error || "Failed to record SQL host.");
      }
    } catch (err) {
      triggerAlert("", "Server failure mapping SQL host.");
    }
  };

  const handleDeleteSqlHost = async (id: string) => {
    if (!window.confirm("Remove this SQL Host mapping? Existing user databases won't be deleted but connection mappings will dissolve.")) return;
    try {
      const res = await fetch(`/api/admin/sql-hosts/${id}`, { method: "DELETE" });
      if (res.ok) {
        triggerAlert("SQL Host map removed.");
        fetchData();
      }
    } catch (err) {
      triggerAlert("", "Failed to remove database host map.");
    }
  };

  // Sovereign Server Deployment
  const handleDeployServer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!srvName || !srvOwner) {
      triggerAlert("", "Please provide a server name and assign a client owner.");
      return;
    }

    try {
      const res = await fetch("/api/instances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: srvName,
          type: srvType,
          owner: srvOwner,
          cpuLimit: srvCpu,
          ramLimit: srvRam,
          diskLimit: srvDisk
        })
      });

      if (res.ok) {
        triggerAlert(`Virtual Server "${srvName}" deployed to ${srvOwner} successfully!`);
        setSrvName("");
        fetchData();
      } else {
        const err = await res.json();
        triggerAlert("", err.error || "Failed to deploy virtual server.");
      }
    } catch (err) {
      triggerAlert("", "Server failure deploying virtual instance.");
    }
  };

  if (userRole !== "admin") {
    return (
      <div className="bg-rose-950/20 border border-rose-900/40 rounded-3xl p-8 text-center space-y-4 max-w-lg mx-auto my-12 shadow-2xl">
        <Shield className="h-12 w-12 text-rose-500 mx-auto animate-bounce" />
        <h3 className="text-lg font-bold text-white uppercase tracking-wider">Access Denied</h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          The sovereign administrative control center is restricted to authenticated Root administrators. Please contact panel owner to configure your account credentials.
        </p>
      </div>
    );
  }

  // Calculate virtualized limits under smart overcommit
  const overcommitMultiplier = (nodeRes?.nodeOvercommitRatio || 150) / 100;
  const virtualMaxCpu = Number(((nodeRes?.totalCpu || 16) * overcommitMultiplier).toFixed(1));
  const virtualMaxRam = Math.floor((nodeRes?.totalRam || 64) * overcommitMultiplier);

  return (
    <div className="space-y-6">
      {/* Upper Title Block */}
      <div className="bg-slate-900/60 border border-violet-950/20 rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Shield className="h-6 w-6 text-purple-400" />
            Sovereign Admin Console
          </h2>
          <p className="text-xs text-slate-400">Manage hardware, overallocation, SQL clusters, user emails and permissions.</p>
        </div>
        <button 
          onClick={fetchData}
          className="px-4 py-2 bg-slate-950 hover:bg-slate-800 text-slate-300 rounded-xl border border-violet-900/30 text-xs flex items-center gap-1.5 transition-all cursor-pointer font-bold"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Sync State
        </button>
      </div>

      {/* Success/Error Alerts */}
      {successMsg && (
        <div className="bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 rounded-2xl p-4 text-xs flex items-center gap-3 animate-fadeIn">
          <CheckCircle className="h-5 w-5 shrink-0 text-emerald-400" />
          <span className="font-medium">{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="bg-rose-950/30 border border-rose-500/30 text-rose-300 rounded-2xl p-4 text-xs flex items-center gap-3 animate-fadeIn">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-400" />
          <span className="font-medium">{errorMsg}</span>
        </div>
      )}

      {/* Sub Tabs */}
      <div className="flex border-b border-violet-950/30 gap-1 overflow-x-auto pb-px">
        <button
          onClick={() => { setActiveTab("node"); setErrorMsg(""); }}
          className={`px-4 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
            activeTab === "node" ? "border-purple-500 text-white" : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Cpu className="h-4 w-4 text-purple-400" />
          Node & Hardware Limits
        </button>
        <button
          onClick={() => { setActiveTab("users"); setErrorMsg(""); }}
          className={`px-4 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
            activeTab === "users" ? "border-purple-500 text-white" : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Users className="h-4 w-4 text-purple-400" />
          Manage Accounts & Emails
        </button>
        <button
          onClick={() => { setActiveTab("sql"); setErrorMsg(""); }}
          className={`px-4 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
            activeTab === "sql" ? "border-purple-500 text-white" : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Database className="h-4 w-4 text-purple-400" />
          SQL Cluster Hosts
        </button>
        <button
          onClick={() => { setActiveTab("servers"); setErrorMsg(""); }}
          className={`px-4 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
            activeTab === "servers" ? "border-purple-500 text-white" : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Server className="h-4 w-4 text-purple-400" />
          Sovereign Deployer
        </button>
      </div>

      {/* TAB CONTENTS */}
      {activeTab === "node" && nodeRes && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
          {/* Node Config Form */}
          <div className="lg:col-span-2 bg-slate-900/60 border border-violet-950/20 rounded-3xl p-6 space-y-6">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5 border-b border-violet-950/30 pb-3 font-mono">
              <span className="h-2 w-2 rounded-full bg-purple-500 animate-pulse"></span>
              NODE METRICS & OVERCOMMIT RATIO
            </h3>

            <form onSubmit={handleUpdateNode} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-slate-400 font-bold block">CPU Cores (Physical)</label>
                  <input 
                    type="number" 
                    value={nodeCpu}
                    onChange={e => setNodeCpu(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-violet-950 rounded-xl px-4 py-3 text-white outline-none font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-slate-400 font-bold block">Memory RAM (GB Physical)</label>
                  <input 
                    type="number" 
                    value={nodeRam}
                    onChange={e => setNodeRam(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-violet-950 rounded-xl px-4 py-3 text-white outline-none font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-slate-400 font-bold block">SSD Storage (GB Physical)</label>
                  <input 
                    type="number" 
                    value={nodeDisk}
                    onChange={e => setNodeDisk(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-violet-950 rounded-xl px-4 py-3 text-white outline-none font-mono"
                  />
                </div>
              </div>

              <div className="space-y-2.5 bg-slate-950/40 p-4 rounded-2xl border border-violet-950/30">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-300">Node Overcommit System:</span>
                  <span className="text-purple-400 font-bold font-mono">{nodeOvercommit}% Limit</span>
                </div>
                <input 
                  type="range"
                  min="100"
                  max="200"
                  step="5"
                  value={nodeOvercommit}
                  onChange={e => setNodeOvercommit(Number(e.target.value))}
                  className="w-full accent-purple-500 h-1.5 bg-slate-800 rounded outline-none cursor-pointer"
                />
                <p className="text-[11px] text-slate-400 leading-relaxed mt-1">
                  Overcommitting allows you to dynamically allocate more resources than physically exist (overallocation) since most game servers operate with low idle requirements. 
                  Currently overcommitting <strong className="text-purple-300">{(nodeCpu * nodeOvercommit/100).toFixed(1)} vCores</strong> and <strong className="text-emerald-400">{Math.floor(nodeRam * nodeOvercommit/100)} GB RAM</strong>.
                </p>
              </div>

              <button 
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-bold transition-all shadow-lg text-xs"
              >
                Apply Node Hardware Parameters
              </button>
            </form>
          </div>

          {/* Allocation report card */}
          <div className="bg-slate-900/60 border border-violet-950/20 rounded-3xl p-6 space-y-4 shadow-lg flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3">Overallocation Status</h3>
              <p className="text-xs text-slate-400 mb-6">Real-time breakdown of physical vs allocated resources under overcommit.</p>

              <div className="space-y-4 font-mono text-xs">
                {/* CPU */}
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-400">vCPU Allocation:</span>
                    <span className="text-slate-200 font-bold">{nodeRes.allocatedCpu} / {virtualMaxCpu} vCores</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500 transition-all" style={{ width: `${Math.min(100, (nodeRes.allocatedCpu / (virtualMaxCpu || 1)) * 100)}%` }}></div>
                  </div>
                </div>

                {/* RAM */}
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-400">RAM Allocation:</span>
                    <span className="text-slate-200 font-bold">{nodeRes.allocatedRam} / {virtualMaxRam} GB</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 transition-all" style={{ width: `${Math.min(100, (nodeRes.allocatedRam / (virtualMaxRam || 1)) * 100)}%` }}></div>
                  </div>
                </div>

                {/* Storage */}
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Storage Allocation:</span>
                    <span className="text-slate-200 font-bold">{nodeRes.allocatedDisk} / {nodeRes.totalDisk} GB</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                    <div className="h-full bg-sky-500 transition-all" style={{ width: `${Math.min(100, (nodeRes.allocatedDisk / (nodeRes.totalDisk || 1)) * 100)}%` }}></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-950/40 border border-violet-950/40 p-3 rounded-2xl text-[10px] text-purple-300 leading-relaxed font-mono">
              ★ Active Overcommit Ratio: {(nodeRes.nodeOvercommitRatio || 150)}% allows up to {(nodeRes.nodeOvercommitRatio || 150) - 100}% extra clients to be comfortably provisioned.
            </div>
          </div>
        </div>
      )}

      {/* TAB: Manage Accounts */}
      {activeTab === "users" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
          {/* Left panel: List of accounts */}
          <div className="lg:col-span-2 bg-slate-900/60 border border-violet-950/20 rounded-3xl p-6 space-y-4 shadow-lg">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">Registered Clients & Accounts</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-violet-950/30 text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                    <th className="pb-3 pl-2">Display User</th>
                    <th className="pb-3">Email Address</th>
                    <th className="pb-3">Privilege Role</th>
                    <th className="pb-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-violet-950/15">
                  {users.map(u => (
                    <tr key={u.username} className="hover:bg-slate-950/20 transition-all font-mono">
                      <td className="py-3 pl-2">
                        <div className="font-bold text-slate-200">{u.displayName}</div>
                        <div className="text-[10px] text-slate-500">@{u.username}</div>
                      </td>
                      <td className="py-3 text-slate-300 text-[11px]">{u.email || "No Email Mapping"}</td>
                      <td className="py-3">
                        <button
                          onClick={() => handleUpdateUserRole(u.username, u.role)}
                          className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border cursor-pointer ${
                            u.role === "admin" 
                              ? "bg-purple-500/10 text-purple-300 border-purple-500/25 shadow-neon-purple"
                              : u.role === "client" 
                              ? "bg-indigo-500/10 text-indigo-300 border-indigo-500/25"
                              : "bg-slate-500/10 text-slate-400 border-slate-500/20"
                          }`}
                        >
                          {u.role}
                        </button>
                      </td>
                      <td className="py-3">
                        <button
                          onClick={() => handleDeleteUser(u.username)}
                          disabled={u.username === "admin"}
                          className={`p-1.5 rounded-lg text-rose-400 hover:bg-rose-950/40 border border-transparent hover:border-rose-900/30 transition-all ${
                            u.username === "admin" ? "opacity-30 cursor-not-allowed" : "cursor-pointer"
                          }`}
                          title="Delete Account"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right panel: Add Client User */}
          <div className="bg-slate-900/60 border border-violet-950/20 rounded-3xl p-6 shadow-lg">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Register User</h3>
            <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-slate-400 block font-bold">Unique Account User</label>
                <input 
                  type="text" 
                  placeholder="e.g. janesmith"
                  required
                  value={newUsername}
                  onChange={e => setNewUsername(e.target.value)}
                  className="w-full bg-slate-950 border border-violet-950 rounded-xl px-4 py-3 text-white outline-none font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 block font-bold">Client Email Address</label>
                <input 
                  type="email" 
                  placeholder="e.g. jane@unstableuniverse.world"
                  required
                  value={newUserEmail}
                  onChange={e => setNewUserEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-violet-950 rounded-xl px-4 py-3 text-white outline-none font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 block font-bold">Secret Sign-in Password</label>
                <input 
                  type="password" 
                  placeholder="e.g. clientpassword123"
                  required
                  value={newUserPass}
                  onChange={e => setNewUserPass(e.target.value)}
                  className="w-full bg-slate-950 border border-violet-950 rounded-xl px-4 py-3 text-white outline-none font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 block font-bold">Client Full Display Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Jane Smith (Primary)"
                  value={newUserDisplay}
                  onChange={e => setNewUserDisplay(e.target.value)}
                  className="w-full bg-slate-950 border border-violet-950 rounded-xl px-4 py-3 text-white outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 block font-bold">Privilege Role</label>
                <select
                  value={newUserRole}
                  onChange={e => setNewUserRole(e.target.value as any)}
                  className="w-full bg-slate-950 border border-violet-950 rounded-xl px-3 py-2 text-slate-200 outline-none font-bold"
                >
                  <option value="client">Client (Access Splitter)</option>
                  <option value="admin">Administrator (Root Access)</option>
                  <option value="viewer">Viewer (Read-Only)</option>
                </select>
              </div>

              <button 
                type="submit"
                className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold transition-all shadow-md mt-2 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                Provision Account
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB: SQL Cluster Hosts */}
      {activeTab === "sql" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
          {/* SQL List of Hosts */}
          <div className="lg:col-span-2 bg-slate-900/60 border border-violet-950/20 rounded-3xl p-6 space-y-4 shadow-lg">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">Registered SQL Server Panels</h3>
            <div className="space-y-4">
              {sqlHosts.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs">No database hosts mapped yet. Admin can register mappings on the right.</div>
              ) : (
                sqlHosts.map(h => (
                  <div key={h.id} className="bg-slate-950/60 p-4 border border-violet-950/30 rounded-2xl flex items-center justify-between gap-4 relative overflow-hidden group">
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-2">
                        <Database className="h-4 w-4 text-emerald-400" />
                        <h4 className="font-bold text-slate-200">{h.name}</h4>
                        <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.2 rounded uppercase font-bold font-mono">
                          {h.driver}
                        </span>
                      </div>
                      <p className="text-slate-400 text-[11px] leading-relaxed max-w-lg">{h.description || "Database cluster mapping for client database creation."}</p>
                      <div className="flex items-center gap-4 text-[10px] text-slate-500 font-mono pt-1">
                        <span>Host: <strong className="text-slate-300">{h.host}:{h.port}</strong></span>
                        <span>User: <strong className="text-slate-300">{h.user}</strong></span>
                        <span>Max Limit: <strong className="text-purple-400">{h.maxDbs} DBs</strong></span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteSqlHost(h.id)}
                      className="p-2 rounded-xl text-rose-400 hover:bg-rose-950/40 border border-transparent hover:border-rose-900/30 transition-all cursor-pointer shrink-0"
                      title="Delete Host"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right side: Map SQL host */}
          <div className="bg-slate-900/60 border border-violet-950/20 rounded-3xl p-6 shadow-lg">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Add SQL Host Map</h3>
            <form onSubmit={handleCreateSqlHost} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-slate-400 block font-bold">Host Connection Identifier</label>
                <input 
                  type="text" 
                  placeholder="e.g. EU-SQL-MySQL-01"
                  required
                  value={sqlName}
                  onChange={e => setSqlName(e.target.value)}
                  className="w-full bg-slate-950 border border-violet-950 rounded-xl px-4 py-3 text-white outline-none font-mono"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2 space-y-1.5">
                  <label className="text-slate-400 block font-bold">IP Host Address</label>
                  <input 
                    type="text" 
                    placeholder="e.g. 10.0.4.12"
                    required
                    value={sqlIp}
                    onChange={e => setSqlIp(e.target.value)}
                    className="w-full bg-slate-950 border border-violet-950 rounded-xl px-3 py-3 text-white outline-none font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-slate-400 block font-bold">Port</label>
                  <input 
                    type="number" 
                    value={sqlPort}
                    onChange={e => setSqlPort(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-violet-950 rounded-xl px-3 py-3 text-white outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <label className="text-slate-400 block font-bold">DB Driver</label>
                  <select
                    value={sqlDriver}
                    onChange={e => setSqlDriver(e.target.value as any)}
                    className="w-full bg-slate-950 border border-violet-950 rounded-xl px-2 py-2 text-slate-200 font-bold"
                  >
                    <option value="mysql">MySQL</option>
                    <option value="postgresql">PostgreSQL</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-slate-400 block font-bold">Max Databases</label>
                  <input 
                    type="number" 
                    value={sqlMax}
                    onChange={e => setSqlMax(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-violet-950 rounded-xl px-2 py-2 text-white outline-none font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 block font-bold">Root Username</label>
                <input 
                  type="text" 
                  value={sqlUser}
                  onChange={e => setSqlUser(e.target.value)}
                  className="w-full bg-slate-950 border border-violet-950 rounded-xl px-4 py-3 text-white outline-none font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 block font-bold">Public/Internal Node Note</label>
                <textarea 
                  placeholder="Enterprise SQL cluster mapped for production..."
                  value={sqlDesc}
                  onChange={e => setSqlDesc(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-950 border border-violet-950 rounded-xl px-4 py-3 text-white outline-none text-xs"
                />
              </div>

              <button 
                type="submit"
                className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                Save SQL Connection Mapping
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB: Deploy Server for Client */}
      {activeTab === "servers" && (
        <div className="max-w-xl mx-auto bg-slate-900/60 border border-violet-950/20 rounded-3xl p-6 space-y-6 shadow-xl animate-fadeIn">
          <div className="text-center space-y-1.5 border-b border-violet-950/30 pb-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Deploy Sovereign Game Instance</h3>
            <p className="text-xs text-slate-400">Instantly provision and map a Minecraft virtual instance dedicated to a specific client.</p>
          </div>

          <form onSubmit={handleDeployServer} className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="text-slate-400 block font-bold">Instance Name</label>
              <input 
                type="text" 
                placeholder="e.g. Factions-Survival-Main"
                required
                value={srvName}
                onChange={e => setSrvName(e.target.value)}
                className="w-full bg-slate-950 border border-violet-950 rounded-xl px-4 py-3 text-white outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-400 block font-bold">Engine Type Template</label>
              <select
                value={srvType}
                onChange={e => setSrvType(e.target.value)}
                className="w-full bg-slate-950 border border-violet-950 rounded-xl px-3 py-2 text-slate-200 font-bold"
              >
                <option value="Paper Minecraft">Paper Minecraft v1.20.4 (Optimized Java)</option>
                <option value="Spigot Minecraft">Spigot Minecraft v1.20.4 (Java)</option>
                <option value="Forge Minecraft">Forge Minecraft v1.20.1 (Modded Java)</option>
                <option value="Fabric Minecraft">Fabric Minecraft v1.20.4 (Performance Modded)</option>
                <option value="BungeeCord Proxy">BungeeCord Network Proxy</option>
                <option value="Velocity Proxy">Velocity Proxy</option>
                <option value="Palworld Server">Palworld Dedicated Server (UDP)</option>
                <option value="Node.js Bot">Node.js Bot/API Server</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-400 block font-bold">Assign to Client Account (Owner Username)</label>
              <select
                value={srvOwner}
                onChange={e => setSrvOwner(e.target.value)}
                required
                className="w-full bg-slate-950 border border-violet-950 rounded-xl px-3 py-2 text-slate-200 font-bold font-mono"
              >
                <option value="">-- SELECT CLIENT ACCOUNT --</option>
                {users.map(u => (
                  <option key={u.username} value={u.username}>
                    {u.displayName} ({u.email || u.username})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="text-slate-400 block font-bold">vCpu Limit</label>
                <input 
                  type="number" 
                  step="0.5"
                  min="0.5"
                  value={srvCpu}
                  onChange={e => setSrvCpu(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-violet-950 rounded-xl px-3 py-3 text-white outline-none font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 block font-bold">RAM Limit (GB)</label>
                <input 
                  type="number" 
                  min="1"
                  value={srvRam}
                  onChange={e => setSrvRam(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-violet-950 rounded-xl px-3 py-3 text-white outline-none font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 block font-bold">Disk (GB)</label>
                <input 
                  type="number" 
                  min="5"
                  value={srvDisk}
                  onChange={e => setSrvDisk(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-violet-950 rounded-xl px-3 py-3 text-white outline-none font-mono"
                />
              </div>
            </div>

            <button 
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-bold transition-all shadow-lg text-xs flex items-center justify-center gap-1.5 mt-2 cursor-pointer"
            >
              <Server className="h-4 w-4" />
              Deploy Virtual Game Server
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
