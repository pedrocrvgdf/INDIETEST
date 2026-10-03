// Lutador: máquina de estados, física simples, golpes e desenho do sprite.
const GRAVIDADE = 2600;
const LARGURA_CORPO = 110;

class Fighter {
  constructor(charId, lado, controle) {
    this.char = CHARACTERS[charId]; this.id = charId; this.lado = lado; this.controle = controle; // 'p1' | 'p2' | 'cpu'
    this.meta = SPRITE_META[charId]; this.img = SPRITES[charId];
    this.vitorias = 0; this.scratch = document.createElement('canvas'); this.scratch.width = 520; this.scratch.height = 420;
    this.reset(0, 650, lado);
  }
  reset(x, chao, face) {
    this.x = x; this.y = chao; this.chao = chao; this.vx = 0; this.vy = 0; this.noChao = true; this.face = face;
    this.hp = this.char.hp; this.hpMax = this.char.hp; this.meter = 0; this.state = 'idle'; this.timer = 0; this.golpe = null;
    this.acertou = false; this.cooldown = 0; this.enxaqueca = 0; this.flash = 0; this.stun = 0; this.anguloKO = 0;
    this.auraSom = 0; this.provocacao = 0; this.pulouAtaque = false;
  }
  get vivo() { return this.hp > 0; }
  get ocupado() { return ['attack', 'dash', 'special', 'hit', 'ko', 'win'].includes(this.state); }
  get alturaCorpo() { return this.meta.parado.bodyH; }
  hurtbox() { const h = this.state === 'block' ? this.alturaCorpo * 0.95 : this.alturaCorpo; return { x: this.x - LARGURA_CORPO / 2, y: this.y - h, w: LARGURA_CORPO, h }; }
  hitbox() {
    const g = this.golpe; if (!g) return null;
    const reach = g.reach || 0, x0 = this.x + (this.face > 0 ? 20 : -20 - reach);
    return { x: x0, y: this.y - g.yTop, w: reach, h: g.yTop - g.yBot };
  }
  fase() { // fase do golpe atual: 'startup' | 'active' | 'recovery'
    const g = this.golpe; if (!g) return null;
    if (this.timer < g.startup) return 'startup';
    if (this.timer < g.startup + (g.active || g.duracao || 0)) return 'active';
    return 'recovery';
  }
  iniciar(nome) {
    const g = this.char.golpes[nome]; if (!g) return false;
    if (nome === 'poder' && this.cooldown > 0) return false;
    if (nome === 'especial' && this.meter < 100) return false;
    this.golpe = Object.assign({ chave: nome }, g); this.timer = 0; this.acertou = false; this.vx = 0;
    if (nome === 'especial') { this.state = 'special'; this.meter = 0; Audio8.voice(this.id, 'especial'); this.fala = { texto: this.char.falas.especial, t: 1.6 }; Audio8.play(g.tipo === 'raio' ? 'charge' : 'headache'); }
    else if (g.tipo === 'dash') { this.state = 'dash'; this.cooldown = g.cooldown; Audio8.play(g.sfx); }
    else if (g.tipo === 'projetil') { this.state = 'attack'; this.cooldown = g.cooldown; Audio8.play(g.sfx); }
    else { this.state = 'attack'; Audio8.play('swing'); }
    if (!this.noChao) this.pulouAtaque = true;
    return true;
  }
  update(dt, inp, match) {
    this.timer += dt; this.cooldown = Math.max(0, this.cooldown - dt); this.flash = Math.max(0, this.flash - dt);
    if (this.enxaqueca > 0) { this.enxaqueca -= dt; if (Math.random() < dt * 1.0 && this.vivo) this.hp = Math.max(1, this.hp - 1); }
    if (this.fala) { this.fala.t -= dt; if (this.fala.t <= 0) this.fala = null; }
    const h = inp ? inp.held : {}, p = inp ? inp.pressed : {};
    const esq = this.enxaqueca > 0 ? h.right : h.left, dir = this.enxaqueca > 0 ? h.left : h.right;
    const vel = this.char.velocidade;

    switch (this.state) {
      case 'idle': case 'walk':
        this.vx = 0;
        if (h.defesa && this.noChao) { this.state = 'block'; break; }
        if (p.especial && this.iniciar('especial')) break;
        if (p.poder && this.iniciar('poder')) break;
        if (p.soco && this.iniciar('soco')) break;
        if (p.chute && this.iniciar('chute')) break;
        if (p.up && this.noChao) { this.vy = -this.char.pulo; this.noChao = false; this.state = 'jump'; Audio8.play('jump'); this.vx = (dir ? vel : 0) - (esq ? vel : 0); break; }
        if (esq) this.vx = -vel; if (dir) this.vx = vel;
        this.state = this.vx ? 'walk' : 'idle';
        break;
      case 'jump':
        if (p.soco && this.iniciar('soco')) break;
        if (p.chute && this.iniciar('chute')) break;
        break;
      case 'block':
        this.vx = 0;
        if (!h.defesa) this.state = 'idle';
        break;
      case 'attack': {
        const g = this.golpe, total = g.startup + (g.active || 0) + g.recovery;
        if (g.tipo === 'projetil' && !this.acertou && this.timer >= g.startup) { this.acertou = true; match.lancarProjetil(this, g); }
        if (this.noChao) this.vx = 0;
        if (this.timer >= total) { this.golpe = null; this.state = this.noChao ? 'idle' : 'jump'; }
        break;
      }
      case 'dash': {
        const g = this.golpe;
        if (this.fase() === 'active') this.vx = this.face * g.dist / g.duracao; else this.vx = 0;
        if (this.timer >= g.startup + g.duracao + g.recovery) { this.golpe = null; this.state = 'idle'; }
        break;
      }
      case 'special': {
        const g = this.golpe; this.vx = 0;
        if (g.tipo === 'enxaqueca' && !this.acertou && this.timer >= g.startup) { this.acertou = true; match.lancarProjetil(this, g); }
        if (g.tipo === 'raio' && this.timer >= g.startup && !this.raioSom) { this.raioSom = true; Audio8.play('beam'); match.tremer(0.5, 6); }
        const total = g.startup + (g.duracao || 0) + g.recovery;
        if (this.timer >= total) { this.golpe = null; this.raioSom = false; this.state = 'idle'; }
        break;
      }
      case 'hit':
        this.vx *= Math.pow(0.02, dt);
        if (this.timer >= this.stun && this.noChao) this.state = 'idle';
        break;
      case 'ko':
        this.vx *= Math.pow(0.05, dt); this.anguloKO = Math.min(1, this.anguloKO + dt * 2.4);
        break;
      case 'win': this.vx = 0; break;
    }
    // física
    if (!this.noChao) { this.vy += GRAVIDADE * dt; this.y += this.vy * dt; if (this.y >= this.chao) { this.y = this.chao; this.vy = 0; this.noChao = true; Audio8.play('land'); if (this.state === 'jump') this.state = 'idle'; if (this.state === 'attack' && this.pulouAtaque) { this.golpe = null; this.state = 'idle'; } this.pulouAtaque = false; } }
    this.x += this.vx * dt;
    // provocação ocasional
    if ((this.state === 'idle' || this.state === 'walk') && this.vivo && !this.fala) { this.provocacao += dt; if (this.provocacao > 7 && Math.random() < dt * 0.25) { this.provocacao = 0; const f = this.char.falas.provocacoes; this.fala = { texto: f[Math.floor(Math.random() * f.length)], t: 1.8 }; } }
    if (this.hp < this.hpMax * 0.3 && this.vivo && this.char.pressao === 'sayajin') { this.auraSom -= dt; if (this.auraSom <= 0) { this.auraSom = 1.2; Audio8.play('aura'); } }
  }
  receberGolpe(dmg, kb, dirKb, atacante, tipo) {
    if (!this.vivo) return 'morto';
    if (this.state === 'block' && this.noChao) {
      const chip = Math.max(0, Math.min(this.hp - 1, Math.round(dmg * 0.2)));
      this.hp -= chip; this.vx = dirKb * kb * 1.5; this.meter = Math.min(100, this.meter + dmg * 0.4); atacante.meter = Math.min(100, atacante.meter + dmg * 0.4);
      Audio8.play('block'); return 'bloqueado';
    }
    this.hp = Math.max(0, this.hp - dmg); this.flash = 0.18; this.golpe = null; this.pulouAtaque = false;
    this.meter = Math.min(100, this.meter + dmg * 0.7); atacante.meter = Math.min(100, atacante.meter + dmg * 0.9);
    this.vx = dirKb * kb * 4.2; if (!this.noChao) this.vy = Math.min(this.vy, -250);
    if (tipo === 'enxaqueca') { this.enxaqueca = 4; }
    if (this.hp <= 0) { this.state = 'ko'; this.timer = 0; this.anguloKO = 0; this.vy = -420; this.noChao = false; this.vx = dirKb * 260; Audio8.play('ko'); return 'ko'; }
    this.state = 'hit'; this.timer = 0; this.stun = 0.22 + dmg * 0.012;
    Audio8.play(dmg >= 20 ? 'special_hit' : dmg >= 10 ? 'kick' : 'punch');
    return 'acertou';
  }
  poseAtual() {
    switch (this.state) {
      case 'block': return 'defesa';
      case 'attack': case 'dash': case 'special': return (this.golpe && this.golpe.pose) || 'parado';
      default: return 'parado';
    }
  }
  draw(ctx, t) {
    const pose = this.poseAtual(), img = this.img[pose], m = this.meta[pose]; if (!img || !m) return;
    const sombraW = 120; ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.beginPath(); ctx.ellipse(this.x, this.chao + 6, sombraW / 2, 10, 0, 0, 7); ctx.fill();
    ctx.save(); ctx.translate(this.x, this.y); ctx.scale(this.face, 1);
    // efeitos atrás do corpo
    if (this.hp < this.hpMax * 0.3 && this.vivo && this.char.pressao === 'sayajin') aura(ctx, t, this.alturaCorpo);
    let sx = 1, sy = 1, dx = 0;
    if (this.state === 'idle') sy = 1 + Math.sin(t * 6) * 0.015;
    if (this.state === 'walk') { sy = 1 + Math.sin(t * 14) * 0.03; dx = 0; }
    if (this.state === 'attack' || this.state === 'dash') { const f = this.fase(); if (f === 'startup') { sx = 0.94; dx = -8; } else if (f === 'active') { sx = 1.04; dx = 14; } }
    if (this.state === 'special') { const f = this.fase(); if (f === 'startup') { sx = 0.97 + Math.sin(t * 60) * 0.02; } }
    if (this.state === 'hit') { dx = -6 + Math.sin(t * 90) * 5; }
    if (this.state === 'win') { sy = 1 + Math.abs(Math.sin(t * 7)) * 0.06; }
    if (this.state === 'ko') { ctx.rotate(-this.anguloKO * Math.PI / 2 * 0.95); ctx.translate(0, 0); }
    ctx.translate(dx, 0); ctx.scale(sx, sy);
    if (this.flash > 0 || this.enxaqueca > 0) {
      const sc = this.scratch, c2 = sc.getContext('2d'); c2.clearRect(0, 0, sc.width, sc.height);
      c2.drawImage(img, 0, 0); c2.globalCompositeOperation = 'source-atop';
      c2.fillStyle = this.flash > 0 ? 'rgba(255,40,40,.6)' : 'rgba(255,0,80,' + (0.25 + Math.sin(t * 20) * 0.15) + ')'; c2.fillRect(0, 0, sc.width, sc.height); c2.globalCompositeOperation = 'source-over';
      ctx.drawImage(sc, 0, 0, img.width, img.height, -m.footX, -m.h, img.width, img.height);
    } else ctx.drawImage(img, -m.footX, -m.h);
    ctx.restore();
    // efeitos na frente
    const topo = this.y - this.alturaCorpo;
    if (this.state === 'special' && this.golpe && this.golpe.tipo === 'enxaqueca' && this.fase() === 'startup') raios(ctx, this.x, topo + 40, t);
    if (this.enxaqueca > 0) estrelas(ctx, this.x, topo - 14, t);
    if (this.hp < this.hpMax * 0.3 && this.vivo && this.char.pressao === 'raiva') nuvemRaiva(ctx, this.x, topo - 30, t);
  }
}
function estrelas(ctx, x, y, t) {
  for (let i = 0; i < 4; i++) { const a = t * 5 + i * Math.PI / 2, sx = x + Math.cos(a) * 36, sy = y + Math.sin(a) * 10; ctx.fillStyle = i % 2 ? '#ffd23f' : '#ff1744'; ctx.beginPath(); for (let k = 0; k < 10; k++) { const r = k % 2 ? 4 : 10, b = k / 10 * Math.PI * 2 + t * 3; ctx.lineTo(sx + Math.cos(b) * r, sy + Math.sin(b) * r); } ctx.closePath(); ctx.fill(); }
}
function nuvemRaiva(ctx, x, y, t) {
  const oy = Math.sin(t * 2) * 4; ctx.fillStyle = '#37474f';
  [[-26, 0, 16], [-6, -10, 20], [16, -4, 17], [30, 4, 12]].forEach(([dx, dy, r]) => { ctx.beginPath(); ctx.arc(x + dx, y + dy + oy, r, 0, 7); ctx.fill(); });
  ctx.strokeStyle = '#90caf9'; ctx.lineWidth = 2; for (let i = 0; i < 4; i++) { const p = (t * 1.5 + i * 0.25) % 1; ctx.beginPath(); ctx.moveTo(x - 24 + i * 16, y + 14 + p * 26); ctx.lineTo(x - 26 + i * 16, y + 22 + p * 26); ctx.stroke(); }
  // marca de raiva (💢) desenhada
  ctx.strokeStyle = '#ff1744'; ctx.lineWidth = 4; const mx = x + 62, my = y + 54;
  for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + Math.PI / 4; ctx.beginPath(); ctx.moveTo(mx + Math.cos(a) * 8, my + Math.sin(a) * 8); ctx.quadraticCurveTo(mx + Math.cos(a + 0.6) * 16, my + Math.sin(a + 0.6) * 16, mx + Math.cos(a) * 22, my + Math.sin(a) * 22); ctx.stroke(); }
}
function aura(ctx, t, h) {
  const g = ctx.createRadialGradient(0, -h / 2, 20, 0, -h / 2, h * 0.75); g.addColorStop(0, 'rgba(255,220,60,.55)'); g.addColorStop(1, 'rgba(255,200,0,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, -h / 2, h * 0.6, h * 0.8, 0, 0, 7); ctx.fill();
  ctx.fillStyle = 'rgba(255,235,80,.8)';
  for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2 + t * 2, r = h * 0.45 + Math.sin(t * 13 + i) * 18; ctx.beginPath(); ctx.moveTo(Math.cos(a) * r * 0.9, -h / 2 + Math.sin(a) * r); ctx.lineTo(Math.cos(a) * r * 0.9 + 10, -h / 2 + Math.sin(a) * r - 40 - Math.sin(t * 20 + i) * 20); ctx.lineTo(Math.cos(a) * r * 0.9 + 20, -h / 2 + Math.sin(a) * r); ctx.fill(); }
}
function raios(ctx, x, y, t) {
  ctx.strokeStyle = '#ff1744'; ctx.lineWidth = 3;
  for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + t * 7; let px = x + Math.cos(a) * 40, py = y + Math.sin(a) * 30; ctx.beginPath(); ctx.moveTo(px, py); for (let k = 0; k < 4; k++) { px += Math.cos(a) * 18 + (Math.random() - 0.5) * 16; py += Math.sin(a) * 14 + (Math.random() - 0.5) * 16; ctx.lineTo(px, py); } ctx.stroke(); }
}
window.Fighter = Fighter;
