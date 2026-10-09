/**
 * Utilidades geográficas e de orientação.
 *
 * Convenções do mundo do jogo (iguais em todo o código):
 *   - 1 unidade = 1 metro.
 *   - +X = leste, -Z = norte (portanto +Z = sul), +Y = para cima.
 *   - y = 0 corresponde ao nível do pavimento do Fórum Romano na República tardia.
 *   - Origem: 41.8925° N, 12.4850° E.
 *
 * Convenção de edifícios (Builder / arch/*):
 *   - Cada edifício é modelado num "quadro local" em que a FACHADA (entrada principal)
 *     aponta para +Z local. `facingRotY(rumo)` converte o rumo de bússola para onde a
 *     fachada aponta (0° = norte, 90° = leste) na rotação Y do quadro.
 */
import { PLACES } from '../data/places.js';

export const ORIGIN = { lat: 41.8925, lon: 12.485 };
const R = 6378137;
const DEG = Math.PI / 180;

/** Converte latitude/longitude (WGS-84) para coordenadas locais {x, z} em metros. */
export function latLonToLocal(lat, lon) {
  const x = (lon - ORIGIN.lon) * DEG * R * Math.cos(ORIGIN.lat * DEG);
  const north = (lat - ORIGIN.lat) * DEG * R;
  return { x, z: -north };
}

/**
 * Rotação Y (rad) de um quadro local cuja fachada (+Z local) deve apontar
 * para o rumo de bússola `bearingDeg` (0 = norte, 90 = leste, 180 = sul, 270 = oeste).
 */
export function facingRotY(bearingDeg) {
  return Math.PI - bearingDeg * DEG;
}

/** Rumo de bússola (graus) do vetor que vai de a até b (objetos com x, z). */
export function bearing(a, b) {
  const dx = b.x - a.x;
  const dn = -(b.z - a.z);
  let deg = Math.atan2(dx, dn) / DEG;
  if (deg < 0) deg += 360;
  return deg;
}

/** Busca uma âncora em src/data/places.js pelo nome exato (lança erro se não existir). */
export function place(name) {
  const p = PLACES[name];
  if (!p) throw new Error(`Âncora geográfica desconhecida: "${name}"`);
  return p;
}

/** Ponto a `dist` metros de `p` na direção do rumo `bearingDeg`. */
export function offsetByBearing(p, bearingDeg, dist) {
  return {
    x: p.x + Math.sin(bearingDeg * DEG) * dist,
    z: p.z - Math.cos(bearingDeg * DEG) * dist,
  };
}

/** 1 pé romano (pes) em metros — valor usual de ~0,296 m. */
export const PES = 0.296;
