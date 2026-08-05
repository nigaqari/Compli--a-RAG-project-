import { PageHeader } from "@/components/shared/page-header"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Send, User } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function ChatPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <PageHeader title="Juris AI Chat" />
      
      <div className="flex flex-1 overflow-hidden gap-4">
        <div className="w-[280px] hidden md:flex flex-col gap-2 shrink-0 border-r pr-4">
          <Button variant="outline" className="justify-start mb-2">+ New Chat</Button>
          <Button variant="ghost" className="justify-start bg-surface-dark-alt/5">Analyze Vendor Contract</Button>
          <Button variant="ghost" className="justify-start text-muted-foreground">What is our HR policy?</Button>
        </div>
        
        <Card className="flex-1 flex flex-col overflow-hidden relative bg-surface-alt/20">
          <div className="flex-1 overflow-auto p-6 space-y-6">
            
            <div className="flex justify-end">
              <div className="bg-brand-red text-white p-3 rounded-2xl rounded-tr-sm max-w-[80%] text-sm shadow-sm">
                Does this contract have a termination clause?
              </div>
            </div>
            
            <div className="flex gap-3 max-w-[80%]">
              <Avatar className="h-8 w-8 mt-1 border border-border shadow-sm">
                <AvatarImage src="/logo_juris.jpg" className="object-cover" />
                <AvatarFallback>AI</AvatarFallback>
              </Avatar>
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-1">Juris</div>
                <div className="bg-surface border p-4 rounded-2xl rounded-tl-sm text-sm shadow-sm leading-relaxed text-foreground">
                  Yes, the contract contains a termination clause in section 4.2. It states that either party may terminate the agreement with 30 days written notice.
                </div>
              </div>
            </div>
            
          </div>
          
          <div className="p-4 bg-surface border-t">
            <div className="relative">
              <Input 
                placeholder="Ask Juris about your documents..." 
                className="pr-12 py-6 rounded-full border-border bg-surface-alt/50 focus-visible:ring-brand-red/50 shadow-sm"
              />
              <Button size="icon" className="absolute right-1.5 top-1.5 rounded-full bg-brand-red hover:bg-brand-red-hover h-9 w-9">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
