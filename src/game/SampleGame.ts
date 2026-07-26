import { Application, Container, Graphics, Rectangle, Text } from 'pixi.js'
import { APP_CONFIG } from '../appConfig'
import { getLocale } from '../i18n'
import { haptic, setSfxMuted, sfxCard, sfxChip, sfxDefeat, sfxHit, sfxLose, sfxWin, unlockAudio } from '../audio/SFXSynth'
import {
    CARD_DEFS,
    addReward,
    createBattle,
    createStartingDeck,
    effectiveCost,
    endTurn,
    familyProfile,
    playCard,
    previewIntent,
    rewardOptions,
    upgradeFirst,
    type BattleState,
    type CardFamily,
    type CardId,
    type CardInstance,
    type CardTarget,
    type EnemyId,
} from './ashDocketLogic'
import type { GameCallbacks, GameRuntime } from './types'

type Locale = 'ko' | 'en'
type Screen = 'docket' | 'battle' | 'reward' | 'rest' | 'boss' | 'result'

const W = 390
const H = 844
const MAX_TRUST = 48
const PAPER = 0xe7d8b1
const PAPER_DARK = 0xb7a884
const INK = 0x251d2b
const NIGHT = 0x15101b
const PANEL = 0x2b1c2a
const PANEL_LIGHT = 0x3b2735
const EMBER = 0xe56b4f
const COPPER = 0x5fa49b
const GOLD = 0xe7b974
const DANGER = 0xd94f56

const ENCOUNTER_PAIRS: Array<[EnemyId, EnemyId]> = [
    ['jury', 'witness'],
    ['clerk', 'prosecutor'],
    ['archivist', 'choir'],
    ['jury', 'clerk'],
    ['witness', 'prosecutor'],
    ['bailiff', 'archivist'],
    ['choir', 'clerk'],
    ['bailiff', 'prosecutor'],
]

const UI = {
    ko: {
        docket: '사건표', act: '막', hearing: '심리', trust: '신뢰', deck: '사건부',
        choose: '다음 심리를 선택하세요', warning: '상대 규칙', focus: '집중',
        block: '방어', evidence: '증거', draw: '뽑기', discard: '버림', turn: '턴',
        endTurn: '변론 종료', targetEnemy: '상대 논지를 탭하세요', targetSelf: '변호인 인장을 탭하세요',
        notEnough: '집중력이 부족합니다', wrongTarget: '빛나는 대상을 탭하세요',
        reward: '심리 승리', rewardPrompt: '사건부에 한 장을 추가하세요', skip: '건너뛰기 · 신뢰 +2',
        rest: '휴정', restPrompt: '다음 막을 위한 한 가지 조치를 고르세요',
        heal: '숨 고르기', healDesc: '신뢰 12 회복', upgrade: '주석 달기', upgradeDesc: '첫 미강화 카드 강화',
        boss: '최종 심리', bossTitle: '대법관', bossIntro: '채택 계열은 매 턴 바뀝니다.\n증거 → 심문 → 이의·호소',
        begin: '최종 변론 시작', verdict: '판결', victory: '무죄 판결', defeat: '사건 패소',
        victoryBody: '검은 인장이 갈라졌습니다.\n망자의 기억은 기록으로 남습니다.',
        defeatBody: '신뢰가 무너졌습니다.\n사건은 재 속에 봉인됩니다.',
        score: '사건 점수', cleared: '완료 심리', profile: '주요 논증', newCase: '새 사건',
        paused: '기록 정지', resume: '계속하기', muted: '음소거', sound: '소리',
        selected: '선택', incoming: '예고', admissible: '채택', phase: '국면',
        attack: '공격', pierce: '관통', curse: '의심 추가', ward: '보호막',
        familyInquiry: '심문', familyEvidence: '증거', familyObjection: '이의', familyAppeal: '호소',
        familyDefense: '이의·호소', noCards: '사용할 카드가 없습니다',
        upgraded: '강화', bossRule: '비채택 카드 효과 -2',
    },
    en: {
        docket: 'DOCKET', act: 'ACT', hearing: 'HEARING', trust: 'TRUST', deck: 'CASE FILE',
        choose: 'Choose the next hearing', warning: 'SPECIAL RULE', focus: 'FOCUS',
        block: 'BLOCK', evidence: 'EVIDENCE', draw: 'DRAW', discard: 'DISCARD', turn: 'TURN',
        endTurn: 'END ARGUMENT', targetEnemy: 'Tap the opposing claim', targetSelf: 'Tap the counsel seal',
        notEnough: 'Not enough Focus', wrongTarget: 'Tap the glowing target',
        reward: 'HEARING WON', rewardPrompt: 'Add one card to the case file', skip: 'SKIP · TRUST +2',
        rest: 'RECESS', restPrompt: 'Choose one preparation for the next act',
        heal: 'BREATHE', healDesc: 'Restore 12 Trust', upgrade: 'ANNOTATE', upgradeDesc: 'Upgrade first eligible card',
        boss: 'FINAL HEARING', bossTitle: 'HIGH JUDGE', bossIntro: 'Admissibility changes every turn.\nEvidence → Inquiry → Defense',
        begin: 'BEGIN FINAL ARGUMENT', verdict: 'VERDICT', victory: 'CASE WON', defeat: 'CASE LOST',
        victoryBody: 'The black seal breaks.\nA memory survives as record.',
        defeatBody: 'Trust has collapsed.\nThe case is sealed in ash.',
        score: 'CASE SCORE', cleared: 'HEARINGS', profile: 'PRIMARY ARGUMENT', newCase: 'NEW CASE',
        paused: 'RECORD PAUSED', resume: 'RESUME', muted: 'MUTED', sound: 'SOUND',
        selected: 'SELECTED', incoming: 'INTENT', admissible: 'ADMIT', phase: 'PHASE',
        attack: 'Attack', pierce: 'Piercing', curse: 'Add Doubt', ward: 'Ward',
        familyInquiry: 'Inquiry', familyEvidence: 'Evidence', familyObjection: 'Objection', familyAppeal: 'Appeal',
        familyDefense: 'Defense', noCards: 'No playable cards',
        upgraded: 'UPGRADED', bossRule: 'Off-family effects -2',
    },
} as const

