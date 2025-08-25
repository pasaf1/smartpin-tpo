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
  'roof': ['roofing', 'ceiling', 'top', 'cover', 'membrane', 'surface'],
  'membrane': ['roof', 'covering', 'material', 'sheet', 'layer', 'surface'],
  'seam': ['joint', 'connection', 'weld', 'edge', 'junction', 'bond'],
  'flashing': ['trim', 'edge', 'metal', 'seal', 'waterproofing', 'protection'],
  'drain': ['drainage', 'gutter', 'outlet', 'water', 'runoff', 'scupper'],
  
  // Quality issues
  'leak': ['leaking', 'water', 'moisture', 'drip', 'seepage', 'penetration'],
  'crack': ['split', 'tear', 'break', 'fissure', 'gap', 'opening'],
  'separation': ['split', 'gap', 'opening', 'detachment', 'disconnect'],
  'damage': ['broken', 'torn', 'cracked', 'worn', 'deteriorated', 'failed'],
  'wear': ['weathering', 'aging', 'deterioration', 'erosion', 'degradation'],
  
  // Inspection terms
  'inspect': ['check', 'examine', 'review', 'assess', 'evaluate', 'test'],
  'repair': ['fix', 'mend', 'patch', 'restore', 'correct', 'remedy'],
  'replace': ['change', 'swap', 'substitute', 'renew', 'install'],
  'maintenance': ['upkeep', 'service', 'care', 'preservation', 'keeping'],
  
  // Status terms
  'open': ['pending', 'active', 'new', 'unresolved', 'outstanding'],
  'ready': ['prepared', 'complete', 'finished', 'done', 'available'],
  'closed': ['resolved', 'completed', 'fixed', 'finished', 'done'],
  
  // Severity terms
  'critical': ['urgent', 'emergency', 'severe', 'major', 'serious', 'immediate'],
  'high': ['important', 'significant', 'major', 'serious', 'priority'],
  'medium': ['moderate', 'normal', 'standard', 'average', 'typical'],
  'low': ['minor', 'small', 'minimal', 'slight', 'trivial'],
  
  // Tools and materials
  'patch': ['repair', 'fix', 'temporary', 'covering', 'bandage'],
  'sealant': ['seal', 'caulk', 'adhesive', 'waterproof', 'coating'],
  'fastener': ['screw', 'nail', 'bolt', 'attachment', 'hardware'],
  'pressure': ['force', 'stress', 'load', 'weight', 'compression'],
  
  // Weather and environmental
  'water': ['moisture', 'rain', 'wet', 'liquid', 'humidity'],
  'wind': ['air', 'breeze', 'gust', 'weather', 'uplift'],
  'temperature': ['heat', 'cold', 'thermal', 'weather', 'climate'],
  'uv': ['sun', 'solar', 'light', 'radiation', 'exposure'],
}

// Search weights for different fields
export const defaultSearchWeights: SearchWeights = {
  title: 3.0,        // Highest priority
  description: 2.0,   // High priority
  status: 1.5,       // Medium priority
  severity: 1.5,     // Medium priority
  created_by: 0.5,   // Lowest priority
}

/**
 * Normalizes search text by removing special characters and converting to lowercase
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Expands search terms with synonyms
 */
export function expandSearchTerms(query: string, synonyms: SearchSynonyms = constructionSynonyms): string[] {
  const normalizedQuery = normalizeText(query)
  const words = normalizedQuery.split(' ').filter(word => word.length > 0)
  
  const expandedTerms = new Set<string>()
  
  // Add original words
  words.forEach(word => expandedTerms.add(word))
  
  // Add synonyms
  words.forEach(word => {
    if (synonyms[word]) {
      synonyms[word].forEach(synonym => expandedTerms.add(synonym))
    }
    
    // Also check if the word is a synonym of any key
    Object.entries(synonyms).forEach(([key, syns]) => {
      if (syns.includes(word)) {
        expandedTerms.add(key)
        syns.forEach(syn => expandedTerms.add(syn))
      }
    })
  })
  
  return Array.from(expandedTerms)
}

/**
 * Calculates relevance score for a text field against search terms
 */
export function calculateFieldRelevance(
  fieldText: string,
  searchTerms: string[],
  weight: number = 1.0
): number {
  if (!fieldText || searchTerms.length === 0) return 0
  
  const normalizedField = normalizeText(fieldText)
  const fieldWords = normalizedField.split(' ')
  
  let score = 0
  
  searchTerms.forEach(term => {
    // Exact match bonus
    if (normalizedField.includes(term)) {
      score += 2 * weight
    }
    
    // Word match bonus
    if (fieldWords.includes(term)) {
      score += 1.5 * weight
    }
    
    // Partial match bonus
    fieldWords.forEach(word => {
      if (word.includes(term) || term.includes(word)) {
        score += 0.5 * weight
      }
    })
  })
  
  return score
}

