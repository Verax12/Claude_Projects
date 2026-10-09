# 10 — Circus Maximus e topografia de Roma (colinas, vales, muralha, ruas, Velabro, Forum Boarium, Tibre) em 50–44 a.C.

> **Escopo:** Circus Maximus (obras de César, 46 a.C.); topografia geral (colinas, vales, cotas, inclinações); Muralha Serviana e suas portas perto da área do jogo; ruas principais e pavimentação; Velabro e Forum Boarium (Portuno, Hércules Vencedor, Ara Máxima, Fortuna e Mater Matuta); Tibre, Ilha Tiberina e pontes.
>
> **Convenções:** coordenadas do jogo **(x, z)** em metros (x = leste, z = sul; origem 41.8925 N, 12.4850 E), conforme `00-coordenadas.md`. Pelo `docs/ARQUITETURA.md`, **y = 0 = pavimento do Fórum Romano na República tardia**. Rumos em graus a partir do norte, sentido horário. Confiança: **alta** (fonte primária conferida no texto original ou dado geográfico direto), **média** (fonte secundária confiável ou resumo de busca coerente com outras fontes), **baixa** (fonte única, divulgação ou derivação nossa).
>
> **Aviso de método (importante):** a cota de buscas na web da sessão, compartilhada por todos os agentes, **esgotou depois de 3 buscas** deste tema. As três foram sobre o Circo. Por isso:
> 1. As **fontes antigas** foram lidas **no texto original**: arquivos TEI do Perseus Digital Library no GitHub (`raw.githubusercontent.com/PerseusDL/...`), que o proxy permite. As citações latinas e gregas abaixo foram **conferidas** nesses arquivos.
> 2. As **posições** vêm do gazetteer **Pleiades** (`isawnyu/pleiades.datasets`), incluindo os traçados OSM (*linestrings*) de trechos de muralha, ruas e edifícios. Foram convertidas para o sistema do jogo com a mesma fórmula do `00-coordenadas.md`.
> 3. As **cotas modernas** vêm de um **modelo digital de elevação** (Mapzen/Tilezen *Terrarium*, zoom 15). Em terra, na Itália, ele usa **SRTM, ~30 m**, referido ao geoide EGM96, segundo a documentação `tilezen/joerd`. **Não é o terreno antigo** (ver §2).
> 4. Quase nenhum dado da **bibliografia arqueológica moderna** (altura da muralha, larguras de rua, cotas antigas dos vales) pôde ser pesquisado. Esses dados estão marcados **NÃO ENCONTRADO** e reunidos na seção de lacunas.
>
> Termos marcados **[DERIVADO]** são cálculos nossos a partir de dados com fonte. **[HIPÓTESE DE MODELAGEM]** marca decisões de design sem atestação.

---

## Resumo do estado em 50–44 a.C.

| Local | Estado em 50–44 a.C. | O que NÃO pôr (fase posterior) |
|---|---|---|
| **Circus Maximus** | **Existente e reformado por César em 46 a.C.** O espaço foi prolongado nas duas extremidades e ganhou um **euripus** (fosso com água) em volta da arena (Suet. *Iul.* 39.2; Plín. *NH* 8.21). Plínio atribui o circo "construído por César ditador" com 3 × 1 estádios (*NH* 36.102). Havia carceres desde 329 a.C., refeitos em 174 a.C. com *ova* e metas (Lív. 8.20.2; 41.27.6). Os jogos de triunfo de 46 a.C. incluíram corridas, Jogo de Troia, caçadas e uma batalha com elefantes em que as **metas foram retiradas** (Suet. *Iul.* 39.2). | O **obelisco de Augusto** (Plín. *NH* 36.71), os golfinhos e demais acréscimos augustanos, o fechamento do euripus e os assentos dos cavaleiros de **Nero** (Plín. *NH* 8.21), o **Arco de Tito** na curva (Pleiades) e o mitreu (Pleiades). A descrição de Dionísio (3.68) é **augustana**, c. 8 a.C. [DERIVADO de Dion. 1.7.2]. Serve de referência próxima, mas não é o estado de 46 a.C. |
| **Colinas e vales** | Relevo natural ainda pronunciado: Capitólio com dois cumes (Arx e Capitolium), Palatino, Velia (esporão hoje inexistente), Esquilino (Opio e Císpio), Viminal, Quirinal, Aventino e Célio. O Aventino ficava **fora do pomério** até Cláudio (Pleiades). | A sela capitolina atual está **~8 m acima** da antiga (Musei Capitolini, via nota 01). O vale do Fórum moderno tem aterros e cortes. |
| **Muralha Serviana** | De pé em muitos trechos, mas **absorvida pela cidade**: em Lívio, os edifícios "agora geralmente se encostam" à muralha (1.44.4); Dionísio diz que ela era difícil de achar por causa das casas em volta, embora restassem traços em muitos lugares (4.13.5); para Plínio, as casas tinham "acrescentado muitas cidades" além dela (*NH* 3.67). O *agger* do Esquilino continuava sendo a obra mais forte (Dion. 9.68.3–4; Str. 5.3.7). | Muralha Aureliana (séc. III d.C.); Arco de Galieno (262 d.C.) na Porta Esquilina; Arco de Dolabela (Porta Celimontana). |
| **Ruas** | Ruas da cidade **pavimentadas com *silex*** desde a empreitada dos censores de 174 a.C. (Lív. 41.27.5). Traçado estreito e sinuoso: *"non optimis viis, angustissimis semitis"* (Cíc. *Leg. agr.* 2.96, 63 a.C.) e *"artis itineribus hucque et illuc flexis atque enormibus vicis, qualis vetus Roma fuit"* (Tác. *Ann.* 15.38). | O limite augustano de **70 pés** de altura para prédios em vias públicas é **posterior** (Str. 5.3.7). |
| **Velabro / Forum Boarium** | Área comercial e ritual na margem leste do Tibre (Pleiades). Templo de **Portuno** (tetrastilo, fim do séc. II/início do I a.C.) e **templo redondo de Hércules** (fim do séc. II a.C.), ambos segundo o Pleiades. Lívio já cita uma *aedes rotunda Herculis* no Forum Boarium em 296 a.C. (10.23.3). **Ara Máxima**; templos de **Fortuna e Mater Matuta** dentro da Porta Carmental (Lív. 25.7.6), com os **dois arcos de Stertínio** com estátuas douradas diante deles (196 a.C.; Lív. 33.27.4). | **Arco de Jano Quadrifronte** (séc. IV d.C.) e **Arcus Argentariorum** (204 d.C.), ambos segundo o Pleiades. |
| **Tibre e pontes** | **Pons Sublicius** de madeira, sem pregos de ferro, por razão religiosa (Plín. *NH* 36.100). **Pons Aemilius** de pedra (pilares de 179 a.C., arcos de 142 a.C.; Lív. 40.51.4). **Pons Fabricius** (séc. I a.C., Pleiades; a data de 62 a.C. NÃO foi verificada aqui). Enchentes frequentes (Lív. 35.9.2; 35.21.5; 38.28.4). | **Pons Cestius**: "séc. I a.C." (Pleiades); se já existia em 44 a.C., **NÃO ENCONTRADO**. Muralhas modernas do Tibre (*muraglioni*). |

---

## 1. Circus Maximus

### Estado em 50–44 a.C.

- **Obra de César, 46 a.C.** Nos jogos do triunfo, "nos jogos circenses, **prolongado o espaço do circo de ambos os lados** e **acrescentado um euripus em volta** (*in gyrum euripo addito*), jovens nobilíssimos conduziram quadrigas, bigas e cavalos de saltadores" (Suet. *Iul.* 39.2, conferido: *"circensibus spatio circi ab utraque parte producto et in gyrum euripo addito quadrigas bigasque et equos desultorios agitauerunt nobilissimi iuuenes"*).
- **Motivo do euripus.** Nos jogos de Pompeu de 55 a.C. (2º consulado, dedicação do templo de Vênus Vencedora), 20 elefantes (17, segundo alguns) lutaram **no circo** e tentaram romper a cerca de **grades de ferro** (*claustris ferreis*), assustando o público. "Por essa razão, César ditador, quando ia depois dar espetáculo semelhante, **cercou a arena com euripos**, que o imperador Nero suprimiu ao acrescentar lugares para os cavaleiros" (Plín. *NH* 8.20–21, conferido: *"qua de causa Caesar dictator postea simile spectaculum editurus euripis harenam circumdedit, quos Nero princeps sustulit equiti loca addens"*). Platner data o fosso de 46 a.C. e o coloca "entre a arena e os assentos" (resumo de busca de Platner–Ashby, *Circus Maximus*, Perseus).
- **Plínio atribui o circo a César:** *"circum maximum a Caesare dictatore exstructum longitudine stadiorum trium, latitudine unius, sed cum aedificiis iugerum quaternum, ad sedem CCL"* (*NH* 36.102, edição Mayhoff no Perseus, conferido). A tradução Bostock no Perseus traz **260.000** lugares, de outra leitura do manuscrito. Platner adverte que "o texto desta passagem é corrupto e os números são questionáveis" (resumo de busca).
- **Jogos de 46 a.C.** Jogo de Troia com duas turmas de meninos; **caçadas por 5 dias**; por fim, uma batalha entre dois exércitos, cada um com **500 infantes, 20 elefantes e 30 cavaleiros**. "Para lutarem com mais espaço, **foram retiradas as metas** e em seu lugar armaram-se **dois acampamentos frente a frente**" (Suet. *Iul.* 39.2–3, conferido: *"sublatae metae inque earum locum bina castra exaduersum constituta erant"*). Plínio confirma: no 3º consulado de César lutaram 20 elefantes contra 500 infantes e, de novo, 20 elefantes com torres e 60 defensores cada (*NH* 8.22, conferido).
- **Antecedentes republicanos (todos conferidos em Lívio):**
  - Tarquínio Prisco "demarcou o lugar do circo que hoje se chama Máximo". Os senadores e cavaleiros recebiam lotes para montar suas arquibancadas (*fori*), sobre **forquilhas de 12 pés** de altura (1.35.8–9). Tarquínio Soberbo fez "*foros in circo*" (1.56.2).
  - *"carceres eo anno in circo primum statuti"*: as primeiras carceres são de **329 a.C.** (8.20.2).
  - Em **174 a.C.** os censores contrataram *"carceres in circo, et ova ad notas curriculis numerandis […] et metas trans et caveas ferreas"* (41.27.6; o texto tem lacuna).
  - Em 196 a.C., L. Stertínio ergueu **um arco (*fornix*) no Circo Máximo** com estátuas douradas (33.27.4).
  - Em 182 a.C. uma tempestade derrubou "estátuas no Circo Máximo **com as colunas** sobre as quais estavam" (40.2.2).
- **Datação de Dionísio:** ele chegou à Itália quando Augusto encerrou a guerra civil, "no meio da 187ª Olimpíada", e escrevia 22 anos depois (Dion. 1.7.2, conferido). Isso dá **c. 8–7 a.C.** [DERIVADO]. A descrição detalhada em 3.68 mostra, portanto, o circo **cesariano-augustano** algumas décadas depois do período do jogo.

### Localização, orientação e relações espaciais

