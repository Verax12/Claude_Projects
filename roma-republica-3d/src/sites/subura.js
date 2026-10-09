/**
 * Sítio: SUBURA — o bairro popular entre o Fórum e o Esquilino (início de 44 a.C.).
 *
 * Conteúdo (docs/LAYOUT.md §3 "subura"; pesquisa: notas 07, 10 e 11):
 *   - Argileto (trecho a NE da Basílica Emília) e a rua principal do vale, calçadas de silex
 *     (hipótese), subindo rumo ao Clivus Suburanus / Porta Esquilina;
 *   - rede irregular de vici e vielas (2,6–3,2 m) com insulae contíguas de 3–5 pavimentos, tabernae
 *     no térreo, escadas direto da rua, sacadas, andares projetados, opus craticium;
 *   - largo da entrada da Subura com lacus (bacia pública); compitum com a capela dos Lares;
 *   - canteiro de demolição ligado ao Fórum de César; insula em reconstrução depois de incêndio
 *     (andaimes, cabrilha de Vitrúvio); prédio escorado; varais; cães e mulas;
 *   - oito tabernae VISITÁVEIS (padaria, caupona, sapateiro, barbeiro, livreiro, lã, louça, verdureiro);
 *   - casario de fundo instanciado (miolo dos quarteirões e encostas do Viminal/Císpio);
 *   - ruas ligadas aos lotes da casa-plebe (320…346, −262…−238) e das foricae (244…270, −188…−168),
 *     que ficam livres e cercados de ruas; acesso ao macellum pela face NO do lote dele.
 *
 * Organização: plan.js (traçado e lotes, puro), insula.js (prédios), streets.js (calçamento),
 * specials.js (elementos especiais), texts.js (painéis). Todo o traçado é determinístico.
 */
import { makePlan, AREA, DEMOLITION, sdPoly, rng, BG_VARIANTS } from './subura/plan.js';
import { buildInsula, bgVariantGeometry, faceQuad, PLASTER_TINTS } from './subura/insula.js';
import { ribbonGeometry, polygonPavingGeometry } from './subura/streets.js';
import * as SP from './subura/specials.js';
import { INFO, TRADE_INFO } from './subura/texts.js';
import { prop, propGeometry } from '../arch/props.js';

/** Plano calculado em shapeTerrain (reutilizado em build). */
let PLAN = null;

/** Ruas com fachadas de detalhe alto (as demais usam o nível médio). */
const L2_STREETS = new Set(['A', 'B', 'M', 'C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8', 'C16', 'C17']);
const TRADES = ['caupona', 'sutor', 'pistrinum', 'librarius', 'tonstrina', 'holitor', 'lanarius', 'figulus'];
const SUBURA_MIX = { citizen: 4, woman: 3.2, slave: 3.6, merchant: 1.2, child: 1.6, senator: 0.08, soldier: 0.04 };

const centroid = (pts) => [pts.reduce((a, p) => a + p[0], 0) / pts.length, pts.reduce((a, p) => a + p[1], 0) / pts.length];

/** Ponto do mundo a partir de coordenadas locais (lx, lz) de um lote (local +Z = rua). */
function lotPt(L, lx, lz) {
  return [L.cx + L.X[0] * lx + L.f[0] * lz, L.cz + L.X[1] * lx + L.f[1] * lz];
}

