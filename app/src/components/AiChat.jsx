import { useState, useRef, useEffect } from "react";

const THEMES = {
  "vs-dark": {
    bg: "#1e1e1e",
    panelBg: "#252526",
    headerBg: "#333333",
    border: "#3c3c3c",
    inputBg: "#3c3c3c",
    inputBorder: "#555",
    userBubble: "#094771",
    userBubbleBorder: "#007acc",
    userText: "#cce7ff",
    aiBubble: "#2d2d2d",
    aiBubbleBorder: "#3c3c3c",
    aiText: "#d4d4d4",
    codeBg: "#1a1a1a",
    codeBorder: "#3c3c3c",
    codeText: "#9cdcfe",
    metaText: "#858585",
    accent: "#007acc",
    accentGlow: "#007acc88",
    sendBg: "#0e4c78",
    sendBorder: "#007acc",
    sendText: "#9fcfef",
    toggleActive: "#0e3a1a",
    toggleActiveBorder: "#16825d",
    toggleActiveText: "#4ec9b0",
    toggleBorder: "#3c3c3c",
    toggleText: "#858585",
    scrollbar: "#424242",
  },
  "vs-light": {
    bg: "#ffffff",
    panelBg: "#f3f3f3",
    headerBg: "#dddddd",
    border: "#c8c8c8",
    inputBg: "#ffffff",
    inputBorder: "#c8c8c8",
    userBubble: "#dbeafe",
    userBubbleBorder: "#3b82f6",
    userText: "#1e3a5f",
    aiBubble: "#f3f3f3",
    aiBubbleBorder: "#c8c8c8",
    aiText: "#333333",
    codeBg: "#f5f5f5",
    codeBorder: "#d0d0d0",
    codeText: "#0070c1",
    metaText: "#999999",
    accent: "#3b82f6",
    accentGlow: "#3b82f644",
    sendBg: "#dbeafe",
    sendBorder: "#3b82f6",
    sendText: "#1d4ed8",
    toggleActive: "#dcfce7",
    toggleActiveBorder: "#16a34a",
    toggleActiveText: "#15803d",
    toggleBorder: "#c8c8c8",
    toggleText: "#999999",
    scrollbar: "#c8c8c8",
  },
  "dracula": {
    bg: "#282a36",
    panelBg: "#21222c",
    headerBg: "#191a21",
    border: "#44475a",
    inputBg: "#21222c",
    inputBorder: "#44475a",
    userBubble: "#3a2d5c",
    userBubbleBorder: "#bd93f9",
    userText: "#e2d9f9",
    aiBubble: "#2d2f3f",
    aiBubbleBorder: "#44475a",
    aiText: "#f8f8f2",
    codeBg: "#191a21",
    codeBorder: "#44475a",
    codeText: "#8be9fd",
    metaText: "#6272a4",
    accent: "#bd93f9",
    accentGlow: "#bd93f966",
    sendBg: "#3a2d5c",
    sendBorder: "#bd93f9",
    sendText: "#bd93f9",
    toggleActive: "#1e3a2a",
    toggleActiveBorder: "#50fa7b",
    toggleActiveText: "#50fa7b",
    toggleBorder: "#44475a",
    toggleText: "#6272a4",
    scrollbar: "#44475a",
  },
  "monokai": {
    bg: "#272822",
    panelBg: "#1e1f1c",
    headerBg: "#191a17",
    border: "#3e3d32",
    inputBg: "#1e1f1c",
    inputBorder: "#3e3d32",
    userBubble: "#2d3320",
    userBubbleBorder: "#a6e22e",
    userText: "#e6f3c8",
    aiBubble: "#2a2b27",
    aiBubbleBorder: "#3e3d32",
    aiText: "#f8f8f2",
    codeBg: "#191a17",
    codeBorder: "#3e3d32",
    codeText: "#66d9e8",
    metaText: "#75715e",
    accent: "#a6e22e",
    accentGlow: "#a6e22e66",
    sendBg: "#2d3320",
    sendBorder: "#a6e22e",
    sendText: "#a6e22e",
    toggleActive: "#2d3320",
    toggleActiveBorder: "#a6e22e",
    toggleActiveText: "#a6e22e",
    toggleBorder: "#3e3d32",
    toggleText: "#75715e",
    scrollbar: "#3e3d32",
  },
  "solarized-dark": {
    bg: "#002b36",
    panelBg: "#073642",
    headerBg: "#002b36",
    border: "#144f5a",
    inputBg: "#073642",
    inputBorder: "#144f5a",
    userBubble: "#003847",
    userBubbleBorder: "#268bd2",
    userText: "#93c9eb",
    aiBubble: "#03313d",
    aiBubbleBorder: "#144f5a",
    aiText: "#839496",
    codeBg: "#002b36",
    codeBorder: "#144f5a",
    codeText: "#2aa198",
    metaText: "#586e75",
    accent: "#268bd2",
    accentGlow: "#268bd266",
    sendBg: "#003847",
    sendBorder: "#268bd2",
    sendText: "#268bd2",
    toggleActive: "#003822",
    toggleActiveBorder: "#859900",
    toggleActiveText: "#859900",
    toggleBorder: "#144f5a",
    toggleText: "#586e75",
    scrollbar: "#144f5a",
  },
  "solarized-light": {
    bg: "#fdf6e3",
    panelBg: "#eee8d5",
    headerBg: "#e8e1cf",
    border: "#d3ccba",
    inputBg: "#fdf6e3",
    inputBorder: "#d3ccba",
    userBubble: "#d6ebf7",
    userBubbleBorder: "#268bd2",
    userText: "#1a5276",
    aiBubble: "#eee8d5",
    aiBubbleBorder: "#d3ccba",
    aiText: "#657b83",
    codeBg: "#f5eed8",
    codeBorder: "#d3ccba",
    codeText: "#2aa198",
    metaText: "#93a1a1",
    accent: "#268bd2",
    accentGlow: "#268bd244",
    sendBg: "#d6ebf7",
    sendBorder: "#268bd2",
    sendText: "#1a5276",
    toggleActive: "#e4f0d0",
    toggleActiveBorder: "#859900",
    toggleActiveText: "#5a6600",
    toggleBorder: "#d3ccba",
    toggleText: "#93a1a1",
    scrollbar: "#d3ccba",
  },
  "hc-black": {
    bg: "#000000",
    panelBg: "#0a0a0a",
    headerBg: "#000000",
    border: "#6fc3df",
    inputBg: "#0a0a0a",
    inputBorder: "#6fc3df",
    userBubble: "#001a2e",
    userBubbleBorder: "#6fc3df",
    userText: "#ffffff",
    aiBubble: "#050505",
    aiBubbleBorder: "#6fc3df",
    aiText: "#ffffff",
    codeBg: "#000000",
    codeBorder: "#6fc3df",
    codeText: "#6fc3df",
    metaText: "#888888",
    accent: "#6fc3df",
    accentGlow: "#6fc3df66",
    sendBg: "#001a2e",
    sendBorder: "#6fc3df",
    sendText: "#6fc3df",
    toggleActive: "#001a0e",
    toggleActiveBorder: "#00ff00",
    toggleActiveText: "#00ff00",
    toggleBorder: "#6fc3df",
    toggleText: "#888888",
    scrollbar: "#6fc3df",
  },
};