- Fica no vale entre o **Aventino** e o **Palatino** (Dion. 3.68.1; Pleiades).
- Lívio situa no vale "de Múrcia" (*ad Murciae*) o assentamento de latinos que uniu o Aventino ao Palatino (1.33.5, conferido).
- O pomério de Rômulo passava pelo **Forum Boarium** (touro de bronze, Ara Máxima) e "pela base do Palatino até o **altar de Conso**", depois pelas *curiae veteres*, o *sacellum Larum* e o Fórum (Tác. *Ann.* 12.24, conferido). Isso põe a **Ara Consi** no sopé sudoeste do Palatino, do lado do circo.
- **Extremidade das carceres = oeste/noroeste, junto ao Forum Boarium.** O mitreu do Circo Máximo ficava "adjacente ao circo e **voltado para as carceres**, à margem do Forum Boarium" (Pleiades 960323262; mitreu imperial, só como referência de lugar). Pela descrição de Dionísio, esse lado curto ficava "a céu aberto" (*αἴθριος*), com as carceres (3.68.3).
- **Extremidade curva = leste/sudeste.** Lá ficaria, muito depois, o Arco de Tito (Pleiades 45530496, "na extremidade leste do Circo Máximo"; posterior).
- A procissão dos jogos, a *pompa circensis*, passava pelo **Velabro**: *"qua Velabra solent in Circum ducere pompas"* (Ov. *Fast.* 6.405, conferido). O Forum Boarium é a praça "**junta às pontes e ao grande Circo**" (Ov. *Fast.* 6.477–478, conferido).
- **Escadas de Caco (*Scalae Caci*):** ficavam no canto sudoeste do Palatino e desciam do alto do monte ao vale do circo (Pleiades 606719480). A **cabana de Rômulo** (*Tugurium Romuli*) ficava perto delas; as fontes antigas (Dionísio, Plutarco) a localizam ali e ela foi mantida até pelo menos o séc. IV d.C. (Pleiades 251058809).
- **Coordenadas:**

| Ponto | x | z | Fonte | Confiança |
|---|---|---|---|---|
| Circus Maximus (ponto Pleiades, "precise") | 58,9 | 731,4 | `00-coordenadas.md` / Pleiades 458808506 | média (marca o parque moderno, não necessariamente o centro antigo) |
| Mitreu "voltado para as carceres" (posterior) | −177,7 | 488,2 | Pleiades 960323262 | baixa (acurácia declarada de 2000 m) |
| Arco de Tito, extremidade leste (posterior) | 276,2 | 896,8 | Pleiades 45530496 | baixa (acurácia de 2000 m) |
| Escadas de Caco | −9,9 | 361,8 | Pleiades 606719480 | baixa (*rough*) |
| Lupercal (sopé do Palatino) | 174,8 | 355,5 | Pleiades 565793497 | baixa (*rough*: é só o ponto genérico do Palatino) |

- **Eixo do vale [DERIVADO do DEM]:** procuramos a linha de mínimos do relevo moderno em cortes transversais a cada 20 m, ao longo de ±280 m do ponto Pleiades. O eixo mais retilíneo tem **rumo ≈ 126° / 306°**, isto é, de **ONO** (carceres, Forum Boarium) para **ESE** (curva). A linha de fundo passa **~10–30 m a nordeste** do ponto Pleiades (lado do Palatino). O parque moderno é aberto, então o DEM ali é relativamente limpo, mas o fundo atual **não** é o nível antigo da arena (NÃO ENCONTRADO).
- **Verificação [DERIVADO]:** um circo de 621 m (Dionísio) centrado no ponto Pleiades e alinhado a 126° teria extremidades em **NO ≈ (−192, 549)** e **SE ≈ (310, 914)**. A primeira fica a ~60 m do mitreu "voltado para as carceres"; a segunda, a ~40 m do ponto do Arco de Tito "na extremidade leste". Os dois pontos de controle são coerentes com essa implantação, apesar da baixa acurácia de ambos.
- **Largura do vale [DERIVADO do DEM]:** a faixa abaixo da cota moderna de 28 m mede ~140 m no centro e ~185–235 m nas extremidades.

### Dimensões

| Elemento | Valor | Unidade | Fonte | Confiança |
|---|---|---|---|---|
| Comprimento (circo de César, texto de Plínio) | 3 | estádios | Plín. *NH* 36.102 (conferido) | média: o texto é dado como corrupto (Platner) |
| Largura (Plínio) | 1 | estádio | idem | baixa: largura de 1 estádio (≈ 177 m [DERIVADO]) não bate com Dionísio |
| Área "com os edifícios" (Plínio) | 4 | *iugera* | idem | baixa (número suspeito, Platner) |
| Lugares sentados (Plínio, ed. Mayhoff) | 250.000 (*CCL*) | pessoas | idem | baixa (texto corrupto; refere-se à época de Plínio/Vespasiano segundo Platner) |
| Lugares sentados (Plínio, trad. Bostock) | 260.000 | pessoas | Perseus, Bostock (conferido) | baixa (variante de manuscrito) |
| Comprimento (Dionísio, c. 8 a.C.) | 3,5 estádios ≈ **621** | m | Dion. 3.68.2 (conferido: *τριῶν καὶ ἡμίσους σταδίων*); conversão em metros segundo resumo de busca (Platner/DAR) | alta para o texto; média para a conversão |
| Largura (Dionísio) | 4 plethra ≈ **118** | m | Dion. 3.68.2 (conferido: *τεττάρων πλέθρων*); conversão idem | alta / média |
| Euripus: largura e profundidade | 10 pés ≈ **2,96** | m | Dion. 3.68.2 (*βάθος τε καὶ πλάτος δεκάπους*, conferido); 10 pés romanos = 2,96 m (resumo de busca) | alta |
| Euripus: extensão | os 2 lados longos e o lado curvo; **não** do lado das carceres | — | Dion. 3.68.2 (conferido) | alta (estado augustano) |
| Perímetro da "stoa-anfiteatro" (arquibancadas) | 8 | estádios | Dion. 3.68.3 (conferido) | alta (texto); estado augustano |
| Capacidade (Dionísio) | **150.000** (*πεντεκαίδεκα μυριάδας*) | pessoas | Dion. 3.68.3 (conferido) | alta (texto); estado c. 8 a.C. |
| Estimativa moderna | c. 650 × 125 | m | Humphrey, citado em resumo de busca (provavelmente DAR) | média |
| Estimativa moderna | c. 621 × 118 | m | Ciancio Rossetto 1987, citado em resumo de busca | média |
| Pista/arena (sem fase indicada) | 540 × 80 | m | World History Encyclopedia (resumo de busca) | baixa |
| Fase imperial (não usar) | 600 × 140 | m | Stanford *Digital Forma Urbis* (resumo de busca) | média (fase imperial) |
| Constantino (não usar) | c. 610 × 190 (?) | m | Britannica (resumo de busca, em italiano; número possivelmente mal resumido) | baixa |
| Valores de divulgação a descartar | 544 × 129; "~600 × 140"; 421 × 118 | m | sites de divulgação / erro de transcrição no resumo da Stanford | — |
| Altura das plataformas dos *fori* arcaicos | 12 pés ≈ 3,55 | m | Lív. 1.35.9 (conferido: *furcis duodenos ab terra spectacula alta sustinentibus pedes*) [conversão DERIVADA, pé = 0,296 m] | alta (texto); fase régia lendária |
| Número de carceres | **12** | — | Platner (resumo de busca) | média; fase de referência não especificada; para 46 a.C., NÃO ENCONTRADO |
| Altura das arquibancadas, nº de degraus, inclinação da cávea | **NÃO ENCONTRADO** | — | — | — |
| Comprimento e altura da barreira central em 46 a.C. | **NÃO ENCONTRADO** | — | — | — |
| Cota da arena antiga | **NÃO ENCONTRADO** (DEM moderno do fundo do vale: 21,5–25,4 m s.n.m., ver §2) | m | — | — |

### Planta e elementos arquitetônicos

- **Forma geral (Dionísio, 3.68.2–4, conferido):** dois lados longos e um lado curto **em meia-lua** (*μηνοειδὲς*) formam uma única stoa contínua, um "anfiteatro" de 8 estádios. O outro lado curto fica **a céu aberto** e tem as carceres.
- **Carceres:** *ψαλιδωτὰς ἱππαφέσεις*, isto é, **partidas abobadadas**, "todas abertas ao mesmo tempo por uma única corda (*ὕσπληξ*)" (Dion. 3.68.3–4). Platner fala em **12** carceres fechadas por barreiras de corda presas a pequenas hermas, baixadas juntas na largada (resumo de busca). Em 329 a.C. foram erguidas pela primeira vez (Lív. 8.20.2) e refeitas em 174 a.C. (Lív. 41.27.6). Material e forma em 46 a.C.: NÃO ENCONTRADO. Um site de divulgação (Imperium Romanum) diz que César as "refez em tijolo" (confiança **baixa**, não confirmado).
- **Metas e contadores:** metas e *ova* (ovos para contar as voltas) desde 174 a.C. (Lív. 41.27.6). Em 46 a.C. as metas foram **retiradas** para a batalha (Suet. *Iul.* 39.3). **[HIPÓTESE]** Na fase cesariana as metas seriam removíveis ou leves, porque puderam ser tiradas para um espetáculo.
- **Euripus:** na época de César, o termo designa o **fosso com água em volta da arena** (Plín. *NH* 8.21; Suet. *Iul.* 39.2; Dion. 3.68.2), não a barreira central. Platner registra que mais tarde *euripus* também designou a barreira central inteira (*spina*), uso imperial (resumo de busca).
  - **Barreira central em 46 a.C.:** NÃO ENCONTRADO. Sabe-se que existiam metas e *ova* desde 174 a.C.
- **Arquibancadas (estado c. 8 a.C.):** "atrás do euripus foram construídas **stoas de três andares** (*τρίστεγοι*); as do térreo têm **assentos de pedra** que sobem pouco a pouco, como nos teatros, e as superiores, **assentos de madeira**" (Dion. 3.68.2–3, conferido). Para 46 a.C., Plínio diz só que o circo foi *exstructum* por César; a divisão pedra/madeira **não está atestada para 46 a.C.**
- **Pórtico externo de lojas (c. 8 a.C.):** "do lado de fora do hipódromo há outra stoa de **um andar** com **lojas (*ἐργαστήρια*)** e **moradias por cima**; junto a cada loja há **entradas e escadas** para os espectadores, de modo que tantas dezenas de milhares possam entrar e sair sem tumulto" (Dion. 3.68.4, conferido). Em 64 d.C. ainda havia lojas com mercadorias inflamáveis na extremidade junto ao Palatino e ao Célio (Tác. *Ann.* 15.38, conferido).
- **Monumentos dentro do circo (republicanos):**
  - **arco de Stertínio** (196 a.C.) com estátuas douradas (Lív. 33.27.4);
  - **estátuas sobre colunas** (derrubadas em 182 a.C.; Lív. 40.2.2).
- **Templos que davam para o circo:**
  - **Ceres** (com Líber e Líbera), na encosta do Aventino, dedicado em 494/3 a.C. (Pleiades 581361483). Plínio diz que Damófilo e Gorgaso o decoraram com terracotas e pinturas, com inscrição grega (*NH* 35.154, conferido).
  - **Mercúrio**, na encosta do Aventino "olhando para o Circo" (Pleiades 107133090; *"templa tibi posuere patres spectantia Circum"*, Ov. *Fast.* 5.669, conferido).
  - **Summanus**, perto do circo, da época da guerra com Pirro (Pleiades 408534259).
  - **Hércules Pompeiano**, *aedes Pompei Magni apud circum maximum*, com um Hércules de Míron (Plín. *NH* 34.57, conferido; Vitr. 3.3.5).
  - Vitrúvio (escrevendo c. 25 a.C.) usa os templos **de Ceres e de Hércules Pompeiano "junto ao Circo Máximo"** como exemplo de **templos areostilos**: colunas muito espaçadas, epistílio de **vigas de madeira** (não de pedra), aspecto "baixo, largo, de cabeça pesada", e frontões ornados com **estátuas de terracota ou de bronze dourado à maneira toscana** (Vitr. 3.3.5, conferido: *"ornanturque signis fictilibus aut aereis inauratis earum fastigia tuscanico more, uti est ad Circum Maximum Cereris et Herculis Pompeiani"*).
