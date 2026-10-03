// Entrada: teclado (P1 e P2) e toque (P1 no celular). Expõe estado "segurando" e "acabou de apertar".
window.Input = (function () {
  const ACTIONS = ['left', 'right', 'up', 'down', 'soco', 'chute', 'poder', 'defesa', 'especial', 'pause', 'confirm', 'back'];
  const MAPS = {
    1: { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down', KeyA: 'soco', KeyS: 'chute', KeyD: 'poder', KeyZ: 'defesa', KeyX: 'especial', Enter: 'confirm', Escape: 'back', Space: 'confirm', Backspace: 'back', KeyP: 'pause' },
    2: { KeyJ: 'left', KeyL: 'right', KeyI: 'up', KeyK: 'down', KeyU: 'soco', KeyO: 'chute', KeyP: 'poder', KeyN: 'defesa', KeyM: 'especial' },
  };
  const players = { 1: mk(), 2: mk() };
  function mk() { const o = { held: {}, pressed: {} }; ACTIONS.forEach(a => { o.held[a] = false; o.pressed[a] = false; }); return o; }
  let anyPressed = false, lastKey = null;
  const isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;

  function down(p, a) { if (!players[p].held[a]) players[p].pressed[a] = true; players[p].held[a] = true; anyPressed = true; }
  function up(p, a) { players[p].held[a] = false; }

  window.addEventListener('keydown', e => {
    if (e.repeat) return;
    lastKey = e.code;
    let used = false;
    for (const p of [1, 2]) { const a = MAPS[p][e.code]; if (a && !(p === 2 && e.code === 'KeyP' && false)) { down(p, a); used = true; } }
    if (used) e.preventDefault();
    Audio8.unlock();
  });
  window.addEventListener('keyup', e => { for (const p of [1, 2]) { const a = MAPS[p][e.code]; if (a) up(p, a); } });
  window.addEventListener('blur', () => { for (const p of [1, 2]) ACTIONS.forEach(a => { players[p].held[a] = false; }); });

  // Toque: botões do overlay (#touch) controlam o P1.
  function bindTouch(root) {
    root.querySelectorAll('.tbtn').forEach(btn => {
      const a = btn.dataset.key;
      const on = e => { e.preventDefault(); btn.classList.add('down'); down(1, a); if (a === 'pause') down(1, 'back'); Audio8.unlock(); };
      const off = e => { e.preventDefault(); btn.classList.remove('down'); up(1, a); if (a === 'pause') up(1, 'back'); };
      btn.addEventListener('pointerdown', on); btn.addEventListener('pointerup', off);
      btn.addEventListener('pointercancel', off); btn.addEventListener('pointerleave', off);
    });
  }

  // Chamado uma vez por quadro, após a lógica, para limpar "pressed".
  function endFrame() { for (const p of [1, 2]) ACTIONS.forEach(a => { players[p].pressed[a] = false; }); anyPressed = false; }
  function get(p) { return players[p]; }
  function any() { return anyPressed; }
  // Clique/toque em qualquer ponto conta como "confirmar" nos menus (usado pelo UI com coordenadas).
  return { get, endFrame, any, bindTouch, isTouch, MAPS, ACTIONS, get lastKey() { return lastKey; } };
})();
