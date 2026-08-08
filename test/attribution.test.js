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

test('containerClass and attributionClass options override the default classes', () => {
  const customMd = new MarkdownIt()
  customMd.use(attribution, { containerClass: 'my-quote', attributionClass: 'my-cite' })

  const actual = customMd.render('> Quote text.\n>\n> — Author\n')

  assert.equal(actual, [
    '<figure class="my-quote">',
    '<blockquote>',
    '<p>Quote text.</p>',
    '</blockquote>',
    '<figcaption class="my-cite">Author</figcaption>',
    '</figure>\n'
  ].join('\n'))
})
