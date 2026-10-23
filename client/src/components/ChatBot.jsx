import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { sendChatMessage } from "../services/chatService";

const SUGGESTED_QUESTIONS = [
  "Are there any tech events happening within the next 3 days?",
  "Which upcoming event would be most useful for a Pharmacy student?",
  "What events are happening this week?",
  "Show me upcoming coding competitions",
];

/**
 * Lightweight inline markdown renderer for chatbot replies
 */
function FormattedMessage({ content, onNavigate }) {
  if (!content) return null;

  // Split lines
  const lines = content.split("\n");

  const parseInline = (text) => {
    // Regex for markdown links [text](url) and bold **text**
    const tokens = [];
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let lastIndex = 0;
    let match;

    while ((match = linkRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        tokens.push({ type: "text", value: text.slice(lastIndex, match.index) });
      }
      tokens.push({ type: "link", label: match[1], url: match[2] });
      lastIndex = linkRegex.lastIndex;
    }
    if (lastIndex < text.length) {
      tokens.push({ type: "text", value: text.slice(lastIndex) });
    }

    return tokens.map((token, i) => {
      if (token.type === "link") {
        const isInternal = token.url.startsWith("/");
        if (isInternal) {
          return (
            <button
              key={i}
              type="button"
              onClick={() => onNavigate(token.url)}
              className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-800 underline underline-offset-2 cursor-pointer bg-blue-50/70 hover:bg-blue-100/70 px-1.5 py-0.5 rounded transition-colors text-xs mx-0.5"
            >
              <span>{token.label}</span>
              <svg className="w-3 h-3 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          );
        }
        return (
          <a
            key={i}
            href={token.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-semibold text-indigo-600 hover:text-indigo-800 underline underline-offset-2 cursor-pointer bg-indigo-50/70 hover:bg-indigo-100/70 px-1.5 py-0.5 rounded transition-colors text-xs mx-0.5"
          >
            <span>{token.label}</span>
            <svg className="w-3 h-3 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        );
      }

      // Parse bold **text** within text tokens
      const boldParts = token.value.split(/(\*\*[^*]+\*\*)/g);
      return (
        <span key={i}>
          {boldParts.map((part, pIdx) => {
            if (part.startsWith("**") && part.endsWith("**")) {
              return (
                <strong key={pIdx} className="font-semibold text-gray-900">
                  {part.slice(2, -2)}
                </strong>
              );
            }
            return part;
          })}
        </span>
      );
    });
  };

  return (
    <div className="space-y-1.5 leading-relaxed text-xs sm:text-sm">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-1" />;

        // Bullet list item
        if (trimmed.startsWith("* ") || trimmed.startsWith("- ")) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-1 my-0.5">
              <span className="text-blue-500 font-bold mt-0.5 select-none">•</span>
              <div className="flex-1">{parseInline(trimmed.slice(2))}</div>
            </div>
          );
        }

        return <p key={idx}>{parseInline(line)}</p>;
      })}
    </div>
  );
}

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFailedMessage, setLastFailedMessage] = useState(null);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const navigate = useNavigate();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, loading, isOpen]);

  // Focus textarea when opening panel
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => textareaRef.current?.focus(), 150);
    }
  }, [isOpen]);

  const handleSend = async (textToSend) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    setError(null);
    setLastFailedMessage(null);
    setInput("");

    // Add user message to conversation
    const newMessages = [...messages, { role: "user", content: query, timestamp: new Date() }];
    setMessages(newMessages);
    setLoading(true);

    try {
      // Build lightweight conversation history for backend context (max last 4 turns)
      const historyContext = newMessages
        .slice(0, -1)
        .slice(-4)
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await sendChatMessage(query, historyContext);
      if (res && res.success) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: res.reply, timestamp: new Date(), eventsCount: res.eventsCount },
        ]);
      } else {
        throw new Error(res?.message || "Failed to receive an answer.");
      }
    } catch (err) {
      console.error("Chat error:", err);
      const errMsg = err.response?.data?.message || err.message || "Something went wrong. Please try again.";
      setError(errMsg);
      setLastFailedMessage(query);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleRetry = () => {
    if (lastFailedMessage) {
      handleSend(lastFailedMessage);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    setError(null);
    setLastFailedMessage(null);
  };

  const handleNavigate = (path) => {
    navigate(path);
  };

  return (
    <>
      {/* ── Floating Chatbot Button (Closed State) ────────────────────────── */}
      {!isOpen && (
        <div className="fixed bottom-5 right-5 z-40 flex items-center group">
          {/* Subtle hover tooltip */}
          <span className="hidden sm:inline-block mr-2.5 px-3 py-1.5 bg-gray-900/90 text-white text-xs font-medium rounded-lg shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none backdrop-blur-sm">
            Ask CampusConnect AI
          </span>
          <button
            id="open-chatbot-btn"
            onClick={() => setIsOpen(true)}
            aria-label="Open CampusConnect AI Chatbot"
            className="w-13 h-13 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-700 hover:to-indigo-700 text-white shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center cursor-pointer border-2 border-white/80 relative"
          >
            {/* Sparkles / Chatbot SVG Icon */}
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
              />
            </svg>
            {/* Active pulse dot */}
            <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white"></span>
            </span>
          </button>
        </div>
      )}

      {/* ── Floating Chatbot Window (Open State) ───────────────────────────── */}
      {isOpen && (
        <div
          id="chatbot-window"
          className="fixed bottom-5 right-5 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[560px] max-h-[calc(100vh-6rem)] flex flex-col bg-white rounded-2xl shadow-2xl border border-gray-200/90 overflow-hidden transition-all duration-200 animate-in fade-in zoom-in-95"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white p-3.5 px-4 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white shadow-inner">
                <svg className="w-5 h-5 text-blue-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-bold tracking-tight text-white">CampusConnect AI</h3>
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
                </div>
                <p className="text-[11px] text-blue-100/90 font-medium">Real-time CHARUSAT Event Guide</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearChat}
                  title="Clear conversation"
                  aria-label="Clear conversation"
                  className="p-1.5 text-blue-100 hover:text-white hover:bg-white/15 rounded-lg transition-colors cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              )}
              <button
                id="close-chatbot-btn"
                type="button"
                onClick={() => setIsOpen(false)}
                title="Minimize chatbot"
                aria-label="Close chatbot"
                className="p-1.5 text-blue-100 hover:text-white hover:bg-white/15 rounded-lg transition-colors cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages Body */}
          <div className="flex-1 p-3.5 sm:p-4 overflow-y-auto space-y-3.5 bg-gray-50/60">
            {/* Empty State Welcome & Suggestions */}
            {messages.length === 0 && (
              <div className="space-y-4 pt-2">
                <div className="bg-white rounded-2xl p-4 border border-blue-100/80 shadow-sm text-center">
                  <div className="w-11 h-11 bg-gradient-to-tr from-blue-50 to-indigo-50 border border-blue-100 rounded-xl flex items-center justify-center mx-auto mb-2 text-xl shadow-inner">
                    ✨
                  </div>
                  <h4 className="text-sm font-bold text-gray-900 mb-1">Welcome to CampusConnect AI!</h4>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Ask me any questions about CHARUSAT events, workshops, registrations, venues, or schedules.
                  </p>
                </div>

                <div>
                  <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1">
                    Suggested Questions
                  </p>
                  <div className="space-y-1.5">
                    {SUGGESTED_QUESTIONS.map((q, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSend(q)}
                        disabled={loading}
                        className="w-full text-left text-xs bg-white hover:bg-blue-50/80 hover:border-blue-200 text-gray-700 hover:text-blue-700 p-2.5 rounded-xl border border-gray-200 transition-all shadow-xs cursor-pointer flex items-center justify-between group"
                      >
                        <span className="line-clamp-2">{q}</span>
                        <svg
                          className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-600 transition-colors shrink-0 ml-1.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Message List */}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`px-3.5 py-2.5 rounded-2xl max-w-[88%] shadow-xs ${
                    msg.role === "user"
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-tr-xs"
                      : "bg-white text-gray-800 rounded-tl-xs border border-gray-200/90 shadow-sm"
                  }`}
                >
                  {msg.role === "user" ? (
                    <p className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  ) : (
                    <FormattedMessage content={msg.content} onNavigate={handleNavigate} />
                  )}
                </div>
                <span className="text-[10px] text-gray-400 mt-1 px-1">
                  {msg.timestamp
                    ? new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                    : ""}
                </span>
              </div>
            ))}

            {/* Loading Indicator */}
            {loading && (
              <div className="flex items-start gap-2">
                <div className="bg-white border border-gray-200/90 rounded-2xl rounded-tl-xs px-3.5 py-2.5 shadow-sm flex items-center gap-2">
                  <div className="flex gap-1 items-center">
                    <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce"></span>
                  </div>
                  <span className="text-xs text-gray-500 font-medium">Finding relevant events...</span>
                </div>
              </div>
            )}

            {/* Error Message with Retry */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700 flex items-center justify-between gap-2 shadow-xs">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>{error}</span>
                </div>
                {lastFailedMessage && (
                  <button
                    type="button"
                    onClick={handleRetry}
                    className="shrink-0 font-semibold underline text-red-800 hover:text-red-900 cursor-pointer"
                  >
                    Retry
                  </button>
                )}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Footer Input Area */}
          <div className="p-3 bg-white border-t border-gray-100 shadow-inner">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-end gap-2"
            >
              <textarea
                ref={textareaRef}
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about events, dates, eligibility..."
                maxLength={500}
                disabled={loading}
                className="flex-1 resize-none bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 focus:bg-white transition-all max-h-24 min-h-[38px]"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                aria-label="Send message"
                className="h-[38px] w-[38px] bg-gradient-to-tr from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl flex items-center justify-center transition-all duration-150 shadow-sm cursor-pointer shrink-0"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </form>
            <div className="flex items-center justify-between mt-1.5 px-1 text-[10px] text-gray-400">
              <span>Enter to send, Shift+Enter for new line</span>
              <span>Grounded in CHARUSAT events</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
