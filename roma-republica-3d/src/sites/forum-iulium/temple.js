/**
 * Templo de Vênus Genetrix (aedes Veneris Genetricis), dedicado em 26/09/46 a.C.
 *
 * Base documental (docs/pesquisa/04 §3–4):
 *   - PICNOSTILO (vão = 1,5 D): Vitrúvio 3.3.2 — único dado arquitetônico antigo do templo pré-trajânico.
 *   - Octastilo, coríntio, períptero sine postico (fundo sem colunas), 8 colunas nos lados
 *     (as fontes divergem entre 8 e 9) — dados das ruínas TRAJÂNICAS, usados como hipótese.
 *   - Pódio alto com frente a pique e duas escadas laterais (ruínas) — hipótese para 46 a.C.
 *   - Mármore (Ovídio, época augustana) — hipótese para a fase cesariana.
 *   - Altura da coluna = 10 D (regra genérica de Vitr. 3.3.10). D NÃO ENCONTRADO → 1,3 m
 *     (o envelope Pleiades das ruínas limita o lado do templo a ~30 m [D]).
 *   - Altura do pódio NÃO ENCONTRADA → 5 m (parâmetro).
 *   - Interior: estátua de culto de Arcesilau (posta inacabada), imagem dourada de Cleópatra,
 *     seis dactilotecas, couraça de pérolas britânicas, quadros de Ájax e Medeia de Timômaco.
 *   - Cella retangular sem abside (abside NÃO ENCONTRADA).
 */
import * as THREE from 'three';
import { column, entablature } from '../../arch/columns.js';
import { gableRoof } from '../../arch/roofs.js';
import { statue } from '../../arch/temple.js';
import { prop } from '../../arch/props.js';
import * as G from '../../render/geom.js';
import { Y, TPL, ORIGIN, ROT } from './frame.js';
import { slopedWall, mat4 } from './helpers.js';

