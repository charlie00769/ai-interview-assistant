import os, json, re, time
from dotenv import load_dotenv

load_dotenv()
PROVIDER = os.getenv("LLM_PROVIDER", "openai").lower()


def _claude(system: str, user: str) -> str:
    import anthropic
    client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
    msg = client.messages.create(
        model=os.getenv("CLAUDE_MODEL", "claude-sonnet-5-5"),
        max_tokens=4000,
        system=system,
        messages=[{"role": "user", "content": user}],
    )
    return msg.content[0].text


def _openai(system: str, user: str) -> str:
    from openai import OpenAI
    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    res = client.chat.completions.create(
        model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
    )
    return res.choices[0].message.content


def _gemini(system: str, user: str) -> str:
    from openai import OpenAI
    client = OpenAI(
        api_key=os.getenv("GEMINI_API_KEY"),
        base_url="https://generativelanguage.googleapis.com/v1beta/openai/",
    )
    res = client.chat.completions.create(
        model=os.getenv("GEMINI_MODEL", "gemini-3.8-flash"),
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
    )
    return res.choices[0].message.content


def ask_json(system: str, user: str, retries: int = 4):
    """Call the configured LLM (retrying on temporary overload) and parse JSON."""
    system += "\nRespond ONLY with valid JSON. No markdown, no preface."
    fn = {"claude": _claude, "gemini": _gemini}.get(PROVIDER, _openai)

    for attempt in range(retries):
        try:
            raw = fn(system, user)
            break
        except Exception as e:
            temporary = "503" in str(e) or "UNAVAILABLE" in str(e)
            if temporary and attempt < retries - 1:
                time.sleep(2 ** attempt)  # wait 1s, 2s, 4s
                continue
            raise

    raw = re.sub(r"```json|```", "", raw).strip()
    return json.loads(raw)