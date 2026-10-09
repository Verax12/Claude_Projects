# Arquitetura do código — guia para desenvolvedores

Este documento descreve como o jogo está organizado e **como escrever um sítio** (módulo que
constrói uma parte da cidade). Leia-o inteiro antes de modificar qualquer coisa.

## 1. Visão geral

```
src/
  main.js              ponto de entrada
  core/
    config.js          presets de qualidade e parâmetros de URL
    geo.js             coordenadas, rumos (facingRotY), pé romano (PES)
    Engine.js          monta tudo e executa o laço principal
    World.js           cena, colisão (BVH), instâncias, locais, informações, áreas
    Builder.js         API de modelagem (funde geometria por material)
    Terrain.js         relevo (grade de 4 m), pads de nivelamento, LOD
    Environment.js     céu, sol, sombras, neblina, IBL
    Player.js          controle em 1ª/3ª pessoa, colisão por cápsula
  render/
    noise.js           ruído procedural tileável
    textures.js        texturas procedurais (canvas)
    materials.js       biblioteca de materiais (chaves → MeshStandardMaterial)
    geom.js            primitivas com UV em metros
  arch/                biblioteca arquitetônica reutilizável
    columns.js         column(), entablature(), colonnade(), pier(), arch()
    roofs.js           gableRoof(), hipRoof(), shedRoof(), compluviateRoof()
    temple.js          podiumTemple(), tholos(), statue()
    buildings.js       portico(), basilica(), taberna(), insula(), houseBlock(), wallLine()
    props.js           propGeometry(), prop(), stall()
    vegetation.js      Vegetation (instanciada)
  npc/                 NPCSystem (pessoas instanciadas) e npcTypes (aparência, falas)
  audio/               AudioSystem (som ambiente procedural)
  ui/                  UI (HUD, teleporte, informação) e styles.css
  data/
    places.js          âncoras geográficas (Pleiades) no sistema local
    topography.js      colinas, vales, Tibre
  sites/               UM ARQUIVO (ou pasta) POR SÍTIO — ver §3
docs/
  pesquisa/            notas de pesquisa histórica com fontes (base de TODA a modelagem)
  FONTES.md            bibliografia e limitações
scripts/shot.mjs       capturas de tela automatizadas (Chromium headless)
```

## 2. Convenções do mundo

- **1 unidade = 1 metro.** `+X = leste`, `−Z = norte` (logo `+Z = sul`), `+Y = cima`.
- **Origem**: 41.8925° N, 12.4850° E. **y = 0 = pavimento do Fórum Romano na República tardia.**
- Coordenadas de monumentos: `src/data/places.js` (nomes em inglês do Pleiades, ex.:
  `place('Temple of Castor and Pollux (Rome)')` → `{x, z}`). Elas marcam as **ruínas atuais**
  (fases muitas vezes imperiais) com acurácia de ~20 m; ajuste pela planta republicana descrita
  em `docs/pesquisa`.
- **Quadro local de edifícios**: a fachada/entrada principal aponta para **+Z local**.
  `geo.facingRotY(rumo)` dá a rotação para a fachada apontar para o rumo de bússola
  (0 = norte, 90 = leste, 180 = sul, 270 = oeste). `geo.bearing(a, b)` calcula o rumo de a para b.
- **Época fixada**: início de 44 a.C. (antes dos Idos de Março). Onde a pesquisa indica obras
  (Cúria Júlia, Basílica Júlia inacabada, Basílica Emília em reconstrução, Fórum de César
  inacabado, nova Rostra de César), represente o estado de obra (andaimes, blocos, gruas de madeira).

## 3. Como escrever um sítio

Cada sítio é um módulo em `src/sites/` que exporta:

```js
export default {
  id: 'forum-oeste',               // id único (usado em ?sites=)
  name: 'Fórum Romano — lado oeste',
  shapeTerrain(ctx) {               // ANTES do terreno ser gerado
    ctx.terrain.addPad({ rect: { x, z, w, d, rotY }, height: 0, blend: 6 });
    ctx.reserve({ rect: { x, z, w, d, rotY } }); // área que o preenchimento urbano deve evitar
  },
  build(ctx) {                      // DEPOIS do terreno
    const b = ctx.builder('forum-oeste');
    // ... modelagem ...
    b.finish();                     // OBRIGATÓRIO: funde e registra colisão
    ctx.addLocation({...}); ctx.addInfo({...}); ctx.addArea({...});
    ctx.npcs.addPath([...]); ctx.audio.addZone({...}); ctx.vegetation.add(...);
  },
};
```

O registro fica em `src/sites/index.js` (já contém todos os sítios previstos — não edite).

### 3.1 O objeto `ctx`

