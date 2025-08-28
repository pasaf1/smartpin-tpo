"use client"

import React, { useCallback, useMemo, useRef, useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { Paperclip, Send, SmilePlus, Loader2, CornerUpRight, MoreHorizontal, Trash2, Pencil, Search, Download, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useChatPro } from "@/lib/hooks/useChatPro"

export type Scope = "global" | "roof" | "pin"

interface ChatProUIProps {
  scope: Scope
  scopeId?: string | null
  title?: string
  currentUser?: { id: string; name?: string; avatarUrl?: string }
  options?: {
    reactions?: boolean
    reads?: boolean
    attachments?: boolean
    typing?: boolean
    presence?: boolean
  }
}

const EMOJIS = ["👍","🔥","✅","❗","🎯","🚀","🙏","😍","🎉","🤔"]

function initials(name?: string, fallback: string = "U") {
  if (!name) return fallback
  const parts = name.split(" ").filter(Boolean)
  if (!parts.length) return fallback
  if (parts.length === 1) return parts[0][0]?.toUpperCase() || fallback
  return `${parts[0][0]}${parts[parts.length-1][0]}`.toUpperCase()
}

export default function ChatProUI({ scope, scopeId = null, title = "Chat", currentUser, options }: ChatProUIProps) {
  const {
    messages,
    hasMore,
    loadMore,
    isLoading,
    sendMessage,
    editMessage,
    deleteMessage,
    toggleReaction,
    unreadCount,
    markRead,
    startTyping,
    typingUsers,
    onlineUsers,
    search
  } = useChatPro(scope, scopeId, {
    enableReactions: options?.reactions !== false,
    enableReads: options?.reads !== false,
    enableAttachments: options?.attachments !== false,
    enableTyping: options?.typing !== false,
    enablePresence: options?.presence !== false,
  })

  const [text, setText] = useState("")
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState<any[] | null>(null)
  const [files, setFiles] = useState<File[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const onSend = useCallback(async () => {
    const trimmed = text.trim()
    if (!trimmed && files.length === 0) return
    
    try {
      if (editingId) {
        await editMessage(editingId, trimmed)
        setEditingId(null)
        setText("")
        return
      }
      await sendMessage({ text: trimmed, reply_to: replyTo, attachments: files.length ? files : undefined })
      setText("")
      setReplyTo(null)
      setFiles([])
      markRead()
      // scroll bottom
      setTimeout(() => listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" }), 50)
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }, [text, files, replyTo, editingId, sendMessage, editMessage, markRead])

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      onSend()
    } else {
      startTyping()
    }
  }

  const doSearch = useCallback(async () => {
    if (!searchTerm.trim()) { setSearchResults(null); return }
    const res = await search(searchTerm.trim())
    setSearchResults(res)
  }, [search, searchTerm])

  const onlineCount = onlineUsers?.length ?? 0

  return (
    <div className="flex flex-col h-full border rounded-xl overflow-hidden bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-muted/40">
        <div className="flex items-center gap-2">
          <div className="font-semibold text-foreground">{title}</div>
          {unreadCount > 0 && <Badge variant="secondary" className="bg-blue-100 text-blue-800">{unreadCount} new</Badge>}
        </div>
        <div className="ml-auto flex items-center gap-3">
          <div className="text-xs text-muted-foreground">{onlineCount} online</div>
          <div className="hidden md:flex items-center gap-2">
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search messages..."
              className="h-8 w-48"
              onKeyDown={(e) => e.key === 'Enter' && doSearch()}
            />
            <Button size="sm" variant="outline" onClick={doSearch} disabled={!searchTerm.trim()}>
              <Search className="h-4 w-4"/>
            </Button>
            {searchResults && (
              <Button size="sm" variant="ghost" onClick={() => setSearchResults(null)}>
                <X className="h-4 w-4"/>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Search results panel */}
      {searchResults && (
        <div className="border-b p-3 bg-muted/20">
          <div className="text-xs mb-2 text-muted-foreground font-medium">
            Found {searchResults.length} message{searchResults.length !== 1 ? 's' : ''}
          </div>
          <div className="max-h-40 overflow-auto space-y-2">
            {searchResults.map((m) => (
              <div 
                key={m.id} 
                className="text-sm p-2 rounded-md border hover:bg-muted/40 cursor-pointer transition-colors"
                onClick={() => setSearchResults(null)}
              >
                <span className="text-muted-foreground mr-2">
                  {formatDistanceToNow(new Date(m.created_at), { addSuffix: true })}
                </span>
                <span className="text-foreground">{m.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Messages list */}
      <ScrollArea className="flex-1" ref={listRef as any}>
        <div className="p-4 space-y-4">
          {hasMore && (
            <div className="flex justify-center">
              <Button size="sm" variant="outline" onClick={() => loadMore()} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                    Loading...
                  </>
                ) : (
                  "Load older messages"
                )}
              </Button>
            </div>
          )}

          {messages.map((m) => (
            <MessageRow
              key={m.id}
              message={m}
              isOwn={!!(m.created_by && currentUser?.id === m.created_by)}
              currentUser={currentUser}
              onReply={() => setReplyTo(m.id)}
              onEdit={() => { setEditingId(m.id); setText(m.text) }}
              onDelete={() => deleteMessage(m.id)}
              onReact={(emoji) => toggleReaction(m.id, emoji)}
              allowReactions={options?.reactions !== false}
            />
          ))}

          {typingUsers.length > 0 && (
            <div className="text-xs text-muted-foreground px-2 italic">
              {typingUsers.map(u => u.name).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Reply banner */}
      {replyTo && (
        <div className="px-4 py-2 border-t bg-blue-50 flex items-center gap-2 text-xs">
          <CornerUpRight className="h-3 w-3 text-blue-600"/>
          <span className="text-muted-foreground">Replying to message</span>
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">{replyTo.slice(0, 8)}...</Badge>
          <Button size="sm" variant="ghost" className="ml-auto h-6 w-6 p-0" onClick={() => setReplyTo(null)}>
            <X className="h-3 w-3"/>
          </Button>
        </div>
      )}

      {/* File attachments preview */}
      {files.length > 0 && (
        <div className="px-4 py-2 border-t bg-amber-50">
          <div className="text-xs text-muted-foreground mb-2 font-medium">Attachments ({files.length})</div>
          <div className="flex flex-wrap gap-2">
            {files.map((f, i) => (
              <Badge key={i} variant="secondary" className="gap-2 bg-amber-100 text-amber-800">
                <Paperclip className="h-3 w-3"/>
                {f.name}
                <span className="opacity-60">({Math.round(f.size/1024)} KB)</span>
                <button 
                  className="ml-1 hover:bg-amber-200 rounded-sm px-1" 
                  onClick={() => setFiles(prev => prev.filter((_,idx)=>idx!==i))}
                >
                  ×
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Composer */}
      <div className="border-t p-3 bg-background">
        <div className="flex items-end gap-2">
          <label className="inline-flex items-center justify-center w-9 h-9 rounded-md border cursor-pointer hover:bg-muted transition-colors">
            <input 
              type="file" 
              multiple 
              className="hidden" 
              onChange={(e) => setFiles(Array.from(e.target.files ?? []))} 
              accept="image/*,.pdf,.doc,.docx,.txt"
            />
            <Paperclip className="h-4 w-4"/>
          </label>
          <div className="flex-1">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder={editingId ? "Edit message..." : "Write a message... (Enter to send, Shift+Enter = new line)"}
              className="min-h-[42px] max-h-36 resize-none"
              disabled={isLoading}
            />
          </div>
          <EmojiPicker onPick={(e) => setText(t => `${t}${e}`)} />
          <Button 
            onClick={onSend} 
            disabled={isLoading || (!text.trim() && files.length===0)}
            className="h-9"
          >
            <Send className="h-4 w-4 mr-1"/> 
            {editingId ? 'Update' : 'Send'}
          </Button>
        </div>
      </div>
    </div>
  )
}

function MessageRow({
  message,
  isOwn,
  currentUser,
  onReply,
  onEdit,
  onDelete,
  onReact,
  allowReactions
}: {
  message: any
  isOwn?: boolean
  currentUser?: { id: string; name?: string; avatarUrl?: string }
  onReply: () => void
  onEdit: () => void
  onDelete: () => void
  onReact: (emoji: string) => void
  allowReactions?: boolean
}) {
  const userName = message.created_by === currentUser?.id 
    ? (currentUser?.name || 'You') 
    : (message.created_by?.slice(0,8) || 'User')
  const time = useMemo(() => formatDistanceToNow(new Date(message.created_at), { addSuffix: true }), [message.created_at])
  const reactions = message.reactions || {}
  const attachments = message.attachments || []

  return (
    <div className={`group flex items-start gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}>
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarImage src={currentUser?.avatarUrl || ""} alt={userName} />
        <AvatarFallback className={isOwn ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"}>
          {initials(userName, "U")}
        </AvatarFallback>
      </Avatar>
      <div className={`flex-1 min-w-0 ${isOwn ? 'text-right' : ''}`}>
        <div className={`flex items-center gap-2 text-xs text-muted-foreground ${isOwn ? 'justify-end' : ''}`}>
          <span className="font-medium text-foreground">{userName}</span>
          <span>•</span>
          <span>{time}{message.is_edited && " • edited"}</span>
        </div>
        <div className={`mt-1 text-sm whitespace-pre-wrap break-words p-3 rounded-lg max-w-md ${
          isOwn 
            ? 'bg-blue-500 text-white ml-auto' 
            : 'bg-muted text-foreground'
        }`}>
          {message.text}
        </div>

        {/* Attachments */}
        {attachments.length > 0 && (
          <div className={`mt-2 flex flex-wrap gap-2 ${isOwn ? 'justify-end' : ''}`}>
            {attachments.map((a: any) => (
              <a 
                key={a.id} 
                href={a.file_url} 
                target="_blank" 
                rel="noreferrer" 
                className="inline-flex items-center gap-2 px-2 py-1 text-xs border rounded-md hover:bg-muted transition-colors"
              >
                <Download className="h-3 w-3"/> {a.file_name}
              </a>
            ))}
          </div>
        )}

        {/* Reactions bar */}
        {allowReactions && (Object.keys(reactions).length > 0 || !isOwn) && (
          <div className={`mt-2 flex items-center gap-1 ${isOwn ? 'justify-end' : ''}`}>
            {Object.entries(reactions).map(([emoji, users]) => (
              <button 
                key={emoji} 
                className="px-2 h-6 rounded-full border text-xs hover:bg-muted transition-colors bg-background" 
                onClick={() => onReact(emoji)}
              >
                {emoji} <span className="opacity-60">{(users as string[]).length}</span>
              </button>
            ))}
            <ReactionPicker onPick={onReact} />
          </div>
        )}

        {/* Actions */}
        <div className={`opacity-0 group-hover:opacity-100 transition-opacity mt-2 flex items-center gap-1 ${isOwn ? 'justify-end' : ''}`}>
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={onReply}>
            <CornerUpRight className="h-3 w-3 mr-1"/> Reply
          </Button>
          {isOwn && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 px-2">
                  <MoreHorizontal className="h-3 w-3"/>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={isOwn ? "end" : "start"}>
                <DropdownMenuItem onClick={onEdit}>
                  <Pencil className="h-3 w-3 mr-2"/>Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onDelete} className="text-destructive">
                  <Trash2 className="h-3 w-3 mr-2"/>Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </div>
  )
}

function ReactionPicker({ onPick }: { onPick: (emoji: string) => void }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
          <SmilePlus className="h-3 w-3"/>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-2 w-[220px] grid grid-cols-10 gap-1" align="start">
        {EMOJIS.map((e) => (
          <button 
            key={e} 
            className="h-7 w-7 text-lg hover:bg-muted rounded transition-colors" 
            onClick={() => onPick(e)}
          >
            {e}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  )
}

function EmojiPicker({ onPick }: { onPick: (emoji: string) => void }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="h-9 w-9">
          <SmilePlus className="h-4 w-4"/>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[240px] p-2" align="end">
        <div className="grid grid-cols-8 gap-1">
          {EMOJIS.map((e) => (
            <button 
              key={e} 
              className="h-8 w-8 text-lg hover:bg-muted rounded transition-colors" 
              onClick={() => onPick(e)}
            >
              {e}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
