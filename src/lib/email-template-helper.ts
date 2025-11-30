import type { Candidate } from "@/types/candidate";
import type { Job } from "@/types/job";

export interface EmailVariables {
  // Candidate variables
  firstName?: string;
  lastName?: string;
  candidateName?: string; // ✅ ADDED: Full name
  email?: string;
  phone?: string;
  
  // Job variables
  jobTitle?: string;
  department?: string;
  
  // Company variables
  companyName?: string;
  
  // Interview variables
  interviewDate?: string;
  interviewTime?: string;
  interviewLocation?: string;
  interviewDuration?: string; // ✅ ADDED: Duration
  
  // Offer variables
  startDate?: string;
  salary?: string;
  benefits?: string;
  responseDeadline?: string; // ✅ ADDED: Response deadline
  
  // General variables
  reviewDays?: string;
  retentionPeriod?: string;
  
  // Recruiter variables
  recruiterName?: string;
  recruiterEmail?: string;
  recruiterPhone?: string;
  
  // Custom variables
  [key: string]: string | undefined;
}

/**
 * Replace template variables with actual values
 * @param template - Template string with {{variable}} placeholders
 * @param variables - Object containing variable values
 * @returns String with variables replaced
 */
export function replaceTemplateVariables(
  template: string,
  variables: EmailVariables
): string {
  let result = template;
  
  // Replace each variable in the template
  Object.entries(variables).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      result = result.replace(regex, value);
    }
  });
  
  return result;
}

/**
 * Extract variables from candidate and job data
 * @param candidate - Candidate object
 * @param job - Job object (optional)
 * @param customVars - Additional custom variables
 * @returns EmailVariables object
 */
export function extractEmailVariables(
  candidate: Candidate,
  job?: Job,
  customVars?: Record<string, string>
): EmailVariables {
  // Build full candidate name
  const candidateName = `${candidate.firstName} ${candidate.lastName}`.trim();
  
  const variables: EmailVariables = {
    // Candidate info - BOTH individual and combined
    firstName: candidate.firstName,
    lastName: candidate.lastName,
    candidateName: candidateName, // ✅ ADDED: Combined name for templates
    email: candidate.email,
    phone: candidate.phone,
    
    // Job info
    jobTitle: job?.title || "[Job Title]",
    department: job?.department || "[Department]",
    
    // Company info - ALWAYS use Arista (client details are confidential)
    companyName: "Arista",
    
    // Default recruiter info (should come from user context in real app)
    recruiterName: "HR Team",
    recruiterEmail: "hr@company.com",
    recruiterPhone: "+1 (555) 123-4567",
    
    // Default values for common variables
    reviewDays: "5-7",
    retentionPeriod: "6",
    interviewDate: "[Interview Date]",
    interviewTime: "[Interview Time]",
    interviewLocation: "[Interview Location]",
    interviewDuration: "45-60 minutes", // ✅ ADDED: Missing variable
    startDate: "[Start Date]",
    salary: "[Salary]",
    benefits: "[Benefits]",
    responseDeadline: "[Response Deadline]", // ✅ ADDED: Missing variable
    
    // Add any custom variables
    ...customVars,
  };
  
  // Add salary info if available
  if (job?.salaryRange) {
    variables.salary = `${job.salaryRange.currency} ${job.salaryRange.min.toLocaleString()} - ${job.salaryRange.max.toLocaleString()}`;
  }
  
  return variables;
}

/**
 * Apply template to email subject and body
 * @param subject - Email subject template
 * @param body - Email body template
 * @param variables - Variables to replace
 * @returns Object with processed subject and body
 */
export function applyEmailTemplate(
  subject: string,
  body: string,
  variables: EmailVariables
): { subject: string; body: string } {
  return {
    subject: replaceTemplateVariables(subject, variables),
    body: replaceTemplateVariables(body, variables),
  };
}