| Campo | Uso |
|---|---|
| `ctx.builder(nome, opts)` | cria um `Builder` (opts: `interior`, `maxDistance`, `chunkSize`, `castShadow`) |
| `ctx.terrain` | `heightAt(x,z)`, `addPad(...)` (só em shapeTerrain), `markUrban(...)`, `normalAt` |
| `ctx.world` | `instances(chave, geometria, material, opts)` → lote instanciado (`.add(x,y,z,rotY,escala,cor)`); `addCollider(geom)` |
| `ctx.vegetation.add(tipo, x, z, {scale, y})` | cypress, pine, plane, olive, fig, laurel, shrub, grass |
| `ctx.npcs` | `addPath(pontos, {loop, mix, density, width})`, `addStatic({x,y,z,yaw,type,pose})`, `addGroup({points, leader, followers})` |
| `ctx.audio.addZone({x,z,radius,type,gain})` | tipos: crowd, market, water, workshop, animals, quiet |
| `ctx.addLocation({id,name,latin,group,x,z,y?,lookBearing})` | entrada no menu de teleporte (`y` = cota do piso, para interiores/andares) |
| `ctx.addInfo({x,z,y?,radius,title,latin,date,text,uncertain,sources})` | painel histórico (tecla I) |
| `ctx.addArea({name,latin,rect|points|circle,priority})` | nome exibido ao entrar na área |
| `ctx.reserve(rect|points|circle)` / `ctx.isReserved(x,z,margem)` | reservas de área |
| `ctx.rng(seed)` | aleatório determinístico |
| `ctx.geo` | `facingRotY`, `bearing`, `place`, `offsetByBearing`, `PES` |

### 3.2 Builder (core/Builder.js)

- Primitivas posicionadas pela **base** (y = cota inferior), em coordenadas do quadro local.
- `b.push(x, y, z, rotY)` / `b.pop()` — pilha de quadros (aninhável).
- `b.box(w, h, d, x, y, z, {mat, rotY, color, collide, fit, faces})` — colide por padrão.
- `b.cylinder(rBase, rTopo, h, x, y, z, {mat, segments, collide})`.
- `b.lathe(perfil[[r,y]...], x, y, z, {mat, segments})`; `b.prism(pontos[[x,z]...], h, y, {mat})`.
- `b.quad(a,b,c,d,{mat})`, `b.tri(a,b,c,{mat})` — pontos [x,y,z] anti-horários vistos da face visível.
- `b.floor(w, d, x, yTopo, z, {mat})`; `b.sphere(r, x, y, z, {mat})`.
- `b.wall(x0, x1, z, h, espessura, {y, mat, openings:[{at, w, h, y}]})` — parede ao longo de X com
  portas/janelas (aberturas são atravessáveis). `b.wallAB(xa,za,xb,zb,h,t,opts)` entre dois pontos.
- `b.stairs(w, profundidade, h, x, y, z0, {mat, steps})` — sobe na direção **−Z local** a partir de z0,
  com rampa de colisão invisível.
- `b.colliderBox(...)`, `b.colliderRamp(...)`, `b.collider(geom)` — colisão invisível.
- `b.add(geom, {mat, matrix, color, collide})` — geometria arbitrária.
- `b.finish()` — **sempre chamar** ao final.

**Colisão**: o jogador colide com tudo que tiver `collide` verdadeiro (caixas por padrão) e com o
terreno. Interiores visitáveis exigem pisos com colisão (use `b.box` para pisos de andares, não
`b.floor`, que não colide) e escadas (`b.stairs`). Portas: use aberturas em `b.wall`.

### 3.3 Materiais (render/materials.js)

`tufa`, `tufaGrey` (cappellaccio), `peperino`, `travertine`, `marble`, `marbleGrey`, `stucco`,
`opusIncertum`, `reticulatum`, `plaster` (tingível com `color`), `plasterPoor` (fit),
`paintFirstStyle` (fit), `paintSecondStyle` (fit), `paintSecondStyleBlack` (fit), `roofTile`,
`basalt`, `slabs`, `slabsTufa`, `dirt`, `signinum`, `mosaic` (fit), `wood`, `woodDark`,
`woodLight`, `cloth`, `clothStriped`, `bronze`, `gold`, `iron`, `terracotta`,
`terracottaPainted`, `paintRed`, `paintBlue`, `paintYellow`, `flat` (cor pura via `color`),
`water`, `foliage`, `flame`.
Sufixos: `<base>Fluted` (caneluras; usado automaticamente por `column`), `@interior`
(menos luz do céu; aplicado automaticamente com `ctx.builder(nome, { interior: true })`).
Materiais *fit* esperam UV 0–1 por face (pinturas murais, mosaicos de piso).

