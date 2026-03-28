import { useState } from 'react'

function FileNode({ item, onOpenFile, depth = 0 }) {
  const [open, setOpen] = useState(false);
  const [children, setChildren] = useState([]);

  async function handleClick() {
    if (item.is_dir) {
      if (!open) {
        const res = await fetch('/api/files', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: item.path }),
        });
        const data = await res.json();
        setChildren(data.items);
      }
      setOpen(p => !p);
    } else {
      const res = await fetch('/api/file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: item.path }),
      });
      const data = await res.json();
      onOpenFile(item.path, data.content);
    }
  }

  return (
    <div>
      <div
        onClick={handleClick}
        style={{
          paddingLeft: `${depth * 12 + 8}px`,
          padding: `3px 8px 3px ${depth * 12 + 8}px`,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          borderRadius: '4px',
          fontSize: '13px',
          color: '#d4d4d4',
          userSelect: 'none',
        }}
        onMouseEnter={e => e.currentTarget.style.background = '#2a2a2a'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        <span>{item.is_dir ? (open ? '📂' : '📁') : '📄'}</span>
        <span>{item.name}</span>
      </div>
      {open && children.map(child => (
        <FileNode key={child.path} item={child} onOpenFile={onOpenFile} depth={depth + 1} />
      ))}
    </div>
  );
}

export default function FileExplorer({ onOpenFile }) {
  const [root, setRoot] = useState('/home');
  const [items, setItems] = useState([]);
  const [loaded, setLoaded] = useState(false);

  async function load(path) {
    const res = await fetch('/api/files', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path }),
    });
    const data = await res.json();
    setItems(data.items);
    setLoaded(true);
  }

  return (
    <div style={{ width: '200px', background: '#1e1e1e', height: '100%', overflowY: 'auto', borderRight: '1px solid #333' }}>
      <div style={{ padding: '8px', borderBottom: '1px solid #333', display: 'flex', gap: '4px' }}>
        <input
          value={root}
          onChange={e => setRoot(e.target.value)}
          style={{ flex: 1, background: '#2a2a2a', border: 'none', color: '#d4d4d4', padding: '4px', borderRadius: '4px', fontSize: '12px' }}
        />
        <button onClick={() => load(root)} style={{ background: '#0e639c', border: 'none', color: '#fff', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}>
          Go
        </button>
      </div>
      {!loaded && <div style={{ padding: '8px', color: '#888', fontSize: '12px' }}>Enter a path and press Go</div>}
      {items.map(item => (
        <FileNode key={item.path} item={item} onOpenFile={onOpenFile} depth={0} />
      ))}
    </div>
  );
}