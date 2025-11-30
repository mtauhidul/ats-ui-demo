import type { BaseEntity, Attachment } from "./common";
import type { CandidateSource } from "./candidate";

// Application status - initial stage before moving to candidate pipeline
export const ApplicationStatus = {
  PENDING: "pending", // Newly submitted, awaiting review
  REVIEWING: "reviewing", // Being reviewed by recruiter/hiring manager
  SHORTLISTED: "shortlisted", // Shortlisted for further consideration
  APPROVED: "approved", // Approved to move to candidate pipeline
  REJECTED: "rejected", // Rejected, will not proceed
  WITHDRAWN: "withdrawn", // Candidate withdrew their application
} as const;

export type ApplicationStatus = (typeof ApplicationStatus)[keyof typeof ApplicationStatus];

// Application priority (set by reviewers)
export const ApplicationPriority = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  URGENT: "urgent",
} as const;

export type ApplicationPriority = (typeof ApplicationPriority)[keyof typeof ApplicationPriority];

// Initial job application BEFORE approval and assignment to job
// Applications are INDEPENDENT - not under any job or client initially
// Once approved and assigned to a job → becomes a Candidate
export interface Application extends BaseEntity {
  // Applicant information (independent of job/client)
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  photo?: string; // Profile photo URL
  address?: string; // Applicant address

  // Application details
  status: ApplicationStatus;
  priority?: ApplicationPriority;
  source: CandidateSource;
  referredBy?: string;

  // AI Analysis (from resume parsing)
  aiAnalysis?: {
    isValid: boolean;
    matchScore?: number;
    summary?: string;
  };
  resumeText?: string; // Parsed resume text
  resumeRawText?: string; // Full raw text from resume (for AI validation)
  
  // AI Resume Validation
  isValidResume?: boolean | null; // AI determination if resume is legitimate
  validationScore?: number | null; // 0-100 score of resume legitimacy
  validationReason?: string; // Explanation of validation result
  
  // Application content
  coverLetter?: string;
  resume?: Attachment;
  additionalDocuments?: Attachment[];
  videoIntroUrl?: string; // Optional video introduction
  
  // Candidate background (basic info from application)
  currentTitle?: string;
  currentCompany?: string;
  yearsOfExperience?: number;
  expectedSalary?: {
    min: number;
    max: number;
    currency: string;
    period: "hourly" | "monthly" | "yearly";
  };
  
  // Skills mentioned in application
  skills?: string[];
  
  // Availability
  availableStartDate?: Date;
  preferredWorkMode?: "remote" | "onsite" | "hybrid";
  willingToRelocate?: boolean;
  
  // Social profiles
  linkedInUrl?: string;
  portfolioUrl?: string;
  githubUrl?: string;
  
  // Job information
  jobId?: string; // Direct job ID (used for direct applications)
  
  // Target job information (OPTIONAL - can be captured from email subject line or application form)
  // If null, this is a general application without specific job target
  // This helps when routing/approving applications but is not mandatory
  targetJobId?: string; // Job they're interested in (optional - can be from email subject)
  targetJobTitle?: string; // Cached for display
  targetClientId?: string; // Client they're interested in (optional)
  targetClientName?: string; // Cached for display
  
  // Review information
  reviewedBy?: string; // User ID who reviewed
  reviewedByName?: string;
  reviewedAt?: Date;
  reviewNotes?: string;
  rejectionReason?: string;
  
  // Team Assignment
  teamMembers?: Array<{
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  }> | string[]; // Array of user objects or user IDs
  
  // Assignment information (after approval)
  // When approved, application is assigned to a job and candidate is created
  assignedJobId?: string; // Job assigned to after approval (may differ from targetJobId)
  assignedClientId?: string; // Client assigned to after approval
  candidateId?: string; // Created candidate ID after approval
  approvedBy?: string; // User ID who approved
  approvedByName?: string;
  approvedAt?: Date;
  
