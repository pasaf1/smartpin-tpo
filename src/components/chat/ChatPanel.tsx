// ChatPanel.tsx
'use client';

import React, { useState } from 'react';
import { useChatMessages, useSendChatMessage, useRealTimeChat } from '@/lib/hooks/useSupabaseQueries';
// import { ExportDialog } from '@/components/ExportDialog';
// If ExportDialog is located elsewhere, update the path accordingly:
// import { ExportDialog } from './ExportDialog';
// Or, if you do not have ExportDialog, comment out or remove its usage and import.
// Update the import path and filename as needed; for example:
import { ChatMessageComponent } from '@/components/chat/ChatMessage';
// If your file is named ChatMessage.tsx and located in components/chat/
// import { TypingIndicator } from '@/components/TypingIndicator';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUsers } from '@/lib/hooks/useAuth';
// If you have a utility function for classnames, import it here.
// Example for 'clsx' or your own 'cn' function:
import { cn } from '@/lib/utils'; // Adjust the path as needed

interface ChatPanelProps {
  roofId: string;
  roof: { id: string; name: string };
  pinId?: string;
  pinItemId?: string;
  className?: string;
}

export function ChatPanel({ roofId, roof, pinId, pinItemId, className }: ChatPanelProps) {
  const [showPresencePanel, setShowPresencePanel] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [pinItem, setPinItem] = useState<string | null>(null);
  const { data: users = [] } = useUsers();

  const {
    messages,
    onlineUsers,
    onlineCount,
    isLoading,
  } = useRealTimeChat('roof', roofId, undefined);
  const sendMessageMutation = useSendChatMessage();

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;
    setIsSending(true);
    try {
      await sendMessageMutation.mutateAsync({
        text: content,
        scope: 'roof',
        scope_id: roofId,
        mentions: null,
      });
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card className={cn('flex flex-col', className)} style={{ maxHeight: '100%' }}>
      <CardHeader className="flex-shrink-0 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">{roof.name} Chat</CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className="text-xs">
                {messages.length} messages
              </Badge>
              {onlineCount > 0 && (
                <Badge variant="outline" className="text-xs">
                  {onlineCount} online
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            {/* <ExportDialog
              roofId={roofId}
              roofName={roof.name}
              messages={messages}
              pins={[]}
              users={users}
              roofData={roof}
            >
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0" title="Export Chat">📄</Button>
            </ExportDialog> */}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowPresencePanel(!showPresencePanel)}
              className="h-8 w-8 p-0"
            >
              👥
            </Button>
          </div>
        </div>
      </CardHeader>

      {showPresencePanel && (
        <div className="border-t bg-muted/25 p-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="flex -space-x-1">
              {onlineUsers.slice(0, 5).map((user) => (
                <Badge key={user.id} variant="outline">{user.name}</Badge>
              ))}
              {onlineUsers.length > 5 && (
                <Badge variant="outline">+{onlineUsers.length - 5}</Badge>
              )}
            </div>
            <span>{onlineUsers.length} online</span>
          </div>
        </div>
      )}

      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-full">
          <div className="flex flex-col p-4 space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                Loading...
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No messages yet</p>
              </div>
            ) : (
              messages.map((message) => {
                const chatMessage = {
                  id: message.message_id,
                  content: message.text ?? '',
                  user_id: message.created_by ?? 'unknown', // Ensure user_id is always a string
                  user_name: users.find(u => u.id === message.created_by)?.name || 'Unknown',
                  scope: message.scope,
                  scope_id: message.scope_id,
                  mentions: message.mentions ?? undefined,
                  created_at: message.created_at,
                  roof_id: roofId, // Use roofId directly since message does not have roof_id
                  message_type: "text" as const
                };
                return (
                  <ChatMessageComponent key={chatMessage.id} message={chatMessage} />
                );
              })
            )}
            <div />
          </div>
        </ScrollArea>
      </CardContent>

      <div className="flex-shrink-0 p-4 border-t">
        <form onSubmit={async (e) => { e.preventDefault(); await handleSendMessage(pinItem || ''); setPinItem(null); }}>
          <input
            value={pinItem || ''}
            onChange={(e) => setPinItem(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 border px-3 py-1 mr-2 rounded"
          />
          <Button type="submit" disabled={isSending}>Send</Button>
        </form>
      </div>
    </Card>
  );
}

// Change line 141 from:
// const SCOPE_TYPES = ['global', 'roof', 'pin'] as ['global', 'roof', 'pin'];
const SCOPE_TYPES = ['global', 'roof', 'pin'] as const;