/**
 * Main semantic search function with NLP capabilities
 */
export function performSemanticSearch<T extends Record<string, any>>(
  items: T[],
  query: string,
  fieldMap: Record<keyof SearchWeights, keyof T>,
  weights: SearchWeights = defaultSearchWeights,
  threshold: number = 0.1
): Array<T & { relevanceScore: number }> {
  if (!query.trim()) {
    return items.map(item => ({ ...item, relevanceScore: 0 }))
  }
  
  // Expand search terms with synonyms
  const expandedTerms = expandSearchTerms(query)
  
  // Calculate relevance scores
  const scoredItems = items.map(item => {
    let totalScore = 0
    
    // Score each field
    Object.entries(fieldMap).forEach(([weightKey, fieldKey]) => {
      const fieldValue = String(item[fieldKey] || '')
      const fieldWeight = weights[weightKey as keyof SearchWeights]
      const fieldScore = calculateFieldRelevance(fieldValue, expandedTerms, fieldWeight)
      totalScore += fieldScore
    })
    
    return {
      ...item,
      relevanceScore: totalScore
    }
  })
  
  // Filter by threshold and sort by relevance
  return scoredItems
    .filter(item => item.relevanceScore >= threshold)
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
}

/**
 * Highlights matching terms in text
 */
export function highlightMatches(
  text: string,
  query: string,
  className: string = 'bg-yellow-200 dark:bg-yellow-800 px-1 rounded'
): string {
  if (!query.trim()) return text
  
  const expandedTerms = expandSearchTerms(query)
  let highlightedText = text
  
  expandedTerms.forEach(term => {
    const regex = new RegExp(`(${term})`, 'gi')
    highlightedText = highlightedText.replace(
      regex,
      `<mark class="${className}">$1</mark>`
    )
  })
  
  return highlightedText
}

/**
 * Suggests search corrections and alternatives
 */
export function generateSearchSuggestions(
  query: string,
  availableTerms: string[],
  maxSuggestions: number = 5
): string[] {
  if (!query.trim()) return []
  
  const normalizedQuery = normalizeText(query)
  const queryWords = normalizedQuery.split(' ')
  
  const suggestions = new Set<string>()
  
  // Find similar terms in available data
  availableTerms.forEach(term => {
    const normalizedTerm = normalizeText(term)
    queryWords.forEach(word => {
      if (normalizedTerm.includes(word) || word.includes(normalizedTerm)) {
        suggestions.add(term)
      }
    })
  })
  
  // Add synonym suggestions
  queryWords.forEach(word => {
    if (constructionSynonyms[word]) {
      constructionSynonyms[word].slice(0, 2).forEach(synonym => {
        suggestions.add(synonym)
      })
    }
  })
  
  return Array.from(suggestions).slice(0, maxSuggestions)
}

/**
 * Analyzes search intent and provides contextual help
 */
export function analyzeSearchIntent(query: string): {
  intent: 'status' | 'severity' | 'material' | 'action' | 'location' | 'general'
  confidence: number
  suggestions: string[]
} {
  const normalizedQuery = normalizeText(query)
  
  // Status intent
  if (/\b(open|close|ready|pending|complete|finish)\b/.test(normalizedQuery)) {
    return {
      intent: 'status',
      confidence: 0.9,
      suggestions: ['Filter by status', 'Use status dropdown', 'Try: "open issues"']
    }
  }
  
  // Severity intent
  if (/\b(critical|urgent|high|low|minor|major|severe)\b/.test(normalizedQuery)) {
    return {
      intent: 'severity',
      confidence: 0.9,
      suggestions: ['Filter by severity', 'Use severity dropdown', 'Try: "critical issues"']
    }
  }
  
  // Material intent
  if (/\b(membrane|flashing|drain|roof|seam|metal)\b/.test(normalizedQuery)) {
    return {
      intent: 'material',
      confidence: 0.8,
      suggestions: ['Search material types', 'Try: "membrane issues"', 'Try: "flashing repair"']
    }
  }
  
  // Action intent
  if (/\b(repair|replace|inspect|fix|patch|seal)\b/.test(normalizedQuery)) {
    return {
      intent: 'action',
      confidence: 0.8,
      suggestions: ['Search by action needed', 'Try: "repair required"', 'Try: "inspection needed"']
    }
  }
  
  // Location intent
  if (/\b(area|zone|section|edge|corner|center)\b/.test(normalizedQuery)) {
    return {
      intent: 'location',
      confidence: 0.7,
      suggestions: ['Search by location', 'Try specific area names', 'Try: "drain area"']
    }
  }
  
  return {
    intent: 'general',
    confidence: 0.5,
    suggestions: [
      'Try searching for materials (membrane, flashing)',
      'Try searching for actions (repair, inspect)',
      'Use filters for status and severity'
    ]
  }
}