/**
 * Interface (HUD): carregamento, menu de teleporte (canto superior direito),
 * configurações, ajuda, bússola, nome da área, painel de informação histórica,
 * diálogo com NPCs e estatísticas de desempenho.
 */
import { QUALITY_PRESETS } from '../core/config.js';

const ICONS = {
  pin: '<svg viewBox="0 0 24 24"><path d="M12 21s-6-5.6-6-11a6 6 0 1 1 12 0c0 5.4-6 11-6 11z"/><circle cx="12" cy="10" r="2.2"/></svg>',
  gear: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"/></svg>',
  help: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5V14"/><circle cx="12" cy="17" r=".6"/></svg>',
  sound: '<svg viewBox="0 0 24 24"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"/></svg>',
  mute: '<svg viewBox="0 0 24 24"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M17 9l5 6M22 9l-5 6"/></svg>',
};

const DIRS = [
  [0, 'N'], [45, 'NE'], [90, 'L'], [135, 'SE'], [180, 'S'], [225, 'SO'], [270, 'O'], [315, 'NO'],
];

export class UI {
  constructor(root, opts) {
    this.root = root;
    this.opts = opts; // callbacks: onTeleport, onQuality, onTime, onAudio, onVolume, onNPCs, onStats
    this.visible = opts.showUI !== false;
    this.areaTimer = 0;
    this.toastTimer = 0;
    this.dialogTimer = 0;
    this.currentInfo = null;
    this.build();
  }

  el(html) {
    const t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content.firstChild;
  }

