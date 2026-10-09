# Roma — República tardia (c. 50–44 a.C.)

Exploração 3D interativa, em primeira pessoa, da cidade de Roma no auge do poder de Júlio César
(momento fixado: **início de 44 a.C.**, antes dos Idos de Março). Feito com **Three.js** e **Vite**,
roda 100% no navegador — sem servidores, sem arquivos de modelo ou textura externos (tudo é
gerado proceduralmente no carregamento).

A reconstrução segue notas de pesquisa com fontes antigas e arqueológicas
(`docs/pesquisa/`). Onde os dados faltam, o jogo diz explicitamente que se trata de
reconstrução hipotética (tecla **I** perto de cada monumento). Bibliografia e limitações:
[`docs/FONTES.md`](docs/FONTES.md).

## Como rodar localmente

Requisitos: **Node.js 18+** (testado com Node 22) e um navegador com WebGL 2
(Chrome, Edge ou Firefox recentes).

```bash
cd roma-republica-3d
npm install
npm run dev
```

Abra o endereço mostrado no terminal (normalmente <http://localhost:5173>).

Para gerar a versão estática (pasta `dist/`, pode ser publicada em qualquer servidor estático):

```bash
npm run build
npm run preview   # serve o build em http://localhost:4173
```

> Abrir `dist/index.html` direto pelo sistema de arquivos (`file://`) não funciona em todos os
> navegadores por causa dos módulos ES — use `npm run preview` ou qualquer servidor estático.

## Controles

| Tecla | Ação |
|---|---|
| Clique | capturar o mouse (olhar ao redor) |
| W A S D / setas | andar |
| Shift | correr |
| Espaço | pular |
| E | falar com a pessoa à sua frente |
| I | informação histórica do local (fontes e incertezas) |
| T | menu de teleporte (também no botão **Locais**, canto superior direito) |
| F | modo voo (Q/E descer/subir) |
| V | 1ª / 3ª pessoa |
| H | ajuda |
| Esc | soltar o mouse |

O botão de engrenagem (canto superior direito) ajusta a qualidade gráfica, a hora do dia, o
volume do som ambiente (desligado por padrão — ligue no ícone de alto-falante) e as pessoas (NPCs).

## Parâmetros de URL (úteis para testes)

| Parâmetro | Efeito |
|---|---|
| `?quality=low\|medium\|high` | preset gráfico |
| `?tp=templo-saturno` | começa num local do menu de teleporte |
| `?sites=forum-oeste,forum-praca` | constrói só alguns sítios (carregamento rápido) |
| `?time=17` | hora do dia (6–18) |
| `?npcs=0` | sem pessoas |
| `?debug=1` | estatísticas de renderização |

## Estrutura do projeto

Resumo em [`docs/ARQUITETURA.md`](docs/ARQUITETURA.md): motor (`src/core`), biblioteca
arquitetônica paramétrica (`src/arch`), um módulo por sítio (`src/sites`), NPCs (`src/npc`),
áudio procedural (`src/audio`) e interface (`src/ui`).

## Desempenho

- Geometria estática fundida por material (poucas draw calls), objetos repetidos e pessoas em
  `InstancedMesh`, terreno em blocos com níveis de detalhe, culling por frustum e por distância.
- Sombras de um único mapa que acompanha o jogador.
- Se o jogo ficar lento, use a qualidade **Baixa** nas configurações.

## Créditos dos dados

- Coordenadas dos monumentos: *Pleiades gazetteer* (CC BY 3.0), muitas derivadas do OpenStreetMap.
- Textos antigos conferidos no corpus aberto da Perseus Digital Library.
- Demais fontes: ver `docs/pesquisa/*.md` e `docs/FONTES.md`.
