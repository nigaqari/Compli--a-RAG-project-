"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { PageHeader } from "@/components/shared/page-header"
import { Card } from "@/components/ui/card"
import { UploadCloud, File as FileIcon, X, CheckCircle, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { documentsApi } from "@/lib/api/documents"
import { policiesApi } from "@/lib/api/policies"

export default function UploadPage() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [docType, setDocType] = useState<string>("contract")
  
  // Specific policy fields
  const [policyName, setPolicyName] = useState("")
  const [policyCategory, setPolicyCategory] = useState("data_privacy")

  const [uploadProgress, setUploadProgress] = useState(0)
  const [status, setStatus] = useState<"idle" | "uploading" | "processing" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState("")
  const [targetUrl, setTargetUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (selected) {
      if (selected.type !== "application/pdf") {
        setStatus("error")
        setErrorMessage("Only PDF files are allowed")
        return
      }
      if (selected.size > 25 * 1024 * 1024) {
        setStatus("error")
        setErrorMessage("File exceeds 25MB limit")
        return
      }
      setFile(selected)
      if (!policyName) {
        const cleanName = selected.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ")
        setPolicyName(cleanName)
      }
      setStatus("idle")
      setErrorMessage("")
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const dropped = e.dataTransfer.files?.[0]
    if (dropped) {
      handleFileChange({ target: { files: [dropped] } } as any)
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setStatus("uploading")
    setUploadProgress(30)
    setErrorMessage("")

    try {
      if (docType === "policy") {
        // Upload via policies API
        const pol = await policiesApi.createPolicy(
          file,
          policyName.trim() || file.name,
          policyCategory
        )
        setUploadProgress(100)
        setStatus("success")
        setTargetUrl(`/policies/${pol.id}`)
        setTimeout(() => {
          router.push(`/policies/${pol.id}`)
        }, 1500)
      } else {
        // Upload via documents API
        const doc = await documentsApi.uploadDocument(file, docType)
        setUploadProgress(100)
        setStatus("processing")
        pollStatus(doc.id)
      }
    } catch (err: any) {
      console.error(err)
      setStatus("error")
      setErrorMessage(err.message || "An error occurred during upload")
    }
  }

  const pollStatus = async (id: string) => {
    try {
      const res = await documentsApi.getStatus(id)
      const docStatus = res.processing_status
      
      if (docStatus === "completed") {
        setStatus("success")
        setTargetUrl(`/documents/${id}`)
        setTimeout(() => {
          router.push(`/documents/${id}`)
        }, 1500)
      } else if (docStatus === "failed") {
        setStatus("error")
        setErrorMessage("Processing failed: " + (res.processing_error || "Unknown error"))
      } else {
        setTimeout(() => pollStatus(id), 2000)
      }
    } catch (err) {
      setTimeout(() => pollStatus(id), 3000)
    }
  }

  return (
    <div className="max-w-4xl mx-auto pb-10">
      <PageHeader 
        title="Upload Documents & Policies" 
        description="Add contracts, agreements, or organizational compliance policies to your library."
      />
      
      {!file ? (
        <Card 
          className="border-dashed border-2 p-16 flex flex-col items-center justify-center hover:border-[var(--brand-red)] transition-colors cursor-pointer bg-[var(--surface-hover)]/30"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <input 
            type="file" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="application/pdf" 
          />
          <UploadCloud className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
          <h3 className="text-xl font-semibold mb-2">Drag & drop files here</h3>
          <p className="text-sm text-muted-foreground mb-6">PDF only, max 25MB</p>
          <Button variant="outline" className="pointer-events-none">Select File</Button>
        </Card>
      ) : (
        <Card className="p-8 space-y-6">
          <div className="flex items-start justify-between border-b pb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[var(--brand-red)]/10 text-[var(--brand-red)] rounded-lg">
                <FileIcon className="h-8 w-8" />
              </div>
              <div>
                <h4 className="font-semibold">{file.name}</h4>
                <p className="text-sm text-muted-foreground">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
              </div>
            </div>
            {status === "idle" && (
              <Button variant="ghost" size="icon" onClick={() => setFile(null)}>
                <X className="h-5 w-5" />
              </Button>
            )}
          </div>

          <div className="space-y-4 pt-2">
            <div>
              <Label className="text-sm font-medium mb-1.5 block">Document Type</Label>
              <Select value={docType} onValueChange={(v) => setDocType(v ?? 'contract')} disabled={status !== "idle"}>
                <SelectTrigger className="w-[300px]">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="contract">Commercial Contract</SelectItem>
                  <SelectItem value="policy">Compliance Policy</SelectItem>
                  <SelectItem value="nda">Non-Disclosure Agreement (NDA)</SelectItem>
                  <SelectItem value="sla">Service Level Agreement (SLA)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Policy specific options */}
            {docType === "policy" && status === "idle" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-lg bg-[var(--surface-hover)] border">
                <div className="space-y-1.5">
                  <Label htmlFor="upload-pol-name">Policy Name</Label>
                  <Input
                    id="upload-pol-name"
                    value={policyName}
                    onChange={e => setPolicyName(e.target.value)}
                    placeholder="e.g. Data Privacy Standard 2026"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="upload-pol-cat">Policy Category</Label>
                  <Select value={policyCategory} onValueChange={(v) => setPolicyCategory(v ?? 'data_privacy')}>
                    <SelectTrigger id="upload-pol-cat">
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="data_privacy">Data Privacy</SelectItem>
                      <SelectItem value="vendor">Vendor Management</SelectItem>
                      <SelectItem value="security">Security & Infrastructure</SelectItem>
                      <SelectItem value="hr">Human Resources</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {status === "uploading" && (
              <div className="space-y-2 pt-4">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Uploading...</span>
                  <span className="text-muted-foreground">{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}
            
            {status === "processing" && (
              <div className="pt-4 flex flex-col items-center justify-center space-y-4 py-8">
                <Loader2 className="h-8 w-8 animate-spin text-[var(--brand-red)]" />
                <div className="text-center">
                  <h4 className="font-medium">Processing Document...</h4>
                  <p className="text-sm text-muted-foreground">Extracting text, chunking, and embedding vectors into ChromaDB.</p>
                </div>
              </div>
            )}

            {status === "success" && (
              <div className="pt-4 flex flex-col items-center justify-center space-y-4 py-8 text-emerald-600 dark:text-emerald-400">
                <CheckCircle className="h-10 w-10" />
                <div className="text-center">
                  <h4 className="font-medium text-lg">Upload Complete</h4>
                  <p className="text-sm text-muted-foreground">Redirecting...</p>
                </div>
              </div>
            )}

            {status === "idle" && (
              <div className="pt-6 flex justify-end">
                <Button 
                  onClick={handleUpload} 
                  size="lg"
                  className="bg-[var(--brand-red)] hover:bg-[var(--brand-red)]/90 text-white"
                >
                  Upload & Index
                </Button>
              </div>
            )}
          </div>
        </Card>
      )}
      
      {status === "error" && (
        <div className="mt-4 p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-md flex items-center gap-2 text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  )
}