/** Exterior do templo (pódio, escadas, colunas, cella, entablamento, telhado). */
export function buildTemple(ctx) {
  const b = ctx.builder('forum-iulium:templo');
  b.push(ORIGIN.x, 0, ORIGIN.z, ROT);
  const { D, IC, Hc, ZF, xs, halfSpan, podW, podZ0, podZ1, eY, entH } = TPL;
  const base = Y.pave;
  const top = Y.podium;
  const podL = podZ1 - podZ0;
  const podCz = (podZ0 + podZ1) / 2;

  // ---------------- pódio (frente a pique) ----------------
  b.box(podW, top - base + 3, podL, 0, base - 3, podCz, { mat: 'marble' });
  // molduras de base e de coroamento (em volta de todo o pódio)
  b.box(podW + 0.5, 0.5, podL + 0.5, 0, base, podCz, { mat: 'marble', collide: false });
  b.box(podW + 0.3, 0.22, podL + 0.3, 0, base + 0.5, podCz, { mat: 'marble', collide: false });
  b.box(podW + 0.42, 0.42, podL + 0.42, 0, top - 0.42, podCz, { mat: 'marble', collide: false });
  b.box(podW + 0.2, 0.2, podL + 0.2, 0, top - 0.62, podCz, { mat: 'marble', collide: false });
  // pavimento do pódio (pronaos, plataforma frontal e pteromata)
  b.floor(podW - 0.1, podL - 0.1, 0, top + 0.012, podCz, { mat: 'marbleGrey', collide: false });
  // painéis rebaixados na face frontal a pique (ritmo das colunas acima)
  for (let i = 0; i < 7; i++) {
    const x = (xs[i] + xs[i + 1]) / 2;
    b.box(2.3, 2.6, 0.06, x, base + 1.15, podZ1 + 0.01, { mat: 'marbleGrey', collide: false });
  }

  // ---------------- escadas laterais ----------------
  const sh = top - base;
  const sz0 = podZ1; // começo (chão) na linha da frente do pódio
  const sDepth = podZ1 - TPL.stairTop;
  for (const s of [-1, 1]) {
    const cx = s * (podW / 2 + TPL.stairW / 2);
    b.stairs(TPL.stairW, sDepth, sh, cx, base, sz0, { mat: 'marble', steps: 22 });
    // mureta externa inclinada (acompanha os degraus, 1 m acima deles)
    slopedWall(b, s * (podW / 2 + TPL.stairW + 0.25), sz0, TPL.stairTop, base, 1.0, sh + 1.0, 0.5, { mat: 'marble' });
    // patamar no topo e parapeito
    b.box(TPL.stairW + 0.5, sh, 1.6, s * (podW / 2 + (TPL.stairW + 0.5) / 2), base, TPL.stairTop - 0.8, { mat: 'marble' });
    b.box(TPL.stairW + 0.5, 1.0, 0.4, s * (podW / 2 + (TPL.stairW + 0.5) / 2), top, TPL.stairTop - 1.6 + 0.2, { mat: 'marble' });
    b.box(0.5, 1.0, 1.6, s * (podW / 2 + TPL.stairW + 0.25), top, TPL.stairTop - 0.8, { mat: 'marble' });
  }

  // ---------------- colunata (8 na frente, 7 livres + 1 embutida em cada lado) ----------------
  const colO = { order: 'corinthian', height: Hc, diameter: D, mat: 'marble' };
  for (const x of xs) column(b, x, top, ZF, colO);
  for (let k = 1; k <= 6; k++) for (const s of [-1, 1]) column(b, s * halfSpan, top, ZF - k * IC, colO);
  for (const s of [-1, 1]) column(b, s * halfSpan, top, TPL.rearZ + 0.25, { ...colO, collide: false }); // engajadas no muro de fundo

  // ---------------- muro de fundo (sine postico) e cella ----------------
  const outerX = halfSpan + D / 2 + 0.05;
  b.box(outerX * 2, Hc, TPL.rearWall1 - TPL.rearWall0, 0, top, (TPL.rearWall0 + TPL.rearWall1) / 2, { mat: 'marble' });
  const cX = TPL.cellaX;
  const cT = TPL.cellaT;
  const cF = TPL.cellaFront;
  // parede frontal com a grande porta
  b.wall(-cX, cX, cF - cT / 2, Hc, cT, { y: top, mat: 'marble', openings: [{ at: cX, w: 4.2, h: 8.6 }] });
  // paredes laterais
  const sideL = cF - TPL.rearWall1;
  for (const s of [-1, 1]) b.box(cT, Hc, sideL, s * (cX - cT / 2), top, (cF + TPL.rearWall1) / 2, { mat: 'marble' });
  // antas (pilastras) nas extremidades frontais das paredes da cella
  for (const s of [-1, 1]) {
    b.box(1.5, Hc - 1.0, 0.5, s * (cX - 0.75), top, cF + 0.25, { mat: 'marble', collide: false });
    b.box(1.75, 1.0, 0.75, s * (cX - 0.75), top + Hc - 1.0, cF + 0.25, { mat: 'marble', collide: false });
    b.box(1.8, 0.4, 0.8, s * (cX - 0.75), top, cF + 0.25, { mat: 'marble', collide: false });
  }
  // moldura da porta (ombreiras e verga salientes)
  for (const s of [-1, 1]) b.box(0.5, 8.6, 0.25, s * 2.35, top, cF + 0.12, { mat: 'marble', collide: false });
  b.box(5.4, 0.7, 0.3, 0, top + 8.6, cF + 0.14, { mat: 'marble', collide: false });
  b.box(5.8, 0.25, 0.45, 0, top + 9.3, cF + 0.2, { mat: 'marble', collide: false });
  // soleira
  b.box(4.6, 0.08, 1.4, 0, top, cF - cT / 2, { mat: 'marbleGrey', collide: false });
  // portas de bronze abertas para dentro
  for (const s of [-1, 1]) {
    b.push(s * 2.1, top + 0.08, cF - cT, s < 0 ? 1.25 : -1.25);
    b.box(2.08, 8.45, 0.14, -s * 1.04, 0, -0.07, { mat: 'bronze', collide: false });
    for (const yy of [1.4, 4.2, 7.0]) b.box(1.7, 0.08, 0.05, -s * 1.04, yy, 0.02, { mat: 'bronze', collide: false });
    b.pop();
  }

  // ---------------- entablamento ----------------
  const zRear = TPL.rearWall0;
  const zFront = ZF + D * 0.55;
  const L = zFront - zRear;
  const zMid = (zFront + zRear) / 2;
  entablature(b, -outerX, outerX, ZF, D * 1.1, eY, { order: 'corinthian', mat: 'marble', colH: Hc, height: entH });
  for (const s of [-1, 1]) {
    b.push(s * halfSpan, 0, zMid, s > 0 ? Math.PI / 2 : -Math.PI / 2);
    entablature(b, -L / 2, L / 2, 0, D * 1.1, eY, { order: 'corinthian', mat: 'marble', colH: Hc, height: entH, dentils: false });
    b.pop();
  }
  entablature(b, -outerX, outerX, (TPL.rearWall0 + TPL.rearWall1) / 2, 1.0, eY, { order: 'corinthian', mat: 'marble', colH: Hc, height: entH, dentils: false });
  // muro acima da cella até o telhado (fecha o vão entre as paredes da cella e o forro)
  b.box(cX * 2, entH, cT, 0, eY, cF - cT / 2, { mat: 'marble', collide: false });

  // forros de madeira (caixotões) do pronaos e dos pteromata
  const ceilY = eY - 0.25;
  b.box(outerX * 2 - D, 0.25, ZF - cF - 0.2, 0, ceilY, (ZF + cF) / 2, { mat: 'woodDark', collide: false });
  for (const s of [-1, 1]) b.box(halfSpan - cX - 0.1, 0.25, cF - TPL.rearWall1, s * ((halfSpan + cX) / 2), ceilY, (cF + TPL.rearWall1) / 2, { mat: 'woodDark', collide: false });
  for (let i = 0; i < 9; i++) {
    const x = -outerX + D / 2 + ((outerX * 2 - D) * (i + 0.5)) / 9;
    b.box(0.22, 0.32, ZF - cF - 0.2, x, ceilY - 0.32, (ZF + cF) / 2, { mat: 'woodDark', collide: false });
  }
  for (let k = 0; k < 4; k++) b.box(outerX * 2 - D, 0.32, 0.22, 0, ceilY - 0.32, cF + 0.4 + k * 1.6, { mat: 'woodDark', collide: false });

  // ---------------- telhado e frontão ----------------
  gableRoof(b, outerX * 2 + 0.3, L, 0, eY + entH, zMid, {
    pitch: 0.24,
    overhang: 0.55,
    overhangEnds: 0.35,
    mat: 'roofTile',
    gableMat: 'marble',
    cornice: true,
    corniceMat: 'marble',
  });

  b.pop();
  b.finish();
}

