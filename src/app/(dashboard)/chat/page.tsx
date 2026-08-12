"use client"

import { useState, useEffect, useRef } from "react"
import { PageHeader } from "@/components/shared/page-header"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Send, MessageSquarePlus, Trash2, Sparkles,
  FileText, ShieldCheck, Scale, AlertTriangle, ChevronRight, HelpCircle
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { chatApi, Conversation, ChatMessage } from "@/lib/api/chat"
import { documentsApi, DocumentItem } from "@/lib/api/documents"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"

const SUGGESTED_PROMPTS = [
  { icon: FileText, label: "Summarize active contract liabilities", prompt: "Summarize the key liabilities and financial exposures in our uploaded contracts." },
  { icon: Scale, label: "Standard termination notice periods", prompt: "What are the standard termination notice periods and cancellation clauses across our agreements?" },
  { icon: ShieldCheck, label: "GDPR & Data Privacy compliance", prompt: "Explain the essential data privacy and GDPR compliance requirements for commercial vendor contracts." },
  { icon: AlertTriangle, label: "Highlight high-risk indemnity terms", prompt: "What are common high-risk indemnity provisions that should be flagged during contract review?" }
]

export default function ChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConv, setActiveConv] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [documents, setDocuments] = useState<DocumentItem[]>([])
  const [selectedDocScope, setSelectedDocScope] = useState<string>("all")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchConversations()
    documentsApi.getDocuments().then(setDocuments).catch(() => {})
  }, [])

  useEffect(() => {
    if (activeConv) {
      fetchMessages(activeConv.id)
      setSelectedDocScope(activeConv.document_scope_id || "all")
    } else {
      setMessages([])
    }
  }, [activeConv])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const fetchConversations = async () => {
    try {
      const data = await chatApi.listConversations()
      setConversations(data)
    } catch (err) {
      console.error("Failed to load conversations", err)
    }
  }

  const fetchMessages = async (id: string) => {
    try {
      const data = await chatApi.getMessages(id)
      setMessages(data)
    } catch (err) {
      console.error("Failed to load messages", err)
    }
  }

  const handleNewChat = async () => {
    try {
      const scopeId = selectedDocScope !== "all" ? selectedDocScope : undefined
      const newConv = await chatApi.createConversation("New Conversation", scopeId)
      setConversations([newConv, ...conversations])
      setActiveConv(newConv)
    } catch (err) {
      console.error("Failed to create chat", err)
    }
  }

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await chatApi.deleteConversation(id)
      setConversations(conversations.filter(c => c.id !== id))
      if (activeConv?.id === id) setActiveConv(null)
    } catch (err) {
      console.error("Failed to delete chat", err)
    }
  }

  const handleSend = async (overridePrompt?: string) => {
    const question = overridePrompt || input
    if (!question.trim()) return

    setInput("")
    
    // Optimistic UI update
    const userMsg: ChatMessage = { role: "user", content: question }
    setMessages(prev => [...prev, userMsg])
    setIsLoading(true)

    try {
      let convId = activeConv?.id
      if (!convId) {
        const scopeId = selectedDocScope !== "all" ? selectedDocScope : undefined
        const newConv = await chatApi.createConversation(question.substring(0, 40) + "...", scopeId)
        convId = newConv.id
        setConversations([newConv, ...conversations])
        setActiveConv(newConv)
      }

      const scopeId = selectedDocScope !== "all" ? selectedDocScope : undefined
      const response = await chatApi.sendMessage(convId, question, scopeId)
      
      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: response.answer,
        citations: response.citations
      }
      setMessages(prev => [...prev, assistantMsg])
      fetchConversations()
    } catch (err) {
      console.error("Failed to send message", err)
      setMessages(prev => prev.slice(0, -1))
      alert("Failed to get response from Juris AI. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <PageHeader 
        title="Juris AI Assistant" 
        description="Conversational legal intelligence, RAG document interrogation, and compliance advisor."
        action={
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground hidden sm:inline">Scope:</span>
            <Select value={selectedDocScope} onValueChange={(v) => setSelectedDocScope(v ?? 'all')}>
              <SelectTrigger className="w-[200px] h-9 text-xs">
                <SelectValue placeholder="Scope to document..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Library Documents</SelectItem>
                {documents.map(d => (
                  <SelectItem key={d.id} value={d.id}>{d.original_name || d.filename}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
      />
      
      <div className="flex flex-1 overflow-hidden gap-4 mt-2">
        {/* Sidebar */}
        <div className="w-[260px] hidden md:flex flex-col gap-2 shrink-0 border-r pr-4 overflow-y-auto">
          <Button onClick={handleNewChat} variant="outline" className="justify-start mb-2 border-dashed">
            <MessageSquarePlus className="mr-2 h-4 w-4 text-[var(--brand-red)]" /> New Chat
          </Button>
          
          <div className="flex flex-col gap-1">
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-1">
              Chat History
            </div>
            {conversations.length === 0 ? (
              <div className="text-xs text-muted-foreground px-2 py-4 text-center">
                No past chats
              </div>
            ) : (
              conversations.map(conv => (
                <div key={conv.id} className="group flex items-center relative">
                  <Button 
                    onClick={() => setActiveConv(conv)}
                    variant="ghost" 
                    className={`w-full justify-start pr-10 text-xs h-9 overflow-hidden ${activeConv?.id === conv.id ? 'bg-[var(--brand-red)]/10 text-[var(--brand-red)] font-semibold' : 'text-muted-foreground'}`}
                  >
                    <span className="truncate">{conv.title}</span>
                  </Button>
                  <Button 
                    onClick={(e) => handleDelete(conv.id, e)}
                    variant="ghost" 
                    size="icon" 
                    className="absolute right-1 h-7 w-7 hidden group-hover:flex text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
        
        {/* Main Chat Area */}
        <Card className="flex-1 flex flex-col overflow-hidden relative bg-[var(--surface)] border-[var(--border)]">
          <div className="flex-1 overflow-auto p-6 space-y-6">
            
            {/* Friendly Greeting Welcome State */}
            {(!activeConv || messages.length === 0) && (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 max-w-xl mx-auto">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-[var(--brand-red)] to-rose-400 text-white flex items-center justify-center shadow-lg mb-4">
                  <Sparkles className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-bold mb-2 tracking-tight">Hello! I'm Juris AI.</h3>
                <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                  Alright, which document or contract do you need help with today? You can ask me to analyze terms, check policy compliance, highlight legal risks, or answer general contracting questions.
                </p>

                {/* Quick Interactive Prompt Chips */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full text-left">
                  {SUGGESTED_PROMPTS.map((item, idx) => {
                    const Icon = item.icon
                    return (
                      <button
                        key={idx}
                        onClick={() => handleSend(item.prompt)}
                        className="flex items-start gap-2.5 p-3 rounded-xl border border-[var(--border)] bg-muted/30 hover:bg-muted/70 hover:border-[var(--brand-red)]/50 transition-all text-xs group cursor-pointer"
                      >
                        <Icon className="h-4 w-4 text-[var(--brand-red)] shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-foreground group-hover:text-[var(--brand-red)] transition-colors">{item.label}</div>
                          <div className="text-[11px] text-muted-foreground truncate">{item.prompt}</div>
                        </div>
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Message Thread */}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'gap-3 max-w-[88%]'}`}>
                {msg.role === 'assistant' && (
                  <div className="h-8 w-8 rounded-full bg-[var(--brand-red)] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                    AI
                  </div>
                )}
                
                <div className={`${msg.role === 'user' ? 'bg-[var(--brand-red)] text-white p-3.5 rounded-2xl rounded-tr-sm max-w-[80%] text-sm shadow-sm' : 'flex-1'}`}>
                  {msg.role === 'assistant' && (
                    <div className="text-xs font-semibold text-muted-foreground mb-1 flex items-center gap-1.5">
                      <span>Juris AI</span>
                      <span className="text-[10px] text-muted-foreground font-normal">• Legal Intelligence</span>
                    </div>
                  )}
                  
                  <div className={msg.role === 'assistant' ? 'bg-muted/40 border border-[var(--border)] p-4 rounded-2xl rounded-tl-sm text-sm shadow-sm leading-relaxed text-foreground whitespace-pre-wrap' : ''}>
                    {msg.content}
                    
                    {/* Citations Pills */}
                    {msg.citations && msg.citations.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-[var(--border)] flex flex-wrap gap-2">
                        <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1 w-full mb-1">
                          <HelpCircle className="h-3 w-3" /> Grounded Source Citations:
                        </span>
                        {msg.citations.map((cit, idx) => (
                          <Popover key={idx}>
                            <PopoverTrigger>
                              <Badge variant="outline" className="cursor-pointer hover:bg-muted bg-[var(--surface)] text-xs border-[var(--border)]">
                                [{idx + 1}] {cit.document_name}, p.{cit.page_number}
                              </Badge>
                            </PopoverTrigger>
                            <PopoverContent className="w-80 p-4 text-sm">
                              <div className="font-semibold text-xs mb-1.5">{cit.document_name} (Page {cit.page_number})</div>
                              <p className="text-muted-foreground text-xs leading-relaxed italic mb-3">
                                &ldquo;{cit.excerpt_snippet}&rdquo;
                              </p>
                              <Link href={`/documents/${cit.document_id}`} className="text-[var(--brand-red)] text-xs font-medium hover:underline flex items-center gap-1">
                                View Full Document <ChevronRight className="h-3 w-3" />
                              </Link>
                            </PopoverContent>
                          </Popover>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex gap-3 max-w-[80%]">
                <div className="h-8 w-8 rounded-full bg-[var(--brand-red)] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm animate-pulse">
                  AI
                </div>
                <div>
                  <div className="bg-muted/40 border border-[var(--border)] p-4 rounded-2xl rounded-tl-sm text-sm shadow-sm flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[var(--brand-red)] animate-ping"></span>
                    <span className="text-xs text-muted-foreground">Juris AI is thinking and searching contracts...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Chat Input Bar */}
          <div className="p-4 bg-[var(--surface)] border-t border-[var(--border)]">
            <div className="relative flex items-center">
              <Input 
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="Ask Juris about your contracts, compliance standards, or legal terms..." 
                className="pr-12 py-6 rounded-full border-[var(--border)] bg-muted/30 focus-visible:ring-[var(--brand-red)]/50 shadow-sm text-sm"
                disabled={isLoading}
              />
              <Button 
                onClick={() => handleSend()}
                disabled={!input.trim() || isLoading}
                size="icon" 
                className="absolute right-1.5 rounded-full bg-[var(--brand-red)] hover:bg-[var(--brand-red)]/90 text-white h-9 w-9"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
