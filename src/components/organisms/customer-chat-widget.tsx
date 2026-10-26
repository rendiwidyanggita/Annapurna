"use client";

import { useState, useEffect, useRef } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  BubbleChatIcon,
  Cancel01Icon,
  SentIcon,
  RotateRight01Icon,
  SparklesIcon,
} from "@hugeicons/core-free-icons";

interface ChatMessage {
  id: string;
  sender: "user" | "bot";
  message: string;
  createdAt?: string;
  isOutOfScope?: boolean;
}

const QUICK_PROMPTS = [
  "Bagaimana cara sewa & bayar DP?",
  "Apa syarat jaminan KTP / identitas?",
  "Berapa denda jika terlambat kembali?",
  "Cek status pesanan TRX-...",
];

export function CustomerChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize or restore session from localStorage
  useEffect(() => {
    const savedSessionId = localStorage.getItem("annapurna_chat_session_id");
    if (savedSessionId) {
      setSessionId(savedSessionId);
      // Fetch history
      fetch(`/api/chatbot?sessionId=${savedSessionId}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.session?.messages) {
            setMessages(
              data.session.messages.map((m: { id: string; sender: "user" | "bot"; message: string; createdAt: string; isOutOfScope: boolean }) => ({
                id: m.id,
                sender: m.sender,
                message: m.message,
                createdAt: m.createdAt,
                isOutOfScope: m.isOutOfScope,
              }))
            );
          }
        })
        .catch((err) => console.warn("Failed to load chat history:", err));
    } else {
      // Default initial bot welcome
      setMessages([
        {
          id: "welcome-1",
          sender: "bot",
          message:
            "Halo! Selamat datang di **Annapurna Outdoor Rent Purwokerto** 🏔️\nAda yang bisa kami bantu seputar rekomendasi tenda & alat camping, paket sewa hemat, atau cek status pesanan Anda?",
        },
      ]);
    }
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    setInputMessage("");

    // Optimistic user message
    const tempUserMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      sender: "user",
      message: text,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);
    setIsLoading(true);

    try {
      const res = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          sessionId: sessionId || undefined,
        }),
      });

      if (!res.ok) throw new Error("Gagal mengirim pesan");

      const data = await res.json();

      if (data.sessionId && data.sessionId !== sessionId) {
        setSessionId(data.sessionId);
        localStorage.setItem("annapurna_chat_session_id", data.sessionId);
      }

      const botMsg: ChatMessage = {
        id: data.messageId || `bot-${Date.now()}`,
        sender: "bot",
        message: data.response,
        createdAt: new Date().toISOString(),
        isOutOfScope: data.isOutOfScope,
      };

      setMessages((prev) => [...prev, botMsg]);

      if (!isOpen) {
        setHasUnread(true);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: "bot",
          message:
            "Mohon maaf, saat ini sedang terjadi kendala koneksi ke asisten AI. Silakan coba sesaat lagi.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };
  const handleResetChat = () => {
    if (!confirm("Mulai percakapan baru? Riwayat sesi ini akan direset dari perangkat Anda.")) return;
    localStorage.removeItem("annapurna_chat_session_id");
    setSessionId(null);
    setMessages([
      {
        id: "welcome-1",
        sender: "bot",
        message:
          "Halo! Selamat datang di **Annapurna Outdoor Rent Purwokerto** 🏔️\nAda yang bisa kami bantu seputar rekomendasi tenda & alat camping, paket sewa hemat, atau cek status pesanan Anda?",
      },
    ]);
  };

  // Structured markdown renderer for bold, italic, bullet points, and paragraphs
  const renderMessageContent = (text: string) => {
    return text.split("\n").map((line, i) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) {
        return <div key={i} className="h-1.5" />;
      }

      const isBullet = trimmedLine.startsWith("•") || trimmedLine.startsWith("-") || trimmedLine.startsWith("* ");
      const displayContent = isBullet ? trimmedLine.replace(/^[•\-\*]\s*/, "") : line;

      // Process bold and italic
      const parts = displayContent.split(/(\*\*.*?\*\*|\*[^*]+?\*)/g);
      const renderedParts = parts.map((part, j) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={j} className="font-semibold">{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith("*") && part.endsWith("*")) {
          return <em key={j} className="text-gray-500 text-[10.5px] italic">{part.slice(1, -1)}</em>;
        }
        return part;
      });

      if (isBullet) {
        return (
          <div key={i} className="flex items-start gap-1.5 leading-relaxed my-0.5">
            <span className="text-[#16624B] shrink-0 font-bold">•</span>
            <div className="flex-1">{renderedParts}</div>
          </div>
        );
      }

      return (
        <div key={i} className="leading-relaxed">
          {renderedParts}
        </div>
      );
    });
  };

  return (
    <>
      {/* ── Trigger Floating Button ── */}
      <div className="fixed bottom-6 right-6 z-50">
        {!isOpen && (
          <button
            onClick={() => {
              setIsOpen(true);
              setHasUnread(false);
            }}
            className="group relative flex items-center gap-2 bg-[#16624B] hover:bg-[#0F4F3C] text-white p-3.5 sm:px-4 sm:py-3 rounded-full shadow-xl transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-emerald-200"
            aria-label="Tanya AI Asisten"
          >
            <div className="relative">
              <HugeiconsIcon icon={BubbleChatIcon} size={22} className="text-white" />
              {hasUnread && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full border-2 border-white animate-pulse" />
              )}
            </div>
            <span className="hidden sm:inline font-bold text-xs tracking-wide">
              Tanya Asisten AI
            </span>
          </button>
        )}
      </div>

      {/* ── Chat Window Popup ── */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[calc(100vw-32px)] sm:w-96 h-[540px] max-h-[85vh] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="p-3.5 bg-[#16624B] text-white flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <HugeiconsIcon icon={SparklesIcon} size={16} className="text-emerald-200" />
              </div>
              <div>
                <h3 className="font-bold text-xs sm:text-sm leading-tight flex items-center gap-1.5">
                  ANNAPURNA Assistant
                  <span className="text-[9px] bg-emerald-800 text-emerald-200 px-1.5 py-0.2 rounded font-mono uppercase">
                    AI
                  </span>
                </h3>
                <p className="text-[10px] text-emerald-100/80">Layanan Pelanggan 24/7</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleResetChat}
                title="Mulai Sesi Baru"
                className="p-1.5 text-emerald-100 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <HugeiconsIcon icon={RotateRight01Icon} size={15} />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Tutup Chat"
                className="p-1.5 text-emerald-100 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <HugeiconsIcon icon={Cancel01Icon} size={17} />
              </button>
            </div>
          </div>

          {/* Quick Prompts Bar */}
          <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 overflow-x-auto no-scrollbar flex items-center gap-1.5 shrink-0">
            {QUICK_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(prompt)}
                disabled={isLoading}
                className="text-[10px] whitespace-nowrap bg-white border border-gray-200 hover:border-[#16624B] hover:text-[#16624B] text-gray-600 px-2.5 py-1 rounded-full transition-colors shrink-0 disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Messages Body */}
          <div className="flex-1 p-3.5 overflow-y-auto space-y-3 bg-[#FAFAFA] text-xs">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.sender === "user" ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs shadow-2xs ${
                    msg.sender === "user"
                      ? "bg-[#16624B] text-white rounded-br-xs"
                      : "bg-white text-gray-800 border border-gray-200 rounded-bl-xs"
                  }`}
                >
                  {renderMessageContent(msg.message)}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 text-gray-400 text-xs italic bg-white border border-gray-200 p-2.5 rounded-2xl w-fit">
                <span className="w-2 h-2 rounded-full bg-[#16624B] animate-ping" />
                <span>Asisten sedang mengetik...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-2.5 bg-white border-t border-gray-200 flex items-center gap-2 shrink-0"
          >
            <input
              type="text"
              placeholder="Ketik pertanyaan atau kode booking..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              disabled={isLoading}
              className="flex-1 text-xs px-3 py-2 rounded-xl border border-gray-300 focus:outline-none focus:border-[#16624B] bg-gray-50 focus:bg-white"
            />
            <button
              type="submit"
              disabled={isLoading || !inputMessage.trim()}
              className="p-2 rounded-xl bg-[#16624B] hover:bg-[#0F4F3C] text-white disabled:opacity-40 transition-colors"
            >
              <HugeiconsIcon icon={SentIcon} size={16} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
