import { useEffect, useRef, useState } from "react";

export function useProctor() {
  const [events, setEvents] = useState([]);
  const [warning, setWarning] = useState("");
  const last = useRef(0);

  useEffect(() => {
    const log = (msg) => {
      const now = Date.now();
      if (now - last.current < 1000) return; // dedupe tab switch + blur
      last.current = now;
      setEvents((e) => [...e, { msg, time: new Date().toLocaleTimeString() }]);
      setWarning(msg);
    };
    const onVis = () => document.hidden && log("Switched tab or minimized window");
    const onBlur = () => log("Window lost focus");
    const onFs = () => !document.fullscreenElement && log("Exited full-screen");
    const block = (name) => (e) => { e.preventDefault(); log(`Attempted ${name}`); };
    const onCopy = block("copy"), onPaste = block("paste"), onCut = block("cut"), onCtx = block("right-click");

    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("blur", onBlur);
    document.addEventListener("fullscreenchange", onFs);
    document.addEventListener("copy", onCopy);
    document.addEventListener("paste", onPaste);
    document.addEventListener("cut", onCut);
    document.addEventListener("contextmenu", onCtx);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("fullscreenchange", onFs);
      document.removeEventListener("copy", onCopy);
      document.removeEventListener("paste", onPaste);
      document.removeEventListener("cut", onCut);
      document.removeEventListener("contextmenu", onCtx);
    };
  }, []);

  return { events, warning, dismiss: () => setWarning("") };
}