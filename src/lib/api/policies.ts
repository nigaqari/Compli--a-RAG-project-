export interface PolicyRequirement {
  id: string
  category: string
  requirement_text: string
  mandatory: boolean
  source_chunk_id?: string
  page_number?: number
}

export interface PolicyVersion {
  id: string
  version_number: number
  uploaded_by: string
  change_note?: string
  processing_status: 'uploaded' | 'processing' | 'completed' | 'failed'
  processing_error?: string
  created_at: string
  requirements: PolicyRequirement[]
}

export interface Policy {
  id: string
  name: string
  category: string
  owner_id: string
  current_version: number
  created_at: string
  updated_at: string
}

export const policiesApi = {
  getPolicies: async (): Promise<Policy[]> => {
    const res = await fetch('/api/v1/policies')
    if (!res.ok) throw new Error('Failed to fetch policies')
    return res.json()
  },
  getPolicyVersions: async (policyId: string): Promise<PolicyVersion[]> => {
    const res = await fetch(`/api/v1/policies/${policyId}/versions`)
    if (!res.ok) throw new Error('Failed to fetch versions')
    return res.json()
  },
  uploadNewVersion: async (policyId: string, file: File, changeNote: string): Promise<PolicyVersion> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('change_note', changeNote)
    const res = await fetch(`/api/v1/policies/${policyId}/versions`, {
      method: 'POST',
      body: formData
    })
    if (!res.ok) throw new Error('Failed to upload new version')
    return res.json()
  }
}
