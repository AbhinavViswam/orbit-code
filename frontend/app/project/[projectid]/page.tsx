"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Send,
  X,
  Plus,
  Save,
  FileText,
  Users,
  MessageSquare,
  Trash2,
  Folder,
  MoveLeft,
  Terminal as TerminalIcon,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  useAddPartner,
  useDeletePartner,
  useProfile,
  useShowMyProject,
  useUpdateFileTree,
} from "@/backend/query";
import {
  initializeSocket,
  receiveMessage,
  sendMessage,
} from "@/socket";
import Markdown from "markdown-to-jsx";
import Editor from "@monaco-editor/react";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { ImperativePanelHandle } from "react-resizable-panels";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";
import { getWebContainer, parseFileTreeToWebContainerFormat } from "@/lib/webcontainer";
import { WebContainer } from "@webcontainer/api";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Page() {
  const [newFileName, setNewFileName] = useState("");
  const [fileTree, setFileTree] = useState<Record<string, any>>({});
  const [currentFile, setCurrentFile] = useState<string | null>("newFile");
  const [openFiles, setOpenFiles] = useState<Set<string>>(new Set());
  const [content, setContent] = useState<string>("Create or select a file to edit");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isFileModalOpen, setIsFileModalOpen] = useState(false);
  const sidebarRef = useRef<ImperativePanelHandle>(null);

  // Theme
  const { resolvedTheme } = useTheme();

  // Modal / partner state
  const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false);
  const [partnerEmail, setPartnerEmail] = useState("");
  const [partnerError, setPartnerError] = useState<string | null>(null);
  const [partnerSuccess, setPartnerSuccess] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const messageBoxRef = useRef<HTMLDivElement | null>(null);

  // WebContainer & Terminal state
  const terminalRef = useRef<HTMLDivElement | null>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const [webcontainer, setWebcontainer] = useState<WebContainer | null>(null);
  const [isTerminalReady, setIsTerminalReady] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Initialize WebContainer and Terminal
  useEffect(() => {
    if (!terminalRef.current) return;

    const isDark = resolvedTheme === "dark";
    const term = new Terminal({
      theme: {
        background: isDark ? "#0f172a" : "#f8fafc",
        foreground: isDark ? "#f8fafc" : "#0f172a",
        cursor: isDark ? "#818cf8" : "#4f46e5",
      },
      convertEol: true,
      fontFamily: 'monospace'
    });
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    fitAddon.fit();

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;
    setIsTerminalReady(true);

    const initWc = async () => {
      try {
        const wc = await getWebContainer();
        setWebcontainer(wc);
        term.writeln("WebContainer booted successfully.");

        wc.on("server-ready", (port, url) => {
          term.writeln(`Server ready on port ${port} at ${url}`);
          setPreviewUrl(url);
        });
      } catch (err: any) {
        term.writeln("Failed to boot WebContainer: " + err?.message);
      }
    };
    initWc();

    const resizeObserver = new ResizeObserver(() => fitAddon.fit());
    resizeObserver.observe(terminalRef.current);

    return () => {
      resizeObserver.disconnect();
      term.dispose();
    };
  }, []);

  // Update terminal theme dynamically
  useEffect(() => {
    if (xtermRef.current) {
      const isDark = resolvedTheme === "dark";
      xtermRef.current.options.theme = {
        background: isDark ? "#0f172a" : "#f8fafc", // slate-900 / slate-50
        foreground: isDark ? "#f8fafc" : "#0f172a",
        cursor: isDark ? "#818cf8" : "#4f46e5",
      };
    }
  }, [resolvedTheme]);

  const param = useParams();
  const rawId = param?.projectid;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  const { data } = useShowMyProject(id);
  const { data: userData } = useProfile();
  const { mutate: mutateUpdateFileTree, isPending } = useUpdateFileTree();
  const { mutate: mutateAddPartner, isPending: isAddPartnerPending } = useAddPartner();
  const { mutate: mutateDeletePartner, isPending: isDeletePartnerPending } = useDeletePartner();

  // Sync fileTree and messages when project data loads
  useEffect(() => {
    if (data?.o) {
      const fileTreeFromApi = data.o.fileTree || {};
      setFileTree(fileTreeFromApi);
      if (!currentFile || !fileTreeFromApi[currentFile]) {
        const keys = Object.keys(fileTreeFromApi);
        setCurrentFile(keys.length > 0 ? keys[0] : "newFile");
      }

      // Load DB persisted chat history
      if (data.o.messages && Array.isArray(data.o.messages)) {
        setMessages(data.o.messages);
      }
    }
  }, [data]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // Auto-scroll on initial message load
    scrollToBottom();
  }, [messages.length]);

  // update content when currentFile or fileTree changes
  useEffect(() => {
    if (!currentFile) {
      setContent("Create or select a file to edit");
      return;
    }
    const contents = fileTree[currentFile]?.file?.contents;
    setContent(
      typeof contents === "string"
        ? contents
        : "Create or select a file to edit"
    );
  }, [currentFile, fileTree]);

  // file tree actions
  const addFileToTree = async () => {
    const name = (newFileName || "").trim();
    if (!name) return;
    if (fileTree[name]) return;

    const updatedFileTree = { ...fileTree, [name]: { file: { contents: "" } } };
    const previous = fileTree;
    setFileTree(updatedFileTree);
    setNewFileName("");
    setIsFileModalOpen(false);
    setOpenFiles((prev) => new Set([...prev, name]));
    setCurrentFile(name);

    mutateUpdateFileTree(
      { ft: updatedFileTree, id },
      {
        onError: () => {
          setFileTree(previous);
          setOpenFiles((prev) => {
            const next = new Set(prev);
            next.delete(name);
            return next;
          });
        },
      }
    );
  };

  const deleteFileFromTree = (fileName: string) => {
    const updatedFileTree = { ...fileTree };
    delete updatedFileTree[fileName];

    const previous = fileTree;
    setFileTree(updatedFileTree);

    if (currentFile === fileName) setCurrentFile(null);
    setOpenFiles((prev) => {
      const next = new Set(prev);
      next.delete(fileName);
      return next;
    });

    mutateUpdateFileTree(
      { ft: updatedFileTree, id },
      {
        onError: () => {
          setFileTree(previous);
          setOpenFiles((prev) => new Set(prev).add(fileName));
        },
      }
    );
  };

  const closeFile = (file: string) => {
    setOpenFiles((prevOpenFiles) => {
      const newOpenFiles = new Set(prevOpenFiles);
      newOpenFiles.delete(file);
      return newOpenFiles;
    });
    setCurrentFile((prevCurrentFile) =>
      prevCurrentFile === file ? null : prevCurrentFile
    );
  };

  const saveCurrentFile = () => {
    if (!currentFile) return;
    const prev = fileTree;
    const updated = {
      ...fileTree,
      [currentFile]: {
        ...fileTree[currentFile],
        file: { ...(fileTree[currentFile]?.file || {}), contents: content },
      },
    };
    setFileTree(updated);
    mutateUpdateFileTree(
      { ft: updated, id },
      {
        onError: () => {
          setFileTree(prev); // rollback
        },
      }
    );
  };

  // ---- Partner modal handlers ----
  const openPartnerModal = () => {
    setPartnerEmail("");
    setPartnerError(null);
    setPartnerSuccess(null);
    setIsPartnerModalOpen(true);
  };

  const closePartnerModal = () => {
    setIsPartnerModalOpen(false);
  };

  const handleAddPartner = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setPartnerError(null);
    setPartnerSuccess(null);

    const email = (partnerEmail || "").trim();
    if (!email) {
      setPartnerError("Partner email is required.");
      return;
    }
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(email)) {
      setPartnerError("Please enter a valid email address.");
      return;
    }

    mutateAddPartner(
      { id, partnerEmail: email },
      {
        onSuccess: () => {
          setPartnerSuccess("Partner added successfully.");
          setTimeout(() => {
            setIsPartnerModalOpen(false);
            setPartnerSuccess(null);
          }, 800);
        },
        onError: (err: any) => {
          const serverMsg = err?.response?.data?.e || "Failed to add partner.";
          setPartnerError(serverMsg);
        },
      }
    );
  };

  function WriteAiMessage({ message }: { message: any }) {
    try {
      return (
        <div className="overflow-auto p-1 text-[13px] leading-relaxed">
          <Markdown>{message || ""}</Markdown>
        </div>
      );
    } catch (err) {
      console.error(err);
      return <div className="text-red-500">Error parsing AI message.</div>;
    }
  }

  useEffect(() => {
    if (!id) return;

    const socket = initializeSocket(id);
    if (!socket) return;

    socket.on("connect", () => console.log("socket connected:", socket.id));
    socket.on("connect_error", (err: any) =>
      console.error("socket connect_error:", err?.message || err)
    );

    const handler = (data: any) => {
      try {
        if (data && typeof data.message === "string") {
          let parsed;
          try {
            parsed = JSON.parse(data.message);
          } catch(e) {
             // Not JSON, just a string message
             appendIncomingMessages(data);
             return;
          }
          // It was JSON
          appendIncomingMessages({ ...data, message: parsed });
          if (parsed.fileTree) setFileTree(parsed.fileTree);
        } else {
          appendIncomingMessages(data);
          if (data?.message?.fileTree) setFileTree(data.message.fileTree);

          const processCommands = async (cmdData: any) => {
            if (!webcontainer || !cmdData) return;
            try {
              if (cmdData.fileTree) {
                const wcFormatted = parseFileTreeToWebContainerFormat(cmdData.fileTree);
                await webcontainer.mount(wcFormatted);
                xtermRef.current?.writeln("Files mounted to WebContainer.");
              }

              if (cmdData.buildCommand && cmdData.buildCommand.mainItem) {
                xtermRef.current?.writeln(`Running build command: ${cmdData.buildCommand.mainItem} ${cmdData.buildCommand.commands?.join(" ")}`);
                const installProcess = await webcontainer.spawn(cmdData.buildCommand.mainItem, cmdData.buildCommand.commands || []);
                installProcess.output.pipeTo(new WritableStream({
                  write(chunk) {
                    xtermRef.current?.write(chunk);
                  }
                }));
                await installProcess.exit;
              }

              if (cmdData.startCommand && cmdData.startCommand.mainItem) {
                xtermRef.current?.writeln(`Running start command: ${cmdData.startCommand.mainItem} ${cmdData.startCommand.commands?.join(" ")}`);
                const startProcess = await webcontainer.spawn(cmdData.startCommand.mainItem, cmdData.startCommand.commands || []);
                startProcess.output.pipeTo(new WritableStream({
                  write(chunk) {
                    xtermRef.current?.write(chunk);
                  }
                }));
              }
            } catch (err: any) {
              xtermRef.current?.writeln(`Execution Error: ${err.message}`);
            }
          };

          if (data && typeof data.message === "string") {
            try {
               processCommands(JSON.parse(data.message));
            } catch(e){}
          } else {
            processCommands(data?.message);
          }
        }
      } catch (err) {
        appendIncomingMessages(data);
      }
    };

    receiveMessage("project-message", handler);

    return () => {
      try {
        socket.off("project-message", handler);
      } catch (e) { }
      try {
        socket.disconnect();
      } catch (e) { }
    };
  }, [id, webcontainer]);

  const scrollToBottom = () => {
    if (messageBoxRef.current) {
      messageBoxRef.current.scrollTop = messageBoxRef.current.scrollHeight;
    }
  };

  const appendIncomingMessages = (messageObject: any) => {
    setMessages((prevMessages) => [...prevMessages, messageObject]);
    scrollToBottom();
  };

  const appendOutgoingMessages = (messageObject: any) => {
    setMessages((prevMessages) => [...prevMessages, messageObject]);
    scrollToBottom();
  };

  const handleSend = () => {
    if (!message.trim()) return;
    const newMessage = {
      message,
      sender: userData?.data?.o?.name || userData?.data?.o?.email || "User",
    };
    sendMessage("project-message", newMessage);
    appendOutgoingMessages(newMessage);
    setMessage("");
    scrollToBottom();
  };

  const router = useRouter();

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 font-sans overflow-hidden transition-colors duration-300">
      {/* Header */}
      <header className="px-4 h-14 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/80 shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-3">
          <button
            className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400 transition-colors"
            onClick={() => router.push("/main")}
          >
            <MoveLeft size={16} />
          </button>
          <div className="p-2 bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 dark:from-indigo-500/30 dark:to-cyan-500/30 text-indigo-600 dark:text-indigo-400 rounded-lg border border-indigo-200/50 dark:border-indigo-500/20">
            <Folder size={16} />
          </div>
          <div>
            <h1 className="text-sm font-bold bg-gradient-to-r from-indigo-600 to-cyan-600 dark:from-indigo-400 dark:to-cyan-400 bg-clip-text text-transparent">
              {data?.o?.name || "PROJECT"}
            </h1>
            <p className="text-[11px] text-slate-500 font-medium tracking-wide uppercase">Collaborative Workspace</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button
            onClick={openPartnerModal}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-sm font-medium rounded-lg transition-colors border border-slate-200 dark:border-slate-800 shadow-sm"
          >
            <Users size={14} className="text-indigo-500 dark:text-indigo-400" />
            <span className="hidden sm:inline">Share</span>
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 overflow-hidden flex">
        {/* Activity Bar */}
        <div className="w-12 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 flex flex-col items-center py-4 gap-4 z-10 shadow-sm shrink-0">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`p-2 rounded-lg transition-colors ${isSidebarOpen ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"}`}
            title="Explorer"
          >
            <FileText size={20} />
          </button>
        </div>

        <ResizablePanelGroup direction="horizontal" className="h-full flex-1">
          {/* Sidebar Panel */}
          {isSidebarOpen && (
            <>
              <ResizablePanel 
                id="sidebar"
                order={1}
                defaultSize={20} 
                minSize={15} 
                maxSize={30} 
                className="flex flex-col bg-slate-50/50 dark:bg-slate-950/50"
              >
            <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Explorer</span>
              <button 
                onClick={() => setIsFileModalOpen(true)} 
                className="text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800"
              >
                <Plus size={14} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
              {Object.keys(fileTree || {}).map((file) => (
                <div
                  key={file}
                  className={`group flex items-center justify-between px-2 py-1.5 rounded-md cursor-pointer text-[13px] transition-all ${
                    currentFile === file 
                      ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 font-medium" 
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
                  onClick={() => {
                    setCurrentFile(file);
                    setOpenFiles((prev) => new Set([...prev, file]));
                  }}
                >
                  <div className="flex items-center gap-2 truncate">
                    <FileText size={14} className={currentFile === file ? "text-indigo-500" : "opacity-70"} />
                    <span className="truncate">{file}</span>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteFileFromTree(file); }}
                    className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition-opacity p-1 rounded hover:bg-red-50 dark:hover:bg-red-500/10"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
              </ResizablePanel>

              <ResizableHandle className="bg-slate-200 dark:bg-slate-800 w-[2px] hover:bg-indigo-500 dark:hover:bg-indigo-500 transition-colors" />
            </>
          )}

          {/* Editor Panel */}
          <ResizablePanel id="editor" order={2} defaultSize={55} className="flex flex-col bg-white dark:bg-[#1e1e1e]">
            <ResizablePanelGroup direction="vertical">
              <ResizablePanel defaultSize={70} className="flex flex-col">
                <div className="flex items-center overflow-x-auto border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 no-scrollbar">
                  {Array.from(openFiles).map((file) => (
                    <div
                      key={file}
                      className={`group flex items-center gap-2 px-4 py-2 min-w-32 cursor-pointer text-xs transition-colors border-r border-slate-200 dark:border-slate-800 ${
                        currentFile === file 
                          ? "bg-white dark:bg-[#1e1e1e] text-indigo-600 dark:text-white border-t-[3px] border-t-indigo-500 font-medium shadow-sm" 
                          : "bg-slate-50 dark:bg-slate-950 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-700 dark:hover:text-slate-300 border-t-[3px] border-t-transparent pt-[9px]"
                      }`}
                      onClick={() => setCurrentFile(file)}
                    >
                      <span className="truncate flex-1">{file}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); closeFile(file); }}
                        className={`p-0.5 rounded-sm hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors ${
                          currentFile === file ? "text-slate-400 hover:text-slate-900 dark:hover:text-white" : "opacity-0 group-hover:opacity-100"
                        }`}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                  {Array.from(openFiles).length === 0 && (
                    <div className="px-4 py-2 text-xs text-slate-500 italic">No open files</div>
                  )}
                </div>

                <div className="flex items-center justify-between px-4 py-1.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1e1e1e]">
                  <div className="text-[11px] text-slate-400 font-mono tracking-wide">
                    {currentFile ? `~/${currentFile}` : "workspace"}
                  </div>
                  <button
                    disabled={!currentFile || isPending}
                    onClick={saveCurrentFile}
                    className="flex items-center gap-1.5 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 dark:hover:bg-indigo-500 text-white text-[11px] font-bold tracking-wide uppercase rounded shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save size={12} /> {isPending ? "Saving" : "Save"}
                  </button>
                </div>

                <div className="flex-1 relative bg-white dark:bg-[#1e1e1e]">
                  {currentFile ? (
                    <Editor
                      height="100%"
                      theme={resolvedTheme === "dark" ? "vs-dark" : "light"}
                      path={currentFile}
                      value={content}
                      onChange={(val) => setContent(val || "")}
                      options={{ minimap: { enabled: false }, fontSize: 13, wordWrap: "on", scrollBeyondLastLine: false, padding: { top: 16 } }}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-400 dark:text-slate-600 text-sm bg-slate-50 dark:bg-slate-950">
                      <div className="text-center">
                        <FileText size={48} className="mx-auto mb-4 opacity-20" />
                        <p>Select a file from the explorer to start editing</p>
                      </div>
                    </div>
                  )}
                </div>
              </ResizablePanel>

              <ResizableHandle className="bg-slate-200 dark:bg-slate-800 h-[2px] hover:bg-indigo-500 dark:hover:bg-indigo-500 transition-colors" />

              <ResizablePanel defaultSize={30} className="flex flex-col bg-slate-50 dark:bg-slate-900 shadow-inner">
                <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-950/50">
                  <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <TerminalIcon size={13} /> Terminal Preview
                  </div>
                  {previewUrl && (
                    <a href={previewUrl} target="_blank" rel="noreferrer" className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 transition-colors">
                      Open App &nearr;
                    </a>
                  )}
                </div>
                <div ref={terminalRef} className="flex-1 overflow-hidden p-2" />
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>

          <ResizableHandle className="bg-slate-200 dark:bg-slate-800 w-[2px] hover:bg-indigo-500 dark:hover:bg-indigo-500 transition-colors" />

          {/* AI Chat Panel */}
          <ResizablePanel id="chat" order={3} defaultSize={25} minSize={20} className="flex flex-col bg-white dark:bg-slate-950">
            <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50 dark:bg-slate-950/50 shadow-sm">
              <span className="text-[11px] font-bold bg-gradient-to-r from-indigo-600 to-cyan-600 dark:from-indigo-400 dark:to-cyan-400 bg-clip-text text-transparent uppercase tracking-widest flex items-center gap-2">
                <MessageSquare size={14} className="text-indigo-500" /> Orbit Chat
              </span>
            </div>

            <div ref={messageBoxRef} className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50/50 dark:bg-slate-950/20 scroll-smooth">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-600">
                  <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-900 mb-4">
                    <MessageSquare size={32} className="text-indigo-500/50" />
                  </div>
                  <p className="text-sm font-medium">Type <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 text-xs font-mono">@ai</kbd> to prompt Orbit</p>
                  <p className="text-xs mt-2 text-slate-400">Or chat with your team directly!</p>
                </div>
              )}
              {messages.map((msg, i) => {
                const isMe = msg.sender === (userData?.data?.o?.name || userData?.data?.o?.email) || msg.sender === "User";
                const isAI = msg.sender?.email === "AI" || msg.sender === "AI" || msg.sender?.name === "Orbit AI";
                
                return (
                  <div key={i} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                    <div className="text-[10px] text-slate-500 mb-1.5 px-1 font-medium tracking-wide uppercase">
                      {isAI ? "Orbit AI" : isMe ? "You" : msg.sender?.name || msg.sender}
                    </div>
                    <div className={`text-[13px] px-4 py-2.5 max-w-[92%] shadow-sm ${
                        isMe 
                          ? "bg-gradient-to-br from-indigo-600 to-indigo-500 text-white rounded-2xl rounded-tr-sm"
                          : isAI 
                            ? "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 rounded-2xl rounded-tl-sm prose prose-sm dark:prose-invert"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-2xl rounded-tl-sm"
                      }`}>
                      {isAI ? <WriteAiMessage message={msg.message} /> : <Markdown>{typeof msg?.message === 'string' ? msg.message : JSON.stringify(msg.message)}</Markdown>}
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="p-3 border-t border-slate-200 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-950">
              <div className="relative group">
                <input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                  placeholder="Ask Orbit (@ai) or your team..."
                  className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl pl-4 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-inner"
                />
                <button
                  onClick={handleSend}
                  disabled={!message.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 text-white hover:bg-indigo-500 rounded-lg transition-all shadow-md group-focus-within:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={14} className="ml-0.5" />
                </button>
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Partner Modal */}
      {isPartnerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
              <h2 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users size={18} className="text-indigo-500" /> Share Project
              </h2>
              <button onClick={closePartnerModal} className="text-slate-400 hover:text-slate-600 dark:hover:text-white bg-slate-100 dark:bg-slate-800 p-1 rounded-md transition-colors"><X size={16} /></button>
            </div>
            <form onSubmit={handleAddPartner} className="p-5 space-y-5">
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5 block">Collaborator Email</label>
                <input
                  type="email"
                  value={partnerEmail}
                  onChange={(e) => setPartnerEmail(e.target.value)}
                  placeholder="team@example.com"
                  className="w-full bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner transition-shadow"
                  required
                />
              </div>
              {partnerError && <div className="text-red-500 dark:text-red-400 text-xs font-medium bg-red-50 dark:bg-red-500/10 p-2 rounded-md">{partnerError}</div>}
              {partnerSuccess && <div className="text-emerald-500 dark:text-emerald-400 text-xs font-medium bg-emerald-50 dark:bg-emerald-500/10 p-2 rounded-md">{partnerSuccess}</div>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closePartnerModal} className="flex-1 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-white border border-slate-200 dark:border-slate-700 text-sm py-2.5 font-medium rounded-xl transition-colors shadow-sm">Cancel</button>
                <button type="submit" disabled={isAddPartnerPending} className="flex-1 bg-indigo-600 hover:bg-indigo-700 dark:hover:bg-indigo-500 text-white text-sm py-2.5 font-bold rounded-xl shadow-md shadow-indigo-500/20 transition-all disabled:opacity-50">
                  {isAddPartnerPending ? "Sending..." : "Send Invite"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create File Modal */}
      {isFileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
              <h2 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText size={18} className="text-indigo-500" /> Create New File
              </h2>
              <button onClick={() => { setIsFileModalOpen(false); setNewFileName(""); }} className="text-slate-400 hover:text-slate-600 dark:hover:text-white bg-slate-100 dark:bg-slate-800 p-1 rounded-md transition-colors">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); addFileToTree(); }} className="p-5 space-y-5">
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5 block">File Name</label>
                <input
                  autoFocus
                  type="text"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  placeholder="e.g. index.html"
                  className="w-full bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner transition-shadow"
                  required
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setIsFileModalOpen(false); setNewFileName(""); }} className="flex-1 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-white border border-slate-200 dark:border-slate-700 text-sm py-2.5 font-medium rounded-xl transition-colors shadow-sm">Cancel</button>
                <button type="submit" disabled={!newFileName.trim()} className="flex-1 bg-indigo-600 hover:bg-indigo-700 dark:hover:bg-indigo-500 text-white text-sm py-2.5 font-bold rounded-xl shadow-md shadow-indigo-500/20 transition-all disabled:opacity-50">
                  Create File
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