const CARD_COPY: Record<Locale, Record<CardId, [string, string]>> = {
    ko: {
        press: ['추궁', '피해 6'], brace: ['버티기', '방어 5'], record: ['기록 제출', '피해 3 · 증거 +1'],
        object: ['이의 있음', '방어 3 · 공격 -3'], cross: ['교차 심문', '피해 5 · 1장 뽑기'],
        rebuttal: ['반증', '피해 9 · 공격 의도 +5'], precedent: ['판례', '증거 +1 · 집중 +1'],
        ashTruth: ['잿빛 진실', '피해 5 + 증거×3'], recess: ['정회 요청', '신뢰 5 · 방어 3'],
        closing: ['최후 변론', '피해 4 · 신뢰 3'], dismiss: ['기각', '방어 10'],
        opening: ['빈틈 포착', '피해 2 · 1장 뽑기'], doubt: ['의심', '집중 1로 소각'],
    },
    en: {
        press: ['PRESS', 'Deal 6'], brace: ['BRACE', 'Block 5'], record: ['FILE RECORD', 'Deal 3 · Evidence +1'],
        object: ['OBJECTION', 'Block 3 · Intent -3'], cross: ['CROSS-EXAM', 'Deal 5 · Draw 1'],
        rebuttal: ['REBUTTAL', 'Deal 9 · +5 vs attack'], precedent: ['PRECEDENT', 'Evidence +1 · Focus +1'],
        ashTruth: ['ASH TRUTH', 'Deal 5 + Evidence×3'], recess: ['CALL RECESS', 'Heal 5 · Block 3'],
        closing: ['CLOSING PLEA', 'Deal 4 · Heal 3'], dismiss: ['DISMISS', 'Block 10'],
        opening: ['OPENING', 'Deal 2 · Draw 1'], doubt: ['DOUBT', 'Spend 1 to burn'],
    },
}

const ENEMY_COPY: Record<Locale, Record<EnemyId, [string, string]>> = {
    ko: {
        jury: ['속삭이는 배심', '3턴마다 의심을 덱에 섞음'],
        clerk: ['봉인 서기', '증거 비용 +1 · 공격/보호막 +6 교대'],
        witness: ['적대 증인', '같은 계열 반복 시 피해 3'],
        prosecutor: ['냉정한 검사', '신뢰 회복량 절반'],
        bailiff: ['잿빛 집행관', '방어 무시 관통 공격'],
        archivist: ['기록 포식자', '주기적으로 보호막 재생'],
        choir: ['메아리 합창', '약한 공격 뒤 강한 합창'],
        judge: ['대법관', '매 턴 채택 계열 변경'],
    },
    en: {
        jury: ['WHISPER JURY', 'Shuffles Doubt every 3 turns'],
        clerk: ['SEAL CLERK', 'Evidence +1 cost · alternates Ward +6'],
        witness: ['HOSTILE WITNESS', 'Repeat a family: take 3'],
        prosecutor: ['COLD PROSECUTOR', 'Trust recovery is halved'],
        bailiff: ['ASH BAILIFF', 'Uses piercing attacks'],
        archivist: ['RECORD EATER', 'Regenerates wards'],
        choir: ['ECHO CHOIR', 'Soft strikes, then a chorus'],
        judge: ['HIGH JUDGE', 'Admissibility rotates each turn'],
    },
}

const FAMILY_COLORS: Record<CardFamily, number> = {
    inquiry: EMBER,
    evidence: COPPER,
    objection: GOLD,
    appeal: 0xb78bd0,
    doubt: 0x746d78,
}

interface AshMote {
    node: Graphics
    x: number
    y: number
    speed: number
    drift: number
}

export class SampleGame implements GameRuntime {
    private app: Application | null = null
    private callbacks: GameCallbacks | null = null
    private resizeObs: ResizeObserver | null = null
    private ui = new Container()
    private motes: AshMote[] = []
    private deck: CardInstance[] = []
    private battle: BattleState | null = null
    private screen: Screen = 'docket'
    private locale: Locale = 'en'
    private selectedCard = -1
    private cleared = 0
    private trust = MAX_TRUST
    private score = 0
    private rewards: CardId[] = []
    private over = false
    private won = false
    private paused = false
    private muted = false
    private destroyed = false
    private finishedCallback = false
    private toast = ''
    private toastTimer: number | null = null
    private familyUsage: Partial<Record<CardFamily, number>> = {}
    private currentEnemy: EnemyId | null = null
    private keyHandler = (event: KeyboardEvent) => this.onKey(event)

    async mount(container: HTMLElement, callbacks: GameCallbacks): Promise<void> {
        this.callbacks = callbacks
        this.locale = this.detectLocale()
        const app = new Application()
        await app.init({
            width: W,
            height: H,
            backgroundColor: NIGHT,
            antialias: true,
            // The 430px production viewport upscales the 390px design scene.
            // Keep a small backing-store margin so the enlarged canvas still
            // meets the device's native DPR instead of becoming subtly soft.
            resolution: Math.min((window.devicePixelRatio || 1) * 1.2, 4),
            autoDensity: true,
        })
        if (this.destroyed) {
            app.destroy(true, { children: true })
            return
        }
        this.app = app
        container.appendChild(app.canvas)
        const fit = () => {
            const scale = Math.min(container.clientWidth / W, container.clientHeight / H)
            app.canvas.style.width = `${W * scale}px`
            app.canvas.style.height = `${H * scale}px`
        }
        fit()
        this.resizeObs = new ResizeObserver(fit)
        this.resizeObs.observe(container)
        this.buildBackdrop()
        app.stage.addChild(this.ui)
        app.stage.eventMode = 'static'
        app.stage.hitArea = app.screen
        window.addEventListener('keydown', this.keyHandler)
        ;(globalThis as unknown as Record<string, unknown>).__forceGameOver = () => this.forceGameOver()
        ;(globalThis as unknown as Record<string, unknown>).__gameDesignSize = { w: W, h: H }
        this.restartRun()
        app.ticker.add((ticker) => this.animate(ticker.deltaMS))
    }