- **Santuários de Múrcia e de Conso:**
  - **Ara Consi** no sopé do Palatino, na linha do pomério (Tác. *Ann.* 12.24).
  - Rômulo instituiu as **Consuália**, jogos a Netuno Equestre (Lív. 1.9.6, conferido).
  - Forma e posição exata do altar de Conso (subterrâneo?) e do santuário de Múrcia: **NÃO ENCONTRADO** nas fontes consultadas.

### Materiais e acabamentos

- Lado de baixo das arquibancadas em **pedra**, andares superiores em **madeira** (Dion. 3.68.2–3, estado augustano).
- Grades de **ferro** em volta da arena em 55 a.C., antes do euripus (Plín. *NH* 8.20). Gaiolas de ferro (*caveae ferreae*) em 174 a.C. (Lív. 41.27.6).
- Pedras disponíveis em Roma, segundo Vitrúvio (2.7.1–5, conferido): as "moles" perto da cidade (**Rubrae**, **Pallenses**, **Fidenates**, **Albanae**), que se desfazem ao ar livre com gelo e salitre; as "temperadas" (**Tiburtinae**, isto é, travertino, além de Amiterninae e Soractinae), que suportam carga e intempérie mas estalam no fogo; e as "duras" (**siliceae**).
- **[HIPÓTESE]** Para 46 a.C.: muros e pódio das arquibancadas baixas em tufo local (Rubrae/Fidenates) e travertino nas partes portantes, com o restante em madeira. Pedra exata das obras de César: **NÃO ENCONTRADO**.
- Templos vizinhos (Ceres, Hércules Pompeiano): **madeira** no epistílio e **terracota** ou **bronze dourado** nas estátuas do frontão (Vitr. 3.3.5). A terracota pintada de Damófilo e Gorgaso estava em Ceres (Plín. *NH* 35.154).

### Detalhes de ambientação

- **Corridas:** quadrigas, bigas e **desultores** (cavaleiros que saltam de um cavalo para outro), conduzidos por jovens nobres nos jogos de 46 a.C. (Suet. *Iul.* 39.2).
- **Jogo de Troia** (meninos a cavalo em duas turmas, Suet. *Iul.* 39.2).
- **Caçadas** de 5 dias e batalhas com **elefantes com torres** (Plín. *NH* 8.22; Suet. *Iul.* 39.3). Em 55 a.C., Plínio conta que o público se levantou em lágrimas e amaldiçoou Pompeu ao ouvir o lamento dos elefantes (*NH* 8.21).
- **Festas no calendário:** Cereálias com cavalos nas carceres (*"carcere partitos Circus habebit equos"*, Ov. *Fast.* 4.680); *Ludi Romani* ou *Magni* (Lív. 1.35.9); Consuálias (Lív. 1.9.6).
- **Público:** os lugares eram divididos por cúrias na tradição régia (Dion. 3.68.1). Havia lojas e moradias no pórtico externo (Dion. 3.68.4) e comércio de mercadorias inflamáveis (Tác. *Ann.* 15.38).
- **Sons:** cordas da largada (Dion.), rugido do público, água do euripus, elefantes.

### Proposta de modelagem [HIPÓTESE DE MODELAGEM]

- **Implantação:** eixo 126°/306°, centro em (58,9; 731,4) ± 30 m, carceres a ONO, perto de (−190, 550), e curva a ESE, perto de (310, 914).
- **Dimensões externas:** 621 × 118 m (Dionísio).
  - Arena interna ~540 × 80 m (estimativa de divulgação, baixa confiança).
  - Euripus de 2,96 m de largura em volta dos 2 lados longos e da curva.
  - Sobram ~16 m de faixa de arquibancada de cada lado [DERIVADO: (118 − 80)/2 − 3].
- **Cávea:** 3 níveis. O térreo em pedra (tufo com revestimento de estuque) e dois níveis de madeira (andaimes, tábuas), com **pórtico externo de um andar** com lojas e moradias. Isso é tecnicamente o estado c. 8 a.C.; é aceitável como aproximação de 46 a.C., com etiqueta.
- **Carceres:** 12 vãos abobadados num lado reto ou levemente curvo, com cordas.
- **Barreira central:** metas cônicas nas extremidades e *ova* sobre suportes. **Sem obelisco, sem golfinhos.** Painel informativo: "forma da barreira central em 46 a.C. desconhecida".
- **Ambiente:** templos areostilos de Ceres e Hércules Pompeiano com frontões de terracota pintada; o arco de Stertínio com estátuas douradas.

---

## 2. Topografia geral: colinas, vales e cotas

### Estado em 50–44 a.C.

- O Capitólio era "a menor das colinas de Roma e uma das mais importantes": cidadela (*arx*) e sede do templo políade (Pleiades 347036492).
- O Palatino é "a colina central" (Pleiades 971691208).
- A **Velia** era um esporão do lado norte do Palatino em direção ao Opio. **Não existe mais** (Pleiades 157710058).
- O **Opio** é o esporão sul do Esquilino (Pleiades 91325207). Varrão trata o Opio como uma das duas partes do Esquilino (Pleiades, nome "pars oppius").
- O **Císpio** é um esporão do Esquilino entre o Viminal e o Opio (Pleiades 257235581).
- A parte leste do **Esquilino** ficava fora da Muralha Serviana e serviu de **cemitério de pobres** nos períodos arcaico e republicano (Pleiades 679976755).
- O **Viminal** é a menor das "sete colinas" (Pleiades 755385623). O **Quirinal** tem vários cumes menores (Pleiades 125119394).
- O **Aventino** ficou fora do pomério até Cláudio (Pleiades 865014139).
- Sérvio acrescentou o Quirinal e o Viminal e depois ampliou o Esquilino, onde passou a morar (Lív. 1.44.3, conferido; Dion. 4.13.2–3).
- Tarquínio Prisco drenou as partes baixas em volta do Fórum e os "outros vales entre as colinas" com cloacas inclinadas até o Tibre (Lív. 1.38.6, conferido).
- **A cidade nas encostas:** *"Romam in montibus positam et convallibus, cenaculis sublatam atque suspensam"*, isto é, "Roma posta em montes e vales, erguida e suspensa em andares" (Cíc. *Leg. agr.* 2.96, conferido).

### Localização, orientação e relações espaciais (pontos Pleiades/OSM no sistema do jogo)

| Colina / vale | x | z | Fonte | Confiança |
|---|---|---|---|---|
| Capitolinus Mons (geral) | −230,7 | −8,7 | Pleiades 347036492 (OSM, 20 m) | média |
| Templo de Júpiter Ótimo Máximo (Capitolium) | −276,2 | 30,9 | Pleiades 871801169 | baixa (acurácia 2000 m) |
| Arx (Iuno Moneta / Aracoeli) | −150,5 | −161,1 | Pleiades 76518529 | média |
| Rocha Tarpeia (traçado OSM, borda sul do Capitólio) | de (−250, 119) a (−202, 99) | — | Pleiades 928849659 | média |
| Palatinus Mons | 174,8 | 355,5 | Pleiades 971691208 (OSM, 20 m) | média |
| Velia (inexistente) | 389,7 | 183,1 | Pleiades 157710058 | baixa (*rough*) |
| Opio | 956,4 | −101,6 | Pleiades 91325207 | baixa (acurácia 2000 m) |
| Císpio | 848,7 | −442,0 | Pleiades 257235581 | baixa (*rough*) |
| Viminal | 741,1 | −782,3 | Pleiades 755385623 (OSM, 20 m) | média |
| Quirinal | −138,4 | −834,9 | Pleiades 125119394 (GeoNames, 30 m) | média |
| Esquilino (geral) | 1211,0 | −221,0 | Pleiades 679976755 | baixa (*rough*) |
| Aventino (cume) | −138,1 | 1020,5 | Pleiades 865014139 | baixa (acurácia 2000 m) |
| Célio (geral) | 1466,2 | 813,6 | Pleiades 695491849 | baixa (*rough*; o centro do Célio fica bem mais a oeste, ver DEM) |
| Velabro (vale Fórum ↔ Forum Boarium) | −256,9 | 367,4 | Pleiades 432833118 | baixa (acurácia 2000 m) |
| Subura | 94,2 | 80,7 | Pleiades 451696383 | **inútil** (*rough*: é o centro de uma caixa genérica) |

- **Subura:** o termo talvez designasse no início "o vale entre o Opio e o Célio" e correspondia a uma das quatro regiões "servianas". Mais tarde designou a parte da *regio IV* augustana, densa e de má fama, **entre o Esquilino, o Quirinal, o Viminal e o Císpio** (Pleiades 451696383).
- O ***Murus Terreus Carinarum***, terrapleno descrito por Varrão, ficava provavelmente no Opio, **entre a Subura e as Carinas** (Pleiades 987812398).

### Dimensões: cotas e inclinações

> **Cuidado com o DEM.** No Fórum, onde o pavimento republicano está documentado entre **11,8 e 14 m s.n.m.** (Platner e Van Deman, via nota 01), o DEM moderno lê **18–24 m**. Ou seja, nos poços escavados e nas áreas construídas o DEM fica **6–10 m acima** do terreno real ou antigo: ele suaviza 30 m e é afetado por prédios e aterros [DERIVADO, comparação nossa]. Use os valores do DEM **só para a forma relativa** e como **teto** provável dos cumes modernos.

