from groq import Groq
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import os
import asyncio
import ptyprocess
import subprocess

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Config ───────────────────────────────────────────────────────────────────
DOCKER_IMAGE = os.getenv("DOCKER_IMAGE", "python:3.11-slim")
# ──────────────────────────────────────────────────────────────────────────────

class FileRequest(BaseModel):
    path: str

class CodeRequest(BaseModel):
    code: str

class FileSaveRequest(BaseModel):
    path: str
    content: str

class DirRequest(BaseModel):
    path: str

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: list[ChatMessage]

class RoomRequest(BaseModel):
    roomId: str


# ─── Docker-backed PTY room ───────────────────────────────────────────────────

class PtyRoom:
    def __init__(self, room_id: str):
        self.room_id = room_id
        self.clients: set[WebSocket] = set()
        self.container_id: str | None = None
        self.proc: ptyprocess.PtyProcess | None = None
        self._start_container()

    def _start_container(self):
        result = subprocess.run(
            [
                "docker", "run",
                "--rm",                           # auto-delete on stop
                "-d",                             # detached (background)
                "--name", f"room_{self.room_id}",
                "--network", "none",              # no internet inside container
                DOCKER_IMAGE,
                "sleep", "infinity",
            ],
            capture_output=True, text=True,
        )
        if result.returncode != 0:
            raise RuntimeError(f"Failed to start container: {result.stderr.strip()}")

        self.container_id = result.stdout.strip()

        self.proc = ptyprocess.PtyProcess.spawn(
            ["docker", "exec", "-it", f"room_{self.room_id}", "/bin/bash"],
        )
        self.proc.write(b'export PROMPT_COMMAND="pwd > /tmp/cwd"\n')

    def is_alive(self) -> bool:
        return self.proc is not None and self.proc.isalive()

    def terminate(self):
        try:
            if self.proc:
                self.proc.terminate()
        except Exception:
            pass
        if self.container_id:
            subprocess.run(["docker", "stop", f"room_{self.room_id}"], capture_output=True)
        self.container_id = None
        self.proc = None

    # Inside PtyRoom class
    def read_file(self, path: str) -> str:
        # Use -n to avoid issues with files that don't end in a newline
        result = subprocess.run(
            ["docker", "exec", f"room_{self.room_id}", "cat", path],
            capture_output=True, text=True,
        )
        if result.returncode != 0:
            # If cat fails, the file might not exist
            raise FileNotFoundError(f"File {path} not found inside container.")
        return result.stdout

    def write_file(self, path: str, content: str):
        # This command runs INSIDE the specific container for that room
        # 'mkdir -p' handles subfolders, 'cat' writes the data
        directory = os.path.dirname(path)
        cmd = f"mkdir -p {directory} && cat > {path}"
        
        subprocess.run(
            ["docker", "exec", "-i", f"room_{self.room_id}", "bash", "-c", cmd],
            input=content, 
            capture_output=True, 
            text=True
        )

    def list_dir(self, path: str) -> list[dict]:
        result = subprocess.run(
            ["docker", "exec", f"room_{self.room_id}", "bash", "-c",
             f"find {path} -maxdepth 1 -mindepth 1 -printf '%y\\t%f\\t%p\\n' | sort"],
            capture_output=True, text=True,
        )
        items = []
        for line in result.stdout.strip().splitlines():
            parts = line.split("\t", 2)
            if len(parts) == 3:
                kind, name, full_path = parts
                items.append({"name": name, "path": full_path, "is_dir": kind == "d"})
        return items


pty_rooms: dict[str, PtyRoom] = {}


def get_or_create_pty_room(room_id: str) -> PtyRoom:
    if room_id not in pty_rooms or not pty_rooms[room_id].is_alive():
        if room_id in pty_rooms:
            pty_rooms[room_id].terminate()
        pty_rooms[room_id] = PtyRoom(room_id)
    return pty_rooms[room_id]


async def broadcast(room: PtyRoom, data: bytes):
    dead = set()
    for ws in list(room.clients):
        try:
            await ws.send_bytes(data)
        except Exception:
            dead.add(ws)
    room.clients -= dead


async def pty_read_loop(room: PtyRoom):
    loop = asyncio.get_event_loop()
    while room.is_alive():
        try:
            data = await loop.run_in_executor(None, room.proc.read, 1024)
            if room.clients:
                await broadcast(room, data)
        except Exception:
            break


# ─── Standard file endpoints (host filesystem) ────────────────────────────────

@app.post("/files")
def list_files(req: DirRequest):
    try:
        entries = os.scandir(req.path)
        items = [
            {"name": e.name, "path": e.path, "is_dir": e.is_dir()}
            for e in sorted(entries, key=lambda e: (not e.is_dir(), e.name))
        ]
        return {"items": items}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/file")
def read_file(req: FileRequest):
    try:
        with open(req.path, 'r') as f:
            return {"content": f.read()}
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"File not found: {req.path}")
    except PermissionError:
        raise HTTPException(status_code=403, detail=f"Permission denied: {req.path}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/file/save")
def save_file(req: FileSaveRequest):
    try:
        with open(req.path, 'w') as f:
            f.write(req.content)
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─── Container-aware file endpoints ───────────────────────────────────────────

