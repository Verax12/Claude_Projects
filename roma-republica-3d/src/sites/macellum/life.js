/**
 * Macellum — vida: tipos de NPC do mercado, caminhos, vendedores parados, guardas da lei
 * suntuária, sons, áreas nomeadas, painéis de informação e local de teleporte.
 *
 * Tipos de NPC atestados (nota 08 §9): cupediarii, cetarii/piscatores, lanii, coqui, fartores,
 * pomarii, aucupes, holitores, pistores, tibicinae contratáveis; custodes, lictores e milites
 * da lei suntuária de César (Suet. Iul. 43.2). As falas são frases latinas simples compostas
 * para o jogo (não são citações).
 */
import { NPC_TYPES } from '../../npc/npcTypes.js';
import { forumUV } from '../../data/layout.js';
import { M, FB, Y0, WINGS, COURT, ROT, LOT } from './frame.js';
import { STALLS } from './market.js';

/* ======================================================================= */
/*  Tipos de NPC do mercado                                                  */
/* ======================================================================= */

/**
 * Registra tipos próprios (chaves "mac-*") no catálogo de NPCs. O motor não oferece falas por
 * NPC parado, por isso cada ofício vira um tipo com rótulo e falas próprias (ver coreIssues).
 */
export function registerNPCTypes() {
  const base = NPC_TYPES.merchant?.make || NPC_TYPES.citizen.make;
  const woman = NPC_TYPES.woman?.make || base;
  const citizen = NPC_TYPES.citizen.make;
  const def = (key, label, make, lines) => {
    if (!NPC_TYPES[key]) NPC_TYPES[key] = { label, make, lines };
  };
  def('mac-piscator', 'Peixeiro (piscator)', base, [
    ['Pisces recentes! Hodie capti!', 'Peixes frescos! Pescados hoje!'],
    ['Muraenas habeo et ostreas Lucrinas!', 'Tenho moreias e ostras do Lucrino!'],
    ['Thynnum magnum vide!', 'Olha que atum grande!'],
    ['Carum? Minime! Recens est.', 'Caro? De jeito nenhum! Está fresco.'],
  ]);
  def('mac-lanius', 'Açougueiro (lanius)', base, [
    ['Agnina, vitulina, porcina!', 'Cordeiro, vitela, porco!'],
    ['Quot libras vis?', 'Quantas libras queres?'],
    ['Statera mea iusta est.', 'A minha balança é justa.'],
    ['Aprum totum habeo!', 'Tenho um javali inteiro!'],
  ]);
  def('mac-cupediarius', 'Vendedor de iguarias (cupediarius)', base, [
    ['Vinum Falernum! Vinum Chium!', 'Vinho falerno! Vinho de Quios!'],
    ['Garum optimum!', 'Garum da melhor qualidade!'],
    ['Piper? Rarum et carum est.', 'Pimenta? É rara e cara.'],
    ['Mel et caseum fumosum habeo.', 'Tenho mel e queijo defumado.'],
  ]);
  def('mac-pomarius', 'Fruteiro (pomarius)', base, [
    ['Cerasa! Poma nova e Ponto!', 'Cerejas! A fruta nova do Ponto!'],
    ['Cauneas! Cauneas!', 'Figos de Cauno! Figos de Cauno!'],
    ['Mala, pira, cydonia!', 'Maçãs, peras, marmelos!'],
  ]);
  def('mac-holitor', 'Verdureiro (holitor)', base, [
    ['Caules, porri, fungi!', 'Couves, alhos-porós, cogumelos!'],
    ['Haec lex non vetat.', 'Isto a lei não proíbe.'],
    ['Betam et malvam emite!', 'Comprem beterraba e malva!'],
  ]);
  def('mac-pistor', 'Padeiro (pistor)', base, [
    ['Panem recentem!', 'Pão fresco!'],
    ['Panis calidus, modo coctus!', 'Pão quente, acabado de assar!'],
  ]);
  def('mac-auceps', 'Passarinheiro (auceps)', base, [
    ['Turdi pingues!', 'Tordos gordos!'],
    ['Gallinas et anseres vendo.', 'Vendo galinhas e gansos.'],
    ['Pavonem vis? Magno constat.', 'Queres um pavão? Custa caro.'],
  ]);
  def('mac-coquus', 'Cozinheiro de aluguel (coquus)', base, [
    ['Coquum conducere vis?', 'Queres contratar um cozinheiro?'],
    ['Cenam lautam tibi coquam.', 'Cozinho para ti um jantar requintado.'],
    ['Vasa et cultros mecum fero.', 'Trago comigo as panelas e as facas.'],
  ]);
  def('mac-tibicina', 'Flautista (tibicina)', (r) => ({ ...woman(r), carry: null }), [
    ['Tibicinam ad cenam vis?', 'Queres uma flautista para o jantar?'],
    ['Tibiis cano.', 'Toco a flauta dupla.'],
  ]);
  def('mac-custos', 'Guarda (custos)', (r) => ({ ...citizen(r), robe: null, toga: null, tunic: ['#6b5a3a', '#7a4a32', '#5e5040'][Math.floor(r() * 3) % 3] }), [
    ['Quid in sporta portas?', 'O que levas na cesta?'],
    ['Lex sumptuaria Caesaris!', 'A lei suntuária de César!'],
    ['Obsonia vetita vendere non licet.', 'Não é permitido vender iguarias proibidas.'],
    ['Circumspice: custodes ubique sunt.', 'Olha em volta: há guardas por toda parte.'],
  ]);
}

