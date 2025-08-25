// Natural Language Processing utilities for SmartPin TPO search
// Provides semantic search capabilities for construction quality management

export interface SearchSynonyms {
  [key: string]: string[]
}

export interface SearchWeights {
  title: number
  description: number
  status: number
  severity: number
  created_by: number
}

// Construction industry specific synonyms and terminology
export const constructionSynonyms: SearchSynonyms = {
  // Roofing terms
  roof: ['roofing', 'ceiling', 'top', 'cover', 'membrane', 'surface'],
  membrane: ['roof', 'covering', 'material', 'sheet', 'layer', 'surface'],
  seam: ['joint', 'connection', 'weld', 'edge', 'junction', 'bond'],
  flashing: ['trim', 'edge', 'metal', 'seal', 'waterproofing', 'protection'],
  drain: ['drainage', 'gutter', 'outlet', 'water', 'runoff', 'scupper'],

  // Quality issues
  leak: ['leaking', 'water', 'moisture', 'drip', 'seepage', 'penetration'],
  crack: ['split', 'tear', 'break', 'fissure', 'gap', 'opening'],
  separation: ['split', 'gap', 'opening', 'detachment', 'disconnect'],
  damage: ['broken', 'torn', 'cracked', 'worn', 'deteriorated', 'failed'],
  wear: ['weathering', 'aging', 'deterioration', 'erosion', 'degradation'],

  // Inspection terms
  inspect: ['check', 'examine', 'review', 'assess', 'evaluate', 'test'],
  repair: ['fix', 'mend', 'patch', 'restore', 'correct', 'remedy'],
  replace: ['change', 'swap', 'substitute', 'renew', 'install'],
  maintenance: ['upkeep', 'service', 'care', 'preservation', 'keeping'],

  // Status terms
  open: ['pending', 'active', 'new', 'unresolved', 'outstanding'],
  ready: ['prepared', 'complete', 'finished', 'done', 'available'],
  closed: ['resolved', 'completed', 'fixed', 'finished', 'done'],

  // Severity terms
  critical: ['urgent', 'emergency', 'severe', 'major', 'serious', 'immediate'],
  high: ['important', 'significant', 'major', 'serious', 'priority'],
  medium: ['moderate', 'normal', 'standard', 'average', 'typical'],
  low: ['minor', 'small', 'minimal', 'slight', 'trivial'],

  // Tools and materials
  patch: ['repair', 'fix', 'temporary', 'covering', 'bandage'],
  sealant: ['seal', 'caulk', 'adhesive', 'waterproof', 'coating'],
  fastener: ['screw', 'nail', 'bolt', 'attachment', 'hardware'],
  pressure: ['force', 'stress', 'load', 'weight', 'compression'],

  // Weather and environmental
  water: ['moisture', 'rain', 'wet', 'liquid', 'humidity'],
  wind: ['air', 'breeze', 'gust', 'weather', 'uplift'],
  temperature: ['heat', 'cold', 'thermal', 'weather', 'climate'],
  uv: ['sun', 'solar', 'light', 'radiation', 'exposure'],
}

// Search weights for different fields
export const defaultSearchWeights: SearchWeights = {
  title: 3.0,
  description: 2.0,
  status: 1.5,
  severity: 1.5,
  created_by: 0.5,
}

/** Primitive type used for generic record constraints */
type Primitive = string | number | boolean | null | undefined

/** Normalizes search text by removing special characters and converting to lowercase */
export function normalizeText(text: string): string {
  return text.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim()
}

/** Escapes a string for safe use inside a RegExp constructor */
function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Expands search terms with synonyms */
export function expandSearchTerms(
  query: string,
  synonyms: SearchSynonyms = constructionSynonyms
): string[] {
  const normalizedQuery = normalizeText(query)
  const words = normalizedQuery.split(' ').filter((w) => w.length > 0)

  const expanded = new Set<string>()
  for (const w of words) expanded.add(w)

  for (const word of words) {
    if (synonyms[word]) {
      for (const syn of synonyms[word]) expanded.add(syn)
    }
    // Also check reverse mapping: if word is found in any synonyms list
    for (const [key, syns] of Object.entries(synonyms)) {
      if (syns.includes(word)) {
        expanded.add(key)
        for (const syn of syns) expanded.add(syn)
      }
    }
  }

  return Array.from(expanded)
}

/** Calculates relevance score for a text field against search terms */
export function calculateFieldRelevance(
  fieldText: string,
  searchTerms: string[],
  weight: number = 1.0
): number {
  if (!fieldText || searchTerms.length === 0) return 0

  const normalizedField = normalizeText(fieldText)
  const fieldWords = normalizedField.split(' ')
  let score = 0

  for (const term of searchTerms) {
    // Exact substring match
    if (normalizedField.includes(term)) score += 2 * weight

    // Whole-word match
    if (fieldWords.includes(term)) score += 1.5 * weight

    // Partial overlap
    for (const w of fieldWords) {
      if (w.includes(term) || term.includes(w)) {
        score += 0.5 * weight
      }
    }
  }

  return score
}

