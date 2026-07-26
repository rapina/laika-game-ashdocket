import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const root = new URL('../../', import.meta.url)
const manifest = JSON.parse(readFileSync(new URL('game.manifest.json', root), 'utf8'))
const runtimeSource = readFileSync(new URL('src/game/SampleGame.ts', root), 'utf8')
const atlas = readFileSync(new URL('public/art/opponent-atlas.png', root))

describe('identity-defining raster gameplay art', () => {
    it('packages the exact PNG atlas as a required Arcade asset', () => {
        expect(atlas.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a')
        expect(atlas.byteLength).toBe(2_191_914)
        expect(createHash('sha256').update(atlas).digest('hex'))
            .toBe('34c5a39c5dc4f1c338384bae763a1d488bb2c05d3d741db2e7bb2ceb83a584f8')
        expect(manifest.arcade.assets).toContainEqual({
            source: 'public/art/opponent-atlas.png',
            releasePath: 'art/opponent-atlas.png',
        })
    })

    it('loads the atlas and uses portraits in both normal gameplay surfaces', () => {
        expect(runtimeSource).toContain("Assets.load<Texture>(this.opponentAtlasUrl)")
        expect(runtimeSource).toContain('this.opponentPortrait(enemy, 12, 13, 94, 168)')
        expect(runtimeSource).toContain('this.opponentPortrait(b.enemyId, 108, 43, 138, 116)')
    })
})
