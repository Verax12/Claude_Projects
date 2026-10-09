/**
 * A nova Rostra de César (44 a.C.) na extremidade oeste da praça.
 *
 * Base documental (docs/pesquisa/01-forum-oeste.md §8; LAYOUT.md §1):
 *   - em 44 a.C. a tribuna "foi recuada para o lugar atual, e as estátuas de Sula e de Pompeu lhe
 *     foram devolvidas" (Dião 43.49.1; Suet. Iul. 75.4); duas estátuas de César decretadas para a
 *     tribuna, com a coroa cívica e a coroa obsidional (Dião 44.4.5);
 *   - provavelmente inacabada na morte de César (Wikipedia; Platner: dedicação não antes de 42 a.C.);
 *   - plataforma com frente CURVA voltada para o Fórum (Coarelli via DAR; OCD; HU Berlin), núcleo
 *     de concreto de 3,50 m de altura e > 13 m de comprimento (Platner ⚠), encostada nos arcos que
 *     sustentam o Clivus; acesso por trás por escada de 7 degraus (Coarelli via DAR, não confirmado);
 *   - raio/corda, profundidade, revestimento, balaustrada e transferência dos rostros de Âncio:
 *     NÃO ENCONTRADO → corda de 15,5 m, revestimento parcial de travertino, parapeito baixo, SEM
 *     esporões de bronze (não se sabe se já tinham sido transferidos) [HIP].
 *   - NÃO modelar a extensão augustana retangular (+10 m para leste) nem o "Umbilicus".
 */
import { statue } from '../../arch/temple.js';
import { prop } from '../../arch/props.js';
import * as G from '../../render/geom.js';
import * as THREE from 'three';
import { ROSTRA, PLATFORM_Y } from './plan.js';
import { pushFF, stairsRot, scaffoldAlong, crane, blockStack, beam } from './util.js';

/** Contorno da plataforma no quadro do Fórum ([x = v, z = u]); opcionalmente afastado `off` para fora. */
export function rostraOutline(off = 0) {
  const R = ROSTRA;
  const c = (R.v1 - R.v0) / 2;
  const s = R.uApex - R.uRect;
  const rad = (c * c + s * s) / (2 * s);
  const cu = R.uApex - rad;
  const cv = (R.v0 + R.v1) / 2;
  const phiMax = Math.asin(Math.min(1, c / rad));
  const pts = [[R.v0 - off, R.uBack - off], [R.v0 - off, R.uRect]];
  const n = 16;
  for (let i = 0; i <= n; i++) {
    const p = -phiMax + (2 * phiMax * i) / n;
    pts.push([cv + Math.sin(p) * (rad + off), cu + Math.cos(p) * (rad + off)]);
  }
  pts.push([R.v1 + off, R.uRect], [R.v1 + off, R.uBack - off]);
  return { pts, rad, cu, cv, phiMax };
}

