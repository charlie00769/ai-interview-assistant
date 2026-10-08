import { useEffect, useRef, useState } from "react";
import { getQuestions, evaluateAll } from "../api.js";
import { useSpeech } from "../hooks/useSpeech.js";
import { useProctor } from "../hooks/useProctor.js";

const FILLERS = /\b(um+|uh+|like|you know|basically)\b/gi;

export default function Interview({ config, onFinish, onExit }) {
  const [questions, setQuestions] = useState([]);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [camError, setCamError] = useState("");
  const [stream, setStream] = useState(null);
  const videoRef = useRef(null);
  const startedAt = useRef(null);
  const pending = useRef(null); // all answers, kept if final evaluation fails so you can retry
  const speech = useSpeech();
  const proctor = useProctor();

  // load questions
  useEffect(() => {
    getQuestions(config)
      .then((d) => setQuestions(d.questions))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // webcam
  useEffect(() => {
    let s;
    navigator.mediaDevices
      ?.getUserMedia({ video: true })
      .then((st) => { s = st; setStream(st); })
      .catch(() => setCamError("Camera unavailable. You can still continue."));
    return () => s?.getTracks().forEach((t) => t.stop());
  }, []);

  // attach the stream once the <video> element actually exists
  useEffect(() => {
    if (videoRef.current && stream) videoRef.current.srcObject = stream;
  }, [stream, loading]);

  // read question aloud
  const speak = (text) => {
    if (!("speechSynthesis" in window) || !text) return;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
  };
  useEffect(() => {
    if (questions[idx]) speak(questions[idx].question);
    return () => window.speechSynthesis?.cancel();
  }, [questions, idx]);

  const toggleMic = () => {
    if (speech.listening) return speech.stop();
    window.speechSynthesis?.cancel();
    if (!startedAt.current) startedAt.current = Date.now();
    speech.start();
  };

  const isLast = idx + 1 === questions.length;

  const submit = async () => {
    speech.stop();
    setError("");
    let all = pending.current;

    if (!all) {
      const answer = speech.transcript.trim();
      const words = answer ? answer.split(/\s+/).length : 0;
      const duration = startedAt.current ? (Date.now() - startedAt.current) / 1000 : 0;
      const meta = {
        duration_sec: Math.round(duration),
        wpm: duration > 3 ? Math.round(words / (duration / 60)) : null,
        filler_count: (answer.match(FILLERS) || []).length,
      };
      const q = questions[idx];
      all = [...answers, { question: q.question, difficulty: q.difficulty, answer, meta }];
      setAnswers(all);

      if (!isLast) {
        setIdx(idx + 1);
        speech.setTranscript("");
        startedAt.current = null;
        return;
      }
      pending.current = all;
    }

    // last question: evaluate everything in ONE request
    setBusy(true);
    try {
      const { results } = await evaluateAll({
        mode: config.mode,
        role: config.role,
        items: all.map(({ question, answer, meta }) => ({ question, answer, meta })),
      });
      const merged = all.map((a, i) => ({ ...a, ...(results[i] || {}) }));
      onFinish(merged, proctor.events);
    } catch (e) {
      setError(e.message + " (click Finish to retry)");
      setBusy(false);
    }
  };

  if (loading) return <p className="py-20 text-center text-slate-400">Preparing your questions…</p>;
  if (error && !questions.length)
    return (
      <div className="py-20 text-center">
        <p className="mb-4 text-red-400">{error}</p>
        <button onClick={onExit} className="rounded-lg bg-slate-800 px-4 py-2">Back</button>
      </div>
    );

  const q = questions[idx];
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {proctor.warning && (
        <div className="flex items-center justify-between rounded-lg border border-red-500 bg-red-500/10 p-3 text-sm text-red-300 md:col-span-2">
          <span>⚠️ Violation recorded: {proctor.warning}</span>
          <button onClick={proctor.dismiss} className="underline">OK</button>
        </div>
      )}

      <div className="space-y-3">
        <div className="aspect-video overflow-hidden rounded-xl border border-slate-800 bg-black">
          <video ref={videoRef} autoPlay muted playsInline className="h-full w-full -scale-x-100 object-cover" />
        </div>
        {camError && <p className="text-xs text-amber-400">{camError}</p>}
        <div className="h-2 rounded bg-slate-800">
          <div className="h-2 rounded bg-indigo-500 transition-all" style={{ width: `${(idx / questions.length) * 100}%` }} />
        </div>
        <p className="text-xs text-slate-500">
          Question {idx + 1} of {questions.length} · Violations: {proctor.events.length}
        </p>
      </div>

      <div className="space-y-3">
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <div className="mb-1 flex items-center justify-between text-xs uppercase text-slate-500">
            <span>{q.difficulty}</span>
            <button onClick={() => speak(q.question)} className="text-indigo-400">🔊 Replay</button>
          </div>
          <p className="text-lg">{q.question}</p>
        </div>

        <textarea
          rows={7}
          value={speech.transcript}
          onChange={(e) => speech.setTranscript(e.target.value)}
          disabled={busy}
          placeholder={speech.supported ? "Tap the mic and speak, or type your answer…" : "Speech not supported in this browser. Type your answer."}
          className="w-full rounded-xl border border-slate-700 bg-slate-900 p-3 outline-none focus:border-indigo-500"
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <div className="flex gap-2">
          {speech.supported && (
            <button onClick={toggleMic} disabled={busy} className={`flex-1 rounded-lg py-3 font-semibold ${speech.listening ? "animate-pulse bg-red-600" : "bg-slate-800 hover:bg-slate-700"}`}>
              {speech.listening ? "⏹ Stop" : "🎤 Speak"}
            </button>
          )}
          <button onClick={submit} disabled={busy} className="flex-1 rounded-lg bg-indigo-600 py-3 font-semibold hover:bg-indigo-500 disabled:opacity-50">
            {busy ? "Evaluating all answers…" : isLast ? "Finish & Evaluate" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}