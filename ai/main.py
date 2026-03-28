from groq import Groq
from fastapi import FastAPI, HTTPException, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import os
import asyncio
import ptyprocess

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


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


@app.websocket("/terminal")
async def terminal(websocket: WebSocket):
    await websocket.accept()
    proc = ptyprocess.PtyProcess.spawn(['/bin/bash'])

    async def read_loop():
        loop = asyncio.get_event_loop()
        while proc.isalive():
            try:
                data = await loop.run_in_executor(None, proc.read, 1024)
                await websocket.send_bytes(data)
            except Exception:
                break

    asyncio.create_task(read_loop())

    try:
        while True:
            msg = await websocket.receive_bytes()
            proc.write(msg)
    except Exception:
        proc.terminate()


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