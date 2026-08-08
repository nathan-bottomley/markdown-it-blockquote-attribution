const REGEX_URL = /https?:\/\/[^\s/$.?#()].[^\s()]*/i

const DEFAULTS = {
  marker: '—',
  removeMarker: true,
  containerClass: 'quote',
  attributionClass: 'attribution'
}

function isEmpty (str) {
  return !str || str.trim().length === 0
}

function extractUrl (str) {
  const match = str.match(REGEX_URL)
  return match ? match[0] : null
}

function findMarkerWithinToken (tokenContent, marker) {
  if (tokenContent.startsWith(marker)) return 0
  const position = tokenContent.indexOf('\n' + marker)
  return position === -1 ? -1 : position + 1
}

function splitAtMarker (tokenContent, markerIndex) {
  if (markerIndex === 0) return { quote: null, attribution: tokenContent }
  return {
    quote: tokenContent.slice(0, markerIndex).trim(),
    attribution: tokenContent.slice(markerIndex)
  }
}

function findMarkerAcrossTokens (tokens, marker, level, blockquoteRange) {
  const { start, end } = blockquoteRange
  for (let j = start + 1; j < end; j++) {
    const token = tokens[j]
    if (token.type !== 'inline' || token.level !== level + 2 || !token.content) continue
    const markerIndex = findMarkerWithinToken(token.content, marker)
    if (markerIndex !== -1) return { tokenIndex: j, markerIndex }
  }
  return null
}

function createBlockToken (state, type, tag, nesting, level, className) {
  const token = new state.Token(type, tag, nesting)
  token.block = true
  token.level = level
  if (className) token.attrSet('class', className)
  return token
}

// Returns the index of the figure's closing tag, for the caller to resume
// scanning from — 5 tokens are spliced in total, hence newEnd + 5.
function wrapBlockquote (state, options, level, blockquoteRange, markerLocation) {
  const { marker, removeMarker, containerClass, attributionClass } = options
  const { start, end } = blockquoteRange
  const { tokenIndex, markerIndex } = markerLocation
  const tokens = state.tokens

  for (let j = start; j <= end; j++) tokens[j].level++

  const inlineToken = tokens[tokenIndex]
  const { quote, attribution } = splitAtMarker(inlineToken.content, markerIndex)
  inlineToken.content = quote

  let newEnd = end
  if (isEmpty(quote)) {
    tokens.splice(tokenIndex - 1, 3) // paragraph_open, inline, paragraph_close
    newEnd = end - 3
  }

  const url = extractUrl(attribution)
  if (url) tokens[start].attrSet('cite', url)

  const caption = new state.Token('inline', '', 0)
  caption.content = removeMarker ? attribution.slice(marker.length).trim() : attribution
  caption.children = []
  caption.level = level + 2

  tokens.splice(newEnd + 1, 0,
    createBlockToken(state, 'blockquote_attribution_open', 'figcaption', 1, level + 1, attributionClass),
    caption,
    createBlockToken(state, 'blockquote_attribution_close', 'figcaption', -1, level + 1),
    createBlockToken(state, 'blockquote_container_close', 'figure', -1, level)
  )
  tokens.splice(start, 0,
    createBlockToken(state, 'blockquote_container_open', 'figure', 1, level, containerClass)
  )

  return newEnd + 5
}

export default function markdownItAttribution (md, options = {}) {
  const resolvedOptions = { ...DEFAULTS, ...options }
  const { marker } = resolvedOptions

  md.core.ruler.after('block', 'attribution', function (state) {
    const tokens = state.tokens

    for (let i = 0; i < tokens.length; i++) {
      if (tokens[i].type !== 'blockquote_open') continue

      const start = i
      const level = tokens[start].level
      const end = tokens.findIndex((t, idx) =>
        idx > start && t.type === 'blockquote_close' && t.level === level
      )
      if (end === -1) {
        // Some other plugin has corrupted the token stream ahead of this one.
        console.warn('markdown-it-blockquote-attribution: unmatched blockquote_open, skipping')
        continue
      }

      const blockquoteRange = { start, end }

      const markerLocation = findMarkerAcrossTokens(tokens, marker, level, blockquoteRange)
      if (!markerLocation) {
        i = end
        continue
      }

      i = wrapBlockquote(state, resolvedOptions, level, blockquoteRange, markerLocation)
    }
  })
}
