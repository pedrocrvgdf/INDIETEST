// Inicialização: escala do canvas, loop principal, ponteiro e carregamento.
(function () {
  const canvas = document.getElementById('game'), ctx = canvas.getContext('2d');
  const W = 1280, H = 720; let last = performance.now(), carregado = false, progresso = 0, escala = 1;

  function ajustar() {
    const vw = window.innerWidth, vh = window.innerHeight, s = Math.min(vw / W, vh / H);
    canvas.style.width = Math.floor(W * s) + 'px'; canvas.style.height = Math.floor(H * s) + 'px';
    // resolução real = tamanho na tela x densidade de pixels (nitidez em telas grandes e retina)
    const dpr = Math.min(3, window.devicePixelRatio || 1); escala = s * dpr;
    canvas.width = Math.round(W * escala); canvas.height = Math.round(H * escala);
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    const retrato = Input.isTouch && vh > vw; document.getElementById('rotate').classList.toggle('hidden', !retrato);
  }
  window.addEventListener('resize', ajustar); window.addEventListener('orientationchange', ajustar); ajustar();

  function paraLogico(e) { const r = canvas.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H }; }
  canvas.addEventListener('pointerdown', e => { Audio8.unlock(); const p = paraLogico(e); if (carregado) UI.pointer(p.x, p.y); });
  Input.bindTouch(document.getElementById('touch'));

  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    ctx.setTransform(escala, 0, 0, escala, 0, 0);
    if (carregado) { UI.update(dt); UI.draw(ctx); }
    else { ctx.fillStyle = '#0b1a3a'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#fff'; ctx.font = '16px "Press Start 2P", monospace'; ctx.textAlign = 'center'; ctx.fillText('CARREGANDO O FINANCEIRO...', W / 2, 340); ctx.fillStyle = '#ffd23f'; ctx.fillRect(W / 2 - 200, 370, 400 * progresso, 16); ctx.strokeStyle = '#fff'; ctx.strokeRect(W / 2 - 200, 370, 400, 16); }
    Input.endFrame(); requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
  const fonte = document.fonts ? document.fonts.load('16px "Press Start 2P"').catch(() => {}) : Promise.resolve();
  Promise.all([loadSprites(p => { progresso = p; }), fonte]).then(() => { carregado = true; UI.go('titulo'); });
})();
