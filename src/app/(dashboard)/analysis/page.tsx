"use client"

import { useEffect, useState } from "react"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button, buttonVariants } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Loader2, FileText, Sparkles, FolderOpen, ArrowRight } from "lucide-react"
import { documentsApi, DocumentItem } from "@/lib/api/documents"
import Link from "next/link"

export default function DocumentAnalysisIndexPage() {
  const [documents, setDocuments] = useState<DocumentItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadDocs() {
      try {
        const data = await documentsApi.getDocuments()
        setDocuments(data)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    loadDocs()
  }, [])

  return (
    <div>
      <PageHeader
        title="Document Analysis"
        description="Select a contract or document to run AI extraction, risk assessment, and clause analysis."
      />

      {loading ? (
        <div className="flex flex-col items-center justify-center h-[40vh]">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--brand-red)] mb-4" />
          <p className="text-muted-foreground">Loading documents...</p>
        </div>
      ) : documents.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[40vh] border border-dashed rounded-xl text-center p-8">
          <FolderOpen className="h-12 w-12 text-muted-foreground opacity-40 mb-4" />
          <h3 className="text-lg font-semibold mb-1">No documents uploaded</h3>
          <p className="text-sm text-muted-foreground mb-4">Upload a document first to run AI analysis.</p>
          <Link href="/upload" className={buttonVariants()}>Upload Document</Link>
        </div>
      ) : (
        <div className="border rounded-xl bg-[var(--surface)] overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Uploaded</TableHead>
                <TableHead>Compliance Score</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((doc) => (
                <TableRow key={doc.id} className="hover:bg-[var(--surface-hover)] transition-colors">
                  <TableCell className="font-semibold">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span>{doc.original_name || doc.filename}</span>
                    </div>
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
                    {doc.compliance_score !== null && doc.compliance_score !== undefined ? (
                      <span className="font-semibold text-[var(--success)]">{doc.compliance_score}%</span>
                    ) : (
                      <span className="text-muted-foreground text-sm">Not analyzed</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={`/analysis/${doc.id}`}
                      className={buttonVariants({ variant: "default", size: "sm" })}
                    >
                      <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                      Analyze
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
