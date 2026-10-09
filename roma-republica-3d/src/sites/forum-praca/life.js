/**
 * forum-praca — vida da praça e da Via Sacra: caminhos de NPC, NPCs parados, séquitos,
 * zonas de som, áreas nomeadas, painéis históricos e locais de teleporte.
 *
 * Pessoas (nota 11): cidadãos de toga, senadores (latus clavus), magistrados com lictores
 * (pretor urbano em Roma: 2 lictores — Cic. Leg. agr. 2.93), mulheres de stola e palla, escravos
 * carregando volumes, crianças. SEM soldados armados: tropas no Fórum eram "excepcionais e
 * chocantes" (Cic. Mil. 1–2). Agiotas junto ao Puteal (Cic. Sest. 18), litigantes no tribunal,
 * tagarelas "acima do lago" (Plauto, Curc. 477).
 */
import { FORUM_FRAME, forumUV, PIAZZA, VIA, PAVE_Y, ROT, nodeUV, yawFromBearing, fRot, heightUV } from './common.js';
import { POS } from './monuments.js';

/** Nós de junção com os sítios vizinhos (docs/LAYOUT.md §4) — coordenadas do mundo. */
const J = {
  argiletum: [40, -40],
  vicusTuscus: [30, 85],
  regia: [105, 60],
  velia: [305, 180],
};

/** Ponto (u, v) a partir de uma base (u, v), rotação local `rot` e deslocamento local (lx, lz). */
function offsetUV(base, rot, lx, lz) {
  const c = Math.cos(rot);
  const s = Math.sin(rot);
  const x = base.u + lx * c + lz * s;
  const z = -base.v - lx * s + lz * c;
  return { u: x, v: -z };
}

const MIX_PIAZZA = { citizen: 5, woman: 2.2, slave: 3, merchant: 0.8, child: 0.5, senator: 0.8, soldier: 0 };
const MIX_VIA = { citizen: 4, woman: 3, slave: 3.2, merchant: 1.2, child: 0.8, senator: 0.35, soldier: 0 };

