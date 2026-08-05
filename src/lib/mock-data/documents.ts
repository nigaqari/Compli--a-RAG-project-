export type DocumentStatus = "Analyzed" | "Pending" | "Flagged"
export type RiskLevel = "High" | "Medium" | "Low" | "Compliant"
export type DocumentType = "Contract" | "Policy" | "NDA" | "SLA"

export interface MockDocument {
  id: string
  name: string
  type: DocumentType
  owner: { name: string; avatar?: string }
  uploadDate: string
  status: DocumentStatus
  riskLevel: RiskLevel
  size: string
}

export const mockDocuments: MockDocument[] = [
  {
    id: "doc-1",
    name: "Vendor_Agreement_Acme.pdf",
    type: "Contract",
    owner: { name: "Jane Doe" },
    uploadDate: "2026-08-01",
    status: "Analyzed",
    riskLevel: "High",
    size: "2.4 MB"
  },
  {
    id: "doc-2",
    name: "Employee_Handbook_2026.pdf",
    type: "Policy",
    owner: { name: "HR Team" },
    uploadDate: "2026-08-02",
    status: "Analyzed",
    riskLevel: "Compliant",
    size: "1.1 MB"
  },
  {
    id: "doc-3",
    name: "Mutual_NDA_TechCorp.pdf",
    type: "NDA",
    owner: { name: "John Smith" },
    uploadDate: "2026-08-03",
    status: "Pending",
    riskLevel: "Medium",
    size: "0.8 MB"
  },
  {
    id: "doc-4",
    name: "Service_Level_Agreement_v2.pdf",
    type: "SLA",
    owner: { name: "Jane Doe" },
    uploadDate: "2026-08-04",
    status: "Flagged",
    riskLevel: "High",
    size: "3.2 MB"
  }
]
