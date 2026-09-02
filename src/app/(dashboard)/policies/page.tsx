"use client"

import { useEffect, useState, useRef } from "react"
import { PageHeader } from "@/components/shared/page-header"
import { Button, buttonVariants } from "@/components/ui/button"
import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, ShieldCheck, Upload, FileText, CheckCircle, AlertCircle } from "lucide-react"
import { policiesApi, Policy } from "@/lib/api/policies"

const categoryColors: Record<string, string> = {
  data_privacy: "border-blue-500/40 text-blue-500 bg-blue-500/5",
  vendor: "border-amber-500/40 text-amber-500 bg-amber-500/5",
  hr: "border-purple-500/40 text-purple-500 bg-purple-500/5",
  security: "border-rose-500/40 text-rose-500 bg-rose-500/5",
}

export default function PolicyLibraryPage() {
  const [policies, setPolicies] = useState<Policy[]>([])
  const [loading, setLoading] = useState(true)

  // Upload Policy Dialog State
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [policyFile, setPolicyFile] = useState<File | null>(null)
  const [policyName, setPolicyName] = useState("")
  const [category, setCategory] = useState<string>("data_privacy")
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchPolicies = async () => {
    try {
      setLoading(true)
      const data = await policiesApi.getPolicies()
      setPolicies(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPolicies()
  }, [])

  const handleFileChange = (file: File | null) => {
    setPolicyFile(file)
    if (file && !policyName) {
      const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ")
      setPolicyName(cleanName)
    }
  }

  const handleUploadPolicy = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!policyFile || !policyName.trim()) return

    setUploading(true)
    setUploadError(null)

    try {
      await policiesApi.createPolicy(policyFile, policyName.trim(), category)
      setUploadDialogOpen(false)
      setPolicyFile(null)
      setPolicyName("")
      setCategory("data_privacy")
      await fetchPolicies()
    } catch (err: any) {
      setUploadError(err.message || "Failed to upload policy")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="w-full max-w-full overflow-x-hidden">
      <PageHeader
        title="Policy Library"
        description="Manage your organization's compliance policies and version history."
        action={
          <Button 
            id="open-upload-policy-btn"
            className="bg-[var(--brand-red)] hover:bg-[var(--brand-red)]/90 text-white"
            onClick={() => {
              setUploadDialogOpen(true)
              setPolicyFile(null)
              setPolicyName("")
              setUploadError(null)
            }}
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload Policy
          </Button>
        }
      />

      {loading ? (
        <div className="flex flex-col items-center justify-center h-[40vh]">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--brand-red)] mb-4" />
          <p className="text-[var(--text-secondary)] text-sm">Loading policies...</p>
        </div>
      ) : policies.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[40vh] border border-dashed rounded-xl text-center p-6 sm:p-8">
          <ShieldCheck className="h-10 sm:h-12 w-10 sm:w-12 mb-3 sm:mb-4 text-[var(--text-secondary)] opacity-40" />
          <h3 className="text-base sm:text-lg font-semibold mb-1">No policies yet</h3>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mb-4">Upload your first policy to start running compliance checks.</p>
          <Button 
            className="bg-[var(--brand-red)] hover:bg-[var(--brand-red)]/90 text-white"
            onClick={() => setUploadDialogOpen(true)}
          >
            <Upload className="h-4 w-4 mr-2" /> Upload Policy
          </Button>
        </div>
      ) : (
        <div className="border rounded-xl bg-[var(--surface)] overflow-hidden w-full">
          <div className="w-full overflow-x-auto">
            <Table className="w-full min-w-[550px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {policies.map(policy => (
                  <TableRow key={policy.id} className="hover:bg-[var(--surface-hover)] transition-colors">
                    <TableCell className="font-semibold">
                      <Link
                        href={`/policies/${policy.id}`}
                        className="hover:text-[var(--brand-red)] transition-colors truncate max-w-[200px] block"
                      >
                        {policy.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`capitalize text-xs ${categoryColors[policy.category] ?? ""}`}
                      >
                        {policy.category.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-mono bg-[var(--surface-hover)] border border-border px-2 py-0.5 rounded-full">
                        v{policy.current_version}
                      </span>
                    </TableCell>
                    <TableCell className="text-[var(--text-secondary)] text-xs sm:text-sm">
                      {new Date(policy.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link
                        href={`/policies/${policy.id}`}
                        className={buttonVariants({ variant: "ghost", size: "sm" })}
                      >
                        View
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Upload Policy Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="sm:max-w-lg w-[95vw] max-w-[95vw] sm:w-full">
          <DialogHeader>
            <DialogTitle>Upload Compliance Policy</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Upload a standard policy PDF (e.g. GDPR, Vendor Risk, Security Standards) to compare contracts against.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUploadPolicy} className="space-y-4 pt-2">
            {/* Drop Zone */}
            <div
              className="border-2 border-dashed rounded-xl p-4 sm:p-6 text-center cursor-pointer hover:border-[var(--brand-red)]/50 transition-colors bg-[var(--surface-hover)]/40"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={e => handleFileChange(e.target.files?.[0] || null)}
              />
              {policyFile ? (
                <div className="flex flex-col items-center gap-1.5 text-xs sm:text-sm">
                  <CheckCircle className="h-7 sm:h-8 w-7 sm:w-8 text-emerald-500" />
                  <p className="font-semibold truncate max-w-full">{policyFile.name}</p>
                  <p className="text-xs text-muted-foreground">{(policyFile.size / 1024 / 1024).toFixed(2)} MB · Click to replace</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1.5 text-muted-foreground">
                  <FileText className="h-7 sm:h-8 w-7 sm:w-8 opacity-50" />
                  <p className="font-medium text-xs sm:text-sm">Click to select PDF or drag & drop</p>
                  <p className="text-[11px] sm:text-xs">Max 25MB · PDF only</p>
                </div>
              )}
            </div>

            {/* Policy Name */}
            <div className="space-y-1.5">
              <Label htmlFor="policy-name" className="text-xs sm:text-sm">Policy Name</Label>
              <Input
                id="policy-name"
                placeholder="e.g. Global Data Privacy Standard 2026"
                value={policyName}
                onChange={e => setPolicyName(e.target.value)}
                required
                className="text-xs sm:text-sm"
              />
            </div>

            {/* Policy Category */}
            <div className="space-y-1.5">
              <Label htmlFor="policy-category" className="text-xs sm:text-sm">Category</Label>
              <Select value={category} onValueChange={(val) => setCategory(val || 'data_privacy')}>
                <SelectTrigger id="policy-category" className="text-xs sm:text-sm">
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="data_privacy">Data Privacy (GDPR, CCPA)</SelectItem>
                  <SelectItem value="vendor">Vendor Management & Procurement</SelectItem>
                  <SelectItem value="security">Security & Infrastructure</SelectItem>
                  <SelectItem value="hr">Human Resources & Employment</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {uploadError && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs sm:text-sm flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            <DialogFooter className="flex-col-reverse sm:flex-row gap-2 sm:gap-0 pt-2">
              <Button type="button" variant="outline" onClick={() => setUploadDialogOpen(false)} disabled={uploading} className="w-full sm:w-auto">
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[var(--brand-red)] hover:bg-[var(--brand-red)]/90 text-white w-full sm:w-auto"
                disabled={!policyFile || !policyName.trim() || uploading}
              >
                {uploading ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Uploading...</>
                ) : (
                  <><Upload className="h-4 w-4 mr-2" /> Upload Policy</>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