| Elemento | Valor | Unidade | Fonte | Confiança |
|---|---|---|---|---|
| Piso de onde sobem os degraus da Rostra republicana (Comício) | 11,80 | m s.n.m. | Platner, *Comitium* (Heidelberg platner1929/0178), via nota 01 | média |
| Pavimento de travertino diante da Cúria (Fausto Sula, pós-52 a.C.) | 12,63 | m s.n.m. | idem | média |
| Pavimento de mármore de Luni (nível do Comício de César) | 13,50 | m s.n.m. | idem | média |
| Pavimento "silano" de travertino no eixo do Fórum | 12,50–14 | m s.n.m. | Van Deman, *JRS* 1922, via nota 01 | média |
| **Nível do Fórum adotado (y = 0)** | **≈ 13 ± 0,7** | m s.n.m. | [DERIVADO da faixa acima] | média |
| Cume norte do Capitólio (Arx/Aracoeli) | 39 | m acima do nível médio do Tibre | ancientromelive/Platner, via nota 01 | média (datum = Tibre) |
| Cume sul (Capitolium) | 38 | m acima do Tibre | idem | média |
| Sela (Piazza del Campidoglio) | 30 | m acima do Tibre | idem | média |
| A sela atual está acima do nível antigo em | ~8 | m | Musei Capitolini, via nota 01 | média |
| DEM: cume sul do Capitólio | 46,7 em (−221, 11) | m (moderno) | DEM Terrarium [DERIVADO] | baixa |
| DEM: Arx/Aracoeli | 53,0 em (−145, −176) | m (moderno) | idem | baixa (vizinho de grandes edifícios modernos) |
| DEM: sela capitolina | 46,3 em (−185, −40) | m (moderno) | idem | baixa |
| DEM: Palatino (máximo) | 51,9 em (200, 370) | m (moderno) | idem | baixa |
| DEM: Palatino oeste (Germalo?) | 48,5 em (95, 380) | m (moderno) | idem | baixa (divisão Germalo/Palatium: NÃO ENCONTRADO) |
| DEM: Aventino | 52,4 em (−445, 970) | m (moderno) | idem | baixa |
| DEM: Pequeno Aventino (S. Balbina) | 50,4 em (242, 1367) | m (moderno) | idem | baixa |
| DEM: Célio | 56,6 em (705, 565) | m (moderno) | idem | baixa |
| DEM: Opio | 65,3 em (1186, −197) | m (moderno) | idem | baixa |
| DEM: Císpio | 68,5 em (1049, −442) | m (moderno) | idem | baixa |
| DEM: Esquilino (S. Maria Maggiore) | 72,1 em (1260, −606) | m (moderno) | idem | baixa |
| DEM: Viminal | 72,1 em (701, −727) | m (moderno) | idem | baixa |
| DEM: Quirinal | 56,7 em (162, −825) | m (moderno) | idem | baixa |
| DEM: fundo do vale do Circo | 21,5–25,4 | m (moderno) | idem | baixa; cota antiga da arena: NÃO ENCONTRADO |
| DEM: Forum Boarium / Templo de Portuno / Hércules | 18,4 / 18,9 / 18,4 | m (moderno) | idem | baixa; cota antiga: NÃO ENCONTRADO |
| DEM: espelho/margem do Tibre perto da Ilha | 7,3–10,2 | m (moderno) | idem | baixa; nível antigo: NÃO ENCONTRADO |
| DEM: vale da Subura (eixo Argileto → Via Cavour) | 31–41 (sobe para NE) | m (moderno) | idem | baixa; cota antiga: NÃO ENCONTRADO |
| DEM: Campo de Marte (Panteão) | 29,4 | m (moderno) | idem | baixa (muito aterrado) |
| Inclinação média Palatino → fundo do Circo | ≈ 12 | % | DEM, perfil (200, 370) → (−90, 1050) [DERIVADO] | baixa (o DEM suaviza; as encostas reais são mais íngremes) |
| Inclinação média fundo do Circo → Aventino | ≈ 7 | % | idem | baixa |
| Inclinação média Fórum → Capitólio (sul) | ≈ 11 | % | DEM, perfil (0, 0) → (−260, 30) [DERIVADO] | baixa |
| Inclinação média Fórum → Subura (pelo Argileto) | ≈ 8 | % | DEM, perfil (20, 0) → (600, −330) [DERIVADO] | baixa |
| Cotas antigas (republicanas) dos cumes, do vale do Circo, da Subura e do Tibre | **NÃO ENCONTRADO** | — | — | — |

**Perfis do DEM (m, modernos, 15 amostras igualmente espaçadas) [DERIVADO]:**
- Palatino (200, 370) → Circo → Aventino (−90, 1050): 51,9 · 49,8 · 47,9 · 45,5 · 39,4 · 31,5 · 26,3 · **25,0** · 26,3 · 30,5 · 35,7 · 40,8 · 44,6 · 46,0 · 47,2
- Eixo do Circo (−200, 520) → (330, 950): 27,0 · 25,8 · 23,7 · 23,7 · 23,4 · 24,4 · 25,5 · 24,3 · 23,3 · 23,1 · 23,1 · 22,3 · 22,6 · 23,9 · 26,4 (praticamente plano, levemente descendo para ESE)
- Fórum Iulium (12, −133) → trecho da muralha em S. Eufemia (−24, −420), 9 amostras: 23,4 · 24,9 · 25,2 · 25,4 · 26,2 · 27,8 · 32,1 · 37,0 · 40,1 (subida para a sela Capitólio–Quirinal)

### Planta e elementos (relações espaciais)

- **Capitólio:** dois cumes, Arx ao norte e Capitolium ao sul, com uma sela entre eles. O lado sul termina na **Rocha Tarpeia** (traçado OSM acima). O **Clivus Capitolinus** sobe do Fórum (ver nota 01).
  - Os gauleses subiram "junto à pedra de Carmentis" (*ad Carmentis saxum*) por uma subida mais fácil (Lív. 5.47.2, conferido). Havia, portanto, um ponto escalável perto da Porta Carmental.
- **Palatino:** Escadas de Caco no canto sudoeste, descendo para o vale do Circo (Pleiades 606719480).
  - O **Clivus Victoriae** é uma rua íngreme no canto sudoeste (ou perto dele) (Pleiades 668537796).
  - A **Porta Mugonia**, porta da "Roma quadrata" no lado norte, tem posição debatida (Pleiades 547584100).
  - O **Templo da Magna Mater** foi dedicado perto do Clivus Victoriae em 11 de abril de 191 a.C. e destruído por incêndio em 111 a.C. (Pleiades 192818177). Estado em 50–44 a.C.: provavelmente reconstruído; detalhe: NÃO ENCONTRADO.
  - A **Casa de Lívia** é uma domus com fases republicana e imperial (Pleiades 904782880).
- **Velia:** esporão que ligava o Palatino ao Opio, fechando o Fórum a leste (Pleiades). Forma e cota: NÃO ENCONTRADO.
- **Vale do Circo (*Murcia*):** entre o Palatino e o Aventino (Lív. 1.33.5; Dion. 3.68.1).

### Materiais e acabamentos (geologia aparente)

- Vitrúvio lista as pedras locais (2.7.1–5): tufos moles das pedreiras "**Rubrae**" e "**Pallenses**", que são as "mais próximas da cidade" (2.7.5), além de Fidenates e Albanae, travertino (Tiburtinae) e *silex*. Recomenda extrair a pedra no verão e deixá-la **dois anos** ao relento antes de usá-la; as pedras que se degradam vão para as fundações (2.7.5).
- No pódio arcaico do Templo de Saturno e na fundação da Rostra republicana aparece o ***cappellaccio*** (tufo cinzento local), segundo as notas 01 e 02.
- **[HIPÓTESE]** Encostas com afloramentos de tufo amarelado/acinzentado e vegetação; cortes de rocha visíveis junto ao Capitólio (Rocha Tarpeia).

### Detalhes de ambientação

- Casas trepando pelas encostas, muitos andares (Cíc. *Leg. agr.* 2.96; Vitr. 2.8.17).
- Desabamentos, incêndios e revendas com demolição e reconstrução **contínuas** (Str. 5.3.7, conferido).
- Enchentes nas partes planas (Lív. 35.9.2; 38.28.4).

### Proposta de modelagem [HIPÓTESE DE MODELAGEM]

- Usar o **DEM moderno só como molde da forma**, corrigindo assim:
  1. pôr o Fórum em **y = 0 (≈ 13 m s.n.m.)**;
  2. rebaixar os vales planos (Circo, Velabro, Forum Boarium, Subura) para algo em torno de y ≈ 0 a +5 no Velabro e no Forum Boarium e y ≈ +5 a +15 na Subura, marcando como hipótese, porque a cota antiga não foi encontrada;
  3. manter os cumes com **desnível de ~30–40 m** sobre o Fórum (Palatino e Capitólio: o DEM dá ~47–53 m modernos; a nota 01 dá 38–39 m acima do Tibre para o Capitólio).
- Encostas do Palatino e do Capitólio **mais íngremes** que no DEM (12% é média suavizada), com paredões de tufo no Capitólio sul.

---

## 3. Muralha Serviana e portas

### Estado em 50–44 a.C.

- **Existente, mas engolida pela cidade:**
  - Lívio explica o pomério como faixa que proibia "que edifícios se juntassem às muralhas pelo lado de dentro, **o que agora geralmente fazem**" (*quae nunc vulgo etiam coniungunt*) (1.44.4, conferido).
  - Dionísio diz que a muralha "é difícil de encontrar por causa das casas que a cercam por muitos lados, mas **conserva traços em muitos lugares**" (4.13.5, conferido).
  - Plínio: a cidade é fechada a leste pelo ***agger* de Tarquínio Soberbo**, da altura das muralhas onde o acesso era plano; no resto, por muralhas altíssimas ou montes escarpados, "**exceto que as casas, espalhando-se, acrescentaram muitas cidades**" (*NH* 3.67, conferido).
- **Construção/reconstrução:** em 378 a.C. os censores contrataram uma muralha "de **pedra quadrada**" (*murum … saxo quadrato faciundum*) (Lív. 6.32.1, conferido). A tradição atribui a Sérvio o *agger*, os fossos e a muralha (Lív. 1.44.4).

### Localização / traçado perto da área do jogo

**Trechos preservados (traçados OSM no Pleiades 103808101, convertidos):**

| Trecho | Coordenadas (x, z) | Comentário | Confiança |
|---|---|---|---|
| Via di S. Eufemia | (−13,6; −405,0) → (−34,4; −435,9) → (−33,8; −438,3) → (−15,6; −437,1) | Sela entre o Capitólio e o Quirinal, **~270–300 m ao norte do Fórum de César** [DERIVADO] | média (OSM 20 m) |
| Via Nazionale / Largo Magnanapoli | (145,0; −440,3) → (151,5; −438,4) | Mesmo setor, encosta do Quirinal; segmento de rumo ~106° | média |
| Via di Sant'Anselmo (Aventino), I | contorno entre (−191; 1358) e (−150; 1371) | Lado oeste do Aventino | média |
| Via di Sant'Anselmo, II | contorno entre (−245; 1342) e (−217; 1353) | idem | média |
| Via Mecenate 35a (Esquilino) | contorno em torno de (1287; −28) | setor do Esquilino | média |
| Largo Leopardi | ponto (1356,9; −152,0) | Esquilino | média |
| Via Carlo Alberto | ponto (1361,6; −397,1) | Esquilino, perto da Porta Esquilina | média |

**Portas:**

