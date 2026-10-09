/**
 * Engine — monta o jogo: renderizador, cena, mundo, sítios, jogador, NPCs, áudio e UI,
 * e executa o laço principal.
 */
import * as THREE from 'three';
import { config, saveQuality } from './config.js';
import { World } from './World.js';
import { Terrain, padPolygon, signedDistancePoly } from './Terrain.js';
import { Environment } from './Environment.js';
import { Player } from './Player.js';
import { materials } from '../render/materials.js';
import { Vegetation } from '../arch/vegetation.js';
import { NPCSystem } from '../npc/NPCSystem.js';
import { AudioSystem } from '../audio/AudioSystem.js';
import { UI } from '../ui/UI.js';
import { mulberry32 } from '../render/noise.js';
import * as geo from './geo.js';
import { SITES } from '../sites/index.js';

const nextFrame = () => new Promise((r) => requestAnimationFrame(() => r()));

export class Engine {
  constructor(container, uiRoot) {
    this.container = container;
    this.uiRoot = uiRoot;
    this.clock = new THREE.Clock();
    this.elapsed = 0;
    this.fps = 60;
  }

  async start() {
    const q = config.quality;
    // ---------------- UI ----------------
    this.ui = new UI(this.uiRoot, {
      showUI: config.showUI,
      qualityName: config.qualityName,
      time: config.timeOfDay,
      onTeleport: (l) => this.teleportTo(l),
      onQuality: (name) => {
        saveQuality(name);
        if (confirm('Recarregar a página para aplicar a nova qualidade gráfica?')) location.reload();
      },
      onTime: (h) => this.env.setTime(h),
      onAudio: (on) => this.audio.setEnabled(on),
      onVolume: (v) => this.audio.setVolume(v),
      onNPCs: (on) => {
        this.npcs.enabled = on;
        if (!on) for (const im of Object.values(this.npcs.im || {})) im.count = 0;
      },
    });
    this.ui.setProgress(0.02, 'Iniciando o renderizador…');
    await nextFrame();

    // ---------------- renderizador ----------------
    const renderer = new THREE.WebGLRenderer({ antialias: q.antialias, powerPreference: 'high-performance', preserveDrawingBuffer: !config.showUI });
    renderer.setPixelRatio(q.pixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.5;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(renderer.domElement);
    this.renderer = renderer;
    materials.setAnisotropy(Math.min(8, renderer.capabilities.getMaxAnisotropy()));

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.15, q.viewDistance + 4000);
    window.addEventListener('resize', () => this.onResize());

    this.env = new Environment(renderer, this.scene, q);
    this.env.setTime(config.timeOfDay);

    // ---------------- mundo ----------------
    this.world = new World(this.scene);
    this.ui.setProgress(0.06, 'Modelando o relevo das colinas…');
    await nextFrame();
    this.terrain = new Terrain();
    this.world.terrain = this.terrain;
    this.vegetation = new Vegetation(this.world);
    this.npcs = new NPCSystem(this.world, this.scene, q);
    this.npcs.enabled = config.npcs;
    this.audio = new AudioSystem();
    this.reserved = [];

    const ctx = this.makeContext();
    this.ctx = ctx;
    const sites = SITES.filter((s) => !config.onlySites || config.onlySites.includes(s.id));
    // 1) modificações do terreno
    for (const s of sites) {
      try {
        s.shapeTerrain?.(ctx);
      } catch (e) {
        console.error(`[${s.id}] shapeTerrain falhou`, e);
      }
    }
    this.scene.add(this.terrain.build(q));
    // 2) construção dos sítios
    let i = 0;
    for (const s of sites) {
      i++;
      this.ui.setProgress(0.1 + (0.75 * i) / sites.length, `Construindo: ${s.name}…`);
      await nextFrame();
      const t0 = performance.now();
      try {
        await s.build(ctx);
      } catch (e) {
        console.error(`[${s.id}] build falhou`, e);
      }
      if (config.debug) console.log(`[${s.id}] ${(performance.now() - t0).toFixed(0)} ms`);
    }
    this.ui.setProgress(0.88, 'Plantando árvores e calculando colisões…');
    await nextFrame();
    this.vegetation.build();
    this.world.finalize();
    this.ui.setProgress(0.95, 'Povoando as ruas…');
    await nextFrame();
    if (config.npcs) this.npcs.init();

    // ---------------- jogador ----------------
    this.player = new Player(this.camera, renderer.domElement, this.world);
    this.player.onStep = (s) => this.audio.step(s);
    this.player.onLockChange = (locked) => this.ui.setLocked(locked);
    this.player.onFlyChange = (fly) => this.ui.toast(fly ? 'Modo voo ativado (F para sair)' : 'Modo voo desativado');
    this.ui.setLocations(this.world.locations);

    const start = this.world.locations.find((l) => l.id === config.teleportOnStart) || this.world.locations.find((l) => l.start) || this.world.locations[0];
    if (config.camOnStart) {
      const [x, y, z, yaw, pitch] = config.camOnStart;
      this.player.setView(x, y, z, yaw || 0, pitch || 0);
    } else if (start) this.teleportTo(start, true);
    else this.player.teleport(0, 20, 0);

    this.initKeys();
    this.exposeAPI();
    if (new URLSearchParams(location.search).get('colliders') === '1') window.__roma.showColliders(true);
    this.ui.setProgress(1, 'Pronto.');
    this.running = true;
    this.renderer.setAnimationLoop(() => this.frame());
    if (!config.showUI || config.camOnStart || config.teleportOnStart) {
      this.ui.skipLoading();
    } else {
      await this.ui.ready();
      this.audio.start();
      this.renderer.domElement.requestPointerLock?.();
    }
    this.ui.setLocked(false);
    window.__roma.ready = true;
  }

