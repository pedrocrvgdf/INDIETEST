// Áudio: efeitos sintetizados com WebAudio (sem arquivos) + trilha chiptune + falas opcionais em arquivo.
window.Audio8 = (function () {
  let ctx = null, master = null, musicGain = null, musicTimer = null, musicOn = true, sfxOn = true;
  const voices = {}; // cache: "id/linha" -> HTMLAudioElement | null

  function ensure() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0.5; master.connect(ctx.destination);
    musicGain = ctx.createGain(); musicGain.gain.value = 0.22; musicGain.connect(master);
    return ctx;
  }
  function unlock() { const c = ensure(); if (c && c.state === 'suspended') c.resume(); }

  function osc(type, f0, f1, dur, vol, dest) {
    const c = ensure(); if (!c || !sfxOn) return;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, c.currentTime);
    if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), c.currentTime + dur);
    g.gain.setValueAtTime(vol, c.currentTime); g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
    o.connect(g); g.connect(dest || master); o.start(); o.stop(c.currentTime + dur + 0.02);
  }
  function noise(dur, vol, cutoff) {
    const c = ensure(); if (!c || !sfxOn) return;
    const len = Math.floor(c.sampleRate * dur), buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const s = c.createBufferSource(); s.buffer = buf;
    const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = cutoff || 1200;
    const g = c.createGain(); g.gain.value = vol;
    s.connect(f); f.connect(g); g.connect(master); s.start();
  }

  const sfx = {
    menu: () => osc('square', 880, 1320, 0.07, 0.15),
    confirm: () => { osc('square', 660, 990, 0.08, 0.18); setTimeout(() => osc('square', 990, 1320, 0.12, 0.18), 70); },
    back: () => osc('square', 660, 330, 0.12, 0.15),
    swing: () => noise(0.08, 0.25, 2500),
    punch: () => { noise(0.09, 0.5, 900); osc('sine', 180, 60, 0.12, 0.4); },
    kick: () => { noise(0.14, 0.6, 600); osc('sine', 140, 40, 0.18, 0.5); },
    block: () => { osc('square', 420, 300, 0.06, 0.2); noise(0.04, 0.2, 3000); },
    jump: () => osc('triangle', 300, 700, 0.18, 0.2),
    land: () => noise(0.06, 0.25, 500),
    throw: () => osc('triangle', 500, 900, 0.15, 0.2),
    bottle: () => { osc('square', 1200, 300, 0.12, 0.3); noise(0.1, 0.4, 2000); },
    charge: () => osc('sawtooth', 80, 420, 0.5, 0.25),
    headache: () => { for (let i = 0; i < 5; i++) setTimeout(() => osc('sawtooth', 200 + i * 90, 100, 0.2, 0.25), i * 90); },
    beam: () => { osc('sawtooth', 120, 1600, 0.7, 0.3); noise(0.6, 0.3, 4000); },
    special_hit: () => { noise(0.3, 0.7, 700); osc('sine', 220, 30, 0.45, 0.6); },
    ko: () => { osc('sawtooth', 300, 40, 0.9, 0.5); noise(0.5, 0.5, 400); },
    round: () => { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => osc('square', f, f, 0.16, 0.2), i * 110)); },
    win: () => { [523, 659, 784, 1046, 784, 1046].forEach((f, i) => setTimeout(() => osc('square', f, f, 0.18, 0.22), i * 130)); },
    tick: () => osc('square', 1500, 1500, 0.04, 0.12),
    buzzer: () => osc('square', 220, 180, 0.6, 0.3),
    aura: () => osc('sawtooth', 60, 90, 0.4, 0.15),
  };
  function play(name) { try { if (sfx[name]) sfx[name](); } catch (e) { /* áudio indisponível */ } }

  // Trilha: sequência curta em loop (baixo + melodia), estilo arcade 16-bit.
  const SONGS = {
    menu: { bpm: 128, bass: [110, 110, 146.8, 146.8, 130.8, 130.8, 98, 98], lead: [440, 0, 523, 587, 659, 0, 587, 523, 440, 0, 392, 440, 523, 0, 0, 0] },
    fight: { bpm: 150, bass: [82.4, 82.4, 82.4, 98, 110, 110, 110, 98], lead: [330, 330, 392, 440, 494, 0, 440, 392, 330, 0, 294, 330, 392, 440, 0, 0] },
    boss: { bpm: 140, bass: [65.4, 65.4, 69.3, 69.3, 65.4, 65.4, 61.7, 58.3], lead: [262, 0, 277, 262, 247, 0, 233, 0, 262, 262, 277, 0, 311, 0, 294, 0] },
  };
  let current = null;
  function music(name) {
    if (current === name) return;
    stopMusic(); current = name;
    const c = ensure(); if (!c || !musicOn || !SONGS[name]) return;
    const s = SONGS[name], step = 60 / s.bpm / 2; let i = 0, t = c.currentTime + 0.05;
    function schedule() {
      while (t < c.currentTime + 0.4) {
        const b = s.bass[i % s.bass.length], l = s.lead[i % s.lead.length];
        if (b) tone('triangle', b, t, step * 0.9, 0.5);
        if (l) tone('square', l, t, step * 0.6, 0.25);
        if (i % 4 === 0) kick(t); if (i % 4 === 2) hat(t);
        t += step; i++;
      }
    }
    function tone(type, f, at, dur, vol) {
      const o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.value = f;
      g.gain.setValueAtTime(vol, at); g.gain.exponentialRampToValueAtTime(0.001, at + dur);
      o.connect(g); g.connect(musicGain); o.start(at); o.stop(at + dur + 0.02);
    }
    function kick(at) { const o = c.createOscillator(), g = c.createGain(); o.frequency.setValueAtTime(150, at); o.frequency.exponentialRampToValueAtTime(40, at + 0.12); g.gain.setValueAtTime(0.8, at); g.gain.exponentialRampToValueAtTime(0.001, at + 0.14); o.connect(g); g.connect(musicGain); o.start(at); o.stop(at + 0.16); }
    function hat(at) { const o = c.createOscillator(), g = c.createGain(); o.type = 'square'; o.frequency.value = 6000; g.gain.setValueAtTime(0.06, at); g.gain.exponentialRampToValueAtTime(0.001, at + 0.03); o.connect(g); g.connect(musicGain); o.start(at); o.stop(at + 0.04); }
    schedule(); musicTimer = setInterval(schedule, 200);
  }
  function stopMusic() { if (musicTimer) clearInterval(musicTimer); musicTimer = null; current = null; }
  function toggleMusic() { musicOn = !musicOn; if (!musicOn) { const n = current; stopMusic(); current = n; } else { const n = current; current = null; music(n || 'menu'); } return musicOn; }
  function toggleSfx() { sfxOn = !sfxOn; return sfxOn; }

  // Falas gravadas (opcional): assets/voices/<id>/<linha>.mp3 — se não existir, segue só com o balão de texto.
  function voice(id, line) {
    const key = id + '/' + line;
    if (!(key in voices)) {
      const a = new window.Audio('assets/voices/' + key + '.mp3');
      a.addEventListener('error', () => { voices[key] = null; });
      voices[key] = a;
    }
    const a = voices[key];
    if (a) { try { a.currentTime = 0; a.volume = 0.9; a.play().catch(() => {}); } catch (e) { /* sem arquivo */ } }
  }

  return { unlock, play, music, stopMusic, toggleMusic, toggleSfx, voice, get musicOn() { return musicOn; }, get sfxOn() { return sfxOn; } };
})();
