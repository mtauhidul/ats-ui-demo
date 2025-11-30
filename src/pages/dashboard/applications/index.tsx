import { DataTable } from "@/components/data-table";
import { Loader } from "@/components/ui/loader";
import { useApplications, useJobs, useClients, useTeam } from "@/store/hooks/index";
import type { Application } from "@/types/application";
import type { Job } from "@/types/job";
import type { Client } from "@/types/client";

export default function ApplicationsPage() {
  // 🔥 REALTIME: Get data directly from Firestore hooks - auto-updates in realtime!
  const { applications, isLoading: applicationsLoading } = useApplications();
  const { jobs, isLoading: jobsLoading } = useJobs();
  const { clients, isLoading: clientsLoading } = useClients();
  const { teamMembers, isLoading: teamLoading } = useTeam();

  // Log applications data
  // Debug date values from first application
  if (applications.length > 0) {
    const firstApp = applications[0];
    }

  const transformedData = applications.map((app: Application) => {
    const job = jobs.find((j: Job) => j.id === app.targetJobId);
    const client = clients.find((c: Client) => c.id === job?.clientId);
    
    // Type assertion to access backend-specific fields
    const backendApp = app as Application & {
      resumeUrl?: string;
      resumeOriginalName?: string;
      parsedData?: {
        summary?: string;
        skills?: string[];
        experience?: Array<{ company: string; title: string; duration: string; description?: string }>;
        education?: Array<{ institution: string; degree: string; field?: string; year?: string }>;
        certifications?: string[];
        languages?: string[];
      };
      notes?: string;
      internalNotes?: string;
    };

    // Calculate years of experience from experience array
    const calculateYearsOfExperience = () => {
      const experience = Array.isArray(backendApp.parsedData?.experience) ? backendApp.parsedData.experience : [];
      if (experience.length === 0) {
        return undefined;
      }
      
      let totalMonths = 0;
      
      experience.forEach(exp => {
        const duration = exp.duration;
        
        // Skip if duration is missing
        if (!duration || typeof duration !== 'string') {
          return;
        }
        
        // Try to extract years from text like "2 years", "3+ years"
        const yearMatch = duration.match(/(\d+)\+?\s*years?/i);
        if (yearMatch) {
          totalMonths += parseInt(yearMatch[1]) * 12;
          return;
        }
        
        // Try to parse date ranges like "July 2023 - October 2025" or "Nov 2020 - Jun 2023"
        const dateRangeMatch = duration.match(/([a-z]+)\s+(\d{4})\s*[-–—]\s*([a-z]+)?\s*(\d{4}|present|current)/i);
        if (dateRangeMatch) {
          const [, startMonth, startYear, endMonth, endYear] = dateRangeMatch;
          
          const monthMap: { [key: string]: number } = {
            jan: 0, january: 0,
            feb: 1, february: 1,
            mar: 2, march: 2,
            apr: 3, april: 3,
            may: 4,
            jun: 5, june: 5,
            jul: 6, july: 6,
            aug: 7, august: 7,
            sep: 8, sept: 8, september: 8,
            oct: 9, october: 9,
            nov: 10, november: 10,
            dec: 11, december: 11
          };
          
          const startMonthNum = monthMap[startMonth.toLowerCase()] ?? 0;
          const startYearNum = parseInt(startYear);
          
          let endMonthNum: number;
          let endYearNum: number;
          
          if (endYear.toLowerCase() === 'present' || endYear.toLowerCase() === 'current') {
            // Use current date
            const now = new Date();
            endMonthNum = now.getMonth();
            endYearNum = now.getFullYear();
          } else {
            endMonthNum = endMonth ? (monthMap[endMonth.toLowerCase()] ?? 11) : 11;
            endYearNum = parseInt(endYear);
          }
          
          // Calculate total months
          const months = (endYearNum - startYearNum) * 12 + (endMonthNum - startMonthNum);
          totalMonths += Math.max(0, months);
          return;
        }
        
        // If contains "present" or "current", assume at least 1 year
        if (duration.toLowerCase().includes('present') || duration.toLowerCase().includes('current')) {
          totalMonths += 12;
        }
      });
      
      // Convert months to years (round to nearest integer)
      const years = Math.round(totalMonths / 12);
      return years > 0 ? years : undefined;
    };

    // Format education
    const formatEducation = () => {
      const edu = backendApp.parsedData?.education?.[0];
      if (!edu) return undefined;
      
      let formatted = edu.degree || 'Degree';
      if (edu.field) {
        formatted += ` in ${edu.field}`;
      }
      if (edu.institution) {
        formatted += ` - ${edu.institution}`;
      }
      if (edu.year) {
        formatted += ` (${edu.year})`;
      }
      return formatted;
    };

    // Build full resume text from parsed data
    const buildResumeText = () => {
      if (!backendApp.parsedData) return undefined;
      
      let text = '';
      
      // Summary
      if (backendApp.parsedData.summary) {
        text += 'PROFESSIONAL SUMMARY\n\n' + backendApp.parsedData.summary + '\n\n';
      }
      
      // Skills
      if (backendApp.parsedData.skills && backendApp.parsedData.skills.length > 0) {
        text += 'TECHNICAL SKILLS\n\n' + backendApp.parsedData.skills.join(', ') + '\n\n';
      }
      
      // Experience
      if (backendApp.parsedData.experience && backendApp.parsedData.experience.length > 0) {
        text += 'PROFESSIONAL EXPERIENCE\n\n';
        backendApp.parsedData.experience.forEach(exp => {
          if (!exp) return; // Skip null/undefined entries
          
          const title = exp.title || 'Position';
          const company = exp.company || 'Company';
          const duration = exp.duration || '';
          
          text += `${title} | ${company}${duration ? ' | ' + duration : ''}\n`;
          if (exp.description) {
            text += exp.description + '\n';
          }
          text += '\n';
        });
      }
      
      // Education
      if (backendApp.parsedData.education && backendApp.parsedData.education.length > 0) {
        text += 'EDUCATION\n\n';
        backendApp.parsedData.education.forEach(edu => {
          if (!edu) return; // Skip null/undefined entries
          
          text += `${edu.degree || 'Degree'}`;
          if (edu.field) text += ` in ${edu.field}`;
          text += ` | ${edu.institution || 'Institution'}`;
          if (edu.year) text += ` | ${edu.year}`;
          text += '\n';
        });
        text += '\n';
      }
      
      // Certifications
      if (backendApp.parsedData.certifications && backendApp.parsedData.certifications.length > 0) {
        text += 'CERTIFICATIONS\n\n';
        backendApp.parsedData.certifications.forEach(cert => {
          text += '• ' + cert + '\n';
        });
      }
      
      return text.trim() || undefined;
    };

    // Helper to get valid date
    const getApplicationDate = () => {
      const dateValue = app.submittedAt || app.createdAt;
      if (!dateValue) return null;
      const date = new Date(dateValue);
      return isNaN(date.getTime()) ? null : date;
    };

    const applicationDate = getApplicationDate();

    // Format date as "02 Jan, 2025"
    const formatDate = (date: Date | null): string => {
      if (!date) return "N/A";
      
      const day = date.getDate().toString().padStart(2, '0');
      const month = date.toLocaleString('en-US', { month: 'short' });
      const year = date.getFullYear();
      
      return `${day} ${month}, ${year}`;
    };

    return {
    id: app.id, // Use actual application ID from backend
    header: `${app.firstName} ${app.lastName}`, // Application name
    type: backendApp.isValidResume === true ? "valid" : backendApp.isValidResume === false ? "invalid" : "pending", // AI status (kept for compatibility)
    status: app.status || "pending", // Use raw status from backend: approved, rejected, or pending
    target: applicationDate ? applicationDate.getDate() : 0, // Day number for sorting but we'll override display
    submittedAtTimestamp: applicationDate ? applicationDate.getTime() : 0, // Full timestamp for proper sorting (newest first)
    limit: app.id, // Show actual application ID
    reviewer: (() => {
      if (!app.reviewedBy) return "Not Reviewed";
      if (typeof app.reviewedBy === 'object' && 'firstName' in app.reviewedBy) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const reviewer = app.reviewedBy as any;
        return `${reviewer.firstName} ${reviewer.lastName}`;
      }
      // Look up user by ID (reviewedBy stores user ID from users collection)
      const reviewer = teamMembers.find((tm) => tm.id === app.reviewedBy);
      if (reviewer) {
        return `${reviewer.firstName} ${reviewer.lastName}`;
      }
      return app.reviewedByName || "Unknown";
    })(),
    source: app.source || "direct_application", // Application source (manual/email/direct apply)
    jobId: app.jobId || undefined, // Job ID for direct applications
    // Add original data for display
    dateApplied: formatDate(applicationDate),
    jobIdDisplay: app.id, // Show application ID instead of job ID
    jobTitle: job?.title || app.targetJobTitle || "No Job Specified", // Job title for search
    clientName: client?.companyName || "Unknown Client",
    clientLogo: client?.logo || `https://api.dicebear.com/7.x/initials/svg?seed=${client?.companyName || 'C'}`,
    // Use real team member data from backend
    teamMembers: Array.isArray(app.teamMembers) 
      ? app.teamMembers.map((tm: string | { firstName: string; lastName: string }) => 
          typeof tm === 'string' 
            ? tm 
            : `${tm.firstName} ${tm.lastName}`
        )
      : [],
    // Additional applicant details
    photo: app.photo || undefined,
    email: app.email,
    phone: app.phone,
    currentTitle: backendApp.parsedData?.experience?.[0]?.title || app.currentTitle,
    currentCompany: backendApp.parsedData?.experience?.[0]?.company || app.currentCompany,
    yearsOfExperience: (() => {
      const calculated = calculateYearsOfExperience();
      const fallback = app.yearsOfExperience;
      const final = calculated || fallback;
      return final;
    })(),
    skills: backendApp.parsedData?.skills || app.skills || [],
    coverLetter: app.coverLetter,
    resumeText: buildResumeText(),
    resumeFilename: backendApp.resumeOriginalName || undefined,
    resumeFileSize: undefined, // Size not stored in backend
    resumeUrl: backendApp.resumeUrl || undefined,
    // Personal details
    location: app.address || undefined,
    linkedinUrl: app.linkedInUrl || undefined,
    portfolioUrl: app.portfolioUrl || undefined,
    githubUrl: app.githubUrl || undefined,
    educationLevel: formatEducation(),
    expectedSalary: app.expectedSalary 
      ? `${app.expectedSalary.currency} ${app.expectedSalary.min.toLocaleString()} - ${app.expectedSalary.max.toLocaleString()} / ${app.expectedSalary.period}`
      : undefined,
    languages: backendApp.parsedData?.languages && backendApp.parsedData.languages.length > 0 
      ? backendApp.parsedData.languages 
      : undefined,
    notes: backendApp.internalNotes || backendApp.notes || app.reviewNotes || undefined,
    // Additional documents
    additionalDocuments: app.additionalDocuments || [],
    // Availability
    availableStartDate: app.availableStartDate ? new Date(app.availableStartDate).toLocaleDateString() : undefined,
    preferredWorkMode: app.preferredWorkMode,
    willingToRelocate: app.willingToRelocate,
    // Video introduction (only if available)
    videoIntroUrl: backendApp.videoIntroUrl || undefined,
    videoIntroFilename: undefined,
    videoIntroFileSize: undefined,
    videoIntroDuration: undefined,
    // Parsed data for experience calculation fallback
    parsedData: backendApp.parsedData || undefined,
    // AI Resume Validation
    isValidResume: backendApp.isValidResume,
    validationScore: backendApp.validationScore,
    validationReason: backendApp.validationReason,
    // Raw text for preview
    resumeRawText: backendApp.resumeRawText || undefined,
  };
  });

  // Enrich jobs with client information for the modal
  const enrichedJobs = jobs.map((job: Job) => {
    const client = clients.find((c: Client) => c.id === job.clientId);
    return {
      ...job,
      clientId: client ? {
        id: client.id,
        companyName: client.companyName,
      } : job.clientId, // Keep original if client not found
    };
  });

  const isLoading = applicationsLoading || jobsLoading || clientsLoading || teamLoading;

  if (isLoading) return (
    <div className="flex items-center justify-center h-screen">
      <Loader size="lg" text="Loading applications..." />
    </div>
  );

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="px-4 lg:px-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Applications
              </h2>
              <p className="text-muted-foreground">
                Track and manage job applications and their status
              </p>
            </div>
          </div>
          <DataTable data={transformedData} jobs={enrichedJobs} />
        </div>
      </div>
    </div>
  );
}