class ContainerFileRequest(BaseModel):
    room_id: str
    path: str

class ContainerFileSaveRequest(BaseModel):
    room_id: str
    path: str
    content: str

@app.post("/container/file")
def container_read_file(req: ContainerFileRequest):
    try:
        room = get_or_create_pty_room(req.room_id)
        return {"content": room.read_file(req.path)}
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/container/file/save")
def container_save_file(req: ContainerFileSaveRequest):
    try:
        room = get_or_create_pty_room(req.room_id)
        room.write_file(req.path, req.content)
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/container/files")
def container_list_files(req: ContainerFileRequest):
    try:
        room = get_or_create_pty_room(req.room_id)
        return {"items": room.list_dir(req.path)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─── Shared terminal WebSocket ────────────────────────────────────────────────

@app.websocket("/terminal")
async def terminal(websocket: WebSocket):
    room_id = websocket.query_params.get("room", "default")
    await websocket.accept()

    try:
        room = get_or_create_pty_room(room_id)
    except RuntimeError as e:
        await websocket.send_bytes(
            f"\r\n\x1b[31mFailed to start container: {e}\x1b[0m\r\n".encode()
        )
        await websocket.close()
        return

    is_first_client = len(room.clients) == 0
    room.clients.add(websocket)

    if is_first_client:
        asyncio.create_task(pty_read_loop(room))

    try:
        while True:
            msg = await websocket.receive_bytes()
            if room.is_alive():
                room.proc.write(msg)
    except (WebSocketDisconnect, Exception):
        pass
    finally:
        room.clients.discard(websocket)
        if not room.clients:
            room.terminate()
            pty_rooms.pop(room_id, None)


# ─── AI endpoints ─────────────────────────────────────────────────────────────

@app.post("/chat")
def chat(req: ChatRequest):
    try:
        system_prompt = (
            "You are an expert coding assistant embedded in a code editor. "
            "You help developers with code questions, debugging, explanations, and suggestions. "
            "Be concise and precise. When sharing code, use markdown code blocks with language tags. "
            "You may receive context about the code currently open in the editor."
            "Your name is Benvolio and you are a friendly red panda."
        )
        messages = [{"role": m.role, "content": m.content} for m in req.messages]
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": system_prompt},
                *messages,
            ],
            max_tokens=1024,
        )
        reply = response.choices[0].message.content.strip()
        return {"reply": reply}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def get_suggestion(codul_scris):
    prompt = f"""Esti un asistent de programare expert in TOATE limbajele de programare.
        Analizeaza codul de mai jos si detecteaza automat in ce limbaj e scris.
        Apoi sugereaza cum sa fie continuat, folosind ACELASI limbaj detectat.
        Codul scris pana acum: {codul_scris}
        Reguli:
            - Detecteaza limbajul (Python, JavaScript, C++, HTML, PHP)
            - Sugestia trebuie sa fie in ACELASI limbaj
            - Maxim 10 linii de cod
            - O singura sugestie concreta
        Formatul răspunsului:
        Linie: <linia la care trebuie completata>
        COD: <codul sugerat exclusiv cel ce trebuie completat>"""

    raspuns = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=400
    )
    text = raspuns.choices[0].message.content.strip()
    if "Linie:" not in text or "COD:" not in text:
        return {"linie": "1", "cod": text}
    linie = text.split("Linie:")[1].split("COD:")[0].strip()
    cod = text.split("COD:")[1].strip()
    return {"linie": linie, "cod": cod}

@app.post("/suggest")
def suggest(req: CodeRequest):
    try:
        result = get_suggestion(req.code)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─── Room management ──────────────────────────────────────────────────────────

active_rooms: set[str] = set()

@app.post('/room/create')
def create_room(body: RoomRequest):
    if body.roomId in active_rooms:
        raise HTTPException(status_code=409, detail='Room already exists')
    active_rooms.add(body.roomId)
    try:
        get_or_create_pty_room(body.roomId)
    except RuntimeError as e:
        active_rooms.discard(body.roomId)
        raise HTTPException(status_code=500, detail=f"Could not start container: {e}")
    return {'ok': True}

@app.post('/room/join')
def join_room(body: RoomRequest):
    if body.roomId not in active_rooms:
        raise HTTPException(status_code=404, detail='Room not found')
    return {'ok': True}

@app.post('/room/close')
def close_room(body: RoomRequest):
    active_rooms.discard(body.roomId)
    room = pty_rooms.pop(body.roomId, None)
    if room:
        room.terminate()
    return {'ok': True}


# ─── Yjs sync ─────────────────────────────────────────────────────────────────

yjs_rooms: dict[str, set[WebSocket]] = {}

@app.websocket("/yjs/{room_id}")
async def yjs_sync(websocket: WebSocket, room_id: str):
    await websocket.accept()
    if room_id not in yjs_rooms:
        yjs_rooms[room_id] = set()
    yjs_rooms[room_id].add(websocket)
    try:
        while True:
            data = await websocket.receive_bytes()
            for peer in list(yjs_rooms[room_id]):
                if peer != websocket:
                    await peer.send_bytes(data)
    except WebSocketDisconnect:
        yjs_rooms[room_id].discard(websocket)
        if not yjs_rooms[room_id]:
            del yjs_rooms[room_id]