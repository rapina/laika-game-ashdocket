import { logicRandom } from './logicRng'

export type CardFamily = 'inquiry' | 'evidence' | 'objection' | 'appeal' | 'doubt'
export type CardTarget = 'enemy' | 'self'
export type CardId =
    | 'press' | 'brace' | 'record' | 'object' | 'cross' | 'rebuttal'
    | 'precedent' | 'ashTruth' | 'recess' | 'closing' | 'dismiss' | 'opening' | 'doubt'
export type EnemyId = 'jury' | 'clerk' | 'witness' | 'prosecutor' | 'bailiff' | 'archivist' | 'choir' | 'judge'
export type IntentKind = 'attack' | 'pierce' | 'curse' | 'ward'

export interface CardDefinition {
    id: CardId
    family: CardFamily
    target: CardTarget
    cost: number
}

export interface CardInstance {
    uid: string
    id: CardId
    upgraded: boolean
}

export interface EnemyDefinition {
    id: EnemyId
    hp: number
    openingBlock?: number
}

export interface Intent {
    kind: IntentKind
    amount: number
}

export interface IntentPreview {
    kind: IntentKind
    rawAmount: number
    effectiveAmount: number
}

export interface BattleState {
    trust: number
    maxTrust: number
    block: number
    focus: number
    enemyId: EnemyId
    enemyHp: number
    enemyMaxHp: number
    enemyBlock: number
    tier: number
    turn: number
    evidence: number
    weakened: number
    intent: Intent
    admissible: CardFamily | 'defense' | null
    drawPile: CardInstance[]
    discardPile: CardInstance[]
    hand: CardInstance[]
    familyCounts: Partial<Record<CardFamily, number>>
    cardsPlayed: number
    damageDealt: number
    damageTaken: number
    lastEvent: string
    over: boolean
    won: boolean
}

export const CARD_DEFS: Record<CardId, CardDefinition> = {
    press: { id: 'press', family: 'inquiry', target: 'enemy', cost: 1 },
    brace: { id: 'brace', family: 'objection', target: 'self', cost: 1 },
    record: { id: 'record', family: 'evidence', target: 'enemy', cost: 1 },
    object: { id: 'object', family: 'objection', target: 'self', cost: 1 },
    cross: { id: 'cross', family: 'inquiry', target: 'enemy', cost: 1 },
    rebuttal: { id: 'rebuttal', family: 'inquiry', target: 'enemy', cost: 2 },
    precedent: { id: 'precedent', family: 'evidence', target: 'self', cost: 1 },
    ashTruth: { id: 'ashTruth', family: 'evidence', target: 'enemy', cost: 2 },
    recess: { id: 'recess', family: 'appeal', target: 'self', cost: 2 },
    closing: { id: 'closing', family: 'appeal', target: 'enemy', cost: 2 },
    dismiss: { id: 'dismiss', family: 'objection', target: 'self', cost: 2 },
    opening: { id: 'opening', family: 'inquiry', target: 'enemy', cost: 0 },
    doubt: { id: 'doubt', family: 'doubt', target: 'self', cost: 1 },
}

export const ENEMIES: Record<EnemyId, EnemyDefinition> = {
    jury: { id: 'jury', hp: 24 },
    clerk: { id: 'clerk', hp: 28, openingBlock: 8 },
    witness: { id: 'witness', hp: 30 },
    prosecutor: { id: 'prosecutor', hp: 32 },
    bailiff: { id: 'bailiff', hp: 35 },
    archivist: { id: 'archivist', hp: 34, openingBlock: 5 },
    choir: { id: 'choir', hp: 36 },
    judge: { id: 'judge', hp: 60, openingBlock: 8 },
}

const REWARD_POOL: CardId[] = [
    'cross', 'rebuttal', 'precedent', 'ashTruth', 'recess', 'closing', 'dismiss', 'opening',
]

let uidCounter = 0

export function makeCard(id: CardId, upgraded = false): CardInstance {
    uidCounter += 1
    return { uid: `${id}-${uidCounter}`, id, upgraded }
}

export function createStartingDeck(): CardInstance[] {
    return [
        makeCard('press'), makeCard('press'), makeCard('press'), makeCard('press'),
        makeCard('brace'), makeCard('brace'), makeCard('brace'), makeCard('brace'),
        makeCard('record'), makeCard('object'),
    ]
}

