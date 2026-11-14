export function createNarration(update) {
  const speech = window.speechSynthesis;
  const Utterance = window.SpeechSynthesisUtterance;
  let utterance = null;

  function voice() {
    if (!speech || typeof Utterance !== 'function') return undefined;
    const english = speech.getVoices().filter(({ lang, localService }) => localService && /^en(?:[-_]|$)/i.test(lang));
    return english.find(({ default: preferred }) => preferred) ?? english[0];
  }

  function notify() {
    update({ available: Boolean(voice()), speaking: Boolean(utterance) });
  }

  function stop() {
    if (!utterance) return;
    utterance = null;
    speech.cancel();
    notify();
  }

  function speak(text) {
    const selected = voice();
    if (!selected || !text.trim()) return false;
    stop();
    const current = new Utterance(text);
    current.voice = selected;
    current.lang = selected.lang;
    current.rate = 0.93;
    current.onend = current.onerror = () => {
      if (utterance !== current) return;
      utterance = null;
      notify();
    };
    utterance = current;
    notify();
    speech.speak(current);
    return true;
  }

  speech?.addEventListener('voiceschanged', notify);
  notify();

  return {
    speak,
    stop,
    get available() { return Boolean(voice()); },
    get speaking() { return Boolean(utterance); },
    destroy() {
      stop();
      speech?.removeEventListener('voiceschanged', notify);
    },
  };
}