/** Main semantic search function with NLP capabilities */
export function performSemanticSearch<T extends Record<string, Primitive>>(
  items: T[],
  query: string,
  fieldMap: Record<keyof SearchWeights, keyof T>,
  weights: SearchWeights = defaultSearchWeights,
  threshold: number = 0.1
): Array<T & { relevanceScore: number }> {
  if (!query.trim()) {
    return items.map((item) => ({ ...item, relevanceScore: 0 }))
  }

  const expandedTerms = expandSearchTerms(query)

  const scored = items.map((item) => {
    let total = 0 ;
    (Object.keys(fieldMap) as Array<keyof SearchWeights>).forEach((k) => {
      const fieldKey = fieldMap[k]
      const value = String(item[fieldKey] ?? '')
      total += calculateFieldRelevance(value, expandedTerms, weights[k])
    })
    return { ...item, relevanceScore: total }
  })

  return scored.filter((x) => x.relevanceScore >= threshold).sort((a, b) => b.relevanceScore - a.relevanceScore)
}

/** Highlights matching terms in text with a <mark> tag */
export function highlightMatches(
  text: string,
  query: string,
  className: string = 'bg-yellow-200 dark:bg-yellow-800 px-1 rounded'
): string {
  if (!query.trim()) return text
  let out = text

  const expanded = expandSearchTerms(query)
  // Deduplicate and sort longer-first to avoid nested replacements
  const unique = Array.from(new Set(expanded)).sort((a, b) => b.length - a.length)

  for (const term of unique) {
    const esc = escapeRegExp(term)
    const rx = new RegExp(`(${esc})`, 'gi')
    out = out.replace(rx, `<mark class="${className}">$1</mark>`)
  }

  return out
}

/** Suggests search corrections and alternatives */
export function generateSearchSuggestions(
  query: string,
  availableTerms: string[],
  maxSuggestions: number = 5
): string[] {
  if (!query.trim()) return []

  const normalizedQuery = normalizeText(query)
  const queryWords = normalizedQuery.split(' ').filter(Boolean)
  const suggestions = new Set<string>()

  for (const term of availableTerms) {
    const normTerm = normalizeText(term)
    for (const w of queryWords) {
      if (normTerm.includes(w) || w.includes(normTerm)) suggestions.add(term)
    }
  }

  for (const w of queryWords) {
    const syns = constructionSynonyms[w]
    if (syns) {
      for (const s of syns.slice(0, 2)) suggestions.add(s)
    }
  }

  return Array.from(suggestions).slice(0, maxSuggestions)
}

/** Analyzes search intent and provides contextual help */
export function analyzeSearchIntent(query: string): {
  intent: 'status' | 'severity' | 'material' | 'action' | 'location' | 'general'
  confidence: number
  suggestions: string[]
} {
  const q = normalizeText(query)

  if (/\b(open|close|ready|pending|complete|finish)\b/.test(q)) {
    return {
      intent: 'status',
      confidence: 0.9,
      suggestions: ['Filter by status', 'Use status dropdown', 'Try: "open issues"'],
    }
  }

  if (/\b(critical|urgent|high|low|minor|major|severe)\b/.test(q)) {
    return {
      intent: 'severity',
      confidence: 0.9,
      suggestions: ['Filter by severity', 'Use severity dropdown', 'Try: "critical issues"'],
    }
  }

  if (/\b(membrane|flashing|drain|roof|seam|metal)\b/.test(q)) {
    return {
      intent: 'material',
      confidence: 0.8,
      suggestions: ['Search material types', 'Try: "membrane issues"', 'Try: "flashing repair"'],
    }
  }

  if (/\b(repair|replace|inspect|fix|patch|seal)\b/.test(q)) {
    return {
      intent: 'action',
      confidence: 0.8,
      suggestions: ['Search by action needed', 'Try: "repair required"', 'Try: "inspection needed"'],
    }
  }

  if (/\b(area|zone|section|edge|corner|center)\b/.test(q)) {
    return {
      intent: 'location',
      confidence: 0.7,
      suggestions: ['Search by location', 'Try specific area names', 'Try: "drain area"'],
    }
  }

  return {
    intent: 'general',
    confidence: 0.5,
    suggestions: [
      'Try searching for materials (membrane, flashing)',
      'Try searching for actions (repair, inspect)',
      'Use filters for status and severity',
    ],
  }
}