/**
 * Cella (interior) — builder de interior: revestimentos, piso, forro, estátuas e oferendas.
 */
export function buildCella(ctx) {
  const b = ctx.builder('forum-iulium:cella', { interior: true, maxDistance: 140 });
  const d = ctx.builder('forum-iulium:cella-detalhe', { interior: true, maxDistance: 45, castShadow: false });
  for (const x of [b, d]) x.push(ORIGIN.x, 0, ORIGIN.z, ROT);
  const top = Y.podium;
  const { Hc, cellaX, cellaT, cellaFront, rearWall1 } = TPL;
  const ix = cellaX - cellaT; // face interna das paredes laterais (7,2)
  const zF = cellaFront - cellaT; // face interna da parede frontal (−0,1)
  const zR = rearWall1; // face interna do muro de fundo (−15,4)
  const depth = zF - zR;
  const zc = (zF + zR) / 2;

  // piso de mármore (lajes cinzentas) com faixa de mármore claro
  b.floor(ix * 2, depth, 0, top + 0.03, zc, { mat: 'marbleGrey' });
  b.floor(ix * 2 - 3, depth - 3, 0, top + 0.04, zc, { mat: 'marble' });
  // revestimento interno (placas de mármore; decoração real NÃO ENCONTRADA)
  for (const s of [-1, 1]) {
    b.box(0.04, Hc, depth, s * (ix - 0.02), top, zc, { mat: 'marble', collide: false });
    b.box(0.08, 1.0, depth, s * (ix - 0.04), top, zc, { mat: 'marbleGrey', collide: false }); // rodapé
    b.box(0.2, 0.3, depth, s * (ix - 0.1), top + Hc * 0.55, zc, { mat: 'marble', collide: false }); // cornija a meia altura
  }
  b.box(ix * 2, Hc, 0.04, 0, top, zR + 0.02, { mat: 'marble', collide: false });
  b.box(ix * 2, 1.0, 0.08, 0, top, zR + 0.04, { mat: 'marbleGrey', collide: false });
  b.wall(-ix, ix, zF - 0.02, Hc, 0.04, { y: top, mat: 'marble', collide: false, openings: [{ at: ix, w: 4.2, h: 8.6 }] });
  // forro de caixotões (madeira escura com rosetas douradas)
  const cy = top + Hc - 0.3;
  b.box(ix * 2, 0.3, depth, 0, cy, zc, { mat: 'woodDark', collide: false });
  for (let i = 1; i < 6; i++) b.box(0.3, 0.4, depth, -ix + (ix * 2 * i) / 6, cy - 0.4, zc, { mat: 'woodDark', collide: false });
  for (let k = 1; k < 7; k++) b.box(ix * 2, 0.4, 0.3, 0, cy - 0.4, zR + (depth * k) / 7, { mat: 'woodDark', collide: false });
  for (let i = 0; i < 6; i++) for (let k = 0; k < 7; k++) d.box(0.5, 0.06, 0.5, -ix + (ix * 2 * (i + 0.5)) / 6, cy - 0.06, zR + (depth * (k + 0.5)) / 7, { mat: 'gold', collide: false });

  // estátua de culto de Vênus Genetrix (Arcesilau) — marcador volumétrico; material NÃO ENCONTRADO
  const sz = zR + 2.6;
  b.box(3.2, 0.4, 2.8, 0, top, sz, { mat: 'marbleGrey' });
  b.box(2.6, 1.8, 2.2, 0, top + 0.4, sz, { mat: 'marble' });
  b.box(3.0, 0.3, 2.6, 0, top + 2.2, sz, { mat: 'marbleGrey', collide: false });
  statue(b, 0, top + 2.5, sz, { scale: 2.3, mat: 'marble', pedestal: false });
  // imagem dourada de Cleópatra "ao lado da deusa" (Ápio 2.102; Dião 51.22.3) — tamanho natural (hipótese)
  b.box(1.4, 1.2, 1.4, 3.6, top, sz + 0.4, { mat: 'marbleGrey' });
  statue(b, 3.6, top + 1.2, sz + 0.4, { scale: 1.05, mat: 'gold', pedestal: false });

  // seis dactilotecas (coleções de gemas, Plín. 37.11): armários-vitrine ao longo das paredes
  const gemCols = ['#b0302a', '#2f6a3a', '#2c4d8a', '#d8c070', '#6a2a6a', '#e0e0d8'];
  for (let i = 0; i < 6; i++) {
    const s = i < 3 ? -1 : 1;
    const z = zR + 5.2 + (i % 3) * 3.0;
    const x = s * (ix - 0.5);
    b.box(0.8, 1.0, 1.8, x, top, z, { mat: 'woodDark' });
    b.box(0.9, 0.08, 1.9, x, top + 1.0, z, { mat: 'gold', collide: false });
    for (let g = 0; g < 10; g++) {
      d.sphere(0.035 + (g % 3) * 0.008, x + ((g % 2) - 0.5) * 0.3, top + 1.08, z - 0.7 + g * 0.15, { mat: 'flat', color: gemCols[(g + i) % gemCols.length], wSeg: 6, hSeg: 4 });
    }
  }
  // couraça de pérolas britânicas (Plín. 9.116), num suporte junto à estátua
  b.box(0.7, 0.9, 0.7, -3.6, top, sz + 0.6, { mat: 'marbleGrey' });
  const torso = G.lathe([[0.0, 0.0], [0.22, 0.02], [0.26, 0.25], [0.3, 0.55], [0.27, 0.7], [0.12, 0.78], [0.0, 0.8]], 12);
  torso.scale(1, 1, 0.7);
  d.add(torso, { mat: 'flat', color: '#f0ece2', matrix: mat4(-3.6, top + 0.9, sz + 0.6) });
  for (let k = 0; k < 14; k++) d.sphere(0.02, -3.6 + Math.sin(k) * 0.24, top + 1.15 + (k % 5) * 0.08, sz + 0.6 + 0.19, { mat: 'flat', color: '#ffffff', wSeg: 5, hSeg: 3 });
  // candelabros de bronze com chama
  for (const s of [-1, 1]) {
    prop(d, 'lampStand', s * 2.2, top, sz + 2.6, 0, 1.5);
    d.sphere(0.07, s * 2.2, top + 2.08, sz + 2.6, { mat: 'flame' });
  }
  // mesa de oferendas diante da estátua (hipótese: objeto usual de culto, não documentado)
  b.box(1.6, 0.9, 0.8, 0, top, sz + 2.4, { mat: 'marble' });
  prop(d, 'jar', -0.4, top + 0.9, sz + 2.4, 0, 0.8, { mat: 'gold' });
  prop(d, 'jar', 0.4, top + 0.9, sz + 2.4, 1, 0.7, { mat: 'bronze' });

  // quadros de Timômaco (Ájax e Medeia), em painéis de madeira nas paredes laterais.
  // Plínio diverge (35.26 "diante do templo" × 35.136 "no templo"): pomos dentro (hipótese).
  for (const s of [-1, 1]) {
    const z = zc + 1.5;
    b.box(0.12, 2.0, 2.8, s * (ix - 0.1), top + 2.4, z, { mat: 'gold', collide: false }); // moldura
    b.box(0.25, 0.12, 2.6, s * (ix - 0.2), top + 2.3, z, { mat: 'woodDark', collide: false }); // apoio
  }
  b.pop();
  d.pop();
  b.finish();
  d.finish();
  addPaintings(ctx, ix);
}

