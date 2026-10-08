import io, re
import pdfplumber
from llm import ask_json

SKILLS = """python java javascript typescript c++ c# sql html css react react.js node.js
express fastapi flask django spring git github docker kubernetes aws azure gcp lambda s3
machine learning deep learning nlp computer vision opencv mediapipe tensorflow pytorch
scikit-learn pandas numpy generative ai llm data analysis data structures algorithms dsa oop
rest api mongodb postgresql mysql tailwind linux agile scrum sap abap oracle power bi
tableau excel arduino ci/cd testing communication leadership teamwork problem solving""".replace("\n", " ")

MULTI = ["machine learning", "deep learning", "computer vision", "generative ai",
         "data analysis", "data structures", "problem solving", "power bi", "rest api"]
_singles = [w for w in SKILLS.split() if not any(w in m.split() for m in MULTI)]
SKILL_LIST = sorted(set(MULTI + _singles))


def extract_text(data: bytes) -> str:
    with pdfplumber.open(io.BytesIO(data)) as pdf:
        return "\n".join((p.extract_text() or "") for p in pdf.pages)


def _has(text: str, term: str) -> bool:
    return re.search(rf"(?<![\w+#.]){re.escape(term)}(?![\w+#])", text, re.I) is not None


def analyze(data: bytes, jd: str) -> dict:
    resume = extract_text(data)
    if len(resume.strip()) < 50:
        return {"error": "Could not read text from this PDF (scanned image?)."}

    required = [s for s in SKILL_LIST if _has(jd, s)]
    matched = [s for s in required if _has(resume, s)]
    missing = [s for s in required if s not in matched]
    resume_skills = [s for s in SKILL_LIST if _has(resume, s)]
    score = round(100 * len(matched) / len(required)) if required else 0

    system = (
        "You are an ATS expert and career coach. Compare the resume to the job "
        'description. Return JSON: {"summary": "2-3 sentences", "strengths": ["..."], '
        '"gaps": ["..."], "recommendations": ["specific, actionable resume edits"]}'
    )
    user = (
        f"RESUME:\n{resume[:6000]}\n\nJOB DESCRIPTION:\n{jd[:4000]}\n\n"
        f"Keywords matched: {matched}\nKeywords missing: {missing}"
    )
    try:
        ai = ask_json(system, user)
    except Exception as e:  # keep keyword results even if LLM fails
        ai = {"summary": f"AI analysis unavailable ({e}).", "strengths": [], "gaps": [], "recommendations": []}

    return {
        "ats_score": score,
        "matched": matched,
        "missing": missing,
        "resume_skills": resume_skills,
        **ai,
    }