export function addLife(ctx, shopStatics) {
  const { npcs, audio } = ctx;
  const P = (u, v) => nodeUV(u, v);

  // ---------------- Via Sacra: da Vélia à Régia (nós a cada 10 m para seguir a rampa) ----------------
  const chain = [J.velia];
  for (let u = 315; u >= 95; u -= 10) chain.push(P(u, 0));
  chain.push(J.regia, P(80, 2));
  npcs.addPath(chain, { density: 7, width: 4.5, mix: MIX_VIA, name: 'via-sacra' });

  // ---------------- praça ----------------
  const south = [P(80, 2), P(64, -6), P(46, -14), P(36, -17), P(28, -19), P(10, -21), P(-8, -22), P(-19, -22)];
  npcs.addPath(south, { density: 10, width: 7, mix: MIX_PIAZZA, name: 'praca-sul' });
  const north = [P(80, 2), P(62, 16), P(40, 27), P(14, 33), P(-6, 35.5), P(-16, 37), J.argiletum];
  npcs.addPath(north, { density: 8, width: 6, mix: MIX_PIAZZA, name: 'praca-norte' });
  npcs.addPath([P(36, -17), P(36, -27), J.vicusTuscus], { density: 4, width: 4, mix: MIX_PIAZZA, name: 'vicus-tuscus' });
  npcs.addPath([P(-19, 8), P(10, 4), P(40, -2), P(64, -6)], { density: 6, width: 6, mix: MIX_PIAZZA, name: 'praca-eixo' });
  npcs.addPath([P(-8, -22), P(-3, -8), P(5, 10), P(14, 33)], { density: 4, width: 5, mix: MIX_PIAZZA });
  npcs.addPath([P(46, -14), P(44, 8), P(40, 27)], { density: 4, width: 5, mix: MIX_PIAZZA });
  npcs.addPath([P(64, -6), P(62, 16)], { density: 3, width: 5, mix: MIX_PIAZZA });
  npcs.addPath([P(64, -6), P(72, -11), P(81, -14), P(84, -5), P(80, 2)], { density: 5, width: 4, mix: { citizen: 5, merchant: 1.5, slave: 2, senator: 0.6 } });

  // séquitos: magistrado (toga praetexta) precedido por 2 lictores; senador com clientes
  npcs.addGroup({ points: [P(255, 0), P(205, 0), P(155, 0), P(105, 0), J.regia, P(80, 2), P(64, -6), P(46, -14), P(28, -19), P(10, -21)], leader: 'senator', followers: ['lictor', 'lictor', 'slave'] });
  npcs.addGroup({ points: [P(-16, 37), P(-6, 35.5), P(14, 33), P(40, 27), P(62, 16), P(80, 2)], leader: 'senator', followers: ['citizen', 'slave'] });

  // ---------------- NPCs parados ----------------
  const st = (pt, y, bearing, type, pose) => {
    const p = forumUV(pt.u, pt.v);
    npcs.addStatic({ x: p.x, y, z: p.z, yaw: yawFromBearing(bearing), type, pose });
  };
  const tb = POS.tribunal;
  const tr = fRot(29);
  // pretor sentado na cadeira curul, lictores ao lado do tribunal, escriba e litigantes
  st(offsetUV(tb, tr, 0, -0.35), PAVE_Y + 1.08 + 0.5, 29, 'senator', 'sit');
  st(offsetUV(tb, tr, -2.75, 0.4), PAVE_Y, 29, 'lictor', 'stand');
  st(offsetUV(tb, tr, 2.75, 0.4), PAVE_Y, 29, 'lictor', 'stand');
  st(offsetUV(tb, tr, -1.2, 3.35), PAVE_Y + 0.48, 209, 'slave', 'sit');
  st(offsetUV(tb, tr, 1.4, 4.2), PAVE_Y, 209, 'citizen', 'gesture');
  // agiotas sentados às mesas e um cliente
  const bk0 = POS.bankers[0];
  const bk1 = POS.bankers[1];
  st(offsetUV(bk0, fRot(299), 0, -0.62), PAVE_Y + 0.47, 299, 'merchant', 'sit');
  st(offsetUV(bk0, fRot(299), 0.1, 1.0), PAVE_Y, 119, 'citizen', 'gesture');
  st(offsetUV(bk1, fRot(340), 0, -0.62), PAVE_Y + 0.47, 340, 'merchant', 'sit');
  // encontro marcado junto ao Puteal (Hor. Sat. 2.6.35)
  st({ u: POS.puteal.u + 1.6, v: POS.puteal.v + 1.5 }, PAVE_Y, 250, 'citizen', 'stand');
  // tagarelas "acima do lago" (Plauto) junto à mureta norte do Lacus Curtius
  st({ u: -16.8, v: -0.7 }, PAVE_Y, 160, 'citizen', 'gesture');
  st({ u: -14.9, v: -0.2 }, PAVE_Y, 230, 'citizen', 'stand');
  // carregadores da liteira (8, como na liteira de luxo de Catulo 10): 2 sentados no banco, 6 de pé
  const lc0 = POS.lectica;
  st({ u: lc0.u - 0.35, v: lc0.v + 1.9 }, PAVE_Y + 0.47, 29, 'slave', 'sit');
  st({ u: lc0.u + 0.55, v: lc0.v + 1.9 }, PAVE_Y + 0.47, 29, 'slave', 'sit');
  const standing = [[2.6, 1.2, 250, 'gesture'], [3.3, 2.4, 230, 'stand'], [3.6, 0.1, 290, 'stand'], [-2.4, 1.6, 80, 'stand'], [-2.9, 0.4, 60, 'gesture'], [1.8, -1.6, 330, 'stand']];
  for (const [du, dv, br, pose] of standing) st({ u: lc0.u + du, v: lc0.v + dv }, PAVE_Y, br, 'slave', pose);
  // vendedores das lojas da Via Sacra (no máximo 5)
  for (const s of shopStatics.slice(0, 5)) npcs.addStatic(s);

  // ---------------- som ambiente ----------------
  const A = (u, v, radius, type, gain) => {
    const p = forumUV(u, v);
    audio.addZone({ x: p.x, z: p.z, radius, type, gain });
  };
  A(32, 5, 65, 'crowd', 1.0);
  A(72, -18, 16, 'crowd', 0.7);
  A(-15, -3, 14, 'crowd', 0.5);
  A(-15.7, -6.1, 6, 'water', 0.25);
  for (const [u, g] of [[110, 0.6], [170, 0.55], [230, 0.5], [290, 0.45]]) A(u, 0, 34, 'crowd', g);
  A(200, 7, 24, 'workshop', 0.3);
  A(265, -7, 24, 'workshop', 0.25);

  // ---------------- áreas nomeadas ----------------
  const c = forumUV((PIAZZA.u0 + PIAZZA.u1) / 2, (PIAZZA.v0 + PIAZZA.v1) / 2);
  ctx.addArea({ name: 'Praça do Fórum Romano', latin: 'Forum Romanum', rect: { x: c.x, z: c.z, w: PIAZZA.u1 - PIAZZA.u0, d: PIAZZA.v1 - PIAZZA.v0, rotY: ROT }, priority: 1 });
  const cv = forumUV((VIA.u0 + 290) / 2, 0);
  ctx.addArea({ name: 'Via Sacra', latin: 'Sacra Via', rect: { x: cv.x, z: cv.z, w: 290 - VIA.u0, d: 2 * VIA.half, rotY: ROT }, priority: 1 });
  const cs = forumUV((290 + VIA.u1) / 2, 0);
  ctx.addArea({ name: 'Alto da Via Sacra (Vélia)', latin: 'Summa Sacra Via', rect: { x: cs.x, z: cs.z, w: VIA.u1 - 290, d: 2 * VIA.half, rotY: ROT }, priority: 2 });
  const lc = forumUV(POS.lacus.u, POS.lacus.v);
  ctx.addArea({ name: 'Lacus Curtius', latin: 'Lacus Curtius', circle: { x: lc.x, z: lc.z, r: 7 }, priority: 3 });
  const pt = forumUV((POS.puteal.u + POS.tribunal.u) / 2, (POS.puteal.v + POS.tribunal.v) / 2);
  ctx.addArea({ name: 'Puteal de Libão e tribunal do pretor', latin: 'Puteal Libonis', circle: { x: pt.x, z: pt.z, r: 9 }, priority: 3 });

  addInfos(ctx);
  addLocations(ctx);

  // ---------------- vegetação: a oliveira do Lacus Curtius (sempre-verde) ----------------
  const ol = forumUV(POS.olive.u, POS.olive.v);
  ctx.vegetation.add('olive', ol.x, ol.z, { y: PAVE_Y + 0.05, scale: 0.85 });
  // touceiras de capim nos cantos de terra junto às calçadas da Via Sacra (trecho baixo)
  for (let k = 0; k < 18; k++) {
    const u = 92 + k * 9.3 + ((k * 37) % 5);
    const s = k % 2 ? 1 : -1;
    if (s > 0 && u > 138) continue; // ali começam as lojas do lado norte
    const v = s * (VIA.walk + 0.6 + ((k * 13) % 7) * 0.35);
    const p = forumUV(u, v);
    ctx.vegetation.add('grass', p.x, p.z, { y: heightUV(ctx.terrain, u, v), scale: 0.7 + ((k * 7) % 5) * 0.12 });
  }
}