export default {
  id: 'subura',
  name: 'Subura',

  /** Pads: lotes (planos), ruas (perfil suave em trechos de 4 m), praças e canteiro. */
  shapeTerrain(ctx) {
    const T = ctx.terrain;
    PLAN = makePlan((x, z) => T.heightAt(x, z));
    for (const L of PLAN.lots) {
      const [x, z] = lotPt(L, 0, -L.d / 2);
      T.addPad({ rect: { x, z, w: L.w + 0.6, d: L.d + 0.6, rotY: L.rotY }, height: L.y, blend: 2.5 });
    }
    for (const s of PLAN.streets) {
      const n = Math.max(1, Math.ceil(s.pl.length / 4));
      for (let i = 0; i < n; i++) {
        const t0 = (s.pl.length * i) / n;
        const t1 = (s.pl.length * (i + 1)) / n;
        const tm = (t0 + t1) / 2;
        const [x, z] = s.pl.at(tm);
        const [tx, tz] = s.pl.tangent(tm);
        T.addPad({ rect: { x, z, w: t1 - t0 + 0.8, d: s.w + 2, rotY: Math.atan2(-tz, tx) }, height: s.heightAtT(tm), blend: 3 });
      }
    }
    for (const q of PLAN.squares) T.addPad({ points: q.pts, height: q.y, blend: 3 });
    const [dx, dz] = centroid(DEMOLITION);
    T.addPad({ points: DEMOLITION, height: PLAN.smoothH(dx, dz), blend: 4 });
    ctx.reserve({ points: AREA });
  },

  build(ctx) {
    const T = ctx.terrain;
    const H = (x, z) => T.heightAt(x, z);
    const plan = PLAN || makePlan(H);
    const R = rng(90210);

    // ------------------------------------------------------------------ builders
    const core = ctx.builder('subura-nucleo', { chunkSize: 110 });
    const ne = ctx.builder('subura-nordeste', { chunkSize: 170 });
    const det = ctx.builder('subura-detalhes', { maxDistance: 95, chunkSize: 75 });
    const inter = ctx.builder('subura-tabernae', { interior: true, maxDistance: 45, chunkSize: 60 });
    const spec = ctx.builder('subura-especiais', { chunkSize: 90 });
    const pave = ctx.builder('subura-calcamento', { chunkSize: 120, castShadow: false });

    // ------------------------------------------------------------------ escolhas especiais
    const lots = plan.lots;
    const enterable = [];
    {
      const cands = lots.filter((L) => ['A', 'M', 'B'].includes(L.street) && L.zone === 'core' && L.slope < 0.05 && L.w >= 7 && L.d >= 8.5 && L.floors >= 3);
      for (const L of cands) {
        if (enterable.length >= TRADES.length) break;
        if (enterable.some((E) => Math.hypot(E.cx - L.cx, E.cz - L.cz) < 22)) continue;
        enterable.push(L);
      }
      enterable.forEach((L, i) => (L.trade = TRADES[i]));
    }
    const pickLot = (pred, near) => {
      let best = null;
      for (const L of lots) {
        if (L.trade || L.kind !== 'insula' || !pred(L)) continue;
        const d = Math.hypot(L.cx - near[0], L.cz - near[1]);
        if (!best || d < best.d) best = { L, d };
      }
      return best?.L;
    };
    const recon = pickLot((L) => L.street === 'B' && L.w >= 9 && L.d >= 9, [265, -150]);
    if (recon) recon.kind = 'reconstruction';
    const shored = pickLot((L) => ['C2', 'C17', 'C1'].includes(L.street) && L.w >= 7, [200, -174]);
    if (shored) shored.kind = 'shored';

    // ------------------------------------------------------------------ insulae de frente de rua
    const amph = ctx.world.instances('subura-anforas', propGeometry('amphora'), 'terracotta', { maxDistance: 85, chunkSize: 100 });
    const baskets = ctx.world.instances('subura-cestos', propGeometry('basket'), 'woodLight', { maxDistance: 70, chunkSize: 100 });
    const sacks = ctx.world.instances('subura-sacos', propGeometry('sack'), 'cloth', { maxDistance: 70, chunkSize: 100 });
    const builtLots = [];
    const tradeSpots = [];
    const benchSitters = [];
    for (const L of lots) {
      const d0 = Math.min(2.5, L.d / 2);
      const [px, pz] = lotPt(L, 0, -d0);
      const y0 = H(px, pz);
      const level = L.zone === 'core' && L2_STREETS.has(L.street) ? 2 : 1;
      const mainB = L.zone === 'core' ? core : ne;
      const streetY = (lx) => {
        const [sx, sz] = lotPt(L, lx, 0.6);
        return H(sx, sz) - y0;
      };
      const frame = (b) => b.push(L.cx, y0, L.cz, L.rotY);
      if (L.kind === 'reconstruction') {
        for (const b of [spec, det]) frame(b);
        buildReconstruction(ctx, spec, det, L, y0);
        for (const b of [spec, det]) b.pop();
        builtLots.push({ L, y0, info: { fh0: 3.9, fh: 3.0, nF: 2, H: 6.6 } });
        continue;
      }
      for (const b of [mainB, det, inter, spec]) frame(b);
      const info = buildInsula({ main: mainB, det: level >= 2 ? det : null }, L, {
        level,
        streetY,
        shopOverride: L.trade ? { bay: 0, trade: L.trade } : null,
        floors: L.kind === 'shored' ? Math.max(4, L.floors) : undefined,
        allowJetty: L.kind !== 'shored',
      });
      builtLots.push({ L, y0, info });
      // taberna visitável: interior real
      const eb = info.bays.find((q) => q.enterable);
      if (eb) {
        const ix0 = eb.x0 + (Math.abs(eb.x0 + L.w / 2) < 0.01 ? 0.3 : 0);
        const ix1 = eb.x1 - (Math.abs(eb.x1 - L.w / 2) < 0.01 ? 0.3 : 0);
        const res = SP.shopInterior(inter, { x0: ix0, x1: ix1, depth: eb.roomDepth, rec: info.rec, fh0: info.fh0, trade: L.trade, seed: L.seed + 5 });
        for (const n of res.npcs) {
          const [nx, nz] = lotPt(L, n.x, n.z);
          ctx.npcs.addStatic({ x: nx, z: nz, y: y0, yaw: L.rotY + n.yaw, type: n.type || 'merchant', pose: n.pose });
        }
        SP.paintedSign(det, eb.cx + Math.min(1.3, eb.ow / 2 + 0.2) - 0.45, eb.oh + 0.32, 0.03, 0.9, 0.42, L.seed);
        const [rx, rz] = lotPt(L, eb.cx, -eb.roomDepth / 2);
        tradeSpots.push({ L, x: rx, z: rz, y: y0, trade: L.trade, ow: eb.ow, cx: eb.cx });
      }
      // vida na frente das lojas abertas (mercadoria, bancos, letreiros)
      if (level >= 2) {
        for (const q of info.bays) {
          if (q.type !== 'shop') continue;
          const rr = R();
          const sideX = q.cx + (R() < 0.5 ? -1 : 1) * (q.ow / 2 + 0.25);
          if (rr < 0.22) {
            const n = 1 + Math.floor(R() * 3);
            for (let i = 0; i < n; i++) {
              const [ax, az] = lotPt(L, sideX + (i - 1) * 0.32, 0.22);
              amph.add(ax, y0 + Math.max(0, streetY(sideX)), az, R() * 6.28, 0.95 + R() * 0.1);
            }
          } else if (rr < 0.36) {
            const [ax, az] = lotPt(L, sideX, 0.35);
            (R() < 0.5 ? baskets : sacks).add(ax, y0 + Math.max(0, streetY(sideX)), az, R() * 6.28, 1);
          } else if (rr < 0.43 && L.street !== 'A') {
            // banco encostado à fachada, às vezes com alguém sentado
            const bx = q.cx + (R() < 0.5 ? -1 : 1) * (q.ow / 2 + 0.75);
            if (Math.abs(bx) < L.w / 2 - 1) {
              const sy = Math.max(0, streetY(bx));
              prop(det, 'bench', bx, sy, 0.3, 0, 0.9, { collide: true });
              if (R() < 0.55) benchSitters.push({ L, x: bx, sy, y0 });
            }
          }
          if (R() < 0.13 && !q.enterable) SP.paintedSign(det, q.cx + 0.85, q.sy + q.oh + 0.3, 0.03, 0.8, 0.36, L.seed + 3);
        }
      }
      if (L.kind === 'shored') SP.shoring(spec, -L.w / 2 + 0.6, L.w / 2 - 0.6, info.fh0 + info.fh * 1.25, info.fh0 + 0.5, { seed: L.seed });
      for (const b of [mainB, det, inter, spec]) b.pop();
    }
    for (const s of benchSitters) {
      const [x, z] = lotPt(s.L, s.x, 0.3);
      ctx.npcs.addStatic({ x, z, y: s.y0 + s.sy, yaw: s.L.rotY, type: R() < 0.6 ? 'citizen' : 'woman', pose: 'sit' });
    }

    // ------------------------------------------------------------------ casario de fundo (instanciado)
    const bgGeo = BG_VARIANTS.map((V, i) => bgVariantGeometry(V, 11 + i));
    const bgBody = bgGeo.map((g, i) => ctx.world.instances(`subura-fundo-corpo-${i}`, g.body, 'plaster', { collide: 'box', chunkSize: 380 }));
    const bgRoof = bgGeo.map((g, i) => ctx.world.instances(`subura-fundo-telhado-${i}`, g.roof, 'roofTile', { chunkSize: 380 }));
    for (const F of plan.fills) {
      const V = BG_VARIANTS[F.variant];
      const hw = (V.w * F.scale) / 2;
      const hd = (V.d * F.scale) / 2;
      const rot = F.rotY + (F.swap ? Math.PI / 2 : 0);
      const c = Math.cos(rot);
      const s = Math.sin(rot);
      let y = Infinity;
      for (const [a, b] of [[0, 0], [-hw, -hd], [hw, -hd], [hw, hd], [-hw, hd]]) y = Math.min(y, H(F.x + a * c + b * s, F.z - a * s + b * c));
      const tint = PLASTER_TINTS[Math.floor(R() * PLASTER_TINTS.length)];
      bgBody[F.variant].add(F.x, y, F.z, rot, F.scale, tint);
      const rc = 0.85 + R() * 0.2;
      bgRoof[F.variant].add(F.x, y, F.z, rot, F.scale, [rc, rc * (0.95 + R() * 0.06), rc * 0.95]);
    }

    // ------------------------------------------------------------------ calçamento
    const squarePolys = plan.squares.map((q) => q.pts);
    for (const s of plan.streets) {
      if (s.cls !== 'main') continue;
      for (const g of ribbonGeometry(H, s.pts, s.w - 0.05, { trim: squarePolys, pieceLen: 55 })) pave.add(g, { mat: 'basalt' });
    }
    for (const q of plan.squares) pave.add(polygonPavingGeometry(H, q.pts, { lift: 0.06 }), { mat: 'basalt' });

    // ------------------------------------------------------------------ largo da entrada: lacus
    const fauces = plan.squares.find((q) => q.id === 'fauces');
    const lacusPos = [fauces.cx + 1.5, fauces.cz - 1.5];
    const lacusY = H(lacusPos[0], lacusPos[1]);
    const bRot = Math.atan2(-(-114 + 105), 175 - 140); // eixo da rua B no largo (ao longo de X local)
    SP.lacus(spec, lacusPos[0], lacusY, lacusPos[1], bRot);

    // ------------------------------------------------------------------ compitum
    const compSq = plan.squares.find((q) => q.id === 'compitum');
    // capela na esquina NO da encruzilhada (B × C3), de frente para a rua principal
    const shrine = [304.6, -157.0];
    const shrineRot = Math.atan2(312 - shrine[0], -149 - shrine[1]); // de frente para o cruzamento
    const shF = [Math.sin(shrineRot), Math.cos(shrineRot)];
    const shrineY = H(shrine[0], shrine[1]);
    SP.compitumShrine(spec, det, shrine[0], shrineY, shrine[1], shrineRot);

    // ------------------------------------------------------------------ canteiro de demolição
    buildDemolition(ctx, spec, det, H);

    // ------------------------------------------------------------------ varais entre fachadas
    {
      const bySt = {};
      for (const bl of builtLots) (bySt[bl.L.street] ||= []).push(bl);
      let nLines = 0;
      for (const [sid, arr] of Object.entries(bySt)) {
        const st = plan.byId[sid];
        if (st.w > 3.3 || st.zone !== 'core') continue;
        for (const a of arr) {
          if (a.L.side !== 1 || a.info.nF < 3 || R() > 0.55) continue;
          const b = arr.find((o) => o.L.side === -1 && Math.abs(o.L.t - a.L.t) < 2.5 && o.info.nF >= 3);
          if (!b) continue;
          const ya = a.y0 + a.info.fh0 + a.info.fh * (1.2 + R() * 0.6);
          const yb = b.y0 + b.info.fh0 + b.info.fh * (1.2 + R() * 0.6);
          const pa = lotPt(a.L, (R() - 0.5) * 2, 0.05 + (a.info.jd || 0));
          const pb = lotPt(b.L, (R() - 0.5) * 2, 0.05 + (b.info.jd || 0));
          SP.laundryLine(det, [pa[0], ya, pa[1]], [pb[0], yb, pb[1]], a.L.seed);
          if (++nLines > 40) break;
        }
      }
    }

    // ------------------------------------------------------------------ cães e mulas
    {
      const dogs = [[150, -99, 0.4, true, '#6b4a2e'], [236, -131.5, 2.2, true, '#2b2420'], [309, -154.5, -1.1, false, '#8a6a46'], [257.5, -165, 1.6, true, '#5a4636'], [316.8, -234.8, 0.2, true, '#3a3028'], [384, -203, 3.0, false, '#9a7a56'], [120, -94, -0.6, true, '#7a5a3c'], [166.5, -150, 1.2, true, '#4a3b2e']];
      for (const [x, z, ry, lying, col] of dogs) SP.dog(det, x, H(x, z) + 0.02, z, ry, { lying, color: col });
      for (const [x, z, ry] of [[198, -118.5, 1.85], [352.5, -156.2, 1.75]]) SP.mule(spec, x, H(x, z), z, ry, { color: '#6e5a48' });
    }

    // ------------------------------------------------------------------ árvores nos poços de luz
    {
      const g = plan.grid;
      let n = 0;
      for (let k = 0; k < 4000 && n < 26; k++) {
        const x = 70 + R() * 700;
        const z = -640 + R() * 600;
        if (sdPoly(x, z, AREA) < 3) continue;
        let ok = true;
        for (let a = 0; a < 8 && ok; a++) {
          const ang = (a / 8) * Math.PI * 2;
          for (const rr of [0, 1.5, 3]) if (g.get(x + Math.cos(ang) * rr, z + Math.sin(ang) * rr) !== 0) ok = false;
        }
        if (!ok) continue;
        ctx.vegetation.add(R() < 0.6 ? 'fig' : 'laurel', x, z, { scale: 0.7 + R() * 0.3 });
        n++;
      }
    }

    for (const b of [core, ne, det, inter, spec, pave]) b.finish();

    // ------------------------------------------------------------------ NPCs
    const npcPath = (pts, o) => {
      // pontos a cada ≤ 12 m (os NPCs interpolam a altura entre os nós)
      const out = [];
      for (let i = 0; i < pts.length - 1; i++) {
        const [ax, az] = pts[i];
        const [bx, bz] = pts[i + 1];
        const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / 12));
        for (let k = 0; k < n; k++) out.push([ax + ((bx - ax) * k) / n, az + ((bz - az) * k) / n]);
      }
      out.push(pts[pts.length - 1]);
      ctx.npcs.addPath(out, o);
    };
    // ligação com a boca do Argileto no Fórum (junção comum do LAYOUT §4)
    npcPath([[40, -40], [65, -56.2], [89.8, -72.4]], { density: 7, width: 3.5, mix: SUBURA_MIX });
    for (const s of plan.streets) {
      if (s.id === 'B') {
        const k = s.pts.findIndex((p) => p[0] >= 415);
        npcPath(s.pts.slice(0, k + 1), { density: 10, width: s.w - 1.2, mix: SUBURA_MIX });
        npcPath(s.pts.slice(k), { density: 4, width: s.w - 1.2, mix: SUBURA_MIX });
      } else npcPath(s.pts, { density: s.density, width: Math.max(1.2, s.w - 1.2), mix: SUBURA_MIX });
    }
    // voltas nos largos
    const loopAround = (cx, cz, r, n) => Array.from({ length: n }, (_, i) => [cx + Math.cos((i / n) * Math.PI * 2) * r, cz + Math.sin((i / n) * Math.PI * 2) * r]);
    ctx.npcs.addPath(loopAround(lacusPos[0], lacusPos[1], 4.2, 8), { loop: true, density: 6, width: 1.2, mix: { woman: 4, slave: 3, child: 2, citizen: 1 } });
    // gente parada: na bacia, no compitum, nos canteiros
    const lc = Math.cos(bRot);
    const ls = Math.sin(bRot);
    const atLacus = (lx, lz) => [lacusPos[0] + lx * lc + lz * ls, lacusPos[1] - lx * ls + lz * lc];
    for (const [lx, lz, type, yawOff, pose] of [[0.6, 1.35, 'woman', Math.PI, 'stand'], [-0.8, 1.4, 'slave', Math.PI, 'work'], [1.0, -1.4, 'woman', 0, 'gesture'], [-2.4, 1.0, 'child', Math.PI * 0.8, 'stand']]) {
      const [x, z] = atLacus(lx, lz);
      ctx.npcs.addStatic({ x, z, yaw: bRot + yawOff, type, pose });
    }
    for (const [fwd, side, type, pose] of [[2.4, -0.6, 'woman', 'gesture'], [2.1, 0.9, 'child', 'stand'], [3.0, 0.2, 'slave', 'stand']]) {
      const x = shrine[0] + shF[0] * fwd + shF[1] * side;
      const z = shrine[1] + shF[1] * fwd - shF[0] * side;
      ctx.npcs.addStatic({ x, z, yaw: shrineRot + Math.PI, type, pose });
    }
    ctx.npcs.addGroup({ points: [[150, -108], [245, -134.5], [312, -149.5], [380, -166.5]], loop: false, leader: 'citizen', followers: ['slave', 'slave'] });

    // ------------------------------------------------------------------ som
    ctx.audio.addZone({ x: lacusPos[0], z: lacusPos[1], radius: 14, type: 'water', gain: 0.6 });
    ctx.audio.addZone({ x: 125, z: -95, radius: 40, type: 'crowd', gain: 0.9 });
    for (const [x, z] of [[200, -122], [270, -140], [340, -155], [410, -178]]) ctx.audio.addZone({ x, z, radius: 38, type: 'market', gain: 0.8 });
    ctx.audio.addZone({ x: 520, z: -258, radius: 70, type: 'crowd', gain: 0.5 });
    ctx.audio.addZone({ x: 280, z: -230, radius: 60, type: 'crowd', gain: 0.45 });
    if (recon) ctx.audio.addZone({ x: recon.cx, z: recon.cz, radius: 32, type: 'workshop', gain: 0.9 });
    const [dmx, dmz] = centroid(DEMOLITION);
    ctx.audio.addZone({ x: dmx, z: dmz, radius: 30, type: 'workshop', gain: 0.7 });
    for (const t of tradeSpots.filter((q) => q.trade === 'sutor' || q.trade === 'pistrinum')) ctx.audio.addZone({ x: t.x, z: t.z, radius: 12, type: 'workshop', gain: 0.5 });
    for (const [x, z] of [[236, -131.5], [316.8, -234.8], [384, -203]]) ctx.audio.addZone({ x, z, radius: 22, type: 'animals', gain: 0.6 });

    // ------------------------------------------------------------------ teleporte, áreas, painéis
    ctx.addLocation({ id: 'subura', name: 'Subura', latin: 'Subura', group: 'Bairros', x: 287, z: -144.2, lookBearing: 72 });

    ctx.addArea({ name: 'Subura', latin: 'Subura', points: AREA, priority: 0 });
    ctx.addArea({ name: 'Argileto', latin: 'Argiletum', points: corridor(plan.byId.A.pts, 7), priority: 2 });
    ctx.addArea({ name: 'Entrada da Subura — largo do lacus', latin: 'Subura (primae fauces)', points: fauces.pts, priority: 3 });
    ctx.addArea({ name: 'Compitum dos Lares', latin: 'Compitum', points: compSq.pts, priority: 3 });
    ctx.addArea({ name: 'Demolições para o Fórum de César', latin: 'Area Fori Iulii', points: DEMOLITION, priority: 3 });
    ctx.addArea({ name: 'Rumo ao Clivus Suburanus', latin: 'Clivus Suburanus', circle: { x: 640, z: -342, r: 55 }, priority: 1 });

    const info = (key, x, z, radius, extra = {}) => ctx.addInfo({ ...INFO[key], x, z, radius, ...extra });
    info('subura', fauces.cx, fauces.cz, 15);
    info('argiletum', 108, -84, 13);
    info('insulae', 212, -125, 13);
    info('tabernae', 262, -139.5, 11);
    info('compitum', shrine[0] + shF[0] * 2, shrine[1] + shF[1] * 2, 8);
    info('lacus', lacusPos[0], lacusPos[1], 6);
    info('demolition', dmx + 6, dmz + 4, 18);
    if (recon) {
      const [x, z] = lotPt(recon, 0, 1.5);
      info('fire', x, z, 11);
    }
    if (shored) {
      const [x, z] = lotPt(shored, 0, 1.2);
      info('shored', x, z, 7);
    }
    info('people', 239, -168, 11);
    info('clivus', 640, -342, 30);
    for (const t of tradeSpots) ctx.addInfo({ ...TRADE_INFO[t.trade], date: 'Taberna visitável', x: t.x, z: t.z, y: t.y, radius: 3.6 });
  },
};

