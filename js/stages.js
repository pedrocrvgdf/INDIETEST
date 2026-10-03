// Cenários desenhados em código (placeholders até chegarem as fotos das salas reais).
window.STAGES = {
  financeiro: {
    id: 'financeiro', nome: 'Sala do Financeiro', sub: 'Quitação & Gestão Estratégica', largura: 1800, chao: 650, musica: 'fight',
    draw(ctx, cam, t, W, H) {
      const chao = this.chao;
      // parede
      const g = ctx.createLinearGradient(0, 0, 0, chao); g.addColorStop(0, '#e9e4d4'); g.addColorStop(1, '#cfc7b2');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, chao);
      ctx.save(); ctx.translate(-cam * 0.6, 0); // parede (parallax leve)
      // rodapé
      ctx.fillStyle = '#9b9178'; ctx.fillRect(-200, chao - 24, 2600, 24);
      // janela com céu de Brasília
      ctx.fillStyle = '#5a4a3a'; ctx.fillRect(150, 90, 520, 300);
      const sky = ctx.createLinearGradient(0, 100, 0, 380); sky.addColorStop(0, '#5aa9ff'); sky.addColorStop(1, '#bfe3ff');
      ctx.fillStyle = sky; ctx.fillRect(166, 106, 488, 268);
      ctx.fillStyle = 'rgba(255,255,255,.9)';
      for (let i = 0; i < 3; i++) { const cx = 190 + ((t * 12 + i * 170) % 520), cy = 150 + i * 40; ctx.beginPath(); ctx.arc(cx, cy, 18, 0, 7); ctx.arc(cx + 22, cy - 8, 22, 0, 7); ctx.arc(cx + 46, cy, 16, 0, 7); ctx.fill(); }
      // silhueta do Congresso ao fundo
      ctx.fillStyle = '#6f8fb5'; ctx.fillRect(330, 330, 160, 44); ctx.fillRect(395, 250, 14, 80); ctx.fillRect(415, 250, 14, 80);
      ctx.beginPath(); ctx.arc(360, 332, 34, Math.PI, 0); ctx.fill(); ctx.beginPath(); ctx.arc(460, 366, 34, 0, Math.PI, true); ctx.fillRect(426, 332, 68, 2); ctx.fill();
      ctx.fillStyle = '#5a4a3a'; ctx.fillRect(405, 100, 10, 280); ctx.fillRect(160, 236, 500, 10);
      // ar-condicionado (piada: "Quem ligou esse ar aí?")
      ctx.fillStyle = '#f4f4f4'; ctx.fillRect(820, 70, 260, 80); ctx.fillStyle = '#d0d0d0'; ctx.fillRect(820, 130, 260, 20);
      ctx.fillStyle = '#4caf50'; ctx.fillRect(1060, 80, 8, 8);
      ctx.fillStyle = '#333'; ctx.font = '10px "Press Start 2P", monospace'; ctx.fillText('16°C', 835, 95);
      for (let i = 0; i < 10; i++) { const p = (t * 0.7 + i * 0.1) % 1; ctx.fillStyle = 'rgba(180,220,255,' + (1 - p) * 0.8 + ')'; ctx.beginPath(); ctx.arc(840 + i * 24 + Math.sin(t * 3 + i) * 6, 150 + p * 160, 3, 0, 7); ctx.fill(); }
      // placa CBV
      ctx.fillStyle = '#1f5fbf'; ctx.fillRect(1180, 100, 300, 110);
      ctx.fillStyle = '#fff'; ctx.font = '28px "Press Start 2P", monospace'; ctx.fillText('CBV', 1255, 148);
      ctx.font = '9px "Press Start 2P", monospace'; ctx.fillText('HOSPITAL DE OLHOS', 1198, 180);
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(1215, 140, 10, 0, 7); ctx.fill(); ctx.fillStyle = '#1f5fbf'; ctx.beginPath(); ctx.arc(1215, 140, 5, 0, 7); ctx.fill();
      // pôsteres: CR7 e Senna
      poster(ctx, 1540, 90, '#c62828', 'CR7', 'SIUUU', '#fff');
      poster(ctx, 1700, 90, '#ffd600', 'SENNA', 'F1', '#1b5e20');
      // placas das portas
      placa(ctx, 20, 300, 'QUITAÇÃO'); placa(ctx, 1920, 300, 'GESTÃO ESTR.');
      ctx.fillStyle = '#8d6e63'; ctx.fillRect(-40, 330, 150, chao - 354); ctx.fillRect(1900, 330, 150, chao - 354);
      ctx.restore();
      ctx.save(); ctx.translate(-cam, 0); // móveis (plano médio)
      mesa(ctx, 560, chao, t, 'PENDÊNCIAS.xlsx'); mesa(ctx, 1180, chao, t, 'REPASSE_v27_FINAL.xlsx');
      impressora(ctx, 960, chao, t);
      ctx.restore();
      // chão
      ctx.fillStyle = '#b7b2a4'; ctx.fillRect(0, chao, W, H - chao);
      ctx.strokeStyle = 'rgba(0,0,0,.12)'; ctx.lineWidth = 2;
      for (let x = -((cam) % 120); x < W; x += 120) { ctx.beginPath(); ctx.moveTo(x, chao); ctx.lineTo(x - 60, H); ctx.stroke(); }
      ctx.beginPath(); ctx.moveTo(0, chao); ctx.lineTo(W, chao); ctx.stroke();
    },
  },
  reuniao: {
    id: 'reuniao', nome: 'Sala de Reunião', sub: 'Fechamento do mês, 17h58', largura: 1800, chao: 650, musica: 'boss',
    draw(ctx, cam, t, W, H) {
      const chao = this.chao;
      ctx.fillStyle = '#1b2230'; ctx.fillRect(0, 0, W, chao);
      ctx.save(); ctx.translate(-cam * 0.6, 0);
      // telão com DRE
      ctx.fillStyle = '#0d1117'; ctx.fillRect(430, 70, 900, 330); ctx.fillStyle = '#e6edf3'; ctx.fillRect(446, 86, 868, 298);
      ctx.fillStyle = '#1f5fbf'; ctx.fillRect(446, 86, 868, 36);
      ctx.fillStyle = '#fff'; ctx.font = '12px "Press Start 2P", monospace'; ctx.fillText('DRE GERENCIAL - ORÇADO x REALIZADO', 470, 110);
      const linhas = [['Receita Bruta', '12.480', '11.930', '-4,4%'], ['(-) Glosas', '(610)', '(1.240)', '+103%'], ['Repasse Médico', '(4.100)', '(4.380)', '+6,8%'], ['Desp. Operacionais', '(5.200)', '(5.150)', '-1,0%'], ['EBITDA', '2.570', '1.160', '-54,9%']];
      ctx.font = '9px "Press Start 2P", monospace';
      linhas.forEach((l, i) => { const y = 150 + i * 36; ctx.fillStyle = i === 4 ? '#b71c1c' : '#222'; ctx.fillText(l[0], 470, y); ctx.fillText(l[1], 850, y); ctx.fillText(l[2], 1010, y); ctx.fillStyle = l[3][0] === '+' && i !== 0 ? '#b71c1c' : (l[3][0] === '-' ? '#b71c1c' : '#2e7d32'); ctx.fillText(l[3], 1180, y); });
      ctx.fillStyle = '#b71c1c'; ctx.fillRect(1080, 330, 220, 40); ctx.fillStyle = '#fff'; ctx.font = '10px "Press Start 2P", monospace'; ctx.fillText(Math.floor(t * 2) % 2 ? 'PRAZO: HOJE' : '', 1100, 356);
      // relógio
      ctx.fillStyle = '#eee'; ctx.beginPath(); ctx.arc(250, 160, 60, 0, 7); ctx.fill(); ctx.strokeStyle = '#333'; ctx.lineWidth = 4; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(250, 160); ctx.lineTo(250 + Math.cos(-Math.PI / 2 + (17.97 / 12) * 2 * Math.PI) * 32, 160 + Math.sin(-Math.PI / 2 + (17.97 / 12) * 2 * Math.PI) * 32); ctx.stroke();
      const ang = -Math.PI / 2 + ((58 + t / 60) / 60) * 2 * Math.PI; ctx.beginPath(); ctx.moveTo(250, 160); ctx.lineTo(250 + Math.cos(ang) * 50, 160 + Math.sin(ang) * 50); ctx.stroke();
      // quadro branco
      ctx.fillStyle = '#fafafa'; ctx.fillRect(1450, 90, 420, 260); ctx.strokeStyle = '#999'; ctx.strokeRect(1450, 90, 420, 260);
      ctx.fillStyle = '#1565c0'; ctx.font = '11px "Press Start 2P", monospace'; ctx.fillText('FECHAMENTO: D-0', 1475, 130); ctx.fillText('- conciliar', 1475, 170); ctx.fillText('- glosas', 1475, 200); ctx.fillText('- repasse', 1475, 230);
      ctx.fillStyle = '#c62828'; ctx.fillText('- NÃO MEXER NO AR', 1475, 270); ctx.fillText('- CAFÉ ACABOU', 1475, 300);
      ctx.restore();
      ctx.save(); ctx.translate(-cam, 0);
      // mesa de reunião comprida
      ctx.fillStyle = '#4e342e'; ctx.fillRect(300, chao - 150, 1200, 22); ctx.fillStyle = '#3e2723'; ctx.fillRect(340, chao - 128, 30, 128); ctx.fillRect(1430, chao - 128, 30, 128);
      ctx.fillStyle = '#263238'; for (let i = 0; i < 6; i++) ctx.fillRect(360 + i * 200, chao - 170, 60, 20);
      ctx.restore();
      ctx.fillStyle = '#2b3442'; ctx.fillRect(0, chao, W, H - chao);
      ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(0, chao, W, 6);
    },
  },
};
window.STAGE_ORDER = ['financeiro', 'reuniao'];

