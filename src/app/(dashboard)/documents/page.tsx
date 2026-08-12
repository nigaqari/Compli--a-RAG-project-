"use client"

import { useEffect, useState } from "react"
import { PageHeader } from "@/components/shared/page-header"
import { Button, buttonVariants } from "@/components/ui/button"
import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { StatusBadge } from "@/components/shared/status-badge"
import { documentsApi, DocumentItem } from "@/lib/api/documents"
import { Loader2, FolderOpen, Upload, FileText, Trash2, AlertTriangle, Sparkles } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle
} from "@/components/ui/dialog"

export default function DocumentLibraryPage() {
  const [documents, setDocuments] = useState<DocumentItem[]>([])
  const [loading, setLoading] = useState(true)

  // Delete modal state
  const [deleteDoc, setDeleteDoc] = useState<DocumentItem | null>(null)
  const [deleting, setDeleting] = useState(false)

  const loadDocs = async () => {
    try {
      const data = await documentsApi.getDocuments()
      setDocuments(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDocs()
  }, [])

  const handleDeleteConfirm = async () => {
    if (!deleteDoc) return
    setDeleting(true)
    try {
      await documentsApi.deleteDocument(deleteDoc.id)
      setDocuments(prev => prev.filter(d => d.id !== deleteDoc.id))
      setDeleteDoc(null)
    } catch (e) {
      console.error("Failed to delete document", e)
      alert("Failed to delete document. Please try again.")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div>
      <PageHeader 
        title="Document Library" 
        description="Manage, view, and analyze all your contracts and uploaded documents."
        action={
          <Link href="/upload" className={buttonVariants({ variant: "default" })}>
            <Upload className="h-4 w-4 mr-2" />
            Upload Document
          </Link>
        } 
      />
      
      {loading ? (
        <div className="flex flex-col items-center justify-center h-[40vh]">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--brand-red)] mb-4" />
          <p className="text-muted-foreground">Loading documents...</p>
        </div>
      ) : documents.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[40vh] border border-dashed rounded-xl text-center p-8">
          <FolderOpen className="h-12 w-12 text-muted-foreground opacity-40 mb-4" />
          <h3 className="text-lg font-semibold mb-1">No documents uploaded yet</h3>
          <p className="text-sm text-muted-foreground mb-4">Upload contracts or agreements to get started.</p>
          <Link href="/upload" className={buttonVariants()}>Upload Document</Link>
        </div>
      ) : (
        <div className="border rounded-xl bg-[var(--surface)] overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Upload Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((doc) => (
                <TableRow key={doc.id} className="hover:bg-[var(--surface-hover)] transition-colors">
                  <TableCell className="font-semibold">
                    <Link href={`/documents/${doc.id}`} className="flex items-center gap-2 hover:text-[var(--brand-red)] transition-colors">
                      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="truncate max-w-[280px]">{doc.original_name || doc.filename}</span>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {doc.document_type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(doc.uploaded_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={doc.status || "completed"} />
                  </TableCell>
                  <TableCell className="text-right space-x-1.5">
                    <Link href={`/analysis/${doc.id}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
                      <Sparkles className="h-3.5 w-3.5 mr-1 text-[var(--brand-red)]" /> Analyze
                    </Link>
                    <Link href={`/documents/${doc.id}`} className={buttonVariants({ variant: "ghost", size: "sm" })}>
                      View
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteDoc(doc)}
                      className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 px-2"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteDoc} onOpenChange={(open) => !open && setDeleteDoc(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-destructive mb-1">
              <AlertTriangle className="h-5 w-5" />
              <DialogTitle>Delete Document</DialogTitle>
            </div>
            <DialogDescription>
              Are you sure you want to delete <strong className="text-foreground">{deleteDoc?.original_name || deleteDoc?.filename}</strong>? This will permanently remove all extracted chunks, analyses, compliance records, and generated reports.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteDoc(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleting}
            >
              {deleting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Deleting...</> : "Delete Permanently"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