### 3.4 Biblioteca arquitetônica (src/arch)

- `column(b, x, y, z, {order, height, diameter, mat, fluted, base, collide})` → `{top}`.
- `entablature(b, x0, x1, z, d, y, {order, mat, colH, height, triglyphs})` → cota do topo.
- `arch(b, x, y, z, vão, profundidade, {mat, thickness})`; `pier(...)`.
- `podiumTemple(b, {...})` — ver JSDoc em `arch/temple.js` (largura, comprimento, pódio, escadas,
  ordem, colunas na frente/profundidade, layout prostyle|peripteral|sine-postico, cellae 1|3…).
- `tholos(b, {...})` — templo redondo. `statue(b, x, y, z, {scale, mat, seated})` — marcador.
- `gableRoof`, `hipRoof`, `shedRoof`, `compluviateRoof` (átrio).
- `portico`, `basilica`, `taberna`, `insula` (exterior sólido), `houseBlock`, `wallLine`.
- `prop(b, nome, x, y, z, rotY, escala)`; `propGeometry(nome)` para instanciar;
  `stall(b, x, y, z, rotY, {goods})` — banca de mercado.

Se precisar de um componente novo, crie-o **dentro do seu próprio arquivo/pasta de sítio**.

## 4. Orçamento de desempenho (por sítio)

- Um `Builder` gera **uma malha por material** usado → prefira ≤ 12 materiais por builder.
  Divida sítios grandes em poucos builders (ex.: exterior + interior com `interior: true`).
- Objetos repetidos (> 30 cópias: ânforas, bancos, telhas especiais, blocos de entulho) →
  `ctx.world.instances(...)` em vez de geometria fundida.
- Detalhes pequenos (props, mobiliário) → builder separado com `maxDistance: 60–120`.
- Meta de triângulos: sítio comum < 150 mil; sítios grandes (Fórum inteiro) < 400 mil.
- Colisão: use caixas simples; colunas já trazem colisor octogonal.

## 5. Fidelidade histórica (regras)

1. **Toda escolha de modelagem (dimensões, nº de colunas, ordem, materiais, estado de obra)
   deve vir de `docs/pesquisa/`**. Não invente números. Quando a pesquisa disser NÃO ENCONTRADO
   ou indicar hipótese, modele de forma plausível e **declare no painel de informação**
   (`uncertain: 'Reconstrução hipotética: ...'`).
2. Painéis de informação (`ctx.addInfo`) em português do Brasil: título, nome latino, data,
   2–4 parágrafos curtos, `uncertain` quando couber, `sources` (fontes antigas e modernas da nota).
3. Nada de elementos imperiais posteriores (Coliseu, Panteão de Agripa, Fóruns de Augusto/Trajano,
   Templo do Divo Júlio, Arco de Tibério/Sétimo Severo, obelisco do Circo etc.).
4. Falas de NPC: frases latinas simples (ver npcTypes.js) — não as apresente como citações.

## 6. Testes

```bash
npm install
node scripts/shot.mjs --sites=forum-oeste --views='[{"cam":[x,y,z,rumoGraus,inclinacaoGraus],"name":"vista1"},{"tp":"templo-saturno","name":"tp"}]' --out=screenshots/forum-oeste
npx vite build        # precisa compilar sem erros
```

- `cam` usa rumo em graus (0 = olhando para o norte, 90 = leste) e inclinação (negativo = para baixo).
- Abra os PNG gerados (ferramenta Read) e confira visualmente; o script imprime erros do console e
  estatísticas (draw calls, triângulos).
- Para ver só o seu sítio com contexto, combine ids: `--sites=forum-praca,forum-oeste`.

## 7. Locais de teleporte (ids canônicos)

| id | Grupo | Sítio responsável |
|---|---|---|
| `via-sacra` | Fórum Romano | forum-praca |
| `templo-saturno`, `templo-concordia`, `tabularium`, `rostra` | Fórum Romano | forum-oeste |
| `comicio`, `curia`, `basilica-emilia` | Fórum Romano | forum-norte |
| `basilica-julia`, `templo-castor`, `templo-vesta` | Fórum Romano | forum-sudeste |
| `forum-iulium` | Fórum de César | forum-iulium |
| `templo-jupiter` | Capitólio | capitolio |
| `palatino` | Palatino | palatino |
| `domus-crasso` | Palatino | domus-crasso |
| `macellum` | Comércio | macellum |
| `subura` | Bairros | subura |
| `casa-plebe` | Bairros | casa-plebe |
| `foricae` | Bairros | foricae |
| `circo-maximo` | Arredores | circo-maximo |