  build() {
    const r = this.root;
    this.loading = this.el(`
      <div id="loading">
        <h1>ROMA</h1>
        <div class="sub caps">Res publica · c. 50–44 a.C.</div>
        <div class="bar"><div></div></div>
        <div class="status">Preparando…</div>
        <div class="enter">
          <div class="controls">
            <b>Clique</b><span>capturar o mouse / olhar</span>
            <b>W A S D</b><span>andar · <b>Shift</b> correr · <b>Espaço</b> pular</span>
            <b>E</b><span>falar com pessoas</span>
            <b>I</b><span>ler sobre o local</span>
            <b>T</b><span>menu de teleporte</span>
            <b>F</b><span>modo voo · <b>V</b> 3ª pessoa</span>
            <b>H</b><span>ajuda · <b>Esc</b> soltar o mouse</span>
          </div>
          <button class="btn big caps">Entrar em Roma</button>
        </div>
      </div>`);
    document.body.appendChild(this.loading);

    this.topright = this.el(`
      <div id="topright" class="interactive">
        <div class="row">
          <button class="icon-btn" data-act="audio" title="Som ambiente">${ICONS.mute}</button>
          <button class="icon-btn" data-act="help" title="Ajuda (H)">${ICONS.help}</button>
          <button class="icon-btn" data-act="settings" title="Configurações">${ICONS.gear}</button>
          <button class="icon-btn caps" data-act="teleport" title="Teleporte (T)">${ICONS.pin}<span>Locais</span></button>
        </div>
        <div id="teleport" class="panel"></div>
        <div id="settings" class="panel">
          <label>Qualidade gráfica
            <select data-set="quality">${Object.keys(QUALITY_PRESETS).map((q) => `<option value="${q}">${{ low: 'Baixa', medium: 'Média', high: 'Alta' }[q]}</option>`).join('')}</select>
          </label>
          <div class="note">A qualidade é aplicada ao recarregar a página.</div>
          <label>Hora do dia <span data-out="time"></span></label>
          <input type="range" min="6" max="18" step="0.25" data-set="time" style="width:100%">
          <label>Volume <input type="range" min="0" max="1" step="0.05" data-set="volume"></label>
          <label>Pessoas (NPCs) <input type="checkbox" data-set="npcs" checked></label>
          <label>Estatísticas <input type="checkbox" data-set="stats"></label>
        </div>
      </div>`);
    r.appendChild(this.topright);
    this.teleportPanel = this.topright.querySelector('#teleport');
    this.settingsPanel = this.topright.querySelector('#settings');

    this.compass = this.el('<div id="compass"><div class="strip"></div></div>');
    r.appendChild(this.compass);
    const strip = this.compass.querySelector('.strip');
    // marcas a cada 15° repetidas 3 voltas para rolagem contínua
    for (let rep = -1; rep <= 1; rep++) {
      for (let d = 0; d < 360; d += 15) {
        const lbl = DIRS.find((x) => x[0] === d);
        const s = document.createElement('span');
        s.textContent = lbl ? lbl[1] : '·';
        if (lbl && lbl[1].length === 1) s.className = 'major';
        s.style.left = `${(rep * 360 + d) * 2}px`;
        strip.appendChild(s);
      }
    }
    this.compassStrip = strip;

    this.area = this.el('<div id="area"><div class="name"></div><div class="latin"></div></div>');
    r.appendChild(this.area);
    this.hint = this.el('<div id="hint" class="panel"></div>');
    r.appendChild(this.hint);
    this.info = this.el('<div id="info" class="panel interactive"></div>');
    r.appendChild(this.info);
    this.dialog = this.el('<div id="dialog" class="panel"><div class="who"></div><div class="la"></div><div class="pt"></div></div>');
    r.appendChild(this.dialog);
    this.crosshair = this.el('<div id="crosshair"></div>');
    r.appendChild(this.crosshair);
    this.toastEl = this.el('<div id="toast" class="panel"></div>');
    r.appendChild(this.toastEl);
    this.paused = this.el('<div id="paused" class="panel">Clique na tela para continuar explorando<br><small style="color:var(--ui-muted)">T: locais · H: ajuda</small></div>');
    r.appendChild(this.paused);
    this.stats = this.el('<div id="stats" class="panel"></div>');
    r.appendChild(this.stats);
    this.help = this.el(`
      <div id="help" class="panel interactive">
        <button class="btn close" style="float:right">Fechar</button>
        <h2>Roma, c. 50–44 a.C.</h2>
        <p>Explore a cidade no auge do poder de Júlio César, antes dos Idos de Março de 44 a.C.
        A reconstrução procura seguir as fontes antigas e a arqueologia; onde os dados faltam,
        o painel de informação (tecla <span class="kbd">I</span>) indica que se trata de reconstrução hipotética.</p>
        <table>
          <tr><td>Clique</td><td>Capturar o mouse e olhar ao redor</td></tr>
          <tr><td>W A S D / setas</td><td>Andar</td></tr>
          <tr><td>Shift</td><td>Correr</td></tr>
          <tr><td>Espaço</td><td>Pular</td></tr>
          <tr><td>E</td><td>Falar com a pessoa à sua frente</td></tr>
          <tr><td>I</td><td>Abrir/fechar a informação histórica do local</td></tr>
          <tr><td>T</td><td>Menu de teleporte</td></tr>
          <tr><td>F</td><td>Modo voo (Q/E descer/subir, Shift acelera)</td></tr>
          <tr><td>V</td><td>Alternar 1ª / 3ª pessoa</td></tr>
          <tr><td>H</td><td>Esta ajuda</td></tr>
          <tr><td>Esc</td><td>Soltar o mouse</td></tr>
        </table>
        <p style="color:var(--ui-muted);font-size:12px">Fontes e limitações: ver docs/FONTES.md no repositório.</p>
      </div>`);
    r.appendChild(this.help);
    this.help.querySelector('.close').addEventListener('click', () => this.toggleHelp(false));

    // eventos dos botões
    this.topright.addEventListener('click', (e) => {
      const b = e.target.closest('[data-act]');
      if (!b) return;
      const act = b.dataset.act;
      if (act === 'teleport') this.toggleTeleport();
      if (act === 'settings') this.toggleSettings();
      if (act === 'help') this.toggleHelp();
      if (act === 'audio') {
        this.audioOn = !this.audioOn;
        b.innerHTML = this.audioOn ? ICONS.sound : ICONS.mute;
        this.opts.onAudio?.(this.audioOn);
      }
    });
    const q = this.settingsPanel.querySelector('[data-set="quality"]');
    q.value = this.opts.qualityName;
    q.addEventListener('change', () => this.opts.onQuality?.(q.value));
    const time = this.settingsPanel.querySelector('[data-set="time"]');
    time.value = this.opts.time;
    const timeOut = this.settingsPanel.querySelector('[data-out="time"]');
    const fmt = (h) => `${Math.floor(h)}h${String(Math.round((h % 1) * 60)).padStart(2, '0')}`;
    timeOut.textContent = fmt(Number(time.value));
    time.addEventListener('input', () => (timeOut.textContent = fmt(Number(time.value))));
    time.addEventListener('change', () => this.opts.onTime?.(Number(time.value)));
    const vol = this.settingsPanel.querySelector('[data-set="volume"]');
    vol.value = 0.6;
    vol.addEventListener('input', () => this.opts.onVolume?.(Number(vol.value)));
    this.settingsPanel.querySelector('[data-set="npcs"]').addEventListener('change', (e) => this.opts.onNPCs?.(e.target.checked));
    this.settingsPanel.querySelector('[data-set="stats"]').addEventListener('change', (e) => this.showStats(e.target.checked));

    if (!this.visible) this.root.style.display = 'none';
  }