    private detectLocale(): Locale {
        const query = new URLSearchParams(window.location.search).get('lang')
        if (query === 'ko' || query === 'en') return query
        const shell = getLocale()
        return shell === 'ko' ? 'ko' : 'en'
    }

    private tr<K extends keyof typeof UI.ko>(key: K): string {
        return UI[this.locale][key]
    }

    private buildBackdrop(): void {
        if (!this.app) return
        const g = new Graphics()
        g.rect(0, 0, W, H).fill(NIGHT)
        g.circle(W / 2, 205, 118).fill({ color: COPPER, alpha: 0.11 })
        g.circle(W / 2, 205, 88).fill({ color: COPPER, alpha: 0.12 })
        g.moveTo(36, 420).lineTo(36, 178).quadraticCurveTo(36, 48, 195, 26)
            .quadraticCurveTo(354, 48, 354, 178).lineTo(354, 420).stroke({ color: 0x5f3e48, width: 3, alpha: 0.55 })
        g.rect(0, 785, W, 59).fill({ color: 0x0d0a10, alpha: 0.8 })
        this.app.stage.addChild(g)
        for (let i = 0; i < 28; i += 1) {
            const node = new Graphics().circle(0, 0, 1 + (i % 3) * 0.6).fill({ color: PAPER, alpha: 0.15 + (i % 4) * 0.05 })
            const mote = {
                node,
                x: (i * 73) % W,
                y: (i * 137) % H,
                speed: 0.008 + (i % 5) * 0.004,
                drift: 0.15 + (i % 7) * 0.04,
            }
            node.position.set(mote.x, mote.y)
            this.motes.push(mote)
            this.app.stage.addChild(node)
        }
    }

    private animate(ms: number): void {
        if (this.paused) return
        const time = performance.now() / 1000
        for (let i = 0; i < this.motes.length; i += 1) {
            const mote = this.motes[i]
            mote.y -= mote.speed * ms
            if (mote.y < -8) mote.y = H + 8
            mote.node.position.set(mote.x + Math.sin(time * mote.drift + i) * 6, mote.y)
        }
    }

    private clearUi(): void {
        for (const child of this.ui.removeChildren()) child.destroy({ children: true })
    }

    private text(
        content: string,
        x: number,
        y: number,
        size = 14,
        color = PAPER,
        options: { anchor?: number; width?: number; align?: 'left' | 'center' | 'right'; weight?: 'normal' | 'bold' } = {},
    ): Text {
        const node = new Text({
            text: content,
            style: {
                fill: color,
                fontSize: size,
                fontFamily: options.weight === 'bold' ? 'Galmuri14, monospace' : 'Galmuri11, monospace',
                fontWeight: options.weight === 'bold' ? 'bold' : 'normal',
                align: options.align ?? 'left',
                wordWrap: Boolean(options.width),
                wordWrapWidth: options.width,
                lineHeight: Math.ceil(size * 1.42),
            },
        })
        node.anchor.set(options.anchor ?? 0)
        node.position.set(x, y)
        return node
    }

    private panel(x: number, y: number, w: number, h: number, color = PANEL, border = 0x664557, alpha = 0.96): Container {
        const c = new Container()
        c.position.set(x, y)
        c.addChild(new Graphics().roundRect(0, 0, w, h, 9).fill({ color, alpha }).stroke({ color: border, width: 1.5, alpha: 0.9 }))
        return c
    }

    private interactive(c: Container, w: number, h: number, handler: () => void): void {
        c.eventMode = 'static'
        c.cursor = 'pointer'
        c.hitArea = new Rectangle(0, 0, w, h)
        c.on('pointertap', () => {
            if (this.paused) return
            unlockAudio()
            sfxCard()
            handler()
        })
    }

    private button(label: string, x: number, y: number, w: number, h: number, handler: () => void, accent = EMBER): Container {
        const c = this.panel(x, y, w, h, accent, PAPER_DARK, 1)
        c.addChild(this.text(label, w / 2, h / 2, 13, INK, { anchor: 0.5, align: 'center', weight: 'bold', width: w - 16 }))
        this.interactive(c, w, h, handler)
        this.ui.addChild(c)
        return c
    }

    private topBar(title: string): void {
        const bar = new Graphics().rect(0, 0, W, 54).fill({ color: 0x110d15, alpha: 0.94 }).stroke({ color: 0x5b3a48, width: 1 })
        this.ui.addChild(bar)
        this.ui.addChild(this.text(title, 16, 16, 17, PAPER, { weight: 'bold' }))
        this.ui.addChild(this.text(`${this.tr('trust')} ${this.trust}/${MAX_TRUST}`, 174, 18, 12, this.trust <= 14 ? DANGER : COPPER))
        const pause = this.panel(280, 8, 44, 38, PANEL_LIGHT, 0x7b5866)
        pause.addChild(this.text('Ⅱ', 22, 19, 14, PAPER, { anchor: 0.5, weight: 'bold' }))
        this.interactive(pause, 44, 38, () => this.setPaused(true))
        this.ui.addChild(pause)
    }

    private render(): void {
        if (!this.app || this.destroyed) return
        this.clearUi()
        switch (this.screen) {
            case 'docket': this.renderDocket(); break
            case 'battle': this.renderBattle(); break
            case 'reward': this.renderReward(); break
            case 'rest': this.renderRest(); break
            case 'boss': this.renderBoss(); break
            case 'result': this.renderResult(); break
        }
        if (this.toast) {
            const toast = this.panel(34, 491, 322, 48, 0x160f18, EMBER, 0.98)
            toast.addChild(this.text(this.toast, 161, 24, 12, PAPER, { anchor: 0.5, align: 'center', width: 298 }))
            this.ui.addChild(toast)
        }
        if (this.paused) this.renderPause()
    }

