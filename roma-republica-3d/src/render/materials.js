/**
 * Biblioteca de materiais do jogo (criados sob demanda e compartilhados).
 *
 * Convenção de UV: o Builder gera UVs em METROS. Cada material define `size`
 * (metros cobertos por uma repetição da textura) e a textura recebe repeat = 1/size.
 * Materiais com `fit: true` esperam UV 0–1 por face (pinturas murais, mosaicos).
 *
 * Todos os materiais usam `vertexColors: true`, de modo que o Builder pode tingir
 * peças individualmente (variação de reboco, sujeira, sombreamento).
 */
import * as THREE from 'three';
import * as T from './textures.js';
import { config } from '../core/config.js';

const S = () => config.quality.textureSize;

/**
 * Definições. `tex()` devolve {map, normalMap?}. `size` em metros.
 * Comentários indicam o material histórico representado.
 */
const DEFS = {
  // --- Pedras ---------------------------------------------------------------
  /** Tufo amarelado (tipo Grotta Oscura / Fidene) em blocos de 2 pés de altura. */
  tufa: { size: 2.4, rough: 0.92, tex: () => T.ashlarTexture(S(), { base: '#a99a74', rows: 4, perRow: 2, seed: 101, pores: 0.04 }) },
  /** Tufo cinzento (cappellaccio), mais antigo e escuro. */
  tufaGrey: { size: 2.4, rough: 0.95, tex: () => T.ashlarTexture(S(), { base: '#8c877a', rows: 4, perRow: 2, seed: 102, pores: 0.06 }) },
  /** Peperino (lapis Albanus / Gabinus): cinza com pintas escuras. */
  peperino: { size: 2.4, rough: 0.9, tex: () => T.ashlarTexture(S(), { base: '#7b7972', rows: 4, perRow: 2, seed: 103, pores: 0.12 }) },
  /** Travertino em grandes blocos (uso crescente no séc. I a.C.). */
  travertine: { size: 3.0, rough: 0.8, tex: () => T.ashlarTexture(S(), { base: '#cbbfa2', rows: 3, perRow: 2, seed: 104, pores: 0.05, streaks: 0.6 }) },
  /** Mármore branco liso (ainda raro na República). */
  marble: { size: 3.0, rough: 0.35, tex: () => T.marbleTexture(S(), { base: '#e4e0d6', seed: 105 }) },
  /** Mármore com veios cinzentos (ex.: Himeto). */
  marbleGrey: { size: 2.0, rough: 0.35, tex: () => T.marbleTexture(S(), { base: '#d9d8d2', vein: '#7d7f80', veinAmt: 0.8, seed: 106 }) },
  /** Estuque branco sobre tufo — acabamento usual de colunas e entablamentos republicanos. */
  stucco: { size: 2.0, rough: 0.75, tex: () => T.plasterTexture(S(), { base: '#ddd4c0', seed: 107, dirt: 0.15, roughness: 0.4 }) },
  /** Concreto com paramento de opus incertum. */
  opusIncertum: { size: 2.0, rough: 0.95, tex: () => T.opusIncertumTexture(S(), { seed: 108 }) },
  /** Opus quasi reticulatum (meados do séc. I a.C.). */
  reticulatum: { size: 1.6, rough: 0.95, tex: () => T.reticulatumTexture(S(), { seed: 109, irregular: 0.35 }) },

  // --- Rebocos e pinturas ----------------------------------------------------
  /** Reboco externo claro (tingido por cor de vértice). */
  plaster: { size: 3.0, rough: 0.95, tex: () => T.plasterTexture(S(), { base: '#e4ddcf', seed: 110, dirt: 0.4 }) },
  /** Reboco interior pobre (insula) — UV fit por parede. */
  plasterPoor: { size: 1, fit: true, rough: 0.97, tex: () => T.plebeianWallTexture(S(), { seed: 111 }) },
  /** Pintura mural do I estilo pompeiano (incrustação) — UV fit. */
  paintFirstStyle: { size: 1, fit: true, rough: 0.6, tex: () => T.firstStyleTexture(Math.max(512, S()), { seed: 112 }) },
  /** Pintura mural do II estilo pompeiano (arquitetônico) — UV fit. */
  paintSecondStyle: { size: 1, fit: true, rough: 0.55, tex: () => T.secondStyleTexture(Math.max(512, S()), { seed: 113 }) },
  /** Variante do II estilo com fundo negro. */
  paintSecondStyleBlack: { size: 1, fit: true, rough: 0.55, tex: () => T.secondStyleTexture(Math.max(512, S()), { seed: 114, main: '#1d1a17', alt: '#6e1a14' }) },

  // --- Coberturas e pisos -----------------------------------------------------
  /** Telhas de terracota (tegulae + imbrices). U ao longo do beiral, V ao longo da água. */
  roofTile: { size: 2.0, rough: 0.85, tex: () => T.roofTileTexture(S(), { cols: 4, rows: 4, seed: 115 }) },
  /** Calçamento poligonal de basalto (silex). */
  basalt: { size: 4.0, rough: 0.8, tex: () => T.basaltPavingTexture(S(), { cells: 6, seed: 116 }) },
  /** Lajes de travertino para praças. */
  slabs: { size: 4.0, rough: 0.8, tex: () => T.slabPavingTexture(S(), { base: '#b9ae94', seed: 117 }) },
  /** Lajes de tufo / pedra local, mais escuras. */
  slabsTufa: { size: 4.0, rough: 0.9, tex: () => T.slabPavingTexture(S(), { base: '#a39577', seed: 118 }) },
  /** Terra batida. */
  dirt: { size: 4.0, rough: 1.0, tex: () => T.dirtTexture(S(), { seed: 119 }) },
  /** Opus signinum (cocciopesto com tesselas brancas). */
  signinum: { size: 2.0, rough: 0.7, tex: () => T.signinumTexture(S(), { seed: 120 }) },
  /** Mosaico de tesselas preto e branco com meandro — UV fit por cômodo. */
  mosaic: { size: 1, fit: true, rough: 0.5, tex: () => T.mosaicTexture(Math.max(512, S()), { seed: 121 }) },

  // --- Madeira, tecidos, metais ---------------------------------------------
  wood: { size: 1.2, rough: 0.8, tex: () => T.woodTexture(S(), { base: '#6e4b2e', seed: 122 }) },
  woodDark: { size: 1.2, rough: 0.8, tex: () => T.woodTexture(S(), { base: '#4a3120', seed: 123 }) },
  woodLight: { size: 1.2, rough: 0.8, tex: () => T.woodTexture(S(), { base: '#9a7650', seed: 124 }) },
  cloth: { size: 1.0, rough: 1.0, tex: () => T.clothTexture(256, { base: '#e6dfcc', seed: 125 }) },
  clothStriped: { size: 2.0, rough: 1.0, tex: () => T.clothTexture(256, { base: '#d8c9a4', stripe: '#8b3a2a', seed: 126 }) },
  bronze: { color: '#8c6a3c', rough: 0.45, metal: 0.85 },
  gold: { color: '#d4af37', rough: 0.3, metal: 1.0 },
  iron: { color: '#4a4846', rough: 0.6, metal: 0.7 },
  terracotta: { color: '#b4683f', rough: 0.85 },
  /** Terracota arquitetônica pintada (antefixas, revestimentos). */
  terracottaPainted: { color: '#c47a46', rough: 0.7 },
  paintRed: { color: '#8e2a1e', rough: 0.7 },
  paintBlue: { color: '#2c4d7a', rough: 0.7 },
  paintYellow: { color: '#c99a3e', rough: 0.7 },
  /** Cor lisa (use com `color` do Builder). */
  flat: { color: '#ffffff', rough: 0.9 },
  water: { color: '#3d5a5e', rough: 0.08, metal: 0.1, transparent: true, opacity: 0.85 },
  foliage: { color: '#ffffff', rough: 0.9 },
  /** Chama de lucerna (emissivo). */
  flame: { color: '#ffb347', emissive: '#ff8c1a', emissiveIntensity: 2.5, rough: 1 },
};

