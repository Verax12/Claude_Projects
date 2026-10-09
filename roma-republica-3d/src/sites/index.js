/**
 * Registro dos sítios (módulos de construção da cidade).
 *
 * Cada sítio é um módulo que exporta por padrão { id, name, shapeTerrain(ctx), build(ctx) }.
 * Os módulos são carregados DINAMICAMENTE pelo Engine (import()), de modo que um erro num
 * sítio não impede o carregamento dos demais, e ?sites= carrega apenas os pedidos.
 *
 * A ordem importa: 'cidade' (preenchimento urbano genérico) vem por último para respeitar
 * as áreas reservadas pelos demais. Entradas com `dev: true` só carregam se pedidas em ?sites=.
 */
export const SITE_LOADERS = [
  { id: 'forum-praca', load: () => import('./forumPiazza.js') },
  { id: 'forum-oeste', load: () => import('./forumWest.js') },
  { id: 'forum-norte', load: () => import('./forumNorth.js') },
  { id: 'forum-sudeste', load: () => import('./forumSouthEast.js') },
  { id: 'forum-iulium', load: () => import('./forumIulium.js') },
  { id: 'capitolio', load: () => import('./capitoline.js') },
  { id: 'palatino', load: () => import('./palatine.js') },
  { id: 'domus-crasso', load: () => import('./domusCrassi.js') },
  { id: 'macellum', load: () => import('./macellum.js') },
  { id: 'subura', load: () => import('./subura.js') },
  { id: 'casa-plebe', load: () => import('./insulaPlebeia.js') },
  { id: 'foricae', load: () => import('./foricae.js') },
  { id: 'circo-maximo', load: () => import('./circusMaximus.js') },
  { id: 'arredores', load: () => import('./surroundings.js') },
  { id: 'cidade', load: () => import('./city.js') },
  { id: 'teste', load: () => import('./_teste.js'), dev: true },
];