export function shuffle<T>(items: T[], rng: () => number = logicRandom): T[] {
    const result = [...items]
    for (let i = result.length - 1; i > 0; i -= 1) {
        const j = Math.floor(rng() * (i + 1))
        ;[result[i], result[j]] = [result[j], result[i]]
    }
    return result
}

function getIntent(enemyId: EnemyId, turn: number, tier: number, enemyHp: number, enemyMaxHp: number): Intent {
    const scale = Math.floor(tier / 3)
    switch (enemyId) {
        case 'jury':
            return turn % 3 === 0 ? { kind: 'curse', amount: 1 } : { kind: 'attack', amount: 5 + scale }
        case 'clerk':
            return turn % 2 === 0 ? { kind: 'ward', amount: 6 + scale } : { kind: 'attack', amount: 6 + scale }
        case 'witness':
            return { kind: 'attack', amount: (turn % 2 === 0 ? 9 : 6) + scale }
        case 'prosecutor':
            return { kind: 'attack', amount: (turn % 3 === 0 ? 12 : 7) + scale }
        case 'bailiff':
            return turn % 2 === 1 ? { kind: 'pierce', amount: 4 + scale } : { kind: 'attack', amount: 11 + scale }
        case 'archivist':
            return turn % 3 === 0 ? { kind: 'ward', amount: 7 + scale } : { kind: 'attack', amount: 8 + scale }
        case 'choir':
            return { kind: 'attack', amount: (turn % 3 === 0 ? 14 : 7) + scale }
        case 'judge': {
            const phase = enemyHp <= enemyMaxHp / 2 ? 2 : 0
            if (turn % 4 === 0) return { kind: 'ward', amount: 8 }
            return { kind: 'attack', amount: (turn % 3 === 0 ? 12 : 9) + phase }
        }
    }
}

function judgeAdmissible(turn: number): CardFamily | 'defense' {
    const cycle: Array<CardFamily | 'defense'> = ['evidence', 'inquiry', 'defense']
    return cycle[(turn - 1) % cycle.length]
}

function replenishAndDraw(state: BattleState, count: number, rng: () => number): void {
    for (let i = 0; i < count; i += 1) {
        if (state.drawPile.length === 0 && state.discardPile.length > 0) {
            state.drawPile = shuffle(state.discardPile, rng)
            state.discardPile = []
        }
        const card = state.drawPile.pop()
        if (!card) break
        state.hand.push(card)
    }
}

export function createBattle(
    deck: CardInstance[],
    enemyId: EnemyId,
    trust: number,
    tier = 0,
    rng: () => number = logicRandom,
): BattleState {
    const enemy = ENEMIES[enemyId]
    const maxHp = enemy.hp + (enemyId === 'judge' ? 0 : tier * 3)
    const state: BattleState = {
        trust,
        maxTrust: 48,
        block: 0,
        focus: 3,
        enemyId,
        enemyHp: maxHp,
        enemyMaxHp: maxHp,
        enemyBlock: (enemy.openingBlock ?? 0) + (enemyId === 'archivist' ? tier : 0),
        tier,
        turn: 1,
        evidence: 0,
        weakened: 0,
        intent: getIntent(enemyId, 1, tier, maxHp, maxHp),
        admissible: enemyId === 'judge' ? judgeAdmissible(1) : null,
        drawPile: shuffle(deck.map((card) => ({ ...card })), rng),
        discardPile: [],
        hand: [],
        familyCounts: {},
        cardsPlayed: 0,
        damageDealt: 0,
        damageTaken: 0,
        lastEvent: 'hearing-started',
        over: false,
        won: false,
    }
    replenishAndDraw(state, 5, rng)
    return state
}

export function effectiveCost(state: BattleState, card: CardInstance): number {
    const def = CARD_DEFS[card.id]
    const clerkSeal = state.enemyId === 'clerk' && def.family === 'evidence' ? 1 : 0
    return Math.max(0, def.cost + clerkSeal - (card.upgraded && def.cost > 0 ? 0 : 0))
}