  /* -------------------------------- carregamento -------------------------------- */

  setProgress(p, text) {
    this.loading.querySelector('.bar > div').style.width = `${Math.round(p * 100)}%`;
    if (text) this.loading.querySelector('.status').textContent = text;
  }

  /** Mostra o botão "Entrar"; resolve quando clicado. */
  ready() {
    return new Promise((resolve) => {
      this.loading.querySelector('.status').textContent = 'Pronto.';
      const enter = this.loading.querySelector('.enter');
      enter.style.display = 'flex';
      enter.querySelector('button').addEventListener('click', () => {
        this.loading.remove();
        resolve();
      }, { once: true });
    });
  }

  /** Esconde a tela de carregamento imediatamente (modo captura/teste). */
  skipLoading() {
    this.loading.remove();
  }

  /* --------------------------------- teleporte --------------------------------- */

  setLocations(locations) {
    const groups = new Map();
    for (const l of locations) {
      if (!groups.has(l.group)) groups.set(l.group, []);
      groups.get(l.group).push(l);
    }
    this.teleportPanel.innerHTML = '';
    for (const [g, list] of groups) {
      const h = document.createElement('h3');
      h.textContent = g;
      this.teleportPanel.appendChild(h);
      for (const l of list) {
        const b = document.createElement('button');
        b.innerHTML = `${l.name}${l.latin ? `<small>${l.latin}</small>` : ''}`;
        b.addEventListener('click', () => {
          this.toggleTeleport(false);
          this.opts.onTeleport?.(l);
        });
        this.teleportPanel.appendChild(b);
      }
    }
  }

  toggleTeleport(force) {
    const open = force ?? !this.teleportPanel.classList.contains('open');
    this.teleportPanel.classList.toggle('open', open);
    if (open) {
      this.settingsPanel.classList.remove('open');
      document.exitPointerLock?.();
    }
  }

  toggleSettings(force) {
    const open = force ?? !this.settingsPanel.classList.contains('open');
    this.settingsPanel.classList.toggle('open', open);
    if (open) {
      this.teleportPanel.classList.remove('open');
      document.exitPointerLock?.();
    }
  }

  toggleHelp(force) {
    const open = force ?? !this.help.classList.contains('open');
    this.help.classList.toggle('open', open);
    if (open) document.exitPointerLock?.();
  }

  anyPanelOpen() {
    return this.teleportPanel.classList.contains('open') || this.settingsPanel.classList.contains('open') || this.help.classList.contains('open');
  }

