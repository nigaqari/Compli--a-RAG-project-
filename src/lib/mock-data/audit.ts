export interface MockAuditLog {
  id: string
  timestamp: string
  user: { name: string; email: string }
  action: "Upload" | "Query" | "Report" | "Delete" | "Analyze"
  target: string
  ip: string
}

export const mockAuditLogs: MockAuditLog[] = [
  {
    id: "log-1",
    timestamp: "2026-08-04T10:23:00Z",
    user: { name: "Jane Doe", email: "jane@example.com" },
    action: "Upload",
    target: "Service_Level_Agreement_v2.pdf",
    ip: "192.168.1.42"
  },
  {
    id: "log-2",
    timestamp: "2026-08-04T09:15:00Z",
    user: { name: "John Smith", email: "john@example.com" },
    action: "Analyze",
    target: "Mutual_NDA_TechCorp.pdf",
    ip: "192.168.1.15"
  },
  {
    id: "log-3",
    timestamp: "2026-08-03T14:45:00Z",
    user: { name: "Jane Doe", email: "jane@example.com" },
    action: "Report",
    target: "Q3_Risk_Summary",
    ip: "192.168.1.42"
  },
  {
    id: "log-4",
    timestamp: "2026-08-02T11:05:00Z",
    user: { name: "HR Team", email: "hr@example.com" },
    action: "Upload",
    target: "Employee_Handbook_2026.pdf",
    ip: "10.0.0.5"
  }
]
