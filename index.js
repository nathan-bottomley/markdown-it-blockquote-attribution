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

function findMarker (content, marker) {
  if (content.startsWith(marker)) return 0
  const position = content.indexOf('\n' + marker)
  return position === -1 ? -1 : position + 1
}

function extractUrl (str) {
  const match = str.match(REGEX_URL)
  return match ? match[0] : null
}

// Split a paragraph's source at the marker: the part before it (if any) stays
// as the quote's own text, everything from the marker onward is attribution.
function splitAttribution (source, markerIndex) {
  if (markerIndex === 0) return { content: null, attribution: source }
  return {
    content: source.slice(0, markerIndex).trim(),
    attribution: source.slice(markerIndex)
  }
}

function blockToken (state, type, tag, nesting, level, className) {
  const token = new state.Token(type, tag, nesting)
  token.block = true
  token.level = level
  if (className) token.attrSet('class', className)
  return token
}

// Find the first direct-child paragraph containing the marker — it may be its
// own paragraph, or share one with quote text via a soft break.
function findAttribution (tokens, marker, level, start, end) {
  for (let j = start + 1; j < end; j++) {
    const token = tokens[j]
    if (token.type !== 'inline' || token.level !== level + 2 || !token.content) continue
    const markerIndex = findMarker(token.content, marker)
    if (markerIndex !== -1) return { position: j, markerIndex }
  }
  return null
}

export default function markdownItAttribution (md, options = {}) {
  const { marker, removeMarker, containerClass, attributionClass } = { ...DEFAULTS, ...options }

  md.core.ruler.after('block', 'attribution', function (state) {
    const tokens = state.tokens

    // Wrap the blockquote in a <figure>, split its attribution paragraph out
    // into a <figcaption>, and set a `cite` attribute if the attribution has
    // a URL in it. Returns the index to resume searching from.
    function wrapBlockquote (level, start, end, { position, markerIndex }) {
      for (let j = start; j <= end; j++) tokens[j].level++

      const inlineToken = tokens[position]
      const { content, attribution } = splitAttribution(inlineToken.content, markerIndex)
      inlineToken.content = content

      let newEnd = end
      if (isEmpty(content)) {
        tokens.splice(position - 1, 3) // paragraph_open, inline, paragraph_close
        newEnd = end - 3
      }

      const url = extractUrl(attribution)
      if (url) tokens[start].attrSet('cite', url)

      const caption = new state.Token('inline', '', 0)
      caption.content = removeMarker ? attribution.slice(marker.length).trim() : attribution
      caption.children = []
      caption.level = level + 2

      tokens.splice(newEnd + 1, 0,
        blockToken(state, 'blockquote_attribution_open', 'figcaption', 1, level + 1, attributionClass),
        caption,
        blockToken(state, 'blockquote_attribution_close', 'figcaption', -1, level + 1),
        blockToken(state, 'blockquote_container_close', 'figure', -1, level)
      )
      tokens.splice(start, 0,
        blockToken(state, 'blockquote_container_open', 'figure', 1, level, containerClass)
      )

      return newEnd + 5
    }

    for (let i = 0; i < tokens.length; i++) {
      if (tokens[i].type !== 'blockquote_open') continue

      const start = i
      const level = tokens[start].level
      const end = tokens.findIndex((t, idx) =>
        idx > start && t.type === 'blockquote_close' && t.level === level
      )
      if (end === -1) {
        // Should be unreachable — markdown-it's own blockquote tokenizer
        // always balances open/close — unless some other plugin has
        // corrupted the token stream ahead of this one.
        console.warn('markdown-it-attribution: unmatched blockquote_open, skipping')
        continue
      }

      const found = findAttribution(tokens, marker, level, start, end)
      if (!found) {
        i = end
        continue
      }

      i = wrapBlockquote(level, start, end, found)
    }
  })
}
