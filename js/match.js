// Partida: rounds, HUD, câmera, projéteis, IA e modos (arcade, duelo, versus, contra o relógio).
const W = 1280, H = 720;

class Match {
  // cfg: { p1, p2, stage, p2Controle:'cpu'|'p2', dificuldade:0..1, modo:'duelo'|'arcade'|'versus'|'relogio', vitorias:2, tempoRound:60, relogio:180, onFim(resultado) }
  constructor(cfg) {
    this.cfg = cfg; this.stage = STAGES[cfg.stage]; this.t = 0; this.cam = 0; this.tremor = { t: 0, amp: 0 };
    this.f1 = new Fighter(cfg.p1, 1, 'p1'); this.f2 = new Fighter(cfg.p2, -1, cfg.p2Controle || 'cpu');
    this.projeteis = []; this.round = 0; this.msgs = []; this.pausado = false; this.pauseIdx = 0; this.fim = false;
    this.relogio = cfg.modo === 'relogio' ? cfg.relogio : null; this.quitadas = 0; this.oponenteIdx = 0;
    this.ia = { timer: 0, acao: null, bloqueando: 0 };
    this.novoRound();
    Audio8.music(this.stage.musica);
  }
  novoRound() {
    this.round++; const L = this.stage.largura;
    this.f1.reset(L / 2 - 260, this.stage.chao, 1); this.f2.reset(L / 2 + 260, this.stage.chao, -1);
    this.projeteis = []; this.tempo = this.cfg.tempoRound; this.fase = 'intro'; this.faseT = 0; this.vencedor = null;
    const e1 = (this.f1.char.falas.entrada_vs || {})[this.f2.id] || this.f1.char.falas.entrada;
    const e2 = (this.f2.char.falas.entrada_vs || {})[this.f1.id] || this.f2.char.falas.entrada;
    if (this.round === 1 || this.cfg.modo === 'relogio') { const rel = this.cfg.modo === 'relogio' && this.quitadas > 0; this.f1.fala = { texto: e1, t: rel ? 1.6 : 2.6 }; this.f2.fala = { texto: e2, t: rel ? 1.6 : 2.6 }; Audio8.voice(this.f1.id, 'entrada'); setTimeout(() => Audio8.voice(this.f2.id, 'entrada'), rel ? 700 : 1300); this.faseDur = rel ? 1.7 : 2.8; }
    else this.faseDur = 0.6;
  }
  tremer(t, amp) { this.tremor = { t, amp }; }
  lancarProjetil(dono, g) {
    const alvoY = dono.y - g.alt;
    if (g.tipo === 'enxaqueca') this.projeteis.push({ dono, x: dono.x + dono.face * 60, y: alvoY, vx: dono.face * g.vel, dmg: g.dmg, kb: g.kb, tipo: 'enxaqueca', w: 70, h: 70, emoji: '🧠', vida: 3, rot: 0 });
    else this.projeteis.push({ dono, x: dono.x + dono.face * 70, y: alvoY, vx: dono.face * g.vel, dmg: g.dmg, kb: g.kb, tipo: 'garrafa', w: 40, h: 60, img: dono.img.projetil, vida: 2.2, rot: 0 });
  }
  // ---------- IA ----------
  entradaIA(me, op, dt) {
    const held = {}, pressed = {}; const d = this.cfg.dificuldade == null ? 0.5 : this.cfg.dificuldade;
    const dist = Math.abs(op.x - me.x); const ia = this.ia; ia.timer -= dt;
    const projVindo = this.projeteis.find(p => p.dono !== me && Math.sign(p.vx) === Math.sign(me.x - p.x) && Math.abs(p.x - me.x) < 420);
    const opAtacando = (op.state === 'attack' || op.state === 'dash' || op.state === 'special') && dist < 420;
    if (ia.timer <= 0) {
      ia.timer = 0.32 - d * 0.22 + Math.random() * 0.2; const r = Math.random();
      if (me.enxaqueca > 0) ia.timer += 0.3;
      if (me.meter >= 100 && r < 0.35 + d * 0.4 && dist < 900 && op.noChao) ia.acao = 'especial';
      else if (projVindo && r < 0.5 + d * 0.4) ia.acao = Math.random() < 0.5 ? 'pular' : 'defender';
      else if (opAtacando && r < 0.25 + d * 0.5) ia.acao = 'defender';
      else if (dist > 520) ia.acao = (r < 0.25 + d * 0.2 && me.cooldown <= 0) ? 'poder' : (r < 0.9 ? 'aproximar' : 'pular');
      else if (dist > 250) ia.acao = r < 0.75 ? 'aproximar' : (r < 0.9 ? 'poder' : 'esperar');
      else ia.acao = r < 0.3 + d * 0.25 ? 'soco' : r < 0.55 + d * 0.3 ? 'chute' : r < 0.75 ? 'recuar' : 'esperar';
      ia.novo = true;
    }
    const paraOp = op.x > me.x ? 'right' : 'left', deOp = op.x > me.x ? 'left' : 'right';
    switch (ia.acao) {
      case 'aproximar': held[paraOp] = true; break;
      case 'recuar': held[deOp] = true; break;
      case 'defender': held.defesa = true; break;
      case 'pular': if (ia.novo) pressed.up = true; held[paraOp] = true; break;
      case 'soco': case 'chute': case 'poder': case 'especial': if (ia.novo) pressed[ia.acao] = true; break;
    }
    ia.novo = false;
    if (me.enxaqueca > 0) { const a = held.left; held.left = held.right; held.right = a; } // compensa inversão (a IA "sente" a enxaqueca na lentidão)
    return { held, pressed };
  }
  // ---------- loop ----------
  update(dt) {
    const in1 = Input.get(1), in2 = Input.get(2);
    if (in1.pressed.back || (in1.pressed.pause && !Input.isTouch)) { this.pausado = !this.pausado; Audio8.play(this.pausado ? 'back' : 'confirm'); this.pauseIdx = 0; }
    if (this.pausado) {
      if (in1.pressed.up || in1.pressed.down) { this.pauseIdx = 1 - this.pauseIdx; Audio8.play('menu'); }
      if (in1.pressed.confirm) { if (this.pauseIdx === 0) this.pausado = false; else this.encerrar('sair'); }
      return;
    }
    this.t += dt; this.faseT += dt; if (this.tremor.t > 0) this.tremor.t -= dt;
    this.msgs = this.msgs.filter(m => (m.t -= dt) > 0);
    const lutando = this.fase === 'fight';
    if (this.relogio != null && lutando) { this.relogio -= dt; if (this.relogio <= 0) { this.relogio = 0; this.fase = 'fimRelogio'; this.faseT = 0; Audio8.play('buzzer'); this.msg('PRAZO ENCERRADO', 2.5, '#ff5252'); this.f1.state = this.f1.vivo ? 'idle' : this.f1.state; } }
    // fases
    if (this.fase === 'intro' && this.faseT > this.faseDur) { this.fase = 'round'; this.faseT = 0; this.msg(this.cfg.modo === 'relogio' ? 'PENDÊNCIA ' + (this.quitadas + 1) : 'ROUND ' + this.round, 1.0, '#ffd23f'); Audio8.play('round'); }
    if (this.fase === 'round' && this.faseT > 1.0) { this.fase = 'fight'; this.faseT = 0; this.msg('LUTEM!', 0.7, '#ff3d8f'); }
    if (lutando) { this.tempo -= dt; if (this.tempo <= 10 && Math.floor(this.tempo + dt) !== Math.floor(this.tempo)) Audio8.play('tick'); if (this.tempo <= 0 && this.relogio == null) { this.tempo = 0; this.fimRound('tempo'); } }
    // entradas
    const livre = lutando;
    const e1 = livre ? in1 : vazio(), e2 = livre ? (this.f2.controle === 'cpu' ? this.entradaIA(this.f2, this.f1, dt) : in2) : vazio();
    this.f1.update(dt, e1, this); this.f2.update(dt, e2, this);
    // orientação e limites
    for (const [a, b] of [[this.f1, this.f2], [this.f2, this.f1]]) if (!a.ocupado && a.state !== 'block') a.face = b.x >= a.x ? 1 : -1;
    const L = this.stage.largura; this.f1.x = clamp(this.f1.x, 70, L - 70); this.f2.x = clamp(this.f2.x, 70, L - 70);
    const maxDist = W - 220, mid = (this.f1.x + this.f2.x) / 2;
    for (const f of [this.f1, this.f2]) f.x = clamp(f.x, mid - maxDist / 2, mid + maxDist / 2);
    const dx = this.f2.x - this.f1.x; if (Math.abs(dx) < LARGURA_CORPO && this.f1.vivo && this.f2.vivo && this.f1.state !== 'ko' && this.f2.state !== 'ko') { const push = (LARGURA_CORPO - Math.abs(dx)) / 2 * (dx >= 0 ? 1 : -1); this.f1.x -= push; this.f2.x += push; }
    // câmera
    const alvoCam = clamp(mid - W / 2, 0, L - W); this.cam += (alvoCam - this.cam) * Math.min(1, dt * 8);
    // colisões
    if (lutando) { this.golpes(this.f1, this.f2); this.golpes(this.f2, this.f1); this.atualizarProjeteis(dt); }
    // fim de round
    if (lutando) { if (!this.f1.vivo) this.fimRound('ko', this.f2); else if (!this.f2.vivo) this.fimRound('ko', this.f1); }
    if (this.fase === 'fimRound' && this.faseT > 3.4) this.proximo();
    if (this.fase === 'fimRelogio' && this.faseT > 2.6) this.encerrar('relogio');
  }
  golpes(a, b) {
    if (!a.golpe || a.acertou) return;
    const g = a.golpe, f = a.fase();
    if (f !== 'active') return;
    if (g.tipo === 'raio') {
      const hb = b.hurtbox(); const naFrente = a.face > 0 ? b.x > a.x : b.x < a.x;
      const alturaOk = hb.y < a.y - g.yBot && hb.y + hb.h > a.y - g.yTop;
      if (naFrente && alturaOk) { a.acertou = true; const r = b.receberGolpe(g.dmg, g.kb, a.face, a, 'raio'); this.tremer(0.4, 10); if (r === 'bloqueado') this.msg('BLOQUEOU', 0.6, '#9fd3ff'); }
      return;
    }
    if (g.tipo === 'projetil' || g.tipo === 'enxaqueca') return;
    const hb = a.hitbox(), ub = b.hurtbox();
    if (hb && overlap(hb, ub)) { a.acertou = true; const r = b.receberGolpe(g.dmg, g.kb, a.face, a, g.tipo); if (r === 'acertou' || r === 'ko') this.tremer(0.12, 3 + g.dmg * 0.2); }
  }
  atualizarProjeteis(dt) {
    for (const p of this.projeteis) {
      p.x += p.vx * dt; p.vida -= dt; p.rot += dt * 12;
      const alvo = p.dono === this.f1 ? this.f2 : this.f1; const ub = alvo.hurtbox();
      if (!p.hit && overlap({ x: p.x - p.w / 2, y: p.y - p.h / 2, w: p.w, h: p.h }, ub)) {
        p.hit = true; p.vida = 0; const r = alvo.receberGolpe(p.dmg, p.kb, Math.sign(p.vx), p.dono, p.tipo);
        if (p.tipo === 'garrafa') Audio8.play('bottle'); if (p.tipo === 'enxaqueca' && r !== 'bloqueado') { this.tremer(0.5, 8); this.msg('ENXAQUECA TRANSFERIDA', 1.4, '#ff1744'); }
      }
    }
    this.projeteis = this.projeteis.filter(p => p.vida > 0);
  }
  fimRound(motivo, vencedor) {
    this.fase = 'fimRound'; this.faseT = 0;
    if (motivo === 'tempo') { vencedor = this.f1.hp === this.f2.hp ? null : (this.f1.hp > this.f2.hp ? this.f1 : this.f2); this.msg('TEMPO ESGOTADO', 1.2, '#ffd23f'); }
    else this.msg(this.cfg.modo === 'relogio' && vencedor === this.f1 ? 'GUIA QUITADA!' : 'K.O.', 1.3, '#ff3d8f');
    this.vencedor = vencedor;
    if (vencedor) { vencedor.vitorias++; setTimeout(() => { if (this.fase === 'fimRound') { vencedor.state = 'win'; vencedor.fala = { texto: vencedor.char.falas.vitoria, t: 2.4 }; Audio8.voice(vencedor.id, 'vitoria'); Audio8.play('win'); } }, 900); }
    const perdedor = vencedor === this.f1 ? this.f2 : this.f1; if (perdedor.vivo && vencedor) { perdedor.state = 'idle'; }
  }
  proximo() {
    const alvo = this.cfg.vitorias || 2;
    if (this.cfg.modo === 'relogio') {
      if (this.vencedor === this.f1) {
        this.quitadas++; this.f1.hp = Math.min(this.f1.hpMax, this.f1.hp + 35);
        // próximo oponente: cicla o elenco, pulando o próprio personagem
        const outros = ROSTER.filter(id => id !== this.cfg.p1); this.oponenteIdx++;
        const prox = outros.length ? outros[this.oponenteIdx % outros.length] : this.cfg.p2;
        const hp = this.f1.hp; this.f2 = new Fighter(prox, -1, 'cpu'); this.cfg.dificuldade = Math.min(1, (this.cfg.dificuldade || 0.4) + 0.12);
        this.round = 0; this.novoRound(); this.f1.hp = hp; this.f1.vitorias = this.quitadas; return;
      }
      this.encerrar('relogio'); return;
    }
    if (this.f1.vitorias >= alvo || this.f2.vitorias >= alvo) { this.encerrar(this.f1.vitorias >= alvo ? 'p1' : 'p2'); return; }
    this.novoRound();
  }
  encerrar(resultado) { if (this.fim) return; this.fim = true; this.cfg.onFim && this.cfg.onFim({ resultado, quitadas: this.quitadas, vencedor: resultado === 'p1' ? this.f1 : this.f2, match: this }); }
  msg(texto, t, cor) { this.msgs.push({ texto, t, tMax: t, cor }); }
  // ---------- desenho ----------
  draw(ctx) {
    ctx.save();
    if (this.tremor.t > 0) ctx.translate((Math.random() - 0.5) * this.tremor.amp * 2, (Math.random() - 0.5) * this.tremor.amp);
    this.stage.draw(ctx, this.cam, this.t, W, H);
    ctx.save(); ctx.translate(-this.cam, 0);
    const ordem = this.f1.ocupado && !this.f2.ocupado ? [this.f2, this.f1] : [this.f1, this.f2];
    for (const f of ordem) { if (f.state === 'special' && f.golpe && f.golpe.tipo === 'raio' && f.fase() === 'active') this.raio(ctx, f); f.draw(ctx, this.t); }
    for (const p of this.projeteis) {
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot * Math.sign(p.vx));
      if (p.img) ctx.drawImage(p.img, -p.w / 2, -p.h / 2, p.w, p.h);
      else { cerebro(ctx, this.t); ctx.strokeStyle = '#ff1744'; ctx.lineWidth = 3; for (let i = 0; i < 4; i++) { const a = i * 1.57 + this.t * 10; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 32, Math.sin(a) * 32); ctx.lineTo(Math.cos(a) * 52, Math.sin(a) * 52); ctx.stroke(); } }
      ctx.restore();
    }
    for (const f of [this.f1, this.f2]) if (f.fala) balao(ctx, f, f.fala.texto);
    ctx.restore();
    ctx.restore();
    this.hud(ctx);
    if (this.pausado) this.menuPausa(ctx);
  }
  raio(ctx, f) {
    const g = f.golpe, x0 = f.x + f.face * 60, y0 = f.y - g.yTop + 30, fim = f.face > 0 ? this.cam + W + 100 : this.cam - 100;
    const cores = ['#e53935', '#fdd835', '#43a047', '#1e88e5'];
    ctx.save(); ctx.globalAlpha = 0.9;
    const grad = ctx.createLinearGradient(x0, 0, fim, 0); grad.addColorStop(0, 'rgba(255,255,255,.95)'); grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad; ctx.beginPath(); ctx.moveTo(x0, y0 - 8); ctx.lineTo(fim, y0 - 110); ctx.lineTo(fim, y0 + 110); ctx.lineTo(x0, y0 + 8); ctx.fill();
    for (let i = 0; i < 26; i++) { const p = ((this.t * 1.6 + i * 0.09) % 1), x = x0 + (fim - x0) * p, y = y0 + (i % 5 - 2) * 40 * p + Math.sin(this.t * 10 + i) * 6; ctx.fillStyle = cores[i % 4]; ctx.save(); ctx.translate(x, y); ctx.rotate(this.t * 4 + i); const s = 10 + 16 * p; ctx.fillRect(-s / 2, -s / 2, s, s); ctx.beginPath(); ctx.arc(s / 2, 0, s / 4, 0, 7); ctx.arc(0, -s / 2, s / 4, 0, 7); ctx.fill(); ctx.restore(); }
    ctx.restore();
  }
  hud(ctx) {
    const f1 = this.f1, f2 = this.f2, bw = 470, bh = 26;
    // faixa escura atrás do HUD para leitura sobre cenários claros
    const faixa = ctx.createLinearGradient(0, 0, 0, 170); faixa.addColorStop(0, 'rgba(5,12,30,.78)'); faixa.addColorStop(1, 'rgba(5,12,30,0)'); ctx.fillStyle = faixa; ctx.fillRect(0, 0, W, 170);
    barra(ctx, 40, 36, bw, bh, f1.hp / f1.hpMax, false, f1.char.cor);
    barra(ctx, W - 40 - bw, 36, bw, bh, f2.hp / f2.hpMax, true, f2.char.cor);
    ctx.fillStyle = '#fff'; ctx.font = '14px "Press Start 2P", monospace'; ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left'; ctx.fillText(f1.char.nome.toUpperCase(), 44, 84); ctx.font = '8px "Press Start 2P", monospace'; ctx.fillStyle = '#cfd8dc'; ctx.fillText(f1.char.setor.toUpperCase(), 44, 100);
    ctx.textAlign = 'right'; ctx.fillStyle = '#fff'; ctx.font = '14px "Press Start 2P", monospace'; ctx.fillText(f2.char.nome.toUpperCase(), W - 44, 84); ctx.font = '8px "Press Start 2P", monospace'; ctx.fillStyle = '#cfd8dc'; ctx.fillText(f2.char.setor.toUpperCase(), W - 44, 100);
    // rounds
    const alvo = this.cfg.vitorias || 2;
    for (let i = 0; i < alvo; i++) { pip(ctx, 44 + i * 26, 116, i < f1.vitorias); pip(ctx, W - 56 - i * 26, 116, i < f2.vitorias); }
    // especial
    medidor(ctx, 40, 134, 240, 10, f1.meter / 100, f1.meter >= 100, this.t); medidor(ctx, W - 280, 134, 240, 10, f2.meter / 100, f2.meter >= 100, this.t);
    // tempo
    ctx.textAlign = 'center'; ctx.fillStyle = '#0b1a3a'; ctx.fillRect(W / 2 - 70, 24, 140, 52); ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 3; ctx.strokeRect(W / 2 - 70, 24, 140, 52);
    ctx.fillStyle = this.relogio != null && this.relogio < 20 && Math.floor(this.t * 4) % 2 ? '#ff5252' : '#ffd23f'; ctx.font = '26px "Press Start 2P", monospace';
    if (this.relogio != null) { const m = Math.floor(this.relogio / 60), s = Math.floor(this.relogio % 60); ctx.fillText(m + ':' + (s < 10 ? '0' : '') + s, W / 2, 62); ctx.font = '8px "Press Start 2P", monospace'; ctx.fillStyle = '#fff'; ctx.fillText('QUITADAS: ' + this.quitadas, W / 2, 92); }
    else ctx.fillText(String(Math.ceil(this.tempo)), W / 2, 62);
    if (this.cfg.modo === 'arcade') { ctx.font = '8px "Press Start 2P", monospace'; ctx.fillStyle = '#fff'; ctx.fillText('ARCADE  ' + (this.cfg.etapa || ''), W / 2, 92); }
    // mensagens centrais
    for (const m of this.msgs) { const a = Math.min(1, m.t / 0.3), s = 1 + (1 - Math.min(1, (m.tMax - m.t) / 0.15)) * 0.8; ctx.save(); ctx.globalAlpha = a; ctx.translate(W / 2, H / 2 - 40); ctx.scale(s, s); ctx.font = '42px "Press Start 2P", monospace'; ctx.lineWidth = 8; ctx.strokeStyle = '#0b1a3a'; ctx.strokeText(m.texto, 0, 0); ctx.fillStyle = m.cor; ctx.fillText(m.texto, 0, 0); ctx.restore(); }
    if (this.fase === 'fimRound' && this.vencedor && this.faseT > 1.0) { ctx.font = '28px "Press Start 2P", monospace'; ctx.lineWidth = 6; ctx.strokeStyle = '#0b1a3a'; const tx = this.vencedor.char.nome.toUpperCase() + ' VENCE'; ctx.strokeText(tx, W / 2, H / 2 + 30); ctx.fillStyle = '#ffd23f'; ctx.fillText(tx, W / 2, H / 2 + 30); }
    if (this.fase === 'fimRound' && !this.vencedor && this.faseT > 1.0) { ctx.font = '28px "Press Start 2P", monospace'; ctx.fillStyle = '#ffd23f'; ctx.fillText('EMPATE', W / 2, H / 2 + 30); }
    // dica de controles (desktop)
    if (!Input.isTouch && this.fase !== 'fight') { ctx.font = '9px "Press Start 2P", monospace'; ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.fillText('SETAS mover/pular   A soco   S chute   D poder   Z defesa   X fechamento   ESC pausa', W / 2, H - 16); if (f2.controle === 'p2') ctx.fillText('P2: IJKL mover   U soco   O chute   P poder   N defesa   M fechamento', W / 2, H - 34); }
    ctx.textAlign = 'left';
  }
  menuPausa(ctx) {
    ctx.fillStyle = 'rgba(0,0,0,.65)'; ctx.fillRect(0, 0, W, H); ctx.textAlign = 'center'; ctx.fillStyle = '#ffd23f'; ctx.font = '30px "Press Start 2P", monospace'; ctx.fillText('PAUSA', W / 2, 250);
    ['CONTINUAR', 'SAIR DA PARTIDA'].forEach((t, i) => { ctx.fillStyle = i === this.pauseIdx ? '#ff3d8f' : '#fff'; ctx.font = '16px "Press Start 2P", monospace'; ctx.fillText((i === this.pauseIdx ? '> ' : '') + t, W / 2, 340 + i * 50); });
    this.pauseBtns = [{ x: W / 2 - 200, y: 320, w: 400, h: 40, i: 0 }, { x: W / 2 - 200, y: 370, w: 400, h: 40, i: 1 }];
    ctx.textAlign = 'left';
  }
  // toque/clique durante a partida (menu de pausa)
  pointer(x, y) { if (!this.pausado || !this.pauseBtns) return; for (const b of this.pauseBtns) if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) { Audio8.play('confirm'); if (b.i === 0) this.pausado = false; else this.encerrar('sair'); } }
}
function cerebro(ctx, t) {
  ctx.fillStyle = '#f48fb1'; ctx.beginPath(); ctx.ellipse(0, 0, 30, 24, 0, 0, 7); ctx.fill();
  ctx.strokeStyle = '#ad1457'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, -22); ctx.lineTo(0, 22); ctx.stroke();
  for (let i = 0; i < 6; i++) { const y = -16 + i * 7, s = i % 2 ? 1 : -1; ctx.beginPath(); ctx.moveTo(-26 + Math.abs(y) * 0.3, y); ctx.quadraticCurveTo(-13, y + 5 * s, -3, y); ctx.moveTo(3, y); ctx.quadraticCurveTo(13, y - 5 * s, 26 - Math.abs(y) * 0.3, y); ctx.stroke(); }
  ctx.strokeStyle = '#ad1457'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(0, 0, 30, 24, 0, 0, 7); ctx.stroke();
}
function vazio() { return { held: {}, pressed: {} }; }
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function overlap(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }
function barra(ctx, x, y, w, h, p, invertida, cor) {
  ctx.fillStyle = '#0b1a3a'; ctx.fillRect(x - 3, y - 3, w + 6, h + 6); ctx.fillStyle = '#7f0000'; ctx.fillRect(x, y, w, h);
  const fw = Math.max(0, w * p); const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#ffee58'); g.addColorStop(1, p < 0.3 ? '#e53935' : '#f9a825');
  ctx.fillStyle = g; ctx.fillRect(invertida ? x + w - fw : x, y, fw, h);
  ctx.fillStyle = cor; ctx.fillRect(invertida ? x + w - 6 : x, y, 6, h);
}
function pip(ctx, x, y, cheio) { ctx.fillStyle = cheio ? '#ffd23f' : '#0b1a3a'; ctx.beginPath(); ctx.arc(x, y, 8, 0, 7); ctx.fill(); ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 2; ctx.stroke(); }
function medidor(ctx, x, y, w, h, p, cheio, t) {
  ctx.fillStyle = '#0b1a3a'; ctx.fillRect(x - 2, y - 2, w + 4, h + 4); ctx.fillStyle = cheio ? (Math.floor(t * 6) % 2 ? '#ff3d8f' : '#fff') : '#1f5fbf'; ctx.fillRect(x, y, w * p, h);
  ctx.fillStyle = '#fff'; ctx.font = '7px "Press Start 2P", monospace'; ctx.textAlign = 'left'; ctx.fillText(cheio ? 'FECHAMENTO PRONTO (X)' : 'FECHAMENTO', x, y + h + 11);
}
function balao(ctx, f, texto) {
  ctx.font = '11px "Press Start 2P", monospace'; const linhas = quebrar(ctx, texto, 300); const lw = Math.max(...linhas.map(l => ctx.measureText(l).width)) + 24, lh = linhas.length * 18 + 16;
  const bx = clamp(f.x - lw / 2, 10, 1800 - lw), by = f.y - f.alturaCorpo - lh - 36;
  ctx.fillStyle = '#fff'; ctx.strokeStyle = '#0b1a3a'; ctx.lineWidth = 3; roundRect(ctx, bx, by, lw, lh, 10); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(f.x - 10, by + lh); ctx.lineTo(f.x + 10, by + lh); ctx.lineTo(f.x, by + lh + 16); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#0b1a3a'; ctx.textAlign = 'left'; linhas.forEach((l, i) => ctx.fillText(l, bx + 12, by + 22 + i * 18));
}
function quebrar(ctx, texto, max) { const out = []; let linha = ''; for (const w of texto.split(' ')) { const t = linha ? linha + ' ' + w : w; if (ctx.measureText(t).width > max && linha) { out.push(linha); linha = w; } else linha = t; } if (linha) out.push(linha); return out; }
function roundRect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath(); }
window.Match = Match; window.roundRect = roundRect; window.clampNum = clamp;
