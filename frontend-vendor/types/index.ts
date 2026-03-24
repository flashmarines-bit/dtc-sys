export interface User {
  id: string
  fullName: string
  email: string
  role: string
  roles: string[]
  isActive: boolean
  companyName?: string
  contactPhone?: string
}

export interface AuthResponse {
  token: string
  refreshToken: string
  expiresAt: string
  user: User
}

export interface VendorSubmission {
  id: string
  submissionNumber: string
  title: string
  description?: string
  status: number
  statusLabel: string
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
  aiGradeLabel?: string
  aiScore?: number
  aiSummary?: string
  analysisCompleted: boolean
  rejectionCategoryLabel?: string
  rejectionReason?: string
  validatorNotes?: string
  returnNotes?: string
  validatedAt?: string
  originalPdfUrl?: string
  resultDocumentId?: string
  resultDocumentNumber?: string
  vendorUserId: string
  vendorUserName: string
  expiresAt: string
  createdAt: string
  updatedAt?: string
  resubmissionCount: number
  maxResubmissions: number
  parentSubmissionId?: string
  contractNumber?: string
}

export interface MetaSchemaField {
  key: string
  label: string
  type: 'text' | 'number' | 'currency' | 'date' | 'daterange' | 'textarea' | 'select' | 'checkbox'
  required: boolean
  order: number
  placeholder?: string
  helpText?: string
  defaultValue?: string
  options?: string[]
}

export interface DocumentType {
  id: string
  name: string
  code: string
  numberingFormat: string
  description?: string
  applicableModules?: string
  schema: MetaSchemaField[]
}

export interface CreateSubmissionRequest {
  title: string
  description?: string
  documentTypeId: string
  vendorCompanyName: string
  vendorContactName: string
  vendorContactEmail: string
  vendorContactPhone: string
  referenceNumber?: string
  documentDate?: string
  documentValue?: number
  notes?: string
  contractNumber?: string
}

export interface ApiError {
  error: string
  statusCode: number
}
