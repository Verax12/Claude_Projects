/**
 * Sítio: Circo Máximo (Circus Maximus) no início de 44 a.C.
 *
 * Estado representado (docs/pesquisa/10-circo-topografia.md §1, "Proposta de modelagem"):
 *   - circo reformado por César em 46 a.C.: prolongado nas duas extremidades e cercado por um
 *     euripus (fosso de água) de 10 pés (Suet. Iul. 39.2; Plín. NH 8.21; Dion. 3.68.2);
 *   - dimensões de Dionísio (c. 8 a.C., usadas como aproximação): 621 × 118 m, eixo 126°/306°,
 *     carceres a ONO (Forum Boarium), meia-lua a ESE;
 *   - 12 carceres abobadadas com corda única (número ⚠ não confirmado), metas leves e desmontáveis
 *     (retiradas em 46 a.C.), contadores de voltas (ova, desde 174 a.C.), estátuas sobre colunas;
 *   - arquibancadas de pedra embaixo e de madeira em cima, pórtico externo com lojas e moradias
 *     (estado augustano de Dionísio, rotulado como hipótese);
 *   - templos de Ceres (com Líber e Líbera) e de Mercúrio na encosta do Aventino (volumes toscanos);
 *   - altar de Conso e edícula de Múrcia (formas e posições hipotéticas).
 *   SEM obelisco (Augusto), SEM golfinhos (Agripa, 33 a.C.), SEM Arco de Tito.
 *
 * Organização: src/sites/circo-maximo/ (plan.js = números; cavea.js; arena.js; temples.js; quadriga.js).
 */
import { SITE_AREAS } from '../data/layout.js';
import {
  CENTER, ROT, Y0, FLOOR, R, H, XC, CURVE, CARCERES, STANDS_X0, RUN_X0, BLOCKS, MODS, MOD_W, VOM_MOD, META_X,
  STONE_ROWS as SR, WOOD_ROWS as WR, toWorld, curveAngle, worldBearing,
} from './circo-maximo/plan.js';
import { CaveaBuilder } from './circo-maximo/cavea.js';
import { arenaOutline, buildArenaFloor, buildCarceres, buildSpina, buildStertiniusArch, buildShrines } from './circo-maximo/arena.js';
import { buildTemples, TEMPLES, TERRACE_Y, terraceRect } from './circo-maximo/temples.js';
import { buildQuadrigae } from './circo-maximo/quadriga.js';

const ID = 'circo-maximo';

/** Retângulo do quadro do circo → polígono do mundo. */
function rectWorld(X0, X1, Z0, Z1) {
  return [toWorld(X0, Z0), toWorld(X1, Z0), toWorld(X1, Z1), toWorld(X0, Z1)].map((p) => [p.x, p.z]);
}

/** Pontos (X, Z) do quadro do circo → [[x, z]] do mundo (com y opcional). */
function W(pts) {
  return pts.map((p) => {
    const w = toWorld(p[0], p[1]);
    return p.length === 3 ? [w.x, p[2], w.z] : [w.x, w.z];
  });
}

/** Lista de X dos vomitórios dos lados retos (iguais nos dois lados). */
function vomitoriaX() {
  const xs = [];
  for (let blk = 0; blk < BLOCKS; blk++) xs.push(RUN_X0 + blk * MODS * MOD_W + (VOM_MOD + 0.5) * MOD_W);
  return xs;
}

/** Ponto (X, Z) a raio r no ângulo φ da meia-lua. */
const onCurve = (r, phi) => [XC + r * Math.cos(phi), r * Math.sin(phi)];

