/**
 * Tipos de NPC (habitantes de Roma) — aparência e falas.
 *
 * Vestuário (ver docs/pesquisa/11-materiais-pessoas.md para as fontes):
 *   - cidadãos adultos do sexo masculino em ocasiões públicas: toga de lã branca/natural
 *     sobre a túnica;
 *   - magistrados: toga praetexta (borda púrpura);
 *   - senadores: túnica com latus clavus (faixa púrpura larga);
 *   - mulheres: stola e palla (manto que podia cobrir a cabeça);
 *   - escravos e trabalhadores: túnica simples, cores de lã natural;
 *   - lictores: acompanham magistrados levando os fasces;
 *   - soldados: em princípio não andavam armados dentro do pomério (exceto triunfos) —
 *     por isso aparecem raramente e sem armas de arremesso.
 *
 * As falas são frases latinas simples compostas para o jogo (não são citações históricas).
 *
 * As cores de tecido são tons plausíveis de lã natural e tinturas comuns (garança,
 * pastel-dos-tintureiros, ocre); são escolhas estéticas, não dados de fonte.
 */

/** Paletas de cores (sRGB hex). */
export const PALETTE = {
  skin: ['#c8946c', '#b98258', '#d6a47c', '#a8714a', '#8a5a3a', '#e0b48e', '#6e4630'],
  hair: ['#1e1712', '#2b1f17', '#3a2a1e', '#4c3524', '#1a1a1a', '#6a4a2c'],
  woolNatural: ['#e6dcc6', '#d8ccb0', '#cbbd9e', '#b8a888', '#9c8c70', '#8a7d68'],
  dyed: ['#8e3b2c', '#a8552f', '#6b5a3a', '#4d5a6a', '#7a6a3a', '#5e4a3c', '#9a7a46'],
  toga: ['#ece6d6', '#e4dcc8', '#f0ebe0'],
  purple: '#5a1f3a',
  bronze: '#9a7440',
  iron: '#5a5856',
  shieldRed: '#7d2a1e',
  wood: '#6b4a2e',
};

const pick = (arr, r) => arr[Math.floor(r() * arr.length) % arr.length];

/**
 * Definições de tipo. `make(rng)` devolve a descrição visual de um indivíduo:
 *   { skin, hair, tunic, robe?, toga?, togaBorder?, veil?, helmet?, shield?, fasces?, carry?, female?, scale }
 */
export const NPC_TYPES = {
  citizen: {
    label: 'Cidadão',
    make: (r) => {
      const togate = r() < 0.55;
      return {
        skin: pick(PALETTE.skin, r),
        hair: pick(PALETTE.hair, r),
        tunic: pick([...PALETTE.woolNatural, ...PALETTE.dyed], r),
        robe: togate ? pick(PALETTE.toga, r) : null,
        toga: togate ? pick(PALETTE.toga, r) : null,
        scale: 0.96 + r() * 0.08,
      };
    },
    lines: [
      ['Salve!', 'Olá!'],
      ['Quid agis?', 'Como vais?'],
      ['Bene valeo.', 'Estou bem.'],
      ['Vale!', 'Adeus!'],
    ],
  },
  senator: {
    label: 'Senador',
    make: (r) => ({
      skin: pick(PALETTE.skin.slice(0, 6), r),
      hair: pick(PALETTE.hair, r),
      tunic: '#ece6d6',
      tunicStripe: PALETTE.purple,
      robe: '#efe9dc',
      toga: '#efe9dc',
      togaBorder: PALETTE.purple,
      scale: 0.97 + r() * 0.06,
    }),
    lines: [
      ['Salve, civis.', 'Saudações, cidadão.'],
      ['Senatus populusque Romanus.', 'O Senado e o Povo Romano.'],
      ['Ad senatum propero.', 'Apresso-me para a sessão do Senado.'],
    ],
  },
  woman: {
    label: 'Mulher',
    make: (r) => ({
      female: true,
      skin: pick(PALETTE.skin, r),
      hair: pick(PALETTE.hair, r),
      tunic: pick([...PALETTE.woolNatural, ...PALETTE.dyed], r),
      robe: pick([...PALETTE.woolNatural, ...PALETTE.dyed], r),
      veil: r() < 0.6 ? pick([...PALETTE.woolNatural, ...PALETTE.dyed], r) : null,
      carry: r() < 0.15 ? 'basket' : null,
      scale: 0.9 + r() * 0.06,
    }),
    lines: [
      ['Salve!', 'Olá!'],
      ['Ad macellum eo.', 'Vou ao mercado.'],
      ['Vale!', 'Adeus!'],
    ],
  },
  slave: {
    label: 'Escravo',
    make: (r) => ({
      skin: pick(PALETTE.skin, r),
      hair: pick(PALETTE.hair, r),
      tunic: pick(PALETTE.woolNatural.slice(2), r),
      carry: r() < 0.45 ? pick(['amphora', 'sack', 'basket'], r) : null,
      scale: 0.94 + r() * 0.08,
    }),
    lines: [
      ['Festino!', 'Estou com pressa!'],
      ['Domino meo serviendum est.', 'Preciso servir o meu senhor.'],
    ],
  },
  merchant: {
    label: 'Comerciante',
    make: (r) => ({
      skin: pick(PALETTE.skin, r),
      hair: pick(PALETTE.hair, r),
      tunic: pick([...PALETTE.dyed, ...PALETTE.woolNatural], r),
      apron: pick(['#7a6a52', '#5e5040', '#8a7a5e'], r),
      scale: 0.95 + r() * 0.08,
    }),
    lines: [
      ['Salve! Quid vis emere?', 'Olá! O que queres comprar?'],
      ['Pisces recentes!', 'Peixes frescos!'],
      ['Vinum bonum!', 'Vinho bom!'],
      ['Quantum das?', 'Quanto ofereces?'],
    ],
  },
  lictor: {
    label: 'Lictor',
    make: (r) => ({
      skin: pick(PALETTE.skin, r),
      hair: pick(PALETTE.hair, r),
      tunic: '#d9cfb8',
      robe: '#ddd5c2',
      toga: '#ddd5c2',
      fasces: true,
      scale: 0.98 + r() * 0.05,
    }),
    lines: [['Date viam!', 'Abram caminho!']],
  },
  soldier: {
    label: 'Soldado',
    make: (r) => ({
      skin: pick(PALETTE.skin, r),
      hair: pick(PALETTE.hair, r),
      tunic: pick(['#8e3b2c', '#cbbd9e', '#a8552f'], r),
      armor: PALETTE.iron,
      helmet: PALETTE.bronze,
      shield: r() < 0.5 ? PALETTE.shieldRed : null,
      scale: 0.98 + r() * 0.05,
    }),
    lines: [
      ['Ave!', 'Salve!'],
      ['Miles sum Caesaris.', 'Sou soldado de César.'],
    ],
  },
  child: {
    label: 'Criança',
    make: (r) => ({
      skin: pick(PALETTE.skin, r),
      hair: pick(PALETTE.hair, r),
      tunic: pick(PALETTE.woolNatural, r),
      scale: 0.62 + r() * 0.1,
    }),
    lines: [['Salve!', 'Olá!']],
  },
};

/** Pesos padrão de tipos em ruas comuns. */
export const DEFAULT_MIX = { citizen: 4, woman: 3, slave: 3, merchant: 1, child: 1, senator: 0.3, soldier: 0.15 };
