import { z } from "zod";

export const schema = z.object({
  id: z.union([z.number(), z.string()]), // Support both number and string (MongoDB ObjectId)
  header: z.string(),
  type: z.string(),
  status: z.string(),
  target: z.number().optional(), // Optional since not used as visible column
  limit: z.union([z.number(), z.string()]),
  reviewer: z.string(),
  source: z.string().optional(), // Application source (manual/email/direct apply)
  dateApplied: z.string().optional(),
  jobIdDisplay: z.string().optional(),
  // Candidates-specific fields
  currentStage: z.string().optional(),
  jobTitle: z.string().optional(),
  clientName: z.string().optional(),
  clientLogo: z.string().optional(),
  teamMembers: z.array(z.string()).optional(),
  candidateId: z.string().optional(),
  jobIdForRow: z.string().optional(), // Job ID for this specific row in candidates table
  assignedTo: z.union([
    z.string(),
    z.object({
      id: z.string().optional(),
      _id: z.string().optional(),
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      email: z.string().optional(),
    })
  ]).nullable().optional(), // Can be string ID or populated User object
  // Additional applicant fields
  photo: z.string().nullable().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  currentTitle: z.string().optional(),
  currentCompany: z.string().optional(),
  yearsOfExperience: z.number().optional(),
  skills: z.array(z.string()).optional(),
  coverLetter: z.string().optional(),
  resumeText: z.string().optional(),
  resumeRawText: z.string().optional(),
  resumeFilename: z.string().optional(),
  resumeFileSize: z.string().optional(),
  resumeUrl: z.string().optional(),
  // Parsed data from resume
  parsedData: z.object({
    summary: z.string().optional(),
    skills: z.array(z.string()).optional(),
    experience: z.array(z.object({
      company: z.string(),
      title: z.string(),
      duration: z.string().optional(),
      description: z.string().optional(),
    })).optional(),
    education: z.array(z.object({
      institution: z.string(),
      degree: z.string(),
      field: z.string().optional(),
      year: z.string().optional(),
    })).optional(),
    certifications: z.array(z.string()).optional(),
    languages: z.array(z.string()).optional(),
  }).optional(),
  // Personal details
  location: z.string().optional(),
  linkedinUrl: z.string().optional(),
  portfolioUrl: z.string().optional(),
  educationLevel: z.string().optional(),
  expectedSalary: z.string().optional(),
  languages: z.array(z.string()).optional(),
  notes: z.string().optional(),
  // Video introduction
  videoIntroUrl: z.string().optional(),
  videoIntroFilename: z.string().optional(),
  videoIntroFileSize: z.string().optional(),
  videoIntroDuration: z.string().optional(),
  // AI Resume Validation
  isValidResume: z.boolean().nullable().optional(),
  validationScore: z.number().min(0).max(100).nullable().optional(),
  validationReason: z.string().optional(),
});
