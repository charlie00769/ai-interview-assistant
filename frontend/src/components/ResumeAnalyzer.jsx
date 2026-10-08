import { useState } from "react";
import { analyzeResume } from "../api.js";

const Chips = ({ items, cls }) => (
  <div className="flex flex-wrap gap-1.5">
    {items.length ? items.map((s) => <span key={s} className={`rounded-full px-2.5 py-1 text-xs ${cls}`}>{s}</span>) : <span className="text-sm text-slate-500">None</span>}
  </div>
);
const List = ({ title, items }) => items?.length ? (
  <div><h3 className="mb-1 font-medium">{title}</h3><ul className="list-disc space-y-1 pl-5 text-sm text-slate-300">{items.map((x, i) => <li key={i}>{x}</li>)}</ul></div>
) : null;

export default function ResumeAnalyzer({ onUseSkills }) {
  const [file, setFile] = useState(null);
  const [jd, setJd] = useState("");
  const [res, setRes] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const run = async () => {
    setBusy(true); setError(""); setRes(null);
    try {
      const d = await analyzeResume(file, jd);
      if (d.error) setError(d.error); else setRes(d);
    } catch (e) { setError(e.message); }
    setBusy(false);
  };

  return (
    <div className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/50 p-4">
      <input type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files[0])}
        className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-slate-800 file:px-3 file:py-2 file:text-slate-100" />
      <textarea rows={7} value={jd} onChange={(e) => setJd(e.target.value)} placeholder="Paste the job description here…"
        className="w-full rounded-lg border border-slate-700 bg-slate-900 p-3 outline-none focus:border-indigo-500" />
      <button onClick={run} disabled={!file || jd.trim().length < 30 || busy}
        className="w-full rounded-lg bg-indigo-600 py-3 font-semibold hover:bg-indigo-500 disabled:opacity-50">
        {busy ? "Analyzing…" : "Analyze Resume"}
      </button>
      {error && <p className="text-sm text-red-400">{error}</p>}

      {res && (
        <div className="space-y-4 border-t border-slate-800 pt-4">
          <div className="text-center">
            <p className="text-5xl font-bold">{res.ats_score}<span className="text-xl text-slate-500">%</span></p>
            <p className="text-sm text-slate-400">Keyword match score</p>
          </div>
          <p className="text-sm text-slate-300">{res.summary}</p>
          <div><h3 className="mb-1 font-medium text-emerald-400">Matched keywords</h3><Chips items={res.matched} cls="bg-emerald-500/15 text-emerald-300" /></div>
          <div><h3 className="mb-1 font-medium text-red-400">Missing keywords</h3><Chips items={res.missing} cls="bg-red-500/15 text-red-300" /></div>
          <List title="Strengths" items={res.strengths} />
          <List title="Skill gaps" items={res.gaps} />
          <List title="Recommendations" items={res.recommendations} />
          {res.resume_skills?.length > 0 && (
            <button onClick={() => onUseSkills(res.resume_skills)} className="w-full rounded-lg bg-slate-800 py-3 hover:bg-slate-700">
              Use my resume skills for a mock interview →
            </button>
          )}
        </div>
      )}
    </div>
  );
}
