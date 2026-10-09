# Plano de implantação (LAYOUT) — decisões globais

Documento de coordenação para todos os sítios. As **áreas** (polígonos) estão em
`src/data/layout.js` (`SITE_AREAS`, `FORUM_FRAME`, `forumUV`) — use-as no código em vez de
copiar números. Para ver as áreas no jogo: `node scripts/shot.mjs ... --layout=1` (ou `?layout=1`).

## 1. Momento histórico fixado

**Início de 44 a.C. (janeiro–fevereiro), antes dos Idos de Março.** César é ditador; o grande
programa de obras cesariano está em andamento. Consequências que TODOS os sítios devem respeitar
(cada uma marcada como hipótese no painel de informação quando a nota de pesquisa assim indicar):

| Elemento | Estado a representar | Base |
|---|---|---|
| Nova Rostra de César (extremo oeste da praça) | construída, frente curva voltada para o Fórum, estátuas de Sula e Pompeu repostas; acabamento ainda em obra (andaime atrás) | notas 01 §8, 02 §3 (Dião 43.49) |
| Rostra republicana (lado sul do Comício) | em desmonte: plataforma parcialmente demolida, esporões já retirados | 02 §3 (hipótese) |
| Cúria de Fausto Sula | em demolição; canteiro da **Cúria Júlia** / Templo de Felicitas iniciado (fundações, gruas de madeira, blocos) | 02 §2 (Dião 44.5) — o usuário pediu "em reconstrução como Cúria Júlia" |
| Basílica Pórcia | ruína/terreno limpo (incêndio de 52 a.C.) | 02 §7 |
| Basílica Emília (Paulli) | canteiro avançado: colunas de pé, cobertura parcial, andaimes | 02 §8 |
| Basílica Júlia | dedicada (46 a.C.) e em uso, mas inacabada (andaimes em parte) | 03 |
| Fórum de César | dedicado (46 a.C.), em uso; templo completo; extremidade SSE em obras (tapumes) | 04 |
| Templo de Saturno | templo ANTIGO (anterior a Planco), forma itálica hipotética; Aerarium | 01 §1 |
| Templo da Concórdia | fase de Opímio (121 a.C.) + Basílica Opímia | 01 §2 |
| Castor, Vesta, Regia | fases republicanas (Metelo 117 a.C.; Regia anterior a 36 a.C.) | 03 |
| Templo de Júpiter Capitolino | reconstrução de Cátulo (dedicada 69 a.C.) | 05 |
| Teatro de Pompeu (Campo de Marte) | existe (55 a.C.) | 11/10 — sítio `arredores` |
| Toldos | toldos sobre o Fórum foram um evento de 46 a.C.; NÃO cobrir o Fórum permanentemente | 08 |

Nada de elementos imperiais (lista de anacronismos em cada nota).

## 2. Convenções de posição

- Sistema do mundo e convenções: `docs/ARQUITETURA.md` §2. Coordenadas-âncora: `src/data/places.js`.
- **Referencial do Fórum** (`FORUM_FRAME`): origem (25, 20); eixo **u** ao longo da praça para ESE
  (rumo 119°), eixo **v** perpendicular para NNE (rumo 29°). `forumUV(u, v)` → `{x, z}`.
  - Retângulos alinhados ao Fórum: `rotY = FORUM_FRAME.rectRotY` (−0,5061) em `addPad`/`reserve`.
  - Fachada voltada para NNE (rumo 29°): `facingRotY(29)`; para SSO (209°): `facingRotY(209)`;
    para ESE (119°): `facingRotY(119)`; para ONO (299°): `facingRotY(299)`.
- Relevo: `src/data/topography.js` (DEM corrigido para o nível antigo; y = 0 no Fórum ≈ 13 m s.n.m.).
  Consulte `ctx.terrain.heightAt(x, z)`; nivele seus lotes com `addPad` (y desejado).
- **Ordem dos pads**: os sítios são processados na ordem de `src/sites/index.js`; um pad posterior
  sobrescreve um anterior na área em comum. `forum-praca` aplica o pad geral do vale do Fórum (y = 0).

## 3. Sítios — responsabilidades

Legenda: **Área** = `SITE_AREAS[id]`. **Locais** = ids de teleporte obrigatórios. Todos os sítios:
painéis `ctx.addInfo` para cada edifício importante, `ctx.addArea` com nome PT + latim,
caminhos de NPC e zonas de som coerentes.