export default {
  id: ID,
  name: 'Circo Máximo',

  /** Nivelamento do vale, fosso rebaixado sob a arena e terraços dos templos. */
  shapeTerrain(ctx) {
    const area = SITE_AREAS[ID][0];
    // fundo do vale nivelado (cota da arena: HIPÓTESE, nota 10 §2 — NÃO ENCONTRADA)
    ctx.terrain.addPad({ points: area, height: Y0, blend: 30 });
    // terreno rebaixado sob a arena e o fosso (o piso da arena é construído por cima; o fundo do
    // euripus fica 10 pés abaixo dele)
    const low = arenaOutline(R.euripus + 0.05, STANDS_X0).map(([X, Z]) => {
      const p = toWorld(X, Z);
      return [p.x, p.z];
    });
    ctx.terrain.addPad({ points: low, height: Y0 + H.channel, blend: 0 });
    // terraços dos templos na encosta do Aventino
    for (const t of Object.values(TEMPLES)) {
      const tr = terraceRect(t);
      ctx.terrain.addPad({ points: rectWorld(tr.X0, tr.X1, tr.Z0, tr.Z1), height: TERRACE_Y, blend: 6 });
      // reserva: terraço + escadaria até a rua do circo
      ctx.reserve({ points: rectWorld(tr.X0 - 2, tr.X1 + 2, 68, tr.Z1 + 4) });
    }
    ctx.reserve({ points: area });
  },

  build(ctx) {
    // ------------------------------------------------------------------ builders
    // estrutura principal em blocos espaciais (culling por trecho); detalhes só de perto
    const main = ctx.builder(`${ID}:cavea`, { chunkSize: 220 });
    const det = ctx.builder(`${ID}:detalhes`, { maxDistance: 110, chunkSize: 120, castShadow: false });
    const arenaB = ctx.builder(`${ID}:arena`, { chunkSize: 260 });
    const temB = ctx.builder(`${ID}:templos`);
    const temDet = ctx.builder(`${ID}:templos-detalhes`, { maxDistance: 140, castShadow: false });
    for (const b of [main, det, arenaB, temB, temDet]) b.push(CENTER.x, 0, CENTER.z, ROT);

    // ------------------------------------------------------------------ cávea, lojas, pórtico
    const cv = new CaveaBuilder(ctx, { main, det });
    cv.side(-1); // Palatino
    cv.side(1); // Aventino
    cv.curve((c, sh) => buildStertiniusArch(c, sh));

    // ------------------------------------------------------------------ arena e carceres
    buildArenaFloor(arenaB);
    buildCarceres(arenaB, det, ctx);
    buildSpina(arenaB, det);
    buildShrines(arenaB);

    // ------------------------------------------------------------------ templos do Aventino
    const tem = buildTemples(temB, temDet, ctx);

    for (const b of [main, det, arenaB, temB, temDet]) {
      b.pop();
      b.finish();
    }

    // ------------------------------------------------------------------ cena viva
    const q = buildQuadrigae(ctx);
    this.people(ctx, cv, q, tem);
    this.sounds(ctx);
    this.texts(ctx, tem);
    this.trees(ctx, tem);
  },

  /* ---------------------------------------------------------------------- */
  /*  NPCs                                                                  */
  /* ---------------------------------------------------------------------- */
  people(ctx, cv, q, tem) {
    const npcs = ctx.npcs;
    const vx = vomitoriaX();
    const rStreet = (R.portico + R.street1) / 2; // 66,6
    const rPort = (R.facade + R.colonnade) / 2 - 0.3; // 60,9
    const rPraec = (R.praec0 + R.back) / 2; // 51,4
    const yPraec = Y0 + H.praec;
    const curveVomPhi = CURVE.vomitoria.map((k) => curveAngle(k));
    const curveStep = (r) => {
      const pts = [];
      for (let k = 0; k <= CURVE.n; k += 1) {
        const phi = curveAngle(k, 0);
        pts.push(onCurve(r, phi));
        if (k < CURVE.n && CURVE.vomitoria.includes(k)) pts.push(onCurve(r, curveAngle(k)));
      }
      return pts;
    };
    /** Volta completa a raio r (lados retos com nós nos vomitórios + meia-lua). */
    const loop = (r, xStart, yy = null) => {
      const pal = [[xStart, -r], ...vx.map((x) => [x, -r])];
      const ave = [...vx.slice().reverse().map((x) => [x, r]), [xStart, r]];
      const pts = [...pal, ...curveStep(r), ...ave];
      return pts.map((p) => (yy == null ? p : [p[0], p[1], yy]));
    };
    const mixStreet = { citizen: 4, woman: 3, slave: 3, merchant: 1.5, child: 1, senator: 0.2 };
    // rua em volta do circo (fecha pela praça das carceres)
    npcs.addPath(W(loop(rStreet, CARCERES.back - 7)), { loop: true, density: 1.6, width: 4.5, mix: mixStreet, name: 'circo-rua' });
    // pórtico das lojas
    npcs.addPath(W(loop(rPort, RUN_X0 + 1)), { loop: false, density: 1.2, width: 2, mix: { citizen: 3, woman: 3, slave: 2, merchant: 2, child: 1 }, name: 'circo-portico' });
    // corredor (praecinctio) das arquibancadas
    npcs.addPath(W(loop(rPraec, RUN_X0 + 2, yPraec)), { loop: false, density: 0.5, width: 1.0, mix: { citizen: 3, woman: 2, child: 1.5, slave: 1 }, name: 'circo-cavea' });
    // ligações rua → pórtico → escada do vomitório → corredor (pontos [X, Z] ou [X, Z, y])
    const spur = (X, sd) => [[X, sd * rStreet], [X, sd * rPort], [X, sd * (R.facade + 0.2), Y0], [X, sd * (R.back - 0.1), yPraec], [X, sd * rPraec, yPraec]];
    for (const [i, X] of vx.entries()) {
      if (i % 3 !== 1) continue;
      for (const sd of [-1, 1]) npcs.addPath(W(spur(X, sd)), { density: 1, width: 1.2 });
    }
    for (const phi of curveVomPhi.filter((_, i) => i % 2 === 0)) {
      const pts = [onCurve(rStreet, phi), onCurve(rPort, phi), [...onCurve(R.facade + 0.2, phi), Y0], [...onCurve(R.back - 0.1, phi), yPraec], [...onCurve(rPraec, phi), yPraec]];
      npcs.addPath(W(pts), { density: 1, width: 1.2 });
    }
    // trabalhadores na arena (escravos alisando a areia) — caminho lento em volta da barreira
    const ar = [[META_X[0] - 22, 0], [META_X[0], 24], [0, 26], [META_X[1], 24], [META_X[1] + 22, 0], [META_X[1], -24], [0, -26], [META_X[0], -24]];
    npcs.addPath(W(ar), { loop: true, density: 0.35, width: 6, mix: { slave: 4, citizen: 1 }, name: 'circo-arena' });
    // praça das carceres → arena (pelo portão central) e rumo ao Velabro / Forum Boarium (junção do LAYOUT)
    npcs.addPath(W([[CARCERES.back - 7, -rStreet], [CARCERES.back - 7, 0], [CARCERES.back + 1, 0], [CARCERES.front + 3, 0], [META_X[0] - 22, 0]]), { density: 1.2, width: 3, mix: mixStreet });
    {
      const plaza = toWorld(CARCERES.back - 7, 0);
      const mid = toWorld(CARCERES.back - 70, -40);
      npcs.addPath([[plaza.x, plaza.z], [mid.x, mid.z], [-260, 420]], { density: 1.5, width: 4, mix: mixStreet, name: 'circo-velabro' });
    }
    // escadarias dos templos
    for (const t of Object.values(tem)) {
      const X = t.t.X;
      const zPorch = t.t.Z - t.t.length / 2 + 1.5;
      npcs.addPath(W([[X, rStreet], [X, 70.6, Y0], [X, 87.2, TERRACE_Y], [X, 89.6, TERRACE_Y], [X + 2.5, 89.8, TERRACE_Y], [X + 2.5, zPorch - (t.t.stairs.depth + 0.5), TERRACE_Y], [X + 2.5, zPorch, TERRACE_Y + t.t.podium]]), { density: 1, width: 2, mix: { citizen: 3, woman: 3, slave: 1, child: 0.5 } });
    }

    // estáticos ------------------------------------------------------------
    for (const m of cv.merchants) npcs.addStatic(m);
    // espectadores sentados nas fileiras (pés na fileira de baixo)
    const rng = ctx.rng(4603);
    const sitAt = (X, s, row, wood = false) => {
      const rows = wood ? WR : SR;
      const r0 = wood ? R.back : R.seat0;
      const yb = wood ? Y0 + H.praec : Y0 + H.podium;
      const rr = r0 + rows.d * row + 0.22;
      const p = toWorld(X, s * rr);
      const face = toWorld(X, s * (rr - 1));
      npcs.addStatic({ x: p.x, z: p.z, y: yb + rows.h * row, yaw: Math.atan2(face.x - p.x, face.z - p.z), type: ['citizen', 'woman', 'citizen', 'child', 'slave'][Math.floor(rng() * 5)], pose: 'sit' });
    };
    for (let i = 0; i < 14; i++) sitAt(-280 + i * 38 + rng() * 10, -1, 1 + Math.floor(rng() * 6));
    for (let i = 0; i < 6; i++) sitAt(-240 + i * 80 + rng() * 10, 1, 1 + Math.floor(rng() * 6));
    for (let i = 0; i < 4; i++) sitAt(-200 + i * 120 + rng() * 10, -1, 2 + Math.floor(rng() * 6), true);
    // escravos alisando a areia com rodos (pose de trabalho)
    for (const [X, Z] of [[-240, 10], [-232, -12], [-90, 30], [160, -28], [250, 8]]) {
      const p = toWorld(X, Z);
      npcs.addStatic({ x: p.x, z: p.z, y: FLOOR, yaw: rng() * 6.28, type: 'slave', pose: 'work' });
    }
    // tratadores junto aos cavalos parados (praça das carceres)
    for (const g of q.grooms) {
      const p = toWorld(g.X, g.Z);
      npcs.addStatic({ x: p.x, z: p.z, y: FLOOR, yaw: rng() * 6.28, type: 'slave', pose: 'gesture' });
    }
    // adivinho no pórtico (Horácio: o "Circo enganador", Sat. 1.6.113) e ouvintes
    {
      const X = -205;
      const c = toWorld(X, -rPort);
      npcs.addStatic({ x: c.x, z: c.z, y: Y0, yaw: 0, type: 'citizen', pose: 'gesture' });
      for (const [dx, dz] of [[1.2, 0.5], [-1.1, 0.7], [0.2, 1.3]]) {
        const p = toWorld(X + dx, -rPort + dz);
        npcs.addStatic({ x: p.x, z: p.z, y: Y0, yaw: Math.atan2(c.x - p.x, c.z - p.z), type: ['woman', 'citizen', 'slave'][Math.floor(rng() * 3)], pose: 'stand' });
      }
    }
    // sacerdote/oferente diante do altar de Ceres
    {
      const t = tem.ceres;
      const p = toWorld(t.t.X + 1.2, t.zAltarCircus - 1.0);
      const a = toWorld(t.t.X, t.zAltarCircus);
      npcs.addStatic({ x: p.x, z: p.z, y: TERRACE_Y, yaw: Math.atan2(a.x - p.x, a.z - p.z), type: 'citizen', pose: 'gesture' });
    }
  },

  /* ---------------------------------------------------------------------- */
  /*  Som ambiente                                                          */
  /* ---------------------------------------------------------------------- */
  sounds(ctx) {
    const A = ctx.audio;
    const at = (X, Z) => toWorld(X, Z);
    for (const X of [-220, -60, 100]) {
      const p = at(X, -61);
      A.addZone({ x: p.x, z: p.z, radius: 45, type: 'market', gain: 0.45 });
    }
    for (const X of [-150, 50, 200]) {
      const p = at(X, 61);
      A.addZone({ x: p.x, z: p.z, radius: 45, type: 'market', gain: 0.35 });
    }
    const apex = at(XC + 62, 0);
    A.addZone({ x: apex.x, z: apex.z, radius: 50, type: 'market', gain: 0.5 });
    const carc = at(CARCERES.back - 4, 0);
    A.addZone({ x: carc.x, z: carc.z, radius: 45, type: 'animals', gain: 0.7 });
    A.addZone({ x: carc.x, z: carc.z, radius: 40, type: 'crowd', gain: 0.4 });
    const mid = at(40, 0);
    A.addZone({ x: mid.x, z: mid.z, radius: 38, type: 'quiet', gain: 0.6 });
    for (const t of Object.values(TEMPLES)) {
      const p = at(t.X, t.Z);
      A.addZone({ x: p.x, z: p.z, radius: 22, type: 'quiet', gain: 0.6 });
    }
  },

  /* ---------------------------------------------------------------------- */
  /*  Teleporte, áreas e painéis                                            */
  /* ---------------------------------------------------------------------- */
  texts(ctx, tem) {
    const area = SITE_AREAS[ID][0];
    const yPraec = Y0 + H.praec;
    // teleporte: corredor da arquibancada do lado do Palatino, olhando a arena rumo à meia-lua
    const tp = toWorld(-40, -(R.praec0 + R.back) / 2);
    ctx.addLocation({
      id: ID,
      name: 'Circo Máximo',
      latin: 'Circus Maximus',
      group: 'Arredores',
      x: tp.x,
      z: tp.z,
      y: yPraec,
      lookBearing: Math.round(worldBearing(0.8, 0.6)),
    });

    // áreas nomeadas
    ctx.addArea({ name: 'Circo Máximo', latin: 'Circus Maximus', points: area, priority: 2 });
    ctx.addArea({ name: 'Arena do Circo Máximo', latin: 'Harena', points: W(arenaOutline()), priority: 3 });
    ctx.addArea({ name: 'Carceres (partidas)', latin: 'Carceres', points: rectWorld(CARCERES.back - 2, STANDS_X0, -CARCERES.halfWidth - 2, CARCERES.halfWidth + 2), priority: 4 });
    ctx.addArea({ name: 'Templo de Ceres, Líber e Líbera', latin: 'Aedes Cereris, Liberi Liberaeque', points: rectWorld(terraceRect(TEMPLES.ceres).X0, terraceRect(TEMPLES.ceres).X1, 86, terraceRect(TEMPLES.ceres).Z1), priority: 4 });
    ctx.addArea({ name: 'Templo de Mercúrio', latin: 'Aedes Mercurii', points: rectWorld(terraceRect(TEMPLES.mercurius).X0, terraceRect(TEMPLES.mercurius).X1, 86, terraceRect(TEMPLES.mercurius).Z1), priority: 4 });
    ctx.addArea({ name: 'Vale de Múrcia', latin: 'Vallis Murciae', points: rectWorld(-345, 345, -100, 100), priority: 0 });

    const SRC_DION = 'Dionísio de Halicarnasso, Ant. Rom. 3.68.1–4 (c. 8 a.C.)';
    const NOTE = 'docs/pesquisa/10-circo-topografia.md';
    const info = (X, Z, o) => {
      const p = toWorld(X, Z);
      ctx.addInfo({ x: p.x, z: p.z, ...o });
    };

    info(-40, -(R.praec0 + R.back) / 2, {
      y: yPraec,
      radius: 26,
      title: 'Circo Máximo',
      latin: 'Circus Maximus',
      date: 'Reformado por César em 46 a.C. — cena do início de 44 a.C.',
      text: [
        'O maior hipódromo de Roma ocupa o vale entre o Palatino e o Aventino, o vale "de Múrcia". Segundo a tradição, Tarquínio Prisco demarcou o lugar, e senadores e cavaleiros armavam ali as próprias arquibancadas (fori), sobre forquilhas de 12 pés (Lívio 1.35.8–9).',
        'Nos jogos do triunfo de 46 a.C., César prolongou o espaço do circo dos dois lados e cercou a arena com um fosso de água, o euripus (Suetônio, Iul. 39.2). Plínio atribui a "César ditador" um circo de 3 estádios de comprimento por 1 de largura (NH 36.102).',
        'As medidas usadas aqui são as de Dionísio de Halicarnasso: 3,5 estádios por 4 plethra (cerca de 621 × 118 m), para 150 mil espectadores (3.68.2–3).',
      ],
      uncertain:
        'Reconstrução hipotética: Dionísio descreve o circo c. 8 a.C., algumas décadas depois; o estado exato de 46–44 a.C. é incerto. A conversão das medidas (621 × 118 m ou ~647 × 123 m), a largura da arena (~80 m, estimativa de baixa confiança) e o rumo do eixo (126°, tirado do relevo moderno) não estão confirmados; a cota antiga da arena não foi encontrada. Os 250 ou 260 mil lugares de Plínio vêm de texto corrupto.',
      sources: [SRC_DION, 'Suetônio, Divus Iulius 39.2–3', 'Plínio, NH 8.20–22; 36.102', 'Lívio 1.35.8–9', 'Pleiades 458808506', NOTE],
    });

    info(-110, -(R.euripus + R.seat0) / 2, {
      radius: 22,
      title: 'Euripus — o fosso de César',
      latin: 'Euripus',
      date: '46 a.C.',
      text: [
        'Nos jogos de Pompeu, em 55 a.C., vinte elefantes tentaram romper as grades de ferro que separavam a arena do público. Por isso César, ao preparar espetáculo semelhante, cercou a arena com euripos — que Nero suprimiria para dar lugares aos cavaleiros (Plínio, NH 8.20–21).',
        'Dionísio dá ao fosso 10 pés de largura e de profundidade (≈ 2,96 m), nos dois lados longos e na curva, mas não do lado das carceres (3.68.2).',
        'Na batalha de 46 a.C. lutaram de cada lado 500 infantes, 20 elefantes e 30 cavaleiros; Dião Cássio fala em 40 elefantes no hipódromo (Suet. Iul. 39.3; Plín. NH 8.22; Dião 43.23.3–6).',
      ],
      uncertain: 'Reconstrução hipotética: o revestimento de pedra, o parapeito do pódio, as escadas de manutenção e o nível da água são suposições de modelagem.',
      sources: ['Plínio, NH 8.20–22', 'Suetônio, Iul. 39.2–3', SRC_DION, 'Dião Cássio 43.23.3–6', NOTE],
    });

    info(CARCERES.front + 3, 0, {
      radius: 20,
      title: 'Carceres — os boxes de largada',
      latin: 'Carceres',
      date: '329 a.C.; refeitas em 174 a.C.',
      text: [
        'As primeiras carceres do circo foram erguidas em 329 a.C. (Lívio 8.20.2). Em 174 a.C. os censores contrataram novas carceres, os ovos para contar as voltas e as metas (Lívio 41.27.6).',
        'Dionísio descreve partidas abobadadas, todas abertas ao mesmo tempo por uma única corda; este lado curto do circo fica a céu aberto, sem arquibancadas (3.68.3–4).',
        'Por aqui chegava a procissão dos jogos (pompa circensis), que descia do Fórum pelo Velabro (Ovídio, Fastos 6.405).',
      ],
      uncertain:
        'Reconstrução hipotética: o número de 12 carceres vem de Platner (via resumo de busca, sem fase indicada, não confirmado); material, forma, portão central e passagens laterais em 46 a.C. não foram encontrados. As pequenas hermas que seguram a corda seguem a descrição de Platner.',
      sources: ['Lívio 8.20.2; 41.27.6', SRC_DION, 'Ovídio, Fastos 6.405', 'Platner–Ashby, "Circus Maximus" (via resumo de busca)', NOTE],
    });

    info(META_X[0] + 18, 0, {
      radius: 26,
      title: 'Metas e contadores de voltas',
      latin: 'Metae et ova',
      date: 'desde 174 a.C.',
      text: [
        'As metas — os marcos de virada — e os ovos que contavam as voltas existem desde a empreitada dos censores de 174 a.C. (Lívio 41.27.6).',
        'Em 46 a.C. as metas foram retiradas para a batalha, e em seu lugar armaram-se dois acampamentos frente a frente (Suetônio, Iul. 39.3); por isso aqui elas aparecem leves e desmontáveis.',
        'Ainda não existem o obelisco de Augusto nem os golfinhos contadores postos por Agripa em 33 a.C. (Plínio, NH 36.71; Dião Cássio 49.43.2).',
      ],
      uncertain:
        'Reconstrução hipotética: a forma da barreira central em 46 a.C. é desconhecida; posições, forma cônica e material das metas e o suporte dos ovos são suposições. As estátuas sobre colunas lembram as que uma tempestade derrubou em 182 a.C. "no Circo Máximo, com as colunas" (Lívio 40.2.2), em lugar desconhecido.',
      sources: ['Lívio 40.2.2; 41.27.6', 'Suetônio, Iul. 39.3', 'Plínio, NH 36.71', 'Dião Cássio 49.43.2', NOTE],
    });

    info(60, -(R.praec0 + R.back) / 2, {
      y: yPraec,
      radius: 22,
      title: 'Arquibancadas de pedra e de madeira',
      latin: 'Cavea',
      text: [
        'Atrás do euripus, Dionísio descreve stoas de três andares: as de baixo com assentos de pedra que sobem pouco a pouco, como nos teatros; as de cima com assentos de madeira. Os dois lados longos e a meia-lua formam uma única stoa de 8 estádios (3.68.2–3).',
        'Na tradição régia, os lugares eram repartidos por cúrias (Dion. 3.68.1), e as primeiras arquibancadas eram de madeira, armadas por senadores e cavaleiros (Lívio 1.35.8–9; 1.56.2).',
      ],
      uncertain: `Reconstrução hipotética: a divisão pedra/madeira está atestada só c. 8 a.C.; para 46 a.C. é aproximação. Altura total, inclinação e número de fileiras (aqui ${SR.n} de pedra e ${WR.n} de madeira), corredores e escadas não foram encontrados.`,
      sources: [SRC_DION, 'Lívio 1.35.8–9; 1.56.2', NOTE],
    });

    info(-150, -(R.facade + R.colonnade) / 2, {
      radius: 20,
      title: 'Pórtico externo e lojas',
      latin: 'Porticus et tabernae',
      text: [
        'Do lado de fora do hipódromo há outra stoa, de um andar, com lojas e moradias por cima; junto a cada loja há entradas e escadas para os espectadores, para que dezenas de milhares possam entrar e sair sem tumulto (Dionísio 3.68.4).',
        'Ainda em 64 d.C., na extremidade junto ao Palatino e ao Célio, havia lojas cheias de mercadorias inflamáveis — ali começou o grande incêndio (Tácito, Anais 15.38).',
        'Horácio, nos anos 30 a.C., passeava ao entardecer pelo "Circo enganador" e parava junto aos adivinhos (Sátiras 1.6.111–118).',
      ],
      uncertain: 'Reconstrução hipotética: pórtico e lojas estão descritos para c. 8 a.C.; colunas, ritmo de uma escada a cada 7 lojas, mercadorias e cores das fachadas são suposições. A rua de basalto segue a pavimentação das ruas da cidade com silex desde 174 a.C. (Lívio 41.27.5); sua largura não foi encontrada.',
      sources: [SRC_DION, 'Tácito, Anais 15.38', 'Horácio, Sátiras 1.6.111–118', 'Lívio 41.27.5', NOTE],
    });

    info(40, 0, {
      radius: 32,
      title: 'Os jogos de César (46 a.C.)',
      latin: 'Ludi circenses',
      text: [
        'Nos jogos do triunfo, jovens nobilíssimos conduziram quadrigas, bigas e cavalos de saltadores; houve o Jogo de Troia com duas turmas de meninos, caçadas durante cinco dias e, por fim, uma batalha entre dois exércitos com elefantes (Suetônio, Iul. 39.2–3).',
        'Nos mesmos jogos, César mostrou em Roma pela primeira vez uma girafa (Dião Cássio 43.23.1–2). Muitos forasteiros dormiram em tendas pelas ruas, e na multidão morreram esmagadas várias pessoas, entre elas dois senadores (Suet. Iul. 39.4).',
      ],
      uncertain: 'A quadriga e a biga em treino, os tratadores e os escravos alisando a areia são cena ilustrativa (hipotética), não um evento documentado para o início de 44 a.C.',
      sources: ['Suetônio, Iul. 39.2–4', 'Plínio, NH 8.22', 'Dião Cássio 43.23.1–6', NOTE],
    });

    {
      const t = TEMPLES.ceres;
      info(t.X, 92, {
        radius: 24,
        title: 'Templo de Ceres, Líber e Líbera',
        latin: 'Aedes Cereris, Liberi Liberaeque',
        date: 'Dedicado em 494/493 a.C.',
        text: [
          'Na encosta do Aventino, voltado para o circo, fica o templo da tríade plebeia Ceres, Líber e Líbera, dedicado em 494/493 a.C. (Pleiades 581361483).',
          'Vitrúvio o cita como exemplo de templo areostilo "junto ao Circo Máximo": colunas muito espaçadas, epistílio de vigas de madeira, aspecto baixo e largo, frontão ornado à maneira toscana com estátuas de terracota ou de bronze dourado (3.3.5).',
          'Os artistas gregos Damófilo e Górgaso o decoraram com terracotas e pinturas, com versos em grego indicando quem fez cada lado; antes disso, "tudo nos templos era toscano" (Varrão, via Plínio, NH 35.154).',
        ],
        uncertain: `Reconstrução hipotética: posição exata, dimensões, altura do pódio, número de colunas e terraço não foram encontrados. Usaram-se as regras do templo toscano de Vitrúvio (largura = 5/6 do comprimento, três celas, coluna = 1/3 da largura, diâmetro = 1/7 da altura), com ${t.width} × ${t.length} m.`,
        sources: ['Vitrúvio 3.3.5; 4.7.1–5', 'Plínio, NH 35.154; 35.157–158', 'Pleiades 581361483', NOTE, 'docs/pesquisa/11-materiais-pessoas.md §7'],
      });
    }
    {
      const t = TEMPLES.mercurius;
      info(t.X, 92, {
        radius: 20,
        title: 'Templo de Mercúrio',
        latin: 'Aedes Mercurii',
        text: [
          'Os antepassados ergueram a Mercúrio um templo "que olha para o Circo" (templa tibi posuere patres spectantia Circum — Ovídio, Fastos 5.669), na encosta do Aventino (Pleiades 107133090).',
          'Como os templos vizinhos de tradição toscana, aparece com colunas de pedra rebocada, entablamento de madeira e terracotas pintadas no frontão (Vitrúvio 3.3.5; Plínio, NH 35.158).',
        ],
        uncertain: 'Reconstrução hipotética: posição, data, dimensões e forma não foram encontradas nas fontes consultadas; volume toscano simplificado.',
        sources: ['Ovídio, Fastos 5.669', 'Pleiades 107133090', 'Vitrúvio 3.3.5', NOTE],
      });
    }

    info(-240, -72.5, {
      radius: 18,
      title: 'Altar de Conso e santuário de Múrcia',
      latin: 'Ara Consi · sacellum Murciae',
      text: [
        'O sulco do pomério de Rômulo passava pela base do Palatino até o altar de Conso (Tácito, Anais 12.24). A Rômulo atribuía-se a instituição das Consuálias, jogos em honra de Netuno Equestre (Lívio 1.9.6).',
        'O vale do circo era chamado "de Múrcia" (Lívio 1.33.5).',
      ],
      uncertain: 'Reconstrução hipotética: forma e posição do altar (talvez subterrâneo) e do santuário de Múrcia não foram encontradas; seguem a sugestão da nota de pesquisa (no sopé do Palatino, perto das carceres).',
      sources: ['Tácito, Anais 12.24', 'Lívio 1.9.6; 1.33.5', NOTE],
    });

    info(XC + 64, 0, {
      radius: 16,
      title: 'Arco de Stertínio',
      latin: 'Fornix Stertinii',
      date: '196 a.C.',
      text: ['Em 196 a.C., L. Stertínio, de volta da Hispânia, ergueu um arco no Circo Máximo com estátuas douradas, além de dois no Forum Boarium (Lívio 33.27.4).'],
      uncertain: 'Reconstrução hipotética: posição, forma e medidas do arco não foram encontradas; foi posto aqui, diante da entrada do ápice da meia-lua.',
      sources: ['Lívio 33.27.4', NOTE],
    });
  },

  /* ---------------------------------------------------------------------- */
  /*  Vegetação (encosta do Aventino junto aos templos)                     */
  /* ---------------------------------------------------------------------- */
  trees(ctx, tem) {
    const V = ctx.vegetation;
    const rng = ctx.rng(4604);
    for (const t of Object.values(TEMPLES)) {
      const tr = terraceRect(t);
      // par de ciprestes ladeando a escada do templo
      for (const s of [-1, 1]) {
        const p = toWorld(t.X + s * (t.stairs.width / 2 + 2.5), 93);
        V.add('cypress', p.x, p.z, { scale: 0.85 + rng() * 0.2, y: TERRACE_Y });
      }
      // loureiros e arbustos nos cantos do terraço
      for (const [dx, dz] of [[tr.X0 + 2, tr.Z1 - 2], [tr.X1 - 2, tr.Z1 - 2], [tr.X0 + 2, 96], [tr.X1 - 2, 96]]) {
        const p = toWorld(dx, dz);
        V.add(rng() < 0.5 ? 'laurel' : 'shrub', p.x, p.z, { scale: 1 + rng() * 0.4, y: TERRACE_Y });
      }
    }
    // pinheiros-mansos acima dos terraços (encosta do Aventino)
    for (const [X, Z] of [[-245, 134], [-190, 136], [60, 120], [112, 122]]) {
      const p = toWorld(X, Z);
      V.add('pine', p.x, p.z, { scale: 0.8 + rng() * 0.3 });
    }
  },
};
