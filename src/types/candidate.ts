import type { BaseEntity, Address, Attachment } from "./common";

// Candidate source
export const CandidateSource = {
  WEBSITE: "website",
  LINKEDIN: "linkedin",
  REFERRAL: "referral",
  RECRUITER: "recruiter",
  JOB_BOARD: "job_board",
  SOCIAL_MEDIA: "social_media",
  CAREER_FAIR: "career_fair",
  DIRECT_APPLICATION: "direct_application",
  OTHER: "other",
} as const;

export type CandidateSource = (typeof CandidateSource)[keyof typeof CandidateSource];

// Candidate status in job pipeline
export const CandidateStatus = {
  ACTIVE: "active", // Active candidate in pipeline
  INTERVIEWING: "interviewing", // Currently in interview process
  OFFERED: "offered", // Offer extended
  HIRED: "hired", // Successfully hired
  REJECTED: "rejected", // Rejected from this position
  WITHDRAWN: "withdrawn", // Candidate withdrew
} as const;

export type CandidateStatus = (typeof CandidateStatus)[keyof typeof CandidateStatus];

// Education level
export const EducationLevel = {
  HIGH_SCHOOL: "high_school",
  ASSOCIATE: "associate",
  BACHELOR: "bachelor",
  MASTER: "master",
  PHD: "phd",
  OTHER: "other",
} as const;

export type EducationLevel = (typeof EducationLevel)[keyof typeof EducationLevel];

// Education record
export interface Education {
  id: string;
  institution: string;
  degree: string;
  field: string;
  level: EducationLevel;
  startDate: Date;
  endDate?: Date;
  gpa?: number;
  description?: string;
}

// Work experience
export interface WorkExperience {
  id: string;
  company: string;
  position: string;
  startDate: Date;
  endDate?: Date;
  isCurrent: boolean;
  description: string;
  achievements?: string[];
  location?: Address;
}

// Skill with proficiency level
export interface Skill {
  name: string;
  level: "beginner" | "intermediate" | "advanced" | "expert";
  yearsOfExperience?: number;
  certified?: boolean;
}

// Language proficiency
export interface Language {
  name: string;
  proficiency: "basic" | "conversational" | "fluent" | "native";
}

// Candidate pipeline entry (for specific job)
export interface CandidatePipeline {
  jobId: string; // Reference to Job collection
  applicationId?: string; // Reference to Application collection
  status: CandidateStatus;
  appliedAt: Date;
  lastStatusChange: Date;
  currentStage?: string;
  notes?: string;
  rating?: number; // 1-5 star rating
  resumeScore?: number; // AI-generated resume match score (0-100) against job requirements
  interviewScheduled?: Date;
  rejectionReason?: string;
  withdrawalReason?: string;
  
  // Email communication tracking for this specific job
  emailIds: string[]; // References to Email collection - all emails sent/received for this job application
  lastEmailDate?: Date;
  emailsSent: number;
  emailsReceived: number;
  lastEmailSubject?: string;
}

// Main Candidate interface
export interface Candidate extends BaseEntity {
  // Personal Information
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: Address;
  dateOfBirth?: Date;
  avatar?: string;
  
  // Professional Information
  currentTitle?: string;
  currentCompany?: string;
  yearsOfExperience: number;
  expectedSalary?: {
    min: number;
    max: number;
    currency: string;
    period: "hourly" | "monthly" | "yearly";
  };
  
  // Background
  education: Education[];
  workExperience: WorkExperience[];
  skills: Skill[];
  languages: Language[];
  certifications?: string[];
  
  // Preferences
  preferredWorkMode?: "remote" | "onsite" | "hybrid";
  willingToRelocate?: boolean;
  availableStartDate?: Date;
  
  // Source and tracking
  source: CandidateSource;
  referredBy?: string;
  rawEmailBody?: string; // Raw text body of email if applied via email
  rawEmailBodyHtml?: string; // Raw HTML body of email if applied via email
  
  // Documents
  resume?: Attachment;
  coverLetter?: Attachment;
  portfolio?: Attachment;
  additionalDocuments?: Attachment[];
  
  // Social profiles
  linkedInUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  
  // Job applications - tracks status for each job applied to
  // IMPORTANT: Candidates are ALWAYS assigned to at least one job (mandatory)
  // Candidates are created from approved Applications that are assigned to a job
  jobApplications: CandidatePipeline[]; // Must have at least one entry
  
  // Pipeline tracking (backend populates these fields)
  currentPipelineStageId?: string; // Reference to Pipeline.stages subdocument
  currentStage?: {
    id: string;
    name: string;
    color: string;
    order: number;
  }; // Populated stage object from backend
  
