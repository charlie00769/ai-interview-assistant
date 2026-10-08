async function handle(res) {
  if (!res.ok) {
    let msg = res.statusText;
    try { msg = (await res.json()).detail || msg; } catch {}
    throw new Error(msg);
  }
  return res.json();
}

const post = (url, body) =>
  fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then(handle);

export const getQuestions = (cfg) =>
  post("/api/questions", {
    mode: cfg.mode,
    role: cfg.role,
    skills: cfg.skills.split(",").map((s) => s.trim()).filter(Boolean),
    count: cfg.count,
  });

export const evaluateAll = (payload) => post("/api/evaluate-all", payload);

export const analyzeResume = (file, jd) => {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("jd", jd);
  return fetch("/api/resume/analyze", { method: "POST", body: fd }).then(handle);
};