| Porta | Posição | Fonte | Confiança | Notas |
|---|---|---|---|---|
| **Carmentalis** | Ao pé do Capitólio, perto do Vicus Iugarius. Os templos de Fortuna e Mater Matuta ficam **"dentro da Porta Carmental"** (Lív. 25.7.6). O incêndio de 213 a.C. arrasou tudo "entre as Salinas e a Porta Carmental, com o Equimélio e o **Vicus Iugarius**" (Lív. 24.47.15). **[DERIVADO]** Logo a oeste ou sudoeste da área sacra de S. Omobono (centroide OSM −306; 212), por volta de x ≈ −330 a −360, z ≈ 170–200 | Lívio (conferido); Pleiades 103123065 | média para a relação; baixa para as coordenadas | Tinha mais de um vão: os Fábios saíram "pelo **arco da direita** (*dextro Iano*) da Porta Carmental", caminho de mau agouro (Lív. 2.49.8) |
| **Fontinalis** | No Campo de Marte, a oeste da Via Lata. Talvez fosse a origem das vias Flamínia e Salária (Pleiades 54214303, *rough*). Em 193 a.C. fez-se um pórtico "da Porta Fontinal até o altar de Marte, por onde se ia ao Campo" (Lív. 35.10.12) | Pleiades; Lívio (conferido) | baixa | O ponto Pleiades (588; −196) é uma caixa genérica e **não serve** |
| **Ratumena** | Nome do auriga veiense Ratumena, cujos cavalos correram até o Capitólio (Plín. *NH* 8.161, conferido) | Plínio | — | **Posição: NÃO ENCONTRADO** |
| **Capena** | Na encosta sudoeste do Célio (Pleiades 27164982). Em 296 a.C. pavimentou-se uma senda "de pedra quadrada da Porta Capena ao templo de Marte" (Lív. 10.23.12); em 189 a.C., uma via de *silex* da Porta Capena até Marte (Lív. 38.28.3) | Pleiades; Lívio (conferido) | baixa para o ponto (497,2; 946,2), acurácia 2000 m | Fica além da extremidade leste do Circo |
| **Esquilina** | No **Arco de Galieno** (262 d.C.), que marcava a Porta Esquilina; dela saíam as vias Labicana e Tiburtina | Pleiades 29110684 | alta para o local: (1355,4; −364,8), OSM 20 m | O arco é anacrônico; a porta, não |
| **Collina** | No Quirinal, onde se separavam a Via Salária e a Nomentana; restos achados em 1872 sob o Ministério das Finanças | Pleiades 268637493 | média: (1133,5; −1650,3) | Fora da área do jogo |
| **Viminalis** | "Sob o meio do *agger*" entre a Collina e a Esquilina | Str. 5.3.7 (conferido) | — | Posição: NÃO ENCONTRADO |
| **Caelimontana** | O traçado OSM rotulado "Porta Caelimontana" está ligado ao Arco de Dolabela e Silano: contorno em (839–848; 763–772) | Pleiades 159953179 | média | Atingida por raio em 193 a.C. (Lív. 35.9.3) |
| **Trigemina** | Perto do Tibre e do *emporium* (Lív. 35.10.12; 41.27.8) | Pleiades 303638861 (*rough*: −858,5; 1131,5) | baixa | |
| **Flumentana** | "Porta do rio", talvez perto da Pons Aemilius; local muito debatido (Pleiades 502889801). Houve desabamentos perto dela na enchente de 193 a.C. (Lív. 35.9.3) | Pleiades; Lívio | baixa | Posição: NÃO ENCONTRADO |
| **Naevia** | Pequeno Aventino (Pleiades 37637607) | Pleiades | média: (380,9; 1508,6) | Fora da área |

### Dimensões

| Elemento | Valor | Unidade | Fonte | Confiança |
|---|---|---|---|---|
| *Agger*: fosso, largura mínima | > 100 pés (> 29,6 m [DERIVADO]) | — | Dion. 9.68.3 (conferido) | alta (texto) |
| *Agger*: fosso, profundidade | 30 pés (≈ 8,9 m [DERIVADO]) | — | idem | alta (texto) |
| *Agger*: comprimento | ~7 estádios (≈ 1,24 km [DERIVADO]) | — | Dion. 9.68.4 (conferido) | alta (texto) |
| *Agger*: comprimento (divergente) | ~6 estádios (≈ 1,06 km [DERIVADO]), "da Porta Collina à Esquilina", com muralha e **torres** | — | Str. 5.3.7 (conferido) | alta (texto); **diverge** de Dionísio |
| *Agger*: largura do "lugar" (terrapleno) | 50 pés (≈ 14,8 m [DERIVADO]) | — | Dion. 9.68.4 (conferido) | alta (texto) |
| Circuito da cidade antiga | "não muito maior que o de Atenas" | — | Dion. 4.13.5; 9.68.2 (conferido) | alta (texto) |
| Altura da muralha | **NÃO ENCONTRADO** | — | — | — |
| Espessura da muralha | **NÃO ENCONTRADO** | — | — | — |
| Tamanho dos blocos | **NÃO ENCONTRADO** (só *saxum quadratum*) | — | Lív. 6.32.1 | — |

### Planta e elementos arquitetônicos

- Muralha de **blocos quadrados**. No lado plano do Esquilino há **fosso + terrapleno interno alto e largo + muralha**, "que nem aríetes nem minas podem derrubar" (Dion. 9.68.3). No *agger* há **torres** (Str. 5.3.7).
- Nas partes altas, as falésias naturais servem de defesa (Dion. 9.68.2; Plín. *NH* 3.67).
- As portas podiam ter **mais de um vão** (Porta Carmental, Lív. 2.49.8).

### Materiais e acabamentos

- *Saxum quadratum* (Lív. 6.32.1). O **tufo de Grotta Oscura** é o "tufo giallo della via Tiberina" (OxREP, via nota 01), mas o seu uso **nesta** muralha **NÃO foi confirmado** nas fontes consultadas.
- **[HIPÓTESE]** Blocos de tufo amarelado em fiadas regulares, com reparos de cor diferente.

### Detalhes de ambientação

- Trechos de muralha **com casas encostadas por dentro e por fora** (Lív. 1.44.4; Dion. 4.13.5).
- Portas sem função militar em 50–44 a.C., servindo de passagem urbana [inferência a partir de Plín. *NH* 3.67 e Dion. 4.13.5].
- Fora da Porta Esquilina, cemitério de pobres (Pleiades 679976755).

### Proposta de modelagem [HIPÓTESE DE MODELAGEM]

- Na área do jogo, modelar a muralha:
  1. ao longo do **Capitólio**, na borda oeste e norte;
  2. cruzando a **sela Capitólio–Quirinal** pelos pontos de S. Eufemia e Magnanapoli, ~270–300 m ao norte do Fórum de César;
  3. com a **Porta Carmental**, de dois vãos, ao pé do Capitólio, a sudoeste, junto a S. Omobono e ao Vicus Iugarius;
  4. com a **Porta Fontinal** a norte ou noroeste do Capitólio, a caminho do Campo de Marte.
- Altura de ~8–10 m (valor **não atestado**), com casas encostadas e trechos semienterrados.

---

## 4. Ruas principais e pavimentação

### Estado em 50–44 a.C.

- **Pavimentação:** em 174 a.C. os censores "foram os primeiros de todos a contratar a **pavimentação das vias da cidade com *silex*** e, fora da cidade, o seu leito e margens com cascalho (*glarea*)" (Lív. 41.27.5, conferido: *"censores vias sternendas silice in urbe, glarea extra urbem substruendas marginandasque primi omnium locaverunt"*).
  - O Clivus Capitolinus foi pavimentado com *silex* no mesmo ano (Lív. 41.27.6; ver nota 01).
  - Antes disso: senda de **pedra quadrada** da Porta Capena a Marte (296 a.C., Lív. 10.23.12) e via de *silex* (189 a.C., Lív. 38.28.3). Em 184 a.C., *lacus* (fontes) revestidos de pedra e cloacas limpas ou novas no Aventino e em outras partes (Lív. 39.44.5).
  - Vitrúvio classifica o *silex* como pedra "dura" (2.7.1).
- **Caráter das ruas:** *"non optimis viis, angustissimis semitis"* (Cíc. *Leg. agr.* 2.96, 63 a.C., conferido). Tácito, sobre a Roma anterior a 64 d.C.: *"artis itineribus hucque et illuc flexis atque enormibus vicis, qualis vetus Roma fuit"*, ou seja, ruas estreitas, tortuosas e irregulares (*Ann.* 15.38, conferido).
- **Prédios altos junto às ruas:** a cidade cresceu em altura com pilares de pedra, alvenaria de tijolo cozido e paredes de concreto, com muitos pavimentos (Vitr. 2.8.17, conferido). As "leis públicas" proibiam paredes-meias com mais de **1,5 pé** de espessura (idem). O limite de 70 pés de altura junto às vias públicas é de **Augusto**, portanto posterior (Str. 5.3.7).

### Localização e traçados (Pleiades/OSM, convertidos) [comprimentos e rumos DERIVADOS]

| Rua | Descrição (fonte) | Traçado no jogo (x, z) | Comprimento / rumo | Confiança |
|---|---|---|---|---|
| **Vicus Tuscus** | Do Fórum para o sudoeste, até o Forum Boarium, "colado ao flanco oeste do Palatino e passando pelo Velabro" (Pleiades 380281017) | (46,2; 54,8) → (20,4; 109,7) → (14,7; 123,3) | 75 m traçados; rumo ≈ 205° (SSO) saindo do Fórum | média (só o trecho inicial está traçado) |
| **Vicus Iugarius** | Do Fórum à **Porta Carmental** (Pleiades 889101791). Entrava no Fórum entre o Templo de Saturno e a Basílica Semprônia/Júlia (nota 01) | Traçado OSM: (−66,2; 80,4) → (−47,4; 79,0) → (−13,7; 94,1) → (20,4; 109,7) | 94 m; rumo ≈ 109° (de oeste para leste) | baixa. **Divergência:** o Pleiades diz "entre a Basílica Júlia e o Templo dos Castores", o que parece descrever o Vicus Tuscus; o traçado OSM corre pelo lado sul/sudoeste da Basílica Júlia. Usar a nota 01 para a boca da rua |
| **Argiletum** | Do Fórum, atravessando a Subura (Pleiades 451243813); boca entre a Cúria e a Basílica Emília (nota 02) | (17,7; −11,8) → (21,0; −18,4) → (32,2; −30,3) → (56,1; −50,7) | 55 m; rumo ≈ 45° (NE) | média |
| **Clivus Suburanus** | Subia do Opio e do Císpio até a **Porta Esquilina**; aproximam parte do percurso a via in Selci, a via di San Martino e a via di S. Vito (Pleiades 821658053) | ponto genérico (1160; −305) | — | baixa (*rough*) |
| **Vicus Patricius** | Atravessava o Císpio e o Viminal até a Porta Viminal, direta ou indiretamente; seu curso seria semelhante ao da atual Via Urbana (Pleiades 166272189) | Via Urbana: (664,2; −276,6) → (697,8; −335,2) → (787,8; −471,3) → (819,9; −520,0) | 289 m; rumo ≈ 33° (NNE) | média |
| **Clivus Victoriae** | Rua íngreme no canto sudoeste do Palatino ou perto dele (Pleiades 668537796) | (81,0; 166,7) → (52,8; 192,7) → (20,7; 222,1) → (2,9; 236,5) | 105 m; rumo ≈ 228° (SO) | média (é o traçado visível hoje, de fase incerta) |
| **Clivus Capitolinus** | ver nota 01 | (−45,7; −7,3) → … → (−148,0; 57,9) | 140 m; rumo ≈ 237° | média |
| **Clivus Scauri** | Subia da depressão entre o Palatino e o Célio (Pleiades 267702571) | (564,0; 687,2) → (466,9; 674,4) | 98 m; rumo ≈ 278° | média |
| **Via Nova** | — | — | — | **NÃO ENCONTRADO** (traçado e largura) |
| **Clivus Publicius** | Subida do Forum Boarium ao Aventino (templo de Juno Rainha) no percurso da procissão de 207 a.C. (Lív. 27.37.15) | — | — | traçado: NÃO ENCONTRADO |

- **Percurso processional atestado (207 a.C.):** do Fórum "pelo **Vicus Tuscus** e pelo **Velabro**, através do **Forum Boarium**, até o **Clivus Publicius** e o templo de Juno Rainha" (Lív. 27.37.15, conferido). Na *pompa circensis*, o Velabro levava ao Circo (Ov. *Fast.* 6.405).

### Dimensões

| Elemento | Valor | Unidade | Fonte | Confiança |
|---|---|---|---|---|
| Larguras do Vicus Tuscus, Vicus Iugarius, Argiletum, Clivus Suburanus, Vicus Patricius, Via Nova e Clivus Victoriae | **NÃO ENCONTRADO** | — | — | — |
| Largura do Vicus Iugarius (comparação) | "muito mais estreita do que no fragmento renascentista da Forma Urbis" | — | Stanford FUR, via nota 01 | — |
| Espessura máxima de parede-meia por lei | 1,5 | pé (≈ 0,44 m [DERIVADO]) | Vitr. 2.8.17 (conferido) | alta |
| Limite de altura junto a vias públicas | 70 pés (≈ 20,7 m [DERIVADO]); **augustano, não vale em 50–44 a.C.** | — | Str. 5.3.7 (conferido) | alta (texto) |

