import React from 'react'
import ChatProUI from './ChatProUI'

// דוגמה לשימוש מלא במסך
export default function ChatPage() {
  return (
    <div className="h-dvh max-h-dvh w-screen overflow-hidden">
      <ChatProUI 
        scope="roof" 
        scopeId="ROOF_ID" 
        title="Roof Inspection Chat"
        currentUser={{ id: 'user123', name: 'John Doe' }}
        options={{
          reactions: true,
          reads: true,
          attachments: true,
          typing: true,
          presence: true
        }}
      />
    </div>
  )
}

// דוגמה לאינטגרציה בתוך עמוד קיים
export function EmbeddedChat() {
  return (
    <div className="h-96 border rounded-lg overflow-hidden">
      <ChatProUI 
        scope="pin" 
        scopeId="PIN_ID" 
        title="Pin Discussion"
      />
    </div>
  )
}