    private renderDocket(): void {
        this.topBar(this.tr('docket'))
        const act = this.cleared < 3 ? 1 : this.cleared < 6 ? 2 : 3
        this.ui.addChild(this.text(`${this.tr('act')} ${act} · ${this.tr('hearing')} ${this.cleared + 1}/8`, 18, 76, 13, GOLD))
        this.ui.addChild(this.text(this.tr('choose'), 18, 106, 21, PAPER, { weight: 'bold' }))
        const line = new Graphics().moveTo(28, 154).lineTo(362, 154).stroke({ color: 0x6a4753, width: 3 })
        for (let i = 0; i < 9; i += 1) {
            const done = i < this.cleared
            const current = i === this.cleared
            line.circle(28 + i * 41.75, 154, current ? 7 : 5).fill(done ? COPPER : current ? EMBER : 0x4c3742)
        }
        this.ui.addChild(line)
        const pair = ENCOUNTER_PAIRS[Math.min(this.cleared, ENCOUNTER_PAIRS.length - 1)]
        pair.forEach((enemy, index) => this.enemyChoice(enemy, 18, 190 + index * 222, 354, 194))
        const file = this.panel(18, 652, 354, 114, 0x211720, 0x59414d)
        const family = familyProfile(this.deck)
        file.addChild(this.text(this.tr('deck'), 16, 14, 14, GOLD, { weight: 'bold' }))
        file.addChild(this.text(`${this.deck.length} ${this.locale === 'ko' ? '장' : 'CARDS'} · ${this.familyName(family)}`, 16, 42, 13, PAPER))
        file.addChild(this.text(
            this.locale === 'ko' ? '심리 승리 뒤 새 카드를 고르고,\n휴정에서 신뢰 또는 카드를 정비합니다.' : 'Draft after every win.\nAt recess, restore Trust or upgrade.',
            16, 67, 11, PAPER_DARK, { width: 320 },
        ))
        this.ui.addChild(file)
    }

    private enemyChoice(enemy: EnemyId, x: number, y: number, w: number, h: number): void {
        const c = this.panel(x, y, w, h, PANEL, enemy === 'bailiff' || enemy === 'prosecutor' ? DANGER : COPPER)
        const [name, rule] = ENEMY_COPY[this.locale][enemy]
        const portrait = new Graphics()
        portrait.circle(59, 65, 34).fill({ color: 0x110d15, alpha: 0.9 })
        portrait.moveTo(22, 136).quadraticCurveTo(59, 88, 96, 136).lineTo(96, 156).lineTo(22, 156).fill(0x110d15)
        portrait.circle(48, 61, 3).fill(EMBER).circle(70, 61, 3).fill(EMBER)
        c.addChild(portrait)
        c.addChild(this.text(name, 120, 24, 18, PAPER, { weight: 'bold', width: 208 }))
        c.addChild(this.text(this.tr('warning'), 120, 66, 10, GOLD))
        c.addChild(this.text(rule, 120, 90, 12, PAPER_DARK, { width: 208 }))
        c.addChild(this.text('›', 322, 135, 28, EMBER, { anchor: 0.5, weight: 'bold' }))
        this.interactive(c, w, h, () => this.startEncounter(enemy))
        this.ui.addChild(c)
    }

    private startEncounter(enemy: EnemyId): void {
        this.currentEnemy = enemy
        this.battle = createBattle(this.deck, enemy, this.trust, this.cleared)
        this.selectedCard = -1
        this.screen = 'battle'
        this.toast = ''
        sfxChip()
        this.render()
    }

