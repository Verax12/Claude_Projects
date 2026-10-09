/**
 * Fórum de César — vida: caminhos e figurantes (NPCs), som ambiente, áreas nomeadas,
 * painéis de informação e locais de teleporte.
 *
 * Composição humana: praça política e cerimonial "não de mercadorias" (Ápio 2.102) → sem
 * comerciantes; muitos togados e senadores; soldados ausentes (tropas armadas dentro do pomério
 * eram excepcionais — nota 11 §16). Cena de 44 a.C.: César sentado no pronaos recebendo o Senado
 * (Suet. 78.1; Dião 44.8.1) — evocação, com nota de incerteza.
 */
import { Y, P, TPL, W, Wa, Wy, Wpoly, yawFor, bearingLocal } from './frame.js';
import { MON } from './statues.js';

const FORUM_MIX = { citizen: 5, senator: 1.4, woman: 1.2, slave: 2.2, child: 0.25 };
const B_TEMPLE = bearingLocal(180); // olhando para o templo (NNO, 338°)
const B_OUT = bearingLocal(0); // olhando para SSE (158°)

export function buildLife(ctx, tabPlan) {
  const npcs = ctx.npcs;
  const top = Y.podium;
  const zGate = 21.3; // entre colunas dos pórticos (z = 19,5 e 23,1)
  const zEnd = 82.5; // entre colunas (80,7 e 84,3)

  // ---------------- caminhos ----------------
  // circuito da praça (com nós no eixo para ligar as escadas e a entrada)
  npcs.addPath([Wa(-19, zGate), Wa(-9, zGate), Wa(9, zGate), Wa(19, zGate), Wa(19, zEnd), Wa(0, zEnd), Wa(-19, zEnd)], { loop: true, density: 6, width: 5, mix: FORUM_MIX, name: 'forum-iulium:praca' });
  // eixo: portão SSE → corredor do canteiro → praça (contorna a estátua equestre)
  npcs.addPath([Wa(0, P.endZ + 4), Wa(0, P.endZ), Wa(0, P.hoard1 + 3), Wa(0, P.hoard1 - 0.5), Wa(0, zEnd)], { density: 5, width: 2.2, mix: FORUM_MIX, name: 'forum-iulium:entrada' });
  npcs.addPath([Wa(0, zEnd), Wa(0, MON.equusZ + 7), Wa(-6, MON.equusZ), Wa(-9, zGate)], { density: 4, width: 2, mix: FORUM_MIX });
  npcs.addPath([Wa(0, MON.equusZ + 7), Wa(6, MON.equusZ), Wa(9, zGate)], { density: 4, width: 2, mix: FORUM_MIX });
  // pórticos laterais e ligações com a praça
  for (const s of [-1, 1]) {
    const xp = s * 27;
    npcs.addPath([Wa(xp, -16.8), Wa(xp, zGate), Wa(xp, zEnd), Wa(xp, P.finEnd - 1.5)], { density: 3.5, width: 2.4, mix: FORUM_MIX, name: 'forum-iulium:portico' });
    npcs.addPath([Wa(xp, zGate), Wa(s * 19, zGate)], { density: 2, width: 1.2, mix: FORUM_MIX });
    npcs.addPath([Wa(xp, zEnd), Wa(s * 19, zEnd)], { density: 2, width: 1.2, mix: FORUM_MIX });
    // ruas laterais do templo e passagem atrás dele
    npcs.addPath([Wa(s * 19, zGate), Wa(s * 17.5, 18.5), Wa(s * 17.5, -15.5), Wa(s * 12, -18.1), Wa(0, -18.1)], { density: 2, width: 1.0, mix: FORUM_MIX });
    // subida ao templo pelas escadas laterais, pronaos e cella (cotas explícitas)
    const sx = s * (TPL.podW / 2 + TPL.stairW / 2);
    npcs.addPath(
      [
        Wa(s * 9, zGate),
        Wa(s * 11.5, 18.6),
        Wy(sx, Y.pave, TPL.podZ1 + 0.4),
        Wy(sx, top, TPL.stairTop + 0.1),
        Wy(s * 13.6, top, TPL.stairTop - 0.6),
        Wy(s * 8, top, 10.6),
        Wy(s * 3.25, top, 9.3),
        Wy(s * 3.25, top, 4.6),
        Wy(0, top, 2.6),
      ],
      { density: 3, width: 0.7, mix: { citizen: 4, senator: 2, woman: 2 } },
    );
  }
  npcs.addPath([Wy(0, top, 2.6), Wy(0, top, 0.4), Wy(0, top, -4.5), Wy(-1.2, top, -8.2), Wy(1.2, top, -8.2), Wy(0, top, -4.5)], { density: 2.5, width: 0.8, mix: { citizen: 3, woman: 3, senator: 1 } });
  // canteiro: escravos carregando (circuitos curtos em áreas livres)
  npcs.addPath([Wa(5, 89.3), Wa(17, 89.3), Wa(17, 93.7), Wa(5.5, 93.7)], { loop: true, density: 4, width: 0.8, mix: { slave: 1 } });
  npcs.addPath([Wa(-4.5, 89.3), Wa(-11, 89.3), Wa(-11, 91.0), Wa(-4.5, 91.0)], { loop: true, density: 4, width: 0.6, mix: { slave: 1 } });
  // séquito: um pretor com dois lictores (Cíc. Leg. agr. 2.93) passeando pela praça
  ctx.npcs.addGroup({ points: [Wa(-12, 30), Wa(12, 30), Wa(12, 76), Wa(-12, 76)], loop: true, leader: 'senator', followers: ['lictor', 'lictor', 'slave'] });

  // ---------------- figurantes parados ----------------
  const st = (lx, lz, bearing, type, pose = 'stand', y, look) => {
    const p = W(lx, lz);
    ctx.npcs.addStatic({ x: p.x, z: p.z, y, yaw: yawFor(bearing), type, pose, look });
  };
  // César sentado na cadeira de ouro, em traje triunfal (cena evocativa de 44 a.C.)
  st(0, 11.6, B_OUT, 'senator', 'sit', top, { tunic: '#5a1f3a', tunicStripe: '#c9a23a', toga: '#4e1a33', togaBorder: '#c9a23a', robe: '#4e1a33' });
  // senadores diante do pódio, de frente para o templo
  for (const [x, z, pose] of [[-6.5, 23.5, 'gesture'], [-4, 24.2, 'stand'], [-1.6, 23.1, 'stand'], [1.6, 23.2, 'gesture'], [4.2, 24.0, 'stand'], [6.8, 23.4, 'stand'], [-2.8, 25.4, 'stand'], [2.9, 25.3, 'stand']]) {
    st(x, z, B_TEMPLE, 'senator', pose);
  }
  // lictores junto às escadas (o ditador tinha 24 — Políbio 3.87; aqui só alguns)
  for (const s of [-1, 1]) {
    for (let k = 0; k < 3; k++) st(s * (11.6 - k * 0.1), 18.6 + k * 1.15, B_OUT, 'lictor');
  }
  // guardião do templo (aedituus) junto à porta e visitantes na cella
  st(2.6, -0.9, B_OUT, 'citizen', 'stand', top);
  st(-1.3, -7.8, B_TEMPLE, 'woman', 'stand', top);
  // conversas sob os pórticos
  for (const [x, z, b] of [[-26.5, 40, 90], [-25.6, 40.6, 270], [26.2, 55, 90], [27.1, 55.8, 270], [-26.8, 66, 0], [25.9, 12, 180]]) {
    st(x, z, bearingLocal(b), 'citizen', 'gesture');
  }
  // escribas sentados nas tabernae-escritório
  let scribes = 0;
  for (const t of tabPlan) {
    if (t.kind !== 'office' || scribes >= 5 || t.i % 3 !== 1) continue;
    scribes++;
    const tx = t.s * (P.backX + P.backT + 1.6);
    st(tx - t.s * 0.75, t.z + 0.1, bearingLocal(t.s > 0 ? 90 : 270), 'citizen', 'sit', Y.portico + 0.0);
  }
  // operários no canteiro
  for (const [x, z, b] of [[9, 92.8, 180], [14.1, 92.1, 180], [-7, 92.9, 180], [22, 98.3, 0], [-13.2, 99.5, 90], [-20.2, 96.5, 270]]) {
    st(x, z, bearingLocal(b), 'slave', 'work', Y.pad);
  }
  st(-14.1, 93.9, bearingLocal(-90), 'slave', 'work', Y.pad + 0.15); // dentro da roda de tração
  st(-10.5, 95.4, bearingLocal(250), 'citizen', 'gesture', Y.pad); // mestre de obras
  st(-24.1, 87.9, bearingLocal(90), 'slave', 'work', Y.pad + 2.13); // sobre o andaime

  // ---------------- som ----------------
  const c = W(0, 50);
  ctx.audio.addZone({ x: c.x, z: c.z, radius: 48, type: 'crowd', gain: 0.55 });
  const w = W(0, 95);
  ctx.audio.addZone({ x: w.x, z: w.z, radius: 22, type: 'workshop', gain: 0.9 });
  const f = W(0, 19);
  ctx.audio.addZone({ x: f.x, z: f.z, radius: 9, type: 'water', gain: 0.6 });
  const q = W(0, -7.5);
  ctx.audio.addZone({ x: q.x, z: q.z, radius: 8, type: 'quiet', gain: 0.8 });

  // ---------------- áreas nomeadas ----------------
  ctx.addArea({ name: 'Fórum de César', latin: 'Forum Iulium', points: Wpoly([[-P.wswOuter, P.backZ2], [P.eneOuter, P.backZ2], [P.eneOuter, P.endZ], [-P.wswOuter, P.endZ]]), priority: 1 });
  ctx.addArea({ name: 'Canteiro de obras do Fórum de César', points: Wpoly([[-P.wswOuter, P.hoard1], [P.eneOuter, P.hoard1], [P.eneOuter, P.endZ], [-P.wswOuter, P.endZ]]), priority: 2 });
  const hw = TPL.podW / 2 + TPL.stairW + 0.5;
  ctx.addArea({ name: 'Templo de Vênus Genetrix', latin: 'Aedes Veneris Genetricis', points: Wpoly([[-hw, TPL.podZ0], [hw, TPL.podZ0], [hw, TPL.podZ1], [-hw, TPL.podZ1]]), priority: 3 });

  // ---------------- locais de teleporte ----------------
  const loc = W(0, 66);
  ctx.addLocation({ id: 'forum-iulium', name: 'Fórum de César', latin: 'Forum Iulium', group: 'Fórum de César', x: loc.x, z: loc.z, lookBearing: B_TEMPLE });
  const pr = W(5.2, 14.2);
  ctx.addLocation({ id: 'templo-venus-genetrix', name: 'Templo de Vênus Genetrix (pronaos)', latin: 'Aedes Veneris Genetricis', group: 'Fórum de César', x: pr.x, z: pr.z, y: top, lookBearing: B_TEMPLE });

  addInfos(ctx);
}

