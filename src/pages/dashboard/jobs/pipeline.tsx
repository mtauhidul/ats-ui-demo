import { JobKanbanBoard } from "@/components/job-kanban-board";
import { PipelineBuilder } from "@/components/pipeline-builder";
import { PipelineEmptyState } from "@/components/pipeline-empty-state";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import { useSidebar } from "@/components/ui/sidebar";
import { usePipelineByJobId } from "@/hooks/usePipelinesFirestore";
import { useCandidates, useJobs, usePipelines } from "@/store/hooks/index";
import type { Candidate } from "@/types/candidate";
import type { PipelineStage } from "@/types/pipeline";
import { DEFAULT_PIPELINE_TEMPLATES } from "@/types/pipeline";
import { ArrowLeft, Edit } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

export default function JobPipelinePage() {
  const navigate = useNavigate();
  const { jobId } = useParams<{ jobId: string }>();
  const kanbanContainerRef = useRef<HTMLDivElement>(null);

  // Get sidebar state for responsive layout
  const { state: sidebarState, isMobile } = useSidebar();

  // Calculate sidebar width based on reactive state
  const sidebarWidth = useMemo(() => {
    // On mobile, sidebar is overlay and doesn't affect content width
    if (isMobile) {
      return 2;
    }
    // Collapsed state: minimum width (3rem = 48px)
    if (sidebarState === "collapsed") {
      return 18;
    }
    // Expanded state: full width (16rem = 256px)
    return 298;
  }, [sidebarState, isMobile]);

  // Get write operations from Redux hooks
  const { updateJob, isLoading: jobsLoading } = useJobs();
  const { updateCandidate, updateCandidateStageOptimistic } = useCandidates();
  const {
    createPipeline,
    updatePipeline,
    currentPipeline,
    setCurrentPipeline,
  } = usePipelines();

  // Get realtime data from Firestore via Redux hooks (which use Firestore internally)
  const { jobs } = useJobs();
  const { candidates: allCandidates } = useCandidates();
  const { pipelines: allPipelines } = usePipelines();

  const job = jobs.find((j) => j.id === jobId);

  // Get user-created templates (pipelines without jobId)
  const userTemplates = useMemo(() => {
    return allPipelines.filter((p) => !p.jobId && p.isActive);
  }, [allPipelines]);

  // Get pipeline from Firestore by jobId (realtime subscription)
  const { pipeline: firestorePipeline, loading: pipelineLoading } =
    usePipelineByJobId(jobId);

  // Filter candidates for this job
  // Backend populates jobIds with full Job objects, so we need to access the id property
  const candidates = allCandidates.filter((c: Candidate) => {
    const jobIdsList = c.jobIds || [];

    const matches = jobIdsList.some(
      (
        jobIdOrObject:
          | string
          | { id?: string; _id?: string; toString?: () => string }
      ) => {
        // If it's a populated object with an id property, use that
        const idString =
          typeof jobIdOrObject === "string"
            ? jobIdOrObject
            : jobIdOrObject?.id ||
              jobIdOrObject?._id ||
              jobIdOrObject?.toString?.();

        return idString === jobId;
      }
    );

    return matches;
  });

  // State
  const [isBuilding, setIsBuilding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Sync Firestore pipeline to currentPipeline state
  useEffect(() => {
    if (!job || !jobId) return;

    // If we have a pipeline from Firestore, use it
    if (firestorePipeline && firestorePipeline.id !== currentPipeline?.id) {
      setCurrentPipeline(firestorePipeline);
    }
    // If no pipeline exists for this job, clear currentPipeline to show empty state
    else if (
      !firestorePipeline &&
      !pipelineLoading &&
      currentPipeline?.jobId !== jobId
    ) {
      setCurrentPipeline(null);
    }
  }, [
    job,
    jobId,
    firestorePipeline,
    currentPipeline?.id,
    currentPipeline?.jobId,
    setCurrentPipeline,
    pipelineLoading,
  ]);

  // Show loading state while fetching job
  if (jobsLoading && !job) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader size="lg" text="Loading job details..." />
      </div>
    );
  }

  // Show loading state while loading pipeline from Firestore
  if (job && pipelineLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader size="lg" text="Loading pipeline..." />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Job not found</h2>
          <Button onClick={() => navigate("/dashboard/jobs")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Jobs
          </Button>
        </div>
      </div>
    );
  }

  const handleCreateCustom = () => {
    setIsBuilding(true);
  };

  const handleSelectTemplate = async (templateKey: string) => {
    const template =
      DEFAULT_PIPELINE_TEMPLATES[
        templateKey as keyof typeof DEFAULT_PIPELINE_TEMPLATES
      ];
    if (template && job && jobId) {
      try {
        // Create pipeline in Firestore with jobId
        const result = await createPipeline({
          name: `${job.title} - ${template.name}`,
          description: template.description,
          type: "candidate",
          jobId, // Link pipeline to this job
          stages: template.stages.map((stage) => ({
            name: stage.name,
            description: stage.description,
            color: stage.color,
            order: stage.order,
            isActive: true,
          })),
        });

        // Update job with the new pipeline ID
        if (result.payload && "id" in result.payload) {
          const pipelineId = result.payload.id;
          await updateJob(job.id, { pipelineId });

          // Firestore realtime subscription will automatically update firestorePipeline
          // which will then update currentPipeline via useEffect
          toast.success("Pipeline created successfully!");
        } else {
          toast.error("Failed to get pipeline ID");
        }
      } catch {
        toast.error("Failed to create pipeline");
      }
    }
  };

  const handleCreatePipelineFromTemplate = async (templateId: string) => {
    const template = userTemplates.find((p) => p.id === templateId);
    if (template && job && jobId) {
      try {
        // Create a new pipeline based on the user template
        const result = await createPipeline({
          name: `${job.title} - ${template.name}`,
          description: template.description,
          type: template.type || "candidate",
          jobId, // Link pipeline to this job
          stages: template.stages.map((stage) => ({
            name: stage.name,
            description: stage.description,
            color: stage.color,
            order: stage.order,
            isActive: true,
          })),
        });

        // Update job with the new pipeline ID
        if (result.payload && "id" in result.payload) {
          const pipelineId = result.payload.id;
          await updateJob(job.id, { pipelineId });

          toast.success("Pipeline created from template!");
        } else {
          toast.error("Failed to get pipeline ID");
        }
      } catch {
        toast.error("Failed to create pipeline");
      }
    }
  };

  const handleSavePipeline = async (stages: PipelineStage[]) => {
    if (!job || !jobId) return;

    try {
      if (currentPipeline?.id) {
        // Update existing pipeline
        await updatePipeline(currentPipeline.id, {
          name: currentPipeline.name,
          description: currentPipeline.description,
          stages: stages.map((stage) => ({
            name: stage.name,
            description: stage.description,
            color: stage.color,
            order: stage.order,
            isActive: true,
          })),
        });
        toast.success("Pipeline updated successfully!");
      } else {
        // Create new custom pipeline
        const result = await createPipeline({
          name: `${job.title} Pipeline`,
          description: `Custom pipeline for ${job.title}`,
          type: "candidate",
          jobId, // Link pipeline to this job
          stages: stages.map((stage) => ({
            name: stage.name,
            description: stage.description,
            color: stage.color,
            order: stage.order,
            isActive: true,
          })),
        });

        // Update job with the new pipeline ID
        if (result.payload && "id" in result.payload) {
          const pipelineId = result.payload.id;
          await updateJob(job.id, { pipelineId });
          // Firestore realtime subscription will automatically update firestorePipeline
          toast.success("Pipeline created successfully!");
        }
      }

      setIsBuilding(false);
      setIsEditing(false);
    } catch {
      toast.error("Failed to save pipeline");
    }
  };

  const handleCandidateClick = (candidate: Candidate) => {
    // Navigate to candidate details
    navigate(`/dashboard/candidates/${candidate.id}`);
  };

  const handleStatusChange = async (
    candidateId: string,
    newStageId: string
  ) => {
    // Check if candidate is rejected
    const candidate = candidates.find((c) => c.id === candidateId);
    if (candidate && candidate.status?.toLowerCase() === "rejected") {
      toast.error("Cannot move rejected candidates between stages");
      return;
    }

    try {
      // CRITICAL: Pass jobId so backend knows which job's stage to update
      await updateCandidate(candidateId, {
        currentPipelineStageId: newStageId,
        jobId: jobId, // Pass jobId to update job-specific stage in jobApplications
      } as any);

      // Firestore will automatically update candidates in realtime
      toast.success("Candidate moved to new stage!");
    } catch {
      toast.error("Failed to move candidate");
    }
  };

  const handleStageUpdate = async (stage: PipelineStage) => {
    if (!currentPipeline) return;

    try {
      const updatedStages = currentPipeline.stages.map((s) =>
        s.id === stage.id ? stage : s
      );

      await updatePipeline(currentPipeline.id, {
        stages: updatedStages.map((s) => ({
          name: s.name,
          description: s.description,
          color: s.color,
          order: s.order,
          isActive: true,
        })),
      });
    } catch {
      toast.error("Failed to update stage");
    }
  };

  return (
    <div className="flex flex-col h-full w-full">
      {/* Header - Fixed */}
      <div className="border-b bg-card">
        <div className="px-6 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1 ">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                className="shrink-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="min-w-0 flex-1 overflow-hidden">
                <h1 className="text-xl font-bold truncate">{job.title}</h1>
                <p className="text-xs text-muted-foreground truncate">
                  {currentPipeline
                    ? "Manage your hiring pipeline"
                    : "Setup your hiring pipeline"}
                </p>
              </div>
            </div>
            {currentPipeline && !isBuilding && !isEditing && (
              <Button
                onClick={() => setIsEditing(true)}
                variant="outline"
                size="sm"
                className="shrink-0"
              >
                <Edit className="h-3.5 w-3.5 mr-1.5" />
                Edit Pipeline
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content - Scrollable */}
      <div
        className="flex-1 overflow-hidden"
        style={{ width: `calc(100vw - ${sidebarWidth}px)` }}
      >
        <div className="h-full overflow-hidden">
          {!currentPipeline && !isBuilding ? (
            <div className="px-6 py-6 overflow-auto h-full">
              <PipelineEmptyState
                onCreateCustom={handleCreateCustom}
                onSelectTemplate={handleSelectTemplate}
                onSelectPipeline={handleCreatePipelineFromTemplate}
                userTemplates={userTemplates}
              />
            </div>
          ) : isBuilding || isEditing ? (
            <div className="px-6 py-6 overflow-auto h-full">
              <div className="max-w-7xl mx-auto">
                <PipelineBuilder
                  initialStages={currentPipeline?.stages || []}
                  onSave={handleSavePipeline}
                  onCancel={() => {
                    setIsBuilding(false);
                    setIsEditing(false);
                  }}
                />
              </div>
            </div>
          ) : (
            currentPipeline &&
            jobId && (
              <div ref={kanbanContainerRef} className="h-full overflow-hidden">
                <JobKanbanBoard
                  pipeline={currentPipeline}
                  jobId={jobId}
                  candidates={candidates}
                  onCandidateClick={handleCandidateClick}
                  onStatusChange={handleStatusChange}
                  onStageUpdate={handleStageUpdate}
                />
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