### forum-praca — Praça do Fórum e Via Sacra (`src/sites/forumPiazza.js`)
- Área: retângulo da praça (u −20…85, v −28…38) + corredor da Via Sacra para leste (u 85…330, v ±9)
  até o alto da Vélia (~(300, 185)).
- Faz: pad geral do vale do Fórum em y = 0 (u −100…125, v −85…85, blend 25 m) **em shapeTerrain**;
  pavimento da praça (lajes de travertino/tufo, nota 01/03 — fases do pavimento); traçado e
  pavimento da Via Sacra (nota 03); Lacus Curtius, Puteal Libonis/Scribonianum, estátuas e
  monumentos honoríficos na praça (notas 02/03), relógio de sol junto à antiga Rostra se a nota
  permitir; caminhos de NPC da praça e da Via Sacra (densos), zona de som `crowd` forte.
- Locais: `via-sacra` (**marque `start: true`** — ponto inicial do jogo, na praça olhando para o Capitólio).
- Não faz: edifícios das bordas (são dos outros sítios do Fórum).

### forum-oeste — Extremidade oeste (`src/sites/forumWest.js`)
- Área: 3 polígonos (Saturno, Rostra de César, Concórdia, Carcer, encosta até o Tabularium).
- Faz: Templo de Saturno (fase antiga) com Aerarium; Templo da Concórdia (Opímio) e Basílica
  Opímia; Tabularium (fachada com arcadas sobre substrução, pavimento superior) e Templo de Véiove;
  Carcer/Tullianum; trecho inferior do Clivus Capitolinus (do Fórum até a altura da galeria do
  Tabularium); entrada do Vicus Iugarius com o Lacus Servilius; **nova Rostra de César** (frente
  curva, estátuas de Sula e Pompeu, andaime).
- Locais: `templo-saturno`, `templo-concordia`, `tabularium`, `rostra`.
- Vizinhos: `capitolio` (continua o Clivus para o alto), `forum-norte` (Comício a leste do Carcer),
  `forum-sudeste` (Basílica Júlia ao sul do Vicus Iugarius).

### forum-norte — Comício, Cúria, Basílica Emília (`src/sites/forumNorth.js`)
- Área: Comício (u −75…−20, v 0…60) + faixa norte até a frente do Fórum de César e o Argileto.
- Faz: Comício (degraus circulares, pavimento), Rostra republicana em desmonte, Graecostasis,
  Lapis Niger/Volcanal (lótus e cipreste), Coluna Mênia; Cúria de Fausto em demolição + canteiro
  da Cúria Júlia/Felicitas (ponto Pleiades da Cúria Júlia (32,8; −51,5); cúria antiga ao norte do
  Comício, voltada para o sul); ruína da Basílica Pórcia; **Basílica Emília/Paulli em obras** com
  as Tabernae Novae (banqueiros) na frente; santuário circular de Vênus Cloacina; Ianus Geminus
  (portas abertas); boca do Argileto (a rua continua na área `subura`).
- Locais: `comicio`, `curia`, `basilica-emilia`.

### forum-sudeste — Lado sul e leste (`src/sites/forumSouthEast.js`)
- Área: 3 polígonos (Basílica Júlia; Castor, Vesta, Atrium Vestae, Regia, Domus Publica).
- Faz: Basílica Júlia (dedicada, inacabada) e o que restar da Semprônia; Templo de Castor
  (fase de Metelo, pódio-tribuna); Lacus Iuturnae; Templo de Vesta (redondo) e Atrium Vestae;
  Regia; Domus Publica (residência de César como Pontifex Maximus); Fornix Fabianus na Via Sacra;
  boca do Vicus Tuscus (entre Basílica Júlia e Castor).
- Locais: `basilica-julia`, `templo-castor`, `templo-vesta`.

### forum-iulium — Fórum de César (`src/sites/forumIulium.js`)
- Área: recinto t −25…105 m ao longo do eixo 158° a partir do ponto Pleiades do templo
  (−12,9; −182,9), ±40 m para os lados (polígono em `SITE_AREAS`). Templo na ponta NNO, fachada
  para SSE (`facingRotY(158)`).
- Faz: praça, pórticos laterais (duplo só como hipótese), tabernae, templo de Vênus Genetrix
  (octastilo picnostilo, pódio alto, coríntio — hipóteses da nota 04), estátua equestre de César,
  fonte das Apíades, estátua de culto, imagem de Cleópatra; extremidade SSE em obras (tapumes).
  O recinto termina em t = 105 (a área além é o canteiro da Cúria, do `forum-norte`).
- Locais: `forum-iulium`.

