/**
 * Carcer / Tullianum — prisão estatal e local de execução, em uso em 50–44 a.C.
 *
 * Base documental (docs/pesquisa/01-forum-oeste.md §5):
 *   - "carcer … media urbe imminens foro" (Lívio 1.33.8); parte subterrânea chamada Tullianum
 *     (Varrão LL 5.151);
 *   - Tullianum: câmara circular (~7 m de diâmetro ⚠) de blocos de peperino sem argamassa, 12 pés
 *     de profundidade (Sall. Cat. 55.3: "circiter duodecim pedes humi depressus"), coberta por
 *     abóbada de pedra / arco plano de tufo (divergência); nascente que brota do piso por uma pequena
 *     abertura quadrada (Parco Colosseo); "repugnante e terrível pelo abandono, pela escuridão e pelo
 *     mau cheiro" (Sall. Cat. 55.4);
 *   - câmara superior trapezoidal (lados de 5 a 3,60 m ⚠), tufo vermelho e amarelo; cobertura em
 *     berço OU arco plano (divergência — aqui: teto plano);
 *   - muros externos seguem os eixos da Concórdia (S) e do Comício (E) (DAR);
 *   - NÃO existia a fachada de travertino com a inscrição dos cônsules (séc. I d.C.).
 *   - Fachada republicana: NÃO ENCONTRADO → frente simples de tufo [HIP]. A escada estreita que
 *     desce ao Tullianum é solução de jogo: o acesso antigo era por uma abertura no alto
 *     (Salústio: "in eum locum postquam demissus est"), de forma não atestada.
 */
import * as THREE from 'three';
import * as G from '../../render/geom.js';
import { CARCER } from './plan.js';
import { pushFF, stairsRot } from './util.js';

function boxVU(b, v0, v1, u0, u1, y0, y1, o = {}) {
  b.box(v1 - v0, y1 - y0, u1 - u0, (v0 + v1) / 2, y0, (u0 + u1) / 2, o);
}

