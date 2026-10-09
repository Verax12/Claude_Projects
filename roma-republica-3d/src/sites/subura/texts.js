/**
 * Subura — textos dos painéis de informação (tecla I), em português do Brasil.
 * Todos os números e afirmações vêm de docs/pesquisa/07 (Subura e insulae), 10 (ruas e topografia)
 * e 11 (materiais e pessoas). Onde a nota diz NÃO ENCONTRADO/hipótese, o campo `uncertain` declara.
 * Citações antigas marcadas "conferido" foram verificadas no texto (Perseus) pela pesquisa ou,
 * no caso de Catulo 14 e Vitrúvio 10.2, durante a construção deste sítio.
 */

export const INFO = {
  subura: {
    title: 'Subura',
    latin: 'Subura',
    date: 'Bairro popular; estado no início de 44 a.C.',
    text:
      'Vale baixo e densamente habitado ao norte do Ópio, entre os esporões do Esquilino (Ópio e Císpio), o Viminal e o Quirinal. Ligava-se ao Fórum pelo Argileto e à Porta Esquilina pela subida chamada Clivus Suburanus. Varrão, contemporâneo de César, deriva o nome do pagus Succusanus (abreviado SVC) e põe a regio Suburana em primeiro lugar entre as quatro regiões "servianas" — região muito maior que o bairro.\n\n' +
      'César morou "primeiro na Subura, numa casa modesta" (modicis aedibus); desde que se tornou pontífice máximo vive na Domus Publica, na Via Sacra. Não se sabe onde ficava a casa da Subura, nem a Turris Mamilia, a torre onde os suburanenses pregavam a cabeça do Cavalo de Outubro quando venciam os moradores da Via Sacra.\n\n' +
      'Em 46 a.C. César revisou a lista do trigo público "rua por rua, por meio dos donos das insulae" (vicatim per dominos insularum): os beneficiários caíram de 320 mil para 150 mil.',
    uncertain:
      'Reconstrução hipotética: o traçado e a largura das ruas, as alturas e as cores dos prédios não são documentados para 44 a.C. Os limites do bairro são controversos (vale Ópio–Célio no uso arcaico; vale ao norte do Ópio no uso tardio, adotado aqui). A "Subura barulhenta, de prostitutas e mercado" é de Marcial e Juvenal (séc. I–II d.C.) — só analogia.',
    sources: ['Varrão, De lingua Latina 5.45–48', 'Suetônio, Divus Iulius 41.3 e 46.1 (conferidos)', 'Festo/Paulo, via W. Smith, Dictionary of Greek and Roman Geography (1854), s.v. Roma', 'Pleiades: Subura (451696383), Argiletum (451243813), Clivus Suburanus (821658053)', 'docs/pesquisa/07-subura-insulae.md §1'],
  },
  argiletum: {
    title: 'Argileto',
    latin: 'Argiletum',
    date: 'Rua existente; casario de aluguel em 61–44 a.C.',
    text:
      'Rua que sai do Fórum entre a Cúria e a Basílica Emília e atravessa a Subura. No seu ponto mais baixo fica o Jano, de portas abertas em tempo de guerra (Lívio 1.19.2).\n\n' +
      'Era rua de prédios de aluguel de gente rica: em 61 a.C. Quinto Cícero comprou "os três quartos restantes do edifício do Argileto" por 725.000 sestércios; em 44 a.C. Cícero calculava que suas insulae do Argileto e do Aventino rendiam cerca de 80.000 sestércios por ano — com isso sustentava o filho, que estudava em Atenas.\n\n' +
      'Livreiros existiam em Roma: Catulo ameaça correr "às estantes dos livreiros" (ad librariorum scrinia). A fama do Argileto como rua de livreiros e sapateiros, porém, vem de Marcial (séc. I d.C.) e é contestada: as lojas desses ofícios aqui são só analogia.',
    uncertain: 'Largura (5,5 m) e calçamento de silex do Argileto: hipótese (largura NÃO ENCONTRADA; as vias urbanas eram calçadas com silex desde 174 a.C., segundo Lívio 41.27.5, mas não se sabe quais ruas da Subura).',
    sources: ['Cícero, Ad Atticum 1.14.7, 12.32.2, 16.1.5', 'Lívio 1.19.2; 41.27.5', 'Catulo 14.17–18 (conferido no texto latino da Perseus)', 'Marcial 2.17 (posterior)', 'docs/pesquisa/02-forum-norte.md §11; 07 §2–3'],
  },
  insulae: {
    title: 'Insulae: os prédios de aluguel',
    latin: 'insulae, cenacula',
    date: 'Tipo comum na República tardia',
    text:
      'Prédios de vários andares alugados por andares ou cômodos: lojas (tabernae) no térreo e apartamentos (cenacula) em cima, aos quais se sobe por escada direto da rua (Lívio 39.14.2). Um "terceiro andar" habitado já existia em 218 a.C. (Lívio 21.62.3); em 63 a.C. Cícero descreve Roma "erguida e suspensa em cenacula", de ruas ruins e vielas estreitíssimas (Leg. agr. 2.96).\n\n' +
      'A lei limitava as paredes-meias a 1,5 pé (≈ 0,44 m) (Vitrúvio 2.8.17). Térreo de concreto com paramento de opus incertum de tufo, rebocado; andares de cima mais leves, de madeira e opus craticium — taipa sobre trama de montantes e travessas que, diz Vitrúvio, "arde como tocha" (2.8.20). Janelas pequenas, sem vidro, com postigos de madeira de duas folhas; sacadas (maeniana) e andares que se projetam sobre a rua.\n\n' +
      'O teto de 70 pés (≈ 20,7 m) para as fachadas é de Augusto (Estrabão 5.3.7): em 44 a.C. não havia limite legal de altura.',
    uncertain:
      'Reconstrução hipotética: 3 a 5 pavimentos (≈ 10–17 m), alturas de piso, plantas e cores das fachadas (reboco claro e sujo, barra inferior vermelha ou ocre) não são documentados — a pesquisa não localizou nenhuma insula republicana escavada em Roma. Evitou-se o tijolo aparente "estilo Óstia": o paramento de tijolo cozido mais antigo conhecido em Roma é o da Rostra de César (44 a.C.).',
    sources: ['Lívio 21.62.3; 39.14.2', 'Cícero, De lege agraria 2.96', 'Vitrúvio 2.8.1, 2.8.16–20', 'Estrabão 5.3.7', 'W. Smith, Dictionary of Greek and Roman Antiquities (1890), s.v. Domus, Murus, Maenianum', 'docs/pesquisa/07-subura-insulae.md §3; 11 §5'],
  },
  tabernae: {
    title: 'Tabernae: lojas e oficinas',
    latin: 'tabernae, pergulae',
    date: 'Térreo das insulae',
    text:
      'No térreo, lojas abertas para a rua, alugadas pelo dono do prédio; sobre elas, um mezanino (pergula) servia de depósito ou de dormitório. Padarias com moinho e forno existem em Roma desde a guerra contra Perseu (Plínio, NH 18.107). Na época de Sula, o térreo de um prédio valia mais de aluguel que o andar de cima (Plutarco, Sula 1.4).\n\n' +
      'O aluguel era tema político: em 48 a.C. o pretor Célio propôs um ano de aluguel grátis (a lei fracassou); César perdoou um ano de aluguel até 2.000 sestércios em Roma (500 na Itália).\n\n' +
      'Catulo ameaça escrever obscenidades na fachada de uma taberna (37): rabiscos e letreiros pintados nas paredes faziam parte da rua.',
    uncertain: 'Dimensões das lojas e dos mezaninos NÃO ENCONTRADAS. Balcões de alvenaria rebocada e o fechamento com tábuas verticais encaixadas na soleira são hipóteses com paralelos pompeianos (nota 07 §4). Os letreiros são "inscrições sugeridas", propositalmente ilegíveis.',
    sources: ['Plínio, Naturalis Historia 18.107', 'Plutarco, Sula 1.4', 'César, Bellum civile 3.20–21; Dião 42.22.3, 42.51.1; Suetônio, Iul. 38.2', 'Catulo 37', 'docs/pesquisa/07-subura-insulae.md §3–4'],
  },
  compitum: {
    title: 'Compitum: capela dos Lares Compitales',
    latin: 'compitum, Lares Compitales',
    date: 'Culto de vizinhança; festa logo depois das Saturnais',
    text:
      'Nas encruzilhadas de todas as vielas havia pequenas capelas (kaliades) erguidas pelos vizinhos para os Lares protetores. No sacrifício anual cada casa levava bolos de mel, e quem oficiava eram escravos, que naqueles dias ficavam livres do serviço. A festa, as Compitalia, era celebrada "poucos dias depois das Saturnais" — por isso, em janeiro, ainda se veem guirlandas, bolos e lucernas acesas.\n\n' +
      'Os jogos compitalícios foram suprimidos pelo Senado (64 a.C.), celebrados de novo por Sexto Clódio em 1º de janeiro de 58 a.C., e os collegia de bairro, restaurados por Clódio, foram dissolvidos por César — exceto os antigos. A reforma augustana dos vici, com o Genius Augusti entre os Lares, é de 7 a.C.: posterior.',
    uncertain: 'Reconstrução hipotética: forma, tamanho e localização das capelas da Subura NÃO ENCONTRADOS. A pintura dos dois Lares dançando, com corno e pátera, segue a iconografia conhecida sobretudo em Pompeia. Que as Compitalia tenham caído em desuso depois de César é inferência controversa: aqui o culto aparece discreto, de vizinhança.',
    sources: ['Dionísio de Halicarnasso, Antiguidades Romanas 4.14.3–4', 'Cícero, In Pisonem 8–9', 'Suetônio, Divus Iulius 42.3', 'W. Smith, Dictionary of Greek and Roman Antiquities (1890), s.v. Compitalia, Lararium', 'docs/pesquisa/07-subura-insulae.md §5'],
  },
  lacus: {
    title: 'Lacus: bacia pública de água',
    latin: 'lacus',
    date: 'Abastecida pelos aquedutos republicanos',
    text:
      'Quem não tinha água encanada — quase todos na Subura — buscava-a nas fontes e bacias públicas; nos primeiros tempos o particular só podia usar a água que transbordava (aqua caduca). Em 44 a.C. chegam a Roma quatro aquedutos: Ápio (312 a.C.), Ânio Velho (iniciado em 272 a.C.), Márcio (144 a.C.) e Tépula (c. 125 a.C.). Em 184 a.C. os censores mandaram revestir de pedra os lacus da cidade (Lívio 39.44.5).\n\n' +
      'Carregar água era serviço de escravos; os aguadeiros (aquarii) eram desprezados.',
    uncertain: 'Reconstrução hipotética: o número e a posição das bacias da Subura em 44 a.C. NÃO foram encontrados (as 700 bacias de Agripa são de 33 a.C., posteriores). Forma e medidas desta bacia de lajes de pedra são plausíveis, sem fonte direta.',
    sources: ['Lívio 39.44.5', 'Frontino 94 (via Smith)', 'Plínio, NH 36.121 (Agripa, posterior)', 'W. Smith, Dictionary of Greek and Roman Antiquities (1890), s.v. Aquaeductus, Fons, Aquarii', 'docs/pesquisa/07-subura-insulae.md §6; 09-foricae-agua.md (Tépula)'],
  },
  demolition: {
    title: 'Demolições para o Fórum de César',
    latin: 'Forum Iulium (área comprada)',
    date: 'Compras desde 54 a.C.; fórum dedicado em 46 a.C.',
    text:
      'Em 54 a.C. os amigos de César — o próprio Cícero e Ópio — gastaram 60 milhões de sestércios comprando casas particulares para o novo fórum, "porque com os particulares não se podia fechar negócio por menos" (Cícero, Att. 4.17.7). A borda sudoeste da Subura, junto ao Argileto, era assim uma zona de demolições e de canteiro; o Fórum de César foi dedicado em 46 a.C. ainda inacabado.\n\n' +
      'Nada se perdia: Vitrúvio diz que as paredes mais firmes são as feitas com telhas velhas reaproveitadas (2.8.19).',
    uncertain: 'Local exato, extensão e estado das demolições no início de 44 a.C.: reconstrução hipotética (nota 07 §1).',
    sources: ['Cícero, Ad Atticum 4.17.7 (numeração Perseus)', 'Vitrúvio 2.8.19', 'Pleiades: Forum Iulium (445545537)', 'docs/pesquisa/07-subura-insulae.md §1–3'],
  },
  fire: {
    title: 'Incêndios, desabamentos e reconstrução',
    latin: 'incendia et ruinae',
    date: 'Mal endêmico da Roma republicana',
    text:
      'Catulo zomba do pobre Fúrio, que não teme "nem incêndios, nem pesados desabamentos" (23.9). Plutarco conta que incêndios e desabamentos eram "naturais e familiares" em Roma, por serem os prédios pesados e apinhados; Crasso tinha mais de 500 escravos arquitetos e construtores e comprava casas em chamas, e as vizinhas, a preço vil (Crasso 2.4). Para Estrabão, Roma vive em construção incessante por causa dos "desabamentos, incêndios e revendas" (5.3.7).\n\n' +
      'Não há corpo público de bombeiros: os vigiles são criação de Augusto. A obra nova usa opus reticulatum, que Vitrúvio diz que "agora todos usam", ao lado do antigo incertum (2.8.1). A cabrilha de duas pernas com sarilho e moitões segue a descrição de Vitrúvio (10.2.1–2).',
    uncertain: 'O prédio queimado, os andaimes e a máquina de elevação são reconstrução hipotética. Vitrúvio escreve sob Augusto, uma geração depois; a coexistência de incertum e reticulatum em 44 a.C. é inferência (nota 11 §5).',
    sources: ['Catulo 23.9', 'Plutarco, Crasso 2.4', 'Estrabão 5.3.7', 'Vitrúvio 2.8.1; 10.2.1–2 (conferido no texto da Perseus)', 'docs/pesquisa/07-subura-insulae.md §3; 11 §5'],
  },
  shored: {
    title: 'Prédio escorado',
    latin: 'graves ruinae',
    date: '—',
    text:
      'Rachaduras e escoras faziam parte da paisagem. Catulo atesta o medo dos "pesados desabamentos"; Plínio diz que a principal causa dos desabamentos na cidade era a fraude na cal, com pedras assentadas sem ligante (36.176). Juvenal, bem depois, descreve uma Roma "apoiada em escoras finas" (3.193).',
    uncertain: 'Cena de ambientação: reconstrução hipotética. Juvenal é do séc. II d.C. (analogia).',
    sources: ['Catulo 23.9', 'Plínio, NH 36.176', 'Juvenal 3.193–196 (posterior)', 'docs/pesquisa/07-subura-insulae.md §6; 11 §5'],
  },
  people: {
    title: 'Gente da Subura',
    latin: 'Suburanenses',
    date: '—',
    text:
      'Bairro misturado: artesãos, lojistas, escravos e libertos, mas também famílias distintas — a de César morou aqui. De dia as ruas são de pedestres, carregadores e mulas de carga; César restringiu o uso de liteiras a certas pessoas, idades e dias (Suetônio, Iul. 43.1), e soldados armados dentro da cidade seriam coisa excepcional. Horácio fala dos "cães da Subura" (Epod. 5.58).\n\n' +
      'Em 46 a.C., nos jogos dos triunfos, César deu espetáculos "por bairros, em toda a cidade, com atores de todas as línguas" (Iul. 39.1): ouvia-se grego e outras línguas nas ruas.',
    uncertain: 'A proibição de carroças durante o dia (Lex Iulia municipalis/Tabula Heracleensis) NÃO foi verificada pela pesquisa. A distribuição de pessoas e animais é ambientação hipotética.',
    sources: ['Suetônio, Divus Iulius 39.1, 43.1, 46.1', 'Horácio, Epodos 5.58', 'docs/pesquisa/07-subura-insulae.md §1; 11 §16–18'],
  },
  clivus: {
    title: 'Rumo ao Clivus Suburanus',
    latin: 'Clivus Suburanus, Vicus Patricius',
    date: 'Vias existentes; nomes discutidos',
    text:
      'Daqui a rua principal sobe para leste, rumo à Porta Esquilina, pelo Clivus Suburanus — provavelmente, na República, a rota principal entre o Fórum e a Porta Esquilina, ladeada de lojas. Um ramo segue para NNE entre o Viminal e o Císpio, por onde passa o Vicus Patricius (traçado semelhante ao da atual Via Urbana).\n\n' +
      'Além da Porta Esquilina ficava o cemitério dos pobres. A Porticus e o Macellum de Lívia, junto ao Clivus, são obras de Augusto: ainda não existem.',
    uncertain: 'Smith (1854) julga que "Clivus Suburanus" seria apenas um apelido ("a subida da Subura"); o nome é aceito por Pleiades e pelo LTUR. O nome Vicus Patricius em 44 a.C. não foi verificado. Traçado das ruas no jogo: hipótese.',
    sources: ['Pleiades: Clivus Suburanus (821658053), Vicus Patricius (166272189), Esquilinus (679976755)', 'Stanford Digital Forma Urbis Romae / LTUR (via resumo de busca)', 'W. Smith, Dictionary of Greek and Roman Geography (1854)', 'docs/pesquisa/07-subura-insulae.md §2; 10 §2–4'],
  },
};