/** Corredor (polígono) de largura 2·half em volta de uma polilinha. */
function corridor(pts, half) {
  const left = [];
  const right = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(pts.length - 1, i + 1)];
    const dx = b[0] - a[0];
    const dz = b[1] - a[1];
    const l = Math.hypot(dx, dz) || 1;
    left.push([pts[i][0] + (dz / l) * half, pts[i][1] - (dx / l) * half]);
    right.push([pts[i][0] - (dz / l) * half, pts[i][1] + (dx / l) * half]);
  }
  return [...left, ...right.reverse()];
}

/* ------------------------------------------------------------------------- */
/*  Insula em reconstrução depois de um incêndio                             */
/* ------------------------------------------------------------------------- */
function buildReconstruction(ctx, b, d, L, y0) {
  const r = rng(L.seed);
  const w = L.w;
  const dep = L.d;
  const fh0 = 3.9;
  const top = 6.6;
  const t = 0.45;
  // paredes novas em opus reticulatum (fachada com vãos de loja e porta da escada)
  const ops = [
    { at: w * 0.25, w: Math.min(3.0, w * 0.3), h: 2.9, y: 2.0 },
    { at: w * 0.55, w: 1.1, h: 2.25, y: 2.0 },
    { at: w * 0.8, w: Math.min(2.8, w * 0.28), h: 2.9, y: 2.0 },
    { at: w * 0.3, w: 0.8, h: 1.1, y: 2.0 + fh0 + 0.9 },
    { at: w * 0.7, w: 0.8, h: 1.1, y: 2.0 + fh0 + 0.9 },
  ];
  b.wall(-w / 2, w / 2, -t / 2, top + 2.0, t, { y: -2.0, mat: 'reticulatum', openings: ops });
  // cantos e vergas de tufo
  for (const op of ops.slice(0, 3)) b.box(op.w + 0.3, 0.3, t + 0.02, -w / 2 + op.at, op.h, -t / 2, { mat: 'tufa', collide: false });
  // laterais e fundo (o fundo ainda baixo), parede interna
  for (const s of [-1, 1]) b.box(t, top + 2 - (s > 0 ? 0.8 : 0), dep - t, s * (w / 2 - t / 2), -2, -(dep + t) / 2, { mat: 'reticulatum' });
  b.box(w - 2 * t, 4.4 + 2, t, 0, -2, -dep + t / 2, { mat: 'reticulatum' });
  b.box(t, fh0 + 2, dep * 0.55, w * 0.1, -2, -dep * 0.55, { mat: 'reticulatum' });
  // fiadas irregulares no topo (obra parando)
  for (let i = 0; i < 6; i++) b.box(0.6 + r() * 0.8, 0.3 + r() * 0.4, t, -w / 2 + 0.6 + r() * (w - 1.2), top, -t / 2, { mat: 'reticulatum', collide: false });
  // vigamento do 1º andar meio montado
  for (let x = -w / 2 + 0.6; x < w / 2 - 0.4; x += 0.7) b.box(0.18, 0.22, dep * 0.6, x, fh0 - 0.22, -t - dep * 0.3, { mat: 'woodDark', collide: false });
  b.box(w - 1, 0.06, 2.4, 0, fh0, -t - 1.3, { mat: 'woodLight', collide: false });
  // vizinhos queimados: fuligem e buracos das vigas do prédio que ardeu (nas empenas vizinhas)
  for (const [face, exp, c] of [['right', L.expLeft, -w / 2 + 0.012], ['left', L.expRight, w / 2 - 0.012]]) {
    if (exp) continue;
    faceQuad(b, face, c, -dep + 0.5, -0.4, top + 0.2, top + 5.8, { mat: 'plaster', color: '#3a312a' });
    faceQuad(b, face, c + (face === 'right' ? 0.004 : -0.004), -dep * 0.75, -1.2, top + 1.0, top + 4.6, { mat: 'plaster', color: '#241d18' });
    for (const yy of [top + 0.4, top + 3.4]) for (let z = -dep + 1; z < -1; z += 0.8) faceQuad(b, face, c + (face === 'right' ? 0.008 : -0.008), z, z + 0.22, yy, yy + 0.26, { mat: 'plaster', color: '#100c09' });
  }
  // andaime na fachada e cabrilha (polispasto) dentro do lote, inclinada para o fundo
  SP.scaffold(b, -w / 2 + 0.3, w / 2 - 0.3, top - 0.2, { seed: L.seed });
  SP.shearLegs(b, -w * 0.15, 0, -2.6, 9.5, { lean: 1.9 });
  // materiais: monte de cubilia de tufo, areia, cal num cocho, madeira empilhada
  const mz = -dep * 0.62;
  b.push(w * 0.28, 0, mz, 0);
  b.lathe([[1.3, -0.3], [1.15, 0.25], [0.7, 0.75], [0.0, 0.95]], 0, 0, 0, { mat: 'tufa', segments: 9, color: '#d6c08e' });
  b.pop();
  b.lathe([[1.0, -0.3], [0.85, 0.2], [0.45, 0.55], [0.0, 0.65]], -w * 0.3, 0, -dep * 0.7, { mat: 'dirt', segments: 9, color: '#c8b28a' });
  b.box(1.6, 0.45, 0.8, -w * 0.28, 0, -1.6, { mat: 'wood', color: '#7a5a3a' });
  b.box(1.45, 0.05, 0.65, -w * 0.28, 0.4, -1.6, { mat: 'plaster', color: '#f2efe6', collide: false });
  for (let k = 0; k < 4; k++) b.box(3.6, 0.2, 0.22, w * 0.2, 0.2 * k, -dep + 1.2 + (k % 2) * 0.24, { mat: 'woodDark', collide: k === 0 });
  // blocos de tufo prontos na rua, junto ao andaime
  for (let i = 0; i < 5; i++) b.box(0.6, 0.4, 0.45, -w / 2 + 1.0 + i * 0.68, (i % 2) * 0.4, 2.0, { mat: 'tufa', collide: i % 2 === 0 });
  // trabalhadores
  for (const [lx, lz, yaw, pose] of [[-w * 0.28, -2.4, 0, 'work'], [w * 0.28, mz + 1.6, Math.PI, 'work'], [w * 0.1, 3.2, Math.PI, 'gesture']]) {
    const [x, z] = lotPt(L, lx, lz);
    ctx.npcs.addStatic({ x, z, y: y0, yaw: L.rotY + yaw, type: pose === 'gesture' ? 'citizen' : 'slave', pose });
  }
}

