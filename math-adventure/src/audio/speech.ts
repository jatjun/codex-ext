export class Narrator {
  private utterance: SpeechSynthesisUtterance | null = null;
  private finish: (() => void) | null = null;
  private watchdog: ReturnType<typeof setTimeout> | undefined;
  private remaining = 0;
  private started = 0;
  private text = "";
  private enabled = true;
  private paused = false;
  private ticket = 0;
  supported = typeof window !== "undefined" && "speechSynthesis" in window;
  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (!enabled) this.cancel();
  }
  private arm() {
    this.started = performance.now();
    this.watchdog = setTimeout(() => {
      this.cancel();
    }, this.remaining);
  }
  speak(text: string): Promise<void> {
    this.cancel();
    this.text = text;
    if (!text || !this.enabled || !this.supported) return Promise.resolve();
    const ticket = ++this.ticket;
    return new Promise((resolve) => {
      this.finish = resolve;
      this.utterance = new SpeechSynthesisUtterance(text);
      this.utterance.lang = "zh-CN";
      this.utterance.rate = 0.88;
      const voice = speechSynthesis
        .getVoices()
        .find((v) => v.lang.startsWith("zh"));
      if (voice) this.utterance.voice = voice;
      const done = () => {
        if (ticket !== this.ticket) return;
        clearTimeout(this.watchdog);
        this.utterance = null;
        this.finish = null;
        resolve();
      };
      this.utterance.onend = done;
      this.utterance.onerror = done;
      // A bounded step barrier; if a browser never delivers speech events, cancel speech before releasing it.
      this.remaining = Math.max(6000, text.length * 650);
      this.paused = false;
      this.arm();
      speechSynthesis.speak(this.utterance);
    });
  }
  pause() {
    if (!this.utterance || this.paused) return;
    this.paused = true;
    clearTimeout(this.watchdog);
    this.remaining = Math.max(
      1,
      this.remaining - (performance.now() - this.started),
    );
    speechSynthesis.pause();
  }
  resume() {
    if (!this.utterance || !this.paused) return;
    this.paused = false;
    speechSynthesis.resume();
    this.arm();
  }
  cancel() {
    ++this.ticket;
    clearTimeout(this.watchdog);
    if (this.supported) speechSynthesis.cancel();
    this.utterance = null;
    this.paused = false;
    const finish = this.finish;
    this.finish = null;
    finish?.();
  }
  replay() {
    return this.speak(this.text);
  }
}