/* ======================================================================= */
/*  Caminhos de NPC, parados, séquito, som                                   */
/* ======================================================================= */

/** Extremo da rua de acesso no eixo do Argileto (u = 21,3; v = 130 → x local −78,7). */
export const STREET = { x0: -M.OX, x1: -78.7, half: 2.6, paveEnd: -76.4, reserveEnd: -76.0 };

const MIX_MARKET = { woman: 4, slave: 4, citizen: 3, merchant: 1, child: 1, 'mac-coquus': 0.4, senator: 0.15 };
const MIX_STREET = { citizen: 3, woman: 3, slave: 3, merchant: 1, child: 1 };

export function addLife(ctx, shops, closed) {
  const P = (x, z) => FB.xz(x, z);
  const n = ctx.npcs;

  // --- pórtico (volta completa, a meio do pórtico, longe das bancas dos cozinheiros) ---
  const px = M.OX - 8.3;
  const pz = M.OZ - 8.3;
  n.addPath([P(-px, -pz), P(0, -pz), P(px, -pz), P(px, 0), P(px, pz), P(0, pz), P(-px, pz), P(-px, 0)], { loop: true, density: 8, width: 1.4, mix: MIX_MARKET, name: 'macellum-portico' });
  // --- volta externa do pátio (entre bancas e estilóbata) ---
  const cx = COURT.hx - 1.0;
  const cz = COURT.hz - 1.6;
  n.addPath([P(-cx, -cz), P(0, -cz), P(cx, -cz), P(cx, 0), P(cx, cz), P(0, cz), P(-cx, cz), P(-cx, 0)], { loop: true, density: 6, width: 1.2, mix: MIX_MARKET, name: 'macellum-patio' });
  // --- anel em volta do tholos ---
  const ring = [];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    ring.push(P(Math.sin(a) * 7.4, Math.cos(a) * 7.4));
  }
  n.addPath(ring, { loop: true, density: 9, width: 1.2, mix: MIX_MARKET, name: 'macellum-tholos' });
  // --- corredores diante das mesas do peixe e das bancas de verduras ---
  n.addPath([P(-cx, 8.6), P(-9, 8.6), P(0, 8.6), P(9, 8.6), P(cx, 8.6)], { density: 8, width: 1.0, mix: MIX_MARKET });
  n.addPath([P(-cx, -8.6), P(-9, -8.6), P(0, -8.6), P(9, -8.6), P(cx, -8.6)], { density: 8, width: 1.0, mix: MIX_MARKET });
  // --- eixos: portões → pórtico → pátio → tholos ---
  n.addPath([P(0, M.OZ + 2.4), P(0, M.OZ - 0.6), P(0, pz), P(0, cz), P(0, 8.6), P(0, 7.4)], { density: 7, width: 1.6, mix: MIX_MARKET });
  n.addPath([P(-M.OX - 1.2, 0), P(-M.OX + 0.6, 0), P(-px, 0), P(-cx, 0), P(-7.4, 0)], { density: 7, width: 1.6, mix: MIX_MARKET });
  n.addPath([P(0, -pz), P(0, -cz), P(0, -8.6), P(0, -7.4)], { density: 5, width: 1.2, mix: MIX_MARKET });
  n.addPath([P(px, 0), P(cx, 0), P(7.4, 0)], { density: 5, width: 1.2, mix: MIX_MARKET });

  // --- rua de acesso a partir do Argileto, e trechos do Argileto até as junções do LAYOUT ---
  const argA = forumUV(-16, 60); // junção Fórum ↔ Argileto (40, −40)
  const argB = forumUV(40, 165); // junção Argileto ↔ Subura (140, −105)
  const meet = FB.xz(STREET.x1, 0);
  n.addPath([P(-M.OX - 1.2, 0), P(-55, 0), meet], { density: 4, width: 2.0, mix: MIX_STREET, name: 'macellum-rua' });
  n.addPath([[+argA.x.toFixed(2), +argA.z.toFixed(2)], meet, [+argB.x.toFixed(2), +argB.z.toFixed(2)]], { density: 3, width: 2.4, mix: MIX_STREET, name: 'argileto (ligação)' });

  // --- séquito: lictor e soldados enviados para fiscalizar (Suet. Iul. 43.2) ---
  n.addGroup({ points: [P(-cx, cz), P(0, cz), P(cx, cz), P(cx, 0), P(cx, -cz), P(0, -cz), P(-cx, -cz), P(-cx, 0), P(-cx, cz)], loop: true, leader: 'soldier', followers: ['lictor', 'soldier'] });

  // --- parados ---
  const yaw = (F, dx, dz) => F.yawOf(dx, dz);
  const stat = (F, lx, lz, dx, dz, type, pose = 'work') => {
    const p = F.toWorld(lx, lz);
    n.addStatic({ x: +p.x.toFixed(2), z: +p.z.toFixed(2), yaw: yaw(F, dx, dz), type, pose });
  };
  // guardas (custodes) "ao redor do macellum", por fora dos portões
  stat(FB, -3.1, M.OZ + 1.0, 0, 1, 'mac-custos', 'stand');
  stat(FB, 3.1, M.OZ + 1.1, 0.3, 1, 'mac-custos', 'stand');
  stat(FB, -M.OX - 1.0, -3.0, -1, 0.2, 'mac-custos', 'stand');
  // vendedores das mesas do peixe e das bancas
  for (const i of [0, 2, 4]) {
    const s = STALLS.fish[i];
    stat(FB.child(s.x, s.z, s.rot), 0.2, -0.85, 0, 1, 'mac-piscator', i === 2 ? 'gesture' : 'work');
  }
  [[0, 'mac-pomarius'], [3, 'mac-holitor'], [4, 'mac-holitor']].forEach(([i, t]) => {
    const s = STALLS.green[i];
    stat(FB.child(s.x, s.z, s.rot), -0.2, -0.85, 0, 1, t, i === 0 ? 'gesture' : 'work');
  });
  {
    const s = STALLS.bread;
    stat(FB.child(s.x, s.z, s.rot), 0, -0.85, 0, 1, 'mac-pistor', 'gesture');
    const c = STALLS.cages;
    stat(FB.child(c.x, c.z, c.rot), 0.3, -0.85, 0, 1, 'mac-auceps', 'sit');
    const k = STALLS.cooks;
    const Fk = FB.child(k.x, k.z, 0);
    stat(Fk, -0.35, -0.5, 0, 1, 'mac-coquus', 'work');
    stat(Fk, -1.8, -0.2, 0.4, 1, 'mac-coquus', 'sit');
    stat(Fk, 2.4, 0.1, -0.5, 1, 'mac-tibicina', 'gesture');
  }
  // lojistas (atrás do balcão, voltados para o pórtico)
  const keeper = { S: [1, 'mac-piscator'], E: [2, 'mac-lanius'], N: [0, 'mac-cupediarius'], W: [3, 'mac-pistor'] };
  for (const w of WINGS) {
    const [idx, type] = keeper[w.id];
    const s = shops[w.id][idx];
    if (!s || closed[w.id]?.has(idx)) continue;
    const x = s.counter ? s.counter.x : s.cx;
    stat(w.frame, x, M.SHOP_IN - 1.25, 0, 1, type, 'work');
  }

  // --- sons ---
  const at = (x, z) => FB.toWorld(x, z);
  let p = at(0, 0);
  ctx.audio.addZone({ x: p.x, z: p.z, radius: 42, type: 'market', gain: 1.0 });
  p = at(14, 0);
  ctx.audio.addZone({ x: p.x, z: p.z, radius: 13, type: 'animals', gain: 0.8 });
  p = at(19.5, -5);
  ctx.audio.addZone({ x: p.x, z: p.z, radius: 9, type: 'birds', gain: 0.6 });
  p = at(0, 0);
  ctx.audio.addZone({ x: p.x, z: p.z, radius: 7, type: 'water', gain: 0.35 });
  p = at(-55, 0);
  ctx.audio.addZone({ x: p.x, z: p.z, radius: 20, type: 'crowd', gain: 0.5 });
}