export function previewIntent(state: BattleState): IntentPreview {
    const reducible = state.intent.kind === 'attack' || state.intent.kind === 'pierce'
    return {
        kind: state.intent.kind,
        rawAmount: state.intent.amount,
        effectiveAmount: reducible
            ? Math.max(0, state.intent.amount - state.weakened)
            : state.intent.amount,
    }
}

function isAdmissible(state: BattleState, family: CardFamily): boolean {
    if (state.enemyId !== 'judge' || !state.admissible) return true
    if (state.admissible === 'defense') return family === 'objection' || family === 'appeal'
    return family === state.admissible
}

function dealEnemyDamage(state: BattleState, amount: number): number {
    const actual = Math.max(0, amount)
    const absorbed = Math.min(state.enemyBlock, actual)
    state.enemyBlock -= absorbed
    const hpDamage = actual - absorbed
    state.enemyHp = Math.max(0, state.enemyHp - hpDamage)
    state.damageDealt += hpDamage
    if (state.enemyHp === 0) {
        state.over = true
        state.won = true
        state.lastEvent = 'enemy-defeated'
    }
    return hpDamage
}

function addBlock(state: BattleState, amount: number): number {
    const actual = Math.max(0, amount)
    state.block += actual
    return actual
}

function healTrust(state: BattleState, amount: number): number {
    const adjusted = state.enemyId === 'prosecutor' ? Math.floor(amount / 2) : amount
    const before = state.trust
    state.trust = Math.min(state.maxTrust, state.trust + Math.max(0, adjusted))
    return state.trust - before
}

export interface PlayResult {
    ok: boolean
    reason?: 'over' | 'focus'
    damage: number
    block: number
    heal: number
    drawn: number
    evidence: number
    weakened: number
}

export function playCard(
    state: BattleState,
    handIndex: number,
    rng: () => number = logicRandom,
): PlayResult {
    const empty: PlayResult = { ok: false, damage: 0, block: 0, heal: 0, drawn: 0, evidence: 0, weakened: 0 }
    if (state.over) return { ...empty, reason: 'over' }
    const card = state.hand[handIndex]
    if (!card) return empty
    const cost = effectiveCost(state, card)
    if (cost > state.focus) return { ...empty, reason: 'focus' }

    const def = CARD_DEFS[card.id]
    state.focus -= cost
    state.hand.splice(handIndex, 1)
    state.cardsPlayed += 1
    state.familyCounts[def.family] = (state.familyCounts[def.family] ?? 0) + 1

    const admittedPenalty = isAdmissible(state, def.family) ? 0 : 2
    const upgraded = card.upgraded
    let damage = 0
    let block = 0
    let heal = 0
    let drawn = 0
    let evidence = 0
    let weakened = 0

    switch (card.id) {
        case 'press':
            damage = dealEnemyDamage(state, (upgraded ? 9 : 6) - admittedPenalty)
            break
        case 'brace':
            block = addBlock(state, (upgraded ? 8 : 5) - admittedPenalty)
            break
        case 'record':
            damage = dealEnemyDamage(state, (upgraded ? 5 : 3) - admittedPenalty)
            evidence = upgraded ? 2 : 1
            state.evidence += evidence
            break
        case 'object':
            block = addBlock(state, (upgraded ? 5 : 3) - admittedPenalty)
            weakened = upgraded ? 5 : 3
            state.weakened += weakened
            break
        case 'cross': {
            damage = dealEnemyDamage(state, (upgraded ? 7 : 5) - admittedPenalty)
            const before = state.hand.length
            replenishAndDraw(state, upgraded ? 2 : 1, rng)
            drawn = state.hand.length - before
            break
        }
        case 'rebuttal': {
            const intentBonus = state.intent.kind === 'attack' || state.intent.kind === 'pierce'
                ? (upgraded ? 7 : 5)
                : 0
            damage = dealEnemyDamage(state, (upgraded ? 12 : 9) + intentBonus - admittedPenalty)
            break
        }
        case 'precedent':
            evidence = upgraded ? 2 : 1
            state.evidence += evidence
            state.focus += 1
            break
        case 'ashTruth':
            damage = dealEnemyDamage(
                state,
                (upgraded ? 7 : 5) + state.evidence * (upgraded ? 4 : 3) - admittedPenalty,
            )
            break
        case 'recess':
            heal = healTrust(state, upgraded ? 8 : 5)
            block = addBlock(state, (upgraded ? 5 : 3) - admittedPenalty)
            break
        case 'closing':
            damage = dealEnemyDamage(state, (upgraded ? 7 : 4) - admittedPenalty)
            heal = healTrust(state, upgraded ? 5 : 3)
            break
        case 'dismiss':
            block = addBlock(state, (upgraded ? 15 : 10) - admittedPenalty)
            break
        case 'opening': {
            damage = dealEnemyDamage(state, (upgraded ? 4 : 2) - admittedPenalty)
            const before = state.hand.length
            replenishAndDraw(state, 1, rng)
            drawn = state.hand.length - before
            break
        }
        case 'doubt':
            break
    }

    if (card.id !== 'doubt') state.discardPile.push(card)
    state.lastEvent = card.id === 'doubt' ? 'doubt-burned' : `card-${card.id}`
    return { ok: true, damage, block, heal, drawn, evidence, weakened }
}