function addInfos(ctx) {
  const info = (lx, lz, o) => {
    const p = W(lx, lz);
    ctx.addInfo({ x: p.x, z: p.z, ...o });
  };

  info(0, 64, {
    radius: 26,
    title: 'Fórum de César',
    latin: 'Forum Iulium (Forum Caesaris)',
    date: 'Terrenos comprados desde 54 a.C.; dedicado em 26 de setembro de 46 a.C., ainda inacabado',
    text: [
      'Em 54 a.C., Cícero e Ópio, amigos de César, já tinham gasto 60 milhões de sestércios em terrenos "para ampliar o fórum e estendê-lo até o Atrium Libertatis". Suetônio diz que só a área custou mais de 100 milhões, pagos com o butim (de manubiis) das guerras de César.',
      'César cercou o templo de Vênus Genetrix com um recinto e o destinou a praça dos romanos: "não de mercadorias", explica Ápio, mas para quem se reúne para tratar de negócios públicos. Por isso não há aqui bancas nem vendedores.',
      'O conjunto foi dedicado no último dia do triunfo de 46 a.C., ainda incompleto; Augusto concluiu as obras. No início de 44 a.C., a ponta voltada para o Comício e para a cúria demolida ainda é canteiro.',
      'Para Dião Cássio, este fórum era "mais belo que o Romano". O que se vê hoje em Roma é sobretudo a reconstrução de Trajano (113 d.C.).',
    ],
    uncertain:
      'Reconstrução hipotética: a planta da fase cesariana não está documentada em detalhe. Usamos o envelope de 160 × 75 m citado pelo Pleiades (o recinto termina aqui onde começa o canteiro da Cúria) e o eixo de ≈ 158° calculado a partir dos pontos das ruínas. São escolhas de modelagem: a cota do pavimento, as lajes da praça, a profundidade, a ordem e o número de colunas dos pórticos, as tabernae dos dois lados e o muro de arrimo contra a encosta do Capitólio. Os pórticos são simples; o pórtico duplo só está atestado na fase trajânica.',
    sources: ['Cícero, Ad Atticum 4.17.7 (= 4.16.8)', 'Suetônio, Divus Iulius 26.2', 'Plínio, NH 36.103 e 35.156', 'Ápio, Guerras Civis 2.102', 'Dião Cássio 43.22.1–3', 'Pleiades 445545537 (Forum Iulium)', 'Mercati di Traiano – Museo dei Fori Imperiali, Foro di Cesare', 'Imperium Romanum, Forum of Caesar'],
  });

  info(0, MON.altarZ + 1.5, {
    radius: 8,
    title: 'Templo de Vênus Genetrix',
    latin: 'Aedes Veneris Genetricis',
    date: 'Prometido em Farsália (48 a.C.); dedicado em 26 de setembro de 46 a.C.',
    text: [
      'Na noite antes de Farsália, César prometeu um templo a Vênus como "portadora da vitória". Cumpriu o voto dedicando-o a Vênus Genetrix, a mãe de Eneias e ancestral mítica da gente Júlia.',
      'Vitrúvio, que conheceu o templo antes da reconstrução de Trajano, cita-o como exemplo de picnostilo: o vão entre as colunas mede só um diâmetro e meio. Nesses templos, diz ele, as mães de família não conseguem subir de braços dados entre as colunas, as portas ficam escondidas e as estátuas, na sombra.',
      'As ruínas mostram um templo octastilo (oito colunas na frente), coríntio, sem colunas no fundo, sobre um pódio alto com a frente a pique e duas escadas laterais. Ovídio, já sob Augusto, o chama de "feito de mármore".',
    ],
    uncertain:
      'Reconstrução hipotética: proporções de Vitrúvio (vão = 1,5 diâmetro; coluna = 10 diâmetros) com diâmetro de 1,3 m e pódio de 5 m; as dimensões reais do templo cesariano não foram encontradas. Octastilo, coríntio, sem colunas no fundo, escadas laterais e mármore vêm das ruínas trajânicas ou de Ovídio (augustano). As fontes divergem entre 8 e 9 colunas em cada lado: adotamos 8. O altar diante do templo não é documentado (é um elemento usual dos templos).',
    sources: ['Ápio, Guerras Civis 2.68 e 2.102', 'Dião Cássio 43.22.2–3', 'Vitrúvio 3.3.2–3 e 3.3.10', 'Ovídio, Ars amatoria 1.81 e 3.451', 'Encyclopaedia Romana (J. Grout), Venus Genetrix', 'Imperium Romanum, Forum of Caesar', 'Pleiades 898745908'],
  });

  info(0, -7.5, {
    y: Y.podium,
    radius: 8,
    title: 'Interior do templo (cella)',
    latin: 'Cella aedis Veneris Genetricis',
    date: 'Oferendas consagradas por César em vida',
    text: [
      'A estátua de culto de Vênus Genetrix, obra de Arcesilau, foi posta no templo antes de terminada, "na pressa de dedicar" (Plínio, citando Varrão).',
      'Ao lado da deusa, César colocou uma bela imagem de Cleópatra, que ainda estava lá no tempo de Ápio; Dião diz que ela era vista "em ouro".',
      'César consagrou aqui seis dactilotecas (coleções de pedras gravadas) e uma couraça de pérolas da Britânia, e comprou por 80 talentos os quadros de Ájax e de Medeia, de Timômaco de Bizâncio.',
    ],
    uncertain:
      'Reconstrução hipotética: a decoração da cella (revestimento, piso, forro de caixotões), a ausência de abside, o material e a pose da estátua de culto, o tamanho da imagem de Cleópatra (ouro maciço ou bronze dourado: controverso) e a disposição das oferendas não são documentados. Plínio diverge sobre os quadros ("diante do templo" × "no templo"); aqui ficam dentro. Estátuas e pinturas são marcadores evocativos, não reproduções das obras.',
    sources: ['Plínio, NH 35.156', 'Ápio, Guerras Civis 2.102', 'Dião Cássio 51.22.3', 'Plínio, NH 37.11', 'Plínio, NH 9.116', 'Plínio, NH 7.126, 35.26 e 35.136'],
  });

  info(0, 11.5, {
    y: Y.podium,
    radius: 6.5,
    title: 'César recebe o Senado diante do templo',
    latin: 'In pronao aedis Veneris Genetricis',
    date: 'Início de 44 a.C.',
    text: [
      'Quando os senadores vieram em bloco, com os cônsules e pretores à frente, comunicar-lhe novas honras, César os recebeu sentado diante do templo de Vênus Genetrix (Suetônio), "no pronaos do Afrodísio" (Dião), e não se levantou.',
      'Uns contam que Cornélio Balbo o segurou quando ia levantar-se; outros, que nem tentou e olhou feio para C. Trebácio, que o advertia. O episódio foi um dos pretextos da conspiração dos Idos de Março.',
      'Entre as honras de 44 a.C. estava uma cadeira de ouro, e Ápio diz que César oficiava sempre em traje triunfal. Como ditador, tinha direito a 24 lictores.',
    ],
    uncertain:
      'Cena evocativa: a data exata do episódio não é conhecida, e Plutarco o situa na Rostra (divergência). A cadeira, o traje púrpura bordado de ouro e os poucos lictores representados são hipóteses de ambientação.',
    sources: ['Suetônio, Divus Iulius 78.1 e 76.1', 'Dião Cássio 44.8.1–2', 'Plutarco, César 60.4', 'Ápio, Guerras Civis 2.106', 'Políbio 3.87'],
  });

  info(0, MON.equusZ + 2, {
    radius: 7,
    title: 'Estátua equestre de César',
    latin: 'Equus Caesaris',
    date: 'Dedicada pelo próprio César (data não encontrada)',
    text: [
      'Diante do templo ficava o cavalo de César, famoso porque tinha as patas dianteiras "semelhantes às humanas" (Plínio; Suetônio). O próprio César o dedicou diante do templo de Vênus Genetrix.',
      'Estácio, no fim do século I d.C., diz que a estátua "defronte ao templo de Dione Latina" seria obra de Lisipo feita para Alexandre, com o rosto trocado pelo de César — versão que diverge de Plínio e de Suetônio.',
    ],
    uncertain:
      'Reconstrução hipotética: tamanho (≈ 1,6 vez o natural), pose, cascos dianteiros fendidos (nossa leitura de "semelhantes às humanas"), pedestal, inscrição (linhas ilegíveis: o texto real não foi encontrado) e posição exata no eixo da praça. "No centro do pátio" e "talvez o dobro do natural" vêm de fontes divulgativas de baixa confiança.',
    sources: ['Plínio, NH 8.155', 'Suetônio, Divus Iulius 61', 'Estácio, Silvae 1.1.84–87', 'Platner & Ashby (via Ancient Rome Live)'],
  });

  info(0, 19.2, {
    radius: 4.2,
    title: 'Fonte das Apíades',
    latin: 'Appias',
    date: 'Atestada somente na época de Augusto',
    text: [
      'Ovídio fala da Appias que, "sob o templo de Vênus feito de mármore", golpeia o ar com jatos d\'água: uma fonte de ninfas ligadas à Aqua Appia, cercada, no tempo dele, de juristas, oradores e processos.',
      'R. Ulrich propõe que a fonte ficava logo diante do pódio do templo.',
    ],
    uncertain:
      'Hipotética para 44 a.C.: a fonte só aparece em Ovídio (época augustana) e pode ser posterior a César. A bacia, os jatos e as ninfas são marcadores. As "Apíades de Estéfano" citadas por Plínio ficavam nos monumentos de Asínio Polião, não aqui.',
    sources: ['Ovídio, Ars amatoria 1.79–88 e 3.449–452', 'Ovídio, Remedia amoris 659–660', 'Ancient Rome Live, Appiades fountain (R. Ulrich)', 'Plínio, NH 36.33'],
  });

  const porticoText = {
    title: 'Pórticos e tabernae',
    latin: 'Porticus et tabernae Fori Iulii',
    date: '46–44 a.C.',
    text: [
      'Pórticos cercavam o pátio do fórum, e uma fileira de tabernae (salas abertas para o pórtico) é atribuída à época de César.',
      'Como Ápio insiste que a praça não era um mercado, as tabernae aparecem aqui fechadas ou usadas como escritórios e arquivos, com escribas.',
      'Ovídio, já sob Augusto, descreve juristas, oradores e processos junto à fonte do fórum; a cena pode ser projetada, com cautela, para estes anos.',
    ],
    uncertain:
      'Reconstrução hipotética: ordem (coríntia), altura (7 m), intercolúnio (3,6 m) e material das colunas (estuque sobre pedra), profundidade dos pórticos, número, lado e função das tabernae e o forro de madeira não são documentados. O pórtico duplo visível nas ruínas é trajânico.',
    sources: ['Ápio, Guerras Civis 2.102', 'Ovídio, Ars amatoria 1.79–88', 'Páginas divulgativas sobre o Fórum de César (tabernae cesarianas; pórtico duplo trajânico) — confiança baixa'],
  };
  info(-27, 45, { radius: 9, ...porticoText });
  info(27, 45, { radius: 9, ...porticoText });

  info(0, 95, {
    radius: 13,
    title: 'Canteiro de obras',
    date: 'Início de 44 a.C.',
    text: [
      'O fórum foi dedicado em 46 a.C. ainda incompleto: as obras continuaram e só Augusto as concluiu, como ele mesmo registra nas Res Gestae.',
      'Pouco antes, a velha cúria reconstruída por Fausto Sula fora demolida para dar lugar a um templo de Felicitas e à nova Cúria Júlia, alinhada ao Fórum de César. Esta ponta do recinto, voltada para o Comício e o Argileto, ainda é canteiro.',
      'Vitrúvio recomenda extrair a pedra dois anos antes da obra e deixá-la ao tempo: as que resistem vão para a elevação; as danificadas, para as fundações.',
    ],
    uncertain:
      'Reconstrução hipotética: quais partes estavam inacabadas e como era o canteiro (tapumes, grua de roda de tração, andaimes, número de operários) não está documentado. Os blocos de tufo têm a medida dos blocos do Tabularium (2 × 2 × 4 pés).',
    sources: ['Plínio, NH 35.156', 'Res Gestae 20 (via Mercati di Traiano)', 'Dião Cássio 44.5.1–2', 'Vitrúvio 2.7.5', 'Platner & Ashby, Tabularium (medida dos blocos)'],
  });

  info(MON.loricata[0], MON.loricata[1], {
    radius: 4,
    title: 'Estátua de César couraçado',
    latin: 'Statua loricata',
    date: 'Dedicada com a permissão de César',
    text: ['Plínio registra que César permitiu que se dedicasse, no seu fórum, uma estátua sua couraçada (loricata).'],
    uncertain: 'Posição, material e pose não foram encontrados; o marcador é hipotético.',
    sources: ['Plínio, NH 34.18'],
  });
}
