# Fontes, método e limitações

Este jogo procura reproduzir Roma no **início de 44 a.C.** com base em fontes antigas e
arqueológicas. Este documento explica de onde vêm os dados, o que é reconstrução hipotética e
quais informações ainda faltam.

## 1. Método

1. **Pesquisa por tema** (`docs/pesquisa/01` a `11`): onze notas, cada uma com estado do local em
   50–44 a.C., dimensões com fonte e grau de confiança, materiais, anacronismos a evitar, lacunas e
   lista de fontes. Cada nota passou por uma **verificação adversarial independente** (seção
   "Verificação independente" no fim de cada arquivo).
2. **Textos antigos conferidos no original**: Lívio, Plínio o Velho, Vitrúvio, Varrão, Cícero,
   Suetônio, Plutarco, Apiano, Dião Cássio, Dionísio de Halicarnasso, Salústio, Estrabão, Tácito,
   Ovídio, Frontino, Plauto e outros, lidos nos arquivos TEI da *Perseus Digital Library*
   (repositórios `PerseusDL/canonical-latinLit` e `canonical-greekLit`). As passagens exatas estão
   citadas em cada nota.
3. **Fontes modernas** (Platner & Ashby, *A Topographical Dictionary of Ancient Rome*; *Digital
   Augustan Rome*; *Digitales Forum Romanum* (HU Berlin); Stanford *Digital Forma Urbis*;
   Britannica; Pleiades; entre outras) foram consultadas **por meio de resumos de busca**, porque o
   acesso direto à maioria dos sites estava bloqueado no ambiente de desenvolvimento. Os links
   estão nas notas; as frases atribuídas a cada página são as dos resumos.
4. **Posições**: coordenadas do gazetteer **Pleiades** (CC BY 3.0, muitas derivadas do
   OpenStreetMap), convertidas para o sistema local do jogo (`docs/pesquisa/00-coordenadas.md`,
   `src/data/places.js`). Elas marcam as ruínas atuais (muitas vezes de fases imperiais), com
   acurácia típica de ~20 m; as plantas republicanas foram ajustadas em torno delas.
5. **Relevo**: modelo digital de elevação Tilezen/Mapzen *Terrarium* (SRTM ~30 m / EU-DEM —
   "SRTM data courtesy of the U.S. Geological Survey"; "Produced using Copernicus data and
   information funded by the European Union – EU-DEM layers"), suavizado e corrigido para o nível
   antigo com as cotas documentadas (Fórum ≈ 13 m s.n.m.; Capitólio 44,5–45,5 m; sela 36,5 m) —
   ver `scripts/build-terrain.py` e `src/data/topography.js`. A correção nos demais pontos é
   **hipótese** (aterro estimado de 9 m nos vales a 3 m nos cumes).
6. **Plano de implantação** (`docs/LAYOUT.md`): fixa o momento (início de 44 a.C.) e o estado de
   cada edifício (obras da Cúria Júlia, nova Rostra, Basílica Emília em reconstrução etc.).

## 2. Como o jogo sinaliza incertezas

- Cada edifício importante tem um painel (tecla **I**) com: nome em português e latim, datas,
  descrição, **"Reconstrução hipotética: …"** quando a forma não é conhecida, e as fontes.
- Formas e dimensões não documentadas foram modeladas por analogia (proporções de Vitrúvio,
  edifícios contemporâneos, fases posteriores usadas só como envelope máximo) e declaradas.

## 3. Pontos historicamente delicados (decisões tomadas)

- **"Domus de Crasso"**: a casa famosa pelas colunas de mármore do Himeto (Plínio, *NH* 17.1–6 e
  36.7) era de **L. Licínio Crasso, o orador** (morto em 91 a.C.), não de M. Licínio Crasso, o
  triúnviro, que **morreu em Carras em 53 a.C.** e vendera a Cícero, em 62 a.C., uma casa no
  Palatino. A casa do jogo ("Casa Licínia") é uma reconstrução hipotética que reúne esses dados e
  explica a questão na placa de entrada (nota 06).
- **Latrinas públicas (foricae)**: não foi encontrada evidência direta de latrinas públicas
  coletivas em Roma datadas de 50–44 a.C.; a palavra *forica* só aparece em autor imperial
  (Juvenal). A latrina do jogo é **reconstrução hipotética** baseada em exemplos posteriores e
  declarada como tal (nota 09).
- **Soldados**: tropas armadas não circulavam normalmente dentro do pomério; os poucos soldados
  do jogo aparecem sem armas de arremesso (nota 11).
- **Falas dos NPCs** em latim são frases simples compostas para o jogo, não citações.

## 4. Limitações conhecidas

- A cota de buscas na web do ambiente de desenvolvimento esgotou-se durante a pesquisa; várias
  afirmações modernas (dimensões arqueológicas) não puderam ser reconferidas pelos verificadores,
  que se limitaram às fontes antigas. Essas afirmações estão marcadas nas notas (⚠ não confirmado).
- Obras de referência que resolveriam muitas lacunas **não foram acessadas**: F. Coarelli, *Il
  Foro Romano*; E. M. Steinby (ed.), *Lexicon Topographicum Urbis Romae* (LTUR); P. Carafa, *Il
  Comizio di Roma*; A. Carandini (ed.), *Atlante di Roma antica*; publicações das escavações do
  Fórum de César; plantas georreferenciadas das escavações do Palatino.
- As lacunas detalhadas de cada local estão na seção "Lacunas e incertezas" de cada nota.

## 5. Notas de pesquisa

| Nota | Tema |
|---|---|
| [00](pesquisa/00-coordenadas.md) | Coordenadas de referência (Pleiades) |
| [01](pesquisa/01-forum-oeste.md) | Fórum — oeste: Saturno, Concórdia, Tabularium, Véiove, Carcer, Rostra de César |
| [02](pesquisa/02-forum-norte.md) | Fórum — norte: Comício, Cúria, Rostra, Graecostasis, Basílica Emília |
| [03](pesquisa/03-forum-sul-leste.md) | Fórum — sul/leste: Basílica Júlia, Castor, Vesta, Regia, Via Sacra |
| [04](pesquisa/04-forum-iulium.md) | Fórum de César e Vênus Genetrix |
| [05](pesquisa/05-capitolio.md) | Capitólio: Júpiter Ótimo Máximo, Arx, Juno Moneta |
| [06](pesquisa/06-palatino-domus.md) | Palatino e a Domus de Crasso |
| [07](pesquisa/07-subura-insulae.md) | Subura, insulae e a casa da plebe |
| [08](pesquisa/08-macellum-mercado.md) | Macellum, mercados e produtos |
| [09](pesquisa/09-foricae-agua.md) | Latrinas, esgotos e água |
| [10](pesquisa/10-circo-topografia.md) | Circo Máximo, topografia, muralha, ruas, Tibre |
| [11](pesquisa/11-materiais-pessoas.md) | Materiais, cores, vestuário, soldados, vida urbana |
