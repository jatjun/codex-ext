import { useEffect, useRef, useState } from "react";
import { Timeline, type Frame, type ClockSnapshot } from "./timeline";
import { Narrator } from "../audio/speech";

export function useAnimation(
  frames: Frame[],
  running: boolean,
  paused: boolean,
  muted: boolean,
  replay: number,
  narrator: Narrator,
  onDone: () => void,
) {
  const [view, setView] = useState<ClockSnapshot>({
    frame: 0,
    progress: 0,
    complete: false,
  });
  const done = useRef(onDone);
  done.current = onDone;
  const pause = useRef(paused);
  pause.current = paused;
  const mute = useRef(muted);
  mute.current = muted;
  const clock = useRef<Timeline | null>(null);
  useEffect(() => {
    if (paused) narrator.pause();
    else narrator.resume();
  }, [paused, narrator]);
  useEffect(() => {
    narrator.setEnabled(!muted);
  }, [muted, narrator]);
  useEffect(() => {
    if (!running) {
      narrator.cancel();
      setView({ frame: 0, progress: 0, complete: false });
      return;
    }
    let disposed = false,
      raf = 0,
      voiceDone = false,
      last = 0,
      activeFrame = -1;
    const durations = frames.map((f) =>
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? Math.min(f.duration, 350)
        : f.duration,
    );
    const timeline = new Timeline(durations);
    clock.current = timeline;
    const step = (time: number) => {
      if (disposed) return;
      timeline.paused = pause.current;
      if (activeFrame !== timeline.frame) {
        activeFrame = timeline.frame;
        voiceDone = false;
        narrator.setEnabled(!mute.current);
        narrator.speak(frames[activeFrame].text).then(() => {
          if (!disposed) voiceDone = true;
        });
        if (pause.current) narrator.pause();
      }
      const snapshot = timeline.tick(last ? Math.min(time - last, 80) : 0);
      last = time;
      setView(snapshot);
      if (snapshot.progress >= 1 && voiceDone && !pause.current)
        timeline.advance();
      if (timeline.complete) {
        setView(timeline.snapshot());
        done.current();
        return;
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      narrator.cancel();
      clock.current = null;
    };
    // Frame arrays have stable module-level identity or are memoized by the caller.
  }, [frames, running, replay, narrator]);
  return view;
}
