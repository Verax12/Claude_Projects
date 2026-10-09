/**
 * Sítio de TESTE do motor (dev: só é construído com ?sites=teste).
 * Exercita todas as peças da biblioteca arquitetônica para validação visual.
 * NÃO representa nenhum edifício histórico.
 */
import { podiumTemple, tholos, statue } from '../arch/temple.js';
import { basilica, portico, insula, houseBlock, taberna } from '../arch/buildings.js';
import { stall, prop } from '../arch/props.js';
import { column } from '../arch/columns.js';
import { facingRotY } from '../core/geo.js';

export default {
  id: 'teste',
  name: 'Teste do motor',
  dev: true,
  shapeTerrain(ctx) {
    ctx.terrain.addPad({ rect: { x: 0, z: 0, w: 260, d: 200 }, height: 0, blend: 20 });
  },
  build(ctx) {
    const b = ctx.builder('teste');
    // piso
    b.floor(120, 60, 0, 0.02, 30, { mat: 'slabs', collide: false });
    // templo de pódio (prostilo hexastilo)
    b.push(-40, 0, -30, facingRotY(180));
    podiumTemple(b, { width: 20, length: 34, podiumHeight: 4, order: 'ionic', columnsFront: 6, columnsDeep: 3, columnHeight: 11, columnDiameter: 1.2, podiumMat: 'travertine', colMat: 'stucco', acroteria: true, stairs: { width: 14, depth: 6 } });
    b.pop();
    // tholos
    b.push(20, 0, -20, facingRotY(180));
    tholos(b, { radius: 7.5, podiumHeight: 2.5, columns: 18, columnHeight: 7.5, columnDiameter: 0.6, order: 'corinthian' });
    b.pop();
    // basílica
    b.push(0, 0, 80, facingRotY(0));
    basilica(b, 60, 26, { height: 8, aisles: 1, gallery: true, facade: 'open', steps: 0.9 });
    b.pop();
    // pórtico
    b.push(60, 0, 20, facingRotY(270));
    portico(b, -15, 15, { depth: 6, columnHeight: 5, order: 'doric', floorMat: 'slabs' });
    b.pop();
    // insulae
    for (let i = 0; i < 4; i++) insula(b, 14, 12, -80 + i * 16, 0, 60, { floors: 3 + (i % 3), seed: i + 1, color: ['#e8dfcf', '#d9c3a0', '#e3c9b0', '#cfc2a8'][i] });
    houseBlock(b, 20, 24, 90, 0, 70, {});
    b.push(40, 0, 50, 0);
    taberna(b, 0, 0, 0, 4, 5, 3.5, {});
    b.pop();
    stall(b, 10, 0, 30, 0, { goods: [{ name: 'amphora', count: 3, scale: 0.6 }, { name: 'bread', count: 2 }] });
    stall(b, 14, 0, 30, 0, { goods: [{ name: 'basket', count: 3 }] });
    prop(b, 'dolium', 18, 0, 33);
    prop(b, 'altar', -40, 0, 5);
    column(b, 0, 0, 20, { order: 'doric', height: 8, diameter: 1 });
    statue(b, 6, 0, 20, { scale: 1 });
    b.finish();

    ctx.vegetation.add('cypress', -15, 10);
    ctx.vegetation.add('pine', 35, 5);
    ctx.vegetation.add('plane', -60, 20);
    ctx.vegetation.add('olive', 30, 40);

    ctx.npcs.addPath([[-60, 15], [0, 15], [50, 15], [50, 45], [-60, 45]], { loop: true, density: 6, width: 4 });
    ctx.npcs.addStatic({ x: 10, z: 31.4, yaw: Math.PI, type: 'merchant', pose: 'work' });
    ctx.npcs.addGroup({ points: [[-60, 25], [50, 25]], leader: 'senator', followers: ['lictor', 'lictor', 'slave'] });

    ctx.audio.addZone({ x: 10, z: 30, radius: 25, type: 'market' });
    ctx.addLocation({ id: 'teste', name: 'Teste', group: 'Desenvolvimento', x: 0, z: 30, lookBearing: 0, start: true });
    ctx.addInfo({ x: 0, z: 30, radius: 15, title: 'Ponto de teste', text: 'Painel de informação de teste.' });
    ctx.addArea({ name: 'Área de teste', latin: 'Area probationis', rect: { x: 0, z: 30, w: 200, d: 150 } });
  },
};