/* ======================================================================= */
/*  Áreas, teleporte e painéis                                               */
/* ======================================================================= */

/** Retângulo (quadro do edifício) → descrição de área/pad no mundo. */
function rectW(x0, x1, z0, z1) {
  const c = FB.toWorld((x0 + x1) / 2, (z0 + z1) / 2);
  return { x: c.x, z: c.z, w: Math.abs(x1 - x0), d: Math.abs(z1 - z0), rotY: ROT };
}

export function addPlaces(ctx) {
  // ---------------- áreas nomeadas ----------------
  ctx.addArea({ name: 'Macellum', latin: 'Macellum', rect: rectW(-LOT.w / 2, LOT.w / 2, -LOT.d / 2, LOT.d / 2), priority: 2 });
  ctx.addArea({ name: 'Mercado do peixe (hipótese)', latin: 'Forum Piscarium', rect: rectW(-COURT.hx, COURT.hx, 8, M.OZ), priority: 3 });
  ctx.addArea({ name: 'Iguarias e vinhos (hipótese)', latin: 'Forum Cuppedinis', rect: rectW(-COURT.hx, COURT.hx, -M.OZ, -COURT.hz), priority: 3 });
  ctx.addArea({ name: 'Cozinheiros de aluguel', latin: 'Forum Coquinum', rect: rectW(-4, 4, -M.OZ + M.FRONT, -COURT.hz), priority: 4 });
  ctx.addArea({ name: 'Açougues (hipótese)', latin: 'Laniena', rect: rectW(COURT.hx, M.OX, -COURT.hz, COURT.hz), priority: 3 });
  ctx.addArea({ name: 'Acesso ao Macellum pelo Argileto', latin: '', rect: rectW(STREET.x1 + 1.5, -M.OX, -STREET.half, STREET.half), priority: 1 });

  // ---------------- teleporte ----------------
  const tp = FB.toWorld(-1.2, 15.0);
  ctx.addLocation({ id: 'macellum', name: 'Macellum (mercado)', latin: 'Macellum', group: 'Comércio', x: +tp.x.toFixed(2), z: +tp.z.toFixed(2), lookBearing: Math.round(FB.bearingOf(0, -1)) });

  // ---------------- painéis de informação ----------------
  const info = (x, z, radius, o) => {
    const p = FB.toWorld(x, z);
    ctx.addInfo({ x: +p.x.toFixed(2), z: +p.z.toFixed(2), y: Y0, radius, ...o });
  };

  info(0, 0, 10, {
    title: 'Macellum — o mercado de iguarias',
    latin: 'Macellum',
    date: 'Reconstruído em 209 a.C.; obra de lojas em 179 a.C.; em uso em 44 a.C.',
    text: [
      'O macellum reunia num só lugar o comércio de víveres finos: Varrão diz que, depois que tudo o que dizia respeito à alimentação foi "reunido num só lugar" e edificado, o lugar passou a se chamar Macellum. Ficava atrás (ao norte) da Basílica Emília/Paulli, na área que muito depois seria ocupada pelo Fórum de Nerva e pelo Templum Pacis — monumentos imperiais que ainda não existem.',
      'Lívio registra o incêndio de 210 a.C., que queimou o forum piscatorium junto ao Fórum, e a recontratação do "macellum" pelos censores em 209 a.C. Em 179 a.C., o censor M. Fúlvio contratou uma obra "cercada de lojas que vendeu a particulares" — o texto admite ler uma só basílica ou uma basílica e um mercado de peixe; não se crava o autor do macellum.',
      'Em 44 a.C. ele funciona a pleno: Terêncio e Cícero (De Officiis, escrito neste mesmo ano) listam quem acorre ao macellum — vendedores de iguarias (cupediarii), peixeiros de peixe grande (cetarii), açougueiros (lanii), cozinheiros (coqui), engordadores de aves e salsicheiros (fartores) e pescadores. Banquetes públicos e triunfos "inflamam o preço do macellum" (Varrão).',
    ],
    uncertain:
      'Reconstrução hipotética: planta, dimensões (aqui 66 × 54 m), número de lojas (45), entradas, orientação, materiais e o próprio tholos central NÃO foram encontrados nas fontes. A forma "tholos cercado de lojas" vem de uma frase de Platner & Ashby não reconferida, e o trecho de Varrão (LL 5.146–147) não fala em tholos nem em lojas. A localização atrás da Basílica Paulli (identificação de Morselli & Tortorici) também não pôde ser confirmada. Tufo, estuque, telhas e madeira foram escolhidos por coerência com a época (sem mármore).',
    sources: [
      'Varrão, De Lingua Latina 5.146–147, 5.152',
      'Lívio 26.27.2–3; 27.11.16; 40.51.5',
      'Terêncio, Eunuchus 255–257',
      'Cícero, De Officiis 1.150',
      'Varrão, De Re Rustica 3.2',
      'Platner & Ashby, A Topographical Dictionary of Ancient Rome (1929), "Macellum"',
      'Digital Augustan Rome, "Macellum (Forum Romanum)"',
    ],
  });

  info(0, M.OZ + 2.0, 7, {
    title: 'Guardas da lei suntuária de César',
    latin: 'Custodes circa macellum',
    date: 'Lei de 46 a.C., em vigor no início de 44 a.C.',
    text: [
      'Suetônio conta que César, ditador, "aplicou com rigor sobretudo a lei suntuária, pondo guardas ao redor do macellum", que apreendiam as iguarias vendidas contra a proibição; às vezes mandava lictores e soldados tirar da sala de jantar o que já estava servido. Dião acrescenta que ele limitou os gastos dos ricos "com forte vigilância".',
      'Verduras, cogumelos e tudo o que "nasce da terra" ficavam isentos — e os ricos passaram a temperá-los com tanto requinte que Cícero, que se abstinha facilmente de ostras e moreias, adoeceu com beterraba e malva num jantar de áugures (46 a.C.). Em junho de 45 a.C., na ausência de César, Cícero já a dava por "negligenciada".',
      'Ao lado do portão, a tábua caiada (album) lembra os editos dos edis, que fiscalizavam padeiros, peixeiros e açougueiros. Os dois edis "cereais" criados por César só exerceriam a partir de 43 a.C.',
    ],
    uncertain: 'O conteúdo exato da lei de César NÃO foi encontrado. Guardas, tábua do edito e portão são reconstrução hipotética; os textos da tábua são ilegíveis de propósito.',
    sources: ['Suetônio, Divus Iulius 43.2', 'Dião Cássio 43.25.2; 43.51.3', 'Cícero, Ad Familiares 7.26.2; 9.15.5', 'Cícero, Ad Atticum 13.7.1', 'Plauto, Captivi 807–823 (editos edilícios)', 'Aulo Gélio 4.2.1'],
  });

  info(0, 11.5, 9, {
    title: 'Mercado do peixe',
    latin: 'Forum Piscarium / Piscatorium',
    date: 'Atestado em 210 e 179 a.C.; absorvido pelo macellum',
    text: [
      'Lívio põe o forum piscatorium junto ao Fórum e à basílica; Plauto menciona "os que fazem vaquinha para jantar, junto ao forum piscarium". Platner diz que ele foi absorvido pelo macellum. Varrão, porém, situa um Forum Piscarium "ao longo do Tibre, junto ao Portúnio" — divergência que as fontes não resolvem.',
      'Peixe de luxo da época: moreias (C. Hírrio emprestou 6.000 para os banquetes triunfais de César), ostras (os viveiros de Sérgio Orata preferiam as do Lucrino) e atum, vendido pelos cetarii. Depois da morte de Lúculo, os peixes do seu viveiro foram vendidos por 4 milhões de sestércios.',
      'Plauto descreve peixeiros cujo cheiro "expulsa para o Fórum" os ociosos que ficam sob a basílica — sinal de proximidade, não prova de um mercado colado a ela.',
    ],
    uncertain: 'Reconstrução hipotética: o setor do peixe dentro do macellum, do lado da basílica; mesas com tampo de pedra, canaleta de drenagem e cochos de água; toldos de linho. Nada disso tem medida ou descrição nas fontes.',
    sources: ['Lívio 26.27.3; 40.51.5', 'Plauto, Curculio 474; Captivi 813–816', 'Varrão, De Lingua Latina 5.146', 'Plínio, Naturalis Historia 9.168, 9.170–171', 'Terêncio, Eunuchus 257', 'Cícero, Ad Familiares 7.26.2'],
  });

  info(M.OX - 8.0, 0, 8, {
    title: 'Açougueiros e a balança romana',
    latin: 'Lanii; statera',
    date: 'c. 200–44 a.C.',
    text: [
      '"Vou ao macellum, pergunto pelos peixes: dizem-me caros; cordeiro caro, caro o boi, a vitela, o atum, o porco: tudo caro" — reclama um personagem de Plauto. O javali inteiro à mesa era novidade recente: o primeiro a servi-lo foi P. Servílio, pai do Rulo de 63 a.C.',
      'Os antigos açougues junto às Tabernae Veteres, no lado sul do Fórum, tinham sido comprados pelo Estado e demolidos em 169 a.C. para a Basílica Semprônia; em 44 a.C. a carne fina se compra aqui.',
      'A balança é a statera, descrita por Vitrúvio: a alça fica perto da "cabeça", de onde pende o prato pequeno; o contrapeso corre pelos pontos do braço e equilibra, com pouco peso, uma carga enorme.',
    ],
    uncertain: 'A ala dos açougues, os trilhos com ganchos e a disposição das lojas são reconstrução hipotética.',
    sources: ['Plauto, Aulularia 373–375', 'Plínio, Naturalis Historia 8.210', 'Lívio 44.16.10', 'Vitrúvio, De Architectura 10.3.4, 10.3.7'],
  });

  info(-14, -M.OZ + 7.6, 8, {
    title: 'Iguarias, vinhos e especiarias',
    latin: 'Forum Cuppedinis',
    date: 'Mercados reunidos no macellum (data não dada por Varrão)',
    text: [
      'Varrão situa o Forum Cuppedinis "junto aos Corneta", um lugar elevado entre a Via Sacra e o Macellum; o nome viria de cuppedium, isto é, "fastio" (muitos diziam Forum Cupidinis, de cupiditas). Os cupediarii vendiam as iguarias.',
      'Nos triunfos de 46 a.C., César distribuiu ânforas de Falerno e cadi de vinho de Quios, e no seu terceiro consulado serviu pela primeira vez quatro vinhos juntos: Falerno, Quios, Lésbio e Mamertino. O garum era um molho de vísceras de peixe maceradas em sal. Em 52 a.C. a Itália já exportava azeite.',
      'A pimenta não aparece nas fontes deste período (só a partir de Horácio): aqui é item raríssimo e caro. Não há açúcar como alimento, nem damasco, pistache ou frutas cítricas.',
    ],
    uncertain: 'Reconstrução hipotética: o Forum Cuppedinis representado como setor do macellum (lojas da ala norte); balança de dois pratos para especiarias (forma não conferida em fonte).',
    sources: ['Varrão, De Lingua Latina 5.146, 5.152', 'Terêncio, Eunuchus 256', 'Plínio, Naturalis Historia 14.97; 15.2; 31.93–94; 12.28, 12.32', 'Horácio, Sermones 2.4.73–74'],
  });

  info(2.0, -M.OZ + 6.6, 6, {
    title: 'Cozinheiros e flautistas de aluguel',
    latin: 'Forum Coquinum',
    date: 'Prática atestada desde Plauto (c. 200 a.C.)',
    text: [
      'Plínio lembra que antigamente não se tinham cozinheiros entre os escravos: "contratavam-nos no macellum". Plauto mostra o senhor que "fez as compras e contratou cozinheiros e flautistas no fórum", e o forum coquinum que um personagem apelida de forum furinum, "fórum dos ladrões".',
      'Para o banquete público em memória da filha Júlia, César contratou o fornecimento com os macellarii — os comerciantes do macellum eram fornecedores em grande escala.',
    ],
    uncertain: 'O ponto dos cozinheiros no pórtico norte é reconstrução hipotética.',
    sources: ['Plínio, Naturalis Historia 18.108', 'Plauto, Aulularia 280–281; Pseudolus 790–791', 'Suetônio, Divus Iulius 26.2'],
  });

  info(-11, -10, 7, {
    title: 'Frutas, verduras e grãos',
    latin: 'Pomarii et holitores',
    date: 'Produtos atestados até 44 a.C.',
    text: [
      'A cereja é novidade: "não houve cerejeiras na Itália antes da vitória de L. Lúculo sobre Mitrídates", em 74 a.C. Figos (inclusive os de Cauno, apregoados aos gritos de "Cauneas!" quando Crasso embarcava contra os partos), maçãs, peras, marmelos, romãs e ameixas eram correntes.',
      'Couves, cogumelos, helvellae, ervas, malva e beterraba ficavam livres da lei suntuária. "Da horta vinha o macellum da plebe", diz Plínio. Horácio, à tarde, pergunta o preço da verdura e da espelta e janta alho-poró e grão-de-bico.',
      'Nada de tomate, batata, milho, pimentão, feijão americano, laranja ou limão: são plantas desconhecidas na Roma antiga.',
    ],
    uncertain: 'Bancas de madeira com toldos de linho e a disposição dos produtos são reconstrução hipotética. Os preços de varejo em Roma em 50–44 a.C. NÃO foram encontrados.',
    sources: ['Plínio, Naturalis Historia 15.102; 15.83; 15.39–43; 19.52', 'Cícero, Ad Familiares 7.26.2', 'Horácio, Sermones 1.6.111–118'],
  });

  info(14, 0, 6, {
    title: 'Aves vivas e engordadas',
    latin: 'Fartores et aucupes',
    date: 'Modas de c. 70–40 a.C.',
    text: [
      'O pavão é luxo recente: o primeiro a abatê-lo para comer foi Hortênsio, e M. Aufídio Lurcão começou a engordá-los por volta de 67 a.C., com renda de 60.000 sestércios. Cornélio Nepos escreve que a engorda de tordos começara "pouco antes".',
      'A lei de C. Fânio só permitia uma galinha não engordada por refeição. O fígado de ganso engordado com figos é invenção atribuída a Metelo Cipião ou ao cavaleiro M. Seio, contemporâneos.',
    ],
    uncertain: 'Cercados, gaiolas e a posição do setor das aves são reconstrução hipotética.',
    sources: ['Plínio, Naturalis Historia 10.45, 10.52, 10.60, 10.139', 'Horácio, Sermones 2.3.227–229'],
  });

  info(-17.5, 0, 5, {
    title: 'Pão, azeite, pesos e moedas',
    latin: 'Pistores, olearii; denarius, as',
    date: 'Equivalências vigentes em 44 a.C.',
    text: [
      'Não houve padeiros em Roma até a guerra contra Perseu (c. 171–168 a.C.); antes o pão se fazia em casa. Plauto zomba dos vendedores de azeite que combinam preços "como os olearii do Velabro".',
      'Moedas: o denário de prata vale 16 asses, o quinário 8 e o sestércio 4; as contas se fazem em sestércios (HS). César vendia ouro a 3.000 HS a libra.',
    ],
    uncertain: 'Os preços diários de pão, vinho, carne ou peixe em Roma em 50–44 a.C. NÃO foram encontrados; por isso o jogo não mostra preços. Os valores métricos de libra, modius e congius não foram verificados.',
    sources: ['Plínio, Naturalis Historia 18.107; 33.44–45', 'Plauto, Captivi 489', 'Suetônio, Divus Iulius 54.2'],
  });

  const st = FB.toWorld(-52, 0);
  ctx.addInfo({
    x: +st.x.toFixed(2),
    z: +st.z.toFixed(2),
    radius: 9,
    title: 'Do Argileto ao macellum',
    latin: 'Argiletum',
    date: '44 a.C.',
    text: [
      'O Argileto ligava a Subura ao Fórum, terminando entre a Cúria e a Basílica Emília. Era rua de prédios de aluguel: em 45 a.C., Cícero sustentava o filho em Atenas com os aluguéis dos seus imóveis no Argileto.',
      'Esta travessa leva ao portão oeste do macellum, por onde chegam as mulas dos verdureiros (o "pangaré do verdureiro" de Horácio) e as ânforas de entrega.',
    ],
    uncertain: 'Traçado, largura e calçamento desta rua de acesso são hipotéticos (largura do Argileto: NÃO ENCONTRADA). A fama de "rua dos livreiros" vem de Marcial (séc. I d.C.) e não vale para 44 a.C.',
    sources: ['Cícero, Ad Atticum 1.14.7; 12.32.2', 'Lívio 1.19.2', 'Horácio, Epistulae 1.18.36'],
  });
  void WINGS;
}
