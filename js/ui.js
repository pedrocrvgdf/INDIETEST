// Telas: título, menu, seleção de personagem/cenário, controles, resultado. Tudo desenhado no canvas.
window.UI = (function () {
  const W = 1280, H = 720; let atual = null, nome = '', t = 0, botoes = [];
  const F = (px) => px + 'px "Press Start 2P", monospace';
  const sessao = { modo: 'duelo', p1: 'ludmilla', p2: 'pedro', stage: 'financeiro', arcade: null, melhorRelogio: Number(localStorage.getItem('cbv_melhor_relogio') || 0) };

  function texto(ctx, s, x, y, px, cor, align) { ctx.font = F(px); ctx.fillStyle = cor || '#fff'; ctx.textAlign = align || 'center'; ctx.textBaseline = 'alphabetic'; ctx.fillText(s, x, y); }
  function contorno(ctx, s, x, y, px, cor, borda) { ctx.font = F(px); ctx.textAlign = 'center'; ctx.lineWidth = px / 5; ctx.strokeStyle = borda || '#0b1a3a'; ctx.strokeText(s, x, y); ctx.fillStyle = cor; ctx.fillText(s, x, y); }
  function botao(ctx, id, x, y, w, h, label, sel, desab) {
    ctx.fillStyle = desab ? 'rgba(255,255,255,.08)' : sel ? '#ff3d8f' : 'rgba(255,255,255,.14)'; roundRect(ctx, x, y, w, h, 10); ctx.fill();
    ctx.strokeStyle = sel ? '#fff' : 'rgba(255,255,255,.5)'; ctx.lineWidth = 3; ctx.stroke();
    texto(ctx, label, x + w / 2, y + h / 2 + 6, 14, desab ? 'rgba(255,255,255,.35)' : '#fff');
    botoes.push({ id, x, y, w, h, desab });
  }
  function fundo(ctx) {
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0b1a3a'); g.addColorStop(1, '#1f5fbf'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(255,255,255,.05)'; for (let i = 0; i < 12; i++) { const x = ((t * 40 + i * 140) % (W + 200)) - 100; ctx.fillRect(x, 0, 2, H); }
    ctx.fillStyle = 'rgba(0,0,0,.25)'; for (let y = 0; y < H; y += 4) ctx.fillRect(0, y, W, 1);
  }
  function retrato(ctx, id, x, y, w, h, flip) { const img = SPRITES[id] && SPRITES[id].retrato; if (!img) return; const s = Math.min(w / img.width, h / img.height); ctx.save(); ctx.translate(x + w / 2, y + h / 2); if (flip) ctx.scale(-1, 1); ctx.drawImage(img, -img.width * s / 2, -img.height * s / 2, img.width * s, img.height * s); ctx.restore(); }
  function sprite(ctx, id, pose, x, y, alt, flip) { const img = SPRITES[id] && SPRITES[id][pose]; if (!img) return; const s = alt / img.height; ctx.save(); ctx.translate(x, y); if (flip) ctx.scale(-1, 1); ctx.drawImage(img, -img.width * s / 2, -img.height * s, img.width * s, img.height * s); ctx.restore(); }
  function botaoVoltar(ctx) { botao(ctx, 'voltar', 24, H - 64, 180, 44, '< VOLTAR', false); }

  // ---------- TÍTULO ----------
  const titulo = {
    enter() { Audio8.music('menu'); },
    update(dt) { const i = Input.get(1); if (i.pressed.confirm || i.pressed.soco) { Audio8.play('confirm'); go('menu'); } },
    draw(ctx) {
      fundo(ctx);
      sprite(ctx, 'ludmilla', 'parado', 230, 640, 480, false); sprite(ctx, 'pedro', 'parado', 1050, 640, 480, true);
      contorno(ctx, 'CBV', W / 2, 220, 72, '#ffd23f'); contorno(ctx, 'FIGHTER', W / 2, 310, 72, '#ff3d8f');
      texto(ctx, 'FECHAMENTO EDITION', W / 2, 360, 16, '#fff');
      texto(ctx, 'Hospital de Olhos · Financeiro & Contábil', W / 2, 395, 10, '#cfd8dc');
      if (Math.floor(t * 2) % 2) texto(ctx, Input.isTouch ? 'TOQUE PARA COMEÇAR' : 'PRESSIONE ENTER', W / 2, 520, 16, '#fff');
      texto(ctx, 'Protótipo v0.1 · uso interno', W / 2, H - 24, 8, 'rgba(255,255,255,.6)');
      botoes.push({ id: 'start', x: 0, y: 0, w: W, h: H });
    },
    pointer(id) { if (id === 'start') { Audio8.play('confirm'); go('menu'); } },
  };
  // ---------- MENU ----------
  const ITENS = [['arcade', 'ARCADE'], ['duelo', 'DUELO LIVRE'], ['versus', 'VERSUS 2P'], ['relogio', 'CONTRA O RELÓGIO'], ['controles', 'CONTROLES'], ['som', 'SOM']];
  const menu = {
    idx: 0,
    enter() { Audio8.music('menu'); },
    update() { const i = Input.get(1); if (i.pressed.down) { this.idx = (this.idx + 1) % ITENS.length; Audio8.play('menu'); } if (i.pressed.up) { this.idx = (this.idx + ITENS.length - 1) % ITENS.length; Audio8.play('menu'); } if (i.pressed.confirm) this.escolher(ITENS[this.idx][0]); if (i.pressed.back) go('titulo'); },
    escolher(id) {
      if (id === 'som') { const on = Audio8.toggleMusic(); Audio8.toggleSfx(); Audio8.play('confirm'); return; }
      if (id === 'controles') { Audio8.play('confirm'); go('controles'); return; }
      if (id === 'versus' && Input.isTouch) { Audio8.play('back'); return; }
      Audio8.play('confirm'); sessao.modo = id; sessao.arcade = null; go('selecao');
    },
    draw(ctx) {
      fundo(ctx); contorno(ctx, 'CBV FIGHTER', W / 2, 90, 36, '#ffd23f');
      ITENS.forEach(([id, label], i) => { const l = id === 'som' ? 'SOM: ' + (Audio8.musicOn ? 'LIGADO' : 'DESLIGADO') : label; botao(ctx, id, W / 2 - 240, 150 + i * 66, 480, 52, l, i === this.idx, id === 'versus' && Input.isTouch); });
      const dica = { arcade: 'Enfrente o setor inteiro até chegar no Convênio.', duelo: 'Escolha lutador, oponente e cenário.', versus: Input.isTouch ? 'Só no PC: dois jogadores no mesmo teclado.' : 'Dois jogadores no mesmo teclado.', relogio: 'Fechamento do mês: quite o máximo de pendências antes do prazo.', controles: 'Veja as teclas.', som: 'Liga ou desliga música e efeitos.' }[ITENS[this.idx][0]];
      texto(ctx, dica, W / 2, 580, 10, '#cfd8dc');
      sprite(ctx, 'pedro', 'soco', 180, 690, 380, false); sprite(ctx, 'ludmilla', 'chute', 1100, 690, 380, true);
    },
    pointer(id) { const i = ITENS.findIndex(x => x[0] === id); if (i >= 0) { this.idx = i; this.escolher(id); } },
  };
  // ---------- CONTROLES ----------
  const controles = {
    update() { const i = Input.get(1); if (i.pressed.back || i.pressed.confirm) { Audio8.play('back'); go('menu'); } },
    draw(ctx) {
      fundo(ctx); contorno(ctx, 'CONTROLES', W / 2, 80, 30, '#ffd23f');
      const linhas = Input.isTouch ? [['◀ ▶', 'andar'], ['▲', 'pular'], ['SOCO', 'golpe rápido'], ['CHUTE', 'golpe forte'], ['PODER', 'golpe especial do personagem'], ['DEFESA', 'segure para bloquear'], ['FECHAMENTO', 'golpe final (barra cheia)']]
        : [['SETAS', 'andar / pular'], ['A', 'soco'], ['S', 'chute'], ['D', 'poder (Garrafada / Ultrapassagem)'], ['Z', 'defesa (segure)'], ['X', 'FECHAMENTO: golpe final, só com a barra cheia'], ['ESC', 'pausa'], ['', ''], ['P2', 'I J K L andar · U soco · O chute · P poder · N defesa · M fechamento']];
      linhas.forEach(([k, v], i) => { texto(ctx, k, 300, 160 + i * 44, 14, '#ff3d8f', 'right'); texto(ctx, v, 340, 160 + i * 44, 11, '#fff', 'left'); });
      texto(ctx, 'A barra de FECHAMENTO enche batendo e apanhando.', W / 2, 600, 10, '#cfd8dc');
      botaoVoltar(ctx);
    },
    pointer(id) { if (id === 'voltar') { Audio8.play('back'); go('menu'); } },
  };
  // ---------- SELEÇÃO ----------
  const selecao = {
    enter() { this.etapa = 1; this.c1 = ROSTER.indexOf(sessao.p1); this.c2 = ROSTER.indexOf(sessao.p2); if (this.c1 < 0) this.c1 = 0; if (this.c2 < 0) this.c2 = 1 % ROSTER.length; this.t = 0; },
    precisaP2() { return sessao.modo === 'duelo' || sessao.modo === 'versus'; },
    update(dt) {
      this.t += dt; const i1 = Input.get(1), i2 = Input.get(2);
      const cur = this.etapa === 1 ? 'c1' : 'c2', ins = this.etapa === 2 && sessao.modo === 'versus' ? [i1, i2] : [i1];
      for (const i of ins) {
        if (i.pressed.right) { this[cur] = (this[cur] + 1) % ROSTER.length; Audio8.play('menu'); }
        if (i.pressed.left) { this[cur] = (this[cur] + ROSTER.length - 1) % ROSTER.length; Audio8.play('menu'); }
        if (i.pressed.confirm || i.pressed.soco) this.confirmar();
      }
      if (i1.pressed.back) { if (this.etapa === 2) { this.etapa = 1; Audio8.play('back'); } else { Audio8.play('back'); go('menu'); } }
    },
    confirmar() {
      Audio8.play('confirm');
      if (this.etapa === 1) { sessao.p1 = ROSTER[this.c1]; if (this.precisaP2()) { this.etapa = 2; return; } }
      else sessao.p2 = ROSTER[this.c2];
      if (!this.precisaP2()) { const outros = ROSTER.filter(id => id !== sessao.p1); sessao.p2 = outros[0] || sessao.p1; }
      if (sessao.modo === 'arcade') { sessao.arcade = { fila: ROSTER.filter(id => id !== sessao.p1), idx: 0, continues: 0 }; iniciarArcade(); }
      else if (sessao.modo === 'relogio') { sessao.stage = 'reuniao'; iniciarPartida(); }
      else go('cenario');
    },
    draw(ctx) {
      fundo(ctx); contorno(ctx, this.etapa === 1 ? 'ESCOLHA SEU LUTADOR' : (sessao.modo === 'versus' ? 'JOGADOR 2: ESCOLHA' : 'ESCOLHA O OPONENTE'), W / 2, 70, 22, '#ffd23f');
      const n = ROSTER.length, cw = 150, gap = 20, x0 = W / 2 - (n * cw + (n - 1) * gap) / 2;
      ROSTER.forEach((id, i) => {
        const x = x0 + i * (cw + gap), y = 110, sel1 = this.c1 === i, sel2 = this.etapa === 2 && this.c2 === i;
        ctx.fillStyle = '#0b1a3a'; roundRect(ctx, x, y, cw, 150, 8); ctx.fill(); retrato(ctx, id, x + 8, y + 8, cw - 16, 134);
        ctx.lineWidth = 5; ctx.strokeStyle = sel2 ? '#2f7fd6' : sel1 ? '#ff3d8f' : 'rgba(255,255,255,.3)'; roundRect(ctx, x, y, cw, 150, 8); ctx.stroke();
        if (sel1) texto(ctx, this.etapa === 1 ? 'P1' : (this.c2 === i && this.etapa === 2 ? 'P1 / P2' : 'P1'), x + cw / 2, y + 150 + 22, 10, '#ff3d8f');
        else if (sel2) texto(ctx, sessao.modo === 'versus' ? 'P2' : 'CPU', x + cw / 2, y + 150 + 22, 10, '#2f7fd6');
        botoes.push({ id: 'char:' + i, x, y, w: cw, h: 150 });
      });
      // painel do personagem em foco
      const foco = CHARACTERS[ROSTER[this.etapa === 1 ? this.c1 : this.c2]];
      sprite(ctx, foco.id, 'parado', 260, 690, 400, false);
      const px = 480, py = 330; ctx.fillStyle = 'rgba(0,0,0,.45)'; roundRect(ctx, px, py - 40, 760, 330, 12); ctx.fill();
      texto(ctx, foco.nome.toUpperCase(), px + 20, py, 22, foco.cor, 'left'); texto(ctx, foco.cargo + ' · ' + foco.setor, px + 20, py + 28, 9, '#cfd8dc', 'left');
      texto(ctx, foco.bio, px + 20, py + 56, 9, '#fff', 'left');
      const g = foco.golpes; const lista = [['SOCO (A)', g.soco.nome], ['CHUTE (S)', g.chute.nome], ['PODER (D)', g.poder.nome + ' — ' + g.poder.descricao], ['DEFESA (Z)', foco.bloqueio || 'Defesa'], ['FECHAMENTO (X)', g.especial.nome + ' — ' + g.especial.descricao]];
      lista.forEach(([k, v], i) => { texto(ctx, k, px + 20, py + 100 + i * 36, 9, '#ffd23f', 'left'); texto(ctx, v.length > 70 ? v.slice(0, 68) + '…' : v, px + 20, py + 118 + i * 36, 8, '#fff', 'left'); });
      texto(ctx, Input.isTouch ? 'Toque no retrato e depois em CONFIRMAR' : 'SETAS escolher · ENTER confirmar · ESC voltar', W / 2, H - 20, 9, 'rgba(255,255,255,.7)');
      if (Input.isTouch) botao(ctx, 'confirmar', W - 230, H - 64, 200, 44, 'CONFIRMAR', true);
      botaoVoltar(ctx);
    },
    pointer(id) {
      if (id === 'voltar') { if (this.etapa === 2) this.etapa = 1; else go('menu'); Audio8.play('back'); return; }
      if (id === 'confirmar') { this.confirmar(); return; }
      if (id.startsWith('char:')) { const i = Number(id.slice(5)); const cur = this.etapa === 1 ? 'c1' : 'c2'; if (this[cur] === i && !Input.isTouch) this.confirmar(); else { this[cur] = i; Audio8.play('menu'); if (!Input.isTouch) this.confirmar(); } }
    },
  };
  // ---------- CENÁRIO ----------
  const cenario = {
    enter() { this.idx = Math.max(0, STAGE_ORDER.indexOf(sessao.stage)); },
    update() { const i = Input.get(1); if (i.pressed.right) { this.idx = (this.idx + 1) % STAGE_ORDER.length; Audio8.play('menu'); } if (i.pressed.left) { this.idx = (this.idx + STAGE_ORDER.length - 1) % STAGE_ORDER.length; Audio8.play('menu'); } if (i.pressed.confirm || i.pressed.soco) this.confirmar(); if (i.pressed.back) { Audio8.play('back'); go('selecao'); } },
    confirmar() { sessao.stage = STAGE_ORDER[this.idx]; Audio8.play('confirm'); iniciarPartida(); },
    draw(ctx) {
      fundo(ctx); contorno(ctx, 'ESCOLHA O CENÁRIO', W / 2, 70, 22, '#ffd23f');
      const n = STAGE_ORDER.length, pw = 440, ph = 248, gap = 40, x0 = W / 2 - (n * pw + (n - 1) * gap) / 2;
      STAGE_ORDER.forEach((id, i) => {
        const s = STAGES[id], x = x0 + i * (pw + gap), y = 130;
        ctx.save(); ctx.beginPath(); ctx.rect(x, y, pw, ph); ctx.clip(); ctx.translate(x, y); ctx.scale(pw / W, ph / H); s.draw(ctx, 200, t, W, H); ctx.restore();
        ctx.lineWidth = 5; ctx.strokeStyle = i === this.idx ? '#ff3d8f' : 'rgba(255,255,255,.3)'; ctx.strokeRect(x, y, pw, ph);
        texto(ctx, s.nome.toUpperCase(), x + pw / 2, y + ph + 34, 12, i === this.idx ? '#ffd23f' : '#fff'); texto(ctx, s.sub, x + pw / 2, y + ph + 56, 8, '#cfd8dc');
        botoes.push({ id: 'stage:' + i, x, y, w: pw, h: ph });
      });
      texto(ctx, 'Cenários provisórios: serão trocados pelas fotos das salas reais.', W / 2, 520, 9, 'rgba(255,255,255,.7)');
      if (Input.isTouch) botao(ctx, 'confirmar', W - 230, H - 64, 200, 44, 'LUTAR!', true); else texto(ctx, 'ENTER para lutar', W / 2, 560, 10, '#fff');
      botaoVoltar(ctx);
    },
    pointer(id) { if (id === 'voltar') { Audio8.play('back'); go('selecao'); } else if (id === 'confirmar') this.confirmar(); else if (id.startsWith('stage:')) { const i = Number(id.slice(6)); if (this.idx === i && !Input.isTouch) this.confirmar(); else { this.idx = i; Audio8.play('menu'); } } },
  };
  // ---------- PARTIDA ----------
  function iniciarArcade() {
    const a = sessao.arcade; sessao.p2 = a.fila[a.idx]; sessao.stage = STAGE_ORDER[a.idx % STAGE_ORDER.length];
    iniciarPartida({ dificuldade: 0.35 + a.idx * 0.2, etapa: (a.idx + 1) + '/' + (a.fila.length + 1) });
  }
  function iniciarPartida(extra) {
    const cfg = Object.assign({ p1: sessao.p1, p2: sessao.p2, stage: sessao.stage, modo: sessao.modo, p2Controle: sessao.modo === 'versus' ? 'p2' : 'cpu', dificuldade: 0.5, vitorias: 2, tempoRound: 60, relogio: 180, onFim: fimPartida }, extra || {});
    partida.match = new Match(cfg); window.__match = partida.match; go('partida');
  }
  function fimPartida(r) {
    Audio8.stopMusic();
    if (r.resultado === 'sair') { go('menu'); return; }
    if (sessao.modo === 'relogio') { if (r.quitadas > sessao.melhorRelogio) { sessao.melhorRelogio = r.quitadas; localStorage.setItem('cbv_melhor_relogio', String(r.quitadas)); } resultado.set({ titulo: 'FECHAMENTO ENCERRADO', linhas: ['Pendências quitadas: ' + r.quitadas, 'Recorde: ' + sessao.melhorRelogio, r.quitadas >= 3 ? 'O Convênio ficou sabendo. Cuidado.' : 'Amanhã tem mais.'], botoes: [['denovo', 'DE NOVO'], ['menu', 'MENU']] }); go('resultado'); return; }
    if (sessao.modo === 'arcade') {
      const a = sessao.arcade;
      if (r.resultado === 'p1') { a.idx++; if (a.idx >= a.fila.length) { go('chefao'); return; } resultado.set({ titulo: 'PENDÊNCIA RESOLVIDA', linhas: ['Próximo: ' + CHARACTERS[a.fila[a.idx]].nome, 'Etapa ' + (a.idx + 1) + '/' + (a.fila.length + 1)], botoes: [['proximo', 'CONTINUAR'], ['menu', 'MENU']] }); }
      else { a.continues++; resultado.set({ titulo: 'GAME OVER', linhas: ['O prazo venceu e você também.', 'Continues usados: ' + a.continues], botoes: [['proximo', 'TENTAR DE NOVO'], ['menu', 'MENU']] }); }
      go('resultado'); return;
    }
    resultado.set({ titulo: r.vencedor.char.nome.toUpperCase() + ' VENCE', linhas: [r.vencedor.char.falas.vitoria, sessao.modo === 'versus' ? 'Revanche?' : 'Mais uma?'], botoes: [['denovo', 'REVANCHE'], ['selecao', 'TROCAR LUTADOR'], ['menu', 'MENU']] }); go('resultado');
  }
  const partida = {
    match: null,
    enter() { document.getElementById('touch').classList.toggle('hidden', !Input.isTouch); },
    exit() { document.getElementById('touch').classList.add('hidden'); },
    update(dt) { this.match.update(dt); },
    draw(ctx) { this.match.draw(ctx); },
    pointerXY(x, y) { this.match.pointer(x, y); },
  };
  // ---------- RESULTADO ----------
  const resultado = {
    dados: null, idx: 0,
    set(d) { this.dados = d; this.idx = 0; },
    enter() { Audio8.music('menu'); },
    update() { const i = Input.get(1), n = this.dados.botoes.length; if (i.pressed.down || i.pressed.right) { this.idx = (this.idx + 1) % n; Audio8.play('menu'); } if (i.pressed.up || i.pressed.left) { this.idx = (this.idx + n - 1) % n; Audio8.play('menu'); } if (i.pressed.confirm) this.escolher(this.dados.botoes[this.idx][0]); if (i.pressed.back) go('menu'); },
    escolher(id) { Audio8.play('confirm'); if (id === 'menu') go('menu'); else if (id === 'selecao') go('selecao'); else if (id === 'proximo') iniciarArcade(); else if (id === 'denovo') iniciarPartida(); },
    draw(ctx) {
      fundo(ctx); const d = this.dados; contorno(ctx, d.titulo, W / 2, 150, 30, '#ffd23f');
      d.linhas.forEach((l, i) => texto(ctx, l, W / 2, 230 + i * 36, 12, '#fff'));
      d.botoes.forEach(([id, label], i) => botao(ctx, id, W / 2 - 200, 400 + i * 66, 400, 52, label, i === this.idx));
      sprite(ctx, sessao.p1, 'parado', 180, 690, 360, false); sprite(ctx, sessao.p2, 'parado', 1100, 690, 360, true);
    },
    pointer(id) { if (this.dados.botoes.some(b => b[0] === id)) this.escolher(id); },
  };
  // ---------- CHEFÃO (placeholder) ----------
  const chefao = {
    enter() { Audio8.music('boss'); this.t = 0; },
    update(dt) { this.t += dt; const i = Input.get(1); if (this.t > 1.5 && (i.pressed.confirm || i.pressed.back)) { Audio8.play('confirm'); go('menu'); } },
    draw(ctx) {
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
      contorno(ctx, 'VOCÊ CHEGOU AO CHEFÃO', W / 2, 120, 24, '#ff5252');
      contorno(ctx, BOSS.nome, W / 2, 220, 56, '#ffd23f');
      texto(ctx, 'Sete logos se juntando num só robô. Em breve.', W / 2, 280, 12, '#fff');
      BOSS.partes.forEach((p, i) => { const a = i / BOSS.partes.length * Math.PI * 2 + this.t, x = W / 2 + Math.cos(a) * 320, y = 440 + Math.sin(a) * 110; ctx.fillStyle = 'rgba(255,255,255,.12)'; roundRect(ctx, x - 90, y - 22, 180, 44, 8); ctx.fill(); texto(ctx, p.toUpperCase(), x, y + 5, 9, '#fff'); });
      texto(ctx, 'Golpes previstos: Glosa em Massa · Prazo de 90 Dias · Negativa de Autorização · Auditoria Surpresa', W / 2, 620, 8, '#cfd8dc');
      if (this.t > 1.5 && Math.floor(this.t * 2) % 2) texto(ctx, Input.isTouch ? 'TOQUE PARA VOLTAR' : 'ENTER PARA VOLTAR', W / 2, 670, 12, '#fff');
      botoes.push({ id: 'voltar', x: 0, y: 0, w: W, h: H });
    },
    pointer(id) { if (this.t > 1.5) { Audio8.play('confirm'); go('menu'); } },
  };

  const telas = { titulo, menu, controles, selecao, cenario, partida, resultado, chefao };
  function go(n) { if (atual && atual.exit) atual.exit(); nome = n; atual = telas[n]; botoes = []; if (atual.enter) atual.enter(); }
  function update(dt) { t += dt; if (atual) atual.update(dt); }
  function draw(ctx) { botoes = []; if (atual) atual.draw(ctx); }
  function pointer(x, y) {
    if (atual && atual.pointerXY) atual.pointerXY(x, y);
    if (!atual || !atual.pointer) return;
    for (let i = botoes.length - 1; i >= 0; i--) { const b = botoes[i]; if (!b.desab && x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) { atual.pointer(b.id); return; } }
  }
  return { go, update, draw, pointer, sessao, get tela() { return nome; } };
})();