### capitolio — Colina Capitolina (`src/sites/capitoline.js`)
- Área: o alto e as encostas do Capitólio (exceto a encosta leste do Fórum, que é do `forum-oeste`).
- Faz: Templo de Júpiter Ótimo Máximo (Cátulo), Area Capitolina, Arx com Juno Moneta, Asylum
  (sela), Rocha Tarpeia (paredão), Templo de Fides e outros da nota 05, trecho superior do Clivus
  Capitolinus, escadarias (Centum Gradus, Scalae Gemoniae junto ao Carcer), muros.
- Locais: `templo-jupiter`.

### palatino — Colina Palatina (`src/sites/palatine.js`)
- Área: o Palatino (o lote `domus-crasso` na encosta norte é de outro sítio).
- Faz: Templo da Magna Mater, Templo da Vitória e edícula da Vitória Virgem, Casa Romuli,
  Scalae Caci, Lupercal (sopé SO), Porta Mugonia, Clivus Victoriae, Nova Via (encosta N),
  casas aristocráticas como volumes (casa de Cícero, casa de Hortênsio, Casa dei Grifi, pórtico de
  Catulo — nota 06 §9–10), jardins e árvores. Nada de Apolo Palatino nem palácios imperiais.
- Locais: `palatino`.

### domus-crasso — "Casa Licínia" (Domus de Crasso) (`src/sites/domusCrassi.js`)
- Área: lote (175…235, 160…215) na encosta norte do Palatino (nota 06 §5: x ≈ 200, z ≈ 185),
  entrada (fauces) voltada para a rua que desce à Nova Via/Via Sacra (norte).
- Faz: domus completa e visitável segundo nota 06 §5–8 (Vitrúvio): fauces, átrio toscano com
  implúvio/compluvium, **6 colunas de mármore do Himeto de 12 pés** (hipótese declarada: eram do
  orador L. Crasso), alae, tablinum, triclinium, cubicula, peristilo com jardim e árvores "lotus",
  cozinha, latrina, pinturas I e II estilo, pisos (signinum, mosaico), mobiliário de luxo.
  Placa obrigatória com a verdade histórica (nota 06, resumo).
- Locais: `domus-crasso` (com `y` do piso). NPCs: escravos domésticos, clientes na salutatio.

### macellum — Macellum e comércio (`src/sites/macellum.js`)
- Área: lote atrás (NNE) da Basílica Emília, a leste do Argileto, alinhado ao Fórum (u 65…135, v 100…160).
- Faz: macellum (pátio com tholos central cercado de lojas — hipótese da nota 08), bancas,
  balanças, produtos da época (sem tomate/batata/milho etc.), peixaria, açougue, vendedores,
  guardas da lei suntuária de César; rua de acesso a partir do Argileto.
- Locais: `macellum`. Som `market` forte, `animals` (aves).

### subura — Subura (`src/sites/subura.js`)
- Área: grande polígono NE (inclui o Argileto desde a saída do Fórum até o vale da Subura e o
  Clivus Suburanus). Os lotes `casa-plebe` (320…346, −262…−238) e `foricae` (244…270, −188…−168)
  ficam DENTRO da área, mas são de outros sítios — deixe-os livres e conecte ruas até eles.
- Faz: ruas estreitas e tortuosas, insulae de 3–6 pavimentos com tabernae, sacadas, oficinas,
  compita com altar dos Lares, fonte (lacus), livreiros/sapateiros do Argileto (nota 07), muita
  gente; densidade alta. Use instâncias para o casario de fundo.
- Locais: `subura`.

### casa-plebe — Insula com apartamento plebeu (`src/sites/insulaPlebeia.js`)
- Área: lote (320…346, −262…−238) na Subura.
- Faz: uma insula completa e visitável: térreo com tabernae, escada, pavimentos superiores;
  **um cenaculum plebeu** detalhado (nota 07): poucos cômodos, escuro, janela com persiana,
  braseiro, catre com colchão de palha, ânforas, lucerna, matula, roupa estendida. Vizinhos
  (sons de parede), escada estreita e escura.
- Locais: `casa-plebe` (com `y` do piso do apartamento).

### foricae — Latrina pública (`src/sites/foricae.js`)
- Área: lote (244…270, −188…−168) junto ao Argileto/Subura.
- Faz: **reconstrução hipotética declarada** (nota 09: não há evidência direta em Roma para
  50–44 a.C.): sala com bancos corridos de pedra/madeira com aberturas, canal de água corrente
  sob os assentos e canaleta à frente, entrada em cotovelo, ligação a um ramal de esgoto; um
  balneum de bairro modesto ao lado (opcional). NPCs sentados conversando (pose `sit`).
