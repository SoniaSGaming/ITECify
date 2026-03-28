import { Editor } from "@monaco-editor/react"
import { useRef, useState } from 'react'
import * as Y from "yjs"
import { WebrtcProvider } from "y-webrtc"
import { MonacoBinding } from "y-monaco"
import Select from "./components/Select.jsx"
import "./App.css"

function App() {
  const editorRef = useRef(null);
  const monacoRef = useRef(null); 
  const [language, setLanguage] = useState('javascript');
  const [theme, setTheme] = useState('vs-dark');

  

  async function runCode(language, code) {
    if (language === 'html') {
      return { type: 'html', content: code };
    }

    const langMap = {
      javascript: { language: 'typescript', version: '5.0.3' },
      python:     { language: 'python',  version: '3.10.0' },
      cpp:        { language: 'c++',     version: '10.2.0' },
      php:        { language: 'php',     version: '8.2.3' },
    };

    const config = langMap[language];
    if (!config) return { type: 'error', content: `Language "${language}" not supported` };

    const res = await fetch('/piston/api/v2/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language: config.language,
        version: config.version,
        files: [{ name: language === 'cpp' ? 'main.cpp' : 'main', content: code }],
      }),
    });

    const data = await res.json();
    return {
      type: 'text',
      content: data.run.stderr || data.run.stdout || '(no output)',
    };
  }

  async function handleEditorDidMount(editor, monaco) {
    editorRef.current = editor;
    monacoRef.current = monaco;

    const themeMap = {
      dracula: 'https://cdn.jsdelivr.net/npm/monaco-themes@0.4.4/themes/Dracula.json',
      monokai: 'https://cdn.jsdelivr.net/npm/monaco-themes@0.4.4/themes/Monokai.json',
      'solarized-light': 'https://cdn.jsdelivr.net/npm/monaco-themes@0.4.4/themes/Solarized-light.json',
      'solarized-dark': 'https://cdn.jsdelivr.net/npm/monaco-themes@0.4.4/themes/Solarized-dark.json',
    };

    for (const [key, url] of Object.entries(themeMap)) {
      const data = await fetch(url).then(r => r.json());
      monaco.editor.defineTheme(key, data);
    }

    monaco.editor.setTheme(theme);

    const doc = new Y.Doc();
    const provider = new WebrtcProvider("test-room", doc);
    const type = doc.getText("monaco");
    new MonacoBinding(type, editor.getModel(), new Set([editor]), provider.awareness);
  }

  function handleThemeChange(newTheme) {
    setTheme(newTheme);
    if (monacoRef.current) {
      monacoRef.current.editor.setTheme(newTheme);
    }
  }

  const languages = ['javascript', 'html', 'css', 'cpp', 'php', 'python'];
  const themes = ['vs-dark', 'vs-light', 'dracula', 'solarized-light', 'solarized-dark', 'monokai', 'hc-black'];

  const [output, setOutput] = useState(null);
  const [isRunning, setIsRunning] = useState(false);

  async function handleRun() {
    setIsRunning(true);
    const code = editorRef.current.getValue();
    const result = await runCode(language, code);
    setOutput(result);
    setIsRunning(false);
  }

  return (
    <div className="screen">
      <div className="optsi">
        <label>Select language</label>
        <Select heading="Language" items={languages} onSelect={setLanguage} />
        <label>Select theme:</label>
        <Select heading="Theme" items={themes} onSelect={handleThemeChange} />
      </div>
      <Editor
        height="60vh"
        width="70vw"
        theme={theme}
        onMount={handleEditorDidMount}
        language={language}
      />
      <button onClick={handleRun} disabled={isRunning} className="btn-run">
        {isRunning ? 'Running...' : '▶ Run'}
      </button>

      {output?.type === 'html' && (
        <iframe
          srcDoc={output.content}
          sandbox="allow-scripts"
          style={{ width: '100%', height: '300px', border: 'none' }}
        />
      )}
      {output?.type === 'text' && (
        <pre style={{ background: '#1e1e1e', color: '#d4d4d4', padding: '1rem' }}>
          {output.content}
        </pre>
      )}
      {output?.type === 'error' && (
        <pre style={{ color: 'red' }}>{output.content}</pre>
      )}
    </div>
  );
}

export default App;