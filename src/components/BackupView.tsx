import React, { useState } from "react";
import { HardDrive, CloudLightning, HelpCircle, Loader2, Play, RefreshCw, Trash2, Download, Check, AlertCircle } from "lucide-react";
import { BackupItem } from "../types";

interface BackupViewProps {
  backups: BackupItem[];
  onCreateBackup: (newBackup: BackupItem) => void;
  onDeleteBackup: (id: string) => void;
}

export default function BackupView({
  backups,
  onCreateBackup,
  onDeleteBackup
}: BackupViewProps) {
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupStep, setBackupStep] = useState("");

  const handleBackupNow = () => {
    setIsBackingUp(true);
    
    const steps = [
      "Flushing level caches and saving chunks...",
      "Compressing world database (DIM-1 & DIM1)...",
      "Archiving plugins folder & configuration files...",
      "Building ZIP container archive...",
      "Finalizing backup descriptor metadata..."
    ];

    let currentStep = 0;
    setBackupStep(steps[currentStep]);

    const interval = setInterval(() => {
      currentStep++;
      if (currentStep < steps.length) {
        setBackupStep(steps[currentStep]);
      } else {
        clearInterval(interval);
        
        const timestamp = new Date();
        const dateStr = timestamp.toLocaleDateString() + " " + timestamp.toLocaleTimeString();
        const idStr = "backup_" + timestamp.getTime();
        const sizeRandom = (20 + Math.random() * 40).toFixed(1) + " MB";

        onCreateBackup({
          id: idStr,
          name: `world-backup-${timestamp.getFullYear()}${(timestamp.getMonth()+1).toString().padStart(2,'0')}${timestamp.getDate().toString().padStart(2,'0')}.zip`,
          date: dateStr,
          size: sizeRandom,
          status: "completed"
        });

        setIsBackingUp(false);
        setBackupStep("");
      }
    }, 700);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="backup-view-container">
      {/* Backup Action Panel */}
      <div className="lg:col-span-1 bg-slate-900/40 border border-slate-800 rounded-xl p-5 h-fit">
        <h3 className="text-sm font-bold text-slate-200 mb-2 flex items-center gap-2">
          <HardDrive className="h-4 w-4 text-emerald-400" />
          Server Snapshots
        </h3>
        <p className="text-xs text-slate-400 mb-5 leading-relaxed">
          Creating a snapshot packages your worlds, player profiles, databases, and plugin configurations into a compressed ZIP file.
        </p>

        {isBackingUp ? (
          <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-5 text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-400 mx-auto" />
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-200">Archiving Server Files</p>
              <p className="text-[10px] text-slate-400 font-mono italic leading-relaxed min-h-[32px]">{backupStep}</p>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div className="bg-emerald-500 h-1.5 rounded-full animate-pulse w-3/4"></div>
            </div>
          </div>
        ) : (
          <button
            onClick={handleBackupNow}
            className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs md:text-sm font-semibold py-3 rounded-lg cursor-pointer transition-all active:scale-95 shadow-md shadow-emerald-950/20"
            id="trigger-backup-btn"
          >
            <CloudLightning className="h-4 w-4 fill-current animate-bounce" />
            Create Backup Now
          </button>
        )}

        <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3.5 mt-5 text-[11px] text-slate-400 space-y-2">
          <p className="font-bold text-slate-300 flex items-center gap-1.5">
            <AlertCircle className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            Backup Recommendation
          </p>
          <p className="leading-relaxed">
            Backup your files before updating plugins or running large operations (like WorldEdit brush strokes or Purpur build migrations) to prevent rollback loss.
          </p>
        </div>
      </div>

      {/* Backup Archives Table */}
      <div className="lg:col-span-2 space-y-4" id="backup-history-wrapper">
        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Historical Snapshot Backups</h3>

        {backups.length === 0 ? (
          <div className="py-16 text-center text-slate-500 bg-slate-950/20 border border-slate-800 rounded-xl">
            <HardDrive className="h-10 w-10 text-slate-700 mx-auto mb-2" />
            <p className="font-medium text-sm">No backups found.</p>
            <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">Make your first manual world snapshot using the controls on the left.</p>
          </div>
        ) : (
          <div className="bg-slate-900/30 border border-slate-800 rounded-xl overflow-hidden shadow-inner">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs md:text-sm">
                <thead>
                  <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px] select-none">
                    <th className="px-5 py-3">Archive Name</th>
                    <th className="px-5 py-3">Created Date</th>
                    <th className="px-5 py-3 text-right">Size</th>
                    <th className="px-5 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {backups.map((bk) => (
                    <tr key={bk.id} className="hover:bg-slate-900/20 transition-colors duration-150" id={`backup-row-${bk.id}`}>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <HardDrive className="h-4 w-4 text-emerald-400 shrink-0" />
                          <span className="font-mono text-slate-200 font-medium">{bk.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-400 font-medium">
                        {bk.date}
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono text-slate-300 font-semibold">
                        {bk.size}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-center gap-1.5">
                          <a
                            href="#"
                            onClick={(e) => { e.preventDefault(); alert("Preparing backup download..."); }}
                            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                            title="Download ZIP"
                          >
                            <Download className="h-4 w-4" />
                          </a>
                          <button
                            onClick={() => onDeleteBackup(bk.id)}
                            className="p-1.5 hover:bg-rose-500/10 rounded-lg text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                            title="Delete backup"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
