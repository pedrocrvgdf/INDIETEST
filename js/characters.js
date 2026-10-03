// Elenco: dados de cada personagem (setor, golpes, falas, cores). Sprites em assets/sprites/<id>/.
// Para adicionar alguém: fatiar a folha com tools/slice_sprites.py e incluir um bloco aqui.
window.CHARACTERS = {
  ludmilla: {
    id: 'ludmilla', nome: 'Ludmilla', cargo: 'Analista Financeiro Contábil Jr', setor: 'Quitação',
    cor: '#ff3d8f', cor2: '#1b2d5c',
    bio: 'Animada, sorridente e fã do Cristiano Ronaldo. Até a enxaqueca chegar.',
    hp: 100, velocidade: 330, pulo: 880,
    golpes: {
      soco: { nome: 'Soco', dmg: 7, startup: 0.07, active: 0.12, recovery: 0.16, reach: 175, yTop: 300, yBot: 160, kb: 70, pose: 'soco' },
      chute: { nome: 'Chute', dmg: 10, startup: 0.11, active: 0.14, recovery: 0.24, reach: 245, yTop: 340, yBot: 90, kb: 120, pose: 'chute' },
      poder: { nome: 'Garrafada', tipo: 'projetil', dmg: 9, startup: 0.14, recovery: 0.32, vel: 760, alt: 230, kb: 90, pose: 'soco', cooldown: 1.1, sfx: 'throw', descricao: 'Joga a garrafa rosa. Ela sempre volta.' },
      especial: { nome: 'Transferência de Enxaqueca', tipo: 'enxaqueca', dmg: 22, startup: 0.55, recovery: 0.5, vel: 520, alt: 260, kb: 160, pose: 'especial', descricao: 'A dor de cabeça passa... para o oponente. Controles invertidos por 4s.' },
    },
    falas: {
      entrada: 'Bom dia meu povo, bora que bora!',
      entrada_vs: { pedro: 'Me dá um chiclete, Pedro.' },
      vitoria: 'Aeeeeee, e não é que eu consegui!',
      especial: 'Estou com dor de cabeça...',
      provocacoes: ['Quem ligou esse ar aí?', 'Estou com dor de cabeça.', 'SIUUUU!'],
      pressao: '...',
    },
    // Com pouca vida: fica calada, com cara de raiva e cansada (nuvem escura + marca de raiva).
    pressao: 'raiva',
  },
  pedro: {
    id: 'pedro', nome: 'Pedro Autista', cargo: 'Analista de Gestão Estratégica', setor: 'Gestão Estratégica',
    cor: '#2f7fd6', cor2: '#1f1f1f',
    bio: 'Ama F1, Ayrton Senna e falar o que pensa. Ironia não registra.',
    hp: 100, velocidade: 310, pulo: 860,
    golpes: {
      soco: { nome: 'Soco PCD', dmg: 8, startup: 0.08, active: 0.12, recovery: 0.17, reach: 185, yTop: 300, yBot: 160, kb: 80, pose: 'soco' },
      chute: { nome: 'Chute TEA', dmg: 11, startup: 0.12, active: 0.15, recovery: 0.26, reach: 240, yTop: 350, yBot: 80, kb: 130, pose: 'chute' },
      poder: { nome: 'Ultrapassagem', tipo: 'dash', dmg: 10, startup: 0.1, duracao: 0.28, recovery: 0.3, dist: 380, reach: 190, yTop: 300, yBot: 140, kb: 150, pose: 'soco', cooldown: 1.3, sfx: 'charge', descricao: 'Avanço estilo Senna na chuva. Nome provisório.' },
      especial: { nome: 'Poder do Autismo', tipo: 'raio', dmg: 25, startup: 0.4, duracao: 0.6, recovery: 0.45, yTop: 340, yBot: 140, kb: 220, pose: 'especial', descricao: 'Raio óptico de quebra-cabeças. Atravessa a sala inteira.' },
    },
    bloqueio: 'Defesa Capacitista',
    falas: {
      entrada: 'Espero que você tenha falado sério, pois eu não entendo a sua brincadeira.',
      entrada_vs: {},
      vitoria: 'E no final, o poder do autismo prevaleceu.',
      especial: 'É O PODER DO AUTISMO, CARAI!',
      provocacoes: ['Não entendi.', 'O que tu quis dizer com isso?', 'Senna não desistia.'],
      pressao: '...',
    },
    // Com pouca vida: cara de raiva, punhos erguidos, aura dourada (modo sayajin).
    pressao: 'sayajin',
  },
};
window.ROSTER = ['ludmilla', 'pedro'];
// Chefão final (O Convênio) entra quando chegarem os logos. Por ora só aparece como "em breve" no Arcade.
window.BOSS = { id: 'convenio', nome: 'O CONVÊNIO', partes: ['Unimed', 'Bradesco', 'Seguros Unimed', 'GEAP', 'Postal Saúde', 'INAS', 'Bombeiros DF'] };

// Carregamento das imagens.
window.SPRITES = {};
window.loadSprites = function (onProgress) {
  const jobs = [];
  for (const id of ROSTER) {
    SPRITES[id] = {};
    const poses = Object.keys(SPRITE_META[id]).concat(['retrato']);
    for (const pose of poses) {
      jobs.push(new Promise(res => {
        const img = new Image();
        img.onload = () => { SPRITES[id][pose] = img; res(); };
        img.onerror = () => { SPRITES[id][pose] = null; res(); };
        img.src = 'assets/sprites/' + id + '/' + pose + '.png';
      }));
    }
  }
  let done = 0;
  jobs.forEach(j => j.then(() => { done++; onProgress && onProgress(done / jobs.length); }));
  return Promise.all(jobs);
};