  // Status
  status?: 'active' | 'interviewing' | 'offered' | 'hired' | 'rejected' | 'withdrawn';
  
  // Relations (Database references - stored as IDs)
  assignedRecruiterId?: string; // Primary recruiter managing this candidate (for UI filtering)
  assignedTo?: string | { id: string; _id?: string; firstName?: string; lastName?: string; email?: string; avatar?: string } | null; // Assigned team member - can be User ID string or populated User object from backend
  jobIds: string[]; // MANDATORY: All jobs this candidate has applied to - References to Job collection (at least one)
  applicationIds: string[]; // References to original Application collection (if created from application)
  clientIds: string[]; // All clients this candidate has interacted with (derived from jobs) - References to Client collection
  
  // Email communication (all emails across all jobs)
  totalEmailsSent: number;
  totalEmailsReceived: number;
  lastEmailDate?: Date;
  
  // Categorization
  categoryIds: string[]; // References to Category collection
  tagIds: string[]; // References to Tag collection
  
  // Metadata
  isActive: boolean;
  notes?: string;
  lastContactDate?: Date;
}

// Candidate with job context
export interface CandidateWithJob extends Candidate {
  currentJobApplication?: CandidatePipeline;
  jobTitle?: string;
  clientName?: string;
}

// Candidate summary for lists
export interface CandidateSummary {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone?: string;
  avatar?: string;
  currentTitle?: string;
  currentCompany?: string;
  yearsOfExperience: number;
  source: CandidateSource;
  isActive: boolean;
  totalApplications: number;
  activeApplications: number;
  createdAt: Date;
  updatedAt: Date;
  lastContactDate?: Date;
  topSkills: string[]; // Top 3-5 skills
}

// Create candidate request
export interface CreateCandidateRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: Address;
  currentTitle?: string;
  currentCompany?: string;
  yearsOfExperience: number;
  source: CandidateSource;
  referredBy?: string;
  skills: Skill[];
  languages?: Language[];
  expectedSalary?: {
    min: number;
    max: number;
    currency: string;
    period: "hourly" | "monthly" | "yearly";
  };
  preferredWorkMode?: "remote" | "onsite" | "hybrid";
  willingToRelocate?: boolean;
  availableStartDate?: Date;
  linkedInUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  categoryIds?: string[];
  tagIds?: string[];
  notes?: string;
}

// Update candidate request
export interface UpdateCandidateRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: Address;
  avatar?: string;
  currentTitle?: string;
  currentCompany?: string;
  yearsOfExperience?: number;
  expectedSalary?: {
    min: number;
    max: number;
    currency: string;
    period: "hourly" | "monthly" | "yearly";
  };
  education?: Education[];
  workExperience?: WorkExperience[];
  skills?: Skill[];
  languages?: Language[];
  certifications?: string[];
  preferredWorkMode?: "remote" | "onsite" | "hybrid";
  willingToRelocate?: boolean;
  availableStartDate?: Date;
  linkedInUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  isActive?: boolean;
  categoryIds?: string[];
  tagIds?: string[];
  notes?: string;
}

// Apply to job request
export interface ApplyToJobRequest {
  candidateId: string;
  jobId: string;
  coverLetter?: string;
  notes?: string;
}

// Update candidate status in job
export interface UpdateCandidateStatusRequest {
  candidateId: string;
  jobId: string;
  status: CandidateStatus;
  notes?: string;
  rating?: number;
  rejectionReason?: string;
  withdrawalReason?: string;
}

// Candidate filters
export interface CandidateFilters {
  search?: string;
  source?: CandidateSource[];
  yearsOfExperienceMin?: number;
  yearsOfExperienceMax?: number;
  skills?: string[];
  location?: {
    city?: string;
    country?: string;
  };
  preferredWorkMode?: ("remote" | "onsite" | "hybrid")[];
  willingToRelocate?: boolean;
  isActive?: boolean;
  categoryIds?: string[];
  tagIds?: string[];
  jobId?: string; // Filter candidates for specific job
  status?: CandidateStatus[]; // Filter by status in specific job
  expectedSalaryMin?: number;
  expectedSalaryMax?: number;
  availableAfter?: Date;
  lastContactBefore?: Date;
  lastContactAfter?: Date;
}

export type CandidateSortField = 
  | "firstName" 
  | "lastName" 
  | "email"
  | "createdAt" 
  | "updatedAt" 
  | "lastContactDate"
  | "yearsOfExperience"
  | "totalApplications";