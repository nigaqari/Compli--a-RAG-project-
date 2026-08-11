"use client"

import { useState, useEffect, useRef } from "react"
import { PageHeader } from "@/components/shared/page-header"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Send, User, MessageSquarePlus, Trash2, Edit2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { chatApi, Conversation, ChatMessage, Citation } from "@/lib/api/chat"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

export default function ChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConv, setActiveConv] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchConversations()
  }, [])

  useEffect(() => {
    if (activeConv) {
      fetchMessages(activeConv.id)
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
      const newConv = await chatApi.createConversation("New Conversation")
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

  const handleSend = async () => {
    if (!input.trim()) return

    const question = input
    setInput("")
    
    // Optimistic UI update
    const userMsg: ChatMessage = { role: "user", content: question }
    setMessages(prev => [...prev, userMsg])
    setIsLoading(true)

    try {
      let convId = activeConv?.id
      if (!convId) {
        const newConv = await chatApi.createConversation(question.substring(0, 40) + "...")
        convId = newConv.id
        setConversations([newConv, ...conversations])
        setActiveConv(newConv)
      }

      const response = await chatApi.sendMessage(convId, question)
      
      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: response.answer,
        citations: response.citations
      }
      setMessages(prev => [...prev, assistantMsg])
      
      // Refresh convs to get potential title update
      fetchConversations()
    } catch (err) {
      console.error("Failed to send message", err)
      // Remove optimistic message if failed
      setMessages(prev => prev.slice(0, -1))
      alert("Failed to get response. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <PageHeader title="Juris AI Chat" />
      
      <div className="flex flex-1 overflow-hidden gap-4">
        {/* Sidebar */}
        <div className="w-[280px] hidden md:flex flex-col gap-2 shrink-0 border-r pr-4 overflow-y-auto">
          <Button onClick={handleNewChat} variant="outline" className="justify-start mb-2">
            <MessageSquarePlus className="mr-2 h-4 w-4" /> New Chat
          </Button>
          
          <div className="flex flex-col gap-1">
            {conversations.map(conv => (
              <div key={conv.id} className="group flex items-center relative">
                <Button 
                  onClick={() => setActiveConv(conv)}
                  variant="ghost" 
                  className={`w-full justify-start pr-10 overflow-hidden ${activeConv?.id === conv.id ? 'bg-surface-dark-alt/5 font-medium' : 'text-muted-foreground'}`}
                >
                  <span className="truncate">{conv.title}</span>
                </Button>
                <Button 
                  onClick={(e) => handleDelete(conv.id, e)}
                  variant="ghost" 
                  size="icon" 
                  className="absolute right-0 h-8 w-8 hidden group-hover:flex text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
        
        {/* Main Chat Area */}
        <Card className="flex-1 flex flex-col overflow-hidden relative bg-surface-alt/20">
          <div className="flex-1 overflow-auto p-6 space-y-6">
            
            {!activeConv && messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                <Avatar className="h-16 w-16 mb-4 border border-border shadow-sm grayscale">
                  <AvatarImage src="/logo_juris.jpg" className="object-cover" />
                  <AvatarFallback>AI</AvatarFallback>
                </Avatar>
                <h3 className="text-xl font-medium mb-2">How can I assist you today?</h3>
                <p className="text-sm max-w-sm">Select a document or just start typing to search across your compliance library.</p>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'gap-3 max-w-[85%]'}`}>
                {msg.role === 'assistant' && (
                  <Avatar className="h-8 w-8 mt-1 border border-border shadow-sm shrink-0">
                    <AvatarImage src="/logo_juris.jpg" className="object-cover" />
                    <AvatarFallback>AI</AvatarFallback>
                  </Avatar>
                )}
                
                <div className={`${msg.role === 'user' ? 'bg-brand-red text-white p-3 rounded-2xl rounded-tr-sm max-w-[80%] text-sm shadow-sm' : 'flex-1'}`}>
                  {msg.role === 'assistant' && (
                    <div className="text-xs font-medium text-muted-foreground mb-1">Juris</div>
                  )}
                  
                  <div className={msg.role === 'assistant' ? 'bg-surface border p-4 rounded-2xl rounded-tl-sm text-sm shadow-sm leading-relaxed text-foreground whitespace-pre-wrap' : ''}>
                    {msg.content}
                    
                    {/* Render Citations */}
                    {msg.citations && msg.citations.length > 0 && (
                      <div className="mt-4 pt-3 border-t flex flex-wrap gap-2">
                        {msg.citations.map((cit, idx) => (
                          <Popover key={idx}>
                            <PopoverTrigger>
                              <Badge variant="outline" className="cursor-pointer hover:bg-muted bg-surface-alt">
                                [{idx + 1}] {cit.document_name}, p.{cit.page_number}
                              </Badge>
                            </PopoverTrigger>
                            <PopoverContent className="w-80 p-4 text-sm">
                              <div className="font-semibold mb-2">{cit.document_name} (Page {cit.page_number})</div>
                              <p className="text-muted-foreground text-xs leading-relaxed italic mb-3">
                                "{cit.excerpt_snippet}"
                              </p>
                              <Link href={`/documents/${cit.document_id}`} className="text-brand-red text-xs hover:underline">
                                View Full Document →
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
              <div className="flex gap-3 max-w-[80%] opacity-50">
                <Avatar className="h-8 w-8 mt-1 border border-border shadow-sm">
                  <AvatarImage src="/logo_juris.jpg" className="object-cover" />
                </Avatar>
                <div>
                  <div className="bg-surface border p-4 rounded-2xl rounded-tl-sm text-sm shadow-sm flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce"></span>
                    <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce delay-75"></span>
                    <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce delay-150"></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          <div className="p-4 bg-surface border-t">
            <div className="relative flex items-center">
              <Input 
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder="Ask Juris about your documents..." 
                className="pr-12 py-6 rounded-full border-border bg-surface-alt/50 focus-visible:ring-brand-red/50 shadow-sm"
                disabled={isLoading}
              />
              <Button 
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                size="icon" 
                className="absolute right-1.5 rounded-full bg-brand-red hover:bg-brand-red-hover h-9 w-9"
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