/** Variantes de coluna: caneluras via normal map (U = 1 canelura por repetição). */
const FLUTED_BASES = ['stucco', 'marble', 'travertine', 'tufa', 'peperino'];

class MaterialLibrary {
  constructor() {
    this.cache = new Map();
    this.anisotropy = 4;
  }

  /** Define a anisotropia máxima (chamado pelo Engine após criar o renderer). */
  setAnisotropy(a) {
    this.anisotropy = a;
  }

  /** Lista de chaves disponíveis. */
  keys() {
    return [...Object.keys(DEFS), ...FLUTED_BASES.map((k) => k + 'Fluted')];
  }

  /** Metros por repetição da textura (para cálculo de UV). */
  sizeOf(key) {
    const base = key.replace(/Fluted$/, '').replace(/@interior$/, '');
    return DEFS[base]?.size ?? 1;
  }

  /** O material espera UV 0–1 por face? */
  isFit(key) {
    const base = key.replace(/@interior$/, '');
    return !!DEFS[base]?.fit;
  }

  /**
   * Obtém (ou cria) um material.
   * Sufixos: "Fluted" (caneluras) e "@interior" (menos luz ambiente do céu, p/ interiores).
   */
  get(key) {
    if (this.cache.has(key)) return this.cache.get(key);
    let mat;
    if (key.endsWith('@interior')) {
      mat = this.get(key.replace(/@interior$/, '')).clone();
      mat.envMapIntensity = 0.28;
      mat.name = key;
    } else if (key.endsWith('Fluted')) {
      const baseKey = key.replace(/Fluted$/, '');
      const base = this.get(baseKey);
      mat = base.clone();
      const flute = T.fluteTexture(256, {});
      mat.normalMap = flute.normalMap;
      mat.normalMap.anisotropy = this.anisotropy;
      mat.normalScale = new THREE.Vector2(1, 1);
      // U = canelura (repeat 1), V = altura em metros com o tamanho da textura base
      if (mat.map) {
        mat.map = base.map.clone();
        mat.map.repeat.set(0.25, 1 / this.sizeOf(baseKey));
        mat.map.needsUpdate = true;
      }
      mat.normalMap.repeat.set(1, 1);
      mat.name = key;
    } else {
      const def = DEFS[key];
      if (!def) throw new Error(`Material desconhecido: "${key}"`);
      const params = {
        color: def.color ? new THREE.Color(def.color) : new THREE.Color(0xffffff),
        roughness: def.rough ?? 0.9,
        metalness: def.metal ?? 0,
        vertexColors: true,
      };
      if (def.emissive) {
        params.emissive = new THREE.Color(def.emissive);
        params.emissiveIntensity = def.emissiveIntensity ?? 1;
      }
      if (def.transparent) {
        params.transparent = true;
        params.opacity = def.opacity ?? 1;
      }
      mat = new THREE.MeshStandardMaterial(params);
      if (def.tex) {
        const t = def.tex();
        const rep = def.fit ? 1 : 1 / def.size;
        t.map.repeat.set(rep, rep);
        t.map.anisotropy = this.anisotropy;
        mat.map = t.map;
        if (t.normalMap) {
          t.normalMap.repeat.set(rep, rep);
          t.normalMap.anisotropy = this.anisotropy;
          mat.normalMap = t.normalMap;
          mat.normalScale = new THREE.Vector2(0.8, 0.8);
        }
      }
      mat.name = key;
    }
    this.cache.set(key, mat);
    return mat;
  }
}

export const materials = new MaterialLibrary();
