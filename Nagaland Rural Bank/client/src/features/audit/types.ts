export type DashboardResponse = {
  status: 'success' | 'error' // assuming other values can be "error"
  message: string
  data: {
    statusCounts: {
      COMPLETED: number
      STARTED: number
      PENDING: number
    }
    auditorAssignments: AuditorAssignment[]
  }
}

export type AuditorAssignment = {
  auditorUsername: string
  assignments: Assignment[]
  assignmentCount: number
}

export type Assignment = {
  id: number
  accountNo: string
  auditPeriodFrom: string // ISO date string
  auditPeriodTo: string // ISO date string
  facilityType: string
  stockLocation: string
  auditorName: string
  auditorAddress: string
  auditScope: string
  sanctionLimit: number
  assignedAuditorUsername: string
  assignedBy: string
  deadline: string // ISO date string
  descriptionStatus: 'COMPLETED' | 'STARTED' | 'PENDING'
  descriptionCompletedTime: string | null
  draft: boolean
  status: 'COMPLETED' | 'STARTED' | 'PENDING'
  createdAt: string // ISO date string
  updatedAt: string // ISO date string
}