- Locais: `foricae`. Som `water`.

### circo-maximo — Circo Máximo (`src/sites/circusMaximus.js`)
- Área: retângulo do circo (eixo 126°, centro (58,9; 731,4), 621 × 118 m, carceres a ONO).
- Faz: visão externa e interna plausível (nota 10 §1, proposta de modelagem): arena, euripus
  (fosso de César, 46 a.C.), metas, ovos, 12 carceres, arquibancadas (pedra embaixo, madeira em
  cima — com etiqueta de hipótese), pórtico externo de lojas; templos de Ceres e Mercúrio na
  encosta do Aventino (volumes). Sem obelisco.
- Locais: `circo-maximo`.

### arredores — Velabro, Forum Boarium, Tibre e Campo de Marte (`src/sites/surroundings.js`)
- Área: 2 polígonos (Velabro/Boarium/Holitorium + margem do Tibre; Campo de Marte central).
- Faz: Templo de Portuno e Templo (redondo) de Hércules Vencedor, Ara Máxima, Forum Holitorium
  (templos de Jano, Spes, Pietas; casas sendo demolidas por César para o futuro teatro — hipótese),
  pontes Emília (pedra), Fabrícia (se a nota permitir) e Sublícia (madeira, posição hipotética),
  margens e cais, barcos; no Campo de Marte: Teatro e Pórtico de Pompeu (55 a.C.) e templos de
  Largo Argentina (volumes, dados da nota 10/11). Usar volumes simplificados mas corretos.
- Locais: `forum-boario`, `teatro-pompeu` (opcionais).

### cidade — Tecido urbano, ruas e muralha (`src/sites/city.js`)
- Área: todo o resto do mapa (fora de `ALL_AREA_POLYGONS`, com margem de 3 m).
- Faz: (1) rede de ruas principais como faixas de basalto/terra com caminhos de NPC
  interligando os sítios: Vicus Tuscus (Fórum → Velabro → Circo), Vicus Iugarius (Fórum → Forum
  Holitorium), Nova Via (encosta N do Palatino), Clivus Victoriae, Via Sacra além da Vélia
  (rumo às Carinas), Clivus Suburanus/Vicus Patricius (Subura → Esquilino), rua do Circo;
  (2) preenchimento urbano denso e instanciado (insulae nos vales, domus nas colinas — nota 07/10),
  com LOD/culling, sem construir sobre ruas nem em áreas de outros sítios; (3) trechos da
  Muralha Serviana e portas (nota 10 §3); (4) vegetação (jardins, encostas); (5) Ilha Tiberina
  (templo de Esculápio como volume). Deve funcionar sozinho e com todos os sítios.
- Locais: nenhum obrigatório.

## 4. Ruas compartilhadas e conexões

As ruas que cruzam várias áreas são desenhadas pelo dono da área por onde passam; os caminhos de
NPC devem se encontrar nas bordas (pontos de junção — use as coordenadas abaixo como nós comuns):

| Junção | Coordenada (x, z) |
|---|---|
| Fórum ↔ Argileto (entre Cúria e Basílica Emília) | (40, −40) |
| Argileto ↔ Subura | (140, −105) |
| Fórum ↔ Vicus Tuscus (entre Basílica Júlia e Castor) | (30, 85) |
| Fórum ↔ Vicus Iugarius (entre Saturno e Basílica Júlia) | (−55, 30) |
| Fórum ↔ Clivus Capitolinus (junto a Saturno) | (−85, 0) |
| Via Sacra ↔ Vélia | (305, 180) |
| Via Sacra (praça) ↔ Regia/Vesta | (105, 60) |
| Nova Via ↔ Palatino (Clivus Victoriae) | (42, 202) |
| Vicus Tuscus ↔ Velabro | (−200, 300) |
| Velabro ↔ Forum Boarium / Circo | (−260, 420) |

## 5. Orçamento global

- Meta total da cidade inteira na qualidade média: ≤ 900 draw calls visíveis, ≤ 2,5 M triângulos
  visíveis, carregamento < 20 s. Cada sítio deve respeitar o orçamento do ARQUITETURA.md §4.
- NPCs: o orçamento total é distribuído pela densidade dos caminhos (`density` = NPCs por 100 m);
  use densidade 6–12 nas áreas cheias (praça, Subura, macellum) e 1–3 nas ruas secundárias.
