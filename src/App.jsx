import React, { useState, useEffect, useRef } from "react";
import {
  Plus,
  MessageSquare,
  Trash2,
  Send,
  User,
  Bot,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  LogOut,
  File,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import ReactMarkdown from "react-markdown";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { sendMessageStream, generateTitle } from "./services/geminiService";
import { processAndUploadPDF } from "./services/pdfService";
import { getUserFiles } from "./services/storageService";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Login from "./components/Login";
import Register from "./components/Register";
import PDFUploader from "./components/PDFUploader";

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const STORAGE_KEY = "gemini_chat_history";

// Helper function to safely load from local storage
const loadInitialConversations = () => {
  if (typeof window === "undefined") return [];
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to parse history", e);
    }
  }
  return [];
};

function ChatApp() {
  const { user, logout, loading } = useAuth();
  const [authMode, setAuthMode] = useState("login");

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Auth UI
  if (!user) {
    if (authMode === "login") {
      return <Login onSwitchToRegister={() => setAuthMode("register")} />;
    } else {
      return <Register onSwitchToLogin={() => setAuthMode("login")} />;
    }
  }

  // Main App - Authenticated User
  return <MainChat user={user} onLogout={logout} />;
}

function MainChat({ user, onLogout }) {
  // Lazy initialization for state
  const [conversations, setConversations] = useState(loadInitialConversations);

  const [activeId, setActiveId] = useState(() => {
    const initialData = loadInitialConversations();
    return initialData.length > 0 ? initialData[0].id : null;
  });

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isProcessingPDF, setIsProcessingPDF] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Save to localStorage whenever conversations change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
  }, [conversations]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversations, activeId, isLoading]);

  // Load user's uploaded files from Supabase
  useEffect(() => {
    const loadUserFiles = async () => {
      if (user?.id) {
        try {
          const files = await getUserFiles(user.id);
          setUploadedFiles(files);
        } catch (error) {
          console.error("Failed to load user files:", error);
        }
      }
    };

    loadUserFiles();
  }, [user?.id]);

  const activeConversation = conversations.find((c) => c.id === activeId);

  const createNewChat = () => {
    const newChat = {
      id: crypto.randomUUID(),
      title: "New Chat",
      messages: [],
      updatedAt: Date.now(),
    };
    setConversations((prev) => [newChat, ...prev]);
    setActiveId(newChat.id);
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const deleteChat = (id, e) => {
    e.stopPropagation();
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeId === id) {
      setActiveId(null);
    }
  };

  const handlePDFUpload = async (file) => {
    setIsProcessingPDF(true);

    try {
      // Process and upload PDF to Supabase
      const result = await processAndUploadPDF(
        file,
        user.id,
        sendMessageStream,
      );

      // Update uploaded files list
      setUploadedFiles((prev) => [result.fileRecord, ...prev]);

      // Add messages to current chat
      let currentId = activeId;
      let currentConversations = [...conversations];

      if (!currentId) {
        const newChat = {
          id: crypto.randomUUID(),
          title: `PDF: ${file.name}`,
          messages: [],
          updatedAt: Date.now(),
        };
        currentConversations = [newChat, ...currentConversations];
        setConversations(currentConversations);
        setActiveId(newChat.id);
        currentId = newChat.id;
      }

      const userMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: `📄 Uploaded PDF: ${file.name}\n\nPlease summarize this PDF:`,
        timestamp: Date.now(),
      };

      const assistantMessage = {
        id: crypto.randomUUID(),
        role: "model",
        content: result.summary,
        timestamp: Date.now(),
      };

      const updatedConversations = currentConversations.map((c) => {
        if (c.id === currentId) {
          return {
            ...c,
            messages: [...c.messages, userMessage, assistantMessage],
            updatedAt: Date.now(),
          };
        }
        return c;
      });

      setConversations(updatedConversations);
    } catch (error) {
      console.error("PDF processing error:", error);
      alert("Error processing PDF: " + error.message);
    } finally {
      setIsProcessingPDF(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    let currentId = activeId;
    let currentConversations = [...conversations];

    if (!currentId) {
      const newChat = {
        id: crypto.randomUUID(),
        title: "New Chat",
        messages: [],
        updatedAt: Date.now(),
      };
      currentConversations = [newChat, ...currentConversations];
      setConversations(currentConversations);
      setActiveId(newChat.id);
      currentId = newChat.id;
    }

    const userMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: input,
      timestamp: Date.now(),
    };

    const updatedConversations = currentConversations.map((c) => {
      if (c.id === currentId) {
        return {
          ...c,
          messages: [...c.messages, userMessage],
          updatedAt: Date.now(),
        };
      }
      return c;
    });

    setConversations(updatedConversations);
    setInput("");
    setIsLoading(true);

    try {
      const chat = updatedConversations.find((c) => c.id === currentId);
      const history = chat.messages.slice(0, -1).map((m) => ({
        role: m.role,
        parts: [{ text: m.content }],
      }));

      const assistantMessageId = crypto.randomUUID();
      let assistantContent = "";

      // Add empty assistant message first
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === currentId) {
            return {
              ...c,
              messages: [
                ...c.messages,
                {
                  id: assistantMessageId,
                  role: "model",
                  content: "",
                  timestamp: Date.now(),
                },
              ],
            };
          }
          return c;
        }),
      );

      const stream = sendMessageStream(userMessage.content, history);

      for await (const chunk of stream) {
        assistantContent += chunk;
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id === currentId) {
              return {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === assistantMessageId
                    ? { ...m, content: assistantContent }
                    : m,
                ),
              };
            }
            return c;
          }),
        );
      }

      // Generate title if it's the first message
      if (chat.messages.length === 1) {
        const title = await generateTitle(userMessage.content);
        setConversations((prev) =>
          prev.map((c) => (c.id === currentId ? { ...c, title } : c)),
        );
      }
    } catch (error) {
      console.error("Chat error:", error);
      // Add error message
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === currentId) {
            return {
              ...c,
              messages: [
                ...c.messages,
                {
                  id: crypto.randomUUID(),
                  role: "model",
                  content: "Sorry, I encountered an error. Please try again.",
                  timestamp: Date.now(),
                },
              ],
            };
          }
          return c;
        }),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleLogout = async () => {
    try {
      await onLogout();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <div className="flex h-screen w-full bg-white overflow-hidden font-sans">
      {/* Sidebar Overlay for Mobile */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/20 z-20 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          width: isSidebarOpen ? 260 : 0,
          x: isSidebarOpen ? 0 : -260,
        }}
        className={cn(
          "fixed md:relative z-30 h-full bg-zinc-50 border-r border-zinc-200 flex flex-col transition-all duration-300 ease-in-out overflow-hidden",
          !isSidebarOpen && "md:w-0",
        )}
      >
        <div className="p-3 flex flex-col h-full w-[260px]">
          <button
            onClick={createNewChat}
            className="flex items-center gap-3 px-3 py-2 w-full bg-white border border-zinc-200 rounded-lg text-sm font-medium hover:bg-zinc-100 transition-colors shadow-sm mb-4"
          >
            <Plus size={16} />
            New Chat
          </button>

          <div className="flex-1 overflow-y-auto space-y-1">
            <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider px-3 mb-2">
              Recent Conversations
            </div>
            {conversations.map((chat) => (
              <div
                key={chat.id}
                onClick={() => {
                  setActiveId(chat.id);
                  if (window.innerWidth < 768) setIsSidebarOpen(false);
                }}
                className={cn(
                  "group flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer text-sm transition-all",
                  activeId === chat.id
                    ? "bg-zinc-200 text-zinc-900 font-medium"
                    : "text-zinc-600 hover:bg-zinc-100",
                )}
              >
                <MessageSquare size={16} className="shrink-0" />
                <span className="truncate flex-1">{chat.title}</span>
                <button
                  onClick={(e) => deleteChat(chat.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-opacity"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            {conversations.length === 0 && (
              <div className="px-3 py-8 text-center text-zinc-400 text-xs italic">
                No history yet
              </div>
            )}
          </div>

          {uploadedFiles.length > 0 && (
            <div className="mt-4 pt-4 border-t border-zinc-200">
              <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider px-3 mb-2">
                Uploaded Files
              </div>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {uploadedFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center gap-2 px-3 py-2 text-xs text-zinc-600 bg-white rounded-lg hover:bg-zinc-100 transition-colors"
                    title={`${file.file_name} (${(file.file_size / 1024 / 1024).toFixed(1)}MB)`}
                  >
                    <File size={12} className="shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="truncate font-medium">
                        {file.file_name}
                      </div>
                      <div className="text-[10px] text-zinc-400">
                        {new Date(file.uploaded_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-auto pt-4 border-t border-zinc-200">
            <div className="flex items-center justify-between px-3 py-2 text-sm text-zinc-600">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-semibold">
                  {user?.email?.charAt(0).toUpperCase()}
                </div>
                <span className="truncate font-medium text-xs">
                  {user?.email}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="p-1 hover:bg-zinc-200 rounded-lg transition-colors"
                title="Logout"
              >
                <LogOut size={14} />
              </button>
            </div>
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full relative min-w-0">
        {/* Header */}
        <header className="h-14 border-b border-zinc-100 flex items-center px-4 justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-zinc-100 rounded-lg text-zinc-500 transition-colors"
            >
              <Menu size={20} />
            </button>
            <h1 className="font-semibold text-zinc-800 truncate max-w-[200px] md:max-w-md">
              {activeConversation?.title || "AI Chat"}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="px-2 py-1 rounded-md bg-zinc-100 text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">
              Pro Chat
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg text-zinc-500 hover:bg-zinc-100 transition-colors"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-8">
          <div className="max-w-3xl mx-auto space-y-8">
            {!activeConversation || activeConversation.messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center pt-20 text-center space-y-6">
                <div className="w-16 h-16 rounded-2xl bg-zinc-50 flex items-center justify-center border border-zinc-100 shadow-sm">
                  <Bot size={32} className="text-zinc-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-zinc-800">
                    How can I help you today?
                  </h2>
                  <p className="text-zinc-500 mt-2 max-w-sm mx-auto">
                    Ask me anything or upload a PDF to get started.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-xl">
                  {[
                    "Write a Python script for web scraping",
                    "Explain quantum computing in simple terms",
                    "Help me plan a 3-day trip to Tokyo",
                    "Give me ideas for a healthy dinner",
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => setInput(suggestion)}
                      className="p-3 text-left text-sm border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors text-zinc-600"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              activeConversation.messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-4 md:gap-6",
                    message.role === "user" ? "flex-row-reverse" : "flex-row",
                  )}
                >
                  <div
                    className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm",
                      message.role === "user"
                        ? "bg-zinc-800 text-white"
                        : "bg-zinc-100 text-zinc-600 border border-zinc-200",
                    )}
                  >
                    {message.role === "user" ? (
                      <User size={16} />
                    ) : (
                      <Bot size={16} />
                    )}
                  </div>
                  <div
                    className={cn(
                      "flex-1 min-w-0 space-y-2",
                      message.role === "user" ? "text-right" : "text-left",
                    )}
                  >
                    <div
                      className={cn(
                        "inline-block max-w-full rounded-2xl px-4 py-3 text-sm leading-relaxed",
                        message.role === "user"
                          ? "bg-zinc-100 text-zinc-800"
                          : "bg-white text-zinc-800",
                      )}
                    >
                      <div className="prose prose-sm max-w-none prose-zinc prose-p:leading-relaxed prose-pre:bg-zinc-900 prose-pre:text-zinc-50">
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      </div>
                    </div>
                    <div className="text-[10px] text-zinc-400 px-1">
                      {new Date(message.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex gap-4 md:gap-6">
                <div className="w-8 h-8 rounded-lg bg-zinc-100 text-zinc-600 border border-zinc-200 flex items-center justify-center shrink-0 animate-pulse">
                  <Bot size={16} />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex gap-1 items-center h-8">
                    <span className="w-1.5 h-1.5 bg-zinc-300 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-1.5 h-1.5 bg-zinc-300 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-1.5 h-1.5 bg-zinc-300 rounded-full animate-bounce"></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 md:p-6 bg-gradient-to-t from-white via-white to-transparent">
          <div className="max-w-3xl mx-auto">
            {/* PDF Uploader */}
            <PDFUploader
              onUpload={handlePDFUpload}
              isLoading={isProcessingPDF}
            />

            {/* Chat Input */}
            <div className="relative">
              <div className="relative flex items-end gap-2 bg-zinc-50 border border-zinc-200 rounded-2xl p-2 focus-within:border-zinc-400 transition-colors shadow-sm">
                <textarea
                  ref={inputRef}
                  rows={1}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Message your AI assistant..."
                  className="flex-1 bg-transparent border-none focus:ring-0 resize-none py-2 px-3 text-sm max-h-40 min-h-[40px]"
                  style={{ height: "auto" }}
                  onInput={(e) => {
                    const target = e.target;
                    target.style.height = "auto";
                    target.style.height = `${target.scrollHeight}px`;
                  }}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className={cn(
                    "p-2 rounded-xl transition-all",
                    input.trim() && !isLoading
                      ? "bg-zinc-800 text-white hover:bg-zinc-700"
                      : "bg-zinc-200 text-zinc-400 cursor-not-allowed",
                  )}
                >
                  <Send size={18} />
                </button>
              </div>
              <p className="text-[10px] text-center text-zinc-400 mt-3">
                AI can make mistakes. Check important info.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ChatApp />
    </AuthProvider>
  );
}