    private renderBattle(): void {
        const b = this.battle
        if (!b) return
        this.topBar(`${this.tr('hearing')} ${Math.min(this.cleared + 1, 9)}`)
        const enemy = this.panel(18, 68, 354, 222, 0x241822, this.selectedTarget() === 'enemy' ? EMBER : 0x704654)
        const [name, rule] = ENEMY_COPY[this.locale][b.enemyId]
        enemy.addChild(this.text(name, 177, 17, 17, PAPER, { anchor: 0.5, weight: 'bold', width: 320, align: 'center' }))
        const portrait = new Graphics()
        portrait.circle(177, 90, 50).fill({ color: 0x100c13, alpha: 0.96 }).stroke({ color: COPPER, width: 2, alpha: 0.5 })
        portrait.moveTo(117, 174).quadraticCurveTo(177, 111, 237, 174).lineTo(237, 190).lineTo(117, 190).fill(0x100c13)
        portrait.circle(160, 89, 4).fill(EMBER).circle(194, 89, 4).fill(EMBER)
        enemy.addChild(portrait)
        enemy.addChild(this.text(`${b.enemyHp}/${b.enemyMaxHp}`, 177, 143, 15, PAPER, { anchor: 0.5, weight: 'bold' }))
        if (b.enemyBlock > 0) enemy.addChild(this.text(`${this.tr('ward')} ${b.enemyBlock}`, 177, 169, 11, COPPER, { anchor: 0.5 }))
        enemy.addChild(this.text(rule, 177, 202, 10, PAPER_DARK, { anchor: 0.5, width: 320, align: 'center' }))
        this.interactive(enemy, 354, 222, () => this.resolveTarget('enemy'))
        this.ui.addChild(enemy)

        const preview = previewIntent(b)
        const intent = this.panel(18, 302, 354, 66, 0x1b151d, b.intent.kind === 'attack' || b.intent.kind === 'pierce' ? DANGER : COPPER)
        intent.addChild(this.text(this.tr('incoming'), 15, 12, 10, GOLD))
        intent.addChild(this.text(this.intentDisplay(b), 15, 32, 15, PAPER, { weight: 'bold' }))
        if (preview.effectiveAmount !== preview.rawAmount) {
            intent.addChild(this.text(
                this.locale === 'ko' ? `이의 제기 · 피해 -${preview.rawAmount - preview.effectiveAmount}` : `Objection · damage -${preview.rawAmount - preview.effectiveAmount}`,
                338, 43, 9, COPPER, { anchor: 1, align: 'right' },
            ))
        }
        if (b.enemyId === 'judge' && b.admissible) {
            intent.addChild(this.text(`${this.tr('admissible')}: ${this.familyName(b.admissible)}`, 338, 22, 11, EMBER, { anchor: 1, align: 'right' }))
            intent.addChild(this.text(this.tr('bossRule'), 338, 44, 9, PAPER_DARK, { anchor: 1, align: 'right' }))
        }
        this.ui.addChild(intent)

        const counsel = this.panel(18, 382, 354, 94, 0x231b25, this.selectedTarget() === 'self' ? GOLD : 0x6b4c5b)
        const seal = new Graphics().circle(48, 47, 28).fill({ color: EMBER, alpha: 0.8 }).circle(48, 47, 18).stroke({ color: PAPER, width: 2, alpha: 0.7 })
        seal.moveTo(36, 47).lineTo(45, 56).lineTo(62, 37).stroke({ color: INK, width: 5 })
        counsel.addChild(seal)
        counsel.addChild(this.text(`${this.tr('trust')} ${b.trust}/${b.maxTrust}`, 91, 13, 14, b.trust <= 14 ? DANGER : PAPER, { weight: 'bold' }))
        counsel.addChild(this.text(`${this.tr('block')} ${b.block} · ${this.tr('evidence')} ${b.evidence}`, 91, 43, 12, COPPER))
        counsel.addChild(this.text(this.tr('focus'), 274, 16, 10, GOLD, { anchor: 0.5, weight: 'bold' }))
        counsel.addChild(this.text(`${b.focus} / 3`, 274, 53, 22, GOLD, { anchor: 0.5, weight: 'bold' }))
        this.interactive(counsel, 354, 94, () => this.resolveTarget('self'))
        this.ui.addChild(counsel)

        this.ui.addChild(this.text(`${this.tr('turn')} ${b.turn}`, 18, 492, 11, PAPER_DARK))
        this.ui.addChild(this.text(`${this.tr('draw')} ${b.drawPile.length} · ${this.tr('discard')} ${b.discardPile.length}`, 372, 492, 11, PAPER_DARK, { anchor: 1 }))
        if (this.selectedCard >= 0 && b.hand[this.selectedCard]) {
            const selected = b.hand[this.selectedCard]
            const [name, desc] = CARD_COPY[this.locale][selected.id]
            this.ui.addChild(this.text(`${this.tr('selected')}: ${name} — ${this.cardDescription(selected, desc)}`, 195, 517, 11, FAMILY_COLORS[CARD_DEFS[selected.id].family], { anchor: 0.5, width: 360, align: 'center' }))
        } else {
            this.ui.addChild(this.text(this.locale === 'ko' ? '카드를 탭해 읽고 대상을 고르세요' : 'Tap a card, then its glowing target', 195, 517, 11, PAPER_DARK, { anchor: 0.5 }))
        }
        this.renderHand(b)
        this.button(this.tr('endTurn'), 18, 774, 354, 50, () => this.finishTurn(), COPPER)
    }

    private renderHand(b: BattleState): void {
        const count = Math.max(1, b.hand.length)
        const gap = 4
        const cardW = Math.min(70, (374 - gap * (count - 1)) / count)
        const startX = (W - (cardW * count + gap * (count - 1))) / 2
        b.hand.forEach((card, index) => {
            const def = CARD_DEFS[card.id]
            const selected = this.selectedCard === index
            const cost = effectiveCost(b, card)
            const affordable = cost <= b.focus
            const x = startX + index * (cardW + gap)
            const y = selected ? 548 : 558
            const c = this.panel(
                x, y, cardW, 196,
                card.id === 'doubt' ? 0x302c34 : affordable ? 0xeee0bb : 0x8c8377,
                selected ? EMBER : affordable ? FAMILY_COLORS[def.family] : 0x625a61,
                1,
            )
            c.alpha = affordable ? 1 : 0.72
            c.addChild(new Graphics().circle(15, 17, 11).fill(FAMILY_COLORS[def.family]))
            c.addChild(this.text(String(cost), 15, 17, 11, INK, { anchor: 0.5, weight: 'bold' }))
            c.addChild(this.text(this.familyGlyph(def.family), cardW - 9, 10, 10, FAMILY_COLORS[def.family], { anchor: 0.5, weight: 'bold' }))
            const [name, desc] = CARD_COPY[this.locale][card.id]
            c.addChild(this.text(card.upgraded ? `${name}+` : name, cardW / 2, 46, cardW < 58 ? 9 : 10, INK, { anchor: 0.5, width: cardW - 8, align: 'center', weight: 'bold' }))
            c.addChild(new Graphics().moveTo(9, 81).lineTo(cardW - 9, 81).stroke({ color: FAMILY_COLORS[def.family], width: 2, alpha: 0.75 }))
            c.addChild(this.text(this.cardDescription(card, desc), cardW / 2, 101, cardW < 58 ? 8 : 9, 0x4f4247, { anchor: 0.5, width: cardW - 8, align: 'center' }))
            if (!affordable) {
                c.addChild(new Graphics().rect(4, 163, cardW - 8, 27).fill({ color: INK, alpha: 0.88 }))
                c.addChild(this.text(
                    this.locale === 'ko' ? '집중 부족' : 'NEED FOCUS',
                    cardW / 2, 176, cardW < 58 ? 7 : 8, PAPER,
                    { anchor: 0.5, width: cardW - 10, align: 'center', weight: 'bold' },
                ))
            }
            this.interactive(c, cardW, 196, () => this.selectCard(index))
            this.ui.addChild(c)
        })
    }

