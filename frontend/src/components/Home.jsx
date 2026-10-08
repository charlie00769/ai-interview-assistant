import { useState } from "react";
import ResumeAnalyzer from "./ResumeAnalyzer.jsx";

const input = "w-full rounded-lg border border-slate-700 bg-slate-900 p-2 outline-none focus:border-indigo-500";

export default function Home({ config, setConfig, onStart }) {
  const [tab, setTab] = useState("interview");
  const set = (k, v) => setConfig({ ...config, [k]: v });

  const start = () => {
    document.documentElement.requestFullscreen?.().catch(() => {});
    onStart();
  };

  const tabBtn = (id, label) => (
    <button
      onClick={() => setTab(id)}
      className={`rounded-lg px-4 py-2 text-sm font-medium ${tab === id ? "bg-indigo-600" : "bg-slate-800 hover:bg-slate-700"}`}
    >
      {label}
    </button>
  );

  return (
    <div>
      <div className="mb-4 flex gap-2">{tabBtn("interview", "Mock Interview")}{tabBtn("resume", "ATS Resume Analyzer")}</div>

      {tab === "interview" ? (
        <div className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <div>
            <label className="mb-1 block text-sm text-slate-400">Interview mode</label>
            <div className="grid grid-cols-2 gap-2">
              {[["technical", "💻 Technical"], ["hr", "🤝 HR / Behavioral"]].map(([id, label]) => (
                <button key={id} onClick={() => set("mode", id)}
                  className={`rounded-lg border p-3 ${config.mode === id ? "border-indigo-500 bg-indigo-500/10" : "border-slate-700"}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-400">Target role</label>
            <input className={input} value={config.role} onChange={(e) => set("role", e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-400">Skills (comma separated)</label>
            <input className={input} placeholder="Python, React, SQL, ML" value={config.skills} onChange={(e) => set("skills", e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-400">Questions: {config.count}</label>
            <input type="range" min="3" max="10" value={config.count} onChange={(e) => set("count", +e.target.value)} className="w-full" />
          </div>

          <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-200">
            🔒 Proctored session: the interview runs in full-screen. Leaving full-screen, switching tabs, and copy/paste
            are recorded and shown in your final report.
          </div>

          <button onClick={start} className="w-full rounded-lg bg-indigo-600 py-3 font-semibold hover:bg-indigo-500">
            Start Interview
          </button>
          <p className="text-xs text-slate-500">Use Chrome or Edge for speech recognition. Allow camera and mic when asked.</p>
        </div>
      ) : (
        <ResumeAnalyzer onUseSkills={(skills) => { set("skills", skills.join(", ")); setTab("interview"); }} />
      )}
    </div>
  );
}