/** Pinturas sobre painel (texturas procedurais evocativas — não reproduzem as obras perdidas). */
function addPaintings(ctx, ix) {
  const top = Y.podium;
  const { cellaFront, cellaT, rearWall1 } = TPL;
  const zc = (cellaFront - cellaT + rearWall1) / 2 + 1.5;
  for (const s of [-1, 1]) {
    const tex = paintingTexture(s < 0 ? 'ajax' : 'medea');
    const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.75, envMapIntensity: 0.3 });
    const geo = new THREE.PlaneGeometry(2.5, 1.75);
    const mesh = new THREE.Mesh(geo, mat);
    // posição local → mundo
    const local = new THREE.Vector3(s * (ix - 0.17), top + 3.4, zc);
    const m = mat4(ORIGIN.x, 0, ORIGIN.z, ROT);
    mesh.position.copy(local.applyMatrix4(m));
    mesh.rotation.y = ROT + (s < 0 ? Math.PI / 2 : -Math.PI / 2);
    mesh.name = `forum-iulium:quadro-${s < 0 ? 'ajax' : 'medeia'}`;
    mesh.matrixAutoUpdate = false;
    mesh.updateMatrix();
    ctx.scene.add(mesh);
  }
}

/** Composição pictórica simples (figuras esboçadas em ocre, vermelho e preto). */
function paintingTexture(kind) {
  const W = 256;
  const H = 180;
  const cv = document.createElement('canvas');
  cv.width = W;
  cv.height = H;
  const g = cv.getContext('2d');
  const grd = g.createLinearGradient(0, 0, 0, H);
  grd.addColorStop(0, '#5a4a38');
  grd.addColorStop(1, '#2e241b');
  g.fillStyle = grd;
  g.fillRect(0, 0, W, H);
  g.fillStyle = '#6e5a40';
  g.fillRect(0, H * 0.72, W, H * 0.28);
  const fig = (x, y, h, robe, skin, seated) => {
    g.fillStyle = robe;
    g.beginPath();
    if (seated) {
      g.moveTo(x - h * 0.18, y);
      g.lineTo(x + h * 0.28, y);
      g.lineTo(x + h * 0.12, y - h * 0.45);
      g.lineTo(x - h * 0.1, y - h * 0.62);
    } else {
      g.moveTo(x - h * 0.16, y);
      g.lineTo(x + h * 0.16, y);
      g.lineTo(x + h * 0.1, y - h * 0.8);
      g.lineTo(x - h * 0.1, y - h * 0.8);
    }
    g.closePath();
    g.fill();
    g.fillStyle = skin;
    g.beginPath();
    g.arc(x + (seated ? 0 : 0), y - h * (seated ? 0.7 : 0.88), h * 0.08, 0, Math.PI * 2);
    g.fill();
  };
  if (kind === 'ajax') {
    // herói sentado, cabisbaixo, com espada e escudo
    fig(120, 140, 120, '#8e3b2c', '#b07a52', true);
    g.fillStyle = '#9a8a5a';
    g.beginPath();
    g.ellipse(70, 118, 22, 30, 0, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = '#c8c0a8';
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(150, 140);
    g.lineTo(175, 70);
    g.stroke();
  } else {
    // figura feminina de pé com espada; duas crianças ao lado
    fig(140, 145, 125, '#2c4d6a', '#c8946c', false);
    fig(80, 145, 55, '#c99a3e', '#d6a47c', false);
    fig(100, 145, 50, '#a8552f', '#d6a47c', false);
    g.strokeStyle = '#d0c8b0';
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(160, 80);
    g.lineTo(178, 46);
    g.stroke();
  }
  // moldura pintada e envelhecimento
  g.strokeStyle = '#1a140e';
  g.lineWidth = 8;
  g.strokeRect(4, 4, W - 8, H - 8);
  for (let i = 0; i < 400; i++) {
    g.fillStyle = `rgba(20,15,10,${Math.random() * 0.15})`;
    g.fillRect(Math.random() * W, Math.random() * H, 2, 2);
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
