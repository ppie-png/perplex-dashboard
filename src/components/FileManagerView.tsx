import React, { useState } from "react";
import { 
  FolderOpen, FileText, ChevronRight, Save, 
  X, Trash2, Plus, ArrowLeft, Download, FileCode 
} from "lucide-react";
import { FileItem } from "../types";

interface FileManagerViewProps {
  files: FileItem[];
  onSaveFile: (fileName: string, content: string) => void;
  onDeleteFile: (fileName: string) => void;
  onCreateFile: (fileName: string, content: string) => void;
}

export default function FileManagerView({
  files,
  onSaveFile,
  onDeleteFile,
  onCreateFile
}: FileManagerViewProps) {
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [editingFile, setEditingFile] = useState<FileItem | null>(null);
  const [editorContent, setEditorContent] = useState("");
  const [newFileName, setNewFileName] = useState("");
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Filter files based on current simulated directory
  const getDisplayFiles = () => {
    if (!currentFolder) {
      // Show root files and virtual folders
      const rootItems: FileItem[] = [];
      const foldersSeen = new Set<string>();

      files.forEach(f => {
        if (f.name.includes("/")) {
          const folderName = f.name.split("/")[0];
          if (!foldersSeen.has(folderName)) {
            foldersSeen.add(folderName);
            rootItems.push({ name: folderName, type: "directory" });
          }
        } else {
          rootItems.push(f);
        }
      });
      return rootItems;
    } else {
      // Show files in current folder
      return files
        .filter(f => f.name.startsWith(currentFolder + "/"))
        .map(f => ({
          ...f,
          name: f.name.replace(currentFolder + "/", "")
        }));
    }
  };

  const handleItemClick = (item: FileItem) => {
    if (item.type === "directory") {
      setCurrentFolder(item.name);
    } else {
      // It's a file, fetch full path
      const fullPath = currentFolder ? `${currentFolder}/${item.name}` : item.name;
      const originalFile = files.find(f => f.name === fullPath);
      if (originalFile) {
        setEditingFile(originalFile);
        setEditorContent(originalFile.content || "");
      }
    }
  };

  const handleSave = () => {
    if (!editingFile) return;
    onSaveFile(editingFile.name, editorContent);
    setEditingFile(null);
  };

  const handleDelete = (item: FileItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const fullPath = currentFolder ? `${currentFolder}/${item.name}` : item.name;
    if (window.confirm(`Are you sure you want to delete "${item.name}"?`)) {
      onDeleteFile(fullPath);
    }
  };

  const handleCreateNewFile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;
    const cleanName = newFileName.endsWith(".yml") || newFileName.endsWith(".properties") || newFileName.endsWith(".json") || newFileName.endsWith(".txt")
      ? newFileName
      : newFileName + ".txt";
    
    const fullPath = currentFolder ? `${currentFolder}/${cleanName}` : cleanName;
    onCreateFile(fullPath, "# Created via Server Panel\n");
    setNewFileName("");
    setIsCreatingNew(false);
  };

  const displayFiles = getDisplayFiles();

  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden shadow-sm" id="file-manager-container">
      {/* File Editor Interface Overlay */}
      {editingFile ? (
        <div className="flex flex-col h-[550px]" id="file-editor-interface">
          {/* Editor Header */}
          <div className="flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <FileCode className="h-5 w-5 text-emerald-400" />
              <div>
                <h3 className="text-sm font-bold text-slate-200">Editing File</h3>
                <p className="text-[10px] text-slate-500 font-mono">{editingFile.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setEditingFile(null)}
                className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
                id="close-editor-btn"
              >
                <X className="h-3.5 w-3.5" />
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-3.5 py-1.5 rounded-lg font-medium cursor-pointer transition-colors shadow-sm"
                id="save-file-btn"
              >
                <Save className="h-3.5 w-3.5" />
                Save Changes
              </button>
            </div>
          </div>

          {/* Textarea Editor */}
          <div className="flex-1 p-4 bg-slate-950">
            <textarea
              value={editorContent}
              onChange={(e) => setEditorContent(e.target.value)}
              className="w-full h-full bg-transparent text-slate-200 font-mono text-sm leading-relaxed p-2 resize-none focus:outline-none border-none focus:ring-0"
              spellCheck="false"
              id="file-textarea"
            />
          </div>
        </div>
      ) : (
        <div className="flex flex-col h-[550px]" id="file-explorer-browser">
          {/* Browser Header */}
          <div className="flex items-center justify-between px-6 py-4 bg-slate-900/80 border-b border-slate-800">
            <div className="flex items-center gap-3">
              {currentFolder && (
                <button
                  onClick={() => setCurrentFolder(null)}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-slate-200 cursor-pointer transition-colors"
                  id="explorer-back-btn"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
              )}
              <div>
                <div className="flex items-center gap-1 text-xs text-slate-500 font-mono">
                  <span>root</span>
                  {currentFolder && (
                    <>
                      <ChevronRight className="h-3 w-3" />
                      <span>{currentFolder}</span>
                    </>
                  )}
                </div>
                <h3 className="text-sm font-bold text-slate-200 mt-0.5">Server File Manager</h3>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              {isCreatingNew ? (
                <form onSubmit={handleCreateNewFile} className="flex gap-2 items-center">
                  <input
                    type="text"
                    required
                    value={newFileName}
                    onChange={(e) => setNewFileName(e.target.value)}
                    placeholder="filename.properties"
                    className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                    id="new-file-input"
                  />
                  <button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-2.5 py-1 rounded-lg cursor-pointer transition-colors"
                  >
                    Create
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCreatingNew(false)}
                    className="text-slate-400 hover:text-slate-200 p-1"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => setIsCreatingNew(true)}
                  className="flex items-center gap-1.5 bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/20 text-emerald-400 text-xs px-3 py-1.5 rounded-lg font-medium cursor-pointer transition-all"
                  id="create-new-file-trigger"
                >
                  <Plus className="h-3.5 w-3.5" />
                  New File
                </button>
              )}
            </div>
          </div>

          {/* Directory Listings */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/50 bg-slate-950/20">
            {displayFiles.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-2">
                <FolderOpen className="h-10 w-10 text-slate-700" />
                <p>This directory is empty.</p>
              </div>
            ) : (
              displayFiles.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => handleItemClick(item)}
                  className="flex items-center justify-between px-6 py-3.5 hover:bg-slate-900/30 transition-colors duration-150 cursor-pointer group"
                  id={`file-item-${idx}`}
                >
                  <div className="flex items-center gap-3">
                    {item.type === "directory" ? (
                      <FolderOpen className="h-5 w-5 text-sky-400 shrink-0" />
                    ) : (
                      <FileText className="h-5 w-5 text-amber-400 shrink-0" />
                    )}
                    <div>
                      <p className={`text-sm font-medium transition-colors ${item.type === "directory" ? "text-slate-200 group-hover:text-sky-300" : "text-slate-300 group-hover:text-emerald-300"} font-mono`}>
                        {item.name}
                      </p>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                        {item.type === "directory" ? "Folder" : `${item.size || '1.2 KB'} • ${item.lastModified || 'Just now'}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.type === "file" && (
                      <button
                        onClick={(e) => handleDelete(item, e)}
                        className="p-1.5 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 rounded-md text-slate-500 hover:text-rose-400 cursor-pointer transition-all"
                        title="Delete file"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                    {item.type === "directory" ? (
                      <ChevronRight className="h-4 w-4 text-slate-500" />
                    ) : (
                      <Download className="h-4 w-4 text-slate-500" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
