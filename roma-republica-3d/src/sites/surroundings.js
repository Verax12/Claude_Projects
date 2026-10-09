/**
 * Sítio: Arredores — Velabro, Forum Boarium e Forum Holitorium, Tibre e pontes, Campo de Marte
 * (Teatro e Pórtico de Pompeu, templos do Largo Argentina).
 *
 * Momento: início de 44 a.C. (docs/LAYOUT.md §1). Fontes: docs/pesquisa/10 (topografia, Tibre,
 * Forum Boarium), 08 (Forum Holitorium, comércio), 09 (Cloaca Máxima), 11 (materiais, pessoas).
 * Módulos auxiliares em src/sites/arredores/.
 */
import { SITE_AREAS } from '../data/layout.js';
import { padSpecs } from './arredores/terrain.js';
import { buildTiber } from './arredores/tiber.js';

export default {
  id: 'arredores',
  name: 'Arredores: Velabro, Forum Boarium, Tibre e Campo de Marte',

  /** Ajustes de terreno (pads) e reservas de área — chamado antes de gerar o terreno. */
  shapeTerrain(ctx) {
    for (const p of padSpecs()) ctx.terrain.addPad(p);
    for (const poly of SITE_AREAS.arredores) ctx.reserve({ points: poly });
  },

  /** Construção dos edifícios, NPCs, sons, locais de teleporte e pontos de informação. */
  build(ctx) {
    const rnd = ctx.rng(4401);
    buildTiber(ctx, rnd);
    ctx.addLocation({ id: 'forum-boario', name: 'Forum Boarium', latin: 'Forum Boarium', group: 'Arredores', x: -335, z: 385, lookBearing: 280 });
  },
};