### Planta e elementos

- Ruas de **lajes poligonais de *silex*** (lava basáltica, segundo a nota 01) nas vias urbanas desde 174 a.C. (Lív. 41.27.5). Em 174 a.C. também se pavimentou de pedra o *emporium* fora da Porta Trigemina, com escadas descendo ao Tibre (Lív. 41.27.8).
- Calçadas, meio-fios e pedras de travessia: NÃO ENCONTRADO nas fontes consultadas.
- Os esgotos eram **abobadados** com pedras bem ajustadas, alguns largos o bastante para deixar passar **carroças de feno** (Str. 5.3.8, conferido; Plín. *NH* 36.108, conferido: *"ut vehem faeni large onustam transmitteret"*).

### Materiais e acabamentos

- *Silex* nas ruas; *glarea* (cascalho) fora da cidade (Lív. 41.27.5).
- Fachadas: pilares de pedra, tijolo, concreto e madeira nos pavimentos (Vitr. 2.8.17).

### Detalhes de ambientação

- **Vicus Tuscus:** "no Vicus Tuscus estão os homens que se vendem a si mesmos" (Plaut. *Curc.* 482 [4.1], conferido: *"in Tusco vico, ibi sunt homines qui ipsi sese venditant"*). Horácio, nos anos 30 a.C., chama de "**a turba ímpia do Vicus Tuscus**" os fornecedores que acorrem à casa de um herdeiro pródigo: pescador, fruteiro, passarinheiro, perfumista, salsicheiro (*Sat.* 2.3.226–229, conferido: *"piscator uti, pomarius, auceps, unguentarius ac Tusci turba impia vici"*).
- **Fórum (Plauto, mesmo trecho):**
  - perjuros no Comício;
  - mentirosos e fanfarrões junto ao santuário de Cloacina;
  - maridos ricos e gastadores sob a basílica;
  - homens de bem e ricos no Fórum baixo (*in foro infimo*);
  - exibidos "no meio, junto ao canal";
  - maledicentes acima do *lacus*;
  - agiotas sob as *tabernae veteres*;
  - gente em quem não se deve confiar atrás do templo de Castor (Plaut. *Curc.* 470–481).
  
  Útil para os diálogos dos NPCs; vale com a ressalva de que é uma comédia do início do séc. II a.C.
- **Argileto:** ver nota 02 (aluguéis de Cícero; cuidado com a fama de livreiros, que vem de Marcial).

---

## 5. Velabro e Forum Boarium

### Estado em 50–44 a.C.

- **Forum Boarium:** "o chamado mercado de gado, área-chave de atividade comercial e ritual na margem leste do Tibre", flanqueado pelo Capitólio, pelo Palatino e pelo Aventino (Pleiades 207271756). O **Velabro** é o vale que liga o Fórum Romano ao Forum Boarium (Pleiades 432833118).
- **Templo de Portuno:** "templo **tetrastilo** dedicado a Portuno, datado do fim do séc. II ou início do séc. I a.C." (Pleiades 494660670). **Existente.**
- **Templo de Hércules Vencedor (redondo):** "construído no fim do séc. II a.C., talvez por L. Múmio Acaico" (Pleiades 825969667). **Existente.**
  - O Pleiades o chama de "monopteros", termo que talvez não seja exato; a planta exata (cella circular com peristilo?) não foi conferida aqui.
  - Lívio já fala de um "**templo redondo de Hércules**" no Forum Boarium em **296 a.C.**, junto ao *sacellum Pudicitiae Patriciae* (10.23.3, conferido). Pode ser um antecessor; a relação entre os dois: NÃO ENCONTRADO.
- **Ara Máxima de Hércules:** "antigo centro de culto ligado a Héracles, no Forum Boarium" (Pleiades 207271757). O sulco do pomério de Rômulo começou no Forum Boarium, "onde vemos a estátua de bronze de um touro", de modo a **abraçar a grande ara de Hércules** (Tác. *Ann.* 12.24, conferido).
- **Fortuna e Mater Matuta:** templos "dentro da Porta Carmental", reconstruídos em 212 a.C. depois do incêndio de 213 a.C. (Lív. 25.7.6; 24.47.15, conferidos). Diante deles, **dois arcos de L. Stertínio** (196 a.C.) com **estátuas douradas** (Lív. 33.27.4, conferido). Área sacra de S. Omobono (Pleiades 103123065).
- **Touro de bronze:** Tácito o vê no seu tempo (*aspicimus*, *Ann.* 12.24). Ovídio diz que a praça "tem o nome do touro ali posto" (*"area, quae posito de bove nomen habet"*, *Fast.* 6.478). **Se já existia em 44 a.C.: NÃO ENCONTRADO.**

### Localização e orientação

| Elemento | x | z | Fonte | Confiança |
|---|---|---|---|---|
| Forum Boarium (ponto) | −340,0 | 405,2 | Pleiades 207271756 | média |
| Forum Boarium (contorno OSM moderno) | caixa x −375…−305, z 335…477; retângulo mínimo **140 × 63 m**, eixo 163°/343° | — | Pleiades OSM [DERIVADO] | média (praça moderna) |
| Templo de Portuno (centroide OSM) | −341,6 | 354,5 | Pleiades OSM [DERIVADO] | alta |
| Templo de Hércules Vencedor (centroide OSM) | −349,6 | 418,5 | Pleiades OSM [DERIVADO] | alta |
| Ara Máxima | −306,8 | 448,4 | Pleiades 207271757 | baixa (*rough*) |
| Área sacra de S. Omobono (Fortuna e Mater Matuta), centroide OSM | −306,1 | 212,0 | Pleiades OSM [DERIVADO] | alta |
| Velabro | −256,9 | 367,4 | Pleiades 432833118 | baixa |
| Saída da Cloaca Máxima no Tibre | −394,7 | 408,1 | Pleiades 867802692 | média |

- O Forum Boarium fica entre o Tibre (a oeste) e a extremidade das carceres do Circo (a leste e sudeste) [DERIVADO das coordenadas], "junto às pontes e ao Circo" (Ov. *Fast.* 6.477).
- Orientação das fachadas de Portuno e Hércules: **NÃO ENCONTRADO**. O eixo longo da planta de Portuno no OSM é 163°/343° [DERIVADO]; o lado da fachada não foi verificado.

### Dimensões

| Elemento | Valor | Unidade | Fonte | Confiança |
|---|---|---|---|---|
| Templo de Portuno: retângulo mínimo da planta OSM | 23,3 × 11,6 | m | Pleiades OSM [DERIVADO] | média (contorno moderno do monumento; pode incluir a escada) |
| Templo de Portuno: área da planta | ≈ 257 | m² | idem | média |
| Templo de Portuno: colunas na fachada | 4 (tetrastilo) | — | Pleiades | alta |
| Templo de Portuno: ordem, colunas laterais, altura do pódio | **NÃO ENCONTRADO** | — | — | — |
| Templo de Hércules: diâmetro da planta OSM | ≈ 18,4–19,2 | m | Pleiades OSM [DERIVADO] | média (pode incluir os degraus) |
| Templo de Hércules: nº de colunas, altura, material | **NÃO ENCONTRADO** | — | — | — |
| Área sacra de S. Omobono (contorno OSM) | 80 × 52 | m | Pleiades OSM [DERIVADO] | média |
| Prédios de vários andares no Forum Boarium (prodígio de 218 a.C.: um boi subiu ao **terceiro andar**) | ≥ 3 | pavimentos | Lív. 21.62.3 (conferido) | alta (texto) |

### Planta e elementos arquitetônicos

- **Portuno:** templo retangular, tetrastilo (Pleiades). Demais elementos: NÃO ENCONTRADO.
- **Hércules Vencedor:** templo circular (Pleiades; Lív. 10.23.3 para o templo redondo anterior).
- **Arcos de Stertínio:** dois *fornices* com estátuas douradas diante de Fortuna e Mater Matuta (Lív. 33.27.4).
- ***Emporium*** fora da Porta Trigemina, rio abaixo (fora da área imediata): pavimentado de pedra, cercado com estacas, com **escadas do Tibre até o *emporium*** (174 a.C., Lív. 41.27.8). Pórticos ligados a ele: Lív. 35.10.12 e 35.41.10 (*porticum extra portam Trigeminam inter lignarios*, com comércio de madeira).

### Materiais e acabamentos

- **Mármore do Templo de Hércules Vencedor: NÃO CONFIRMADO** nas fontes consultadas; precisa de verificação antes de modelar (o escopo pressupõe mármore).
- Materiais do Templo de Portuno: NÃO ENCONTRADO.

### Detalhes de ambientação

- **Velabro:** "no Velabro, o padeiro, o açougueiro, o arúspice" (Plaut. *Curc.* 483, conferido: *"in Velabro vel pistorem vel lanium vel haruspicem"*). Horácio inclui o **Velabro** com "**todo o mercado** (*omne macellum*)" entre os fornecedores (*Sat.* 2.3.229, conferido).
- **Forum Boarium:** gado, comércio do porto. Prédios de vários andares (Lív. 21.62.3). Enchentes frequentes nas partes planas (Lív. 35.9.2; 38.28.4).
- **Rituais:** culto na Ara Máxima; *sacellum Pudicitiae Patriciae* (Lív. 10.23.3). No Forum Boarium houve sacrifícios humanos extraordinários em 216 a.C., num "lugar cercado de pedra" (Lív. 22.57.6): é um local histórico, mas não recomendamos encená-lo.
- **Procissões:** a *pompa circensis* passava pelo Velabro (Ov. *Fast.* 6.405).

---

## 6. Tibre, Ilha Tiberina, pontes e Cloaca Máxima

### Estado em 50–44 a.C.

- **Tibre:** "largura de cerca de **4 plethra**, profundidade navegável por **grandes navios**, corrente veloz e com **grandes redemoinhos**; não se atravessa a pé senão por ponte, e naquele tempo havia uma só, de madeira, que desmontavam em tempo de guerra" (Dion. 9.68.2, conferido, a respeito do séc. V a.C.).
  - Enchentes: 193 a.C., nas partes planas (Lív. 35.9.2); 192 a.C., o Tibre levou **duas pontes** e muitos edifícios (Lív. 35.21.5); 189 a.C., inundou o Campo de Marte **12 vezes** (Lív. 38.28.4).