  // Metadata
  submittedAt: Date;
  lastUpdated: Date;
}

// Backend-specific fields (email automation)
export interface ApplicationBackendFields {
  sourceEmail?: string; // Email address if from automation
  sourceEmailAccountId?: string; // Reference to email account
  pipelineStageId?: string; // Pipeline stage reference
  appliedAt?: Date; // Timestamp when applied
  rejectedAt?: Date; // Timestamp when rejected
  resumeUrl?: string; // Cloudinary URL for resume
  resumeOriginalName?: string; // Original filename
  parsedData?: {
    summary?: string;
    skills?: string[];
    experience?: Array<{
      company: string;
      title: string;
      duration: string;
      description?: string;
    }>;
    education?: Array<{
      institution: string;
      degree: string;
      field?: string;
      year?: string;
    }>;
    certifications?: string[];
    languages?: string[];
  };
  notes?: string; // Internal notes
}

// Application with related data for display
export interface ApplicationWithRelations extends Application, ApplicationBackendFields {
  job: {
    id: string;
    title: string;
    status: string;
    type: string;
    location?: {
      city: string;
      country: string;
    };
  };
  client: {
    id: string;
    companyName: string;
    logo?: string;
  };
  reviewer?: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
}

// Application summary for lists
export interface ApplicationSummary {
  id: string;
  jobId: string;
  jobTitle: string;
  clientName: string;
  clientLogo?: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  status: ApplicationStatus;
  priority?: ApplicationPriority;
  source: CandidateSource;
  yearsOfExperience?: number;
  submittedAt: Date;
  reviewedAt?: Date;
  hasResume: boolean;
  hasCoverLetter: boolean;
}

// Create application request (from job application form)
export interface CreateApplicationRequest {
  jobId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  coverLetter?: string;
  currentTitle?: string;
  currentCompany?: string;
  yearsOfExperience?: number;
  expectedSalary?: {
    min: number;
    max: number;
    currency: string;
    period: "hourly" | "monthly" | "yearly";
  };
  skills?: string[];
  availableStartDate?: Date;
  preferredWorkMode?: "remote" | "onsite" | "hybrid";
  willingToRelocate?: boolean;
  linkedInUrl?: string;
  portfolioUrl?: string;
  source: CandidateSource;
  referredBy?: string;
}

// Review application request
export interface ReviewApplicationRequest {
  status: ApplicationStatus;
  priority?: ApplicationPriority;
  reviewNotes?: string;
  rejectionReason?: string;
}

// Bulk application actions
export interface BulkApplicationAction {
  applicationIds: string[];
  action: "approve" | "reject" | "set_priority";
  priority?: ApplicationPriority;
  rejectionReason?: string;
  notes?: string;
}

// Application filters
export interface ApplicationFilters {
  search?: string;
  jobId?: string;
  clientId?: string;
  status?: ApplicationStatus[];
  priority?: ApplicationPriority[];
  source?: CandidateSource[];
  yearsOfExperienceMin?: number;
  yearsOfExperienceMax?: number;
  submittedAfter?: Date;
  submittedBefore?: Date;
  reviewedBy?: string;
  hasResume?: boolean;
  hasCoverLetter?: boolean;
  expectedSalaryMin?: number;
  expectedSalaryMax?: number;
  availableAfter?: Date;
}

export type ApplicationSortField = 
  | "submittedAt"
  | "firstName" 
  | "lastName" 
  | "jobTitle"
  | "clientName"
  | "status" 
  | "priority"
  | "reviewedAt"
  | "yearsOfExperience";

// Application statistics
export interface ApplicationStats {
  total: number;
  pending: number;
  reviewing: number;
  shortlisted: number;
  approved: number;
  rejected: number;
  withdrawn: number;
  avgReviewTime?: number; // in hours
  approvalRate?: number; // percentage
  topSources: {
    source: CandidateSource;
    count: number;
  }[];
  applicationsByDay: {
    date: string;
    count: number;
  }[];
}