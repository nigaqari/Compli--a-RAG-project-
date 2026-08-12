"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { PageHeader } from "@/components/shared/page-header"
import { Card } from "@/components/ui/card"
import { UploadCloud, File as FileIcon, X, CheckCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import axios from "axios"

export default function UploadPage() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [docType, setDocType] = useState<string>("contract")
  const [uploadProgress, setUploadProgress] = useState(0)
  const [status, setStatus] = useState<"idle" | "uploading" | "processing" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState("")
  const [documentId, setDocumentId] = useState<string | null>(null)
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
      // Create a mock event to reuse handleFileChange logic
      handleFileChange({ target: { files: [dropped] } } as any)
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setStatus("uploading")
    setUploadProgress(0)
    setErrorMessage("")

    const formData = new FormData()
    formData.append("file", file)
    formData.append("document_type", docType)

    try {
      const response = await axios.post("http://localhost:8000/api/v1/documents/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
            setUploadProgress(percentCompleted)
          }
        }
      })

      setDocumentId(response.data.id)
      setStatus("processing")
      
      // Setup polling for processing status
      pollStatus(response.data.id)
      
    } catch (err: any) {
      console.error(err)
      setStatus("error")
      setErrorMessage(err.response?.data?.detail || "An error occurred during upload")
    }
  }

  const pollStatus = async (id: string) => {
    try {
      const res = await axios.get(`http://localhost:8000/api/v1/documents/${id}/status`)
      const docStatus = res.data.processing_status
      
      if (docStatus === "completed") {
        setStatus("success")
        setTimeout(() => {
          router.push(`/documents/${id}`)
        }, 1500)
      } else if (docStatus === "failed") {
        setStatus("error")
        setErrorMessage("Processing failed: " + res.data.processing_error)
      } else {
        // Still processing, check again in 2 seconds
        setTimeout(() => pollStatus(id), 2000)
      }
    } catch (err) {
      console.error("Error polling status", err)
      // Continue polling unless it's a 404
      setTimeout(() => pollStatus(id), 3000)
    }
  }

  return (
    <div className="max-w-4xl mx-auto pb-10">
      <PageHeader title="Upload Documents" />
      
      {!file ? (
        <Card 
          className="border-dashed border-2 p-16 flex flex-col items-center justify-center hover:border-brand-red transition-colors cursor-pointer bg-surface-alt/50"
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
          <UploadCloud className="h-16 w-16 text-ink-muted mb-4" />
          <h3 className="text-xl font-semibold mb-2">Drag & drop files here</h3>
          <p className="text-sm text-muted-foreground mb-6">PDF only, max 25MB</p>
          <Button variant="outline" className="pointer-events-none">Select File</Button>
        </Card>
      ) : (
        <Card className="p-8 space-y-6">
          <div className="flex items-start justify-between border-b pb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <FileIcon className="h-8 w-8 text-primary" />
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
              <label className="text-sm font-medium mb-1.5 block">Document Type</label>
              <Select value={docType} onValueChange={(v) => setDocType(v ?? 'contract')} disabled={status !== "idle"}>
                <SelectTrigger className="w-[300px]">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="policy">Policy</SelectItem>
                  <SelectItem value="nda">NDA</SelectItem>
                  <SelectItem value="sla">SLA</SelectItem>
                </SelectContent>
              </Select>
            </div>

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
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <div className="text-center">
                  <h4 className="font-medium">Processing Document...</h4>
                  <p className="text-sm text-muted-foreground">Extracting text, chunking, and embedding (this may take a moment).</p>
                </div>
              </div>
            )}

            {status === "success" && (
              <div className="pt-4 flex flex-col items-center justify-center space-y-4 py-8 text-green-600">
                <CheckCircle className="h-10 w-10" />
                <div className="text-center">
                  <h4 className="font-medium text-lg">Upload Complete</h4>
                  <p className="text-sm text-muted-foreground">Redirecting to document viewer...</p>
                </div>
              </div>
            )}

            {status === "idle" && (
              <div className="pt-6 flex justify-end">
                <Button onClick={handleUpload} size="lg">Upload Document</Button>
              </div>
            )}
          </div>
        </Card>
      )}
      
      {status === "error" && (
        <div className="mt-4 p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-md">
          {errorMessage}
        </div>
      )}
    </div>
  )
}
