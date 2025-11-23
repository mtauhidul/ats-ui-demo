/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import * as Kanban from "@/components/ui/kanban";
import { Label } from "@/components/ui/label";
import type { Candidate } from "@/types/candidate";
import type { Pipeline, PipelineStage } from "@/types/pipeline";
import {
  Edit,
  GripVertical,
  Mail,
  MoreHorizontal,
  Phone,
  User,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

interface JobKanbanBoardProps {
  pipeline: Pipeline;
  jobId: string;
  candidates: Candidate[];
  onCandidateClick: (candidate: Candidate) => void;
  onStatusChange: (candidateId: string, newStageId: string) => void;
  onStageUpdate?: (stage: PipelineStage) => void;
  containerRef?: React.RefObject<HTMLDivElement>;
}

// Helper to format candidate name
const getCandidateName = (candidate: Candidate) => {
  const firstName = candidate.firstName || "";
  const lastName = candidate.lastName || "";
  return `${firstName} ${lastName}`.trim() || "Unknown Candidate";
};

// Helper to get candidate initials
const getCandidateInitials = (candidate: Candidate) => {
  const firstName = candidate.firstName || "";
  const lastName = candidate.lastName || "";
  const first = firstName.charAt(0).toUpperCase();
  const last = lastName.charAt(0).toUpperCase();
  return first + last || "?";
};

export function JobKanbanBoard({
  pipeline,
  jobId,
  candidates,
  onCandidateClick,
  onStatusChange,
  onStageUpdate,
}: JobKanbanBoardProps) {
  const [isEditStageDialogOpen, setIsEditStageDialogOpen] = useState(false);
  const [editingStage, setEditingStage] = useState<PipelineStage | null>(null);

  // Optimistic UI state - tracks pending moves
  const [optimisticColumns, setOptimisticColumns] = useState<Record<
    string,
    Candidate[]
  > | null>(null);

  // Track which column is being dragged over for visual feedback
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  // Ensure stages is always an array
  const stages = useMemo(() => {
    if (pipeline?.stages && Array.isArray(pipeline.stages)) {
      return pipeline.stages;
    }
    return [];
  }, [pipeline?.stages]);

  // Group candidates by stage with type conversion
  const columnData = useMemo(() => {
    // Use optimistic state if available, otherwise compute from candidates
    if (optimisticColumns) {
      return optimisticColumns;
    }

    const grouped: Record<string, Candidate[]> = {};

    // Initialize all stages
    stages.forEach((stage) => {
      grouped[stage.id] = [];
    });

    // Group candidates by their current stage FOR THIS SPECIFIC JOB
    candidates.forEach((candidate) => {
      // CRITICAL: For multi-job candidates, get the stage from jobApplications for THIS job
      const jobApplication = candidate.jobApplications?.find((app: any) => {
        const appJobId =
          typeof app.jobId === "string" ? app.jobId : app.jobId?.id;
        return appJobId === jobId;
      });

      // Use job-specific stage, fallback to global stage (for backwards compatibility)
      const candidateWithStage = candidate as {
        currentPipelineStageId?: string | { toString(): string };
        currentStage?: { id: string };
      };

      const currentStageId =
        jobApplication?.currentStage ||
        candidateWithStage.currentPipelineStageId?.toString() ||
        candidateWithStage.currentStage?.id;

      if (currentStageId && grouped[currentStageId]) {
        grouped[currentStageId].push(candidate);
      } else {
        // If no stage assigned, put in first stage
        const firstStage = stages[0];
        if (firstStage) {
          grouped[firstStage.id].push(candidate);
        }
      }
    });

    return grouped;
  }, [candidates, stages, optimisticColumns, jobId]);

  const getCandidatesForStage = useCallback(
    (stageId: string) => columnData[stageId] || [],
    [columnData]
  );

  // Listen for real-time updates and clear optimistic state when Firestore updates arrive
  useEffect(() => {
    const handleRefetch = () => {};

    window.addEventListener("refetchCandidates", handleRefetch);

    return () => {
      window.removeEventListener("refetchCandidates", handleRefetch);
    };
  }, []);

  // Don't clear optimistic state based on candidates changes
  // The API success/failure will handle clearing optimistic state
  // Firestore updates will naturally show through once optimistic state is cleared

  const handleEditStage = () => {
    if (editingStage && onStageUpdate) {
      onStageUpdate(editingStage);
      setIsEditStageDialogOpen(false);
      setEditingStage(null);
    }
  };

  // Handle column value change (when items are moved between columns or reordered)
  const handleColumnsChange = async (
    newColumns: Record<string, Candidate[]>
  ) => {
    // Get the actual current state
    const currentColumns = columnData;

    // 1. Find which candidate moved and to which stage
    let movedCandidateId: string | null = null;
    let targetStageId: string | null = null;

    Object.entries(newColumns).forEach(([stageId, stageCandidates]) => {
      const oldCandidates = currentColumns[stageId] || [];

      // Check if any new candidates were added to this stage
      stageCandidates.forEach((candidate) => {
        const wasInThisStage = oldCandidates.some((c) => c.id === candidate.id);

        if (!wasInThisStage) {
          // This candidate was moved to this stage
          movedCandidateId = candidate.id;
          targetStageId = stageId;
        }
      });
    });

    // 2. Call API and let Firestore real-time updates handle UI refresh
    if (movedCandidateId && targetStageId) {
      // Show optimistic UI update
      setOptimisticColumns(newColumns);
      
      try {
        await onStatusChange(movedCandidateId, targetStageId);
        
        // Clear optimistic state after a short delay to let Firestore sync
        setTimeout(() => {
          setOptimisticColumns(null);
        }, 800);
      } catch {
        // Revert optimistic update on error
        setOptimisticColumns(null);
        
        // Show error toast
        const toast = (await import("sonner")).toast;
        toast.error("Failed to move candidate. Please try again.");
      }
    }
  };

  // Debug: log when columnData changes
  useEffect(() => {}, [columnData, optimisticColumns]);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-1 min-h-0 overflow-x-auto px-6 py-6">
        <Kanban.Root
          value={columnData}
          onValueChange={handleColumnsChange}
          getItemValue={(item) => item.id}
          onDragOver={(event) => {
            // Highlight the column being dragged over
            if (event.over) {
              const overId = event.over.id.toString();
              // Check if it's a column (stage) or an item (candidate)
              const isColumn = stages.some((s) => s.id === overId);
              if (isColumn) {
                setDragOverColumn(overId);
              } else {
                // If over an item, find which column it belongs to
                for (const [stageId, stageCandidates] of Object.entries(
                  columnData
                )) {
                  if (stageCandidates.some((c) => c.id === overId)) {
                    setDragOverColumn(stageId);
                    break;
                  }
                }
              }
            } else {
              setDragOverColumn(null);
            }
          }}
          onDragEnd={() => {
            // Clear hover highlight when drag ends
            setDragOverColumn(null);
          }}
        >
          <Kanban.Board
            className="grid auto-rows-fr h-full"
            style={{
              gridTemplateColumns: `repeat(${stages.length}, minmax(320px, 1fr))`,
              gap: "10px",
            }}
          >
            {[...stages]
              .sort((a, b) => a.order - b.order)
              .map((stage, index) => {
                const isBeingDraggedOver = dragOverColumn === stage.id;
                return (
                  <Kanban.Column
                    key={stage.id || `stage-${index}`}
                    value={stage.id || `stage-${index}`}
                    className={`h-full flex flex-col transition-all duration-200 ${
                      isBeingDraggedOver
                        ? "border-dashed border border-primary bg-primary/5"
                        : "border border-solid border-border/40"
                    }`}
                  >
                    {/* Column Header */}
                    <div
                      className={`px-3 py-2.5 border-b border-border shrink-0 backdrop-blur-sm will-change-scroll transition-colors duration-200 ${
                        isBeingDraggedOver ? "bg-primary/10" : "bg-card/50"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <div
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: stage.color }}
                          />
                          <span className="font-semibold text-sm truncate">
                            {stage.name}
                          </span>
                          <Badge
                            variant="secondary"
                            className="pointer-events-none rounded-sm text-xs"
                          >
                            {getCandidatesForStage(stage.id).length}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1">
                          <Kanban.ColumnHandle asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                            >
                              <GripVertical className="h-4 w-4" />
                            </Button>
                          </Kanban.ColumnHandle>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                              >
                                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  setEditingStage(stage);
                                  setIsEditStageDialogOpen(true);
                                }}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Stage
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>

                    {/* Column Content */}
                    <div
                      className="flex flex-col gap-2 p-3 flex-1 overflow-y-auto will-change-scroll"
                      style={{ transform: "translateZ(0)" }}
                    >
                      {getCandidatesForStage(stage.id).length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-32 text-muted-foreground text-sm text-center">
                          <User className="h-8 w-8 mb-3 opacity-50" />
                          <div className="font-medium">No candidates yet</div>
                          <div className="text-xs mt-1">
                            Drag candidates here to get started
                          </div>
                        </div>
                      ) : (
                        getCandidatesForStage(stage.id).map(
                          (candidate, idx) => {
                            const isRejected =
                              candidate.status?.toLowerCase() === "rejected";
                            return (
                              <Kanban.Item
                                key={
                                  candidate.id ||
                                  (candidate as any)._id ||
                                  `candidate-${stage.id}-${idx}`
                                }
                                value={candidate.id || (candidate as any)._id}
                                asHandle={!isRejected}
                                asChild
                                disabled={isRejected}
                              >
                                <div
                                  className={`rounded-md border p-3 shadow-sm transition-all duration-150 will-change-transform ${
                                    isRejected
                                      ? "bg-red-50/50 border-red-200 dark:bg-red-950/20 dark:border-red-800 opacity-60 cursor-not-allowed"
                                      : "bg-card hover:shadow-lg cursor-pointer hover:border-primary/30 active:scale-[0.98]"
                                  }`}
                                  onClick={() =>
                                    !isRejected && onCandidateClick(candidate)
                                  }
                                  style={
                                    {
                                      backfaceVisibility: "hidden",
                                      WebkitBackfaceVisibility: "hidden",
                                    } as React.CSSProperties
                                  }
                                >
                                  <div className="flex flex-col gap-2.5">
                                    {/* Candidate Name with Rejected Badge */}
                                    <div className="flex items-center gap-2 min-w-0">
                                      <div
                                        className={`size-8 rounded-full flex items-center justify-center shrink-0 ${
                                          isRejected
                                            ? "bg-red-200 dark:bg-red-900"
                                            : "bg-primary/20"
                                        }`}
                                      >
                                        <span
                                          className={`text-xs font-semibold ${
                                            isRejected
                                              ? "text-red-700 dark:text-red-300"
                                              : "text-primary"
                                          }`}
                                        >
                                          {getCandidateInitials(candidate)}
                                        </span>
                                      </div>
                                      <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                                        <span className="line-clamp-1 font-medium text-sm">
                                          {getCandidateName(candidate)}
                                        </span>
                                        {isRejected && (
                                          <Badge
                                            variant="destructive"
                                            className="w-fit text-[10px] px-1.5 py-0"
                                          >
                                            Rejected
                                          </Badge>
                                        )}
                                      </div>
                                    </div>

                                    {/* Contact Info */}
                                    {(candidate.email || candidate.phone) && (
                                      <div className="flex flex-col gap-1 text-muted-foreground text-xs">
                                        {candidate.email && (
                                          <div className="flex items-center gap-1.5 truncate">
                                            <Mail className="h-3 w-3 shrink-0" />
                                            <span className="truncate">
                                              {candidate.email}
                                            </span>
                                          </div>
                                        )}
                                        {candidate.phone && (
                                          <div className="flex items-center gap-1.5">
                                            <Phone className="h-3 w-3 shrink-0" />
                                            <span>{candidate.phone}</span>
                                          </div>
                                        )}
                                      </div>
                                    )}

                                    {/* Applied Date */}
                                    {candidate.createdAt && (
                                      <div className="flex items-center justify-between text-muted-foreground text-[10px] tabular-nums mt-0.5">
                                        <span>
                                          Applied:{" "}
                                          {new Date(
                                            candidate.createdAt
                                          ).toLocaleDateString("en-US", {
                                            month: "short",
                                            day: "numeric",
                                            year: "numeric",
                                          })}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </Kanban.Item>
                            );
                          }
                        )
                      )}
                    </div>
                  </Kanban.Column>
                );
              })}
          </Kanban.Board>
          <Kanban.Overlay>
            {({ value: candidateId }) => {
              // Find the candidate being dragged
              const draggedCandidate = candidates.find(
                (c) => c.id === candidateId || (c as any)._id === candidateId
              );

              if (!draggedCandidate) {
                return (
                  <div className="size-full rounded-md bg-primary/10 backdrop-blur-sm" />
                );
              }

              return (
                <div
                  className="rounded-md border bg-card p-3 shadow-2xl cursor-grabbing opacity-90"
                  style={
                    {
                      width: "320px",
                      backfaceVisibility: "hidden",
                      WebkitBackfaceVisibility: "hidden",
                      pointerEvents: "none",
                    } as React.CSSProperties
                  }
                >
                  <div className="flex flex-col gap-2.5">
                    {/* Candidate Name */}
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="size-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                        <span className="text-xs font-semibold text-primary">
                          {getCandidateInitials(draggedCandidate)}
                        </span>
                      </div>
                      <span className="line-clamp-1 font-medium text-sm flex-1">
                        {getCandidateName(draggedCandidate)}
                      </span>
                    </div>

                    {/* Contact Info */}
                    {(draggedCandidate.email || draggedCandidate.phone) && (
                      <div className="flex flex-col gap-1 text-xs text-muted-foreground min-w-0">
                        {draggedCandidate.email && (
                          <div className="flex items-center gap-1.5 min-w-0">
                            <Mail className="h-3 w-3 shrink-0" />
                            <span className="truncate">
                              {draggedCandidate.email}
                            </span>
                          </div>
                        )}
                        {draggedCandidate.phone && (
                          <div className="flex items-center gap-1.5">
                            <Phone className="h-3 w-3 shrink-0" />
                            <span>{draggedCandidate.phone}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* AI Score */}
                    {(draggedCandidate as any).aiScore?.overallScore !==
                      undefined && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">AI Score</span>
                        <Badge
                          variant={
                            (draggedCandidate as any).aiScore.overallScore >= 80
                              ? "success"
                              : (draggedCandidate as any).aiScore
                                  .overallScore >= 60
                              ? "secondary"
                              : "outline"
                          }
                          className="text-xs"
                        >
                          {(draggedCandidate as any).aiScore.overallScore}%
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              );
            }}
          </Kanban.Overlay>
        </Kanban.Root>
      </div>

      {/* Edit Stage Dialog */}
      <Dialog
        open={isEditStageDialogOpen}
        onOpenChange={setIsEditStageDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Stage</DialogTitle>
            <DialogDescription>
              Update the stage name and color
            </DialogDescription>
          </DialogHeader>
          {editingStage && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Stage Name</Label>
                <Input
                  value={editingStage.name}
                  onChange={(e) =>
                    setEditingStage({ ...editingStage, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={editingStage.color}
                    onChange={(e) =>
                      setEditingStage({
                        ...editingStage,
                        color: e.target.value,
                      })
                    }
                    className="w-8 h-8 rounded"
                  />
                  <span className="text-sm text-muted-foreground">
                    {editingStage.color}
                  </span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditStageDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleEditStage}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
