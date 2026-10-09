#!/usr/bin/env node
/**
 * Captura de telas automatizada (desenvolvimento/testes).
 *
 * Sobe um servidor Vite próprio numa porta livre, abre o jogo no Chromium headless
 * (WebGL por software), posiciona a câmera e salva PNGs. Também imprime erros do
 * console e estatísticas de renderização.
 *
 * Uso:
 *   node scripts/shot.mjs --sites=forum-oeste,forum-praca --views='[{"tp":"templo-saturno"},{"cam":[0,40,120,0,-15]}]' --out=screenshots/forum
 * Opções:
 *   --sites=a,b       sítios a construir (padrão: todos)
 *   --views=JSON      lista de vistas: {"tp": id} ou {"cam": [x,y,z,yawGraus,pitchGraus]}; "name" opcional
 *   --out=prefixo     prefixo dos arquivos (padrão screenshots/shot) → prefixo-0.png, -1.png…
 *   --quality=low     qualidade (padrão low, mais rápido em software)
 *   --time=9.5        hora do dia
 *   --w=1280 --h=720  resolução
 *   --npcs=0          desliga NPCs
 *   --ao=1            liga a oclusão de ambiente (GTAO)
 *   --layout=1        desenha os contornos das áreas de cada sítio (docs/LAYOUT.md)
 *   --list            apenas lista os locais de teleporte registrados
 *
 * Vistas podem ter também "colliders": true (mostra a malha de colisão) e
 * "walk": [rumoGraus, segundos, correr] (simula o jogador andando antes da captura;
 * a trilha de posições é impressa — útil para testar escadas, portas e paredes).
 */
import { createServer } from 'vite';
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/);
    return m ? [m[1], m[2] ?? '1'] : [a, '1'];
  }),
);

const views = args.views ? JSON.parse(args.views) : [{}];
const out = args.out || 'screenshots/shot';
const W = Number(args.w || 1280);
const H = Number(args.h || 720);

const server = await createServer({ root, logLevel: 'error', server: { port: 0, host: '127.0.0.1' } });
await server.listen();
const port = server.httpServer.address().port;

const q = new URLSearchParams();
q.set('quality', args.quality || 'low');
q.set('ui', '0');
if (args.sites) q.set('sites', args.sites);
if (args.time) q.set('time', args.time);
if (args.npcs === '0') q.set('npcs', '0');
if (args.ao) q.set('ao', args.ao);
if (args.layout) q.set('layout', '1');
// a primeira vista define o ponto inicial (evita a tela de carregamento)
const v0 = views[0] || {};
if (v0.cam) q.set('cam', v0.cam.join(','));
else if (v0.tp) q.set('tp', v0.tp);
else q.set('cam', '0,60,160,0,-15');

const url = `http://127.0.0.1:${port}/?${q}`;
const browser = await chromium.launch({
  headless: true,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
const page = await browser.newPage({ viewport: { width: W, height: H } });
const errors = [];
page.on('console', (m) => {
  if (m.type() === 'error' || m.type() === 'warning') errors.push(`[${m.type()}] ${m.text()}`);
  else if (m.text().startsWith('walk ')) console.log(m.text());
});
page.on('pageerror', (e) => errors.push(`[pageerror] ${e.message}\n${e.stack || ''}`));

let exitCode = 0;
try {
  const t0 = Date.now();
  await page.goto(url, { waitUntil: 'load', timeout: 120000 });
  await page.waitForFunction(() => window.__roma && window.__roma.ready, null, { timeout: 600000, polling: 500 });
  console.log(`Carregado em ${((Date.now() - t0) / 1000).toFixed(1)} s`);
  if (args.list) {
    console.log(JSON.stringify(await page.evaluate(() => window.__roma.locations()), null, 1));
  }
  mkdirSync(dirname(resolve(root, out)), { recursive: true });
  for (let i = 0; i < views.length; i++) {
    const v = views[i];
    await page.evaluate((v) => {
      const r = window.__roma;
      if (v.cam) r.setView(...v.cam);
      else if (v.tp) r.teleport(v.tp);
      if (v.colliders != null) r.showColliders(!!v.colliders);
      if (v.walk) console.log('walk ' + JSON.stringify(r.walk(...v.walk)));
      // alguns quadros para estabilizar sombras/LOD/NPCs
      for (let k = 0; k < 4; k++) r.renderNow();
    }, v);
    await page.waitForTimeout(Number(args.wait || 300));
    await page.evaluate(() => window.__roma.renderNow());
    const file = resolve(root, `${out}-${v.name || i}.png`);
    await page.screenshot({ path: file });
    const st = await page.evaluate(() => window.__roma.stats());
    console.log(`${file}  ${JSON.stringify(st)}`);
  }
} catch (e) {
  console.error('FALHA:', e.message);
  exitCode = 1;
} finally {
  if (errors.length) {
    console.log('--- Mensagens do console ---');
    for (const e of errors.slice(0, 40)) console.log(e);
  }
  await browser.close();
  await server.close();
  process.exit(exitCode);
}
