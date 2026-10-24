import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { sendChatMessage } from "../services/chatService";

const SUGGESTED_QUESTIONS = [
  "What events are coming up?",
  "How do I register for an event?",
  "Help me explore campus activities.",
  "What events are happening this week?",
];

const LAUNCHER_MESSAGES = [
  "Have a doubt?",
  "Need some help?",
  "Ask CampusConnect",
  "I'm here to help",
  "Explore campus events",
];

const LAUNCHER_MESSAGE_HOLD_MS = 3000;
const LAUNCHER_MESSAGE_TRANSITION_MS = 300;

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
              className="cc-chat-link inline-flex items-center gap-1 rounded px-1.5 py-0.5 mx-0.5 text-xs font-semibold underline underline-offset-2 transition-colors"
            >
              <span>{token.label}</span>
              <svg aria-hidden="true" className="w-3 h-3 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            className="cc-chat-link inline-flex items-center gap-1 rounded px-1.5 py-0.5 mx-0.5 text-xs font-semibold underline underline-offset-2 transition-colors"
          >
            <span>{token.label}</span>
            <svg aria-hidden="true" className="w-3 h-3 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
  const [isClosing, setIsClosing] = useState(false);
  const [launcherMessageIndex, setLauncherMessageIndex] = useState(0);
  const [launcherMessagePhase, setLauncherMessagePhase] = useState("visible");
  const [launcherMessageDismissed, setLauncherMessageDismissed] = useState(false);
  const [pageVisible, setPageVisible] = useState(
    () => typeof document === "undefined" || document.visibilityState === "visible",
  );
  const [reducedMotion, setReducedMotion] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFailedMessage, setLastFailedMessage] = useState(null);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const panelRef = useRef(null);
  const launcherRef = useRef(null);
  const isAtBottomRef = useRef(true);
  const closeTimeoutRef = useRef(null);
  const restoreFocusRef = useRef(false);
  const launcherMessageRemainingRef = useRef(LAUNCHER_MESSAGE_HOLD_MS);
  const launcherMessageStartedAtRef = useRef(0);
  const launcherMessageTimerCompletedRef = useRef(false);
  const navigate = useNavigate();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });
  };

  useEffect(() => {
    if (isOpen && isAtBottomRef.current) {
      scrollToBottom();
    }
  }, [messages, loading, isOpen]);

  useEffect(() => {
    if (isOpen) {
      const timeout = window.setTimeout(() => textareaRef.current?.focus(), 100);
      return () => window.clearTimeout(timeout);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen && !isClosing && restoreFocusRef.current) {
      restoreFocusRef.current = false;
      launcherRef.current?.focus();
    }
  }, [isOpen, isClosing]);

  useEffect(() => () => window.clearTimeout(closeTimeoutRef.current), []);

  useEffect(() => {
    const handleVisibilityChange = () => setPageVisible(document.visibilityState === "visible");
    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handleMotionChange = (event) => setReducedMotion(event.matches);

    document.addEventListener("visibilitychange", handleVisibilityChange);
    motionPreference.addEventListener("change", handleMotionChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      motionPreference.removeEventListener("change", handleMotionChange);
    };
  }, []);

  useEffect(() => {
    if (isOpen || isClosing || launcherMessageDismissed || !pageVisible || reducedMotion) return undefined;

    launcherMessageTimerCompletedRef.current = false;
    launcherMessageStartedAtRef.current = Date.now();
    const timeout = window.setTimeout(() => {
      launcherMessageTimerCompletedRef.current = true;
      launcherMessageRemainingRef.current = LAUNCHER_MESSAGE_HOLD_MS;
      setLauncherMessagePhase("exiting");
    }, launcherMessageRemainingRef.current);

    return () => {
      window.clearTimeout(timeout);
      if (!launcherMessageTimerCompletedRef.current && launcherMessagePhase === "visible") {
        const elapsed = Date.now() - launcherMessageStartedAtRef.current;
        launcherMessageRemainingRef.current = Math.max(0, launcherMessageRemainingRef.current - elapsed);
      }
    };
  }, [isOpen, isClosing, launcherMessageDismissed, launcherMessagePhase, pageVisible, reducedMotion]);

  useEffect(() => {
    if (isOpen || isClosing || launcherMessageDismissed || !pageVisible || reducedMotion) return undefined;
    if (launcherMessagePhase === "exiting") {
      const timeout = window.setTimeout(() => {
        setLauncherMessageIndex((index) => (index + 1) % LAUNCHER_MESSAGES.length);
        setLauncherMessagePhase("entering");
      }, LAUNCHER_MESSAGE_TRANSITION_MS);
      return () => window.clearTimeout(timeout);
    }

    if (launcherMessagePhase === "entering") {
      const timeout = window.setTimeout(() => setLauncherMessagePhase("visible"), LAUNCHER_MESSAGE_TRANSITION_MS);
      return () => window.clearTimeout(timeout);
    }
    return undefined;
  }, [isOpen, isClosing, launcherMessageDismissed, launcherMessagePhase, pageVisible, reducedMotion]);

  const handleClose = useCallback(() => {
    if (!isOpen) return;
    restoreFocusRef.current = true;
    setIsOpen(false);
    setIsClosing(true);
    closeTimeoutRef.current = window.setTimeout(() => {
      setIsClosing(false);
    }, 260);
  }, [isOpen]);

  const handleSend = async (textToSend) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    setError(null);
    setLastFailedMessage(null);
    setInput("");
    isAtBottomRef.current = true;
    if (textareaRef.current) textareaRef.current.style.height = "auto";

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
    if (loading) return;
    setMessages([]);
    setError(null);
    setLastFailedMessage(null);
  };

  const handleOpen = () => {
    window.clearTimeout(closeTimeoutRef.current);
    setIsClosing(false);
    setIsOpen(true);
  };

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleOutsidePointerDown = (event) => {
      if (event.button !== 0) return;
      if (!(event.target instanceof Node)) return;
      if (panelRef.current?.contains(event.target) || launcherRef.current?.contains(event.target)) return;
      handleClose();
    };

    document.addEventListener("pointerdown", handleOutsidePointerDown);
    const handleEscape = (event) => {
      if (event.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("pointerdown", handleOutsidePointerDown);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, handleClose]);

  const handleNavigate = (path) => {
    navigate(path);
  };

  return (
    <>
      {/* ── Floating Chatbot Button (Closed State) ────────────────────────── */}
      {!isOpen && !isClosing && (
        <div className="cc-chat-launcher fixed bottom-5 right-5 z-40 flex items-center gap-2">
          {!launcherMessageDismissed && (
            <div className="cc-chat-invitation relative">
              <button
                type="button"
                className="cc-chat-invitation-board"
                onClick={handleOpen}
                aria-label={`Open CampusConnect AI: ${LAUNCHER_MESSAGES[launcherMessageIndex]}`}
              >
                <span className="cc-chat-invitation-viewport" aria-live="off">
                  <span
                    key={launcherMessageIndex}
                    className={`cc-chat-invitation-message ${!reducedMotion && launcherMessagePhase === "exiting" ? "cc-chat-invitation-message-exit" : ""} ${!reducedMotion && launcherMessagePhase === "entering" ? "cc-chat-invitation-message-enter" : ""}`}
                  >
                    {LAUNCHER_MESSAGES[launcherMessageIndex]}
                  </span>
                </span>
              </button>
              <button
                type="button"
                className="cc-chat-invitation-dismiss"
                onClick={() => setLauncherMessageDismissed(true)}
                aria-label="Dismiss chatbot invitation"
                title="Dismiss"
              >
                <svg aria-hidden="true" viewBox="0 0 16 16" fill="none">
                  <path d="m4 4 8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          )}
          <button
            ref={launcherRef}
            id="open-chatbot-btn"
            onClick={handleOpen}
            aria-label="Open CampusConnect AI Chatbot"
            aria-haspopup="dialog"
            aria-expanded={isOpen}
            className="cc-chat-launcher-button flex h-14 w-14 items-center justify-center rounded-full cursor-pointer relative"
          >
            <svg aria-hidden="true" className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
              />
            </svg>
          </button>
        </div>
      )}

      {/* ── Floating Chatbot Window (Open State) ───────────────────────────── */}
      {(isOpen || isClosing) && (
        <div
          id="chatbot-window"
          role="dialog"
          aria-modal="false"
          aria-labelledby="chatbot-title"
          aria-hidden={isClosing}
          ref={panelRef}
          className={`cc-chat-window fixed bottom-5 right-5 z-50 flex flex-col overflow-hidden rounded-2xl ${isClosing ? "cc-chat-window-exit" : ""}`}
        >
          {/* Header */}
          <div className="cc-chat-header flex items-center justify-between px-4 py-3.5">
            <div className="flex items-center gap-2.5">
              <div className="cc-chat-header-icon flex h-10 w-10 items-center justify-center rounded-xl">
                <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.8"
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 id="chatbot-title" className="text-sm font-bold tracking-tight">CampusConnect AI</h3>
                </div>
                <p className="cc-chat-subtitle text-[11px] font-medium">Your campus assistant</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearChat}
                  disabled={loading}
                  title="Clear conversation"
                  aria-label="Clear conversation"
                  className="cc-chat-icon-button rounded-lg p-2 transition-colors"
                >
                  <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                onClick={handleClose}
                title="Minimize chatbot"
                aria-label="Close chatbot"
                className="cc-chat-icon-button rounded-lg p-2 transition-colors"
              >
                <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages Body */}
          <div
            className="cc-chat-body flex-1 space-y-3.5 overflow-y-auto p-3.5 sm:p-4"
            onScroll={(event) => {
              const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
              isAtBottomRef.current = scrollHeight - scrollTop - clientHeight < 100;
            }}
          >
            {/* Empty State Welcome & Suggestions */}
            {messages.length === 0 && (
              <div className="cc-chat-empty space-y-5 pt-3">
                <div className="text-center">
                  <h4 className="text-lg font-bold tracking-tight">How can I help you?</h4>
                  <p className="cc-chat-muted mt-2 text-xs leading-relaxed">
                    Ask me about campus events, activities, and CampusConnect.
                  </p>
                </div>

                <div>
                  <div className="space-y-2">
                    {SUGGESTED_QUESTIONS.map((q, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSend(q)}
                        disabled={loading}
                        className="cc-chat-suggestion flex w-full items-center justify-between gap-2 rounded-xl border p-3 text-left text-xs transition-all"
                      >
                        <span>{q}</span>
                        <svg
                          aria-hidden="true"
                          className="cc-chat-muted h-4 w-4 shrink-0 transition-colors"
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
                className={`cc-chat-message flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`cc-chat-bubble max-w-[88%] rounded-2xl px-3.5 py-2.5 ${
                    msg.role === "user"
                      ? "cc-chat-user rounded-tr-sm"
                      : "cc-chat-assistant rounded-tl-sm"
                  }`}
                >
                  {msg.role === "user" ? (
                    <p className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  ) : (
                    <div className="cc-chat-richtext"><FormattedMessage content={msg.content} onNavigate={handleNavigate} /></div>
                  )}
                </div>
                <span className="cc-chat-muted mt-1 px-1 text-[10px]">
                  {msg.timestamp
                    ? new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                    : ""}
                </span>
              </div>
            ))}

            {/* Loading Indicator */}
            {loading && (
              <div className="cc-chat-message flex items-start gap-2" role="status" aria-label="CampusConnect AI is thinking">
                <div className="cc-chat-assistant flex items-center gap-2 rounded-2xl rounded-tl-sm border px-3.5 py-2.5">
                  <div className="flex items-center gap-1">
                    <span className="cc-chat-dot"></span>
                    <span className="cc-chat-dot"></span>
                    <span className="cc-chat-dot"></span>
                  </div>
                  <span className="cc-chat-muted text-xs font-medium">Thinking...</span>
                </div>
              </div>
            )}

            {/* Error Message with Retry */}
            {error && (
              <div className="cc-chat-error flex items-center justify-between gap-2 rounded-xl border p-3 text-xs" role="alert">
                <div className="flex items-center gap-2">
                  <svg aria-hidden="true" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    className="shrink-0 cursor-pointer font-semibold underline"
                  >
                    Retry
                  </button>
                )}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Footer Input Area */}
          <div className="cc-chat-composer border-t p-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-end gap-2"
            >
              <textarea
                ref={textareaRef}
                aria-label="Message the CampusConnect event assistant"
                rows={1}
                value={input}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything about CampusConnect..."
                maxLength={500}
                disabled={loading}
                onChange={(event) => {
                  setInput(event.target.value);
                  event.target.style.height = "auto";
                  event.target.style.height = `${Math.min(event.target.scrollHeight, 96)}px`;
                }}
                className="cc-chat-textarea min-h-[42px] max-h-24 flex-1 resize-none rounded-xl border px-3.5 py-2 text-xs transition-all sm:text-sm"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                aria-label="Send message"
                className="cc-chat-send flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl transition-all"
              >
                <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </form>
            <div className="cc-chat-muted mt-1.5 flex items-center justify-between px-1 text-[10px]">
              <span>Enter to send, Shift+Enter for new line</span>
              <span>CampusConnect assistant</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