    private cardDescription(card: CardInstance, base: string): string {
        if (!card.upgraded) return base
        const id = card.id
        const copy: Record<Locale, Partial<Record<CardId, string>>> = {
            ko: {
                press: '피해 9', brace: '방어 8', record: '피해 5 · 증거 +2', object: '방어 5 · 공격 -5',
                cross: '피해 7 · 2장 뽑기', rebuttal: '피해 12 · 공격 의도 +7', precedent: '증거 +2 · 집중 +1',
                ashTruth: '피해 7 + 증거×4', recess: '신뢰 8 · 방어 5', closing: '피해 7 · 신뢰 5',
                dismiss: '방어 15', opening: '피해 4 · 1장 뽑기',
            },
            en: {
                press: 'Deal 9', brace: 'Block 8', record: 'Deal 5 · Evidence +2', object: 'Block 5 · Intent -5',
                cross: 'Deal 7 · Draw 2', rebuttal: 'Deal 12 · +7 vs attack', precedent: 'Evidence +2 · Focus +1',
                ashTruth: 'Deal 7 + Evidence×4', recess: 'Heal 8 · Block 5', closing: 'Deal 7 · Heal 5',
                dismiss: 'Block 15', opening: 'Deal 4 · Draw 1',
            },
        }
        return copy[this.locale][id] ?? base
    }

    private selectCard(index: number): void {
        const b = this.battle
        if (!b || !b.hand[index]) return
        const card = b.hand[index]
        if (effectiveCost(b, card) > b.focus) {
            this.showToast(this.tr('notEnough'))
            sfxLose()
            return
        }
        this.selectedCard = this.selectedCard === index ? -1 : index
        haptic(10)
        this.render()
    }

    private selectedTarget(): CardTarget | null {
        const card = this.battle?.hand[this.selectedCard]
        return card ? CARD_DEFS[card.id].target : null
    }

    private resolveTarget(target: CardTarget): void {
        const b = this.battle
        const card = b?.hand[this.selectedCard]
        if (!b || !card) {
            this.showToast(this.locale === 'ko' ? '먼저 카드를 고르세요' : 'Choose a card first')
            return
        }
        if (CARD_DEFS[card.id].target !== target) {
            this.showToast(this.tr('wrongTarget'))
            sfxLose()
            return
        }
        const family = CARD_DEFS[card.id].family
        const result = playCard(b, this.selectedCard)
        if (!result.ok) {
            this.showToast(this.tr('notEnough'))
            return
        }
        this.familyUsage[family] = (this.familyUsage[family] ?? 0) + 1
        this.selectedCard = -1
        if (result.damage > 0) { sfxHit(); haptic(18) }
        else if (result.heal > 0) sfxWin()
        else sfxChip()
        if (result.weakened > 0) {
            const preview = previewIntent(b)
            this.showToast(
                this.locale === 'ko'
                    ? `공격 예고 ${preview.rawAmount} → ${preview.effectiveAmount}`
                    : `Intent ${preview.rawAmount} → ${preview.effectiveAmount}`,
                false,
            )
        }
        if (b.over && b.won) {
            this.completeHearing()
            return
        }
        this.render()
    }

    private finishTurn(): void {
        const b = this.battle
        if (!b || b.over) return
        this.selectedCard = -1
        const result = endTurn(b)
        this.trust = b.trust
        if (result.damage > 0) {
            sfxHit()
            haptic([20, 35, 20])
            this.showToast(
                result.witnessPenalty > 0
                    ? (this.locale === 'ko' ? `반복 증언 반격 · 신뢰 -${result.damage}` : `Repeated family · Trust -${result.damage}`)
                    : `${this.intentName(result.cursed ? 'curse' : 'attack')} · ${this.tr('trust')} -${result.damage}`,
                false,
            )
        } else if (result.cursed) {
            sfxLose()
            this.showToast(this.locale === 'ko' ? '의심이 사건부에 섞였습니다' : 'Doubt entered the case file', false)
        } else if (result.ward > 0) {
            sfxChip()
            this.showToast(`${this.tr('ward')} +${result.ward}`, false)
        }
        if (b.over && !b.won) {
            this.finishRun(false)
            return
        }
        this.render()
    }

    private completeHearing(): void {
        const b = this.battle
        if (!b) return
        this.trust = b.trust
        if (b.enemyId === 'judge') {
            this.cleared = 9
            this.score += 400
            this.finishRun(true)
            return
        }
        this.cleared += 1
        this.score += 100
        this.rewards = rewardOptions()
        this.screen = 'reward'
        this.battle = null
        this.currentEnemy = null
        sfxDefeat()
        this.render()
    }

    private renderReward(): void {
        this.topBar(this.tr('reward'))
        this.ui.addChild(this.text(this.tr('rewardPrompt'), 195, 91, 18, PAPER, { anchor: 0.5, weight: 'bold', align: 'center' }))
        this.ui.addChild(this.text(`${this.tr('hearing')} ${this.cleared}/8`, 195, 123, 11, COPPER, { anchor: 0.5 }))
        this.rewards.forEach((id, index) => {
            const card = { uid: `reward-${id}`, id, upgraded: false } satisfies CardInstance
            const def = CARD_DEFS[id]
            const c = this.panel(37, 168 + index * 156, 316, 132, 0xeee0bb, FAMILY_COLORS[def.family], 1)
            c.addChild(new Graphics().circle(37, 38, 18).fill(FAMILY_COLORS[def.family]))
            c.addChild(this.text(String(def.cost), 37, 38, 13, INK, { anchor: 0.5, weight: 'bold' }))
            c.addChild(this.text(CARD_COPY[this.locale][id][0], 72, 22, 16, INK, { weight: 'bold', width: 222 }))
            c.addChild(this.text(this.familyName(def.family), 72, 52, 10, FAMILY_COLORS[def.family]))
            c.addChild(this.text(this.cardDescription(card, CARD_COPY[this.locale][id][1]), 72, 78, 12, 0x51434b, { width: 222 }))
            this.interactive(c, 316, 132, () => this.takeReward(id))
            this.ui.addChild(c)
        })
        this.button(this.tr('skip'), 37, 662, 316, 52, () => {
            this.trust = Math.min(MAX_TRUST, this.trust + 2)
            this.afterReward()
        }, COPPER)
    }