export function buildCarcer(B) {
  const C = CARCER;
  const { ext, int, det } = B;
  const T = C.tull;
  const floorY = 0.25; // piso da câmara superior
  const slab0 = -0.35; // face inferior da laje (teto do Tullianum)
  const wt = 0.95;
  const uF = C.u1; // fachada (leste)
  const vc = (C.v0 + C.v1) / 2;
  // câmara superior (trapézio): frente 5 m, fundo 3,6 m, profundidade 4,8 m (⚠)
  const room = { uFront: uF - wt, uBack: uF - wt - 4.8, fw: 5.0, bw: 3.6 };
  const hole = { v0: vc + 0.6, v1: vc + 1.6, u0: room.uFront - 0.8 - 3.6, u1: room.uFront - 0.8 };
  const yb = -4.4;
  pushFF(ext);
  // muro da fachada com porta
  ext.wall(C.v0, C.v1, uF - wt / 2, C.h - yb, wt, { y: yb, mat: 'tufa', openings: [{ at: vc - C.v0, w: 1.5, h: 2.5, y: floorY - yb }] });
  // muros laterais e de fundo
  boxVU(ext, C.v0, C.v0 + wt, C.u0, uF - wt, yb, C.h, { mat: 'tufa' });
  boxVU(ext, C.v1 - wt, C.v1, C.u0, uF - wt, yb, C.h, { mat: 'tufa' });
  boxVU(ext, C.v0 + wt, C.v1 - wt, C.u0, C.u0 + wt, yb, C.h, { mat: 'tufa' });
  // massas de alvenaria entre o trapézio e os muros (acima da laje)
  const rf = room.uFront;
  const rb = room.uBack;
  const hv = room.fw / 2;
  const hb = room.bw / 2;
  ext.prism([[vc + hv, rf], [C.v1 - wt, rf], [C.v1 - wt, rb], [vc + hb, rb]], C.h - floorY, floorY, { mat: 'tufa' });
  ext.prism([[C.v0 + wt, rf], [vc - hv, rf], [vc - hb, rb], [C.v0 + wt, rb]], C.h - floorY, floorY, { mat: 'tufa' });
  boxVU(ext, C.v0 + wt, C.v1 - wt, C.u0 + wt, rb, floorY, C.h, { mat: 'tufa' });
  // laje do piso (com a abertura para o Tullianum)
  const lo = { mat: 'tufa' };
  boxVU(ext, C.v0 + wt, hole.v0, C.u0 + wt, uF - wt, slab0, floorY, lo);
  boxVU(ext, hole.v1, C.v1 - wt, C.u0 + wt, uF - wt, slab0, floorY, lo);
  boxVU(ext, hole.v0, hole.v1, C.u0 + wt, hole.u0, slab0, floorY, lo);
  boxVU(ext, hole.v0, hole.v1, hole.u1, uF - wt, slab0, floorY, lo);
  // teto plano ("arco plano" segundo a Catholic Encyclopedia) e telhado baixo de telhas
  boxVU(ext, C.v0 + wt, C.v1 - wt, C.u0 + wt, uF - wt, 3.9, C.h, { mat: 'tufa' });
  ext.push(vc, 0, (C.u0 + C.u1) / 2, 0);
  ext.box(C.v1 - C.v0 + 0.5, 0.25, C.u1 - C.u0 + 0.5, 0, C.h, 0, { mat: 'tufa', collide: false });
  ext.pop();
  // fiadas alternadas de tufo vermelho e amarelo na fachada
  for (let k = 0; k < 6; k++) {
    if (k % 2) boxVU(ext, C.v0, C.v1, uF - 0.02, uF + 0.03, 0.6 + k * 0.92, 0.6 + k * 0.92 + 0.6, { mat: 'tufa', color: '#e2a98e', collide: false });
  }
  // porta de madeira reforçada (aberta) e soleira
  ext.box(0.12, 2.4, 1.4, vc - 0.75, floorY, uF - wt - 0.7, { mat: 'woodDark', collide: true });
  for (let k = 0; k < 3; k++) ext.box(0.14, 0.08, 1.42, vc - 0.75, floorY + 0.5 + k * 0.7, uF - wt - 0.7, { mat: 'iron', collide: false });
  boxVU(ext, vc - 0.9, vc + 0.9, uF - wt, uF + 0.3, 0, floorY, { mat: 'travertine' });
  ext.pop();

  // ---------------- Tullianum (câmara circular subterrânea) ----------------
  pushFF(int);
  const seg = 26;
  const R = T.r;
  for (let i = 0; i < seg; i++) {
    const a0 = (i / seg) * Math.PI * 2;
    const a1 = ((i + 1) / seg) * Math.PI * 2;
    const am = (a0 + a1) / 2;
    const chord = 2 * (R + 0.3) * Math.sin((a1 - a0) / 2) + 0.06;
    // anel de blocos de peperino (fiadas levemente salientes = "falsa cúpula")
    for (let c = 0; c < 6; c++) {
      const rr = R + 0.3 - c * 0.06;
      const h = (slab0 - T.floor) / 6;
      int.box(chord, h + 0.01, 0.6, T.v + Math.sin(am) * rr, T.floor + c * h, T.u + Math.cos(am) * rr, { mat: 'peperino', rotY: am, color: c % 2 ? '#d8d4c8' : '#ffffff' });
    }
  }
  int.add(G.disc(R + 0.1, 26, T.floor + 0.02, true), { mat: 'peperino', matrix: new THREE.Matrix4().makeTranslation(T.v, 0, T.u), color: '#9a958a' });
  // nascente: pequena abertura quadrada no piso com água
  int.box(0.5, 0.03, 0.5, T.v - 1.6, T.floor + 0.02, T.u - 1.2, { mat: 'flat', color: '#151311', collide: false });
  int.box(0.36, 0.02, 0.36, T.v - 1.6, T.floor + 0.04, T.u - 1.2, { mat: 'water', collide: false });
  int.box(1.2, 0.01, 0.3, T.v - 1.0, T.floor + 0.035, T.u - 1.2, { mat: 'water', collide: false });
  // escada estreita e íngreme da câmara superior ao Tullianum (solução de jogo — ver nota acima)
  stairsRot(int, hole.v1 - hole.v0 - 0.1, hole.u1 - hole.u0 - 0.2, floorY - T.floor, (hole.v0 + hole.v1) / 2, T.floor, hole.u0 + 0.1, Math.PI, { mat: 'peperino' });
  // revestimento da câmara superior (tufo) e piso
  int.floor(room.fw - 0.2, 4.6, vc, floorY + 0.02, (rf + rb) / 2, { mat: 'slabsTufa', collide: false });
  int.pop();

  pushFF(det);
  // lucerna acesa num nicho e corrente de ferro
  det.box(0.12, 0.06, 0.08, vc - 2.3, floorY + 1.6, rf - 0.6, { mat: 'terracotta', collide: false });
  det.box(0.04, 0.05, 0.04, vc - 2.3, floorY + 1.66, rf - 0.6, { mat: 'flame', collide: false });
  det.box(0.12, 0.06, 0.08, T.v + 2.9, T.floor + 1.5, T.u, { mat: 'terracotta', collide: false });
  det.box(0.04, 0.05, 0.04, T.v + 2.9, T.floor + 1.56, T.u, { mat: 'flame', collide: false });
  for (let k = 0; k < 8; k++) det.box(0.05, 0.05, 0.12, T.v + 3.3, T.floor + 1.2 - k * 0.12, T.u + 0.6 + (k % 2) * 0.04, { mat: 'iron', collide: false });
  det.pop();

  return { floorY, tullFloor: T.floor, hole, room };
}

/**
 * Pavimento do adro do Carcer (lajes sólidas com colisão) cobrindo a depressão do terreno
 * criada para a câmara subterrânea. Polígono = retângulo menos o Carcer.
 */
export function buildCarcerForecourt(b) {
  const C = CARCER;
  pushFF(b);
  const u0 = -95.4;
  const u1 = -79;
  const v0 = 38;
  const v1 = 60.5;
  const y0 = -4.2;
  const o = { mat: 'slabs' };
  boxVU(b, v0, C.v0, u0, u1, y0, 0.02, o);
  boxVU(b, C.v1, v1, u0, u1, y0, 0.02, o);
  boxVU(b, C.v0, C.v1, u0, C.u0, y0, 0.02, o);
  boxVU(b, C.v0, C.v1, C.u1, u1, y0, 0.02, o);
  b.pop();
}
