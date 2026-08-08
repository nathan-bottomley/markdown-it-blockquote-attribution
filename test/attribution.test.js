import { test } from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import MarkdownIt from 'markdown-it'
import attribution from '../index.js'
import { loadFixtures } from './helpers/fixtures.js'

const fixturesPath = fileURLToPath(new URL('fixtures/attribution.txt', import.meta.url))
const md = new MarkdownIt()
md.use(attribution)

for (const { description, input, expected } of loadFixtures(fixturesPath)) {
  test(description, () => {
    assert.equal(md.render(input), expected)
  })
}
