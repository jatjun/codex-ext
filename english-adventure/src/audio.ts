import { useEffect, useRef, useState } from "react";
export function useAudio() {
  const [busy, setBusy] = useState(false),
    [line, setLine] = useState(-1),
    [error, setError] = useState(""),
    generation = useRef(0),
    timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined),
    utterance = useRef<SpeechSynthesisUtterance | null>(null),
    deadline = useRef(0),
    remaining = useRef(30000),
    timedOut = useRef<(() => void) | null>(null);
  const armTimeout = () => {
    if (timer.current) clearTimeout(timer.current);
    deadline.current = performance.now() + remaining.current;
    timer.current = setTimeout(() => timedOut.current?.(), remaining.current);
  };
  const stop = () => {
    generation.current++;
    if (timer.current) clearTimeout(timer.current);
    window.speechSynthesis?.cancel();
    utterance.current = null;
    timedOut.current = null;
    setBusy(false);
    setLine(-1);
  };
  const play = (
    lines: string[],
    rate = 0.85,
    lang = "en-US",
    done?: () => void,
  ) => {
    stop();
    setError("");
    if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) {
      setError("这个浏览器暂时不能播放语音，可以改用文字学习。");
      return;
    }
    const g = generation.current;
    setBusy(true);
    let i = 0;
    const next = () => {
      if (g !== generation.current) return;
      if (i === lines.length) {
        timedOut.current = null;
        setBusy(false);
        setLine(-1);
        done?.();
        return;
      }
      const idx = i++;
      setLine(idx);
      const u = new SpeechSynthesisUtterance(lines[idx]);
      u.lang = lang;
      u.rate = rate;
      const voices = window.speechSynthesis.getVoices(),
        voice =
          voices.find((v) => v.lang === lang) ||
          voices.find((v) => v.lang.startsWith(lang.slice(0, 2)));
      if (voice) u.voice = voice;
      utterance.current = u;
      u.onend = () => {
        if (g !== generation.current) return;
        if (timer.current) clearTimeout(timer.current);
        next();
      };
      u.onerror = () => {
        if (g !== generation.current) return;
        stop();
        setError("语音没有完整播完。可以重听，或点击文字学习。");
      };
      try {
        window.speechSynthesis.speak(u);
        remaining.current = 30000;
        timedOut.current = () => {
          if (g !== generation.current) return;
          stop();
          setError("语音等待较久，已停止。可以重听或使用文字。");
        };
        armTimeout();
      } catch {
        stop();
        setError("语音暂不可用，可以使用文字。");
      }
    };
    next();
  };
  useEffect(
    () => () => {
      generation.current++;
      if (timer.current) clearTimeout(timer.current);
      window.speechSynthesis?.cancel();
    },
    [],
  );
  return {
    busy,
    line,
    error,
    play,
    stop,
    pause: () => {
      if (timer.current) clearTimeout(timer.current);
      remaining.current = Math.max(1, deadline.current - performance.now());
      window.speechSynthesis?.pause();
    },
    resume: () => {
      if (timedOut.current) armTimeout();
      window.speechSynthesis?.resume();
    },
  };
}
