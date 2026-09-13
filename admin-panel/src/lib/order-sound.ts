// Tono local: no descarga de audio ni espera por otra consulta.
export function playOrderTone(context: AudioContext) {
  if (context.state !== 'running') return;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const now = context.currentTime;
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.frequency.setValueAtTime(660, now);
  oscillator.frequency.setValueAtTime(880, now + .14);
  gain.gain.setValueAtTime(.001, now);
  gain.gain.exponentialRampToValueAtTime(.14, now + .005);
  gain.gain.exponentialRampToValueAtTime(.001, now + .45);
  oscillator.start(now);
  oscillator.stop(now + .46);
  oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
}
