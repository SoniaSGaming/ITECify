import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { useRef, useEffect } from "react";
//import "@xterm/xterm/css/xterm.css";
import "./../App.css";

const xtermThemes = {
  "vs-dark": {
    background: "#1e1e1e",
    foreground: "#d4d4d4",
    cursor: "#d4d4d4",
    selectionBackground: "#264f78",
    black: "#000000",
    red: "#f44747",
    green: "#6a9955",
    yellow: "#d7ba7d",
    blue: "#569cd6",
    magenta: "#c586c0",
    cyan: "#4ec9b0",
    white: "#d4d4d4",
  },
  "vs-light": {
    background: "#ffffff",
    foreground: "#000000",
    cursor: "#000000",
    selectionBackground: "#add6ff",
    black: "#000000",
    red: "#cd3131",
    green: "#00bc00",
    yellow: "#949800",
    blue: "#0451a5",
    magenta: "#bc05bc",
    cyan: "#0598bc",
    white: "#555555",
  },
  dracula: {
    background: "#282a36",
    foreground: "#f8f8f2",
    cursor: "#f8f8f2",
    selectionBackground: "#44475a",
    black: "#21222c",
    red: "#ff5555",
    green: "#50fa7b",
    yellow: "#f1fa8c",
    blue: "#bd93f9",
    magenta: "#ff79c6",
    cyan: "#8be9fd",
    white: "#f8f8f2",
  },
  monokai: {
    background: "#272822",
    foreground: "#f8f8f2",
    cursor: "#f8f8f2",
    selectionBackground: "#49483e",
    black: "#272822",
    red: "#f92672",
    green: "#a6e22e",
    yellow: "#f4bf75",
    blue: "#66d9ef",
    magenta: "#ae81ff",
    cyan: "#a1efe4",
    white: "#f8f8f2",
  },
  "solarized-dark": {
    background: "#002b36",
    foreground: "#839496",
    cursor: "#839496",
    selectionBackground: "#073642",
    black: "#073642",
    red: "#dc322f",
    green: "#859900",
    yellow: "#b58900",
    blue: "#268bd2",
    magenta: "#d33682",
    cyan: "#2aa198",
    white: "#eee8d5",
  },
  "solarized-light": {
    background: "#fdf6e3",
    foreground: "#657b83",
    cursor: "#657b83",
    selectionBackground: "#eee8d5",
    black: "#073642",
    red: "#dc322f",
    green: "#859900",
    yellow: "#b58900",
    blue: "#268bd2",
    magenta: "#d33682",
    cyan: "#2aa198",
    white: "#eee8d5",
  },
  "hc-black": {
    background: "#000000",
    foreground: "#ffffff",
    cursor: "#ffffff",
    selectionBackground: "#ffffff30",
    black: "#000000",
    red: "#f44747",
    green: "#89d185",
    yellow: "#d7ba7d",
    blue: "#569cd6",
    magenta: "#c586c0",
    cyan: "#4ec9b0",
    white: "#ffffff",
  },
};

function TerminalComponent({
  onOpenFile,
  theme = "vs-dark",
  wsRef,
  roomId = "default",
  bottomTab,
  cwdRef,
}) {
  const termRef = useRef(null);
  const cwd = useRef("/");
  const xtermInstance = useRef(null);
  const fitAddonInstance = useRef(null);
  const inputBuffer = useRef("");

  // Always keep a fresh ref to onOpenFile so the stale closure
  // inside useEffect's onData handler always calls the latest version
  const onOpenFileRef = useRef(onOpenFile);
  useEffect(() => {
    onOpenFileRef.current = onOpenFile;
  }, [onOpenFile]);

  useEffect(() => {
    if (!termRef.current) return;

    const xtermTheme = xtermThemes[theme] || xtermThemes["vs-dark"];

    const term = new Terminal({ cursorBlink: true, theme: xtermTheme });
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(termRef.current);
    fitAddon.fit();

    xtermInstance.current = term;
    fitAddonInstance.current = fitAddon;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host; // This automatically detects localhost:5173
    const ws = new WebSocket(
      `${protocol}//${host}/terminal?room=${encodeURIComponent(roomId)}`,
    );
    ws.binaryType = "arraybuffer";

    if (wsRef) wsRef.current = ws;

    ws.onopen = () => {
      term.write("\r\n\x1b[32mConnected\x1b[0m\r\n");
      ws.send(
        new TextEncoder().encode(
          'export PROMPT_COMMAND="pwd > /tmp/cwd"\nalias open="# "\n',
        ),
      );
    };

    ws.onmessage = (e) => {
      term.write(new Uint8Array(e.data));

      fetch("/api/container/file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ room_id: roomId, path: "/tmp/cwd" }),
      })
        .then((r) => r.json())
        .then((d) => {
          if (d.content) {
            const freshCwd = d.content.trim();
            cwd.current = freshCwd;
            if (cwdRef) cwdRef.current = freshCwd; // <--- Update the external ref
          }
        })
        .catch(() => {});
    };

    ws.onerror = () => term.write("\r\n\x1b[31mWebSocket error\x1b[0m\r\n");
    ws.onclose = () => {
      term.write("\r\n\x1b[31mDisconnected\x1b[0m\r\n");
      if (wsRef) wsRef.current = null;
    };

    term.onData(async (data) => {
      if (data === "\r") {
        const cmd = inputBuffer.current.trim();
        inputBuffer.current = "";

        if (cmd.startsWith("open ")) {
          const filePath = cmd.slice(5).trim();
          const fullPath = filePath.startsWith("/")
            ? filePath
            : `${cwd.current}/${filePath}`;
          try {
            const res = await fetch("/container/file", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ room_id: roomId, path: fullPath }),
            });

            if (!res.ok) throw new Error("File not found");

            const fileData = await res.json();
            // Call the parent function to update the editor
            onOpenFileRef.current(fullPath, fileData.content);

            term.write("\r\n\x1b[32mFile opened in editor.\x1b[0m\r\n");
          } catch (err) {
            term.write(
              `\r\n\x1b[31mError: Could not open ${fullPath}\x1b[0m\r\n`,
            );
          }
          return;
        }

        if (ws.readyState === WebSocket.OPEN) {
          ws.send(new TextEncoder().encode(data));
        }
        return;
      }

      if (data === "\x7f") {
        inputBuffer.current = inputBuffer.current.slice(0, -1);
      } else if (data.charCodeAt(0) >= 32) {
        inputBuffer.current += data;
      }

      if (ws.readyState === WebSocket.OPEN) {
        ws.send(new TextEncoder().encode(data));
      }
    });

    return () => {
      ws.close();
      term.dispose();
      if (wsRef) wsRef.current = null;
    };
  }, []);

  // Update xterm theme without remounting the terminal
  useEffect(() => {
    if (xtermInstance.current) {
      xtermInstance.current.options.theme =
        xtermThemes[theme] || xtermThemes["vs-dark"];
    }
  }, [theme]);

  // Refit and scroll when terminal tab becomes visible
  useEffect(() => {
    if (bottomTab === "terminal" && fitAddonInstance.current) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          fitAddonInstance.current?.fit();
          xtermInstance.current?.scrollToBottom();
        });
      });
    }
  }, [bottomTab]);

  return (
    <div
      ref={termRef}
      style={{
        height: "100%",
        width: "100%",
        padding: "8px",
        boxSizing: "border-box",
        background: xtermThemes[theme]?.background || "#1e1e1e",
      }}
    />
  );
}

export default TerminalComponent;
