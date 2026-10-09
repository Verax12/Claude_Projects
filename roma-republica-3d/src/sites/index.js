/**
 * Registro dos sítios (módulos de construção da cidade).
 *
 * Cada sítio exporta { id, name, shapeTerrain(ctx), build(ctx) }. A ordem importa:
 * 'cidade' (preenchimento urbano genérico) vem por último para respeitar as áreas
 * reservadas pelos demais. Sítios com `dev: true` só são construídos se pedidos via ?sites=.
 */
import forumPiazza from './forumPiazza.js';
import forumWest from './forumWest.js';
import forumNorth from './forumNorth.js';
import forumSouthEast from './forumSouthEast.js';
import forumIulium from './forumIulium.js';
import capitoline from './capitoline.js';
import palatine from './palatine.js';
import domusCrassi from './domusCrassi.js';
import macellum from './macellum.js';
import subura from './subura.js';
import insulaPlebeia from './insulaPlebeia.js';
import foricae from './foricae.js';
import circusMaximus from './circusMaximus.js';
import city from './city.js';
import teste from './_teste.js';

const ALL = [forumPiazza, forumWest, forumNorth, forumSouthEast, forumIulium, capitoline, palatine, domusCrassi, macellum, subura, insulaPlebeia, foricae, circusMaximus, city, teste];

export const SITES = ALL.filter((s) => !s.dev || (typeof location !== 'undefined' && new URLSearchParams(location.search).get('sites')?.split(',').includes(s.id)));