/* ------------------------------------------------------------------------- */
/*  Canteiro de demolição (casario comprado para o Fórum de César)            */
/* ------------------------------------------------------------------------- */
function buildDemolition(ctx, b, d, H) {
  const r = rng(54);
  const [cx, cz] = centroid(DEMOLITION);
  const y = H(cx, cz);
  // quadro alinhado ao Argileto (eixo A: de (89,8; −72,4) a (115; −89)); +Z local aponta para a rua.
  // Em coordenadas locais o polígono do canteiro vai de x ≈ −21 a 21 e de z ≈ −34 a 25 (frente).
  const ax = 115 - 89.8;
  const az = -89 + 72.4;
  const rot = Math.atan2(-az, ax);
  b.push(cx, y, cz, rot);
  d.push(cx, y, cz, rot);
  // fundações e tocos de paredes (cômodos da insula demolida), em opus incertum
  const stubs = [
    [-14, -6, 20, 0], [-14, 4, 20, 0], [-14, 14, 20, 0], [-14, -6, 0, 20], [-6, -6, 0, 20], [2, -6, 0, 20], [-10, -14, 14, 0],
  ];
  for (const [x0, z0, lx, lz] of stubs) {
    const len = Math.max(lx, lz);
    const nseg = Math.max(1, Math.round(len / 1.6));
    for (let i = 0; i < nseg; i++) {
      if (r() < 0.12) continue;
      const h = 0.3 + r() * 1.4;
      const u = (i + 0.5) / nseg;
      const sx = x0 + (lx ? lx * u : 0);
      const sz = z0 + (lz ? lz * u : 0);
      b.box(lx ? len / nseg + 0.02 : 0.45, h + 0.3, lz ? len / nseg + 0.02 : 0.45, sx, -0.3, sz, { mat: 'opusIncertum', color: '#d8ccb4' });
    }
  }
  // canto de prédio ainda de pé (dois pavimentos), com buracos das vigas e restos de reboco pintado
  b.box(0.45, 8.7, 16, -16.5, -0.5, 8, { mat: 'opusIncertum' });
  b.box(6.5, 7.9, 0.45, -13.0, -0.5, 0.2, { mat: 'opusIncertum' });
  for (let k = 0; k < 8; k++) b.box(0.45, 0.4 + r() * 0.9, 1.0 + r(), -16.5, 8.2, 0.8 + k * 1.9, { mat: 'opusIncertum', collide: false });
  const fx = -16.27;
  faceQuad(b, 'right', fx, 0.6, 15.5, 0.0, 3.4, { mat: 'plaster', color: '#a9573a' });
  faceQuad(b, 'right', fx + 0.004, 0.6, 15.5, 3.75, 6.6, { mat: 'plaster', color: '#d9cdb2' });
  faceQuad(b, 'right', fx + 0.008, 4.0, 9.0, 4.4, 5.4, { mat: 'plaster', color: '#3c5a6e' });
  faceQuad(b, 'right', fx + 0.008, 10.0, 14.5, 0.9, 1.4, { mat: 'plaster', color: '#2f2a26' });
  for (const yy of [3.45, 6.65]) for (let z = 0.8; z < 15.4; z += 0.7) faceQuad(b, 'right', fx + 0.012, z, z + 0.2, yy, yy + 0.24, { mat: 'plaster', color: '#120d0a' });
  // rastro diagonal da escada do prédio demolido
  b.quad([fx + 0.016, 0.0, 12.5], [fx + 0.016, 0.0, 13.2], [fx + 0.016, 3.6, 7.6], [fx + 0.016, 3.0, 7.0], { mat: 'plaster', color: '#4e4338' });
  // montes de entulho
  for (const [mx, mz, rr, hh] of [[-8, 9, 3.0, 1.8], [-1, -1, 2.6, 1.4], [4.5, 10, 2.2, 1.2], [-10, -2, 2.0, 1.0], [6, -10, 2.4, 1.3]]) {
    b.lathe([[rr, -0.3], [rr * 0.9, hh * 0.25], [rr * 0.62, hh * 0.62], [rr * 0.3, hh * 0.92], [0, hh]], mx, 0, mz, { mat: 'opusIncertum', segments: 9, color: '#c8bba0', rotY: r() * 3 });
    b.colliderBox(rr * 1.1, hh * 0.7, rr * 1.1, mx, 0, mz, 0);
  }
  // telhas reaproveitadas empilhadas (Vitrúvio 2.8.19) e vigas salvas
  for (let i = 0; i < 6; i++) {
    const tx = -3.0 + (i % 3) * 0.75;
    const tz = 18.6 + Math.floor(i / 3) * 0.6;
    b.box(0.62, 0.55 + r() * 0.35, 0.48, tx, 0, tz, { mat: 'terracotta', color: '#c07850' });
  }
  for (let k = 0; k < 5; k++) b.box(5.5, 0.22, 0.24, 3.0, 0.22 * Math.floor(k / 2), 19.5 + (k % 2) * 0.28, { mat: 'woodDark', collide: k < 2 });
  // tapume de tábuas ao longo do Argileto, com uma abertura
  const zF = 23.6;
  const xA = -18;
  const xB = 6.2;
  const g0 = -4.2;
  const g1 = -1.4;
  for (let x = xA; x < xB; x += 0.32) {
    if (x > g0 && x < g1) continue;
    d.box(0.3, 2.1 + (r() - 0.5) * 0.25, 0.05, x, -0.2, zF, { mat: r() < 0.25 ? 'woodDark' : 'wood', collide: false });
  }
  for (const x of [xA, -13, -8.5, g0, g1, 2.5, xB]) b.box(0.14, 2.3, 0.14, x, -0.2, zF - 0.1, { mat: 'woodDark', collide: false });
  b.colliderBox(g0 - xA, 2.2, 0.3, (xA + g0) / 2, -0.2, zF);
  b.colliderBox(xB - g1, 2.2, 0.3, (g1 + xB) / 2, -0.2, zF);
  b.pop();
  d.pop();
  // trabalhadores (escravos) no entulho
  const lc = Math.cos(rot);
  const ls = Math.sin(rot);
  for (const [lx, lz, yaw, pose] of [[-4, 6, 0.4, 'work'], [1.5, 2.5, 2.2, 'work'], [-1, 17.5, -1.2, 'work'], [-2.8, 21.5, Math.PI, 'gesture']]) {
    const x = cx + lx * lc + lz * ls;
    const z = cz - lx * ls + lz * lc;
    ctx.npcs.addStatic({ x, z, yaw: rot + yaw, type: pose === 'gesture' ? 'citizen' : 'slave', pose });
  }
}