function hurtTrust(state: BattleState, amount: number, piercing = false): number {
    const incoming = Math.max(0, amount)
    let damage = incoming
    if (!piercing) {
        const absorbed = Math.min(state.block, incoming)
        state.block -= absorbed
        damage -= absorbed
    }
    state.trust = Math.max(0, state.trust - damage)
    state.damageTaken += damage
    return damage
}

export interface TurnResult {
    damage: number
    cursed: boolean
    ward: number
    witnessPenalty: number
}

export function endTurn(state: BattleState, rng: () => number = logicRandom): TurnResult {
    const result: TurnResult = { damage: 0, cursed: false, ward: 0, witnessPenalty: 0 }
    if (state.over) return result

    state.discardPile.push(...state.hand)
    state.hand = []
    const intentAmount = previewIntent(state).effectiveAmount
    if (state.intent.kind === 'attack') result.damage += hurtTrust(state, intentAmount)
    if (state.intent.kind === 'pierce') result.damage += hurtTrust(state, intentAmount, true)
    if (state.intent.kind === 'curse') {
        state.discardPile.push(makeCard('doubt'))
        result.cursed = true
    }
    if (state.intent.kind === 'ward') {
        state.enemyBlock += state.intent.amount
        result.ward = state.intent.amount
    }

    if (state.enemyId === 'witness' && Object.values(state.familyCounts).some((count) => (count ?? 0) >= 2)) {
        result.witnessPenalty = hurtTrust(state, 3, true)
        result.damage += result.witnessPenalty
    }

    if (state.trust <= 0) {
        state.over = true
        state.won = false
        state.lastEvent = 'trust-broken'
        return result
    }

    state.turn += 1
    state.block = 0
    state.focus = 3
    state.weakened = 0
    state.familyCounts = {}
    state.admissible = state.enemyId === 'judge' ? judgeAdmissible(state.turn) : null
    state.intent = getIntent(state.enemyId, state.turn, state.tier, state.enemyHp, state.enemyMaxHp)
    replenishAndDraw(state, 5, rng)
    state.lastEvent = 'new-turn'
    return result
}

export function rewardOptions(rng: () => number = logicRandom): CardId[] {
    return shuffle(REWARD_POOL, rng).slice(0, 3)
}

export function addReward(deck: CardInstance[], id: CardId): CardInstance[] {
    return [...deck, makeCard(id)]
}

export function upgradeFirst(deck: CardInstance[]): { deck: CardInstance[]; upgraded: CardInstance | null } {
    const index = deck.findIndex((card) => !card.upgraded && card.id !== 'doubt')
    if (index < 0) return { deck: deck.map((card) => ({ ...card })), upgraded: null }
    const result = deck.map((card) => ({ ...card }))
    result[index].upgraded = true
    return { deck: result, upgraded: result[index] }
}

export function familyProfile(deck: CardInstance[]): CardFamily {
    const counts: Partial<Record<CardFamily, number>> = {}
    for (const card of deck) {
        const family = CARD_DEFS[card.id].family
        if (family === 'doubt') continue
        counts[family] = (counts[family] ?? 0) + 1
    }
    return (Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'inquiry') as CardFamily
}
