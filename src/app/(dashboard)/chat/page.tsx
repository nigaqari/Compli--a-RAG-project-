"use client"

import { useState, useEffect, useRef } from "react"
import { PageHeader } from "@/components/shared/page-header"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Send, MessageSquarePlus, Trash2, Sparkles,
  FileText, ShieldCheck, Scale, AlertTriangle, ChevronRight,
  HelpCircle, Paperclip, UploadCloud, Loader2
} from "lucide-react"
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
  const [isUploadingInChat, setIsUploadingInChat] = useState(false)
  const [uploadStatusText, setUploadStatusText] = useState("")
  const [isDragging, setIsDragging] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatFileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchConversations()
    fetchDocuments()
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
  }, [messages, isUploadingInChat])

  const fetchDocuments = async () => {
    try {
      const data = await documentsApi.getDocuments()
      setDocuments(data)
    } catch (err) {
      console.error("Failed to load documents", err)
    }
  }

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

  // Handle direct in-chat document upload
  const handleInChatUpload = async (file: File) => {
    if (!file || file.type !== "application/pdf") {
      alert("Please upload a valid PDF document.")
      return
    }

    setIsUploadingInChat(true)
    setUploadStatusText(`Uploading and indexing "${file.name}"...`)

    try {
      const doc = await documentsApi.uploadDocument(file, "contract")
      
      // Auto-poll status until completed or 6 seconds
      let attempts = 0
      const poll = async () => {
        try {
          const s = await documentsApi.getStatus(doc.id)
          if (s.processing_status === "completed" || attempts >= 3) {
            await fetchDocuments()
            setSelectedDocScope(doc.id)
            setIsUploadingInChat(false)

            // Add Assistant Greeting for this document
            const welcomeMsg: ChatMessage = {
              role: "assistant",
              content: `I've successfully uploaded and indexed **${file.name}** into your library!\n\nI'm now scoped to this document. What would you like to know about it? For example, you can ask me to summarize its key obligations, identify high-risk liability clauses, or check termination terms.`
            }
            setMessages(prev => [...prev, welcomeMsg])
          } else {
            attempts++
            setTimeout(poll, 2000)
          }
        } catch {
          setIsUploadingInChat(false)
        }
      }
      setTimeout(poll, 1500)
    } catch (err: any) {
      console.error("Upload error", err)
      alert(err.message || "Failed to upload document")
      setIsUploadingInChat(false)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] sm:h-[calc(100vh-7rem)] w-full max-w-full overflow-x-hidden">
      <PageHeader 
        title="Juris AI Assistant" 
        description="Conversational legal intelligence, RAG document interrogation, and compliance advisor."
        action={
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-muted-foreground hidden sm:inline">Scope:</span>
            <Select value={selectedDocScope} onValueChange={(v) => setSelectedDocScope(v ?? 'all')}>
              <SelectTrigger className="w-full sm:w-[220px] h-9 text-xs">
                <SelectValue placeholder="Scope to document..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">🔍 All Library Documents ({documents.length})</SelectItem>
                {documents.map(d => (
                  <SelectItem key={d.id} value={d.id}>{d.original_name || d.filename}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
      />
      
      <div className="flex flex-1 overflow-hidden gap-4 mt-2">
        {/* Desktop History Sidebar */}
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
        <Card 
          className={`flex-1 flex flex-col overflow-hidden relative bg-[var(--surface)] border-[var(--border)] transition-colors ${
            isDragging ? 'border-[var(--brand-red)] bg-[var(--brand-red)]/5' : ''
          }`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setIsDragging(false)
            const file = e.dataTransfer.files?.[0]
            if (file) handleInChatUpload(file)
          }}
        >
          <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
            
            {/* Friendly Greeting Welcome State */}
            {(!activeConv || messages.length === 0) && (
              <div className="h-full flex flex-col items-center justify-center text-center p-3 sm:p-6 max-w-xl mx-auto">
                <div className="h-12 sm:h-16 w-12 sm:w-16 rounded-2xl bg-gradient-to-tr from-[var(--brand-red)] to-rose-400 text-white flex items-center justify-center shadow-lg mb-3 sm:mb-4 shrink-0">
                  <Sparkles className="h-6 sm:h-8 w-6 sm:w-8" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold mb-2 tracking-tight">Hello! I'm Juris AI.</h3>
                <p className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6 leading-relaxed">
                  I can automatically search across all documents in your library to answer questions, highlight liabilities, evaluate compliance risks, or compare contracts.
                </p>

                {/* If no documents in library yet, provide direct in-chat upload card */}
                {documents.length === 0 ? (
                  <div className="w-full p-4 sm:p-5 border border-dashed rounded-xl bg-muted/30 flex flex-col items-center gap-2.5 sm:gap-3 mb-4 sm:mb-6">
                    <UploadCloud className="h-7 sm:h-8 w-7 sm:w-8 text-[var(--brand-red)] opacity-80" />
                    <div className="text-center">
                      <p className="text-xs sm:text-sm font-semibold">No documents in your library yet</p>
                      <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">Upload a contract or agreement directly here so I can analyze and search it for you.</p>
                    </div>
                    <Button
                      onClick={() => chatFileInputRef.current?.click()}
                      className="bg-[var(--brand-red)] hover:bg-[var(--brand-red)]/90 text-white text-xs h-8 sm:h-9"
                    >
                      <Paperclip className="h-3.5 w-3.5 mr-1.5" /> Upload Document to Chat
                    </Button>
                  </div>
                ) : (
                  /* Quick Interactive Prompt Chips */
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5 w-full text-left">
                    {SUGGESTED_PROMPTS.map((item, idx) => {
                      const Icon = item.icon
                      return (
                        <button
                          key={idx}
                          onClick={() => handleSend(item.prompt)}
                          className="flex items-start gap-2 sm:gap-2.5 p-2.5 sm:p-3 rounded-xl border border-[var(--border)] bg-muted/30 hover:bg-muted/70 hover:border-[var(--brand-red)]/50 transition-all text-xs group cursor-pointer"
                        >
                          <Icon className="h-4 w-4 text-[var(--brand-red)] shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-foreground group-hover:text-[var(--brand-red)] transition-colors text-xs">{item.label}</div>
                            <div className="text-[11px] text-muted-foreground truncate">{item.prompt}</div>
                          </div>
                          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:translate-x-0.5 transition-transform shrink-0" />
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Message Thread */}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'gap-2 sm:gap-3 max-w-[95%] sm:max-w-[88%]'}`}>
                {msg.role === 'assistant' && (
                  <div className="h-7 sm:h-8 w-7 sm:w-8 rounded-full bg-[var(--brand-red)] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                    AI
                  </div>
                )}
                
                <div className={`${msg.role === 'user' ? 'bg-[var(--brand-red)] text-white p-3 sm:p-3.5 rounded-2xl rounded-tr-sm max-w-[90%] sm:max-w-[80%] text-xs sm:text-sm shadow-sm' : 'flex-1 min-w-0'}`}>
                  {msg.role === 'assistant' && (
                    <div className="text-[11px] sm:text-xs font-semibold text-muted-foreground mb-1 flex items-center gap-1.5">
                      <span>Juris AI</span>
                      <span className="text-[10px] text-muted-foreground font-normal">• Legal Intelligence</span>
                    </div>
                  )}
                  
                  <div className={msg.role === 'assistant' ? 'bg-muted/40 border border-[var(--border)] p-3 sm:p-4 rounded-2xl rounded-tl-sm text-xs sm:text-sm shadow-sm leading-relaxed text-foreground whitespace-pre-wrap break-words' : ''}>
                    {msg.content}
                    
                    {/* Citations Pills */}
                    {msg.citations && msg.citations.length > 0 && (
                      <div className="mt-3 sm:mt-4 pt-3 border-t border-[var(--border)] flex flex-wrap gap-1.5 sm:gap-2">
                        <span className="text-[10px] sm:text-[11px] text-muted-foreground font-medium flex items-center gap-1 w-full mb-1">
                          <HelpCircle className="h-3 w-3" /> Grounded Source Citations:
                        </span>
                        {msg.citations.map((cit, idx) => (
                          <Popover key={idx}>
                            <PopoverTrigger>
                              <Badge variant="outline" className="cursor-pointer hover:bg-muted bg-[var(--surface)] text-[10px] sm:text-xs border-[var(--border)] max-w-[200px] truncate">
                                [{idx + 1}] {cit.document_name}, p.{cit.page_number}
                              </Badge>
                            </PopoverTrigger>
                            <PopoverContent className="w-72 sm:w-80 p-3 sm:p-4 text-xs sm:text-sm">
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
            
            {/* Uploading In Progress Indicator */}
            {isUploadingInChat && (
              <div className="flex gap-2 sm:gap-3 max-w-[90%] sm:max-w-[80%]">
                <div className="h-7 sm:h-8 w-7 sm:w-8 rounded-full bg-[var(--brand-red)] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                  AI
                </div>
                <div>
                  <div className="bg-muted/40 border border-[var(--border)] p-3 sm:p-4 rounded-2xl rounded-tl-sm text-xs sm:text-sm shadow-sm flex items-center gap-2.5">
                    <Loader2 className="h-4 w-4 animate-spin text-[var(--brand-red)] shrink-0" />
                    <span className="text-xs text-foreground font-medium">{uploadStatusText}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Thinking / RAG Search Indicator */}
            {isLoading && (
              <div className="flex gap-2 sm:gap-3 max-w-[90%] sm:max-w-[80%]">
                <div className="h-7 sm:h-8 w-7 sm:w-8 rounded-full bg-[var(--brand-red)] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm animate-pulse">
                  AI
                </div>
                <div>
                  <div className="bg-muted/40 border border-[var(--border)] p-3 sm:p-4 rounded-2xl rounded-tl-sm text-xs sm:text-sm shadow-sm flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[var(--brand-red)] animate-ping"></span>
                    <span className="text-xs text-muted-foreground">Juris AI is analyzing documents across your library...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Chat Input Bar */}
          <div className="p-2.5 sm:p-4 bg-[var(--surface)] border-t border-[var(--border)]">
            <input
              type="file"
              ref={chatFileInputRef}
              accept="application/pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleInChatUpload(file)
                e.target.value = ""
              }}
            />
            
            <div className="relative flex items-center">
              {/* In-chat upload button */}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => chatFileInputRef.current?.click()}
                disabled={isUploadingInChat || isLoading}
                title="Upload & Analyze Document in Chat"
                className="absolute left-1.5 sm:left-2 text-muted-foreground hover:text-[var(--brand-red)] h-7 sm:h-8 w-7 sm:w-8 rounded-full z-10"
              >
                <Paperclip className="h-4 w-4" />
              </Button>

              <Input 
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="Ask Juris about your contracts, or attach a document..." 
                className="pl-9 sm:pl-11 pr-11 sm:pr-12 py-4 sm:py-6 rounded-full border-[var(--border)] bg-muted/30 focus-visible:ring-[var(--brand-red)]/50 shadow-sm text-xs sm:text-sm"
                disabled={isLoading || isUploadingInChat}
              />
              <Button 
                onClick={() => handleSend()}
                disabled={!input.trim() || isLoading || isUploadingInChat}
                size="icon" 
                className="absolute right-1 sm:right-1.5 rounded-full bg-[var(--brand-red)] hover:bg-[var(--brand-red)]/90 text-white h-7 sm:h-9 w-7 sm:w-9"
              >
                <Send className="h-3.5 sm:h-4 w-3.5 sm:w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
