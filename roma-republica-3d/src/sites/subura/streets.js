/**
 * Subura — pavimento das ruas principais e das praças.
 *
 * Calçamento de lajes poligonais de silex (lava basáltica): os censores de 174 a.C. "foram os
 * primeiros a contratar a pavimentação das vias da cidade com silex" (Lívio 41.27.5, nota 10 §4).
 * Quais ruas da Subura eram calçadas em 44 a.C. é NÃO ENCONTRADO: a nota 07 §2 sugere, como
 * HIPÓTESE, o Argileto (rua de ligação com o Fórum) calçado e as vielas em terra batida.
 *
 * As faixas acompanham exatamente a triangulação do terreno (heightAt), um pouco acima dela.
 */
import * as THREE from 'three';
import { sdPoly } from './plan.js';

/**
 * Faixa pavimentada ao longo de uma polilinha (cantos suavizados), com 3 pontos na seção.
 * @param {(x:number,z:number)=>number} heightAt
 * @param {number[][]} pts  polilinha [[x,z],...]
 * @param {number} w  largura (m)
 * @param {object} o { lift (m acima do terreno), trim: [polígonos onde não pavimentar], step (m) }
 */
export function ribbonGeometry(heightAt, pts, w, o = {}) {
  const lift = o.lift ?? 0.045;
  const step = o.step ?? 1.0;
  // Chaikin (2 iterações) para arredondar as quinas, preservando as pontas
  let sm = pts.map((p) => p.slice());
  for (let it = 0; it < 2; it++) {
    const out = [sm[0]];
    for (let i = 0; i < sm.length - 1; i++) {
      const [ax, az] = sm[i];
      const [bx, bz] = sm[i + 1];
      if (i > 0) out.push([ax * 0.75 + bx * 0.25, az * 0.75 + bz * 0.25]);
      if (i < sm.length - 2) out.push([ax * 0.25 + bx * 0.75, az * 0.25 + bz * 0.75]);
    }
    out.push(sm[sm.length - 1]);
    sm = out;
  }
  // reamostragem regular
  const S = [];
  for (let i = 0; i < sm.length - 1; i++) {
    const [x0, z0] = sm[i];
    const [x1, z1] = sm[i + 1];
    const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, z1 - z0) / step));
    for (let k = 0; k < n; k++) S.push([x0 + ((x1 - x0) * k) / n, z0 + ((z1 - z0) * k) / n]);
  }
  S.push(sm[sm.length - 1]);
  const pos = [];
  const uv = [];
  const cols = 3;
  let acc = 0;
  const rows = [];
  for (let i = 0; i < S.length; i++) {
    const a = S[Math.max(0, i - 1)];
    const b = S[Math.min(S.length - 1, i + 1)];
    const dx = b[0] - a[0];
    const dz = b[1] - a[1];
    const l = Math.hypot(dx, dz) || 1;
    const nx = -dz / l;
    const nz = dx / l;
    if (i > 0) acc += Math.hypot(S[i][0] - S[i - 1][0], S[i][1] - S[i - 1][1]);
    const row = [];
    for (let c = 0; c < cols; c++) {
      const off = -w / 2 + (w * c) / (cols - 1);
      const x = S[i][0] + nx * off;
      const z = S[i][1] + nz * off;
      row.push({ x, y: heightAt(x, z) + lift, z, u: off, v: acc });
    }
    rows.push({ row, cx: S[i][0], cz: S[i][1] });
  }
  const trimmed = (r) => (o.trim || []).some((poly) => sdPoly(r.cx, r.cz, poly) > -0.3);
  for (let i = 0; i < rows.length - 1; i++) {
    if (trimmed(rows[i]) && trimmed(rows[i + 1])) continue;
    const A = rows[i].row;
    const B = rows[i + 1].row;
    for (let c = 0; c < cols - 1; c++) {
      const p = [A[c], A[c + 1], B[c + 1], B[c]];
      // dois triângulos com a face para cima (o sentido depende da direção da rua)
      const tri = (p0, p1, p2) => {
        const ux = p1.x - p0.x;
        const uy = p1.y - p0.y;
        const uz = p1.z - p0.z;
        const vx = p2.x - p0.x;
        const vy = p2.y - p0.y;
        const vz = p2.z - p0.z;
        const ny = uz * vx - ux * vz;
        const seq = ny >= 0 ? [p0, p1, p2] : [p0, p2, p1];
        for (const q of seq) {
          pos.push(q.x, q.y, q.z);
          uv.push(q.u, q.v);
        }
      };
      tri(p[0], p[1], p[2]);
      tri(p[0], p[2], p[3]);
    }
  }
  return toGeometry(pos, uv);
}

/** Pavimento de um polígono (praça): triangulação em grade, recortada pelo polígono. */
export function polygonPavingGeometry(heightAt, poly, o = {}) {
  const lift = o.lift ?? 0.05;
  const cell = o.cell ?? 1.0;
  const xs = poly.map((p) => p[0]);
  const zs = poly.map((p) => p[1]);
  const x0 = Math.floor(Math.min(...xs)) - 1;
  const x1 = Math.ceil(Math.max(...xs)) + 1;
  const z0 = Math.floor(Math.min(...zs)) - 1;
  const z1 = Math.ceil(Math.max(...zs)) + 1;
  const pos = [];
  const uv = [];
  const v = (x, z) => ({ x, y: heightAt(x, z) + lift, z });
  const push = (q) => {
    pos.push(q.x, q.y, q.z);
    uv.push(q.x, -q.z);
  };
  for (let z = z0; z < z1; z += cell) {
    for (let x = x0; x < x1; x += cell) {
      // célula incluída se o centro estiver dentro (bordas ficam serrilhadas em 1 m — sob as fachadas)
      if (sdPoly(x + cell / 2, z + cell / 2, poly) < -0.2) continue;
      const a = v(x, z);
      const b = v(x + cell, z);
      const c = v(x + cell, z + cell);
      const d = v(x, z + cell);
      // face para cima: (a, d, c) e (a, c, b) — x para leste, z para o sul
      push(a);
      push(d);
      push(c);
      push(a);
      push(c);
      push(b);
    }
  }
  return toGeometry(pos, uv);
}

function toGeometry(pos, uv) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.computeVertexNormals();
  return g;
}
