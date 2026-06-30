import React, { useState, useEffect, useRef } from "react";
import { Sparkles, Send, Loader2, AlertTriangle, Cpu, Terminal, HelpCircle, FileText } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { ConsoleMessage, ServerProperty } from "../types";

interface Message {
  sender: "user" | "copilot";
  text: string;
  timestamp: string;
  isSimulated?: boolean;
}

interface CopilotViewProps {
  logs: ConsoleMessage[];
  properties: ServerProperty[];
}

const QUICK_PROMPTS = [
  { label: "⚡ Optimize Spigot TPS Lag", text: "How do I optimize my server properties to reduce ticks-per-second (TPS) lag?" },
  { label: "🔍 Diagnose Console Logs", text: "Please inspect my server console logs for any errors, warning states, or plugin conflicts." },
  { label: "💾 Setup MySQL for Plugins", text: "How do I configure a plugin like LuckPerms to connect to an external MySQL database?" },
  { label: "🎮 Set Default Game Settings", text: "Can you explain how to set up server properties for a Hardcore Survival server with whitelist enabled?" }
];

export default function CopilotView({ logs, properties }: CopilotViewProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "copilot",
      text: `### 🤖 Welcome to CraftPilot Server Co-pilot!
I'm your virtual Minecraft Systems Engineer. I can help you with:
* **Diagnosing server logs** for errors, tick lag, or plugin crashes.
* **Optimizing Paper/Spigot configurations** to maximize TPS and player capacity.
* **Configuring complex plugins** (LuckPerms, EssentialsX, Geyser Bedrock bridge).
* **Generating optimal GC parameters** (Aikar's Flags) and JVM settings.

You can select one of the quick troubleshooting topics below or type your custom query!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [attachLogs, setAttachLogs] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const timestampStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Add user message to state
    const userMsg: Message = {
      sender: "user",
      text: textToSend,
      timestamp: timestampStr
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInputText("");
    setIsLoading(true);

    try {
      // Gather context
      const requestPayload: any = {
        question: textToSend,
        currentConfig: properties.reduce((acc, prop) => {
          acc[prop.key] = prop.value;
          return acc;
        }, {} as Record<string, string>)
      };

      if (attachLogs) {
        requestPayload.logs = logs.slice(-25); // Send the last 25 logs for analysis
      }

      const response = await fetch("/api/copilot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestPayload)
      });

      if (!response.ok) {
        throw new Error("Failed to contact Gemini copilot service.");
      }

      const data = await response.json();
      
      const copilotMsg: Message = {
        sender: "copilot",
        text: data.response || "No response received.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isSimulated: data.simulated
      };

      setMessages(prev => [...prev, copilotMsg]);
    } catch (err: any) {
      console.error(err);
      const errorMsg: Message = {
        sender: "copilot",
        text: `⚠️ **Error communicating with Copilot backend**: ${err.message || "An unknown error occurred."} Please try again.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    handleSendMessage(inputText);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[560px]" id="copilot-panel-wrapper">
      {/* Help Column */}
      <div className="lg:col-span-1 bg-slate-900/40 border border-slate-800 rounded-xl p-5 flex flex-col justify-between" id="copilot-info-col">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-400" />
            <h3 className="text-sm font-bold text-slate-200">Diagnostics Hub</h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Select a common diagnostic template to query CraftPilot immediately, or draft your custom systems query.
          </p>

          <div className="space-y-2 pt-2" id="quick-prompt-buttons">
            {QUICK_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(prompt.text)}
                className="w-full text-left p-2.5 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-950/40 hover:bg-slate-900/40 text-xs text-slate-300 transition-all font-medium active:scale-98 cursor-pointer"
              >
                {prompt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Console Attachment Toggle */}
        <div className="border-t border-slate-800/80 pt-4 mt-4">
          <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-400 hover:text-slate-200 select-none">
            <input
              type="checkbox"
              checked={attachLogs}
              onChange={(e) => setAttachLogs(e.target.checked)}
              className="mt-0.5 accent-emerald-500 rounded border-slate-800"
              id="attach-logs-checkbox"
            />
            <div className="space-y-0.5">
              <span className="font-semibold text-slate-300">Attach Console Context</span>
              <span className="block text-[10px] text-slate-500 leading-normal">
                Submits the last 25 terminal lines to diagnose issues in real-time.
              </span>
            </div>
          </label>
        </div>
      </div>

      {/* Chat Thread */}
      <div className="lg:col-span-3 flex flex-col h-full bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl relative" id="copilot-chat-thread">
        {/* Chat Header */}
        <div className="flex items-center justify-between px-5 py-3 bg-slate-900 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded bg-emerald-500/10 text-emerald-400">
              <Sparkles className="h-4 w-4 animate-pulse" />
            </div>
            <div>
              <span className="text-xs text-slate-500 font-bold uppercase tracking-wider font-mono">INTELLIGENT AGENT</span>
              <h4 className="text-sm font-bold text-slate-200 leading-tight">CraftPilot Assistant</h4>
            </div>
          </div>
          <span className="text-[10px] bg-slate-800 border border-slate-700/50 px-2 py-0.5 rounded text-slate-400 font-mono">
            GEMINI-3.5-FLASH
          </span>
        </div>

        {/* Chat Bubble List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-950/80 scrollbar-thin scrollbar-thumb-slate-800" id="copilot-chat-bubbles">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
              id={`chat-msg-${index}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs md:text-sm leading-relaxed shadow-sm ${
                  msg.sender === "user"
                    ? "bg-emerald-600 text-white rounded-br-none"
                    : "bg-slate-900/90 border border-slate-800 text-slate-200 rounded-bl-none"
                }`}
              >
                {msg.sender === "copilot" ? (
                  <div className="prose prose-invert max-w-none text-xs md:text-sm space-y-2 leading-relaxed">
                    <ReactMarkdown
                      components={{
                        // Standard formatting fixes for Markdown lists and headers
                        h1: ({node, ...props}) => <h1 className="text-base font-bold text-slate-100 border-b border-slate-800 pb-1 mt-3 mb-2 uppercase font-sans tracking-wide" {...props} />,
                        h2: ({node, ...props}) => <h2 className="text-sm font-bold text-slate-200 mt-3 mb-1.5 font-sans" {...props} />,
                        h3: ({node, ...props}) => <h3 className="text-xs font-bold text-emerald-400 mt-2 mb-1 uppercase tracking-wider font-mono" {...props} />,
                        p: ({node, ...props}) => <p className="text-xs md:text-sm text-slate-300 leading-relaxed mb-2" {...props} />,
                        ul: ({node, ...props}) => <ul className="list-disc pl-5 space-y-1 text-slate-300 mb-2" {...props} />,
                        ol: ({node, ...props}) => <ol className="list-decimal pl-5 space-y-1 text-slate-300 mb-2" {...props} />,
                        li: ({node, ...props}) => <li className="text-xs md:text-sm" {...props} />,
                        code: ({node, inline, className, ...props} : any) => {
                          return inline ? (
                            <code className="bg-slate-950 text-emerald-400 px-1 py-0.5 rounded font-mono text-[11px]" {...props} />
                          ) : (
                            <pre className="bg-slate-950 p-3 rounded-lg border border-slate-800 overflow-x-auto my-2 scrollbar-thin">
                              <code className="text-slate-300 text-[11px] md:text-xs font-mono block whitespace-pre" {...props} />
                            </pre>
                          );
                        }
                      }}
                    >
                      {msg.text}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                )}
              </div>
              <span className="text-[9px] text-slate-500 font-mono mt-1 px-1">{msg.timestamp}</span>
            </div>
          ))}

          {/* Loading Animation Bubble */}
          {isLoading && (
            <div className="flex flex-col items-start animate-pulse" id="copilot-loading-bubble">
              <div className="bg-slate-900/90 border border-slate-800 text-slate-400 rounded-2xl rounded-bl-none px-4 py-3 flex items-center gap-2 text-xs">
                <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />
                <span>CraftPilot is analyzing logs and crafting optimal server strategies...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input Bar */}
        <form onSubmit={handleSubmit} className="p-3 bg-slate-900 border-t border-slate-800 shrink-0 flex gap-2">
          <input
            type="text"
            value={inputText}
            disabled={isLoading}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask about server errors, Spigot properties, performance optimization..."
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs md:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-medium"
            id="copilot-text-input"
          />
          <button
            type="submit"
            disabled={isLoading || !inputText.trim()}
            className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl px-4 flex items-center justify-center transition-all shadow-md active:scale-95 cursor-pointer shrink-0"
            id="copilot-send-btn"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