function poster(ctx, x, y, bg, big, small, fg) {
  ctx.fillStyle = '#222'; ctx.fillRect(x - 4, y - 4, 128, 168); ctx.fillStyle = bg; ctx.fillRect(x, y, 120, 160);
  ctx.fillStyle = fg; ctx.font = '18px "Press Start 2P", monospace'; ctx.fillText(big, x + 60 - big.length * 9, y + 70);
  ctx.font = '12px "Press Start 2P", monospace'; ctx.fillText(small, x + 60 - small.length * 6, y + 120);
}
function placa(ctx, x, y, txt) { ctx.fillStyle = '#1f5fbf'; ctx.fillRect(x, y, 150, 26); ctx.fillStyle = '#fff'; ctx.font = '8px "Press Start 2P", monospace'; ctx.fillText(txt, x + 8, y + 17); }
function mesa(ctx, x, chao, t, arquivo) {
  ctx.fillStyle = '#d7ccc8'; ctx.fillRect(x, chao - 120, 320, 16); ctx.fillStyle = '#a1887f'; ctx.fillRect(x + 10, chao - 104, 14, 104); ctx.fillRect(x + 296, chao - 104, 14, 104);
  for (let m = 0; m < 2; m++) {
    const mx = x + 30 + m * 150; ctx.fillStyle = '#222'; ctx.fillRect(mx, chao - 220, 130, 92); ctx.fillStyle = '#e8f0fe'; ctx.fillRect(mx + 6, chao - 214, 118, 80);
    ctx.strokeStyle = '#bcd'; ctx.lineWidth = 1; for (let i = 1; i < 6; i++) { ctx.beginPath(); ctx.moveTo(mx + 6, chao - 214 + i * 13); ctx.lineTo(mx + 124, chao - 214 + i * 13); ctx.stroke(); }
    for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(mx + 6 + i * 30, chao - 214); ctx.lineTo(mx + 6 + i * 30, chao - 134); ctx.stroke(); }
    ctx.fillStyle = m === 1 && Math.floor(t * 1.5) % 2 ? '#ffcdd2' : '#c8e6c9'; ctx.fillRect(mx + 6, chao - 214 + 26, 118, 13);
    ctx.fillStyle = '#333'; ctx.fillRect(mx + 55, chao - 128, 20, 8); ctx.fillRect(mx + 40, chao - 120, 50, 4);
  }
  ctx.fillStyle = '#555'; ctx.font = '7px "Press Start 2P", monospace'; ctx.fillText(arquivo, x + 36, chao - 226);
  // caneca e pilha de guias
  ctx.fillStyle = '#fff'; ctx.fillRect(x + 250, chao - 150, 26, 30); ctx.fillStyle = '#eee'; for (let i = 0; i < 6; i++) ctx.fillRect(x + 285 - i, chao - 132 - i * 4, 36, 4);
}
function impressora(ctx, x, chao, t) {
  ctx.fillStyle = '#9e9e9e'; ctx.fillRect(x, chao - 90, 120, 70); ctx.fillStyle = '#757575'; ctx.fillRect(x + 10, chao - 100, 100, 12);
  ctx.fillStyle = '#eee'; ctx.fillRect(x + 20, chao - 60, 80, 6);
  ctx.fillStyle = Math.floor(t * 3) % 2 ? '#f44336' : '#7f0000'; ctx.fillRect(x + 100, chao - 82, 10, 10);
  ctx.fillStyle = '#eee'; ctx.font = '7px "Press Start 2P", monospace'; ctx.fillText('SEM PAPEL', x + 14, chao - 72);
}
