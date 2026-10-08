const METRICS = [
  ["technical_accuracy", "Technical Accuracy"],
  ["communication", "Communication"],
  ["confidence", "Confidence"],
  ["relevance", "Relevance"],
];
const avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);
const color = (v) => (v >= 7 ? "bg-emerald-500" : v >= 4 ? "bg-amber-500" : "bg-red-500");

export default function Report({ results, violations = [], config, onRestart }) {
  const avgs = Object.fromEntries(METRICS.map(([k]) => [k, avg(results.map((r) => +r[k] || 0))]));
  const overall = avg(Object.values(avgs));

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 text-center">
        <p className="text-sm text-slate-400">{config.mode === "hr" ? "HR" : "Technical"} interview · {config.role}</p>
        <p className="my-1 text-5xl font-bold">{overall.toFixed(1)}<span className="text-xl text-slate-500">/10</span></p>
        <p className="text-sm text-slate-400">Overall score</p>
      </div>

      <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/50 p-4">
        {METRICS.map(([k, label]) => (
          <div key={k}>
            <div className="mb-1 flex justify-between text-sm"><span>{label}</span><span>{avgs[k].toFixed(1)}</span></div>
            <div className="h-2 rounded bg-slate-800"><div className={`h-2 rounded ${color(avgs[k])}`} style={{ width: `${avgs[k] * 10}%` }} /></div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
        <h3 className="mb-2 font-medium">Proctoring log ({violations.length} violations)</h3>
        {violations.length === 0 ? (
          <p className="text-sm text-emerald-400">No violations recorded.</p>
        ) : (
          <ul className="space-y-1 text-sm text-slate-300">
            {violations.map((v, i) => <li key={i}>{v.time}: {v.msg}</li>)}
          </ul>
        )}
      </div>

      {results.map((r, i) => (
        <div key={i} className="space-y-2 rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <p className="font-medium">Q{i + 1}. {r.question}</p>
          <p className="text-sm text-slate-400">Your answer: {r.answer || "(no answer)"}</p>
          <div className="flex flex-wrap gap-2 text-xs">
            {METRICS.map(([k, label]) => (
              <span key={k} className="rounded bg-slate-800 px-2 py-1">{label.split(" ")[0]}: {r[k]}/10</span>
            ))}
            {r.meta?.wpm && <span className="rounded bg-slate-800 px-2 py-1">{r.meta.wpm} wpm</span>}
            <span className="rounded bg-slate-800 px-2 py-1">{r.meta?.filler_count ?? 0} fillers</span>
          </div>
          <p className="text-sm">{r.feedback}</p>
          {r.ideal_answer_hint && <p className="text-sm text-indigo-300">💡 {r.ideal_answer_hint}</p>}
        </div>
      ))}

      <div className="flex gap-2">
        <button onClick={() => window.print()} className="flex-1 rounded-lg bg-slate-800 py-3 hover:bg-slate-700">Save as PDF</button>
        <button onClick={onRestart} className="flex-1 rounded-lg bg-indigo-600 py-3 font-semibold hover:bg-indigo-500">New Interview</button>
      </div>
    </div>
  );
}