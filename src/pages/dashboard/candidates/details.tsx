import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { Label } from "@/components/ui/label";
import { Loader } from "@/components/ui/loader";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { API_BASE_URL } from "@/config/api";
import { useCandidate, useEmailsByCandidate, useTags } from "@/hooks/firestore";
import { useInterviewsByCandidate } from "@/hooks/useInterviews";
import { authenticatedFetch } from "@/lib/authenticated-fetch";
import {
  useCandidates,
  useClients,
  useJobs,
  usePipelines,
  useTeam,
} from "@/store/hooks/index";
import {
  IconArrowDown,
  IconArrowLeft,
  IconArrowUp,
  IconBriefcase,
  IconCalendar,
  IconCircleCheckFilled,
  IconClockHour4,
  IconDownload,
  IconEye,
  IconFileText,
  IconHistory,
  IconMail,
  IconMapPin,
  IconMessageCircle,
  IconPhone,
  IconTag,
  IconUserCheck,
  IconUsers,
  IconX,
} from "@tabler/icons-react";
import * as React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

export default function CandidateDetailsPage() {
  const { candidateId } = useParams<{ candidateId: string }>();
  const navigate = useNavigate();
  const [showResumePreview, setShowResumePreview] = React.useState(false);
  const [showVideoPreview, setShowVideoPreview] = React.useState(false);
  const [openTagPopover, setOpenTagPopover] = React.useState(false);

  // 🔥 REALTIME: Get ALL tags from Firestore (including inactive ones for display)
  const { data: allTags, loading: isLoadingTags } = useTags();

  // Interview interface for history
  interface Interview {
    id?: string;
    _id?: string;
    scheduledAt: string;
    type: string;
    status: string;
    title: string;
    duration: number;
    notes?: string;
    description?: string;
    feedback?: Array<{
      comments: string;
      rating: number;
      recommendation: string;
      interviewerId?: {
        firstName?: string;
        lastName?: string;
      };
    }>;
    jobId?: {
      title?: string;
    };
    clientId?: {
      companyName?: string;
    };
    interviewerIds?: Array<{
      firstName?: string;
      lastName?: string;
    }>;
  }

  // Get realtime data from Firestore
  const { candidate: candidateData, loading: candidatesLoading } =
    useCandidate(candidateId);
  const { jobs, isLoading: jobsLoading } = useJobs();
  const { clients, isLoading: clientsLoading } = useClients();
  const { pipelines, isLoading: pipelinesLoading } = usePipelines();
  const { updateCandidate, candidates } = useCandidates();

  // Reassignment dialog state
  const [reassignJobDialogOpen, setReassignJobDialogOpen] =
    React.useState(false);
  const [selectedJobForReassign, setSelectedJobForReassign] =
    React.useState<string>("");

  // 🔥 REALTIME: Get interviews from Firestore for this candidate across all jobs
  // Use candidateData.id if available, otherwise use candidateId from URL
  const actualCandidateId = candidateData?.id || candidateId;

  const {
    data: firestoreInterviews,
    loading: isLoadingInterviews,
    error: interviewsError,
  } = useInterviewsByCandidate(actualCandidateId);

  if (interviewsError) {
  }

  // Transform Firestore interviews to match the interface
  const interviews: Interview[] = React.useMemo(() => {
    if (!firestoreInterviews || firestoreInterviews.length === 0) return [];

    return firestoreInterviews.map((interview) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const interviewData = interview as any;

      // Look up job and client from store if jobTitle/clientName not available
      const job = jobs.find(
        (j) => j.id === interview.jobId || j.id === interviewData.jobId
      );
      const client = clients.find(
        (c) => c.id === interview.clientId || c.id === interviewData.clientId
      );

      const jobTitle = interview.jobTitle || job?.title || "Unknown Position";
      const clientName =
        interview.clientName || client?.companyName || "Unknown Client";

      return {
        id: interview.id,
        _id: interview.id,
        scheduledAt:
          interview.interviewDate instanceof Date
            ? interview.interviewDate.toISOString()
            : (interview.interviewDate as unknown as string) || "",
        type: interview.interviewType || "video",
        status: interview.status,
        title: interviewData.title || `${interview.interviewType} Interview`,
        duration: interview.duration || 60,
        notes: interviewData.notes,
        description: interviewData.description,
        feedback: interviewData.feedback,
        jobId: {
          title: jobTitle,
        },
        clientId: {
          companyName: clientName,
        },
        interviewerIds: interviewData.interviewerIds,
      };
    });
  }, [firestoreInterviews, jobs, clients]);

  // 🔥 REALTIME: Get team members for assignee name lookup
  const { teamMembers } = useTeam();

  // Handler for reassigning candidate to another job
  const handleReassignJob = () => {
    setSelectedJobForReassign("");
    setReassignJobDialogOpen(true);
  };

  const handleReassignJobConfirm = async () => {
    if (!candidateData?.id || !selectedJobForReassign) return;

    try {
      // Find the full candidate and job
      const candidate = candidates.find((c) => c.id === candidateData.id);
      const job = jobs.find((j) => j.id === selectedJobForReassign);

      if (!candidate || !job) {
        toast.error("Candidate or job not found");
        return;
      }

      // Check if candidate is already ACTIVELY assigned to this job
      const existingJobApp = candidate.jobApplications?.find(
        (app) => app.jobId === selectedJobForReassign
      );
      if (existingJobApp && existingJobApp.status === "active") {
        toast.error("Candidate is already actively assigned to this job");
        return;
      }

      let updatedJobIds = candidate.jobIds || [];
      let updatedJobApplications = candidate.jobApplications || [];

      // Get the job's pipeline and first stage
      const jobPipeline = pipelines.find(
        (p) => p.jobId === selectedJobForReassign
      );
      const firstStageId = jobPipeline?.stages?.[0]?.id;

      if (existingJobApp) {
        // Candidate was previously assigned to this job (rejected/hired) - reactivate
        updatedJobApplications = updatedJobApplications.map((app) =>
          app.jobId === selectedJobForReassign
            ? {
                ...app,
                status: "active" as const,
                currentStage: firstStageId || undefined, // Reset to first stage of pipeline
                lastStatusChange: new Date(),
              }
            : app
        );
      } else {
        // New assignment - add to arrays
        const newJobApplication = {
          jobId: selectedJobForReassign,
          status: "active" as const,
          appliedAt: new Date(),
          currentStage: firstStageId || undefined, // Use first stage of pipeline
          lastStatusChange: new Date(),
          // Email tracking fields (required by CandidatePipeline interface)
          emailIds: [],
          emailsSent: 0,
          emailsReceived: 0,
        };

        updatedJobIds = [...updatedJobIds, selectedJobForReassign];
        updatedJobApplications = [...updatedJobApplications, newJobApplication];
      }

      // Update candidate
      await updateCandidate(candidateData.id, {
        jobIds: updatedJobIds,
        jobApplications: updatedJobApplications,
        clientIds: [
          ...new Set([...(candidate.clientIds || []), job.clientId as string]),
        ],
        status: "active", // Reactivate candidate if they were globally rejected
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      toast.success(
        `Candidate ${existingJobApp ? "reactivated for" : "assigned to"} ${
          job.title
        }`
      );
      setReassignJobDialogOpen(false);
      setSelectedJobForReassign("");
    } catch (error) {
      toast.error("Failed to reassign candidate");
    }
  };

  // 🔥 REALTIME: Get emails from Firestore for this candidate
  const {
    data: emails,
    loading: isLoadingEmails,
    error: emailsError,
  } = useEmailsByCandidate(actualCandidateId);

  // DISABLED: Excessive refetching causes performance issues and API spam
  // Only refetch on user action or manual page refresh
  //
  // // Refetch candidate data when window regains focus (for real-time sync)
  // React.useEffect(() => {
  //   const handleFocus = () => {
  //     if (candidateId) {
  //       //       fetchCandidateById(candidateId);
  //       fetchJobs();
  //     }
  //   };

  //   window.addEventListener("focus", handleFocus);
  //   return () => window.removeEventListener("focus", handleFocus);
  // }, [candidateId, fetchCandidateById, fetchJobs]);

  // // Poll for updates every 30 seconds when tab is visible
  // React.useEffect(() => {
  //   if (!candidateId) return;

  //   const interval = setInterval(() => {
  //     if (document.visibilityState === "visible") {
  //       //       fetchCandidateById(candidateId);
  //     }
  //   }, 30000); // 30 seconds

  //   return () => clearInterval(interval);
  // }, [candidateId, fetchCandidateById]);

  // Log candidate data for debugging
  React.useEffect(() => {
    if (candidateData) {
      // Backend uses 'experience' field, frontend type has 'workExperience'
    }
  }, [candidateData]);

  // DISABLED: Interviews not yet migrated to Firestore - no API call
  // Interviews will show as empty until data is migrated to Firestore
  // const fetchInterviews = React.useCallback(async () => {
  //   if (!candidateId) return;
  //   try {
  //     setIsLoadingInterviews(true);
  //     const response = await authenticatedFetch(
  //       `${API_BASE_URL}/interviews?candidateId=${candidateId}`
  //     );
  //     if (!response.ok) throw new Error("Failed to fetch interviews");
  //     const result = await response.json();
  //     setInterviews(result.data?.interviews || []);
  //   } catch (error) {
  //     //     setInterviews([]);
  //   } finally {
  //     setIsLoadingInterviews(false);
  //   }
  // }, [candidateId]);

  // React.useEffect(() => {
  //   fetchInterviews();
  // }, [fetchInterviews]);

  // 🔥 REALTIME: Derive selected tags directly from candidate data (updates automatically with Firestore)
  const selectedTags = React.useMemo(() => {
    if (!candidateData) {
      return [];
    }

    // Access tagIds directly from candidateData
    const tagIds = candidateData.tagIds;

    if (!tagIds || !Array.isArray(tagIds)) {
      return [];
    }

    // Handle both string IDs and object IDs for backward compatibility
    const processedTags = tagIds
      .map((id: string | { _id?: string; id?: string }) =>
        typeof id === "object" ? id._id || id.id || "" : id
      )
      .filter(Boolean);

    return processedTags;
  }, [candidateData, allTags.length]);

  // Update candidate tags on the backend
  const updateCandidateTags = React.useCallback(
    async (tagIds: string[]) => {
      if (!candidateId) return;

      try {
        const response = await authenticatedFetch(
          `${API_BASE_URL}/candidates/${candidateId}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ tagIds }),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to update tags");
        }

        // Firestore will automatically update candidate data in realtime
      } catch (error) {}
    },
    [candidateId]
  );

  const toggleTag = (tagId: string) => {
    const newTags = selectedTags.includes(tagId)
      ? selectedTags.filter((id) => id !== tagId)
      : [...selectedTags, tagId];

    // Update backend - Firestore will sync automatically and update selectedTags via candidateData
    updateCandidateTags(newTags);
  };

  // Loading state
  const isLoading =
    candidatesLoading || jobsLoading || clientsLoading || pipelinesLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader size="lg" text="Loading candidate details..." />
      </div>
    );
  }

  if (!candidateData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="text-lg font-semibold mb-2">Candidate not found</div>
          <Button
            onClick={() => navigate("/dashboard/candidates")}
            className="mt-4"
          >
            <IconArrowLeft className="h-4 w-4 mr-2" />
            Back to Candidates
          </Button>
        </div>
      </div>
    );
  }

  // Get job and client details
  const firstJobId = candidateData.jobIds?.[0];
  let job: (typeof jobs)[0] | null = null;
  let client: (typeof clients)[0] | null = null;

  if (firstJobId) {
    if (typeof firstJobId === "object" && "title" in firstJobId) {
      // jobId is already populated with job object
      const populatedJob = firstJobId as Record<string, unknown> & {
        id?: string;
        _id?: string;
        title?: string;
        clientId?: unknown;
      };
      job = {
        ...populatedJob,
        id: populatedJob.id || populatedJob._id,
      } as (typeof jobs)[0];
      if (
        job?.clientId &&
        typeof job.clientId === "object" &&
        "companyName" in job.clientId
      ) {
        // clientId is already populated
        const populatedClient = job.clientId as Record<string, unknown> & {
          id?: string;
          _id?: string;
          companyName?: string;
        };
        client = {
          ...populatedClient,
          id: populatedClient.id || populatedClient._id,
        } as (typeof clients)[0];
      } else if (job?.clientId) {
        const clientIdStr =
          typeof job.clientId === "object"
            ? (job.clientId as { _id?: string; id?: string })._id ||
              (job.clientId as { _id?: string; id?: string }).id
            : job.clientId;
        client = clients.find((c) => c.id === clientIdStr) || null;
      }
    } else {
      job = jobs.find((j) => j.id === firstJobId) || null;
      if (job?.clientId) {
        client = clients.find((c) => c.id === job?.clientId) || null;
      }
    }
  }

  // Log job and client data
  // Helper function to safely convert date values (Firestore Timestamps, Date objects, or strings)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const toSafeDate = (dateValue: any): string => {
    if (!dateValue) return "N/A";

    try {
      // Handle Firestore Timestamp objects
      if (
        dateValue &&
        typeof dateValue === "object" &&
        "seconds" in dateValue
      ) {
        const date = new Date(dateValue.seconds * 1000);
        return date.toLocaleDateString();
      }

      // Handle string dates
      if (typeof dateValue === "string") {
        const date = new Date(dateValue);
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString();
        }
      }

      // Handle Date objects
      if (dateValue instanceof Date) {
        if (!isNaN(dateValue.getTime())) {
          return dateValue.toLocaleDateString();
        }
      }

      // If we can't convert it, return N/A
      return "N/A";
    } catch (error) {
      return "N/A";
    }
  };

  const candidate = {
    id: candidateData.id || "",
    firstName: candidateData.firstName,
    lastName: candidateData.lastName,
    fullName: `${candidateData.firstName} ${candidateData.lastName}`,
    email: candidateData.email,
    phone: candidateData.phone || "N/A",
    photo: candidateData.avatar,
    currentTitle: candidateData.currentTitle,
    currentCompany: candidateData.currentCompany,
    yearsOfExperience: candidateData.yearsOfExperience || 0,
    skills: candidateData.skills || [],
    coverLetter: candidateData.coverLetter?.url || candidateData.notes,
    resumeText: candidateData.notes,
    resumeFilename:
      (candidateData as { resumeOriginalName?: string }).resumeOriginalName ||
      candidateData.resume?.name ||
      "resume.pdf",
    resumeFileSize: candidateData.resume?.size
      ? `${Math.round(candidateData.resume.size / 1024)} KB`
      : "N/A",
    resumeUrl:
      (candidateData as { resumeUrl?: string }).resumeUrl ||
      candidateData.resume?.url,
    location: candidateData.address
      ? `${candidateData.address.city}, ${candidateData.address.country}`
      : undefined,
    linkedInUrl: candidateData.linkedInUrl,
    portfolioUrl: candidateData.portfolioUrl,
    githubUrl: candidateData.githubUrl,
    // Use actual status from backend model
    status: (() => {
      const backendStatus = (
        candidateData as {
          status?:
            | "active"
            | "interviewing"
            | "offered"
            | "hired"
            | "rejected"
            | "withdrawn";
        }
      ).status;
      if (!backendStatus) return "In Process";

      switch (backendStatus) {
        case "hired":
          return "Hired";
        case "rejected":
          return "Rejected";
        case "offered":
          return "Offered";
        case "interviewing":
          return "Interviewing";
        case "withdrawn":
          return "Withdrawn";
        case "active":
        default:
          return "In Process";
      }
    })(),
    jobId: job?.id || "N/A",
    jobTitle: job?.title || "N/A",
    currentStage: (() => {
      const stageId =
        (candidateData as any).currentPipelineStageId ||
        candidateData.currentStage;

      if (!stageId || typeof stageId !== "string" || !job?.pipelineId) {
        return "Not Assigned";
      }

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
        if (!stage && stageId.includes("stage_") && stageId.includes("_")) {
          const parts = stageId.split("_");
          const stageIndex = parseInt(parts[parts.length - 1]);
          if (!isNaN(stageIndex) && stageIndex < jobPipeline.stages.length) {
            stage = jobPipeline.stages[stageIndex];
          }
        }

        // Step 4: Fuzzy match for renamed stages
        if (!stage) {
          const stageIdLower = stageId.toLowerCase();
          stage = jobPipeline.stages.find((s: any) => {
            const stageName = s.name?.toLowerCase() || "";
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

        if (stage?.name) return stage.name;
      }

      return "Not Assigned";
    })(),
    clientName: client?.companyName || "N/A",
    clientLogo:
      client?.logo ||
      `https://api.dicebear.com/7.x/initials/svg?seed=${
        client?.companyName || "C"
      }`,
    appliedDate: toSafeDate(candidateData.createdAt),
    lastStatusChange: toSafeDate(candidateData.updatedAt),
    rating: undefined as number | undefined, // Backend doesn't have rating in Candidate model
    reviewedBy: (() => {
      const assignedTo = (
        candidateData as {
          assignedTo?:
            | string
            | { firstName?: string; lastName?: string; email?: string };
        }
      ).assignedTo;

      if (!assignedTo) {
        return "N/A";
      }

      if (typeof assignedTo === "object") {
        // Populated user object from backend
        const name =
          `${assignedTo.firstName || ""} ${assignedTo.lastName || ""}`.trim() ||
          assignedTo.email ||
          "N/A";
        return name;
      } else if (typeof assignedTo === "string") {
        // User ID - look up in team members (THIS IS THE ASSIGNED USER, NOT LOGGED-IN USER)
        const member = teamMembers.find(
          (m) => m.userId === assignedTo || m.id === assignedTo
        );
        if (member) {
          const name =
            `${member.firstName} ${member.lastName}`.trim() ||
            member.email ||
            "N/A";
          return name;
        } else {
        }
      }

      return "N/A";
    })(),
    teamMembers: [] as string[],
    interviewScheduled: undefined as Date | undefined, // Backend doesn't have this in Candidate model
    totalEmails:
      (candidateData.totalEmailsSent || 0) +
      (candidateData.totalEmailsReceived || 0),
    videoIntroUrl: undefined,
    videoIntroFilename: undefined,
    videoIntroFileSize: undefined,
    videoIntroDuration: undefined,
    // Additional fields from backend - use 'experience' field from backend
    experience:
      (
        candidateData as {
          experience?: Array<{
            company: string;
            title: string;
            duration: string;
            description?: string;
          }>;
        }
      ).experience ||
      candidateData.workExperience ||
      [],
    education: candidateData.education || [],
    certifications: candidateData.certifications || [],
    languages: candidateData.languages || [],
    aiScore: (
      candidateData as {
        aiScore?: {
          overallScore: number;
          skillsMatch: number;
          experienceMatch: number;
          educationMatch: number;
          summary: string;
          strengths: string[];
          concerns: string[];
          recommendation: string;
        };
      }
    ).aiScore,
  };

  // Log transformed candidate object
  // Build history data from jobApplications
  const historyData: Array<{
    id: string;
    jobTitle: string;
    jobId: string;
    clientName: string;
    appliedDate: string;
    appliedDateRaw: Date; // Keep raw date for timeline
    status: string;
    stage: string;
    lastUpdated: string;
    lastUpdatedRaw: Date; // Keep raw date for timeline
  }> = candidateData.jobApplications
    ? candidateData.jobApplications.map((jobApp) => {
        // Find the job details
        const jobAppJobId =
          typeof jobApp.jobId === "object" && jobApp.jobId !== null
            ? (jobApp.jobId as { _id?: string; id?: string })._id ||
              (jobApp.jobId as { _id?: string; id?: string }).id
            : jobApp.jobId;
        const jobDetails = jobs.find(
          (j) => j.id === jobAppJobId || j.id === jobAppJobId?.toString()
        );

        // Find the client details
        let clientName = "Unknown Client";
        if (jobDetails?.clientId) {
          const clientIdStr =
            typeof jobDetails.clientId === "object" &&
            jobDetails.clientId !== null
              ? (jobDetails.clientId as { _id?: string; id?: string })._id ||
                (jobDetails.clientId as { _id?: string; id?: string }).id
              : jobDetails.clientId;
          const clientDetails = clients.find((c) => c.id === clientIdStr);
          clientName = clientDetails?.companyName || "Unknown Client";
        }

        // Helper to convert any date value to Date object
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const toDateObject = (dateValue: any): Date => {
          if (!dateValue) return new Date();

          // Handle Firestore Timestamp
          if (
            dateValue &&
            typeof dateValue === "object" &&
            "seconds" in dateValue
          ) {
            return new Date(dateValue.seconds * 1000);
          }

          // Handle string or Date
          const date = new Date(dateValue);
          return isNaN(date.getTime()) ? new Date() : date;
        };

        const appliedDateObj = toDateObject(jobApp.appliedAt);
        const lastUpdatedObj = toDateObject(
          jobApp.lastStatusChange || jobApp.appliedAt
        );

        return {
          id:
            (jobApp as { _id?: string })._id ||
            `${jobAppJobId}-${jobApp.appliedAt}`,
          jobTitle: jobDetails?.title || "Unknown Job",
          jobId: jobAppJobId?.toString() || "",
          clientName,
          appliedDate: appliedDateObj.toLocaleDateString(),
          appliedDateRaw: appliedDateObj,
          status: jobApp.status || "active",
          stage: jobApp.currentStage || "Not Started",
          lastUpdated: lastUpdatedObj.toLocaleDateString(),
          lastUpdatedRaw: lastUpdatedObj,
        };
      })
    : [];

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-3 md:gap-4 py-3 md:py-4 lg:py-6">
          {/* Header with Back Button */}
          <div className="px-3 md:px-4 lg:px-6">
            <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/dashboard/candidates")}
                className="gap-2"
              >
                <IconArrowLeft className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Back to Candidates</span>
              </Button>
            </div>

            {/* Candidate Header Card */}
            <Card className="border-2">
              <CardContent className="p-3 md:p-4 lg:p-6">
                <div className="flex flex-col sm:flex-row gap-4 md:gap-6">
                  {/* Avatar */}
                  <Avatar className="h-20 w-20 md:h-24 md:w-24 border-2 rounded-lg shrink-0">
                    <AvatarImage
                      src={candidate.photo || ""}
                      className="object-cover"
                    />
                    <AvatarFallback className="text-xl md:text-2xl font-semibold rounded-lg">
                      {candidate.firstName[0]}
                      {candidate.lastName[0]}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    {/* Name and Title Row */}
                    <div className="flex flex-col gap-3 mb-3 md:mb-4">
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 md:gap-3 mb-2">
                          <h1 className="text-xl md:text-2xl font-bold">
                            {candidate.fullName}
                          </h1>
                          {candidateData?.status?.toLowerCase() ===
                            "rejected" && (
                            <Badge
                              variant="destructive"
                              className="text-sm px-3 py-1 animate-pulse"
                            >
                              REJECTED
                            </Badge>
                          )}
                          {candidate.rating && candidate.rating > 0 && (
                            <div className="flex items-center gap-0.5">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <svg
                                  key={i}
                                  className={`h-3.5 w-3.5 md:h-4 md:w-4 ${
                                    i < candidate.rating!
                                      ? "fill-amber-500 text-amber-500"
                                      : "fill-muted text-muted"
                                  }`}
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                              ))}
                            </div>
                          )}
                        </div>
                        {candidate.currentTitle && (
                          <p className="text-xs md:text-sm text-muted-foreground flex items-center gap-2">
                            <IconBriefcase className="h-3.5 w-3.5 md:h-4 md:w-4 shrink-0" />
                            {candidate.currentTitle}
                            {candidate.currentCompany &&
                              ` at ${candidate.currentCompany}`}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Contact Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3 text-xs md:text-sm mb-3 md:mb-4">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <IconMail className="h-3.5 w-3.5 md:h-4 md:w-4 shrink-0" />
                        <a
                          href={`mailto:${candidate.email}`}
                          className="hover:text-foreground truncate"
                        >
                          {candidate.email}
                        </a>
                      </div>
                      {candidate.phone && candidate.phone !== "N/A" && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <IconPhone className="h-3.5 w-3.5 md:h-4 md:w-4 shrink-0" />
                          <a
                            href={`tel:${candidate.phone}`}
                            className="hover:text-foreground"
                          >
                            {candidate.phone}
                          </a>
                        </div>
                      )}
                      {candidate.location && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <IconMapPin className="h-3.5 w-3.5 md:h-4 md:w-4 shrink-0" />
                          <span className="truncate">{candidate.location}</span>
                        </div>
                      )}
                    </div>

                    {/* Tags Section - Moved here for better visibility */}
                    <div className="flex flex-wrap items-center gap-2 mb-3 md:mb-4">
                      <IconTag className="h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground shrink-0" />
                      {selectedTags.length === 0 ? (
                        <span className="text-sm text-muted-foreground">
                          No tags
                        </span>
                      ) : (
                        selectedTags.map((tagId) => {
                          const tag = allTags.find((t) => t.id === tagId);
                          if (!tag) return null;
                          return (
                            <Badge
                              key={tag.id}
                              variant="secondary"
                              style={{
                                backgroundColor: `${tag.color || "#10B981"}15`,
                                color: tag.color || "#10B981",
                                borderColor: `${tag.color || "#10B981"}40`,
                              }}
                              className="px-2 py-1 text-xs border"
                            >
                              {tag.name}
                              <button
                                onClick={() => toggleTag(tag.id!)}
                                className="ml-1.5 hover:opacity-70"
                              >
                                <IconX className="h-3 w-3" />
                              </button>
                            </Badge>
                          );
                        })
                      )}
                      <Popover
                        open={openTagPopover}
                        onOpenChange={setOpenTagPopover}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                          >
                            <IconTag className="h-3 w-3 mr-1" />
                            Add Tag
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0" align="start">
                          <Command>
                            <CommandInput placeholder="Search tags..." />
                            {isLoadingTags ? (
                              <div className="p-3 text-center text-sm text-muted-foreground">
                                Loading tags...
                              </div>
                            ) : (
                              <CommandEmpty>No tags found.</CommandEmpty>
                            )}
                            <CommandGroup className="max-h-[200px] overflow-auto">
                              {allTags.map((tag) => (
                                <CommandItem
                                  key={tag.id}
                                  value={tag.name}
                                  onSelect={() => {
                                    toggleTag(tag.id!);
                                  }}
                                >
                                  <div className="flex items-center gap-2 flex-1">
                                    <div
                                      className="h-3 w-3 rounded-full"
                                      style={{
                                        backgroundColor: tag.color || "#10B981",
                                      }}
                                    />
                                    <span>{tag.name}</span>
                                  </div>
                                  {selectedTags.includes(tag.id!) && (
                                    <IconCircleCheckFilled className="h-4 w-4 text-primary" />
                                  )}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* Social Links */}
                    {(candidate.linkedInUrl ||
                      candidate.githubUrl ||
                      candidate.portfolioUrl) && (
                      <div className="flex flex-wrap gap-2">
                        {candidate.linkedInUrl && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              window.open(candidate.linkedInUrl, "_blank")
                            }
                          >
                            <svg
                              className="h-4 w-4 mr-1.5"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                            >
                              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                            </svg>
                            LinkedIn
                          </Button>
                        )}
                        {candidate.githubUrl && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              window.open(candidate.githubUrl, "_blank")
                            }
                          >
                            <svg
                              className="h-4 w-4 mr-1.5"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                            >
                              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                            </svg>
                            GitHub
                          </Button>
                        )}
                        {candidate.portfolioUrl && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              window.open(candidate.portfolioUrl, "_blank")
                            }
                          >
                            <IconBriefcase className="h-4 w-4 mr-1.5" />
                            Portfolio
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="px-3 md:px-4 lg:px-6 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReassignJob}
              className="gap-2"
            >
              <IconBriefcase className="h-4 w-4" />
              Apply to Another Job
            </Button>
          </div>

          {/* Tabs Section */}
          <div className="px-3 md:px-4 lg:px-6">
            <Tabs defaultValue="overview" className="w-full">
              <div className="overflow-x-auto -mx-3 px-3 md:mx-0 md:px-0">
                <TabsList className="h-9 md:h-10 lg:h-11 p-1 bg-card border border-border w-full inline-flex">
                  <TabsTrigger
                    value="overview"
                    className="flex-1 text-xs md:text-sm data-[state=active]:bg-primary data-[state=active]:text-white! data-[state=inactive]:text-muted-foreground px-2 md:px-3 gap-1.5"
                  >
                    <IconEye className="h-4 w-4 shrink-0" />
                    <span className="hidden sm:inline">Overview</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="candidacy"
                    className="flex-1 text-xs md:text-sm data-[state=active]:bg-primary data-[state=active]:text-white! data-[state=inactive]:text-muted-foreground px-2 md:px-3 gap-1.5"
                  >
                    <IconUsers className="h-4 w-4 shrink-0" />
                    <span className="hidden sm:inline">Candidacy</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="communications"
                    className="flex-1 text-xs md:text-sm data-[state=active]:bg-primary data-[state=active]:text-white! data-[state=inactive]:text-muted-foreground px-2 md:px-3 gap-1.5"
                  >
                    <IconMessageCircle className="h-4 w-4 shrink-0" />
                    <span className="hidden sm:inline">Comms</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="interviews"
                    className="flex-1 text-xs md:text-sm data-[state=active]:bg-primary data-[state=active]:text-white! data-[state=inactive]:text-muted-foreground px-2 md:px-3 gap-1.5"
                  >
                    <IconCalendar className="h-4 w-4 shrink-0" />
                    <span className="hidden sm:inline">Interviews</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="history"
                    className="flex-1 text-xs md:text-sm data-[state=active]:bg-primary data-[state=active]:text-white! data-[state=inactive]:text-muted-foreground px-2 md:px-3 gap-1.5"
                  >
                    <IconHistory className="h-4 w-4 shrink-0" />
                    <span className="hidden sm:inline">History</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Overview Tab */}
              <TabsContent
                value="overview"
                className="mt-4 md:mt-6 space-y-4 md:space-y-6"
              >
                {/* Skills */}
                {candidate.skills && candidate.skills.length > 0 && (
                  <Card>
                    <CardHeader className="p-3 md:p-4 lg:p-6">
                      <CardTitle className="text-sm md:text-base">
                        Skills
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 md:p-4 lg:p-6 pt-0">
                      <div className="flex flex-wrap gap-1.5 md:gap-2">
                        {candidate.skills.map((skill, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="text-xs md:text-sm font-normal"
                          >
                            {typeof skill === "string" ? skill : skill.name}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Work Experience */}
                {candidate.experience && candidate.experience.length > 0 && (
                  <Card>
                    <CardHeader className="p-3 md:p-4 lg:p-6">
                      <CardTitle className="text-sm md:text-base">
                        Work Experience
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 md:p-4 lg:p-6 pt-0">
                      <div className="space-y-3 md:space-y-4">
                        {candidate.experience.map((exp, index) => {
                          const workExp = exp as {
                            company?: string;
                            title?: string;
                            position?: string;
                            duration?: string;
                            description?: string;
                          };
                          const title =
                            workExp.title ||
                            workExp.position ||
                            "Position Not Specified";

                          return (
                            <div
                              key={index}
                              className={`pb-3 md:pb-4 ${
                                index !== candidate.experience.length - 1
                                  ? "border-b"
                                  : ""
                              }`}
                            >
                              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 md:gap-3 mb-2">
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-xs md:text-sm">
                                    {title}
                                  </h4>
                                  {workExp.company && (
                                    <p className="text-xs md:text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                      <IconBriefcase className="h-3 w-3 shrink-0" />
                                      {workExp.company}
                                    </p>
                                  )}
                                </div>
                                {workExp.duration && (
                                  <Badge
                                    variant="outline"
                                    className="text-xs whitespace-nowrap shrink-0"
                                  >
                                    {workExp.duration}
                                  </Badge>
                                )}
                              </div>
                              {workExp.description && (
                                <p className="text-xs md:text-sm text-muted-foreground mt-2 whitespace-pre-line leading-relaxed">
                                  {workExp.description}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Education */}
                {candidate.education && candidate.education.length > 0 && (
                  <Card>
                    <CardHeader className="p-3 md:p-4 lg:p-6">
                      <CardTitle className="text-sm md:text-base">
                        Education
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 md:p-4 lg:p-6 pt-0">
                      <div className="space-y-3 md:space-y-4">
                        {candidate.education.map((edu, index) => {
                          const education = edu as {
                            institution?: string;
                            degree?: string;
                            field?: string;
                            year?: string;
                          };

                          return (
                            <div
                              key={index}
                              className={`pb-3 md:pb-4 ${
                                index !== candidate.education.length - 1
                                  ? "border-b"
                                  : ""
                              }`}
                            >
                              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 md:gap-3 mb-2">
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-xs md:text-sm">
                                    {education.degree || "Degree Not Specified"}
                                  </h4>
                                  <p className="text-xs md:text-sm text-muted-foreground mt-1">
                                    {education.institution ||
                                      "Institution Not Specified"}
                                  </p>
                                </div>
                                <div className="text-left sm:text-right">
                                  {education.year && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {education.year}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              {education.field && (
                                <p className="text-xs md:text-sm text-muted-foreground mt-1">
                                  Field: {education.field}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Additional Qualifications */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                  {/* Certifications */}
                  {candidate.certifications &&
                    candidate.certifications.length > 0 && (
                      <Card>
                        <CardHeader className="p-3 md:p-4 lg:p-6">
                          <CardTitle className="text-sm md:text-base">
                            Certifications
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-3 md:p-4 lg:p-6 pt-0">
                          <ul className="space-y-1.5 md:space-y-2">
                            {candidate.certifications.map((cert, index) => (
                              <li
                                key={index}
                                className="flex items-start gap-2 text-xs md:text-sm"
                              >
                                <IconCircleCheckFilled className="h-3.5 w-3.5 md:h-4 md:w-4 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
                                <span>{cert}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}

                  {/* Languages */}
                  {candidate.languages && candidate.languages.length > 0 && (
                    <Card>
                      <CardHeader className="p-3 md:p-4 lg:p-6">
                        <CardTitle className="text-sm md:text-base">
                          Languages
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-3 md:p-4 lg:p-6 pt-0">
                        <div className="flex flex-wrap gap-1.5 md:gap-2">
                          {candidate.languages.map((lang, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="text-xs md:text-sm font-normal"
                            >
                              {typeof lang === "string" ? lang : lang.name}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* AI Score & Analysis */}
                {candidate.aiScore && (
                  <Card className="border-purple-200 dark:border-purple-800">
                    <CardHeader className="p-3 md:p-4 lg:p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <CardTitle className="text-sm md:text-base">
                          AI Candidate Analysis
                        </CardTitle>
                        <Badge
                          variant="outline"
                          className={`text-xs w-fit ${
                            candidate.aiScore.overallScore >= 80
                              ? "bg-green-100 text-green-700 border-green-200"
                              : candidate.aiScore.overallScore >= 60
                              ? "bg-blue-100 text-blue-700 border-blue-200"
                              : candidate.aiScore.overallScore >= 40
                              ? "bg-yellow-100 text-yellow-700 border-yellow-200"
                              : "bg-red-100 text-red-700 border-red-200"
                          }`}
                        >
                          {candidate.aiScore.recommendation
                            .replace("_", " ")
                            .toUpperCase()}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3 md:space-y-4 p-3 md:p-4 lg:p-6 pt-0">
                      {/* Overall Score */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label className="text-xs md:text-sm font-medium">
                            Overall Match Score
                          </Label>
                          <span className="text-xl md:text-2xl font-bold text-primary">
                            {candidate.aiScore.overallScore}%
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              candidate.aiScore.overallScore >= 80
                                ? "bg-green-600"
                                : candidate.aiScore.overallScore >= 60
                                ? "bg-blue-600"
                                : candidate.aiScore.overallScore >= 40
                                ? "bg-yellow-600"
                                : "bg-red-600"
                            }`}
                            style={{
                              width: `${candidate.aiScore.overallScore}%`,
                            }}
                          />
                        </div>
                      </div>

                      {/* Detailed Scores */}
                      <div className="grid grid-cols-3 gap-2 md:gap-3">
                        <div className="p-2 md:p-3 rounded-lg border bg-card">
                          <Label className="text-[10px] md:text-xs text-muted-foreground">
                            Skills Match
                          </Label>
                          <p className="text-base md:text-xl font-bold mt-1">
                            {candidate.aiScore.skillsMatch}%
                          </p>
                        </div>
                        <div className="p-2 md:p-3 rounded-lg border bg-card">
                          <Label className="text-[10px] md:text-xs text-muted-foreground">
                            Experience Match
                          </Label>
                          <p className="text-base md:text-xl font-bold mt-1">
                            {candidate.aiScore.experienceMatch}%
                          </p>
                        </div>
                        <div className="p-2 md:p-3 rounded-lg border bg-card">
                          <Label className="text-[10px] md:text-xs text-muted-foreground">
                            Education Match
                          </Label>
                          <p className="text-base md:text-xl font-bold mt-1">
                            {candidate.aiScore.educationMatch}%
                          </p>
                        </div>
                      </div>

                      {/* Summary */}
                      {candidate.aiScore.summary && (
                        <div className="p-2.5 md:p-3 rounded-lg bg-muted/50 border">
                          <Label className="text-xs text-muted-foreground mb-1.5 block">
                            AI Summary
                          </Label>
                          <p className="text-xs md:text-sm leading-relaxed">
                            {candidate.aiScore.summary}
                          </p>
                        </div>
                      )}

                      {/* Strengths */}
                      {candidate.aiScore.strengths &&
                        candidate.aiScore.strengths.length > 0 && (
                          <div>
                            <Label className="text-xs md:text-sm font-medium mb-2 flex items-center gap-2">
                              <IconCircleCheckFilled className="h-3.5 w-3.5 md:h-4 md:w-4 text-green-600" />
                              Strengths
                            </Label>
                            <ul className="space-y-1.5">
                              {candidate.aiScore.strengths.map(
                                (strength, index) => (
                                  <li
                                    key={index}
                                    className="flex items-start gap-2 text-xs md:text-sm"
                                  >
                                    <span className="text-green-600 mt-0.5">
                                      •
                                    </span>
                                    <span>{strength}</span>
                                  </li>
                                )
                              )}
                            </ul>
                          </div>
                        )}

                      {/* Concerns */}
                      {candidate.aiScore.concerns &&
                        candidate.aiScore.concerns.length > 0 && (
                          <div>
                            <Label className="text-xs md:text-sm font-medium mb-2 flex items-center gap-2">
                              <IconX className="h-3.5 w-3.5 md:h-4 md:w-4 text-amber-600" />
                              Areas for Consideration
                            </Label>
                            <ul className="space-y-1.5">
                              {candidate.aiScore.concerns.map(
                                (concern, index) => (
                                  <li
                                    key={index}
                                    className="flex items-start gap-2 text-xs md:text-sm"
                                  >
                                    <span className="text-amber-600 mt-0.5">
                                      •
                                    </span>
                                    <span>{concern}</span>
                                  </li>
                                )
                              )}
                            </ul>
                          </div>
                        )}
                    </CardContent>
                  </Card>
                )}

                {/* Documents */}
                {(candidate.resumeFilename || candidate.videoIntroUrl) && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">
                        Documents & Media
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Resume */}
                      {candidate.resumeFilename && (
                        <div className="rounded-lg border overflow-hidden">
                          <div className="flex items-center justify-between gap-3 p-3 bg-muted/50">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className="rounded-md bg-background p-2 border">
                                <IconFileText className="h-5 w-5 text-muted-foreground" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium truncate">
                                  {candidate.resumeFilename}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  setShowResumePreview(!showResumePreview)
                                }
                                className="h-8 px-3"
                              >
                                <span className="text-xs">
                                  {showResumePreview ? "Hide" : "View"}
                                </span>
                              </Button>
                              {candidate.resumeUrl && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    window.open(candidate.resumeUrl, "_blank")
                                  }
                                >
                                  <IconDownload className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                          {showResumePreview && (
                            <div className="border-t">
                              {candidate.resumeUrl ? (
                                candidate.resumeUrl
                                  .toLowerCase()
                                  .endsWith(".pdf") ? (
                                  <div className="relative bg-muted/30">
                                    <iframe
                                      src={`${candidate.resumeUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                                      className="w-full h-[600px]"
                                      title="Resume Preview"
                                    />
                                  </div>
                                ) : (
                                  <div className="p-12 text-center bg-muted/30">
                                    <IconFileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
                                    <p className="text-sm text-muted-foreground mb-1">
                                      PDF Preview Only
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      Download the file to view
                                    </p>
                                  </div>
                                )
                              ) : candidate.resumeText ? (
                                <div className="max-h-[600px] overflow-y-auto p-4 bg-muted/30">
                                  <pre className="text-xs whitespace-pre-wrap leading-relaxed">
                                    {candidate.resumeText}
                                  </pre>
                                </div>
                              ) : (
                                <div className="p-12 text-center bg-muted/30">
                                  <IconFileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
                                  <p className="text-sm text-muted-foreground mb-1">
                                    Preview not available
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    Download the file to view
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Video Introduction */}
                      {candidate.videoIntroUrl && (
                        <div className="rounded-lg border overflow-hidden">
                          <div className="flex items-center justify-between gap-3 p-3 bg-muted/50">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className="rounded-md bg-background p-2 border">
                                <IconFileText className="h-5 w-5 text-muted-foreground" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium truncate">
                                  {candidate.videoIntroFilename ||
                                    "Video Introduction"}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                  {candidate.videoIntroDuration && (
                                    <span>{candidate.videoIntroDuration}</span>
                                  )}
                                  {candidate.videoIntroFileSize && (
                                    <>
                                      <span>•</span>
                                      <span>
                                        {candidate.videoIntroFileSize}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  setShowVideoPreview(!showVideoPreview)
                                }
                                className="h-8 px-3"
                              >
                                <span className="text-xs">
                                  {showVideoPreview ? "Hide" : "View"}
                                </span>
                              </Button>
                              <Button variant="ghost" size="sm">
                                <IconDownload className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          {showVideoPreview && (
                            <div className="border-t">
                              {/* Check if it's an external video link (Loom, YouTube, Vimeo, etc.) */}
                              {(candidate.videoIntroUrl?.includes('loom.com') ||
                                candidate.videoIntroUrl?.includes('youtube.com') ||
                                candidate.videoIntroUrl?.includes('youtu.be') ||
                                candidate.videoIntroUrl?.includes('vimeo.com')) ? (
                                <div className="bg-muted/30 p-6 text-center space-y-3">
                                  <div className="flex justify-center">
                                    <div className="rounded-full bg-blue-500/10 p-3">
                                      <svg
                                        className="w-6 h-6 text-blue-600"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                        />
                                      </svg>
                                    </div>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium mb-1">
                                      External Video Link
                                    </p>
                                    <p className="text-xs text-muted-foreground mb-3">
                                      Click the link below to watch the video introduction.
                                    </p>
                                    <a
                                      href={candidate.videoIntroUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                                    >
                                      <svg
                                        className="w-4 h-4"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                                        />
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                        />
                                      </svg>
                                      Watch Video
                                    </a>
                                  </div>
                                </div>
                              ) : (
                                // Regular video player for Cloudinary or other direct video URLs
                                <div className="bg-black flex items-center justify-center">
                                  <video
                                    controls
                                    className="w-full h-[600px] object-contain"
                                    preload="metadata"
                                    poster={candidate.photo || undefined}
                                  >
                                    <source
                                      src={candidate.videoIntroUrl}
                                      type="video/mp4"
                                    />
                                    <source
                                      src={candidate.videoIntroUrl}
                                      type="video/webm"
                                    />
                                    <source
                                      src={candidate.videoIntroUrl}
                                      type="video/ogg"
                                    />
                                    Your browser does not support the video tag.
                                  </video>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Cover Letter */}
                {candidate.coverLetter && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Cover Letter</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="prose prose-sm max-w-none">
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                          {candidate.coverLetter}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Current Candidacy Tab */}
              <TabsContent
                value="candidacy"
                className="mt-4 md:mt-6 space-y-4 md:space-y-6"
              >
                {/* Rejection Warning Banner */}
                {candidateData?.status?.toLowerCase() === "rejected" && (
                  <div className="p-4 bg-red-50 dark:bg-red-950/30 border-2 border-red-200 dark:border-red-800 rounded-lg">
                    <div className="flex items-start gap-3">
                      <IconX className="h-6 w-6 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-base font-semibold text-red-900 dark:text-red-100 mb-1">
                          Candidate Rejected
                        </p>
                        <p className="text-sm text-red-700 dark:text-red-300">
                          This candidate has been rejected and is no longer
                          active in the hiring process. Stage changes and
                          interview scheduling are disabled. The candidate
                          remains visible for historical record and future
                          reference.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Current Application Card */}
                <Card className="border-primary/20">
                  <CardHeader className="p-3 md:p-4 lg:p-6">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3 md:gap-4">
                      <div className="flex items-start gap-2 md:gap-3 flex-1">
                        <Avatar className="h-10 w-10 md:h-12 md:w-12 rounded-md border-2 shrink-0">
                          <AvatarImage src={candidate.clientLogo} />
                          <AvatarFallback className="rounded-md text-xs md:text-sm">
                            {candidate.clientName
                              .split(" ")
                              .map((n: string) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base md:text-lg">
                            {candidate.jobTitle}
                          </CardTitle>
                          <p className="text-xs md:text-sm text-muted-foreground mt-1">
                            {candidate.clientName}
                          </p>
                        </div>
                      </div>

                      {/* Assigned Under - Moved to Top Right */}
                      <div className="bg-linear-to-br from-primary/10 to-primary/5 border-2 border-primary/20 rounded-lg p-2.5 md:p-3 w-full lg:min-w-[200px] lg:w-auto">
                        <Label className="text-xs text-muted-foreground mb-2 block">
                          Assigned under:
                        </Label>
                        <div className="flex items-center gap-2 md:gap-3">
                          <Avatar className="h-8 w-8 md:h-10 md:w-10 border-2 border-primary/30 shrink-0">
                            <AvatarImage src="" alt={candidate.reviewedBy} />
                            <AvatarFallback className="text-xs md:text-sm font-semibold bg-primary/20 text-primary">
                              {candidate.reviewedBy
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs md:text-sm font-semibold truncate">
                              {candidate.reviewedBy}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 md:space-y-6 p-3 md:p-4 lg:p-6 pt-0">
                    {/* Job Information Grid */}
                    <div>
                      <h4 className="text-xs md:text-sm font-semibold mb-2 md:mb-3">
                        Job Information
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                        <div className="p-2.5 md:p-3 rounded-lg border bg-muted/30">
                          <Label className="text-xs text-muted-foreground">
                            Job ID
                          </Label>
                          <p className="text-xs md:text-sm font-medium font-mono mt-1">
                            {candidate.jobId}
                          </p>
                        </div>
                        <div className="p-2.5 md:p-3 rounded-lg border bg-muted/30">
                          <Label className="text-xs text-muted-foreground">
                            Client
                          </Label>
                          <p className="text-xs md:text-sm font-medium mt-1 truncate">
                            {candidate.clientName}
                          </p>
                        </div>
                        <div className="p-2.5 md:p-3 rounded-lg border bg-muted/30">
                          <Label className="text-xs text-muted-foreground">
                            Job Title
                          </Label>
                          <p className="text-xs md:text-sm font-medium mt-1 truncate">
                            {candidate.jobTitle}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Application Progress */}
                    <div>
                      <h4 className="text-xs md:text-sm font-semibold mb-2 md:mb-3">
                        Application Progress
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                        <div className="p-2.5 md:p-3 rounded-lg border bg-card">
                          <Label className="text-xs text-muted-foreground">
                            Current Stage
                          </Label>
                          <p className="text-xs md:text-sm font-semibold mt-1 text-primary">
                            {candidate.currentStage}
                          </p>
                        </div>
                        <div className="p-2.5 md:p-3 rounded-lg border bg-card">
                          <Label className="text-xs text-muted-foreground">
                            Applied Date
                          </Label>
                          <p className="text-xs md:text-sm font-medium mt-1">
                            {candidate.appliedDate}
                          </p>
                        </div>
                        <div className="p-2.5 md:p-3 rounded-lg border bg-card">
                          <Label className="text-xs text-muted-foreground">
                            Last Updated
                          </Label>
                          <p className="text-xs md:text-sm font-medium mt-1">
                            {candidate.lastStatusChange}
                          </p>
                        </div>
                        {candidate.interviewScheduled && (
                          <div className="p-2.5 md:p-3 rounded-lg border bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800">
                            <Label className="text-xs text-amber-700 dark:text-amber-400">
                              Next Interview
                            </Label>
                            <p className="text-xs md:text-sm font-semibold mt-1 text-amber-800 dark:text-amber-300">
                              {new Date(
                                candidate.interviewScheduled
                              ).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Rating & Feedback */}
                    {candidate.rating && (
                      <div>
                        <h4 className="text-xs md:text-sm font-semibold mb-2 md:mb-3">
                          Rating & Feedback
                        </h4>
                        <div className="p-3 md:p-4 rounded-lg border bg-linear-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/30 dark:to-orange-950/30 border-yellow-200 dark:border-yellow-800">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <IconCircleCheckFilled
                                  key={i}
                                  className={`h-4 w-4 md:h-5 md:w-5 ${
                                    i < Math.floor(candidate.rating!)
                                      ? "text-yellow-500 fill-yellow-500"
                                      : "text-gray-300 dark:text-gray-600"
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-base md:text-lg font-bold text-yellow-700 dark:text-yellow-400">
                              {candidate.rating.toFixed(1)}
                            </span>
                            <span className="text-xs md:text-sm text-muted-foreground">
                              / 5.0
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            Based on interview feedback and assessments
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Communications Tab */}
              <TabsContent
                value="communications"
                className="mt-4 md:mt-6 space-y-4 md:space-y-6"
              >
                {/* Info Notice for Rejected Candidates */}
                {candidateData?.status?.toLowerCase() === "rejected" && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border-2 border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="flex items-start gap-3">
                      <IconMail className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
                          Email Communication Still Available
                        </p>
                        <p className="text-xs text-blue-700 dark:text-blue-300">
                          Although this candidate has been rejected, email
                          communication remains available in case the hiring
                          team reconsiders or needs to reach out for future
                          opportunities.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <Card>
                  <CardHeader className="p-3 md:p-4 lg:p-6">
                    <CardTitle className="text-sm md:text-base">
                      Email Communication History
                    </CardTitle>
                    <p className="text-xs md:text-sm text-muted-foreground">
                      All email communications with this candidate across all
                      jobs
                    </p>
                  </CardHeader>
                  <CardContent className="p-3 md:p-4 lg:p-6 pt-0">
                    {/* Loading State */}
                    {isLoadingEmails ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader className="h-6 w-6" />
                      </div>
                    ) : emailsError ? (
                      <div className="text-center py-8">
                        <IconMail className="h-12 w-12 mx-auto mb-3 text-red-400" />
                        <p className="text-sm text-red-600 dark:text-red-400 mb-1">
                          Error loading emails
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {emailsError.message ||
                            "Failed to load email communications"}
                        </p>
                      </div>
                    ) : (
                      <>
                        {/* Summary Stats */}
                        <div className="grid grid-cols-3 gap-2 md:gap-4 mb-4 md:mb-6">
                          <div className="p-2.5 md:p-4 rounded-lg border bg-linear-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30 border-blue-200 dark:border-blue-800">
                            <div className="flex items-center gap-1.5 md:gap-2 mb-1 md:mb-2">
                              <IconMail className="h-3 w-3 md:h-4 md:w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                              <Label className="text-[10px] md:text-xs text-blue-700 dark:text-blue-400">
                                Total Emails
                              </Label>
                            </div>
                            <p className="text-lg md:text-2xl font-bold text-blue-800 dark:text-blue-300">
                              {emails?.length || 0}
                            </p>
                          </div>
                          <div className="p-2.5 md:p-4 rounded-lg border bg-linear-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/30 border-green-200 dark:border-green-800">
                            <div className="flex items-center gap-1.5 md:gap-2 mb-1 md:mb-2">
                              <IconArrowUp className="h-3 w-3 md:h-4 md:w-4 text-green-600 dark:text-green-400 shrink-0" />
                              <Label className="text-[10px] md:text-xs text-green-700 dark:text-green-400">
                                Sent
                              </Label>
                            </div>
                            <p className="text-lg md:text-2xl font-bold text-green-800 dark:text-green-300">
                              {emails?.filter((e) => e.direction === "outbound")
                                .length || 0}
                            </p>
                          </div>
                          <div className="p-2.5 md:p-4 rounded-lg border bg-linear-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/30 border-purple-200 dark:border-purple-800">
                            <div className="flex items-center gap-1.5 md:gap-2 mb-1 md:mb-2">
                              <IconArrowDown className="h-3 w-3 md:h-4 md:w-4 text-purple-600 dark:text-purple-400 shrink-0" />
                              <Label className="text-[10px] md:text-xs text-purple-700 dark:text-purple-400">
                                Received
                              </Label>
                            </div>
                            <p className="text-lg md:text-2xl font-bold text-purple-800 dark:text-purple-300">
                              {emails?.filter((e) => e.direction === "inbound")
                                .length || 0}
                            </p>
                          </div>
                        </div>

                        {/* Job-wise Communication Summary */}
                        <div className="space-y-3 md:space-y-4">
                          {/* Current Job */}
                          <div className="p-3 md:p-4 rounded-lg border-2 border-primary/30 bg-linear-to-br from-primary/5 to-primary/10">
                            <div className="flex items-start justify-between gap-3 md:gap-4 mb-3">
                              <div className="flex items-start gap-2 md:gap-3 flex-1 min-w-0">
                                <Avatar className="h-8 w-8 md:h-10 md:w-10 rounded-md border-2 border-primary/20 shrink-0">
                                  <AvatarImage src={candidate.clientLogo} />
                                  <AvatarFallback className="rounded-md text-xs">
                                    {candidate.clientName
                                      .split(" ")
                                      .map((n: string) => n[0])
                                      .join("")}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-xs md:text-sm mb-1 truncate">
                                    {candidate.jobTitle}
                                  </h4>
                                  <p className="text-xs md:text-sm text-muted-foreground truncate">
                                    {candidate.clientName}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="grid grid-cols-3 gap-2 md:gap-3 text-xs">
                              <div className="p-2 rounded-md bg-background/60 border">
                                <Label className="text-xs text-muted-foreground">
                                  Job ID
                                </Label>
                                <p className="font-mono mt-0.5 truncate text-xs">
                                  {candidate.jobId}
                                </p>
                              </div>
                              <div className="p-2 rounded-md bg-background/60 border">
                                <Label className="text-xs text-muted-foreground">
                                  Total Emails
                                </Label>
                                <p className="font-semibold mt-0.5 text-xs">
                                  {emails?.length || 0}
                                </p>
                              </div>
                              <div className="p-2 rounded-md bg-background/60 border">
                                <Label className="text-xs text-muted-foreground">
                                  Last Contact
                                </Label>
                                <p className="mt-0.5 truncate text-xs">
                                  {emails && emails.length > 0
                                    ? new Date(
                                        emails[0].sentAt || emails[0].createdAt
                                      ).toLocaleDateString()
                                    : "N/A"}
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full mt-3 text-xs md:text-sm"
                              onClick={() =>
                                navigate(
                                  `/dashboard/jobs/${candidate.jobId}/candidates/${candidate.id}/communication`
                                )
                              }
                            >
                              <IconMail className="h-4 w-4 mr-2" />
                              View Full Communication Details
                            </Button>
                          </div>

                          {/* Previous Jobs */}
                          {historyData
                            .filter(
                              (history) => history.jobId !== candidate.jobId
                            )
                            .map((history) => {
                              // Get email data from jobApplications
                              const jobApp =
                                candidateData.jobApplications?.find((app) => {
                                  const appJobId =
                                    typeof app.jobId === "object" &&
                                    app.jobId !== null
                                      ? (
                                          app.jobId as {
                                            _id?: string;
                                            id?: string;
                                          }
                                        )._id ||
                                        (
                                          app.jobId as {
                                            _id?: string;
                                            id?: string;
                                          }
                                        ).id
                                      : app.jobId;
                                  return appJobId === history.jobId;
                                });

                              const emailCount = jobApp
                                ? (jobApp.emailsSent || 0) +
                                  (jobApp.emailsReceived || 0)
                                : 0;
                              const sentCount = jobApp?.emailsSent || 0;
                              const receivedCount = jobApp?.emailsReceived || 0;
                              const lastEmailDate = jobApp?.lastEmailDate
                                ? new Date(
                                    jobApp.lastEmailDate
                                  ).toLocaleDateString()
                                : "N/A";

                              return (
                                <div
                                  key={history.id}
                                  className="p-4 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
                                >
                                  <div className="flex items-start justify-between gap-4 mb-3">
                                    <div className="flex items-start gap-3 flex-1 min-w-0">
                                      <Avatar className="h-10 w-10 rounded-md border shrink-0">
                                        <AvatarFallback className="rounded-md text-xs">
                                          {history.clientName
                                            .split(" ")
                                            .map((n: string) => n[0])
                                            .join("")}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div className="flex-1 min-w-0">
                                        <h4 className="font-semibold text-sm mb-1">
                                          {history.jobTitle}
                                        </h4>
                                        <p className="text-sm text-muted-foreground">
                                          {history.clientName}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-3 gap-3 text-xs">
                                    <div className="p-2 rounded-md bg-background/60 border">
                                      <Label className="text-xs text-muted-foreground">
                                        Job ID
                                      </Label>
                                      <p className="font-mono mt-0.5 truncate">
                                        {history.jobId}
                                      </p>
                                    </div>
                                    <div className="p-2 rounded-md bg-background/60 border">
                                      <Label className="text-xs text-muted-foreground">
                                        Total Emails
                                      </Label>
                                      <p className="font-semibold mt-0.5">
                                        {emailCount}
                                      </p>
                                      {emailCount > 0 && (
                                        <p className="text-muted-foreground mt-0.5 text-[10px]">
                                          {sentCount} sent, {receivedCount}{" "}
                                          received
                                        </p>
                                      )}
                                    </div>
                                    <div className="p-2 rounded-md bg-background/60 border">
                                      <Label className="text-xs text-muted-foreground">
                                        Last Contact
                                      </Label>
                                      <p className="mt-0.5 truncate">
                                        {lastEmailDate}
                                      </p>
                                    </div>
                                  </div>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full mt-3"
                                    onClick={() =>
                                      navigate(
                                        `/dashboard/jobs/${history.jobId}/candidates/${candidate.id}/communication`
                                      )
                                    }
                                  >
                                    <IconMail className="h-4 w-4 mr-2" />
                                    View Communication Details
                                  </Button>
                                </div>
                              );
                            })}
                        </div>

                        {/* Empty State */}
                        {historyData.length === 0 &&
                          (!emails || emails.length === 0) && (
                            <div className="text-center py-12">
                              <IconMail className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
                              <p className="text-sm text-muted-foreground mb-1">
                                No email communications yet
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Start communicating with this candidate to see
                                the history here
                              </p>
                            </div>
                          )}
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Quick Email Action */}
                <Card className="border-dashed">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-md bg-primary/10">
                        <IconMail className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium mb-1">Send Email</p>
                        <p className="text-sm text-muted-foreground mb-3">
                          Quickly compose and send an email to this candidate
                          from the current job context.
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // Get the first job ID from the candidate's job applications
                            const firstJobId = candidateData.jobIds?.[0];
                            let jobIdStr: string | undefined;

                            if (typeof firstJobId === "string") {
                              jobIdStr = firstJobId;
                            } else if (
                              firstJobId &&
                              typeof firstJobId === "object"
                            ) {
                              const jobIdObj = firstJobId as {
                                id?: string;
                                _id?: string;
                                toString?: () => string;
                              };
                              jobIdStr =
                                jobIdObj.id ||
                                jobIdObj._id ||
                                jobIdObj.toString?.();
                            }

                            if (jobIdStr) {
                              navigate(
                                `/dashboard/jobs/${jobIdStr}/candidates/${candidateId}/communication`
                              );
                            } else {
                              // Fallback: show error message
                            }
                          }}
                        >
                          <IconMail className="h-4 w-4 mr-2" />
                          Compose Email
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Interviews Tab - Read-only overview across all jobs */}
              <TabsContent value="interviews" className="mt-4 md:mt-6">
                <Card>
                  <CardHeader className="p-3 md:p-4 lg:p-6">
                    <CardTitle className="text-sm md:text-base flex items-center gap-2">
                      <IconCalendar className="h-4 w-4 md:h-5 md:w-5 text-primary shrink-0" />
                      Interview History Across All Jobs
                    </CardTitle>
                    <p className="text-xs md:text-sm text-muted-foreground">
                      Read-only overview of all interviews this candidate has
                      had
                    </p>
                    {candidateData?.status?.toLowerCase() === "rejected" && (
                      <div className="mt-3 p-3 bg-red-50 dark:bg-red-950/30 border-2 border-red-200 dark:border-red-800 rounded-lg">
                        <div className="flex items-start gap-2">
                          <IconX className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-semibold text-red-900 dark:text-red-100">
                              Candidate Rejected
                            </p>
                            <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                              This candidate has been rejected. Interview
                              scheduling and stage changes are disabled. Only
                              viewing past interviews and sending emails are
                              allowed.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardHeader>
                  <CardContent className="p-3 md:p-4 lg:p-6 pt-0">
                    {isLoadingInterviews ? (
                      <div className="text-center py-12">
                        <Loader size="md" text="Loading interviews..." />
                      </div>
                    ) : interviews.length === 0 ? (
                      <div className="text-center py-12">
                        <IconCalendar className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
                        <p className="text-sm text-muted-foreground">
                          No interview history found
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          This candidate hasn't interviewed with any clients yet
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2 md:space-y-3">
                        {interviews.map((interview) => {
                          const feedback =
                            interview.feedback && interview.feedback.length > 0
                              ? interview.feedback[0]
                              : null;
                          const isCompleted = interview.status === "completed";
                          const outcome = feedback?.recommendation;

                          return (
                            <div
                              key={interview.id || interview._id}
                              className={`p-2.5 md:p-3 rounded-lg border-2 transition-colors ${
                                outcome === "strong_yes"
                                  ? "bg-green-50 dark:bg-green-950/30 border-green-300 dark:border-green-700"
                                  : outcome === "no"
                                  ? "bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-700"
                                  : "bg-card hover:bg-muted/30 border-border hover:border-primary/30"
                              }`}
                            >
                              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 md:gap-3 mb-2">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                    <h4 className="font-semibold text-xs md:text-sm truncate">
                                      {interview.jobId?.title ||
                                        "Unknown Position"}
                                    </h4>
                                    <Badge
                                      variant="outline"
                                      className="text-xs shrink-0"
                                    >
                                      {interview.type.replace("_", " ")}
                                    </Badge>
                                  </div>
                                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <IconBriefcase className="h-3 w-3 shrink-0" />
                                    <span className="truncate">
                                      {interview.clientId?.companyName ||
                                        "Unknown Client"}
                                    </span>
                                  </p>
                                </div>
                                <Badge
                                  className={`text-xs shrink-0 ${
                                    isCompleted && outcome === "strong_yes"
                                      ? "bg-green-600 text-white"
                                      : isCompleted && outcome === "no"
                                      ? "bg-red-600 text-white"
                                      : interview.status === "scheduled"
                                      ? "bg-blue-600 text-white"
                                      : "bg-gray-600 text-white"
                                  }`}
                                >
                                  {interview.status}
                                </Badge>
                              </div>

                              <div className="flex flex-wrap gap-x-3 md:gap-x-4 gap-y-1 text-[10px] md:text-xs text-muted-foreground mb-2">
                                <div className="flex items-center gap-1">
                                  <IconCalendar className="h-3 w-3 shrink-0" />
                                  <span>
                                    {new Date(
                                      interview.scheduledAt
                                    ).toLocaleDateString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                    })}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <IconClockHour4 className="h-3 w-3 shrink-0" />
                                  <span>{interview.duration} min</span>
                                </div>
                                {interview.interviewerIds &&
                                  interview.interviewerIds.length > 0 && (
                                    <div className="flex items-center gap-1 min-w-0">
                                      <IconUserCheck className="h-3 w-3 shrink-0" />
                                      <span className="truncate">
                                        {interview.interviewerIds
                                          .map((i) =>
                                            `${i.firstName || ""} ${
                                              i.lastName || ""
                                            }`.trim()
                                          )
                                          .filter((n) => n)
                                          .join(", ") || "Not assigned"}
                                      </span>
                                    </div>
                                  )}
                                <div className="flex items-center gap-1 sm:ml-auto">
                                  <span className="font-mono text-muted-foreground truncate">
                                    Job ID:{" "}
                                    {typeof interview.jobId === "object"
                                      ? (
                                          interview.jobId as {
                                            _id?: string;
                                            id?: string;
                                          }
                                        )?._id ||
                                        (
                                          interview.jobId as {
                                            _id?: string;
                                            id?: string;
                                          }
                                        )?.id ||
                                        "N/A"
                                      : interview.jobId || "N/A"}
                                  </span>
                                </div>
                              </div>

                              {feedback && (
                                <div className="mt-2 pt-2 border-t">
                                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-1">
                                    <Label className="text-xs font-medium">
                                      Feedback
                                    </Label>
                                    <div className="flex items-center gap-2">
                                      {feedback.rating && (
                                        <div className="flex items-center gap-0.5">
                                          <span className="text-yellow-400 text-sm">
                                            ⭐
                                          </span>
                                          <span className="text-xs text-muted-foreground">
                                            {feedback.rating}/5
                                          </span>
                                        </div>
                                      )}
                                      {feedback.recommendation && (
                                        <Badge
                                          variant="outline"
                                          className={`text-xs ${
                                            feedback.recommendation ===
                                            "strong_yes"
                                              ? "bg-green-100 text-green-700 border-green-200"
                                              : feedback.recommendation === "no"
                                              ? "bg-red-100 text-red-700 border-red-200"
                                              : "bg-yellow-100 text-yellow-700 border-yellow-200"
                                          }`}
                                        >
                                          {feedback.recommendation.replace(
                                            "_",
                                            " "
                                          )}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                  {feedback.comments && (
                                    <p className="text-xs text-muted-foreground italic line-clamp-2">
                                      "{feedback.comments}"
                                    </p>
                                  )}
                                </div>
                              )}

                              {interview.notes && !feedback && (
                                <div className="mt-2 pt-2 border-t">
                                  <Label className="text-xs text-muted-foreground">
                                    Notes
                                  </Label>
                                  <p className="text-xs mt-1 text-muted-foreground line-clamp-2">
                                    {interview.notes}
                                  </p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* History Tab */}
              <TabsContent
                value="history"
                className="mt-4 md:mt-6 space-y-4 md:space-y-6"
              >
                {/* Career Timeline - Enhanced */}
                <Card>
                  <CardHeader className="p-3 md:p-4 lg:p-6">
                    <CardTitle className="text-sm md:text-base flex items-center gap-2">
                      <IconClockHour4 className="h-4 w-4 md:h-5 md:w-5 text-primary shrink-0" />
                      Career Timeline
                    </CardTitle>
                    <p className="text-xs md:text-sm text-muted-foreground">
                      Complete journey across all job applications with detailed
                      milestones
                    </p>
                  </CardHeader>
                  <CardContent className="p-3 md:p-4 lg:p-6 pt-0">
                    {(() => {
                      // Create comprehensive timeline events
                      type TimelineEvent = {
                        id: string;
                        date: Date;
                        type: string;
                        title: string;
                        description: string;
                        status: "success" | "error" | "warning" | "info";
                        icon: React.ComponentType<{ className?: string }>;
                        jobTitle?: string;
                        clientName?: string;
                        jobId?: string;
                        metadata?: {
                          stage?: string;
                          interviewCount?: number;
                          rating?: number;
                          recommendation?: string;
                        };
                      };

                      const timelineEvents: TimelineEvent[] = [];

                      // Add job application events
                      historyData.forEach((history) => {
                        // Application submitted
                        timelineEvents.push({
                          id: `applied-${history.id}`,
                          date: history.appliedDateRaw,
                          type: "applied",
                          title: "Application Submitted",
                          description: `Applied for ${history.jobTitle}`,
                          status: "info",
                          icon: IconFileText,
                          jobTitle: history.jobTitle,
                          clientName: history.clientName,
                          jobId: history.jobId,
                          metadata: { stage: history.stage },
                        });

                        // Final status event if not active
                        if (history.status !== "active") {
                          let statusTitle = "Status Updated";
                          let statusIcon = IconClockHour4;
                          let statusType:
                            | "success"
                            | "error"
                            | "warning"
                            | "info" = "info";

                          if (history.status === "hired") {
                            statusTitle = "Hired";
                            statusIcon = IconCircleCheckFilled;
                            statusType = "success";
                          } else if (history.status === "rejected") {
                            statusTitle = "Application Rejected";
                            statusIcon = IconUserCheck;
                            statusType = "error";
                          } else if (history.status === "offered") {
                            statusTitle = "Offer Extended";
                            statusIcon = IconUserCheck;
                            statusType = "success";
                          } else if (history.status === "withdrawn") {
                            statusTitle = "Application Withdrawn";
                            statusIcon = IconUserCheck;
                            statusType = "warning";
                          }

                          timelineEvents.push({
                            id: `status-${history.id}`,
                            date: new Date(history.lastUpdated),
                            type: history.status,
                            title: statusTitle,
                            description: `${history.jobTitle} - ${
                              history.status.charAt(0).toUpperCase() +
                              history.status.slice(1)
                            }`,
                            status: statusType,
                            icon: statusIcon,
                            jobTitle: history.jobTitle,
                            clientName: history.clientName,
                            jobId: history.jobId,
                          });
                        }
                      });

                      // Add interview events
                      interviews.forEach((interview) => {
                        const feedback = interview.feedback?.[0];
                        const isCompleted = interview.status === "completed";

                        timelineEvents.push({
                          id: `interview-${interview.id || interview._id}`,
                          date: new Date(interview.scheduledAt),
                          type: "interview",
                          title: `${interview.type.replace(
                            "_",
                            " "
                          )} Interview`,
                          description: isCompleted
                            ? `Completed interview for ${
                                interview.jobId?.title || "position"
                              }`
                            : `${
                                interview.status.charAt(0).toUpperCase() +
                                interview.status.slice(1)
                              } interview`,
                          status: isCompleted
                            ? feedback?.recommendation === "strong_yes"
                              ? "success"
                              : feedback?.recommendation === "no"
                              ? "error"
                              : "info"
                            : "warning",
                          icon: IconUserCheck,
                          jobTitle: interview.jobId?.title,
                          jobId:
                            typeof interview.jobId === "object"
                              ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                (interview.jobId as any)._id ||
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                (interview.jobId as any).id
                              : interview.jobId,
                          clientName: interview.clientId?.companyName,
                          metadata: {
                            interviewCount: 1,
                            rating: feedback?.rating,
                            recommendation: feedback?.recommendation,
                          },
                        });
                      });

                      // Sort by date (most recent first)
                      timelineEvents.sort(
                        (a, b) => b.date.getTime() - a.date.getTime()
                      );

                      if (isLoadingInterviews) {
                        return (
                          <div className="text-center py-8">
                            <Loader size="sm" text="Loading timeline..." />
                          </div>
                        );
                      }

                      if (timelineEvents.length === 0) {
                        return (
                          <div className="text-center py-12">
                            <IconClockHour4 className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
                            <p className="text-sm text-muted-foreground mb-2">
                              No activity yet
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Timeline will show: Applications, Interviews,
                              Offers, Hires, and Status Changes
                            </p>
                          </div>
                        );
                      }

                      return (
                        <div className="relative space-y-3 md:space-y-4">
                          {/* Timeline line */}
                          <div className="absolute left-3 md:left-4 top-0 bottom-0 w-0.5 bg-linear-to-b from-primary/50 via-border to-transparent"></div>

                          {timelineEvents.map((event, index) => {
                            const Icon = event.icon;
                            const isLast = index === timelineEvents.length - 1;

                            return (
                              <div
                                key={event.id}
                                className="relative pl-10 md:pl-12"
                              >
                                {/* Timeline dot */}
                                <div
                                  className={`absolute left-0 w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center border-2 ${
                                    event.status === "success"
                                      ? "bg-green-100 dark:bg-green-900/30 border-green-500"
                                      : event.status === "error"
                                      ? "bg-red-100 dark:bg-red-900/30 border-red-500"
                                      : event.status === "warning"
                                      ? "bg-yellow-100 dark:bg-yellow-900/30 border-yellow-500"
                                      : "bg-blue-100 dark:bg-blue-900/30 border-blue-500"
                                  }`}
                                >
                                  <Icon
                                    className={`h-3 w-3 md:h-4 md:w-4 ${
                                      event.status === "success"
                                        ? "text-green-600 dark:text-green-400"
                                        : event.status === "error"
                                        ? "text-red-600 dark:text-red-400"
                                        : event.status === "warning"
                                        ? "text-yellow-600 dark:text-yellow-400"
                                        : "text-blue-600 dark:text-blue-400"
                                    }`}
                                  />
                                </div>

                                {/* Event card */}
                                <div
                                  className={`rounded-lg border-2 bg-card p-2.5 md:p-4 hover:shadow-md transition-shadow ${
                                    event.status === "success"
                                      ? "border-green-200 dark:border-green-800/50"
                                      : event.status === "error"
                                      ? "border-red-200 dark:border-red-800/50"
                                      : event.status === "warning"
                                      ? "border-yellow-200 dark:border-yellow-800/50"
                                      : "border-blue-200 dark:border-blue-800/50"
                                  } ${isLast ? "" : "mb-3 md:mb-4"}`}
                                >
                                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 md:gap-4 mb-2">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                                        <h4 className="font-semibold text-xs md:text-sm">
                                          {event.title}
                                        </h4>
                                        <Badge
                                          variant={
                                            event.status === "success"
                                              ? "primary"
                                              : "secondary"
                                          }
                                          className="text-xs"
                                        >
                                          {event.type}
                                        </Badge>
                                      </div>
                                      <p className="text-xs md:text-sm text-muted-foreground">
                                        {event.description}
                                      </p>
                                    </div>
                                    <div className="flex flex-row sm:flex-col items-start gap-1 flex-wrap sm:items-end">
                                      {event.jobTitle && (
                                        <Badge
                                          variant="outline"
                                          className="text-xs shrink-0"
                                        >
                                          {event.jobTitle}
                                        </Badge>
                                      )}
                                      {event.jobId && (
                                        <span className="text-xs font-mono text-muted-foreground">
                                          Job ID: {event.jobId}
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Metadata section */}
                                  <div className="flex flex-wrap items-center gap-x-3 md:gap-x-4 gap-y-1 text-[10px] md:text-xs text-muted-foreground pt-2 border-t">
                                    {event.clientName && (
                                      <span className="flex items-center gap-1">
                                        <IconBriefcase className="h-3 w-3 shrink-0" />
                                        <span className="truncate">
                                          {event.clientName}
                                        </span>
                                      </span>
                                    )}
                                    <span className="flex items-center gap-1">
                                      <IconCalendar className="h-3 w-3 shrink-0" />
                                      <span className="hidden sm:inline">
                                        {event.date.toLocaleDateString(
                                          "en-US",
                                          {
                                            month: "short",
                                            day: "numeric",
                                            year: "numeric",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                          }
                                        )}
                                      </span>
                                      <span className="sm:hidden">
                                        {event.date.toLocaleDateString(
                                          "en-US",
                                          {
                                            month: "short",
                                            day: "numeric",
                                            year: "2-digit",
                                          }
                                        )}
                                      </span>
                                    </span>
                                    {event.metadata?.stage && (
                                      <span className="flex items-center gap-1">
                                        <IconClockHour4 className="h-3 w-3 shrink-0" />
                                        <span className="truncate">
                                          {event.metadata.stage}
                                        </span>
                                      </span>
                                    )}
                                    {event.metadata?.rating && (
                                      <span className="flex items-center gap-1">
                                        <span className="text-yellow-500">
                                          ⭐
                                        </span>
                                        {event.metadata.rating}/5
                                      </span>
                                    )}
                                    {event.jobId && (
                                      <button
                                        onClick={() =>
                                          navigate(
                                            `/dashboard/jobs/pipeline/${event.jobId}`
                                          )
                                        }
                                        className="text-primary hover:underline flex items-center gap-1 shrink-0"
                                      >
                                        <span className="hidden sm:inline">
                                          View Job →
                                        </span>
                                        <span className="sm:hidden">
                                          View →
                                        </span>
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Reassign to Job Dialog */}
        {reassignJobDialogOpen &&
          candidateData &&
          (() => {
            const candidate = candidates.find((c) => c.id === candidateData.id);
            const availableJobs = jobs.filter((job) => {
              // Filter logic:
              // - Show if candidate never applied to this job
              // - Show if candidate was rejected from this job (can be reactivated)
              // - Hide if candidate is currently active in this job
              // - Hide if candidate was hired for this job (hiring is final)
              const jobApplication = candidate?.jobApplications?.find(
                (app) => app.jobId === job.id
              );
              const isJobOpen = job.status === "open";

              if (!isJobOpen) return false;
              if (!jobApplication) return true; // Never applied - show it

              const status = jobApplication.status;
              // Show if rejected (can reactivate), hide if active or hired
              return status === "rejected";
            });

            return (
              <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg max-w-md w-full p-6">
                  <h2 className="text-lg font-semibold mb-4">
                    Apply to Another Job
                  </h2>

                  {availableJobs.length === 0 ? (
                    <p className="text-sm text-muted-foreground mb-4">
                      No available jobs to assign this candidate to. The
                      candidate may already be actively assigned to all open
                      jobs.
                    </p>
                  ) : (
                    <>
                      <p className="text-sm text-muted-foreground mb-4">
                        Select a job to assign this candidate to:
                      </p>
                      <Select
                        value={selectedJobForReassign}
                        onValueChange={setSelectedJobForReassign}
                      >
                        <SelectTrigger className="w-full mb-4">
                          <SelectValue placeholder="Select a job" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableJobs.map((job) => {
                            // Get client name
                            const clientName =
                              typeof job.clientId === "object" &&
                              job.clientId !== null
                                ? job.clientId.companyName
                                : clients.find(
                                    (client) => client.id === job.clientId
                                  )?.companyName || "Unknown Client";

                            return (
                              <SelectItem key={job.id} value={job.id}>
                                <div className="flex flex-col">
                                  <span className="font-medium">
                                    {job.title}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {clientName}
                                  </span>
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </>
                  )}

                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setReassignJobDialogOpen(false);
                        setSelectedJobForReassign("");
                      }}
                    >
                      Cancel
                    </Button>
                    {availableJobs.length > 0 && (
                      <Button
                        onClick={handleReassignJobConfirm}
                        disabled={!selectedJobForReassign}
                      >
                        Assign
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
      </div>
    </div>
  );
}
