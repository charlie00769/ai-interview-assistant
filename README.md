# AI Interview Assistant

A full-stack mock interview platform. Practice Technical or HR/Behavioral interviews with spoken answers, get scored feedback in a proctored session, and check your resume against a job description.

## Why I built it

I wanted better interview practice than static question lists. My first version used a fixed question bank, which was simple but gave every candidate the same questions. I rebuilt it so an LLM generates questions for the chosen role and skills, with increasing difficulty. I then added scoring, proctoring and a resume analyzer, and tested it on myself, on friends, and on 15-16 resumes through the analyzer.

## Features

- **Mock interview** with two modes: Technical and HR/Behavioral. Choose a target role, skills and number of questions (1-10).
- **LLM-generated questions** tailored to the role and skills, with increasing difficulty.
- **Voice interaction:** questions are read aloud, answers are captured with browser speech recognition, and a webcam preview is shown.
- **Scored feedback:** one LLM call scores every answer from 0-10 on technical accuracy, communication, confidence and relevance, using delivery stats (words per minute, filler words), plus written feedback and an ideal-answer hint.
- **Proctoring (client-side):**
  - The session runs full-screen and logs full-screen exits, tab switches and lost window focus.
  - Copy, cut, paste and right-click are blocked and logged.
  - Screen sharing is required for the session.
  - The interview auto-submits if the camera is lost or switched off.
  - All violations appear in the final report.
- **ATS Resume Analyzer:** upload a PDF resume and paste a job description. It parses the PDF, matches keywords from a ~100-skill list to give an ATS score, and uses an LLM for strengths, gaps and recommendations.
- **Switchable LLM provider:** Gemini, OpenAI or Claude through one setting, with retry and backoff on temporary overload or rate limits.

## Tech stack

- **Frontend:** React 18, Vite, Tailwind CSS, Web Speech API
- **Backend:** Python, FastAPI, pdfplumber
- **LLMs:** Gemini, OpenAI or Anthropic Claude (your choice)

## Design decisions

- **LLM-generated questions over a fixed bank.** A fixed bank is predictable and cheap, but it cannot adapt to the role or skills the candidate picks.
- **Provider-agnostic LLM layer.** All three providers hit token or rate limits during longer sessions, so the provider is a single setting and calls retry with backoff instead of failing the interview.
- **One scoring request for all answers.** `/api/evaluate-all` scores the whole session in a single call instead of one call per answer, which keeps the number of LLM calls low.

## API endpoints

| Method | Path                  | Purpose                                        |
| ------ | --------------------- | ---------------------------------------------- |
| GET    | `/health`             | Health check                                   |
| POST   | `/api/questions`      | Generate interview questions                   |
| POST   | `/api/evaluate-all`   | Score all answers in one request               |
| POST   | `/api/resume/analyze` | Analyze a PDF resume against a job description |

## Run locally

**Backend**

```
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env            # add your API key and set LLM_PROVIDER
uvicorn main:app --reload       # http://localhost:8000/docs
```

**Frontend**

```
cd frontend
npm install
npm run dev                     # http://localhost:5173
```

Use Chrome or Edge for speech recognition and screen sharing, and allow camera, microphone and screen-share access when asked.

## Notes and limitations

- Proctoring runs in the browser, so it discourages cheating and records events but cannot fully prevent it (for example, a second device).
- Speech recognition depends on the browser's Web Speech API, so it works best in Chrome or Edge.
- Never commit your `.env` file. It is listed in `.gitignore`.
