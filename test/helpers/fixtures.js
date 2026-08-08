import { readFileSync } from 'node:fs'

// Parses markdown-it-testgen-style fixture files: entries of
// description / input markdown / expected HTML, each section separated
// by a line containing only a single ".".
export function loadFixtures (path) {
  const lines = readFileSync(path, 'utf8').split('\n')
  const cases = []
  let sections = []
  let current = []

  for (const line of lines) {
    if (line !== '.') {
      current.push(line)
      continue
    }
    sections.push(current.join('\n'))
    current = []
    if (sections.length === 3) {
      const [description, input, expected] = sections
      cases.push({ description: description.trim(), input: input + '\n', expected: expected + '\n' })
      sections = []
    }
  }

  return cases
}
