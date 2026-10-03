# CBV Fighter — Fechamento Edition

Jogo de luta em estilo arcade dos anos 90, ambientado no setor financeiro e contábil do CBV Hospital de Olhos.
Inspirado nas mecânicas do Supremo Tribunal Fighter. Uso interno, sátira leve.

**Protótipo v0.1**: Ludmilla (Quitação) vs Pedro Autista (Gestão Estratégica), dois cenários provisórios, quatro modos.

## Como jogar

- **Pelo navegador (GitHub Pages):** publique a branch e abra o link; roda no PC e no celular.
- **Localmente:** abra `index.html` com duplo clique (não precisa de servidor nem instalação).

### Controles no PC

| Ação | Jogador 1 | Jogador 2 |
|---|---|---|
| Andar / pular | Setas | I J K L |
| Soco | A | U |
| Chute | S | O |
| Poder (golpe próprio) | D | P |
| Defesa (segure) | Z | N |
| Fechamento (especial, barra cheia) | X | M |
| Pausa | ESC | — |

No celular aparecem botões na tela. O jogo pede para girar o aparelho na horizontal.

### Modos

- **Arcade:** enfrenta o elenco em sequência até o chefão (O Convênio, ainda em construção).
- **Duelo Livre:** escolhe lutador, oponente e cenário.
- **Versus 2P:** dois jogadores no mesmo teclado (só no PC).
- **Contra o Relógio (Fechamento):** 3 minutos para quitar o máximo de pendências. Recorde salvo no navegador.

## Estrutura

```
index.html            página única
css/style.css         layout, botões de toque
js/main.js            inicialização, escala do canvas, loop
js/input.js           teclado (P1, P2) e toque
js/audio.js           efeitos e trilha sintetizados + falas em arquivo (opcional)
js/characters.js      elenco: golpes, falas, cores
js/stages.js          cenários desenhados em código
js/fighter.js         lutador: estados, física, golpes, desenho
js/match.js           partida: rounds, HUD, IA, projéteis, modos
js/ui.js              telas: título, menu, seleção, resultado, chefão
assets/sprites/<id>/  parado, soco, chute, defesa, especial, retrato (+ projetil)
assets/voices/<id>/   entrada.mp3, vitoria.mp3, especial.mp3 (opcional)
tools/slice_sprites.py fatia uma folha de 5 poses em sprites separados
```

## Adicionar um personagem

1. Gere a folha com as 5 poses (parado, soco, chute, defesa, golpe especial), fundo transparente, virado para a direita.
2. Fatie: `python3 tools/slice_sprites.py folha.png nome assets/sprites/nome` (requer `pillow`, `numpy`, `scipy`).
3. Regere `assets/sprites/meta.js`: `python3 tools/build_meta.py`.
4. Inclua o bloco em `js/characters.js` e o id em `ROSTER`.

## Falas gravadas

Coloque arquivos MP3 em `assets/voices/<id>/` com os nomes `entrada.mp3`, `vitoria.mp3` e `especial.mp3`.
Se não existirem, o jogo mostra só o balão de texto.

## Próximos passos

- Demais colegas (Tesouraria, Contas a Receber, Ruan).
- Cenários a partir das fotos das salas reais.
- Chefão O Convênio: sete logos que se fundem (Unimed, Bradesco, Seguros Unimed, GEAP, Postal Saúde, INAS, Bombeiros DF).
- Vozes gravadas e sons de golpe personalizados.
