import { CandidatesDataTable } from "@/components/candidates-data-table";
import { Loader } from "@/components/ui/loader";
import {
  useCandidates,
  useClients,
  useJobs,
  usePipelines,
} from "@/store/hooks/index";

// Mock team members pool
const teamMembersPool = [
  "John Smith",
  "Sarah Wilson",
  "Mike Johnson",
  "Lisa Brown",
  "Tom Davis",
  "Emma Davis",
  "Alex Chen",
];

export default function CandidatesPage() {
  // 🔥 REALTIME: Get data directly from Firestore hooks - auto-updates in realtime!
  const {
    candidates,
    deleteCandidate,
    invalidateCache,
    isLoading: candidatesLoading,
  } = useCandidates();
  const { jobs, isLoading: jobsLoading } = useJobs();
  const { clients, isLoading: clientsLoading } = useClients();
  const { pipelines, isLoading: pipelinesLoading } = usePipelines();

  // No useEffect needed - Firestore provides realtime data automatically via Redux hooks!
  // Removed: fetchCandidatesIfNeeded, fetchJobsIfNeeded, fetchClientsIfNeeded calls
  // Removed: refetchCandidates event listener (data updates automatically)

  // DISABLED: Excessive refetching causes performance issues and API spam
  // Only refetch on user action (delete, update) or manual page refresh
  //
  // // Refetch candidates when window regains focus (for real-time sync)
  // useEffect(() => {
  //   const handleFocus = () => {
  //     //     fetchCandidates();
  //   };
  //
  //   window.addEventListener('focus', handleFocus);
  //   return () => window.removeEventListener('focus', handleFocus);
  // }, [fetchCandidates]);

  // // Poll for updates every 30 seconds when tab is visible
  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     if (document.visibilityState === 'visible') {
  //       //       fetchCandidates();
  //     }
  //   }, 30000); // 30 seconds

  //   return () => clearInterval(interval);
  // }, [fetchCandidates]);

  const handleDeleteCandidate = async (candidateId: string) => {
    try {
      await deleteCandidate(candidateId);
      // Firestore will automatically update the list after deletion
      invalidateCache();
    } catch (error) {}
  };

  // Transform candidates into rows - one row per job application
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const transformedData = candidates.flatMap((candidate: any, index) => {
    // Get all job IDs for this candidate
    const jobIds = candidate.jobIds || [];

    if (jobIds.length === 0) {
      // No jobs - create a single row with "General Applicant"
      return [createCandidateRow(candidate, null, null, index)];
    }

    // Create one row per job
    return jobIds.map((jobId: any) => {
      return createCandidateRow(candidate, jobId, null, index);
    });
  });

  // Helper function to create a candidate row
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function createCandidateRow(
    candidate: any,
    jobIdOrObject: any,
    _client: any,
    index: number
  ) {
    // Randomly assign 0-3 team members
    const teamMemberCount = Math.floor(Math.random() * 4);
    const shuffled = [...teamMembersPool].sort(() => 0.5 - Math.random());
    const selectedTeamMembers =
      teamMemberCount > 0 ? shuffled.slice(0, teamMemberCount) : [];

    // Get job details - jobIdOrObject can be a populated object or string ID
    const firstJobId = jobIdOrObject;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let job: any = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let client: any = null;

    if (firstJobId) {
      // Check if it's already a populated object
      if (typeof firstJobId === "object" && "title" in firstJobId) {
        // Create a mutable copy since backend objects are frozen
        job = { ...firstJobId, id: firstJobId.id || firstJobId._id };

        // Check if clientId is populated within the job (this is the key fix!)
        if (
          job.clientId &&
          typeof job.clientId === "object" &&
          "companyName" in job.clientId
        ) {
          // Client is already populated within the job - create mutable copy
          client = { ...job.clientId, id: job.clientId.id || job.clientId._id };
        } else if (job.clientId) {
          // Client is just an ID, look it up in clients array (fallback)
          const clientIdStr =
            typeof job.clientId === "object"
              ? job.clientId._id || job.clientId.id
              : job.clientId;
          client = clients.find((c) => c.id === clientIdStr);
        }
      } else {
        // It's just an ID string, find in jobs array
        const jobIdStr = typeof firstJobId === "object" 
          ? (firstJobId.id || firstJobId._id || String(firstJobId))
          : String(firstJobId);
        job = jobs.find((j) => j.id === jobIdStr);
        if (job) {
          client = clients.find((c) => c.id === job.clientId);
        }
      }
    }

    // Map candidate status to display status
    const getDisplayStatus = (status: string) => {
      switch (status) {
        case "active":
          return "In Process";
        case "interviewing":
          return "In Process";
        case "offered":
          return "In Process";
        case "hired":
          return "Hired";
        case "rejected":
          return "Rejected";
        case "withdrawn":
          return "Rejected";
        default:
          return "In Process";
      }
    };

    // Use normalized id field (backend now returns both id and _id)
    const candidateId = candidate.id || candidate._id || "";

    // Find the job application for this specific job
    const currentJobApp = candidate.jobApplications?.find((app: any) => {
      const appJobId =
        typeof app.jobId === "string" ? app.jobId : app.jobId?.id;
      return appJobId === job?.id;
    });

    // Get current stage name
    let currentStage = "Not Started";

    // CRITICAL: For multi-job candidates, use job-specific stage from jobApplications
    // This ensures each job shows the correct stage for that specific application
    // Only fallback to global stage if jobApplication doesn't exist for this job
    const stageId = currentJobApp
      ? currentJobApp.currentStage
      : candidate.currentPipelineStageId || candidate.currentStage;

    if (stageId && typeof stageId === "string" && job?.pipelineId) {
      const jobPipeline = pipelines.find((p) => p.id === job.pipelineId);

      if (jobPipeline?.stages && jobPipeline.stages.length > 0) {
        let stage;

        // Step 1: Try exact stage ID match (current pipeline)
        stage = jobPipeline.stages.find((s: any) => s.id === stageId);

        // Step 2: If not found, try exact stage name match (case-insensitive)
        if (!stage) {
          stage = jobPipeline.stages.find(
            (s: any) => s.name?.toLowerCase() === stageId.toLowerCase()
          );
        }

        // Step 3: If not found and stageId is an old stage ID format, match by index
        // Old: stage_1763585843289_6, New: stage_1763612161072_6
        // Both have index 6, so match by index to preserve stage position
        if (!stage && stageId.includes("stage_") && stageId.includes("_")) {
          const parts = stageId.split("_");
          const stageIndex = parseInt(parts[parts.length - 1]);
          if (!isNaN(stageIndex) && stageIndex < jobPipeline.stages.length) {
            stage = jobPipeline.stages[stageIndex];
          }
        }

        // Step 4: Fuzzy match for renamed stages (e.g., "Move to Candidate Pool" -> "Move to Candidates")
        if (!stage) {
          const stageIdLower = stageId.toLowerCase();
          stage = jobPipeline.stages.find((s: any) => {
            const stageName = s.name?.toLowerCase() || "";

            // Check if significant words match (at least 2 words with length > 2)
            const significantWords = stageIdLower
              .split(" ")
              .filter((w) => w.length > 2);
            if (significantWords.length >= 2) {
              const matchCount = significantWords.filter((word) =>
                stageName.includes(word)
              ).length;
              if (matchCount >= 2) return true;
            }

            return false;
          });
        }

        if (stage?.name) {
          currentStage = stage.name;
        }
      }
    }

    // Create unique row ID by combining candidate ID and job ID (or use candidate ID alone if no job)
    const jobIdStr = job?.id || 'no-job';
    const uniqueRowId = `${candidateId}-${jobIdStr}`;
    
    return {
      id: uniqueRowId, // Unique row ID for React keys
      candidateId: candidateId, // Actual candidate ID for API calls
      jobIdForRow: jobIdStr, // Job ID for this specific row
      header: `${candidate.firstName} ${candidate.lastName}`, // Candidate name
      type: job?.title || "General Applicant", // Job title they applied for
      status: getDisplayStatus(candidate.status || "active"),
      // Use job application date for this specific job (for sorting latest first)
      target: currentJobApp?.appliedAt
        ? typeof currentJobApp.appliedAt === "object" &&
          "seconds" in currentJobApp.appliedAt
          ? currentJobApp.appliedAt.seconds * 1000
          : new Date(currentJobApp.appliedAt).getTime()
        : new Date(candidate.createdAt).getTime(),
      limit: candidate.yearsOfExperience || 0, // For sorting
      reviewer: "Team", // Could be derived from job assignments
      // Properly mapped display data
      dateApplied: currentJobApp?.appliedAt
        ? typeof currentJobApp.appliedAt === "object" &&
          "seconds" in currentJobApp.appliedAt
          ? new Date(
              currentJobApp.appliedAt.seconds * 1000
            ).toLocaleDateString()
          : new Date(currentJobApp.appliedAt).toLocaleDateString()
        : new Date(candidate.createdAt).toLocaleDateString(),
      currentStage: currentStage, // Current pipeline stage from backend
      jobIdDisplay: job?.id || "N/A", // Actual job ID
      jobTitle: job?.title || "General Applicant", // Job title
      clientName: client?.companyName || "Unknown Client", // Client name
      clientLogo:
        client?.logo ||
        `https://api.dicebear.com/7.x/initials/svg?seed=${
          client?.companyName || "C"
        }`, // Client logo
      teamMembers: selectedTeamMembers, // Assigned team members
      assignedTo: candidate.assignedTo, // Assigned team member (can be ID or populated User object)
      // Additional candidate details
      photo: candidate.avatar || undefined,
      email: candidate.email,
      phone: candidate.phone,
      currentTitle: candidate.currentTitle,
      currentCompany: candidate.currentCompany,
      yearsOfExperience: candidate.yearsOfExperience,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      skills: candidate.skills?.map((s: any) => s.name) || [],
      coverLetter: candidate.coverLetter?.url || undefined,
      resumeText: undefined,
      // Check multiple possible resume field locations (Cloudinary)
      resumeFilename:
        candidate.resume?.name ||
        candidate.resume?.originalName ||
        candidate.resumeFileName ||
        undefined,
      resumeFileSize:
        candidate.resume?.size || candidate.resumeFileSize || undefined,
      resumeUrl:
        candidate.resume?.url ||
        candidate.resumeUrl ||
        candidate.resume?.secure_url ||
        undefined,
      // Personal details
      location: candidate.address
        ? `${candidate.address.city}, ${candidate.address.country}`
        : undefined,
      linkedinUrl: undefined,
      portfolioUrl: undefined,
      educationLevel: candidate.education?.[0]?.level || undefined,
      expectedSalary: undefined,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      languages: candidate.languages?.map((l: any) => l.name) || undefined,
      notes: undefined,
      // Video introduction (demo data for first applicant)
      videoIntroUrl:
        index === 0
          ? "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
          : undefined,
      videoIntroFilename: index === 0 ? "sarah_johnson_intro.mp4" : undefined,
      videoIntroFileSize: index === 0 ? "15.2 MB" : undefined,
      videoIntroDuration: index === 0 ? "2:30" : undefined,
    };
  }

  // Sort by application date (newest first) so latest applications appear on top
  const sortedData = transformedData.sort((a, b) => b.target - a.target);

  const isLoading =
    candidatesLoading || jobsLoading || clientsLoading || pipelinesLoading;

  if (isLoading)
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader size="lg" text="Loading candidates..." />
      </div>
    );

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="px-4 lg:px-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Candidates
              </h2>
              <p className="text-muted-foreground">
                Track and manage candidates across all job applications
              </p>
            </div>
          </div>
          <CandidatesDataTable
            data={sortedData}
            onDeleteCandidate={handleDeleteCandidate}
          />
        </div>
      </div>
    </div>
  );
}
