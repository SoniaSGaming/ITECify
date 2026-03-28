import { Editor } from "@monaco-editor/react"
import { useRef, useState } from 'react'
import * as Y from "yjs"
import { WebrtcProvider } from "y-webrtc"
import { MonacoBinding } from "y-monaco"
import Select from "./components/Select.jsx"

function App() {
  const editorRef = useRef(null);
  const monacoRef = useRef(null); 
  const [language, setLanguage] = useState('javascript');
  const [theme, setTheme] = useState('vs-dark');

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

  const languages = ['javascript', 'html', 'css', 'cpp', 'php'];
  const themes = ['vs-dark', 'vs-light', 'dracula', 'solarized-light', 'solarized-dark', 'monokai', 'hc-black'];

  return (
    <>
      <label>Select language</label>
      <Select heading="Language" items={languages} onSelect={setLanguage} />
      <label>Select theme:</label>
      <Select heading="Theme" items={themes} onSelect={handleThemeChange} /> 
      <Editor
        height="100vh"
        width="100vw"
        theme={theme}
        onMount={handleEditorDidMount}
        language={language}
      />
    </>
  );
}

export default App;