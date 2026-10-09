/**
 * Vegetação instanciada: ciprestes, pinheiros-mansos, plátanos, oliveiras, figueiras,
 * loureiros, arbustos e touceiras de capim.
 *
 * Uso (num sítio):  ctx.vegetation.add('cypress', x, z, { scale, y })
 * As árvores são agrupadas em InstancedMesh por tipo (tronco + copa) ao final da construção.
 */
import * as G from '../render/geom.js';

/** Cores de copa (multiplicadas pelo material 'foliage'). */
const FOLIAGE = {
  cypress: '#2f3f24',
  pine: '#3f5530',
  plane: '#58703a',
  olive: '#7a8a64',
  fig: '#4e6a34',
  laurel: '#3c5230',
  shrub: '#4f6334',
  grass: '#8a8a54',
};

function n(g) {
  return G.normalizeGeometry(g);
}

/** Geometrias {trunk, crown} de cada tipo (altura de referência ~ árvore adulta). */
function treeGeoms(type) {
  switch (type) {
    case 'cypress':
      return {
        trunk: n(G.cylinder(0.18, 0.12, 2, 6)),
        crown: n(G.lathe([[0.0, 1.0], [0.9, 2.0], [1.05, 4.5], [0.75, 8.0], [0.3, 10.5], [0.0, 11.5]], 9)),
      };
    case 'pine': // pinheiro-manso (copa em guarda-chuva)
      return {
        trunk: n(G.cylinder(0.32, 0.2, 9.5, 7)),
        crown: n(G.lathe([[0.0, 8.2], [3.5, 8.8], [4.6, 9.8], [3.8, 10.9], [1.5, 11.5], [0.0, 11.6]], 12)),
      };
    case 'plane':
      return {
        trunk: n(G.cylinder(0.4, 0.28, 5, 7)),
        crown: n(G.merge([n(G.sphere(3.4, 10, 7).translate(0, 4, 0)), n(G.sphere(2.6, 9, 6).translate(1.8, 5, 0.6)), n(G.sphere(2.4, 9, 6).translate(-1.6, 5.2, -0.8))])),
      };
    case 'olive':
      return {
        trunk: n(G.cylinder(0.3, 0.2, 2.2, 6)),
        crown: n(G.merge([n(G.sphere(1.8, 8, 6).scale(1.2, 0.8, 1.1).translate(0, 1.8, 0)), n(G.sphere(1.3, 8, 5).translate(1.1, 2.3, 0.4))])),
      };
    case 'fig':
      return {
        trunk: n(G.cylinder(0.28, 0.2, 2.4, 6)),
        crown: n(G.sphere(2.4, 9, 7).scale(1.2, 0.85, 1.2).translate(0, 1.6, 0)),
      };
    case 'laurel':
      return {
        trunk: n(G.cylinder(0.15, 0.1, 1.2, 5)),
        crown: n(G.sphere(1.3, 8, 6).scale(1, 1.4, 1).translate(0, 0.7, 0)),
      };
    case 'shrub':
      return { trunk: null, crown: n(G.sphere(0.7, 7, 5).scale(1.2, 0.8, 1.2)) };
    case 'grass':
      return { trunk: null, crown: n(G.lathe([[0.0, 0.0], [0.35, 0.05], [0.2, 0.45], [0.0, 0.5]], 6)) };
    default:
      throw new Error(`Tipo de vegetação desconhecido: ${type}`);
  }
}

export class Vegetation {
  constructor(world) {
    this.world = world;
    this.items = [];
  }

  /**
   * @param {string} type  cypress|pine|plane|olive|fig|laurel|shrub|grass
   * @param {object} o { scale (1), y (altura; padrão = terreno), rotY, color }
   */
  add(type, x, z, o = {}) {
    const y = o.y ?? this.world.terrain.heightAt(x, z);
    this.items.push({ type, x, y, z, s: o.scale ?? 1, r: o.rotY ?? ((x * 13.7 + z * 7.3) % 6.28), color: o.color });
  }

  /** Cria os InstancedMesh (chamado pelo Engine antes de World.finalize). */
  build() {
    const byType = new Map();
    for (const it of this.items) {
      if (!byType.has(it.type)) byType.set(it.type, []);
      byType.get(it.type).push(it);
    }
    for (const [type, list] of byType) {
      const g = treeGeoms(type);
      const small = type === 'grass' || type === 'shrub';
      const trunkB = g.trunk ? this.world.instances(`veg:${type}:trunk`, g.trunk, 'woodDark', { maxDistance: small ? 120 : 900, castShadow: true }) : null;
      const crownB = this.world.instances(`veg:${type}:crown`, g.crown, 'foliage', { maxDistance: small ? 120 : 1400, castShadow: !small });
      for (const it of list) {
        const sv = [it.s * (0.9 + ((it.x * 3.1) % 0.2)), it.s, it.s * (0.9 + ((it.z * 2.3) % 0.2))];
        trunkB?.add(it.x, it.y - 0.2, it.z, it.r, sv);
        crownB.add(it.x, it.y - 0.2, it.z, it.r, sv, it.color || FOLIAGE[type]);
      }
      // colisão: troncos das árvores grandes
      if (!small) {
        for (const it of list) {
          this.world.addCollider(G.cylinder(0.35 * it.s, 0.35 * it.s, 3, 6).translate(it.x, it.y, it.z));
        }
      }
    }
  }
}
