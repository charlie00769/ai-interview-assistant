import { useState } from "react";
import Home from "./components/Home.jsx";
import Interview from "./components/Interview.jsx";
import Report from "./components/Report.jsx";

export default function App() {
  const [view, setView] = useState("home");
  const [config, setConfig] = useState({ mode: "technical", role: "Software Engineer", skills: "", count: 5 });
  const [results, setResults] = useState([]);
  const [violations, setViolations] = useState([]);

  const exitFullscreen = () => document.fullscreenElement && document.exitFullscreen().catch(() => {});

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-800 px-4 py-3">
        <h1 className="mx-auto max-w-5xl text-lg font-semibold">🎯 AI Interview Assistant</h1>
      </header>
      <main className="mx-auto max-w-5xl p-4">
        {view === "home" && <Home config={config} setConfig={setConfig} onStart={() => setView("interview")} />}
        {view === "interview" && (
          <Interview
            config={config}
            onFinish={(r, v) => { setResults(r); setViolations(v); exitFullscreen(); setView("report"); }}
            onExit={() => { exitFullscreen(); setView("home"); }}
          />
        )}
        {view === "report" && (
          <Report results={results} violations={violations} config={config} onRestart={() => setView("home")} />
        )}
      </main>
    </div>
  );
}