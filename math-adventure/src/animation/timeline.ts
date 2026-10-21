export type Frame = { text: string; duration: number };
export type ClockSnapshot = {
  frame: number;
  progress: number;
  complete: boolean;
};
// Pure animation clock: pause preserves position; replay replaces rather than appends objects.
export class Timeline {
  frame = 0;
  elapsed = 0;
  paused = false;
  complete = false;
  constructor(public durations: number[]) {}
  tick(ms: number): ClockSnapshot {
    if (!this.paused && !this.complete) {
      this.elapsed += Math.max(0, ms);
      // A frame advances only when its caller releases the narration barrier.
      this.elapsed = Math.min(this.elapsed, this.durations[this.frame] ?? 0);
    }
    return this.snapshot();
  }
  advance() {
    if (
      this.paused ||
      this.elapsed < (this.durations[this.frame] ?? 0) ||
      this.complete
    )
      return;
    if (this.frame + 1 === this.durations.length) this.complete = true;
    else {
      this.frame++;
      this.elapsed = 0;
    }
  }
  snapshot(): ClockSnapshot {
    return {
      frame: this.frame,
      progress: Math.min(1, this.elapsed / (this.durations[this.frame] || 1)),
      complete: this.complete,
    };
  }
  reset() {
    this.frame = 0;
    this.elapsed = 0;
    this.complete = false;
  }
}