  /** Contexto entregue aos sítios (API pública de construção). */
  makeContext() {
    const world = this.world;
    const self = this;
    return {
      THREE,
      config,
      quality: config.quality,
      world,
      scene: this.scene,
      terrain: this.terrain,
      mats: materials,
      npcs: this.npcs,
      audio: this.audio,
      vegetation: this.vegetation,
      geo,
      /** Cria um Builder (ver core/Builder.js). */
      builder: (name, o) => world.builder(name, o),
      addLocation: (l) => world.addLocation(l),
      addInfo: (i) => world.addInfo(i),
      addArea: (a) => world.addArea(a),
      onUpdate: (fn) => world.onUpdate(fn),
      /** Reserva uma área (o preenchimento urbano genérico não construirá nela). */
      reserve: (p) => self.reserved.push(padPolygon(p)),
      /** Verifica se (x,z) está em área reservada (com margem opcional). */
      isReserved: (x, z, margin = 0) => self.reserved.some((poly) => signedDistancePoly(x, z, poly) > -margin),
      reserved: this.reserved,
      /** Gerador aleatório determinístico. */
      rng: (seed) => mulberry32(seed),
      /** Chão (terreno ou edifícios) em (x,z) — só confiável depois de World.finalize(). */
      groundAt: (x, z, fromY) => world.groundAt(x, z, fromY),
    };
  }

  teleportTo(l, silent = false) {
    const yaw = l.lookBearing != null ? (-l.lookBearing * Math.PI) / 180 : l.yaw || 0;
    this.player.fly = false;
    this.player.teleport(l.x, l.z, yaw, l.y != null ? l.y + 2.5 : 400, 0);
    if (!silent) this.ui.toast(`Teleportado: ${l.name}`);
  }

  initKeys() {
    window.addEventListener('keydown', (e) => {
      if (e.repeat) return;
      if (e.code === 'KeyT') this.ui.toggleTeleport();
      if (e.code === 'KeyH') this.ui.toggleHelp();
      if (e.code === 'KeyI') {
        this.ui.toggleInfo();
        if (this.ui.info.classList.contains('open')) document.exitPointerLock?.();
      }
      if (e.code === 'KeyE' && !this.player.fly && this.interactNPC) {
        const d = this.npcs.talk(this.interactNPC);
        this.ui.showDialog(d);
      }
      if (e.code === 'Escape') {
        this.ui.toggleTeleport(false);
        this.ui.toggleSettings(false);
        this.ui.toggleHelp(false);
      }
    });
  }

