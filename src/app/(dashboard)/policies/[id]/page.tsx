"use client"

import { useEffect, useState } from "react"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { policiesApi, PolicyVersion } from "@/lib/api/policies"
import { Loader2, FileText, UploadCloud, CheckCircle, AlertCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export default function PolicyDetailPage({ params }: { params: { id: string } }) {
  const [versions, setVersions] = useState<PolicyVersion[]>([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    async function fetchVersions() {
      try {
        const v = await policiesApi.getPolicyVersions(params.id)
        setVersions(v)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchVersions()
  }, [params.id])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--brand-red)] mb-4" />
        <h2 className="text-xl font-semibold">Loading versions...</h2>
      </div>
    )
  }

  const currentVersion = versions[0]

  return (
    <div>
      <div className="flex justify-between items-start mb-6">
        <PageHeader 
          title={`Policy Details`} 
          description="Manage policy versions and view extracted requirements."
        />
        <Button className="bg-[var(--brand-red)] hover:bg-[var(--brand-red)]/90">
          <UploadCloud className="h-4 w-4 mr-2" />
          Upload New Version
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Version History</CardTitle>
            </CardHeader>
            <CardContent>
              {versions.length === 0 && <p className="text-muted-foreground text-sm">No versions found.</p>}
              <div className="space-y-4">
                {versions.map(v => (
                  <div key={v.id} className="border-b last:border-0 pb-3 last:pb-0 flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">Version {v.version_number}</span>
                      <Badge variant="outline" className={v.processing_status === 'completed' ? 'border-[var(--success)] text-[var(--success)]' : ''}>
                        {v.processing_status}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">{new Date(v.created_at).toLocaleDateString()}</span>
                    {v.change_note && <span className="text-sm italic">{v.change_note}</span>}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Extracted Requirements (Current Version)</CardTitle>
              <CardDescription>Rules automatically extracted by AI for compliance checks.</CardDescription>
            </CardHeader>
            <CardContent>
              {!currentVersion || currentVersion.requirements.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="mx-auto h-8 w-8 mb-2 opacity-50" />
                  <p>No requirements extracted yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {currentVersion.requirements.map(req => (
                    <div key={req.id} className="p-4 border rounded-md bg-[var(--surface-hover)]">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <Badge variant="secondary">{req.category.replace("_", " ")}</Badge>
                        {req.mandatory ? (
                          <Badge className="bg-[var(--brand-red)] hover:bg-[var(--brand-red)]">Mandatory</Badge>
                        ) : (
                          <Badge variant="outline">Recommended</Badge>
                        )}
                      </div>
                      <p className="text-sm font-medium leading-relaxed">{req.requirement_text}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