function getTheme(name) {
  return THEMES[name] || THEMES["vs-dark"];
}

function formatCode(text, t) {
  const parts = text.split(/(```[\s\S]*?```)/g);
  return parts.map((part, i) => {
    if (part.startsWith("```")) {
      const lines = part.slice(3, -3).split("\n");
      const lang = lines[0].trim();
      const code = lines.slice(1).join("\n");
      return (
        <div key={i} style={{ position: "relative", margin: "6px 0" }}>
          {lang && (
            <span style={{
              position: "absolute", top: 4, right: 8,
              fontSize: "9px", color: t.metaText, fontFamily: "monospace",
              textTransform: "uppercase", letterSpacing: "0.08em"
            }}>{lang}</span>
          )}
          <pre style={{
            background: t.codeBg,
            border: `1px solid ${t.codeBorder}`,
            borderRadius: "4px",
            padding: "10px 12px",
            margin: 0,
            overflowX: "auto",
            fontSize: "11.5px",
            lineHeight: "1.6",
            color: t.codeText,
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            whiteSpace: "pre",
          }}>{code}</pre>
        </div>
      );
    }
    return <span key={i} style={{ whiteSpace: "pre-wrap" }}>{part}</span>;
  });
}

function Message({ msg, t }) {
  const isUser = msg.role === "user";
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: isUser ? "flex-end" : "flex-start",
      marginBottom: "12px",
      gap: "3px",
    }}>
      <span style={{
        fontSize: "9px",
        color: t.metaText,
        fontFamily: "monospace",
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        paddingLeft: isUser ? 0 : "2px",
        paddingRight: isUser ? "2px" : 0,
      }}>
        {isUser ? "you" : "ai"}
      </span>
      <div style={{
        maxWidth: "92%",
        background: isUser ? t.userBubble : t.aiBubble,
        border: `1px solid ${isUser ? t.userBubbleBorder : t.aiBubbleBorder}`,
        borderRadius: isUser ? "8px 8px 2px 8px" : "8px 8px 8px 2px",
        padding: "8px 11px",
        fontSize: "12.5px",
        lineHeight: "1.65",
        color: isUser ? t.userText : t.aiText,
        fontFamily: "'JetBrains Mono', monospace",
        wordBreak: "break-word",
      }}>
        {formatCode(msg.content, t)}
      </div>
    </div>
  );
}

