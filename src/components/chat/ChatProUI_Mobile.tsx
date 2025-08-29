"use client"

import React, { useCallback, useMemo, useRef, useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { Paperclip, Send, SmilePlus, Loader2, CornerUpRight, MoreHorizontal, Trash2, Pencil, Search, Download, X, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet"
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
    <div className="flex h-dvh max-h-dvh w-full overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-72 shrink-0 border-r bg-muted/20 flex-col">
        <div className="p-4 border-b">
          <h3 className="font-semibold">Chat Info</h3>
          <div className="text-sm text-muted-foreground mt-1">
            {onlineCount} users online
          </div>
        </div>
        <div className="flex-1 p-4 space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Recent Activity</h4>
            <div className="text-xs text-muted-foreground">
              Last message: {messages[messages.length - 1]?.created_at ? 
                formatDistanceToNow(new Date(messages[messages.length - 1].created_at), { addSuffix: true }) : 
                'No messages yet'
              }
            </div>
          </div>
          {unreadCount > 0 && (
            <div className="p-3 border rounded-lg bg-primary/5">
              <div className="text-sm font-medium">Unread Messages</div>
              <div className="text-2xl font-bold text-primary">{unreadCount}</div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Chat Area */}
      <section className="flex-1 flex flex-col min-w-0">
        {/* Header - Sticky */}
        <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur-sm">
          <div className="flex items-center gap-3 px-2 md:px-4 py-3">
            <div className="flex items-center gap-2 min-w-0">
              <div className="font-semibold truncate">{title}</div>
              {unreadCount > 0 && <Badge variant="secondary" className="shrink-0">{unreadCount}</Badge>}
            </div>
            
            <div className="ml-auto flex items-center gap-2">
              <div className="hidden sm:block text-xs text-muted-foreground shrink-0">
                {onlineCount} online
              </div>
              <div className="hidden lg:flex items-center gap-2">
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search..."
                  className="h-8 w-32 xl:w-48"
                />
                <Button size="sm" variant="outline" onClick={doSearch}>
                  <Search className="h-4 w-4"/>
                </Button>
                {searchResults && (
                  <Button size="sm" variant="ghost" onClick={() => setSearchResults(null)}>
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Mobile Search Bar */}
          <div className="lg:hidden px-2 md:px-4 pb-3">
            <div className="flex items-center gap-2">
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search messages..."
                className="h-8 flex-1"
              />
              <Button size="sm" variant="outline" onClick={doSearch}>
                <Search className="h-4 w-4"/>
              </Button>
              {searchResults && (
                <Button size="sm" variant="ghost" onClick={() => setSearchResults(null)}>
                  <X className="h-4 w-4"/>
                </Button>
              )}
            </div>
          </div>
        </header>

        {/* Search Results */}
        {searchResults && (
          <div className="border-b bg-muted/30 p-3">
            <div className="text-xs mb-2 text-muted-foreground">Found {searchResults.length} messages</div>
            <ScrollArea className="max-h-32">
              <div className="space-y-2">
                {searchResults.map((m) => (
                  <div key={m.id} className="text-sm p-2 rounded-md border hover:bg-muted/40 cursor-pointer" onClick={() => setSearchResults(null)}>
                    <span className="text-muted-foreground mr-2 text-xs">
                      {formatDistanceToNow(new Date(m.created_at), { addSuffix: true })}
                    </span>
                    <span className="line-clamp-1">{m.text}</span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Messages List - Scrollable */}
        <main className="flex-1 min-h-0 overflow-y-auto" ref={listRef}>
          <div className="p-2 md:p-4 space-y-4">
            {hasMore && (
              <div className="flex justify-center">
                <Button size="sm" variant="outline" onClick={() => loadMore()} disabled={isLoading}>
                  {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Loading...</> : "Load older"}
                </Button>
              </div>
            )}

            {messages.map((m) => (
              <MessageRow
                key={m.id}
                message={m}
                isOwn={!!m.created_by && currentUser?.id === m.created_by}
                onReply={() => setReplyTo(m.id)}
                onEdit={() => { setEditingId(m.id); setText(m.text) }}
                onDelete={() => deleteMessage(m.id)}
                onReact={(emoji) => toggleReaction(m.id, emoji)}
                allowReactions={options?.reactions !== false}
              />
            ))}

            {typingUsers.length > 0 && (
              <div className="text-xs text-muted-foreground px-2">Someone is typing…</div>
            )}
          </div>
        </main>

        {/* Reply Banner */}
        {replyTo && (
          <div className="px-2 md:px-4 py-2 border-t bg-muted/40 flex items-center gap-2 text-xs">
            Replying to <Badge variant="secondary">{replyTo.slice(0, 8)}...</Badge>
            <Button size="icon" variant="ghost" className="ml-auto h-6 w-6" onClick={() => setReplyTo(null)}>
              <X className="h-3 w-3"/>
            </Button>
          </div>
        )}

        {/* Composer - Sticky Bottom */}
        <footer className="sticky bottom-0 border-t bg-background pb-[env(safe-area-inset-bottom)]">
          <div className="p-2 md:p-3 space-y-2">
            {files.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {files.map((f, i) => (
                  <Badge key={i} variant="secondary" className="gap-2 max-w-full">
                    <span className="truncate">{f.name}</span>
                    <span className="opacity-60 shrink-0">({Math.round(f.size/1024)} KB)</span>
                    <button className="ml-1 shrink-0" onClick={() => setFiles(prev => prev.filter((_,idx)=>idx!==i))}>×</button>
                  </Badge>
                ))}
              </div>
            )}
            <div className="flex items-end gap-2">
              <label className="inline-flex items-center justify-center w-9 h-9 rounded-md border cursor-pointer shrink-0">
                <input type="file" multiple className="hidden" onChange={(e) => setFiles(Array.from(e.target.files ?? []))} />
                <Paperclip className="h-4 w-4"/>
              </label>
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder={editingId ? "Edit message…" : "Write a message…"}
                className="min-h-[42px] max-h-24 resize-none flex-1"
                rows={1}
              />
              <EmojiPicker onPick={(e) => setText(t => `${t}${e}`)} />
              <Button onClick={onSend} disabled={isLoading || (!text.trim() && files.length===0)} className="shrink-0">
                <Send className="h-4 w-4 sm:mr-1"/> 
                <span className="hidden sm:inline">Send</span>
              </Button>
            </div>
          </div>
        </footer>
      </section>
    </div>
  )
}

function MessageRow({
  message,
  isOwn,
  onReply,
  onEdit,
  onDelete,
  onReact,
  allowReactions
}: {
  message: any
  isOwn?: boolean
  onReply: () => void
  onEdit: () => void
  onDelete: () => void
  onReact: (emoji: string) => void
  allowReactions?: boolean
}) {
  const userName = message.created_by?.slice(0,6) ?? "User"
  const time = useMemo(() => formatDistanceToNow(new Date(message.created_at), { addSuffix: true }), [message.created_at])
  const reactions = message.reactions || {}
  const attachments = message.attachments || []

  return (
    <div className="group flex items-start gap-3">
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarImage src={""} alt={userName} />
        <AvatarFallback>{initials(userName, "U")}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{userName}</span>
          <span>•</span>
          <span>{time}{message.is_edited && " • edited"}</span>
        </div>
        <div className="mt-1 text-sm whitespace-pre-wrap break-words">
          {message.text}
        </div>

        {attachments.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {attachments.map((a: any) => (
              <a key={a.id} href={a.file_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-2 py-1 text-xs border rounded-md hover:bg-muted">
                <Download className="h-3 w-3"/> {a.file_name}
              </a>
            ))}
          </div>
        )}

        {/* Reactions bar */}
        {allowReactions && (
          <div className="mt-1 flex items-center gap-1 flex-wrap">
            {Object.entries(reactions).map(([emoji, users]) => (
              <button key={emoji} className="px-2 h-6 rounded-full border text-xs hover:bg-muted" onClick={() => onReact(emoji)}>
                {emoji} <span className="opacity-60">{(users as string[]).length}</span>
              </button>
            ))}
            <ReactionPicker onPick={onReact} />
          </div>
        )}

        {/* Actions */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity mt-1 flex items-center gap-1 flex-wrap">
          <Button variant="ghost" size="sm" className="h-7 px-2" onClick={onReply}>
            <CornerUpRight className="h-3.5 w-3.5 mr-1"/> Reply
          </Button>
          {isOwn && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 px-2"><MoreHorizontal className="h-4 w-4"/></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={onEdit}><Pencil className="h-3.5 w-3.5 mr-2"/>Edit</DropdownMenuItem>
                <DropdownMenuItem onClick={onDelete} className="text-destructive"><Trash2 className="h-3.5 w-3.5 mr-2"/>Delete</DropdownMenuItem>
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
        <Button variant="ghost" size="sm" className="h-6 px-2"><SmilePlus className="h-3.5 w-3.5"/></Button>
      </PopoverTrigger>
      <PopoverContent className="p-1 w-[210px] grid grid-cols-10 gap-1" align="start">
        {EMOJIS.map((e) => (
          <button key={e} className="h-7 w-7 text-lg hover:bg-muted rounded" onClick={() => onPick(e)}>{e}</button>
        ))}
      </PopoverContent>
    </Popover>
  )
}

function EmojiPicker({ onPick }: { onPick: (emoji: string) => void }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="h-9 w-9 shrink-0">
          <SmilePlus className="h-4 w-4"/>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[240px] p-2" align="end">
        <div className="grid grid-cols-8 gap-1">
          {EMOJIS.map((e) => (
            <button key={e} className="h-8 w-8 text-lg hover:bg-muted rounded" onClick={() => onPick(e)}>{e}</button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