  /* --------------------------------- HUD dinâmico -------------------------------- */

  setLocked(locked) {
    this.crosshair.classList.toggle('show', locked);
    this.paused.classList.toggle('show', !locked && !this.anyPanelOpen() && !this.info.classList.contains('open'));
  }

  /** Atualiza a bússola: yaw em radianos (0 = norte). */
  setHeading(yaw) {
    let deg = ((-yaw * 180) / Math.PI) % 360;
    if (deg < 0) deg += 360;
    this.compassStrip.style.left = `${160 - deg * 2}px`;
  }

  showArea(name, latin) {
    if (this.lastArea === name) return;
    this.lastArea = name;
    this.area.querySelector('.name').textContent = name;
    this.area.querySelector('.latin').textContent = latin || '';
    this.area.classList.add('show');
    this.areaTimer = 4;
  }

  /** Ponto de informação próximo (ou null). */
  setNearbyInfo(info) {
    if (info === this.currentInfo) return;
    this.currentInfo = info;
    if (!info && this.info.classList.contains('open')) this.closeInfo();
    this.updateHint();
  }

  setInteractNPC(label) {
    this.npcLabel = label;
    this.updateHint();
  }

  updateHint() {
    const parts = [];
    if (this.npcLabel) parts.push(`<span class="kbd">E</span>Falar (${this.npcLabel})`);
    if (this.currentInfo && !this.info.classList.contains('open')) parts.push(`<span class="kbd">I</span>${this.currentInfo.title}`);
    this.hint.innerHTML = parts.join('<br>');
    this.hint.classList.toggle('show', parts.length > 0);
  }

  toggleInfo() {
    if (this.info.classList.contains('open')) return this.closeInfo();
    const i = this.currentInfo;
    if (!i) return;
    const esc = (s) => String(s ?? '');
    this.info.innerHTML = `
      <button class="btn close">Fechar</button>
      <h2>${esc(i.title)}</h2>
      ${i.latin ? `<div class="latin">${esc(i.latin)}</div>` : ''}
      ${i.date ? `<div class="date">${esc(i.date)}</div>` : ''}
      ${(Array.isArray(i.text) ? i.text : [i.text]).filter(Boolean).map((p) => `<p>${esc(p)}</p>`).join('')}
      ${i.uncertain ? `<p class="uncertain">${esc(i.uncertain)}</p>` : ''}
      ${i.sources ? `<div class="sources"><b>Fontes:</b> ${(Array.isArray(i.sources) ? i.sources : [i.sources]).map(esc).join('; ')}</div>` : ''}`;
    this.info.querySelector('.close').addEventListener('click', () => this.closeInfo());
    this.info.classList.add('open');
    this.hint.classList.remove('show');
  }

  closeInfo() {
    this.info.classList.remove('open');
    this.updateHint();
  }

  showDialog(d) {
    this.dialog.querySelector('.who').textContent = d.label;
    this.dialog.querySelector('.la').textContent = `“${d.latin}”`;
    this.dialog.querySelector('.pt').textContent = d.pt;
    this.dialog.classList.add('show');
    this.dialogTimer = 4.5;
  }

  toast(text, sec = 2.2) {
    this.toastEl.textContent = text;
    this.toastEl.classList.add('show');
    this.toastTimer = sec;
  }

  showStats(on) {
    this.stats.classList.toggle('show', on);
    this.statsOn = on;
  }

  setStats(text) {
    if (this.statsOn) this.stats.textContent = text;
  }

  update(dt) {
    if (this.areaTimer > 0) {
      this.areaTimer -= dt;
      if (this.areaTimer <= 0) this.area.classList.remove('show');
    }
    if (this.toastTimer > 0) {
      this.toastTimer -= dt;
      if (this.toastTimer <= 0) this.toastEl.classList.remove('show');
    }
    if (this.dialogTimer > 0) {
      this.dialogTimer -= dt;
      if (this.dialogTimer <= 0) this.dialog.classList.remove('show');
    }
  }
}
