"use client"

import { useEffect, useState } from "react"
import { PageHeader } from "@/components/shared/page-header"
import { Button, buttonVariants } from "@/components/ui/button"
import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Loader2, ShieldCheck, Upload } from "lucide-react"
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

  useEffect(() => {
    async function fetchPolicies() {
      try {
        const data = await policiesApi.getPolicies()
        setPolicies(data)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchPolicies()
  }, [])

  return (
    <div>
      <PageHeader
        title="Policy Library"
        description="Manage your organization's compliance policies and version history."
        action={
          <Link href="/upload" className={buttonVariants({ variant: "default" })}>
            <Upload className="h-4 w-4 mr-2" />
            Upload Policy
          </Link>
        }
      />

      {loading ? (
        <div className="flex flex-col items-center justify-center h-[40vh]">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--brand-red)] mb-4" />
          <p className="text-[var(--text-secondary)]">Loading policies...</p>
        </div>
      ) : policies.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[40vh] border border-dashed rounded-xl text-center p-8">
          <ShieldCheck className="h-12 w-12 mb-4 text-[var(--text-secondary)] opacity-40" />
          <h3 className="text-lg font-semibold mb-1">No policies yet</h3>
          <p className="text-sm text-[var(--text-secondary)] mb-4">Upload your first policy to start running compliance checks.</p>
          <Link href="/upload" className={buttonVariants()}>Upload Policy</Link>
        </div>
      ) : (
        <div className="border rounded-xl bg-[var(--surface)] overflow-hidden">
          <Table>
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
                      className="hover:text-[var(--brand-red)] transition-colors"
                    >
                      {policy.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={categoryColors[policy.category] ?? ""}
                    >
                      {policy.category.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs font-mono bg-[var(--surface-hover)] border border-border px-2 py-0.5 rounded-full">
                      v{policy.current_version}
                    </span>
                  </TableCell>
                  <TableCell className="text-[var(--text-secondary)] text-sm">
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
      )}
    </div>
  )
}