- **Pons Sublicius:** a ponte de madeira tradicional, atribuída a Anco Márcio (642 a.C.), atravessava o Tibre **perto do Forum Boarium, logo a jusante da Ilha Tiberina** (Pleiades 286808786). Era **religiosamente construída sem pregos de ferro**, "desde que foi arrancada com dificuldade quando Horácio Cocles a defendia" (Plín. *NH* 36.100, conferido: *"quod item Romae in ponte sublicio religiosum est, posteaquam Coclite Horatio defendente aegre revolsus est"*). **Existente.** Posição exata: NÃO ENCONTRADO (o ponto Pleiades está errado, a 87 km).
- **Pons Aemilius:** em **179 a.C.** o censor M. Fúlvio contratou "**os pilares da ponte** no Tibre, sobre os quais os censores **P. Cipião Africano e L. Múmio** mandaram pôr os **arcos** alguns anos depois" (Lív. 40.51.4, conferido). Esses censores são os de 142 a.C. [data DERIVADA da censura de Múmio, NÃO verificada aqui]. O Pleiades o chama de "a primeira ponte de pedra (241 a.C.)", o que **diverge** de Lívio. Restos: "Ponte Rotto". **Existente.**
- **Pons Fabricius:** "ponte do séc. I a.C. que liga a área do Circo Flamínio à Ilha Tiberina" (Pleiades 68481414). A data de **62 a.C.** (do escopo) **NÃO foi verificada** nesta pesquisa: a inscrição e Dião Cássio não estavam acessíveis. **Provavelmente existente.**
- **Pons Cestius:** "a ponte original data do séc. I a.C." (Pleiades 211668069). **Existência em 50–44 a.C.: NÃO ENCONTRADO.**
- **Cloaca Máxima:** nasceu como dreno canalizado no fim do séc. VI a.C., depois foi abobadada e enterrada, e deságua no Tibre (Pleiades 867802692). Era larga o bastante para uma carroça de feno (Plín. *NH* 36.108; Str. 5.3.8).

### Localização

| Elemento | x | z | Fonte | Confiança |
|---|---|---|---|---|
| Pons Aemilius (Ponte Rotto) | −466,3 | 352,1 | Pleiades 425068 | alta |
| Pons Fabricius | −560,5 | 158,1 | Pleiades 68481414 | alta |
| Pons Cestius | −638,6 | 272,9 | Pleiades 211668069 | alta (existência em 44 a.C. incerta) |
| Ilha Tiberina (centroide do contorno OSM) | −659,2 | 212,8 | Pleiades OSM [DERIVADO] | alta (contorno moderno) |
| Pons Sublicius | a jusante da Ilha, perto do Forum Boarium | — | Pleiades (texto) | posição: NÃO ENCONTRADO |

### Dimensões

| Elemento | Valor | Unidade | Fonte | Confiança |
|---|---|---|---|---|
| Largura do Tibre | ~4 plethra (≈ 118 m [DERIVADO, com a mesma conversão do Circo]) | — | Dion. 9.68.2 (conferido) | média (época arcaica, valor aproximado: *μάλιστα*) |
| Ilha Tiberina: retângulo mínimo do contorno OSM moderno | 417 × 111 | m | Pleiades OSM [DERIVADO] | média (o contorno moderno é muralhado e pode incluir encontros de ponte) |
| Ilha Tiberina: eixo longo | 113° / 293° (OSO–ENE, aprox. ESE–ONO) | graus | idem | média |
| Ilha Tiberina: área | ≈ 27.800 | m² | idem | média |
| Pontes: vãos, largura e nº de arcos em 44 a.C. | **NÃO ENCONTRADO** | — | — | — |
| Nível da água antigo / altura das margens | **NÃO ENCONTRADO** (DEM moderno 7–10 m) | — | — | — |

### Materiais e acabamentos

- Sublicius em **madeira, sem ferro** (Plín. *NH* 36.100). Aemilius com pilares e arcos (Lív. 40.51.4); pedra específica: NÃO ENCONTRADO.

### Detalhes de ambientação

- Barcos subindo o rio até o porto do Forum Boarium e o *emporium* (Dion. 9.68.2: o rio era navegável por grandes navios; Lív. 41.27.8: escadas do Tibre ao *emporium*).
- Correnteza e redemoinhos (Dion. 9.68.2). Comércio de madeira junto à Porta Trigemina (Lív. 35.41.10).

---

## Anacronismos a evitar (não existiam em 50–44 a.C. ou pertencem a fases posteriores)

| Elemento | Data / fase | Fonte |
|---|---|---|
| **Obelisco de Augusto** no Circo Máximo (85¾ pés sem a base) | augustano | Plín. *NH* 36.71 (Bostock, conferido) |
| Euripus **suprimido** e lugares para cavaleiros no Circo | Nero | Plín. *NH* 8.21 |
| Descrição de **Dionísio** (3 andares, pórtico externo) como estado exato de 46 a.C. | c. 8 a.C. | Dion. 1.7.2 [DERIVADO] |
| Capacidade de 250.000/260.000 (Plínio) | época de Plínio/Vespasiano (Platner) | Plín. *NH* 36.102; Platner (resumo) |
| **Arco de Tito** na curva do Circo | depois da Guerra Judaica | Pleiades 45530496 |
| **Mitreu** do Circo Máximo | imperial | Pleiades 960323262 |
| **Septizônio** (canto sudeste do Palatino) | Severos | Pleiades 705506085 |
| **Domus Flavia / Augustana**, "Estádio" do Palatino, Paedagogium | Domiciano, c. 92 d.C. | Pleiades 564783056, 792237246, 132886213, 155566866 |
| **Templo de Apolo Palatino**, Casa de Augusto como residência imperial | augustano | Pleiades 257097394, 250568480 (datas: NÃO verificadas aqui) |
| **Arco de Jano Quadrifronte** (Velabro / Forum Boarium) | início do séc. IV d.C. | Pleiades 367835399 |
| **Arcus Argentariorum** (Velabro) | 204 d.C. | Pleiades 335461216 |
| **Sant'Anastasia** e demais igrejas | c. 325 d.C. em diante | Pleiades 267621225 |
| **Casa dei Crescenzi** junto à Pons Aemilius | 1040–1065 | Pleiades 111763397 |
| **Teatro de Marcelo** construído | dedicado em 12 a.C. | Pleiades 300583267. Em 44 a.C. César só **planejava** "um teatro de enorme tamanho encostado ao monte Tarpeio" (Suet. *Iul.* 44.1, conferido) |
| **Pórtico de Otávia** | depois de 27 a.C. (substituiu o Pórtico de Metelo) | Pleiades 236573248 |
| **Termas de Caracala** | 212–216 d.C. | Pleiades 322942899 |
| **Arco de Galieno** na Porta Esquilina | 262 d.C. | Pleiades 29110684 |
| Limite de **70 pés** para prédios em vias públicas; corpo de vigiles de libertos | Augusto | Str. 5.3.7 |
| Aquedutos e fontes de **Agripa** | depois de 44 a.C. | Str. 5.3.8 (menciona Agripa) |
| **Muralha Aureliana** | séc. III d.C. | Pleiades 529700371 (nome; data NÃO verificada aqui) |
| **Pons Aelius**, Pons Neronianus | Adriano / Calígula ou Nero | Pleiades 334776903, 100447491 |
| Sela capitolina e Piazza del Campidoglio na cota atual | ~8 m acima da antiga | Musei Capitolini, via nota 01 |

---

## Lacunas e incertezas (e como tratar no jogo de forma honesta)

> **Causa principal:** a cota de buscas na web acabou depois de 3 consultas, todas sobre o Circo. Os itens abaixo devem ser pesquisados numa próxima rodada, se houver nova cota. Até lá, seguem as soluções sugeridas, sempre com a etiqueta "**reconstrução hipotética**".

1. **Circo em 46 a.C.:**
   - Dimensões exatas da fase cesariana: Plínio (3 × 1 estádios) diverge de Dionísio (3,5 estádios × 4 plethra, augustano), e o texto de Plínio é corrupto.
   - Número de carceres em 46 a.C.: 12 é o número de referência de Platner, sem fase indicada.
   - Forma da barreira central; proporção pedra/madeira das arquibancadas em 46 a.C.; cota da arena.
   - **Sugestão:** 621 × 118 m, 12 carceres, euripus de 2,96 m em 3 lados, arquibancada baixa de pedra e alta de madeira, metas removíveis, **sem obelisco**. Painel: "Dimensões segundo Dionísio de Halicarnasso (c. 8 a.C.); estado exato de 46 a.C. incerto".
2. **Santuários de Múrcia e Conso:** forma, posição exata e se o altar de Conso era subterrâneo: NÃO ENCONTRADO. **Sugestão:** pequeno altar junto ao sopé do Palatino, perto da extremidade das carceres, e uma edícula para Múrcia; ambos rotulados como hipotéticos.
3. **Cotas antigas:** não temos as cotas republicanas dos cumes, do vale do Circo, do Velabro, do Forum Boarium, da Subura nem do Tibre; só as do Fórum (11,8–14 m) e as do Capitólio em relação ao Tibre (38–39 m). O DEM moderno lê 6–10 m acima no Fórum escavado. **Sugestão:** terreno com a forma do DEM, normalizado para Fórum = 0 e vales planos rebaixados; painel "relevo reconstruído a partir de dados modernos".
4. **Palatino:** subdivisão Germalo/Palatium e cotas de cada uma: NÃO ENCONTRADO (Varrão, *LL* 5, não estava acessível).
5. **Velia:** forma e cota do esporão hoje removido: NÃO ENCONTRADO. **Sugestão:** sela suave entre o Palatino e o Opio, ~10–15 m acima do Fórum (valor **inventado para design**, marcar).
6. **Muralha Serviana:** altura, espessura, tamanho dos blocos, tufo usado (Grotta Oscura? NÃO confirmado), estado de conservação em 50–44 a.C. e posições das portas **Ratumena**, **Fontinalis** (precisa), **Viminalis**, **Flumentana**: NÃO ENCONTRADO. **Divergência:** comprimento do *agger*, 7 estádios em Dionísio e 6 em Estrabão. **Sugestão:** muralha de ~8–10 m (não atestado), com casas encostadas.
7. **Ruas:** larguras de todas as ruas pedidas (Vicus Tuscus, Vicus Iugarius, Argiletum, Clivus Suburanus, Vicus Patricius, Via Nova, Clivus Victoriae); traçado da **Via Nova**; meio-fios e passeios: NÃO ENCONTRADO. **Divergência** sobre o Vicus Iugarius (Pleiades × nota 01 × OSM). **Sugestão:** vias principais de 4–6 m e becos de 2–3 m (design, não atestado), coerentes com *angustissimis semitis* (Cícero) e *artis itineribus* (Tácito).
8. **Forum Boarium:**
   - Ordem, colunas, materiais e orientação de Portuno e de Hércules Vencedor.
   - Mármore de Hércules: **não confirmado**.
   - Existência do touro de bronze em 44 a.C.
   - Relação entre a *aedes rotunda Herculis* de 296 a.C. e o templo do fim do séc. II a.C.
   
   **Sugestão:** usar o contorno OSM das plantas (Portuno 23,3 × 11,6 m; Hércules ⌀ ~19 m) e aguardar a pesquisa de detalhes.
9. **Pontes:** data do Pons Fabricius (62 a.C.?), existência do Pons Cestius em 44 a.C., posição do Pons Sublicius, número de arcos e larguras: NÃO ENCONTRADO. **Divergência** sobre a data do Pons Aemilius (Pleiades 241 a.C. × Lívio 179/142 a.C.). **Sugestão:** Aemilius de pedra com arcos; Sublicius de madeira a jusante; Fabricius de pedra marcado como "c. 62 a.C. (tradição)"; **sem** Cestius, ou com painel de dúvida.
10. **Ilha Tiberina e margens:** contorno antigo (o OSM é moderno, muralhado) e nível do rio: NÃO ENCONTRADO.

---

## Fontes

### Fontes antigas (texto original conferido nos arquivos TEI do Perseus no GitHub)

