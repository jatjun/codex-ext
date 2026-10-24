import { useEffect, useRef, useState } from "react";
export function useMotion() {
  const [p, setP] = useState(0),
    [playing, setPlaying] = useState(false),
    [speed, setSpeed] = useState(1);
  const cursor = useRef(0);
  const generation = useRef(0);
  const reduced =
    typeof matchMedia !== "undefined" &&
    matchMedia("(prefers-reduced-motion: reduce)").matches;
  useEffect(() => {
    if (!playing) return;
    let frame = 0,
      last = 0;
    const token = ++generation.current;
    function tick(now: number) {
      if (token !== generation.current) return;
      if (!document.hidden) {
        if (last) {
          cursor.current = Math.min(
            1,
            cursor.current + (Math.min(now - last, 60) * speed) / 3200,
          );
          setP(cursor.current);
        }
        last = now;
      } else last = 0;
      if (cursor.current >= 1) setPlaying(false);
      else frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => {
      generation.current++;
      cancelAnimationFrame(frame);
    };
  }, [playing, speed]);
  function pause() {
    generation.current++;
    setPlaying(false);
  }
  function reset() {
    pause();
    cursor.current = 0;
    setP(0);
  }
  function seek(value: number) {
    pause();
    cursor.current = Math.max(0, Math.min(1, value));
    setP(cursor.current);
  }
  function play() {
    if (p >= 1) return;
    if (reduced) seek(1);
    else setPlaying(true);
  }
  return { p, playing, speed, setSpeed, pause, reset, seek, play, reduced };
}
