import { Editor } from "@monaco-editor/react";
import { useRef, useState, useEffect, useCallback } from "react";
import * as Y from "yjs";
import { MonacoBinding } from "y-monaco";
import "@xterm/xterm/css/xterm.css";
import Select from "./components/Select.jsx";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap/dist/js/bootstrap.bundle.js";
import "./App.css";
import TerminalComponent from "./components/Terminal.jsx";
import AiChat from "./components/AiChat.jsx";
import { useParams, useNavigate } from "react-router-dom";
import { WebsocketProvider } from "y-websocket";

const CHAT_WIDTH = 500;
const GAP = 8;
const BOTTOM_PANEL_H = 220;
const TOOLBAR_H = 48;

function App() {
  const globalCwdRef = useRef('/');
  const navigate = useNavigate();
  const { roomId, lang, isNew } = useParams();
  const ydocRef = useRef(null);
  const providerRef = useRef(null);
  useEffect(() => {
    return () => {
      providerRef.current?.destroy();
      ydocRef.current?.destroy();
    };
  }, []);
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const [language, setLanguage] = useState(lang);
  const [theme, setTheme] = useState("vs-dark");
  const [output, setOutput] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [showBottomPanel, setShowBottomPanel] = useState(false);
  const [bottomTab, setBottomTab] = useState("terminal");
  const [showChat, setShowChat] = useState(true);
  const [openFilePath, setOpenFilePath] = useState(null);
  const openFilePathRef = useRef(null); // ref for use inside stale closures
  const [editorSize, setEditorSize] = useState({ width: 800, height: 500 });
  const debounceTimer = useRef(null);
  const suggestionWidget = useRef(null);
  const termWs = useRef(null);

  // Updates both the ref (for closures) and state (for UI)
  const setOpenFilePathSync = useCallback((path) => {
    openFilePathRef.current = path;
    setOpenFilePath(path);
  }, []);

  const recalc = useCallback(() => {
    const totalW = window.innerWidth;
    const totalH = window.innerHeight;
    const usedW = (showChat ? CHAT_WIDTH + GAP : 0) + GAP * 2 + 32;
    const usedH = TOOLBAR_H + (showBottomPanel ? BOTTOM_PANEL_H + GAP : 0) + 80;
    setEditorSize({
      width: Math.max(300, totalW - usedW),
      height: Math.max(200, totalH - usedH),
    });
    setTimeout(() => editorRef.current?.layout(), 50);
  }, [showChat, showBottomPanel]);

  useEffect(() => {
    recalc();
    window.addEventListener("resize", recalc);
    return () => window.removeEventListener("resize", recalc);
  }, [recalc]);

  // --- Suggestion widget helpers ---

  function removeSuggestionWidget() {
    if (suggestionWidget.current && editorRef.current) {
      editorRef.current.removeContentWidget(suggestionWidget.current);
      suggestionWidget.current = null;
    }
  }

  function showSuggestionWidget(lineNumber, cod) {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (!editor || !monaco) return;
    removeSuggestionWidget();

    const domNode = document.createElement("div");
    domNode.style.cssText = `
      background:#1e1e2e;border:1px solid #555;border-radius:6px;padding:0;
      display:flex;flex-direction:column;z-index:100;
      box-shadow:0 2px 10px rgba(0,0,0,0.5);min-width:300px;max-width:600px;
      overflow:hidden;margin-top:4px;`;

    const codePre = document.createElement("pre");
    codePre.textContent = cod;
    codePre.style.cssText = `color:#79b8ff;margin:0;padding:8px 10px;max-height:200px;
      overflow-y:auto;font-family:monospace;font-size:12px;white-space:pre;
      border-bottom:1px solid #444;width:100%;box-sizing:border-box;`;

    const acceptBtn = document.createElement("button");
    acceptBtn.textContent = "✓ Accept";
    acceptBtn.style.cssText = `background:#238636;color:white;border:none;border-radius:4px;padding:2px 8px;cursor:pointer;font-size:11px;flex-shrink:0;`;
    acceptBtn.onclick = () => {
      const model = editor.getModel();
      const totalLines = model.getLineCount();
      const insertLine = Math.min(Math.max(lineNumber || 1, 1), totalLines);
      const lineContent = model.getLineContent(insertLine);
      const indentation = lineContent.match(/^(\s*)/)[1];
      const textToInsert =
        "\n" +
        cod
          .split("\n")
          .map((l) => indentation + l)
          .join("\n");
      const endCol = model.getLineMaxColumn(insertLine);
      editor.executeEdits("suggestion", [
        {
          range: new monaco.Range(insertLine, endCol, insertLine, endCol),
          text: textToInsert,
        },
      ]);
      editor.setPosition({
        lineNumber: insertLine + cod.split("\n").length,
        column: 1,
      });
      editor.focus();
      removeSuggestionWidget();
    };

    const dismissBtn = document.createElement("button");
    dismissBtn.textContent = "✕ Dismiss";
    dismissBtn.style.cssText = `background:#3a3a3a;color:#ccc;border:none;border-radius:4px;padding:2px 8px;cursor:pointer;font-size:11px;flex-shrink:0;`;
    dismissBtn.onclick = removeSuggestionWidget;

    const btnRow = document.createElement("div");
    btnRow.style.cssText = `display:flex;gap:8px;padding:6px 10px;align-items:center;`;
    const label = document.createElement("span");
    label.textContent = "💡 Suggestion";
    label.style.cssText =
      "color:#aaa;font-size:11px;flex:1;font-family:monospace;";
    btnRow.appendChild(label);
    btnRow.appendChild(acceptBtn);
    btnRow.appendChild(dismissBtn);
    domNode.appendChild(codePre);
    domNode.appendChild(btnRow);

    const widget = {
      getId: () => "suggestion.widget",
      getDomNode: () => domNode,
      getPosition: () => ({
        position: { lineNumber: lineNumber, column: 1 },
        preference: [monaco.editor.ContentWidgetPositionPreference.BELOW],
      }),
    };
    editor.addContentWidget(widget);
    suggestionWidget.current = widget;
  }

  // --- Editor change ---

  function handleEditorChange(value) {
    clearTimeout(debounceTimer.current);
    removeSuggestionWidget();
    debounceTimer.current = setTimeout(async () => {
      if (!value || value.trim().length < 10) return;
      try {
        const res = await fetch("/groq/suggest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: value }),
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!data.cod) return;
        const totalLines = editorRef.current.getModel().getLineCount();
        const rawLine = parseInt(data.linie);
        const lineNumber =
          isNaN(rawLine) || rawLine < 1 || rawLine > totalLines
            ? editorRef.current.getPosition().lineNumber
            : rawLine;
        showSuggestionWidget(lineNumber, data.cod);
      } catch (e) {
        console.error("Suggest failed:", e);
      }
    }, 1000);
  }

  // --- Save ---
  // Writes back into the container using room_id + path from ref (never stale)

  async function handleSave() {
    let path = openFilePathRef.current;

    if (!path) {
      const fileName = window.prompt("File name:");
      if (!fileName) return;

      // USE THE REF HERE!
      const currentDir = globalCwdRef.current; 
      
      // Clean up slashes to avoid "home//file.py"
      const cleanDir = currentDir.endsWith("/") ? currentDir : `${currentDir}/`;
      path = fileName.startsWith("/") ? fileName : `${cleanDir}${fileName}`;
    }

    const content = editorRef.current.getValue();
    
    // ... fetch call to /api/container/file/save as before
    const res = await fetch("/api/container/file/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ room_id: roomId, path, content }),
    });
    
    if (res.ok) openFilePathRef.current = path;
  }

  // --- Run ---

  async function runCode(lang, code) {
    if (lang === "html") return { type: "html", content: code };
    const langMap = {
      javascript: { language: "typescript", version: "5.0.3" },
      python: { language: "python", version: "3.10.0" },
      cpp: { language: "c++", version: "10.2.0" },
      php: { language: "php", version: "8.2.3" },
    };
    const config = langMap[lang];
    if (!config)
      return { type: "error", content: `Language "${lang}" not supported` };
    const res = await fetch("http://piston:2000/api/v2/execute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        language: config.language,
        version: config.version,
        files: [{ name: lang === "cpp" ? "main.cpp" : "main", content: code }],
      }),
    });
    const data = await res.json();
    return {
      type: "text",
      content: data.run.stderr || data.run.stdout || "(no output)",
    };
  }

  async function handleRun() {
    const code = editorRef.current.getValue();

    if (
      showBottomPanel &&
      bottomTab === "terminal" &&
      termWs.current?.readyState === WebSocket.OPEN
    ) {
      const ext =
        {
          javascript: "js",
          python: "py",
          cpp: "cpp",
          php: "php",
          html: "html",
        }[language] || "txt";
      const tmpFile = `/tmp/run_${Date.now()}.${ext}`;
      const runners = {
        python: `python3 ${tmpFile}`,
        javascript: `node ${tmpFile}`,
        cpp: `g++ ${tmpFile} -o /tmp/run_out && /tmp/run_out`,
        php: `php ${tmpFile}`,
        html: `xdg-open ${tmpFile}`,
      };
      const runner = runners[language];
      if (!runner) return;
      // Save into container before running
      await fetch("/api/container/file/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ room_id: roomId, path: tmpFile, content: code }),
      });
      termWs.current.send(new TextEncoder().encode(`${runner}\n`));
      return;
    }

    setIsRunning(true);
    const result = await runCode(language, code);
    setOutput(result);
    setShowBottomPanel(true);
    setBottomTab("output");
    setIsRunning(false);
  }

  // --- Editor mount ---

  async function handleEditorDidMount(editor, monaco) {
    editorRef.current = editor;
    monacoRef.current = monaco;
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () =>
      handleSave(),
    );

    const themeMap = {
      dracula:
        "https://cdn.jsdelivr.net/npm/monaco-themes@0.4.4/themes/Dracula.json",
      monokai:
        "https://cdn.jsdelivr.net/npm/monaco-themes@0.4.4/themes/Monokai.json",
      "solarized-light":
        "https://cdn.jsdelivr.net/npm/monaco-themes@0.4.4/themes/Solarized-light.json",
      "solarized-dark":
        "https://cdn.jsdelivr.net/npm/monaco-themes@0.4.4/themes/Solarized-dark.json",
    };
    for (const [key, url] of Object.entries(themeMap)) {
      const data = await fetch(url).then((r) => r.json());
      monaco.editor.defineTheme(key, data);
    }
    monaco.editor.setTheme(theme);

    const endpoint = isNew === "true" ? "/room/create" : "/room/join";
    const check = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomId }),
    });

    if (!check.ok) {
      const data = await check.json();
      alert(data.detail || "Failed to create/join room");
      navigate("/");
      return;
    }

    if (!ydocRef.current) {
      ydocRef.current = new Y.Doc();
      providerRef.current = new WebsocketProvider(
        "ws://localhost:5173/yjs",
        roomId,
        ydocRef.current,
      );
    }

    const type = ydocRef.current.getText("monaco");
    new MonacoBinding(
      type,
      editor.getModel(),
      new Set([editor]),
      providerRef.current.awareness,
    );
  }

  function handleThemeChange(newTheme) {
    setTheme(newTheme);
    if (monacoRef.current) monacoRef.current.editor.setTheme(newTheme);
  }

  const themes = [
    "vs-dark",
    "vs-light",
    "dracula",
    "solarized-light",
    "solarized-dark",
    "monokai",
    "hc-black",
  ];

  const tabStyle = (active) => ({
    padding: "4px 14px",
    fontSize: "11px",
    fontFamily: "monospace",
    letterSpacing: "0.06em",
    cursor: "pointer",
    border: "none",
    borderBottom: active ? "2px solid #007acc" : "2px solid transparent",
    background: "transparent",
    color: active ? "#d4d4d4" : "#666",
    transition: "color 0.15s, border-color 0.15s",
  });

  return (
    <div className="screen">
      {/* Toolbar */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <Select
          heading="Theme"
          items={themes}
          onSelect={handleThemeChange}
          style={{
            backgroundColor: "#e94d32",
            color: "#ffeed1",
            borderColor: "#e94d32;",
          }}
        />

        <button
          onClick={handleRun}
          disabled={isRunning}
          className="btn btn-secondary dropdown"
          style={{
            backgroundColor: "#e94d32",
            color: "#ffeed1",
            borderColor: "#e94d32;",
          }}
        >
          {isRunning ? "Running..." : "▶ Run"}
        </button>

        <button
          onClick={() => {
            if (!showBottomPanel) {
              setShowBottomPanel(true);
              setBottomTab("terminal");
            } else if (bottomTab !== "terminal") {
              setBottomTab("terminal");
            } else {
              setShowBottomPanel(false);
            }
          }}
          className="btn btn-secondary"
          style={{
            backgroundColor: "#e94d32",
            color: "#ffeed1",
            borderColor: "#e94d32;",
            opacity: showBottomPanel && bottomTab === "terminal" ? 1 : 0.6,
          }}
        >
          ⌨ Terminal
        </button>

        <button
          onClick={handleSave}
          className="btn btn-secondary"
          style={{
            backgroundColor: "#e94d32",
            color: "#ffeed1",
            borderColor: "#e94d32;",
            borderWidth: 1,
          }}
        >
          💾 Save
        </button>

        <button
          onClick={() => setShowChat((p) => !p)}
          className="btn btn-secondary"
          style={{
            backgroundColor: "#e94d32",
            color: "#ffeed1",
            borderColor: "#e94d32;",
            borderWidth: 1,
            opacity: showChat ? 1 : 0.6,
          }}
        >
          {showChat ? "✕ AI Chat" : "◈ AI Chat"}
        </button>
      </div>

      {/* Main layout */}
      <div
        style={{
          display: "flex",
          gap: `${GAP}px`,
          alignItems: "flex-start",
          marginTop: "8px",
        }}
      >
        {/* Editor + bottom panel column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <Editor
            width={editorSize.width}
            height={editorSize.height}
            theme={theme}
            onMount={handleEditorDidMount}
            language={language}
            onChange={handleEditorChange}
          />

          {/* Tabbed bottom panel */}
          {showBottomPanel && (
            <div
              style={{
                width: editorSize.width,
                height: BOTTOM_PANEL_H,
                display: "flex",
                flexDirection: "column",
                background: "#1e1e1e",
                border: "1px solid #3c3c3c",
                borderRadius: "4px",
                overflow: "hidden",
              }}
            >
              {/* Tab bar */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  background: "#252526",
                  borderBottom: "1px solid #3c3c3c",
                  paddingLeft: "4px",
                  flexShrink: 0,
                  height: "32px",
                }}
              >
                <button
                  style={tabStyle(bottomTab === "terminal")}
                  onClick={() => setBottomTab("terminal")}
                  id="btn"
                >
                  ⌨ TERMINAL
                </button>
                <button
                  style={tabStyle(bottomTab === "output")}
                  onClick={() => setBottomTab("output")}
                  disabled={!output}
                  id="btn"
                >
                  ▤ OUTPUT{" "}
                  {output && (
                    <span
                      style={{
                        fontSize: "9px",
                        color: output?.type === "error" ? "#f44747" : "#4ec9b0",
                      }}
                    >
                      ●
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setShowBottomPanel(false)}
                  style={{
                    marginLeft: "auto",
                    marginRight: "6px",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "14px",
                    lineHeight: 1,
                    padding: "0 4px",
                    color: "#e94d32",
                  }}
                  id="btn"
                >
                  ✕
                </button>
              </div>

              {/* Tab content */}
              <div
                style={{ flex: 1, overflow: "hidden", position: "relative" }}
              >
                {/* Terminal — always mounted so the pty session persists */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: bottomTab === "terminal" ? "block" : "none",
                    overflow: "hidden",
                  }}
                >
                  <TerminalComponent
                    theme={theme}
                    wsRef={termWs}
                    roomId={roomId}
                    bottomTab={bottomTab}
                    onOpenFile={(path, content) => {
                      setOpenFilePathSync(path);
                      editorRef.current.setValue(content);
                      const ext = path.split(".").pop();
                      const extMap = {
                        py: "python",
                        js: "javascript",
                        cpp: "cpp",
                        php: "php",
                        html: "html",
                      };
                      if (extMap[ext]) setLanguage(extMap[ext]);
                    }}
                  />
                </div>

                {/* Output */}
                {bottomTab === "output" && (
                  <div
                    style={{ position: "absolute", inset: 0, overflow: "auto" }}
                  >
                    {!output && (
                      <div
                        style={{
                          color: "#555",
                          fontFamily: "monospace",
                          fontSize: "12px",
                          padding: "12px",
                        }}
                      >
                        No output yet. Run your code first.
                      </div>
                    )}
                    {output?.type === "html" && (
                      <iframe
                        srcDoc={output.content}
                        sandbox="allow-scripts"
                        style={{
                          width: "100%",
                          height: "100%",
                          border: "none",
                        }}
                      />
                    )}
                    {output?.type === "text" && (
                      <pre
                        style={{
                          margin: 0,
                          padding: "10px 14px",
                          color: "#d4d4d4",
                          fontFamily: "monospace",
                          fontSize: "12.5px",
                          lineHeight: "1.6",
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-word",
                        }}
                      >
                        {output.content}
                      </pre>
                    )}
                    {output?.type === "error" && (
                      <pre
                        style={{
                          margin: 0,
                          padding: "10px 14px",
                          color: "#f44747",
                          fontFamily: "monospace",
                          fontSize: "12.5px",
                          lineHeight: "1.6",
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-word",
                        }}
                      >
                        {output.content}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* AI Chat panel */}
        <div className="benvo">
          {showChat && (
            <AiChat
              theme={theme}
              language={language}
              getEditorCode={() => editorRef.current?.getValue()}
            />
          )}
          <img
            src={
              showChat && "/sprite_benvolio.png"
            }
            width="200px"
            height="200px"
          ></img>
        </div>
      </div>
    </div>
  );
}

export default App;