- **Plínio, o Velho, *Naturalis Historia*** (ed. Mayhoff; trad. Bostock & Riley): 3.66–67 (Roma, *agger*, casas além da muralha); 8.20–22 (elefantes de Pompeu, 55 a.C.; euripus de César; elefantes de 46 a.C.); 8.161 (Porta Ratumena); 34.57 (Hércules de Míron no templo de Pompeu junto ao Circo); 35.154 (templo de Ceres junto ao Circo); 36.48 (Mamurra no Célio); 36.71 (obelisco de Augusto no Circo); 36.100 (Pons Sublicius sem ferro); 36.102 (circo de César: 3 × 1 estádios, 4 *iugera*, CCL); 36.104–108 (cloacas, carroça de feno).
  - <https://raw.githubusercontent.com/PerseusDL/canonical-latinLit/master/data/phi0978/phi001/phi0978.phi001.perseus-lat2.xml>
  - <https://raw.githubusercontent.com/PerseusDL/canonical-latinLit/master/data/phi0978/phi001/phi0978.phi001.perseus-eng1.xml>
- **Suetônio, *Divus Iulius*** 39.2–3 (circo prolongado, euripus, metas retiradas, batalha); 44.1 (teatro planejado junto ao monte Tarpeio).
  - <https://raw.githubusercontent.com/PerseusDL/canonical-latinLit/master/data/phi1348/abo011/phi1348.abo011.perseus-lat2.xml>
  - <https://raw.githubusercontent.com/PerseusDL/canonical-latinLit/master/data/phi1348/abo011/phi1348.abo011.perseus-eng2.xml>
- **Dionísio de Halicarnasso, *Antiquitates Romanae*** 1.7.2 (datação do autor); 1.32.3 (Lupercal); 3.68.1–4 (Circo: medidas, euripus, stoas, 150.000, carceres, lojas); 4.13.2–5 (Sérvio; muralha escondida pelas casas); 4.44.1–2 (pórticos do hipódromo, Tarquínio Soberbo); 9.68.2–4 (Tibre; *agger*).
  - <https://raw.githubusercontent.com/PerseusDL/canonical-greekLit/master/data/tlg0081/tlg001/tlg0081.tlg001.perseus-grc2.xml>
- **Tito Lívio, *Ab Urbe Condita*** 1.9.6; 1.33.5; 1.35.8–9; 1.36.1; 1.38.6; 1.44.3–5; 1.56.2; 2.49.8; 5.47.2; 6.32.1; 8.20.2; 10.23.3; 10.23.12; 21.62.3; 22.57.6; 24.9.6; 24.47.15–16; 25.7.6; 27.11.16; 27.37.15; 33.27.4; 35.9.2–3; 35.10.12; 35.21.5; 35.41.10; 38.28.3–4; 39.44.5–7; 40.2.2; 40.51.4–5; 41.27.5–8.
  - <https://raw.githubusercontent.com/PerseusDL/canonical-latinLit/master/data/phi0914/phi001/phi0914.phi001.perseus-lat2.xml>
- **Estrabão, *Geographica*** 5.3.7 (muralha de Sérvio, *agger* de 6 estádios, Porta Viminal, desabamentos e incêndios, limite de 70 pés de Augusto); 5.3.8 (vias, cloacas abobadadas, Agripa).
  - <https://raw.githubusercontent.com/PerseusDL/canonical-greekLit/master/data/tlg0099/tlg001/tlg0099.tlg001.perseus-grc2.xml>
- **Tácito, *Annales*** 12.24 (pomério: touro de bronze, Ara Máxima, Ara Consi); 15.38 (lojas do Circo; ruas estreitas da "vetus Roma").
  - <https://raw.githubusercontent.com/PerseusDL/canonical-latinLit/master/data/phi1351/phi005/phi1351.phi005.perseus-lat1.xml>
- **Cícero, *De lege agraria*** 2.96 (Roma em montes e vales, *cenacula*, ruas estreitas).
  - <https://raw.githubusercontent.com/PerseusDL/canonical-latinLit/master/data/phi0474/phi011/phi0474.phi011.perseus-lat2.xml>
- **Horácio, *Sermones*** 2.3.226–229 (Vicus Tuscus, Velabro).
  - <https://raw.githubusercontent.com/PerseusDL/canonical-latinLit/master/data/phi0893/phi004/phi0893.phi004.perseus-lat2.xml>
- **Plauto, *Curculio*** 4.1 (vv. 466–484: frequentadores do Fórum, do Vicus Tuscus e do Velabro).
  - <https://raw.githubusercontent.com/PerseusDL/canonical-latinLit/master/data/phi0119/phi008/phi0119.phi008.perseus-lat2.xml>
- **Ovídio, *Fasti*** 3.199; 4.680; 5.669; 6.405; 6.477–478.
  - <https://raw.githubusercontent.com/PerseusDL/canonical-latinLit/master/data/phi0959/phi007/phi0959.phi007.perseus-lat2.xml>
- **Vitrúvio, *De architectura*** 2.7.1–5 (pedras de Roma); 2.8.17 (paredes, prédios altos); 3.3.5 (templos areostilos de Ceres e Hércules Pompeiano junto ao Circo).
  - <https://raw.githubusercontent.com/PerseusDL/canonical-latinLit/master/data/phi1056/phi001/phi1056.phi001.perseus-lat2.xml>

### Gazetteer e dados geográficos

- **Pleiades** (CC BY), arquivos `places.csv`, `names.csv`, `location_points.csv` e `location_linestrings.csv`, de <https://raw.githubusercontent.com/isawnyu/pleiades.datasets/main/data/gis/> (README de 28/05/2025). Lugares citados (URI <https://pleiades.stoa.org/places/ID>):
  - **Circo e Palatino:** 458808506 (Circus Maximus), 960323262 (mitreu), 45530496 (Arco de Tito no Circo), 606719480 (Scalae Caci), 251058809 (Tugurium Romuli), 565793497 (Lupercal), 547584100 (Porta Mugonia), 192818177 (Magna Mater), 904782880 (Casa de Lívia).
  - **Templos junto ao Circo:** 581361483 (Ceres), 107133090 (Mercúrio), 408534259 (Summanus).
  - **Colinas e vales:** 347036492 (Capitolinus), 871801169 (Júpiter O. M.), 76518529 (Iuno Moneta), 928849659 (Rocha Tarpeia), 971691208 (Palatinus), 157710058 (Velia), 91325207 (Oppius), 257235581 (Cispius), 679976755 (Esquilinus), 755385623 (Viminal), 125119394 (Quirinal), 865014139 (Aventinus), 695491849 (Caelius), 451696383 (Subura), 987812398 (Murus Terreus Carinarum).
  - **Muralha e portas:** 103808101 (Murus Servii Tullii e trechos OSM), 54214303 (Porta Fontinalis), 27164982 (Porta Capena), 29110684 (Arco de Galieno/Porta Esquilina), 268637493 (Porta Collina), 159953179 (Arcus Dolabellae/Porta Caelimontana), 303638861 (Porta Trigemina), 502889801 (Porta Flumentana), 37637607 (Porta Naevia).
  - **Ruas:** 380281017 (Vicus Tuscus), 889101791 (Vicus Iugarius), 451243813 (Argiletum), 821658053 (Clivus Suburanus), 166272189 (Vicus Patricius), 668537796 (Clivus Victoriae), 152699900 (Clivus Capitolinus), 267702571 (Clivus Scauri).
  - **Velabro e Forum Boarium:** 432833118 (Velabrum), 207271756 (Forum Boarium), 494660670 (Portuno), 825969667 (Hércules Vencedor), 207271757 (Ara Maxima), 103123065 (S. Omobono).
  - **Tibre:** 867802692 (Cloaca Maxima), 425068 (Pons Aemilius), 68481414 (Pons Fabricius), 211668069 (Pons Cestius), 286808786 (Pons Sublicius), 771725842 (Ilha Tiberina).
  - **Anacronismos:** 367835399, 335461216, 705506085, 564783056, 792237246, 132886213, 155566866, 257097394, 250568480, 300583267, 236573248, 322942899, 267621225, 111763397, 334776903, 100447491, 529700371.
- **DEM:** Mapzen/Tilezen *Terrain Tiles*, formato Terrarium, zoom 15, tiles x = 17517–17523, y = 12173–12180: `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/15/{x}/{y}.png`. Documentação das fontes (SRTM ~30 m em terra na Itália, nos zooms altos) e do formato: <https://raw.githubusercontent.com/tilezen/joerd/master/docs/data-sources.md>, <https://raw.githubusercontent.com/tilezen/joerd/master/docs/formats.md>, <https://raw.githubusercontent.com/tilezen/joerd/master/docs/attribution.md>. Atribuição: "SRTM data courtesy of the U.S. Geological Survey"; "Produced using Copernicus data and information funded by the European Union – EU-DEM layers".

### Notas do projeto usadas (com as fontes delas)

- `docs/pesquisa/00-coordenadas.md` (Pleiades; sistema de coordenadas).
- `docs/pesquisa/01-forum-oeste.md`: cotas do Fórum segundo Platner, *Comitium* (<https://digi.ub.uni-heidelberg.de/diglit/platner1929/0178>), e Van Deman, "The Sullan Forum", *JRS* 1922 (<https://www.cambridge.org/core/journals/journal-of-roman-studies/article/sullan-forum/FA9A5FF5510AC28DA59414B54D094609>); cotas do Capitólio segundo ancientromelive/Platner (<https://ancientromelive.org/capitolinus-mons-capitoline-hill/>); Musei Capitolini (<https://museicapitolini.org/en/node/158>); Grotta Oscura (<https://oxrep.classics.ox.ac.uk/popup.php?ste=3112>); Vicus Iugarius e Clivus Capitolinus.
- `docs/pesquisa/02-forum-norte.md`: Argileto; *cappellaccio*.
- `docs/ARQUITETURA.md`: convenção y = 0 = pavimento do Fórum.

### Buscas na web realizadas (3; resultados usados só via resumo do buscador, páginas não abertas)

1. "Circus Maximus Julius Caesar 46 BC enlarged euripus Pliny 36.102…" (*extended*):
   - <https://www.digitalaugustanrome.org/records/circus-maximus/>
   - <http://www.perseus.tufts.edu/hopper/text?doc=Perseus:text:1999.04.0054:entry%3Dcircus-maximus> (Platner–Ashby)
   - <https://ancientromelive.org/circus-maximus/>
   - <https://imperiumromanum.pl/en/curiosities/largest-roman-circus-circus-maximus/>
   - <https://penelope.uchicago.edu/~grout/encyclopaedia_Romana/circusmaximus/circusmaximus.html>
   - <https://grokipedia.com/page/Circus_Maximus>
   - <https://www.crystalinks.com/circusmaximus.html>
2. "Circus Maximus Platner Ashby … carceres euripus …":
   - <https://digi.ub.uni-heidelberg.de/diglit/platner1929/0159>
   - <https://digi.ub.uni-heidelberg.de/diglit/platner1929/0161>
   - <https://www.worldhistory.org/Circus_Maximus/>
   - <https://penelope.uchicago.edu/Thayer/E/Roman/Texts/secondary/SMIGRA*/Circus.html>
3. "Circo Massimo dimensioni 621 metri 118 metri arena Cesare euripo":
   - <https://www.wikipedia.com/wiki/Circo_Massimo>
   - <https://www.hmdb.org/m.asp?m=265765>
   - <https://formaurbis.stanford.edu/fragment_8c.html>
   - <https://formaurbis.stanford.edu/fragment_9.html>
   - <https://imperiumromanum.pl/en/roman-art-and-culture/roman-architecture/roman-buildings/circus-maximus/>
   - <https://www.csun.edu/~hcfll004/SportsBuildings.html>
   - <https://britannica.com/topic/Circus-Maximus>
