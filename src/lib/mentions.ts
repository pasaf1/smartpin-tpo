/**
 * Mentions System for SmartPin TPO
 * Handles @username mentions across all chat components
 */

export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  role?: string
  status?: 'active' | 'inactive'
}

export interface Mention {
  id: string
  userId: string
  startIndex: number
  endIndex: number
  displayName: string
}

/**
 * Parse mentions from text and return an array of mention objects
 */
export function parseMentions(text: string, users: User[]): Mention[] {
  const mentions: Mention[] = []
  const mentionRegex = /@(\w+(?:\.\w+)*)/g
  let match

  while ((match = mentionRegex.exec(text)) !== null) {
    const username = match[1]
    const mentionText = match[0]
    
    // Find user by name (case insensitive) or email
    const user = users.find(u => 
      u.name.toLowerCase().replace(/\s+/g, '').includes(username.toLowerCase()) ||
      u.email.toLowerCase().split('@')[0] === username.toLowerCase() ||
      u.name.toLowerCase().replace(/\s+/g, '') === username.toLowerCase()
    )

    if (user) {
      mentions.push({
        id: `mention-${Date.now()}-${match.index}`,
        userId: user.id,
        startIndex: match.index,
        endIndex: match.index + mentionText.length,
        displayName: user.name
      })
    }
  }

  return mentions
}

/**
 * Format text with mentions for display (converts @mentions to styled spans)
 */
export function formatMentionsForDisplay(text: string, mentions: Mention[]): string {
  if (mentions.length === 0) return text

  let formattedText = text
  let offset = 0

  // Sort mentions by start index to process them in order
  const sortedMentions = [...mentions].sort((a, b) => a.startIndex - b.startIndex)

  sortedMentions.forEach(mention => {
    const beforeMention = formattedText.substring(0, mention.startIndex + offset)
    const afterMention = formattedText.substring(mention.endIndex + offset)
    
    const mentionSpan = `<span class="bg-blue-100 text-blue-800 px-1 py-0.5 rounded text-sm font-medium">@${mention.displayName}</span>`
    
    formattedText = beforeMention + mentionSpan + afterMention
    
    // Update offset for next mentions
    offset += mentionSpan.length - (mention.endIndex - mention.startIndex)
  })

  return formattedText
}

/**
 * Get suggestions for mentions based on input text
 */
export function getMentionSuggestions(text: string, cursorPosition: number, users: User[]): User[] {
  // Find the current word being typed
  const textBeforeCursor = text.substring(0, cursorPosition)
  const lastAtSymbol = textBeforeCursor.lastIndexOf('@')
  
  if (lastAtSymbol === -1) return []
  
  // Check if we're still typing a mention (no space after @)
  const textAfterAt = textBeforeCursor.substring(lastAtSymbol + 1)
  if (textAfterAt.includes(' ')) return []
  
  const query = textAfterAt.toLowerCase()
  
  // Filter users based on name or email
  return users
    .filter(user => 
      user.status === 'active' &&
      (user.name.toLowerCase().includes(query) ||
       user.email.toLowerCase().includes(query))
    )
    .slice(0, 5) // Limit to 5 suggestions
    .sort((a, b) => a.name.localeCompare(b.name))
}

/**
 * Insert mention into text at cursor position
 */
export function insertMention(
  text: string, 
  cursorPosition: number, 
  user: User
): { newText: string; newCursorPosition: number } {
  const textBeforeCursor = text.substring(0, cursorPosition)
  const textAfterCursor = text.substring(cursorPosition)
  
  // Find the @ symbol position
  const lastAtSymbol = textBeforeCursor.lastIndexOf('@')
  
  if (lastAtSymbol === -1) {
    return { newText: text, newCursorPosition: cursorPosition }
  }
  
  // Replace from @ to cursor position with the mention
  const mention = `@${user.name.replace(/\s+/g, '')}`
  const beforeAt = text.substring(0, lastAtSymbol)
  const newText = beforeAt + mention + ' ' + textAfterCursor
  const newCursorPosition = lastAtSymbol + mention.length + 1
  
  return { newText, newCursorPosition }
}

/**
 * Extract mentioned user IDs from text
 */
export function extractMentionedUserIds(text: string, users: User[]): string[] {
  const mentions = parseMentions(text, users)
  return mentions.map(m => m.userId)
}