  exposeAPI() {
    window.__roma = {
      ready: false,
      engine: this,
      teleport: (id) => {
        const l = this.world.locations.find((x) => x.id === id);
        if (!l) throw new Error(`Local não encontrado: ${id}`);
        this.teleportTo(l, true);
        return l;
      },
      setView: (x, y, z, yaw, pitch) => this.player.setView(x, y, z, yaw, pitch),
      locations: () => this.world.locations.map((l) => ({ id: l.id, name: l.name, group: l.group, x: l.x, z: l.z })),
      stats: () => ({
        calls: this.renderer.info.render.calls,
        triangles: this.renderer.info.render.triangles,
        geometries: this.renderer.info.memory.geometries,
        textures: this.renderer.info.memory.textures,
        colliderTris: this.world.stats.colliderTris,
        instances: this.world.stats.instances,
        npcs: this.npcs.npcs.length,
        fps: Math.round(this.fps),
        player: this.player.position.toArray().map((v) => +v.toFixed(2)),
      }),
      /** Renderiza um quadro imediatamente (útil para capturas sem laço). */
      renderNow: () => this.frame(0.016),
      /**
       * Simula o jogador andando (teste de colisão/escadas): rumo em graus, duração em s.
       * Devolve a trilha de posições dos pés (a cada 0,25 s).
       */
      walk: (bearingDeg, seconds = 3, run = false) => {
        const p = this.player;
        p.fly = false;
        p.yaw = (-bearingDeg * Math.PI) / 180;
        p.keys.add('KeyW');
        if (run) p.keys.add('ShiftLeft');
        const trail = [];
        const dt = 1 / 60;
        const frames = Math.round(seconds / dt);
        for (let f = 0; f < frames; f++) {
          this.frame(dt, false);
          if (f % 15 === 0) trail.push(p.feet.toArray().map((v) => +v.toFixed(2)));
        }
        p.keys.clear();
        return trail;
      },
      /** Mostra/esconde a malha de colisão (wireframe vermelho). */
      showColliders: (on = true) => {
        if (on && !this.world.collider.parent) this.scene.add(this.world.collider);
        this.world.collider.visible = on;
      },
    };
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  /** Um quadro do jogo. `render = false` avança só a simulação (testes automatizados). */
  frame(forcedDt, render = true) {
    const dt = forcedDt ?? Math.min(0.1, this.clock.getDelta());
    this.elapsed += dt;
    this.fps = this.fps * 0.95 + (1 / Math.max(dt, 1e-3)) * 0.05;
    const p = this.player;
    p.enabled = !this.ui.anyPanelOpen();
    p.update(dt);
    if (this.npcs.enabled && this.npcs.im) {
      this.npcs.update(dt, this.camera, p.feet);
      if (!p.fly) this.npcs.pushPlayer(p.position);
    }
    this.world.update(dt, this.elapsed, this.camera);
    this.env.update(p.feet);
    this.audio.update(p.feet, p.feet.y);
    this.updateHUD(dt);
    if (render) this.renderer.render(this.scene, this.camera);
  }

  updateHUD(dt) {
    const ui = this.ui;
    ui.update(dt);
    ui.setHeading(this.player.yaw);
    this.hudTimer = (this.hudTimer || 0) - dt;
    if (this.hudTimer > 0) return;
    this.hudTimer = 0.2;
    const f = this.player.feet;
    // área atual
    let best = null;
    for (const a of this.world.areas || []) {
      const poly = a._poly || (a._poly = padPolygon(a));
      if (signedDistancePoly(f.x, f.z, poly) >= 0 && (!best || a.priority > best.priority)) best = a;
    }
    if (best) ui.showArea(best.name, best.latin);
    // ponto de informação mais próximo
    let info = null;
    let bd = Infinity;
    for (const i of this.world.infos) {
      const d = Math.hypot(f.x - i.x, f.z - i.z);
      if (d < i.radius && d < bd && (i.y == null || Math.abs(f.y - i.y) < 8)) {
        bd = d;
        info = i;
      }
    }
    ui.setNearbyInfo(info);
    // NPC à frente
    if (this.npcs.im && this.npcs.enabled && !this.player.fly) {
      const dir = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.player.yaw);
      const npc = this.npcs.nearestFacing(this.player.position, dir, 3);
      this.interactNPC = npc;
      ui.setInteractNPC(npc ? npc.def.label : null);
    }
    if (ui.statsOn || config.debug) {
      const s = this.renderer.info.render;
      ui.showStats(true);
      ui.setStats(`fps ${this.fps.toFixed(0)}\ndraw calls ${s.calls}\ntriângulos ${(s.triangles / 1000).toFixed(0)}k\npos ${f.x.toFixed(1)}, ${f.y.toFixed(1)}, ${f.z.toFixed(1)}\nrumo ${(((-this.player.yaw * 180) / Math.PI) % 360 + 360) % 360 | 0}°`);
    }
  }
}