/** Painéis curtos das tabernae visitáveis, por ofício. */
export const TRADE_INFO = {
  pistrinum: {
    title: 'Padaria (pistrinum)',
    latin: 'pistrinum',
    text: 'Moinho e forno na mesma loja: "não houve padeiros em Roma até a guerra contra Perseu" (171–168 a.C.); antes, o pão era feito em casa (Plínio, NH 18.107). Os pobres recebiam trigo público e compravam pão nas padarias.',
    uncertain: 'Os moinhos "de ampulheta" de lava e o forno abobadado seguem tipos conhecidos de Pompeia: hipótese de forma e tamanho.',
    sources: ['Plínio, NH 18.107', 'Suetônio, Iul. 41.3', 'docs/pesquisa/07 §4, §6'],
  },
  caupona: {
    title: 'Taberna de vinho (caupona)',
    latin: 'caupona',
    text: 'Balcão de alvenaria com jarras embutidas, ânforas de vinho e banquinhos. Catulo fala de uma "taberna devassa" perto do templo de Castor, em cuja fachada ameaça escrever (37).',
    uncertain: 'O balcão com jarras embutidas é paralelo pompeiano (posterior e regional): hipótese.',
    sources: ['Catulo 37', 'docs/pesquisa/07 §4; 11 §19'],
  },
  sutor: {
    title: 'Sapateiro (sutor)',
    latin: 'sutor',
    text: 'Bancada, formas de madeira e couros pendurados. Marcial (séc. I d.C.) lembra os muitos sapateiros do Argileto e da entrada da Subura — testemunho posterior, usado aqui como analogia.',
    uncertain: 'Ofício plausível; sua concentração no Argileto em 44 a.C. não é documentada.',
    sources: ['Marcial 2.17 (posterior)', 'docs/pesquisa/02 §11; 07 §2'],
  },
  tonstrina: {
    title: 'Barbeiro (tonstrina)',
    latin: 'tonstrina',
    text: 'Os homens adultos andam barbeados desde o séc. III a.C. (Plínio 7.211). Horácio: o pobre "muda de cenacula, de camas, de banhos, de barbeiros" (Epist. 1.1.91).',
    uncertain: 'Mobiliário da loja: hipótese.',
    sources: ['Plínio, NH 7.211', 'Horácio, Epístolas 1.1.91', 'docs/pesquisa/07 §6; 11 §14'],
  },
  librarius: {
    title: 'Livreiro (librarius)',
    latin: 'librarius, scrinia',
    text: 'Estantes com rolos de papiro: Catulo, contemporâneo de César, ameaça correr "às estantes dos livreiros" (ad librariorum scrinia, 14.17–18) para comprar maus poetas.',
    uncertain: 'A fama do Argileto como rua de livreiros vem de Marcial e é contestada: localização hipotética.',
    sources: ['Catulo 14.17–18 (conferido no texto latino da Perseus)', 'docs/pesquisa/02 §11'],
  },
  lanarius: {
    title: 'Loja de lã e tecidos',
    latin: 'lanarius',
    text: 'Lãs de cores naturais — branca, cinza, ruiva, fulva, castanha e preta — eram a paleta do povo (Plínio 8.190–191). César proibiu a roupa de púrpura marinha, salvo a certas pessoas, idades e dias (Suetônio, Iul. 43.1).',
    uncertain: 'Arranjo da loja: hipótese.',
    sources: ['Plínio, NH 8.190–191', 'Suetônio, Iul. 43.1', 'docs/pesquisa/11 §11'],
  },
  figulus: {
    title: 'Louça de barro',
    latin: 'figlina, Campana supellex',
    text: 'Jarras, panelas (ollae), pratos e lucernas de barro. Horácio janta em "louça campana" (Campana supellex), sinal de mesa modesta (Sat. 1.6.118).',
    uncertain: 'Arranjo da loja: hipótese.',
    sources: ['Horácio, Sátiras 1.6.116–118', 'docs/pesquisa/07 §6'],
  },
  holitor: {
    title: 'Verdureiro',
    latin: 'holitor',
    text: 'Alho-poró, grão-de-bico, couves e farro: Horácio pergunta no mercado "quanto custam a verdura e o farro" e volta para casa para uma tigela de alho-poró, grão-de-bico e laganum (Sat. 1.6.112–115). Nada de tomate, batata ou milho, plantas americanas.',
    uncertain: 'Arranjo da loja: hipótese.',
    sources: ['Horácio, Sátiras 1.6.112–115', 'docs/pesquisa/07 §6; 08'],
  },
};
