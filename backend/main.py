from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from llm import ask_json
from prompts import MODES, QUESTION_FORMAT, EVAL_ALL_SYSTEM
from resume import analyze

app = FastAPI(title="AI Interview Assistant")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class QuestionReq(BaseModel):
    mode: str = "technical"  # technical | hr
    role: str = "Software Engineer"
    skills: list[str] = []
    count: int = 5


class EvalAllReq(BaseModel):
    mode: str = "technical"
    role: str = "Software Engineer"
    items: list[dict]  # each: question, answer, meta


EMPTY = {"technical_accuracy": 0, "communication": 0, "confidence": 0,
         "relevance": 0, "feedback": "No evaluation returned.", "ideal_answer_hint": ""}


@app.get("/health")
def health():
    return {"ok": True}


@app.post("/api/questions")
def questions(req: QuestionReq):
    system = MODES.get(req.mode, MODES["technical"]) + "\n" + QUESTION_FORMAT
    user = (
        f"Role: {req.role}\nSkills: {', '.join(req.skills) or 'general'}\n"
        f"Generate {min(max(req.count, 1), 10)} questions, increasing difficulty."
    )
    try:
        return ask_json(system, user)
    except Exception as e:
        raise HTTPException(502, f"LLM error: {e}")


@app.post("/api/evaluate-all")
def evaluate_all(req: EvalAllReq):
    lines = []
    for i, it in enumerate(req.items, 1):
        lines.append(
            f"Item {i}\nQuestion: {it.get('question')}\n"
            f"Answer: {it.get('answer') or '(no answer)'}\n"
            f"Delivery stats: {it.get('meta', {})}"
        )
    user = f"Interview type: {req.mode}\nRole: {req.role}\n\n" + "\n\n".join(lines)
    try:
        data = ask_json(EVAL_ALL_SYSTEM, user)
    except Exception as e:
        raise HTTPException(502, f"LLM error: {e}")

    results = data.get("results", [])
    results = (results + [EMPTY] * len(req.items))[: len(req.items)]  # pad/trim
    return {"results": results}


@app.post("/api/resume/analyze")
async def resume_analyze(file: UploadFile = File(...), jd: str = Form(...)):
    if not (file.filename or "").lower().endswith(".pdf"):
        raise HTTPException(400, "Please upload a PDF resume.")
    data = await file.read()
    if len(data) > 5_000_000:
        raise HTTPException(400, "PDF too large (max 5 MB).")
    return analyze(data, jd)