    private takeReward(id: CardId): void {
        this.deck = addReward(this.deck, id)
        sfxWin()
        this.afterReward()
    }

    private afterReward(): void {
        if (this.cleared >= 8) this.screen = 'boss'
        else if (this.cleared === 3 || this.cleared === 6) this.screen = 'rest'
        else this.screen = 'docket'
        this.render()
    }

    private renderRest(): void {
        this.topBar(this.tr('rest'))
        this.ui.addChild(this.text('☾', 195, 120, 54, COPPER, { anchor: 0.5 }))
        this.ui.addChild(this.text(this.tr('restPrompt'), 195, 189, 17, PAPER, { anchor: 0.5, width: 330, align: 'center', weight: 'bold' }))
        const heal = this.panel(35, 258, 320, 148, PANEL_LIGHT, COPPER)
        heal.addChild(this.text(this.tr('heal'), 160, 38, 20, PAPER, { anchor: 0.5, weight: 'bold' }))
        heal.addChild(this.text(this.tr('healDesc'), 160, 89, 13, COPPER, { anchor: 0.5 }))
        this.interactive(heal, 320, 148, () => {
            this.trust = Math.min(MAX_TRUST, this.trust + 12)
            sfxWin()
            this.screen = 'docket'
            this.render()
        })
        this.ui.addChild(heal)
        const upgrade = this.panel(35, 436, 320, 148, PANEL_LIGHT, EMBER)
        upgrade.addChild(this.text(this.tr('upgrade'), 160, 38, 20, PAPER, { anchor: 0.5, weight: 'bold' }))
        upgrade.addChild(this.text(this.tr('upgradeDesc'), 160, 89, 13, EMBER, { anchor: 0.5 }))
        this.interactive(upgrade, 320, 148, () => {
            const result = upgradeFirst(this.deck)
            this.deck = result.deck
            sfxWin()
            this.screen = 'docket'
            this.render()
        })
        this.ui.addChild(upgrade)
        this.ui.addChild(this.text(`${this.tr('trust')} ${this.trust}/${MAX_TRUST} · ${this.tr('deck')} ${this.deck.length}`, 195, 633, 12, PAPER_DARK, { anchor: 0.5 }))
    }

    private renderBoss(): void {
        this.topBar(this.tr('boss'))
        const seal = new Graphics()
        seal.circle(195, 245, 104).fill({ color: 0x0d0910, alpha: 0.96 }).stroke({ color: EMBER, width: 5, alpha: 0.7 })
        seal.circle(195, 245, 72).stroke({ color: PAPER_DARK, width: 2, alpha: 0.5 })
        seal.moveTo(153, 245).lineTo(182, 274).lineTo(237, 211).stroke({ color: EMBER, width: 12 })
        this.ui.addChild(seal)
        this.ui.addChild(this.text(this.tr('bossTitle'), 195, 390, 28, PAPER, { anchor: 0.5, weight: 'bold' }))
        this.ui.addChild(this.text(this.tr('bossIntro'), 195, 458, 15, COPPER, { anchor: 0.5, width: 330, align: 'center' }))
        this.ui.addChild(this.text(this.tr('bossRule'), 195, 537, 12, GOLD, { anchor: 0.5 }))
        this.button(this.tr('begin'), 34, 645, 322, 62, () => this.startEncounter('judge'), EMBER)
    }

    private finishRun(won: boolean): void {
        this.over = true
        this.won = won
        this.screen = 'result'
        this.trust = this.battle?.trust ?? this.trust
        const upgraded = this.deck.filter((card) => card.upgraded).length
        this.score += this.trust * 10 + upgraded * 25
        if (won) sfxWin()
        else sfxLose()
        haptic(won ? [20, 40, 20, 40, 40] : [80, 60, 120])
        this.render()
        if (!this.finishedCallback) {
            this.finishedCallback = true
            window.setTimeout(() => this.callbacks?.onGameOver({ score: this.score, phase: this.cleared }), 900)
        }
    }

    private renderResult(): void {
        this.topBar(this.tr('verdict'))
        const color = this.won ? COPPER : DANGER
        const seal = new Graphics().circle(195, 203, 91).fill({ color, alpha: 0.82 }).circle(195, 203, 65).stroke({ color: PAPER, width: 3, alpha: 0.72 })
        if (this.won) seal.moveTo(155, 203).lineTo(184, 231).lineTo(238, 171).stroke({ color: INK, width: 12 })
        else seal.moveTo(165, 173).lineTo(225, 233).moveTo(225, 173).lineTo(165, 233).stroke({ color: INK, width: 12 })
        this.ui.addChild(seal)
        this.ui.addChild(this.text(this.won ? this.tr('victory') : this.tr('defeat'), 195, 328, 27, color, { anchor: 0.5, weight: 'bold' }))
        this.ui.addChild(this.text(this.won ? this.tr('victoryBody') : this.tr('defeatBody'), 195, 395, 14, PAPER, { anchor: 0.5, width: 330, align: 'center' }))
        const summary = this.panel(35, 480, 320, 148, 0x241a24, color)
        summary.addChild(this.text(this.tr('score'), 18, 19, 11, PAPER_DARK))
        summary.addChild(this.text(String(this.score), 302, 13, 24, GOLD, { anchor: 1, weight: 'bold' }))
        summary.addChild(this.text(this.tr('cleared'), 18, 66, 11, PAPER_DARK))
        summary.addChild(this.text(`${this.cleared}/9`, 302, 63, 15, PAPER, { anchor: 1, weight: 'bold' }))
        summary.addChild(this.text(this.tr('profile'), 18, 105, 11, PAPER_DARK))
        summary.addChild(this.text(this.familyName(this.mostUsedFamily()), 302, 102, 15, color, { anchor: 1, weight: 'bold' }))
        this.ui.addChild(summary)
        this.button(this.tr('newCase'), 35, 682, 320, 62, () => this.restartRun(), color)
        ;(globalThis as unknown as Record<string, unknown>).__gameOverUiBoxes = [
            { name: 'result-title', x: 35, y: 300, w: 320, h: 70 },
            { name: 'result-summary', x: 35, y: 480, w: 320, h: 148 },
            { name: 'new-case', x: 35, y: 682, w: 320, h: 62 },
        ]
    }