function TypingIndicator({ t }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: "3px", marginBottom: "12px", flexDirection: "column" }}>
      <span style={{ fontSize: "9px", color: t.metaText, fontFamily: "monospace", letterSpacing: "0.1em", textTransform: "uppercase" }}>ai</span>
      <div style={{
        background: t.aiBubble,
        border: `1px solid ${t.aiBubbleBorder}`,
        borderRadius: "8px 8px 8px 2px",
        padding: "10px 14px",
        display: "flex",
        gap: "4px",
        alignItems: "center",
      }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: "5px", height: "5px",
            borderRadius: "50%",
            background: t.metaText,
            animation: "ai-pulse 1.2s ease-in-out infinite",
            animationDelay: `${i * 0.2}s`,
          }} />
        ))}
      </div>
    </div>
  );
}

export default function AiChat({ getEditorCode, language, theme }) {
  const t = getTheme(theme);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hey. Ask me anything about your code — debugging, explanations, refactoring, or just how something works.",
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [includeCode, setIncludeCode] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;

    let userContent = text;
    if (includeCode && getEditorCode) {
      const code = getEditorCode();
      if (code?.trim()) {
        userContent = `${text}\n\n\`\`\`${language || ""}\n${code}\n\`\`\``;
      }
    }

    const newMessages = [...messages, { role: "user", content: userContent }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/groq/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: "assistant", content: "⚠ Error: " + e.message }]);
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function clearChat() {
    setMessages([{ role: "assistant", content: "Chat cleared. What do you want to work on?" }]);
  }

  return (
    <>
      <style>{`
        @keyframes ai-pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.1); }
        }
        .ai-chat-input:focus { outline: none !important; }
        .ai-chat-input::placeholder { color: ${t.metaText}; opacity: 0.6; }
        .ai-messages::-webkit-scrollbar { width: 4px; }
        .ai-messages::-webkit-scrollbar-thumb { background: ${t.scrollbar}; border-radius: 2px; }
        .ai-messages::-webkit-scrollbar-track { background: transparent; }
      `}</style>

      <div style={{
        width: "500px",
        height: "calc(60vh + 2px)",
        display: "flex",
        flexDirection: "column",
        background: t.bg,
        border: `1px solid ${t.border}`,
        borderRadius: "6px",
        overflow: "hidden",
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        transition: "background 0.2s, border-color 0.2s",
      }}>
        {/* Header */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 12px",
          background: t.headerBg,
          borderBottom: `1px solid ${t.border}`,
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
            <div style={{
              width: "6px", height: "6px", borderRadius: "50%",
              background: t.accent,
              boxShadow: `0 0 6px ${t.accentGlow}`,
            }} />
            <span style={{ fontSize: "11px", color: t.metaText, letterSpacing: "0.1em", textTransform: "uppercase" }}>
              ai chat
            </span>
          </div>
          <button
            onClick={clearChat}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: t.metaText, fontSize: "10px", letterSpacing: "0.05em",
              fontFamily: "inherit", padding: "2px 4px",
              textTransform: "uppercase", opacity: 0.6,
            }}
          >clear</button>
        </div>

        {/* Messages */}
        <div className="ai-messages" style={{
          flex: 1,
          overflowY: "auto",
          padding: "14px 10px 8px",
          background: t.panelBg,
          scrollbarWidth: "thin",
          scrollbarColor: `${t.scrollbar} transparent`,
        }}>
          {messages.map((msg, i) => <Message key={i} msg={msg} t={t} />)}
          {loading && <TypingIndicator t={t} />}
          <div ref={bottomRef} />
        </div>

        {/* Context toggle */}
        <div style={{
          padding: "5px 10px",
          borderTop: `1px solid ${t.border}`,
          background: t.headerBg,
        }}>
          <button
            onClick={() => setIncludeCode(p => !p)}
            style={{
              display: "flex", alignItems: "center", gap: "5px",
              background: includeCode ? t.toggleActive : "transparent",
              border: `1px solid ${includeCode ? t.toggleActiveBorder : t.toggleBorder}`,
              borderRadius: "4px",
              padding: "3px 8px",
              cursor: "pointer",
              fontSize: "10px",
              color: includeCode ? t.toggleActiveText : t.toggleText,
              fontFamily: "inherit",
              letterSpacing: "0.05em",
              transition: "all 0.15s",
            }}
          >
            <span style={{ fontSize: "11px" }}>{includeCode ? "◈" : "◇"}</span>
            include editor code
          </button>
        </div>

        {/* Input */}
        <div style={{
          padding: "8px 10px",
          borderTop: `1px solid ${t.border}`,
          background: t.headerBg,
          display: "flex",
          gap: "6px",
          alignItems: "flex-end",
          flexShrink: 0,
        }}>
          <textarea
            className="ai-chat-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask about your code..."
            rows={1}
            style={{
              flex: 1,
              background: t.inputBg,
              border: `1px solid ${t.inputBorder}`,
              borderRadius: "5px",
              color: t.aiText,
              fontSize: "12px",
              fontFamily: "inherit",
              padding: "7px 9px",
              resize: "none",
              lineHeight: "1.5",
              maxHeight: "80px",
              overflowY: "auto",
              transition: "border-color 0.15s, background 0.2s",
            }}
            onInput={e => {
              e.target.style.height = "auto";
              e.target.style.height = Math.min(e.target.scrollHeight, 80) + "px";
            }}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            style={{
              background: t.sendBg,
              border: `1px solid ${t.sendBorder}`,
              borderRadius: "5px",
              color: t.sendText,
              cursor: loading || !input.trim() ? "not-allowed" : "pointer",
              padding: "7px 10px",
              fontSize: "14px",
              fontFamily: "inherit",
              flexShrink: 0,
              opacity: loading || !input.trim() ? 0.4 : 1,
              transition: "opacity 0.15s",
              alignSelf: "flex-end",
            }}
          >↑</button>
        </div>
      </div>
    </>
  );
}