export function buildRostra(B) {
  const R = ROSTRA;
  const { ground, det } = B;
  const O = rostraOutline(0);
  const cv = O.cv;
  pushFF(ground);
  // núcleo de concreto (paramento de opus incertum aparente nas partes inacabadas)
  ground.prism(O.pts, R.h + 1, -1, { mat: 'opusIncertum' });
  // revestimento de travertino já assentado na parte inferior da frente curva [HIP]
  const front = rostraOutline(0.12).pts.slice(1, -1);
  const shell = [...front, ...rostraOutline(0).pts.slice(1, -1).reverse()];
  ground.prism(shell, 1.6 + 1, -1, { mat: 'travertine', collide: false });
  // cornija de coroamento: só na metade norte (obra em andamento)
  const top = rostraOutline(0.25).pts.slice(1, -1);
  const half = top.slice(Math.floor(top.length / 2));
  const inner = rostraOutline(-0.2).pts.slice(1, -1);
  const halfIn = inner.slice(Math.floor(inner.length / 2));
  ground.prism([...half, ...halfIn.reverse()], 0.35, R.h - 0.35, { mat: 'travertine', collide: false });
  // piso da plataforma
  ground.prism(rostraOutline(-0.05).pts, 0.04, R.h, { mat: 'slabs', sides: false, collide: false });
  // parapeito baixo ao longo da frente curva (segurança do orador) [HIP]
  const arc = rostraOutline(-0.15).pts.slice(2, -2);
  for (let i = 0; i < arc.length - 1; i++) {
    const [v0, u0] = arc[i];
    const [v1, u1] = arc[i + 1];
    ground.wallAB(v0, u0, v1, u1, 0.85, 0.3, { y: R.h, mat: 'travertine' });
  }
  // escada traseira de 7 degraus, da plataforma do Clivus (y = 2) até o topo (3,5)
  const sh = R.h - PLATFORM_Y;
  stairsRot(ground, 3.6, 7 * 0.3, sh, cv, PLATFORM_Y, R.uBack - 7 * 0.3, Math.PI, { mat: 'travertine', steps: 7 });
  ground.pop();

  // ---------------- estátuas sobre a Rostra ----------------
  pushFF(det);
  const y = R.h;
  // Sula (ao norte) e Pompeu (ao sul), repostas em 44 a.C.; tipo NÃO ENCONTRADO → de pé, bronze
  statue(det, R.v1 - 1.6, y, R.uRect + 0.6, { scale: 1.12, mat: 'bronze', baseMat: 'marble', rotY: 0, pedestalHeight: 1.3 });
  statue(det, R.v0 + 1.6, y, R.uRect + 0.6, { scale: 1.12, mat: 'bronze', baseMat: 'marble', rotY: 0, pedestalHeight: 1.3 });
  // duas estátuas de César (coroa cívica de folhas de carvalho; coroa obsidional de capim)
  for (const [v, col] of [[cv + 3.2, '#4f6a3a'], [cv - 3.2, '#8a8a4a']]) {
    statue(det, v, y, R.uBack + 1.6, { scale: 1.12, mat: 'bronze', baseMat: 'marble', pedestalHeight: 1.3 });
    const ring = G.lathe([[0.15, 0], [0.17, 0.02], [0.15, 0.05], [0.13, 0.03], [0.15, 0]], 12);
    det.add(ring, { mat: 'flat', color: col, matrix: new THREE.Matrix4().makeTranslation(v, y + 1.3 * 1.12 + 1.62 * 1.12 * 1.0 - 0.02, R.uBack + 1.6) });
  }
  // andaime atrás e no lado sul; blocos e grua no canteiro ao sul
  scaffoldAlong(det, cv - 2.2, R.uBack, R.v0 + 0.2, R.uBack, 0.3, PLATFORM_Y, 1, { depth: 1.2, seed: 11 });
  scaffoldAlong(det, R.v1 - 0.2, R.uBack, cv + 2.2, R.uBack, 0.3, PLATFORM_Y, 1, { depth: 1.2, seed: 12 });
  scaffoldAlong(det, R.v0, R.uBack + 0.4, R.v0, R.uRect + 0.6, 0.3, 0, 2, { depth: 1.2, seed: 13 });
  crane(det, R.v0 - 6.5, 0, R.uRect + 2.2, Math.PI / 2, { height: 8.5, lean: 5.4, loadY: 4.6, loadMat: 'travertine' });
  blockStack(det, R.v0 - 6, 0, R.uApex + 3.5, 0.15, { count: 6, mat: 'travertine', seed: 5 });
  blockStack(det, R.v0 - 9.5, 0, R.uApex + 1.0, -0.3, { count: 5, mat: 'travertine', seed: 9 });
  // placas de revestimento encostadas e cocho de argamassa
  for (let k = 0; k < 4; k++) det.box(1.2, 0.9, 0.08, R.v0 - 3.2, 0, R.uRect + 3.6 + k * 0.12, { mat: 'travertine', collide: false, rotY: 0.04 * k });
  det.box(1.6, 0.35, 0.9, R.v0 - 4.5, 0, R.uRect - 0.6, { mat: 'wood', collide: true });
  det.box(1.45, 0.05, 0.75, R.v0 - 4.5, 0.33, R.uRect - 0.6, { mat: 'flat', color: '#cfc7b4', collide: false });
  beam(det, [R.v0 - 2.0, 0, R.uRect + 1.0], [R.v0 - 0.3, 1.9, R.uRect + 0.6], 0.12, 0.08, { mat: 'woodLight' }); // prancha encostada
  prop(det, 'basket', R.v0 - 3.8, 0, R.uRect + 1.2, 0, 1);
  prop(det, 'amphora', R.v0 - 5.4, 0, R.uRect + 0.2, 0.4, 0.9);
  det.pop();
  return { top: R.h, cv };
}
