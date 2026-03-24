// Auth
export interface User {
  id: string
  fullName: string
  email: string
  role: 'SysAdmin' | 'Admin' | 'Validator' | 'User' | 'Vendor' | 'FrontDesk'
  isActive: boolean
}

export interface AuthResponse {
  token: string
  refreshToken: string
  expiresAt: string
  user: User
}

// Vendor Submission
export type SubmissionStatus =
  | 'Pending' | 'Analysing' | 'UnderReview'
  | 'Accepted' | 'Rejected' | 'ReturnedForRevision'

export interface VendorSubmission {
  id: string
  submissionNumber: string
  title: string
  description?: string
  status: number
  statusLabel: SubmissionStatus
  vendorCompanyName: string
  vendorContactName: string
  vendorContactEmail: string
  referenceNumber?: string
  documentDate?: string
  documentValue?: number
  fileName: string
  fileSizeBytes: number
  pageCount: number
  detectedDpi?: number
  dpiPass: boolean
  detectedDocumentType?: string
  extractedFieldsJson?: string
  detectedSignatoryName?: string
  aiGradeLabel?: string
  aiScore?: number
  aiSummary?: string
  analysisCompleted: boolean
  rejectionCategoryLabel?: string
  rejectionReason?: string
  returnNotes?: string
  validatorNotes?: string
  validatedAt?: string
  originalPdfUrl?: string
  searchablePdfUrl?: string
  resultDocumentId?: string
  resultDocumentNumber?: string
  vendorUserId: string
  vendorUserName: string
  resubmissionCount: number
  maxResubmissions: number
  parentSubmissionId?: string
  expiresAt: string
  createdAt: string
  updatedAt?: string
}

export interface DocumentType {
  id: string
  name: string
  code: string
  description?: string
  numberingFormat: string
}

export interface ApiError {
  success: false
  error: string
  errors?: string[]
  statusCode: number
  timestamp: string
}
