import React, { useState } from "react";
import { Search, Download, Check, Trash2, Shield, Eye, Star, Loader2 } from "lucide-react";
import { PluginItem } from "../types";

interface PluginMarketplaceViewProps {
  plugins: PluginItem[];
  onInstallPlugin: (pluginId: string) => void;
  onUninstallPlugin: (pluginId: string) => void;
}

const CATEGORIES = ["All", "Admin", "World", "Security", "Chat", "Optimization", "Developer"];

export default function PluginMarketplaceView({
  plugins,
  onInstallPlugin,
  onUninstallPlugin
}: PluginMarketplaceViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [installingId, setInstallingId] = useState<string | null>(null);

  const handleInstallClick = (pluginId: string) => {
    setInstallingId(pluginId);
    // Simulate interactive installation delay
    setTimeout(() => {
      onInstallPlugin(pluginId);
      setInstallingId(null);
    }, 1500);
  };

  const filteredPlugins = plugins.filter(plugin => {
    const matchesSearch = plugin.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          plugin.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === "All" || plugin.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6" id="plugin-marketplace-container">
      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Spigot/Paper plugins..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs md:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-medium"
            id="plugin-search-input"
          />
        </div>

        {/* Category Filters */}
        <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-1 no-scrollbar" id="category-filters">
          {CATEGORIES.map(category => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer shrink-0 transition-all ${
                activeCategory === category
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/10"
                  : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="plugin-marketplace-grid">
        {filteredPlugins.length === 0 ? (
          <div className="col-span-1 md:col-span-2 py-16 text-center text-slate-500 bg-slate-950/20 border border-slate-800 rounded-xl">
            <Search className="h-10 w-10 text-slate-700 mx-auto mb-2" />
            <p className="font-medium text-sm">No plugins match your search criteria.</p>
          </div>
        ) : (
          filteredPlugins.map(plugin => (
            <div
              key={plugin.id}
              className={`bg-slate-900/50 border rounded-xl p-5 flex flex-col justify-between transition-all duration-300 ${
                plugin.installed 
                  ? "border-emerald-500/20 shadow-emerald-950/10" 
                  : "border-slate-800 hover:border-slate-700"
              }`}
              id={`plugin-card-${plugin.id}`}
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                      {plugin.category}
                    </span>
                    <h4 className="font-bold text-slate-100 mt-2 flex items-center gap-1.5 text-base">
                      {plugin.name}
                      {plugin.installed && (
                        <span className="flex items-center text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full font-semibold font-sans">
                          Installed
                        </span>
                      )}
                    </h4>
                  </div>
                  <span className="text-xs font-mono text-slate-500 font-medium">v{plugin.version}</span>
                </div>

                <p className="text-xs text-slate-400 mt-3 leading-relaxed mb-4">
                  {plugin.description}
                </p>
              </div>

              {/* Card Footer Info */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-800/80 mt-2">
                <div className="flex items-center gap-3">
                  <div className="text-[10px] text-slate-500">
                    <span className="block font-medium">Author</span>
                    <span className="font-semibold text-slate-400">{plugin.author}</span>
                  </div>
                  <div className="text-[10px] text-slate-500">
                    <span className="block font-medium">Downloads</span>
                    <span className="font-semibold text-slate-400 font-mono">{plugin.downloads}</span>
                  </div>
                </div>

                <div>
                  {plugin.installed ? (
                    <button
                      onClick={() => onUninstallPlugin(plugin.id)}
                      className="flex items-center gap-1 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 text-xs px-3 py-1.5 rounded-lg font-medium cursor-pointer transition-all active:scale-95"
                      id={`uninstall-${plugin.id}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Uninstall
                    </button>
                  ) : installingId === plugin.id ? (
                    <button
                      disabled
                      className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 text-slate-400 text-xs px-3 py-1.5 rounded-lg font-medium cursor-not-allowed"
                    >
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-400" />
                      Installing...
                    </button>
                  ) : (
                    <button
                      onClick={() => handleInstallClick(plugin.id)}
                      className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-3 py-1.5 rounded-lg font-semibold cursor-pointer transition-all active:scale-95 shadow-md shadow-emerald-900/10"
                      id={`install-${plugin.id}`}
                    >
                      <Download className="h-3.5 w-3.5" />
                      Install
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
