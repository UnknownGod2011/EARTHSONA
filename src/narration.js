const clips = import.meta.glob('./voice/*.mp3', { eager: true, query: '?url', import: 'default' });

export function createNarration(update) {
  const audio = new Audio();
  audio.preload = 'none';
  let source;
  let speaking = false;
  let run = 0;

  function notify() {
    update({ available: Boolean(source), speaking });
  }

  function stop() {
    run++;
    audio.pause();
    if (audio.readyState > 0) audio.currentTime = 0;
    if (!speaking) return;
    speaking = false;
    notify();
  }

  audio.addEventListener('ended', stop);
  audio.addEventListener('error', stop);
  notify();

  return {
    get speaking() { return speaking; },
    setClip(id) {
      const next = clips[`./voice/${id}.mp3`];
      if (next === source) return;
      stop();
      source = next;
      if (source) audio.src = source;
      else audio.removeAttribute('src');
      notify();
    },
    play() {
      if (!source || speaking) return;
      const current = ++run;
      speaking = true;
      notify();
      audio.play().catch(() => {
        if (current === run) stop();
      });
    },
    stop,
  };
}