    private renderPause(): void {
        const shade = new Graphics().rect(0, 0, W, H).fill({ color: 0x08060a, alpha: 0.86 })
        shade.eventMode = 'static'
        this.ui.addChild(shade)
        this.ui.addChild(this.text(this.tr('paused'), 195, 283, 26, PAPER, { anchor: 0.5, weight: 'bold' }))
        this.button(this.tr('resume'), 65, 360, 260, 58, () => this.setPaused(false), COPPER)
        this.button(this.muted ? this.tr('muted') : this.tr('sound'), 65, 442, 260, 58, () => this.setMuted(!this.muted), PANEL_LIGHT)
    }

    private showToast(message: string, rerender = true): void {
        this.toast = message
        if (this.toastTimer !== null) window.clearTimeout(this.toastTimer)
        this.toastTimer = window.setTimeout(() => {
            this.toast = ''
            this.toastTimer = null
            this.render()
        }, 1350)
        if (rerender) this.render()
    }

    private intentName(kind: string): string {
        if (kind === 'pierce') return this.tr('pierce')
        if (kind === 'curse') return this.tr('curse')
        if (kind === 'ward') return this.tr('ward')
        return this.tr('attack')
    }

    private intentDisplay(battle: BattleState): string {
        const preview = previewIntent(battle)
        if (preview.kind === 'ward') return `${this.tr('ward')} +${preview.effectiveAmount}`
        if (preview.kind === 'curse') return `${this.tr('curse')} +${preview.effectiveAmount}`
        if (preview.effectiveAmount !== preview.rawAmount) {
            return `${this.intentName(preview.kind)} ${preview.rawAmount} → ${preview.effectiveAmount}`
        }
        return `${this.intentName(preview.kind)} ${preview.effectiveAmount}`
    }

    private familyName(family: CardFamily | 'defense'): string {
        if (family === 'inquiry') return this.tr('familyInquiry')
        if (family === 'evidence') return this.tr('familyEvidence')
        if (family === 'objection') return this.tr('familyObjection')
        if (family === 'appeal') return this.tr('familyAppeal')
        if (family === 'defense') return this.tr('familyDefense')
        return this.locale === 'ko' ? '의심' : 'Doubt'
    }

    private familyGlyph(family: CardFamily): string {
        if (family === 'inquiry') return '!'
        if (family === 'evidence') return '§'
        if (family === 'objection') return '◇'
        if (family === 'appeal') return '○'
        return '?'
    }

    private mostUsedFamily(): CardFamily {
        const entries = Object.entries(this.familyUsage) as Array<[CardFamily, number]>
        return entries.sort((a, b) => b[1] - a[1])[0]?.[0] ?? familyProfile(this.deck)
    }

    private onKey(event: KeyboardEvent): void {
        if (event.key === 'Escape') {
            this.setPaused(!this.paused)
            return
        }
        if (this.paused || this.screen !== 'battle' || !this.battle) return
        const number = Number(event.key)
        if (Number.isInteger(number) && number >= 1 && number <= this.battle.hand.length) {
            this.selectCard(number - 1)
            return
        }
        if (event.key === 'Enter') {
            const target = this.selectedTarget()
            if (target) this.resolveTarget(target)
            else this.finishTurn()
        }
        if (event.key === ' ') this.finishTurn()
    }

    restartRun(): void {
        this.deck = createStartingDeck()
        this.battle = null
        this.screen = 'docket'
        this.selectedCard = -1
        this.cleared = 0
        this.trust = MAX_TRUST
        this.score = 0
        this.rewards = []
        this.over = false
        this.won = false
        this.paused = false
        this.finishedCallback = false
        this.toast = ''
        this.familyUsage = {}
        this.currentEnemy = null
        delete (globalThis as unknown as Record<string, unknown>).__gameOverUiBoxes
        this.callbacks?.onScoreChange?.(0)
        this.render()
    }

    setPaused(value: boolean): void {
        this.paused = value
        this.render()
    }

    setMuted(value: boolean): void {
        this.muted = value
        setSfxMuted(value)
        this.render()
    }

    setLocale(locale: Locale): void {
        this.locale = locale
        this.render()
    }

    private forceGameOver(): void {
        if (this.over) return
        if (!this.battle) {
            this.battle = createBattle(this.deck, 'jury', 1, this.cleared)
            this.screen = 'battle'
        }
        this.battle.trust = 0
        this.trust = 0
        this.finishRun(false)
    }

    getDebugState(): Record<string, unknown> {
        return {
            over: this.over,
            won: this.won,
            screen: this.screen,
            score: this.score,
            cleared: this.cleared,
            trust: this.battle?.trust ?? this.trust,
            enemy: this.currentEnemy,
            enemyHp: this.battle?.enemyHp ?? null,
            focus: this.battle?.focus ?? null,
            hand: this.battle?.hand.map((card) => card.id) ?? [],
            selectedCard: this.selectedCard,
            paused: this.paused,
            muted: this.muted,
        }
    }

    destroy(): void {
        this.destroyed = true
        this.resizeObs?.disconnect()
        this.resizeObs = null
        window.removeEventListener('keydown', this.keyHandler)
        if (this.toastTimer !== null) window.clearTimeout(this.toastTimer)
        delete (globalThis as unknown as Record<string, unknown>).__forceGameOver
        delete (globalThis as unknown as Record<string, unknown>).__gameOverUiBoxes
        if (!this.app) return
        this.app.destroy(true, { children: true })
        this.app = null
        this.motes = []
    }
}
