"use client"

import { useEffect, useState, useRef } from "react"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { policiesApi, PolicyVersion } from "@/lib/api/policies"
import { Loader2, UploadCloud, AlertCircle, CheckCircle, Clock, XCircle, FileText, ArrowLeft } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import Link from "next/link"

const statusIcon = (status: string) => {
  switch (status) {
    case "completed": return <CheckCircle className="h-3.5 w-3.5 text-[var(--success)]" />
    case "processing": return <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-500" />
    case "failed": return <XCircle className="h-3.5 w-3.5 text-[var(--risk-high)]" />
    default: return <Clock className="h-3.5 w-3.5 text-[var(--text-secondary)]" />
  }
}

const statusClass = (status: string) => {
  switch (status) {
    case "completed": return "border-[var(--success)] text-[var(--success)]"
    case "processing": return "border-amber-500 text-amber-500"
    case "failed": return "border-[var(--risk-high)] text-[var(--risk-high)]"
    default: return ""
  }
}

export default function PolicyDetailPage({ params }: { params: { id: string } }) {
  const [versions, setVersions] = useState<PolicyVersion[]>([])
  const [loading, setLoading] = useState(true)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [changeNote, setChangeNote] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchVersions = async () => {
    try {
      const v = await policiesApi.getPolicyVersions(params.id)
      setVersions(v)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchVersions() }, [params.id])

  const handleUpload = async () => {
    if (!selectedFile) return
    setUploading(true)
    setUploadError(null)
    try {
      await policiesApi.uploadNewVersion(params.id, selectedFile, changeNote)
      setUploadOpen(false)
      setSelectedFile(null)
      setChangeNote("")
      setLoading(true)
      await fetchVersions()
    } catch (e: any) {
      setUploadError(e.message || "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file?.type === "application/pdf") setSelectedFile(file)
  }

  const currentVersion = versions[0]

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--brand-red)] mb-4" />
        <h2 className="text-xl font-semibold">Loading policy...</h2>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-start mb-6">
        <div>
          <Link
            href="/policies"
            className="inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Policy Library
          </Link>
          <PageHeader
            title="Policy Details"
            description="Manage policy versions and review AI-extracted requirements."
          />
        </div>
        <Button
          id="upload-new-version-btn"
          className="bg-[var(--brand-red)] hover:bg-[var(--brand-red)]/90 mt-2"
          onClick={() => setUploadOpen(true)}
        >
          <UploadCloud className="h-4 w-4 mr-2" />
          Upload New Version
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Version History Sidebar */}
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Version History</CardTitle>
            </CardHeader>
            <CardContent>
              {versions.length === 0 && (
                <p className="text-muted-foreground text-sm">No versions found.</p>
              )}
              <div className="space-y-4">
                {versions.map((v, idx) => (
                  <div key={v.id} className="border-b last:border-0 pb-3 last:pb-0 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-sm">Version {v.version_number}</span>
                        {idx === 0 && (
                          <span className="text-[10px] font-bold bg-[var(--brand-red)]/10 text-[var(--brand-red)] border border-[var(--brand-red)]/20 px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                            Current
                          </span>
                        )}
                      </div>
                      <Badge variant="outline" className={`text-xs flex items-center gap-1 ${statusClass(v.processing_status)}`}>
                        {statusIcon(v.processing_status)}
                        {v.processing_status}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">{new Date(v.created_at).toLocaleDateString()}</span>
                    {v.change_note && (
                      <span className="text-xs italic text-[var(--text-secondary)] bg-[var(--surface-hover)] p-2 rounded-md border border-border">
                        "{v.change_note}"
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Requirements Main Panel */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Extracted Requirements</CardTitle>
              <CardDescription>
                AI-extracted, testable rules for the current version — used in compliance checks.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!currentVersion || currentVersion.requirements.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <AlertCircle className="mx-auto h-8 w-8 mb-2 opacity-40" />
                  <p className="font-medium">No requirements extracted yet.</p>
                  <p className="text-sm mt-1">Requirements are extracted automatically once the policy finishes processing.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {currentVersion.requirements.map(req => (
                    <div key={req.id} className="p-4 border rounded-lg bg-[var(--surface-hover)] hover:border-[var(--brand-red)]/30 transition-colors">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <Badge variant="secondary" className="text-xs shrink-0">
                          {req.category.replace(/_/g, " ")}
                        </Badge>
                        {req.mandatory ? (
                          <Badge className="bg-[var(--brand-red)] hover:bg-[var(--brand-red)] text-white text-xs shrink-0">
                            Mandatory
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs shrink-0">Recommended</Badge>
                        )}
                      </div>
                      <p className="text-sm font-medium leading-relaxed">{req.requirement_text}</p>
                      {req.page_number && (
                        <p className="text-xs text-muted-foreground mt-1.5">Page {req.page_number}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Upload New Version Dialog */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Upload New Version</DialogTitle>
            <DialogDescription>
              Upload a new PDF to replace the current policy version. Past versions and their compliance results remain unchanged.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* File Drop Zone */}
            <div
              id="version-file-dropzone"
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                dragOver
                  ? "border-[var(--brand-red)] bg-[var(--brand-red)]/5"
                  : selectedFile
                  ? "border-[var(--success)] bg-[var(--success)]/5"
                  : "border-border hover:border-[var(--brand-red)]/40 hover:bg-[var(--surface-hover)]"
              }`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={e => setSelectedFile(e.target.files?.[0] ?? null)}
              />
              {selectedFile ? (
                <div className="flex flex-col items-center gap-2">
                  <CheckCircle className="h-8 w-8 text-[var(--success)]" />
                  <p className="font-semibold text-sm">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">{(selectedFile.size / 1024).toFixed(1)} KB · Click to change</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <FileText className="h-8 w-8 opacity-50" />
                  <p className="font-medium text-sm">Drop PDF here or click to browse</p>
                  <p className="text-xs">Max 25 MB · PDF only</p>
                </div>
              )}
            </div>

            {/* Change Note */}
            <div>
              <label className="text-sm font-medium mb-1.5 block text-[var(--text-primary)]">
                Change Note <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <Textarea
                id="version-change-note"
                placeholder='e.g. "Updated data retention period to 90 days"'
                value={changeNote}
                onChange={e => setChangeNote(e.target.value)}
                className="resize-none"
                rows={3}
              />
            </div>

            {uploadError && (
              <p className="text-sm text-[var(--risk-high)] flex items-center gap-1.5">
                <XCircle className="h-4 w-4" /> {uploadError}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadOpen(false)} disabled={uploading}>
              Cancel
            </Button>
            <Button
              id="version-upload-submit"
              className="bg-[var(--brand-red)] hover:bg-[var(--brand-red)]/90"
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
            >
              {uploading ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Uploading...</>
              ) : (
                <><UploadCloud className="h-4 w-4 mr-2" /> Upload Version</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
