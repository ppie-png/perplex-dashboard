import React, { useState, useEffect } from "react";
import { Save, AlertTriangle, CheckCircle, Info } from "lucide-react";
import { ServerProperty } from "../types";

interface SettingsViewProps {
  properties: ServerProperty[];
  onSaveProperties: (updatedProperties: ServerProperty[]) => void;
}

export default function SettingsView({
  properties,
  onSaveProperties
}: SettingsViewProps) {
  const [localProps, setLocalProps] = useState<ServerProperty[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    setLocalProps(JSON.parse(JSON.stringify(properties)));
  }, [properties]);

  const handleChange = (key: string, value: string) => {
    setLocalProps(prev => 
      prev.map(p => p.key === key ? { ...p, value } : p)
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProperties(localProps);
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
    }, 4000);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" id="settings-view-container">
      {/* Visual Alerts */}
      {showSuccess && (
        <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-emerald-400 animate-fadeIn" id="settings-success-alert">
          <CheckCircle className="h-5 w-5 shrink-0" />
          <div>
            <p className="text-sm font-bold">Properties Saved Successfully</p>
            <p className="text-xs text-emerald-400/80">The \`server.properties\` file has been updated. Please **restart** the server to apply changes.</p>
          </div>
        </div>
      )}

      <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6 space-y-6" id="settings-properties-panel">
        <div className="flex items-center gap-2 pb-4 border-b border-slate-800/80">
          <Info className="h-5 w-5 text-sky-400" />
          <div>
            <h3 className="text-sm font-bold text-slate-200">Server Properties Configuration</h3>
            <p className="text-xs text-slate-400">Configure core server properties. Hover over any option to view details.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {localProps.map((prop) => {
            return (
              <div key={prop.key} className="space-y-2 flex flex-col justify-between" id={`setting-field-${prop.key}`}>
                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-300 font-mono tracking-wider">
                      {prop.key}
                    </label>
                    <span className="text-[10px] text-slate-500 font-mono">
                      default: {prop.defaultValue}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed mt-1">
                    {prop.description}
                  </p>
                </div>

                <div className="mt-2.5">
                  {prop.type === "boolean" ? (
                    <div className="flex items-center">
                      <button
                        type="button"
                        onClick={() => handleChange(prop.key, prop.value === "true" ? "false" : "true")}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          prop.value === "true" ? "bg-emerald-600" : "bg-slate-800"
                        }`}
                        id={`toggle-${prop.key}`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            prop.value === "true" ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                      <span className="ml-3 font-mono text-xs font-bold text-slate-400 uppercase">
                        {prop.value}
                      </span>
                    </div>
                  ) : prop.key === "gamemode" ? (
                    <select
                      value={prop.value}
                      onChange={(e) => handleChange(prop.key, e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs md:text-sm font-mono text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
                      id="select-gamemode"
                    >
                      <option value="survival">survival</option>
                      <option value="creative">creative</option>
                      <option value="adventure">adventure</option>
                      <option value="spectator">spectator</option>
                    </select>
                  ) : prop.key === "difficulty" ? (
                    <select
                      value={prop.value}
                      onChange={(e) => handleChange(prop.key, e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs md:text-sm font-mono text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
                      id="select-difficulty"
                    >
                      <option value="peaceful">peaceful</option>
                      <option value="easy">easy</option>
                      <option value="normal">normal</option>
                      <option value="hard">hard</option>
                    </select>
                  ) : prop.type === "number" ? (
                    <input
                      type="number"
                      value={prop.value}
                      onChange={(e) => handleChange(prop.key, e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs md:text-sm font-mono text-slate-200 focus:outline-none focus:border-emerald-500"
                      id={`input-number-${prop.key}`}
                    />
                  ) : (
                    <input
                      type="text"
                      value={prop.value}
                      onChange={(e) => handleChange(prop.key, e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs md:text-sm font-mono text-slate-200 focus:outline-none focus:border-emerald-500"
                      id={`input-text-${prop.key}`}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Warning Banner */}
        <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-amber-400 text-xs">
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">Important Notice</p>
            <p className="leading-relaxed text-amber-400/80">
              Modifying critical server configs while players are online is generally safe, but changes to <code className="bg-slate-950 px-1 py-0.5 rounded text-rose-300 font-mono">gamemode</code> or <code className="bg-slate-950 px-1 py-0.5 rounded text-rose-300 font-mono">difficulty</code> are only pushed upon a graceful reload or restart command to maintain save state parity.
            </p>
          </div>
        </div>

        {/* Save button */}
        <div className="flex justify-end pt-4 border-t border-slate-800/85">
          <button
            type="submit"
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs md:text-sm font-semibold px-5 py-2.5 rounded-lg cursor-pointer transition-colors shadow-lg active:scale-95"
            id="save-settings-btn"
          >
            <Save className="h-4 w-4" />
            Save Configuration
          </button>
        </div>
      </div>
    </form>
  );
}
