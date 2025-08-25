'use client'

import { useState, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { 
  analyzeSearchIntent, 
  generateSearchSuggestions, 
  expandSearchTerms,
  type SearchSynonyms 
} from '@/lib/utils/nlp-search'

interface SmartSearchInputProps {
  value: string
  onChange: (value: string) => void
  onSearch?: (query: string, expandedTerms: string[]) => void
  placeholder?: string
  availableTerms?: string[]
  customSynonyms?: SearchSynonyms
  className?: string
  showSuggestions?: boolean
  showIntent?: boolean
}

export function SmartSearchInput({
  value,
  onChange,
  onSearch,
  placeholder = "Smart search with NLP...",
  availableTerms = [],
  customSynonyms,
  className,
  showSuggestions = true,
  showIntent = true,
}: SmartSearchInputProps) {
  const [isSearching, setIsSearching] = useState(false)
  const [showSuggestionsPanel, setShowSuggestionsPanel] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [intent, setIntent] = useState<any>(null)
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<NodeJS.Timeout>()

  // Analyze search intent and generate suggestions
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      if (value.trim().length > 2) {
        // Analyze intent
        if (showIntent) {
          const searchIntent = analyzeSearchIntent(value)
          setIntent(searchIntent)
        }

        // Generate suggestions
        if (showSuggestions && availableTerms.length > 0) {
          const searchSuggestions = generateSearchSuggestions(value, availableTerms, 5)
          setSuggestions(searchSuggestions)
          setShowSuggestionsPanel(searchSuggestions.length > 0)
        }
      } else {
        setIntent(null)
        setSuggestions([])
        setShowSuggestionsPanel(false)
      }
    }, 300)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [value, availableTerms, showSuggestions, showIntent])

  // Handle search execution
  const handleSearch = (query: string = value) => {
    if (!query.trim()) return

    setIsSearching(true)
    const expandedTerms = expandSearchTerms(query, customSynonyms)
    
    onSearch?.(query, expandedTerms)
    setShowSuggestionsPanel(false)
    
    setTimeout(() => setIsSearching(false), 500)
  }

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    const newQuery = `${value.trim()} ${suggestion}`.trim()
    onChange(newQuery)
    handleSearch(newQuery)
  }

  // Handle intent suggestion click
  const handleIntentSuggestionClick = (suggestion: string) => {
    onChange(suggestion)
    handleSearch(suggestion)
  }

  // Handle keyboard events
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSearch()
    } else if (e.key === 'Escape') {
      setShowSuggestionsPanel(false)
    }
  }

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestionsPanel(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={searchRef} className={cn('relative', className)}>
      {/* Search Input */}
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={cn(
            'pr-10',
            isSearching && 'animate-pulse',
            intent?.confidence > 0.7 && 'ring-2 ring-blue-200 dark:ring-blue-800'
          )}
        />
        
        {/* Search Icon/Loading */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          {isSearching ? (
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg
              className="w-4 h-4 text-muted-foreground cursor-pointer hover:text-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              onClick={() => handleSearch()}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          )}
        </div>
      </div>

      {/* Expanded Search Terms Preview */}
      {value.trim() && (
        <div className="mt-2 text-xs text-muted-foreground">
          <span className="font-medium">Searching:</span>{' '}
          {expandSearchTerms(value, customSynonyms)
            .slice(0, 6)
            .map((term, index) => (
              <Badge 
                key={index} 
                variant="outline" 
                className="ml-1 text-xs px-1.5 py-0"
              >
                {term}
              </Badge>
            ))}
          {expandSearchTerms(value, customSynonyms).length > 6 && (
            <span className="ml-1">+{expandSearchTerms(value, customSynonyms).length - 6} more</span>
          )}
        </div>
      )}

      {/* Intent Analysis */}
      {intent && intent.confidence > 0.6 && (
        <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full" />
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
              Detected: {intent.intent.charAt(0).toUpperCase() + intent.intent.slice(1)} search
            </span>
            <Badge variant="secondary" className="text-xs">
              {Math.round(intent.confidence * 100)}% confidence
            </Badge>
          </div>
          
          <div className="flex flex-wrap gap-1">
            {intent.suggestions.map((suggestion: string, index: number) => (
              <Button
                key={index}
                variant="ghost"
                size="sm"
                className="h-6 text-xs px-2 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/20"
                onClick={() => handleIntentSuggestionClick(suggestion)}
              >
                {suggestion}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Suggestions Panel */}
      {showSuggestionsPanel && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg">
          <div className="p-2">
            <div className="text-xs font-medium text-muted-foreground mb-2">
              Related terms:
            </div>
            <div className="flex flex-wrap gap-1">
              {suggestions.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs px-2 hover:bg-muted"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Search Help */}
      {value.trim().length === 0 && (
        <div className="mt-2 text-xs text-muted-foreground">
          <div className="flex flex-wrap gap-1">
            <span>Try:</span>
            {['membrane repair', 'critical issues', 'seam inspection', 'flashing damage'].map((example, index) => (
              <Button
                key={index}
                variant="link"
                size="sm"
                className="h-auto p-0 text-xs underline hover:no-underline"
                onClick={() => {
                  onChange(example)
                  handleSearch(example)
                }}
              >
&quot;{example}&quot;
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}