/* ------------------------------------------------------------------------- */
/*  Painéis de informação (português do Brasil, com fontes das notas 01–03, 11)  */
/* ------------------------------------------------------------------------- */
function addInfos(ctx) {
  const at = (u, v) => forumUV(u, v);
  let p = at(30, 6);
  ctx.addInfo({
    x: p.x,
    z: p.z,
    radius: 26,
    title: 'Praça do Fórum Romano',
    latin: 'Forum Romanum',
    date: 'Início de 44 a.C. (antes dos Idos de Março)',
    text: [
      'A praça aberta do Fórum, pavimentada com lajes claras de travertino, é o coração político, judicial e comercial de Roma: aqui se faziam assembleias e discursos, corriam processos ao ar livre e circulavam banqueiros, litigantes e curiosos.',
      'Em 46 a.C., nos jogos do triunfo de César, houve combate de gladiadores na própria praça — "o último travado no Fórum", segundo Plínio — e o Fórum e a Via Sacra foram cobertos de toldos, da casa de César até o Clivo Capitolino. Foi um evento: não havia cobertura permanente.',
      'Em volta, neste momento, avança o programa de obras de César: a Basílica Júlia, dedicada em 46 a.C. mas inacabada; a Basílica de Paulo (Emília) em reconstrução; a nova Rostra no extremo oeste da praça e o canteiro da futura Cúria Júlia.',
      'Depois dos Idos de Março, o corpo de César seria cremado nesta praça. O Templo do Divo Júlio, erguido aqui no lado leste, só seria dedicado em 29 a.C. — por isso esta área ainda é praça aberta.',
    ],
    uncertain:
      'Reconstrução hipotética: o material do pavimento na metade sul/leste não foi encontrado (usa-se o travertino atribuído à fase "silana" do eixo central) e as cotas publicadas divergem (11,8–14 m acima do mar). A fiada de tampas que atravessa o meio da praça representa um canal coberto: Plauto (c. 190 a.C.) cita um canalis "no meio" do Fórum, mas o seu estado em 44 a.C. não é conhecido.',
    sources: ['Plínio, Naturalis Historia 15.78; 19.23–24', 'Suetônio, Divus Iulius 39.1; 84', 'Dião Cássio 43.24.2', 'Vitrúvio 5.1.1–2', 'Plauto, Curculio 466–485', 'Van Deman, "The Sullan Forum", JRS 1922 (via notas 01/02)', 'Pleiades: Forum Romanum; Temple of Divus Iulius'],
  });

  p = at(100, 0);
  ctx.addInfo({
    x: p.x,
    z: p.z,
    radius: 14,
    title: 'Via Sacra',
    latin: 'Sacra Via',
    date: 'Uma das ruas mais antigas de Roma',
    text: [
      'A principal rota sagrada de Roma desce do alto da Vélia (summa Sacra Via) até o Fórum, passando pelo Arco de Fábio, pela Régia e pela Domus Publica — a residência oficial de César como Pontífice Máximo — e segue pela praça até o Clivo Capitolino.',
      'Era também passeio diário e lugar de encontros. Horácio abre uma sátira dizendo: "ia eu por acaso pela Via Sacra, como é meu costume". Cícero lembra a multidão que empurrava quem descia do alto da Via Sacra até o arco Fabiano, a porta de entrada no Fórum.',
      'Daqui para leste a rua começa a subir em direção à Vélia; quem vinha de lá estava "descendo para o Fórum". Os moradores da rua, os Sacravienses, disputavam todo mês de outubro com os da Subura a cabeça do "Cavalo de Outubro" sacrificado a Marte; se venciam, ela ia para a Régia.',
      'A rua também viu a violência dos anos 50 a.C.: em novembro de 57, Cícero foi atacado quando descia a Via Sacra e se refugiou no vestíbulo da casa de Tétio Damião; dias depois, Clódio tentou incendiar a casa de Milão.',
    ],
    uncertain:
      'Reconstrução hipotética: o traçado exato, a largura e o pavimento da Via Sacra republicana não foram encontrados. Modelou-se um calçamento poligonal de basalto (silex) de 6,5 m, por analogia com o Clivo Capitolino (pavimentado com silex em 174 a.C.), com meios-fios, calçadas elevadas e, no trecho alto, frentes de lojas e casas genéricas — a ocupação real da rua em 44 a.C. não é conhecida.',
    sources: ['Pleiades: Sacra Via; Velia', 'Plínio, Naturalis Historia 19.23', 'Cícero, Pro Plancio 17; De Oratore 2.267; Ad Atticum 4.3.3', 'Horácio, Sátiras 1.9.1', 'Suetônio, Divus Iulius 46', 'Festo e Paulo Diácono (Cavalo de Outubro), via W. Smith, Dictionary of Greek and Roman Geography (1854)', 'Lívio 41.27.7 (Clivo Capitolino, via nota 01)', 'W. Smith, Dictionary of Greek and Roman Antiquities (1890)'],
  });

  p = at(306, 0);
  ctx.addInfo({
    x: p.x,
    z: p.z,
    radius: 16,
    title: 'Alto da Via Sacra',
    latin: 'Summa Sacra Via',
    date: 'Esporão da Vélia, entre o Palatino e o Ópio',
    text: [
      'O ponto mais alto da Via Sacra fica no esporão da Vélia, que ligava o Palatino ao Ópio (hoje não mais existente). Daqui a rua desce para noroeste até o Fórum.',
      'Cícero conta que, quando a multidão o empurrava, não acusava quem estava no alto da Via Sacra por chegar empurrado até o arco Fabiano; e zomba de Mêmio, tão "grande" que, descendo para o Fórum, abaixava a cabeça ao passar pelo arco.',
      'Ainda não existe aqui o Arco de Tito, que só seria erguido no fim do séc. I d.C.',
    ],
    uncertain: 'Reconstrução hipotética: o relevo antigo da Vélia foi muito alterado; a cota e o traçado da rua neste trecho são aproximados.',
    sources: ['Pleiades: Velia; Sacra Via; Arch of Titus', 'Cícero, Pro Plancio 17; De Oratore 2.267'],
  });

  p = at(POS.lacus.u, POS.lacus.v);
  ctx.addInfo({
    x: p.x,
    z: p.z,
    radius: 9,
    title: 'Lacus Curtius',
    latin: 'Lacus Curtius',
    date: 'Lugar sagrado arcaico; estado de 44 a.C.',
    text: [
      'Área sagrada "no meio do Fórum", ligada às fases mais antigas da cidade. No fim da República tornara-se uma pequena bacia dentro de uma área pavimentada; sob Augusto, Ovídio já a descreve como "terra firme, mas que antes foi lago".',
      'Duas lendas explicavam o nome: o sabino Mécio Cúrcio, cujo cavalo atolou no pântano que existia ali, e o jovem Marco Cúrcio, que se lançou armado, a cavalo, num abismo aberto no Fórum, enquanto o povo atirava oferendas e frutos sobre ele.',
      'Plínio conta que ali vivia uma figueira nascida ao acaso, junto a uma videira e uma oliveira plantadas pela plebe para dar sombra, e que o altar do local foi retirado para o espetáculo de gladiadores de César em 46 a.C. — por isso não há altar. Em pleno inverno, a figueira e a videira estão sem folhas; só a oliveira conserva a folhagem.',
      'Plauto situava "acima do lago" os tagarelas e maldizentes do Fórum.',
    ],
    uncertain:
      'Reconstrução hipotética: a forma e as dimensões da bacia republicana não foram encontradas. A mureta de 8,6 m segue a ordem de grandeza da área atual (~11 × 11 m); a armação de madeira da videira é uma interpretação de "plantadas para dar sombra"; as lajes mais novas marcam o lugar provável do altar retirado.',
    sources: ['Plínio, Naturalis Historia 15.78', 'Ovídio, Fasti 6.401–404', 'Lívio 1.13.5; 7.6.1–6', 'Plauto, Curculio 477', 'Pleiades: Lacus Curtius'],
  });

  p = at(POS.tribunal.u + 3, POS.tribunal.v - 2);
  ctx.addInfo({
    x: p.x,
    z: p.z,
    radius: 10,
    title: 'Puteal de Libão e o tribunal do pretor',
    latin: 'Puteal Libonis (Scribonianum)',
    date: 'Mencionado por Cícero e Horácio (séc. I a.C.)',
    text: [
      'Um puteal era o bocal que cercava um poço — ou um lugar atingido por raio, tornado sagrado. Este foi consagrado provavelmente por L. Escribônio Libão, que ergueu ao lado um tribunal para o pretor; por isso o lugar vivia cheio de litigantes, corretores e agiotas.',
      'Cícero fala de alguém "inflado pelo puteal e pelos bandos de agiotas"; Horácio é chamado a estar "junto ao Puteal" antes da segunda hora. Nas moedas da família Escribônia o puteal tem forma de altar, com guirlandas de louro, duas liras e, abaixo das guirlandas, tenazes — símbolo de Vulcano, o fazedor de raios.',
      'Em Roma, o pretor urbano andava precedido por dois lictores com os fasces. Na reconstrução, ele preside sentado numa cadeira curul, com o escriba e as partes diante do tribunal.',
    ],
    uncertain:
      'Reconstrução hipotética: posição e medidas não foram encontradas. Fontes antigas reunidas por Smith situam o puteal entre os templos de Castor e de Vesta, perto do Arco de Fábio; o bocal de ~1 m de altura e o tribunal de tufo com tablado de madeira são propostas de modelagem.',
    sources: ['Cícero, Pro Sestio 18', 'Horácio, Sátiras 2.6.35; Epístolas 1.19.8', 'Cícero, De lege agraria 2.93 (lictores do pretor)', 'W. Smith, Dictionary of Greek and Roman Antiquities (1890), "Puteal"', 'W. Smith, Dictionary of Greek and Roman Geography (1854), "Roma"'],
  });

  p = at(POS.tremulus.u, POS.tremulus.v);
  ctx.addInfo({
    x: p.x,
    z: p.z,
    radius: 7,
    title: 'Estátua equestre de Q. Márcio Trêmulo',
    latin: 'Statua equestris togata Q. Marcii Tremuli',
    date: 'Fim do séc. IV a.C.; ainda de pé em 43 a.C.',
    text: [
      'Diante do templo de Castor ergue-se a estátua equestre, vestida de toga, de Q. Márcio Trêmulo, vencedor dos hérnicos e cônsul com P. Cornélio Arvina. Lívio e Plínio a mencionam; Cícero, em 43 a.C., ainda a cita "diante de Castor".',
      'Em 44 a.C. ergueu-se no Fórum uma estátua de L. Antônio, irmão de Marco Antônio, que Cícero compara a esta — provavelmente depois dos Idos de Março, por isso não aparece aqui.',
    ],
    uncertain: 'Reconstrução hipotética: dimensões, material do pedestal e postura da figura não foram encontrados; a figura de bronze é um volume indicativo, e a posição exata diante do templo é aproximada.',
    sources: ['Lívio 9.43.22', 'Plínio, Naturalis Historia 34.23', 'Cícero, Filípicas 6.13'],
  });

  p = at(POS.lectica.u, POS.lectica.v);
  ctx.addInfo({
    x: p.x,
    z: p.z,
    radius: 6,
    title: 'Uma liteira à espera',
    latin: 'Lectica',
    date: 'Início de 44 a.C.',
    text: [
      'Nas ruas de Roma, de dia, quase não se viam carros: andava-se a pé, e os ricos se faziam carregar em liteiras por escravos. Uma liteira de luxo tinha oito carregadores, como os "oito homens eretos" de que Catulo se gaba de ter trazido da Bitínia. As matronas saíam de liteira, com criadas e escolta.',
      'César, como ditador, restringiu o uso de liteiras — e também das roupas de púrpura e das pérolas — "exceto a certas pessoas e idades e em certos dias". Esta liteira está fechada por cortinas (uma "operta lectica", como a de Antônio de que zomba Cícero); os carregadores esperam o dono, que trata de negócios na praça.',
    ],
    uncertain: 'Reconstrução hipotética: a forma, as medidas e as cores da liteira não foram encontradas nas fontes; a data exata da lei de César sobre as liteiras (entre 46 e 44 a.C.) também não. A ausência de carroças durante o dia é uma hipótese de ambientação.',
    sources: ['Suetônio, Divus Iulius 43.1', 'Catulo 10', 'Cícero, Filípicas 2.58; 2.106', 'Horácio, Sátiras 1.2.94–99'],
  });

  p = at(-17.6, 27);
  ctx.addInfo({
    x: p.x,
    z: p.z,
    radius: 6,
    title: 'Relógios de sol junto à Rostra',
    latin: 'Solaria',
    date: '263 a.C. e 164 a.C.',
    text: [
      "O primeiro relógio de sol público de Roma foi trazido de Catânia, na Sicília, durante a Primeira Guerra Púnica, por M'. Valério Messala, e posto sobre uma coluna junto à Rostra. Marcou horas erradas durante 99 anos, até que Q. Márcio Filipo colocou ao lado um outro, mais exato.",
      'Antes disso, o meio-dia era anunciado pelo accensus dos cônsules quando, da porta da Cúria, via o sol entre a Rostra e a Graecostasis. As horas romanas eram desiguais: o dia claro tinha 12 horas, mais longas no verão e mais curtas no inverno.',
    ],
    uncertain: 'Reconstrução hipotética: a presença dos dois relógios em 44 a.C. não está confirmada e sua forma não é conhecida. Como a Rostra republicana do Comício está em desmonte neste momento, eles foram postos na borda da praça mais próxima dela.',
    sources: ['Plínio, Naturalis Historia 7.212–215', 'Vitrúvio 9.8.6'],
  });
}

function addLocations(ctx) {
  const s = forumUV(62, -3);
  ctx.addLocation({ id: 'via-sacra', name: 'Via Sacra — praça do Fórum', latin: 'Sacra Via · Forum Romanum', group: 'Fórum Romano', x: s.x, z: s.z, lookBearing: 290, start: true });
  const t = forumUV(314, -1);
  ctx.addLocation({ id: 'summa-sacra-via', name: 'Alto da Via Sacra (Vélia)', latin: 'Summa Sacra Via', group: 'Fórum Romano', x: t.x, z: t.z, lookBearing: 299 });
}

export { FORUM_FRAME };
