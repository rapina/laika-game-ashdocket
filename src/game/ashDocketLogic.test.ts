import { describe, expect, it } from 'vitest'
import {
    CARD_DEFS,
    addReward,
    createBattle,
    createStartingDeck,
    effectiveCost,
    endTurn,
    makeCard,
    playCard,
    previewIntent,
    rewardOptions,
    upgradeFirst,
} from './ashDocketLogic'
import { setLogicRandomSeed } from './logicRng'

const zero = () => 0

describe('Ash Docket battle rules', () => {
    it('starts each hearing with five cards, three Focus, and a visible intent', () => {
        const battle = createBattle(createStartingDeck(), 'jury', 48, 0, zero)
        expect(battle.hand).toHaveLength(5)
        expect(battle.focus).toBe(3)
        expect(battle.intent).toEqual({ kind: 'attack', amount: 5 })
        expect(battle.trust).toBe(48)
    })

    it('spends Focus, applies attack damage through enemy block, and cycles the hand', () => {
        const battle = createBattle([makeCard('press'), makeCard('brace'), makeCard('record')], 'clerk', 48, 0, zero)
        const pressIndex = battle.hand.findIndex((card) => card.id === 'press')
        const played = playCard(battle, pressIndex, zero)
        expect(played.ok).toBe(true)
        expect(battle.focus).toBe(2)
        expect(battle.enemyBlock).toBe(2)
        expect(battle.enemyHp).toBe(battle.enemyMaxHp)
        endTurn(battle, zero)
        expect(battle.turn).toBe(2)
        expect(battle.focus).toBe(3)
        expect(battle.hand.length).toBeGreaterThan(0)
    })

    it('makes evidence costlier against the clerk and halves recovery against the prosecutor', () => {
        const evidence = makeCard('record')
        const clerk = createBattle([evidence], 'clerk', 48, 0, zero)
        expect(effectiveCost(clerk, clerk.hand[0])).toBe(2)

        const prosecutor = createBattle([makeCard('recess')], 'prosecutor', 30, 0, zero)
        const result = playCard(prosecutor, 0, zero)
        expect(result.heal).toBe(2)
        expect(prosecutor.trust).toBe(32)
    })

    it('punishes repeated card families only for the hostile witness', () => {
        const deck = [makeCard('press'), makeCard('cross'), makeCard('brace')]
        const witness = createBattle(deck, 'witness', 48, 0, zero)
        playCard(witness, witness.hand.findIndex((card) => card.id === 'press'), zero)
        playCard(witness, witness.hand.findIndex((card) => card.id === 'cross'), zero)
        const result = endTurn(witness, zero)
        expect(result.witnessPenalty).toBe(3)
        expect(result.damage).toBe(9)
        expect(witness.trust).toBe(39)
    })

    it('updates the visible incoming damage immediately after an Objection', () => {
        const battle = createBattle([makeCard('object'), makeCard('press')], 'clerk', 48, 0, zero)
        expect(previewIntent(battle)).toMatchObject({ rawAmount: 6, effectiveAmount: 6 })
        playCard(battle, battle.hand.findIndex((card) => card.id === 'object'), zero)
        expect(previewIntent(battle)).toMatchObject({ rawAmount: 6, effectiveAmount: 3 })
        const turn = endTurn(battle, zero)
        expect(turn.damage).toBe(0)
        expect(battle.trust).toBe(48)
    })

    it('reports ward gain as a positive intent without applying Objection reduction', () => {
        const battle = createBattle([makeCard('object')], 'clerk', 48, 0, zero)
        endTurn(battle, zero)
        expect(previewIntent(battle)).toMatchObject({ kind: 'ward', rawAmount: 6, effectiveAmount: 6 })
        playCard(battle, 0, zero)
        expect(previewIntent(battle).effectiveAmount).toBe(6)
    })

    it('rotates the High Judge admissibility and reduces off-family effects', () => {
        const judge = createBattle(
            [makeCard('press'), makeCard('brace'), makeCard('record'), makeCard('object'), makeCard('opening')],
            'judge',
            48,
            8,
            zero,
        )
        expect(judge.admissible).toBe('evidence')
        const press = judge.hand.findIndex((card) => card.id === 'press')
        const result = playCard(judge, press, zero)
        expect(result.damage).toBe(0)
        expect(judge.enemyBlock).toBe(4)
        endTurn(judge, zero)
        expect(judge.admissible).toBe('inquiry')
    })

    it('creates three distinct draft choices and preserves upgrades in the deck', () => {
        const options = rewardOptions(() => 0.42)
        expect(options).toHaveLength(3)
        expect(new Set(options).size).toBe(3)
        const grown = addReward(createStartingDeck(), options[0])
        expect(grown).toHaveLength(11)
        const upgraded = upgradeFirst(grown)
        expect(upgraded.upgraded).not.toBeNull()
        expect(upgraded.deck.some((card) => card.upgraded)).toBe(true)
    })

    it('keeps all production cards assigned to a playable family and target', () => {
        const productionIds = ['press', 'brace', 'record', 'object', 'cross', 'rebuttal', 'precedent', 'ashTruth', 'recess', 'closing', 'dismiss', 'opening'] as const
        for (const id of productionIds) {
            expect(CARD_DEFS[id].family).toMatch(/inquiry|evidence|objection|appeal/)
            expect(CARD_DEFS[id].target).toMatch(/enemy|self/)
        }
    })

    it('allows a planned recovery/evidence build to reach and win the final verdict', () => {
        setLogicRandomSeed('release-balance-27')
        let deck = createStartingDeck()
        let trust = 48
        const route = ['jury', 'clerk', 'archivist', 'jury', 'witness', 'archivist', 'clerk', 'prosecutor', 'judge'] as const
        const drafts = ['recess', 'ashTruth', 'precedent', 'recess', 'ashTruth', 'dismiss', 'closing', 'rebuttal'] as const

        for (let hearing = 0; hearing < route.length; hearing += 1) {
            const battle = createBattle(deck, route[hearing], trust, hearing)
            for (let safety = 0; safety < 40 && !battle.over; safety += 1) {
                while (battle.focus >= 0 && battle.hand.length > 0 && !battle.over) {
                    const incoming = battle.intent.kind === 'attack' || battle.intent.kind === 'pierce'
                        ? battle.intent.amount
                        : 0
                    const affordable = battle.hand
                        .map((card, index) => ({ card, index, cost: effectiveCost(battle, card) }))
                        .filter(({ cost }) => cost <= battle.focus)
                    if (affordable.length === 0) break
                    const priority = ({ card }: typeof affordable[number]) => {
                        if (battle.trust < 32 && (card.id === 'recess' || card.id === 'closing')) return 100
                        if (incoming > battle.block && CARD_DEFS[card.id].target === 'self') return 80
                        if (card.id === 'ashTruth') return 70
                        if (card.id === 'precedent') return 65
                        if (card.id === 'rebuttal') return 60
                        if (CARD_DEFS[card.id].target === 'enemy') return 50
                        if (card.id === 'doubt') return 5
                        return 20
                    }
                    affordable.sort((a, b) => priority(b) - priority(a))
                    playCard(battle, affordable[0].index)
                    if (battle.focus === 0 && !battle.hand.some((card) => effectiveCost(battle, card) === 0)) break
                }
                if (!battle.over) endTurn(battle)
            }
            expect(
                battle.won,
                `hearing ${hearing + 1} against ${route[hearing]} (trust ${battle.trust}, enemy ${battle.enemyHp})`,
            ).toBe(true)
            trust = battle.trust
            if (hearing < drafts.length) deck = addReward(deck, drafts[hearing])
            if (hearing === 2 || hearing === 5) trust = Math.min(48, trust + 12)
        }
        expect(trust).toBeGreaterThan(0)
    })
})
