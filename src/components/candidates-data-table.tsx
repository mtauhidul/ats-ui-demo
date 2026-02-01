import {
  IconArrowsSort,
  IconBriefcase,
  IconCheck,
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconCircleCheck,
  IconClick,
  IconClockHour4,
  IconDotsVertical,
  IconDownload,
  IconFilter,
  IconLayoutColumns,
  IconMail,
  IconSearch,
  IconUpload,
  IconUserCheck,
  IconUsers,
  IconUserX,
  IconX,
} from "@tabler/icons-react";
import { Loader } from "@/components/ui/loader";
import {
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";
import * as React from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import { z } from "zod";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { InputDialog } from "@/components/ui/input-dialog";
import { Label } from "@/components/ui/label";

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { API_BASE_URL } from "@/config/api";
import { useClients } from "@/hooks/firestore";
import { useAuth } from "@/hooks/useAuth";
import {
  useCandidates,
  useJobs,
  usePipelines,
  useTeam,
} from "@/store/hooks/index";
import type { schema } from "./data-table-schema.tsx";
import { CandidateEmailModal } from "./candidate-email-modal";
import type { Candidate } from "@/types/candidate";
import type { Job } from "@/types/job";

// Table cell viewer component for candidate name - decorated like applications table
function TableCellViewer({ 
  item, 
  searchParams 
}: { 
  item: z.infer<typeof schema>;
  searchParams?: URLSearchParams;
}) {
  // Build URL with both candidateId and jobId for specific candidacy view
  // Preserve pagination, search, and tab state in the URL
  const params = new URLSearchParams();
  
  if (item.jobIdForRow && item.jobIdForRow !== 'no-job') {
    params.set('jobId', item.jobIdForRow);
  }
  
  // Preserve current page, pageSize, search, and tab
  if (searchParams) {
    const page = searchParams.get('page');
    const pageSize = searchParams.get('pageSize');
    const search = searchParams.get('search');
    const tab = searchParams.get('tab');
    
    if (page) params.set('page', page);
    if (pageSize) params.set('pageSize', pageSize);
    if (search) params.set('search', search);
    if (tab) params.set('tab', tab);
  }
  
  const url = `/dashboard/candidates/${item.candidateId!}?${params.toString()}`;
  
  return (
    <Link
      to={url}
      className="group flex flex-col transition-all duration-200 cursor-pointer relative py-1 px-2 -mx-2 rounded-md hover:bg-primary/5 min-w-0"
    >
      <span className="font-medium text-foreground group-hover:text-primary transition-all duration-200 flex items-center gap-1.5 min-w-0 max-w-full">
        <span className="truncate">{item.header}</span>

        <IconChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transform -translate-x-1 group-hover:translate-x-0 transition-all duration-200 shrink-0" />
      </span>
      <span className="text-xs text-muted-foreground group-hover:text-primary/70 transition-colors duration-200 break-all">
        {item.email}
      </span>
    </Link>
  );
}

// Assigned team member selector component
function AssignedSelector({
  candidateId,
  initialAssignee,
  onUpdate,
  disabled = false,
  candidateStatus,
}: {
  candidateId: string | number;
  initialAssignee?: string | null;
  onUpdate?: () => void;
  disabled?: boolean;
  candidateStatus?: string;
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [selectedMember, setSelectedMember] = React.useState<string | null>(
    initialAssignee || null
  );

  // 🔥 REALTIME: Team members come from Firestore automatically
  const { teamMembers } = useTeam();
  const { updateCandidate } = useCandidates();

  // 🔒 RBAC: Check if current user is admin
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  // Debug: Log team members
  React.useEffect(() => {}, [teamMembers]);

  // Update selected member when initialAssignee changes (e.g., after data refresh)
  React.useEffect(() => {
    setSelectedMember(initialAssignee || null);
  }, [initialAssignee]);

  const handleValueChange = async (value: string) => {
    if (value === "unassign") {
      // Handle unassign
      const previousAssignee = selectedMember;
      setSelectedMember(null);

      try {
        await updateCandidate(candidateId.toString(), { assignedTo: null });
        onUpdate?.(); // Trigger parent refresh
        toast.success("Team member unassigned");
      } catch {
        toast.error("Failed to unassign team member");
        setSelectedMember(previousAssignee);
      }
    } else {
      // Find the team member by ID (value is the member ID)
      const member = teamMembers.find((m) => m.id === value);
      if (member) {
        const memberName =
          `${member.firstName} ${member.lastName}`.trim() || member.email;
        setSelectedMember(memberName);

        try {
          // Use userId (the actual user's ID), not id (the team member document ID)
          const userIdToAssign = member.userId || member.id;
          await updateCandidate(candidateId.toString(), {
            assignedTo: userIdToAssign,
          });
          onUpdate?.(); // Trigger parent refresh
          toast.success(`Assigned ${memberName} to candidate`);
        } catch {
          toast.error("Failed to assign team member");
          setSelectedMember(initialAssignee || null);
        }
      }
    }
  };

  // Get the current value for the Select component
  const currentValue = React.useMemo(() => {
    if (!selectedMember) return "unassigned";
    // Find member ID by name
    const member = teamMembers.find((m) => {
      const name = `${m.firstName} ${m.lastName}`.trim() || m.email;
      return name === selectedMember;
    });
    return member?.id || "unassigned";
  }, [selectedMember, teamMembers]);

  // 🔒 RBAC: Non-admin users see read-only view
  if (!isAdmin || disabled) {
    return (
      <div className="h-8 px-3 py-2 text-sm border rounded-md bg-muted/50 flex items-center w-full cursor-not-allowed">
        {selectedMember ||
          (candidateStatus?.toLowerCase() === "hired"
            ? "Hired"
            : candidateStatus?.toLowerCase() === "rejected"
            ? "Rejected"
            : "Not assigned")}
      </div>
    );
  }

  // Admin users get the interactive Select dropdown
  return (
    <Select
      open={isOpen}
      onOpenChange={setIsOpen}
      value={currentValue}
      onValueChange={handleValueChange}
      disabled={disabled}
    >
      <SelectTrigger className="h-8 text-sm w-full" disabled={disabled}>
        <SelectValue>{selectedMember || "Assign someone"}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        <div className="p-1">
          <div className="text-xs font-semibold text-muted-foreground px-2 py-1.5">
            Select Team Member
          </div>
          {teamMembers.length === 0 ? (
            <div className="px-2 py-6 text-center text-sm text-muted-foreground">
              No team members found
            </div>
          ) : (
            teamMembers.map((member) => {
              const memberName =
                `${member.firstName} ${member.lastName}`.trim() || member.email;
              return (
                <SelectItem
                  key={member.id}
                  value={member.id}
                  className="text-sm"
                >
                  {memberName}
                </SelectItem>
              );
            })
          )}
          {selectedMember && (
            <>
              <div className="border-t my-1" />
              <SelectItem
                value="unassign"
                className="text-sm text-destructive hover:text-destructive"
              >
                <div className="flex items-center">
                  <IconX className="h-3 w-3 mr-2" />
                  Unassign
                </div>
              </SelectItem>
            </>
          )}
        </div>
      </SelectContent>
    </Select>
  );
}

// Stage selector component for changing pipeline stages
function StageSelector({
  candidateId,
  jobIdForRow,
  currentStageId,
  currentStageName,
  onUpdate,
}: {
  candidateId: string;
  jobIdForRow: string;
  currentStageId: string;
  currentStageName: string;
  onUpdate?: () => void;
}) {
  const [isUpdating, setIsUpdating] = React.useState(false);
  const { updateCandidate } = useCandidates();
  const { pipelines } = usePipelines();

  // Get the pipeline for this job
  const jobPipeline = pipelines.find((p) => p.jobId === jobIdForRow);
  const stages = jobPipeline?.stages || [];

  // If no pipeline or stages, show read-only badge
  if (stages.length === 0) {
    return (
      <Badge variant="outline" className="text-xs">
        {currentStageName || "No Pipeline"}
      </Badge>
    );
  }

  const handleStageChange = async (newStageId: string) => {
    if (newStageId === currentStageId || isUpdating) return;

    setIsUpdating(true);
    try {
      // Update the candidate with both currentPipelineStageId and jobId
      // The backend will handle updating the specific job application's stage
      await updateCandidate(candidateId, {
        currentPipelineStageId: newStageId,
        jobId: jobIdForRow, // Tell backend which job's stage to update
      } as any);

      toast.success("Stage updated successfully");
      if (onUpdate) onUpdate();
    } catch (error) {
      toast.error("Failed to update stage");
      console.error("Stage update error:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Get color for current stage
  // The currentStageId might actually be the stage name, so we need to match by both
  const currentStage = stages.find((s) => s.id === currentStageId || s.name === currentStageId);
  const stageColor = currentStage?.color || "#6B7280";

  // Convert hex to rgba for background with opacity
  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  return (
    <Select
      value={currentStageId}
      onValueChange={handleStageChange}
      disabled={isUpdating}
    >
      <SelectTrigger 
        className="h-7 text-xs focus:ring-1 focus:ring-offset-0 w-full border-l-4"
        style={{
          borderLeftColor: stageColor,
          backgroundColor: hexToRgba(stageColor, 0.1),
        }}
      >
        <SelectValue>
          {isUpdating ? (
            <span className="flex items-center gap-1">
              <Loader size="sm" />
              Updating...
            </span>
          ) : (
            <span className="truncate font-medium">{currentStageName}</span>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {stages.map((stage) => (
          <SelectItem key={stage.id} value={stage.id} className="text-xs">
            <div className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: stage.color }}
              />
              <span className="truncate">{stage.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

const columns: ColumnDef<z.infer<typeof schema>>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
    size: 50,
    minSize: 50,
    maxSize: 50,
  },
  {
    id: "candidateName",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="hover:bg-transparent p-0"
        >
          Name
          {column.getIsSorted() === "asc" ? (
            <IconChevronDown className="ml-1 h-3 w-3 rotate-180" />
          ) : column.getIsSorted() === "desc" ? (
            <IconChevronDown className="ml-1 h-3 w-3" />
          ) : null}
        </Button>
      );
    },
    accessorFn: (row) => row.header,
    cell: ({ row }) => {
      return (
        <div className="min-w-[220px] max-w-[220px] overflow-hidden">
          <TableCellViewer item={row.original} />
        </div>
      );
    },
    enableHiding: false,
    size: 220,
    minSize: 220,
    maxSize: 220,
  },
  {
    accessorKey: "target",
    header: () => null,
    cell: () => null,
    enableHiding: true,
    enableSorting: true,
  },
  {
    accessorKey: "jobAndClient",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="hover:bg-transparent p-0"
        >
          Job & Client
          {column.getIsSorted() === "asc" ? (
            <IconChevronDown className="ml-1 h-3 w-3 rotate-180" />
          ) : column.getIsSorted() === "desc" ? (
            <IconChevronDown className="ml-1 h-3 w-3" />
          ) : null}
        </Button>
      );
    },
    cell: ({ row }) => {
      const jobTitle = row.original.jobTitle || "N/A";
      const clientName = row.original.clientName || "N/A";
      const clientLogo = row.original.clientLogo;

      return (
        <div className="min-w-60 max-w-60 overflow-hidden">
          <div className="flex flex-col gap-1.5 p-2 rounded-lg border bg-card">
            {/* Job Title on top */}
            <div className="text-xs font-semibold text-foreground truncate">
              {jobTitle}
            </div>
            {/* Client info on bottom */}
            <div className="flex items-center gap-1.5">
              {clientLogo ? (
                <Avatar className="size-5 rounded shrink-0">
                  <AvatarImage src={clientLogo} alt={clientName} />
                  <AvatarFallback className="text-[10px] rounded">
                    {clientName.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              ) : (
                <div className="size-5 rounded bg-muted flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-semibold text-muted-foreground">
                    {clientName.substring(0, 2).toUpperCase()}
                  </span>
                </div>
              )}
              <span className="text-xs text-muted-foreground truncate">
                {clientName}
              </span>
            </div>
          </div>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
    enableHiding: true,
    size: 240,
    minSize: 240,
    maxSize: 240,
  },
  {
    accessorKey: "currentStage",
    header: () => (
      <div className="text-left">Stage</div>
    ),
    cell: ({ row }) => {
      const isRejected = row.original.status?.toLowerCase() === "rejected";
      const isHired = row.original.status?.toLowerCase() === "hired";
      const isApplication = row.original.isApplication === true;

      // Don't show stage selector for pending applications
      if (isApplication) {
        return (
          <div className="min-w-[200px] max-w-[200px]">
            <Badge 
              variant="outline" 
              className="text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
            >
              Pending Review
            </Badge>
          </div>
        );
      }

      // currentStage can be either a string or an object { id, name, color, order }
      const currentStage = row.original.currentStage as
        | string
        | { id?: string; name?: string; color?: string }
        | undefined;
      const stageName =
        typeof currentStage === "string"
          ? currentStage
          : currentStage?.name || "Not Started";
      const stageId = 
        typeof currentStage === "string"
          ? currentStage
          : currentStage?.id || "";

      // For rejected/hired, show static badge
      if (isRejected || isHired) {
        const displayText = isRejected ? "Rejected" : "Hired";
        const colorClass = isRejected
          ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400 border-red-200"
          : "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400 border-green-200";
        
        return (
          <div className="min-w-[200px] max-w-[200px]">
            <Badge className={`text-xs border ${colorClass}`}>
              {displayText}
            </Badge>
          </div>
        );
      }

      return (
        <div className="min-w-[200px] max-w-[200px]">
          <StageSelector
            candidateId={row.original.candidateId!}
            jobIdForRow={row.original.jobIdForRow as string}
            currentStageId={stageId}
            currentStageName={stageName}
            onUpdate={() => {
              window.dispatchEvent(new CustomEvent("refetchCandidates"));
            }}
          />
        </div>
      );
    },
    filterFn: (row, _id, value) => {
      return value.includes(row.original.dateApplied);
    },
    enableHiding: true,
    size: 200,
    minSize: 200,
    maxSize: 200,
  },
  {
    accessorKey: "dateApplied",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="hover:bg-transparent p-0"
      >
        Applied Date
        {column.getIsSorted() === "asc" ? (
          <IconChevronDown className="ml-1 h-3 w-3 rotate-180" />
        ) : column.getIsSorted() === "desc" ? (
          <IconChevronDown className="ml-1 h-3 w-3" />
        ) : null}
      </Button>
    ),
    cell: ({ row }) => {
      const dateApplied = row.original.dateApplied;
      const source = row.original.source;
      let displayDate = "N/A";

      if (dateApplied) {
        try {
          const date = new Date(dateApplied);
          displayDate = date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          });
        } catch {
          displayDate = "Invalid Date";
        }
      }

      // Determine icon and tooltip based on source
      let SourceIcon = IconClick;
      let tooltipText = "Direct Apply";
      let iconColor = "text-blue-500";

      if (source === "email_automation" || source === "email") {
        SourceIcon = IconMail;
        tooltipText = "Applied via Email";
        iconColor = "text-green-500";
      } else if (source === "manual") {
        SourceIcon = IconUpload;
        tooltipText = "Manually Uploaded";
        iconColor = "text-orange-500";
      } else if (source === "direct_apply" || source === "direct_application") {
        SourceIcon = IconClick;
        tooltipText = "Direct Apply";
        iconColor = "text-blue-500";
      }

      return (
        <div className="min-w-[95px] max-w-[95px] overflow-hidden">
          <div className="flex items-center gap-1.5">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="cursor-help">
                    <SourceIcon className={`h-3.5 w-3.5 ${iconColor}`} />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{tooltipText}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <span className="text-xs text-muted-foreground truncate">{displayDate}</span>
          </div>
        </div>
      );
    },
    enableHiding: true,
    size: 95,
    minSize: 95,
    maxSize: 95,
  },
  {
    id: "actions",
    cell: () => null,
    enableHiding: false,
    size: 180,
    minSize: 180,
    maxSize: 180,
  },
];

// Row actions column
const createActionsColumn = (handlers: {
  onHire: (id: string | number) => void;
  onReject: (id: string | number) => void;
  onAssignTeam: (id: string | number) => void;
  onDownloadResume: (id: string | number) => void;
  onReassignJob: (id: string | number) => void;
  onDelete: (id: string | number) => void;
  onApprove: (id: string | number) => void;
  onRejectApplication: (id: string | number) => void;
  onEmail: (id: string | number) => void;
}): ColumnDef<z.infer<typeof schema>> => ({
  id: "actions",
  cell: ({ row }) => {
    const isRejected = row.original.status?.toLowerCase() === "rejected";
    const isHired = row.original.status?.toLowerCase() === "hired";
    const isApplication = row.original.isApplication === true;
    const isPending = row.original.applicationStatus === "pending";

    return (
      <div className="min-w-[180px] flex items-center gap-1.5 justify-start">
        {/* Prominent Approve & Email Button - Only for pending applications */}
        {isApplication && isPending && (
          <Button
            variant="primary"
            size="sm"
            className="h-8 px-3 bg-green-600 hover:bg-green-700 text-white font-medium shadow-sm"
            onClick={() => handlers.onApprove(row.original.candidateId!)}
          >
            <IconCircleCheck className="h-3.5 w-3.5 mr-1.5" />
            Approve & Email
          </Button>
        )}
        
        {/* Prominent Email Button - Only show for actual candidates (not applications) */}
        {!isApplication && (
          <Button
            variant="primary"
            size="sm"
            className="h-8 px-3 bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm"
            onClick={() => handlers.onEmail(row.original.candidateId!)}
          >
            <IconMail className="h-3.5 w-3.5 mr-1.5" />
            Email Candidate
          </Button>
        )}
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="data-[state=open]:bg-muted text-foreground hover:text-foreground hover:bg-muted/50 flex size-8 px-0"
              size="icon"
            >
              <IconDotsVertical className="h-5 w-5" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {isApplication && isPending ? (
              <>
                <DropdownMenuItem
                  onClick={() => handlers.onApprove(row.original.candidateId!)}
                  className="text-green-600 dark:text-green-400"
                >
                  <IconCircleCheck className="h-3 w-3 mr-2" />
                  <div className="flex flex-col">
                    <span>Approve & Email Candidate</span>
                    <span className="text-xs text-muted-foreground font-normal">Review and send welcome email</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handlers.onRejectApplication(row.original.candidateId!)}
                  className="text-red-600 dark:text-red-400"
                >
                  <IconX className="h-3 w-3 mr-2" />
                  Reject Application
                </DropdownMenuItem>
              </>
            ) : (
              <>
                <DropdownMenuItem
                  onClick={() => handlers.onHire(row.original.candidateId!)}
                  disabled={isHired}
                  className={
                    isRejected
                      ? "text-amber-600 dark:text-amber-400"
                      : isHired
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }
                >
                  <IconCheck
                    className={`h-3 w-3 mr-2 ${
                      isRejected ? "text-amber-600" : "text-green-600"
                    }`}
                  />
                  {isRejected
                    ? "Hire (Was Rejected)"
                    : isHired
                    ? "Already Hired"
                    : "Mark as Hired"}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handlers.onReject(row.original.candidateId!)}
                  disabled={isRejected || isHired}
                  className={isHired ? "opacity-50 cursor-not-allowed" : ""}
                >
                  <IconX className="h-3 w-3 mr-2 text-red-600" />
                  {isHired ? "Cannot Reject (Hired)" : "Reject"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handlers.onEmail(row.original.candidateId!)}
                >
                  <IconMail className="h-3 w-3 mr-2" />
                  Email Candidate
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handlers.onReassignJob(row.original.candidateId!)}
                >
                  <IconBriefcase className="h-3 w-3 mr-2" />
                  Reassign to another Job
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => handlers.onDelete(row.original.candidateId!)}
                >
                  Delete Candidate
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  },
  size: 100,
  minSize: 100,
  maxSize: 100,
});

export function CandidatesDataTable({
  data: initialData,
  onDeleteCandidate,
  searchParams,
  setSearchParams,
}: {
  data: z.infer<typeof schema>[];
  onDeleteCandidate?: (candidateId: string) => void;
  searchParams?: URLSearchParams;
  setSearchParams?: (params: URLSearchParams, options?: { replace?: boolean }) => void;
}) {
  const [data, setData] = React.useState(() => initialData);
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({ target: false });
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "target", desc: true }, // Default: sort by newest first (Date Applied - Newest)
  ]);
  
  // Initialize pagination from URL params or default
  const initialPage = searchParams ? parseInt(searchParams.get("page") || "1") - 1 : 0;
  const initialPageSize = searchParams ? parseInt(searchParams.get("pageSize") || "10") : 10;
  const initialSearch = searchParams ? searchParams.get("search") || "" : "";
  
  const [pagination, setPagination] = React.useState({
    pageIndex: initialPage,
    pageSize: initialPageSize,
  });
  const [globalFilter, setGlobalFilter] = React.useState(initialSearch);

  // 🔥 REALTIME: Get team members for assignee name lookup and candidate operations
  const { teamMembers } = useTeam();
  const { updateCandidate, candidates } = useCandidates();
  const { jobs } = useJobs();
  const { data: clients } = useClients();
  const { pipelines } = usePipelines();

  // Dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [candidateToDelete, setCandidateToDelete] = React.useState<{
    id: string | number;
    candidateId?: string;
    jobId?: string;
  } | null>(null);
  const [assignTeamDialogOpen, setAssignTeamDialogOpen] = React.useState(false);
  const [bulkAssignTeamDialogOpen, setBulkAssignTeamDialogOpen] =
    React.useState(false);
  const [bulkAssignSelectedMember, setBulkAssignSelectedMember] =
    React.useState<string>("");
  const [candidateIdForAssign, setCandidateIdForAssign] = React.useState<
    string | number | null
  >(null);
  const [hireConfirmDialogOpen, setHireConfirmDialogOpen] =
    React.useState(false);
  const [candidateToHire, setCandidateToHire] = React.useState<{
    id: string | number;
    candidateId?: string;
    wasRejected?: boolean;
  } | null>(null);
  const [reassignJobDialogOpen, setReassignJobDialogOpen] =
    React.useState(false);
  const [candidateToReassign, setCandidateToReassign] = React.useState<{
    id: string | number;
    candidateId?: string;
  } | null>(null);
  const [selectedJobForReassign, setSelectedJobForReassign] =
    React.useState<string>("");

  // Email modal state
  const [emailModalOpen, setEmailModalOpen] = React.useState(false);
  const [selectedCandidateForEmail, setSelectedCandidateForEmail] = React.useState<{
    candidate: typeof candidates[0] | null;
    job: typeof jobs[0] | null;
  } | null>(null);

  // Sync local data state with prop changes (important for when candidates are loaded/updated)
  // Use a timestamp to prevent resets immediately after manual updates
  const lastManualUpdateRef = React.useRef<number>(0);
  
  React.useEffect(() => {
    // If we just did a manual update in the last 2 seconds, don't reset from props
    // This gives time for the parent to refetch and stabilize
    const timeSinceManualUpdate = Date.now() - lastManualUpdateRef.current;
    if (timeSinceManualUpdate < 2000) {
      return;
    }
    
    // Otherwise, sync with parent data
    setData(initialData);
  }, [initialData]);
  
  // Helper to update data and mark as manual update
  const updateDataManually = (updater: (prev: typeof initialData) => typeof initialData) => {
    lastManualUpdateRef.current = Date.now();
    setData(updater);
  };
  
  // Sync URL params when pagination changes
  React.useEffect(() => {
    if (setSearchParams && searchParams) {
      const newParams = new URLSearchParams(searchParams);
      newParams.set("page", (pagination.pageIndex + 1).toString());
      newParams.set("pageSize", pagination.pageSize.toString());
      setSearchParams(newParams, { replace: true });
    }
  }, [pagination.pageIndex, pagination.pageSize]);
  
  // Sync URL params when search changes
  React.useEffect(() => {
    if (setSearchParams && searchParams) {
      const newParams = new URLSearchParams(searchParams);
      if (globalFilter) {
        newParams.set("search", globalFilter);
      } else {
        newParams.delete("search");
      }
      setSearchParams(newParams, { replace: true });
    }
  }, [globalFilter]);

  // Bulk action handlers
  const handleBulkHire = async () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const selectedIds = selectedRows.map((r) => r.original.id);

    try {
      // Optimistic update
      setData((prevData) =>
        prevData.map((item) =>
          selectedIds.includes(item.id) ? { ...item, status: "Hired" } : item
        )
      );

      // Update all in Firestore
      const updatePromises = selectedRows
        .filter((r) => r.original.candidateId)
        .map((r) =>
          updateCandidate(r.original.candidateId!, { status: "hired" })
        );

      await Promise.all(updatePromises);
      toast.success(`${selectedRows.length} candidates marked as hired`);
      table.resetRowSelection();
    } catch {
      toast.error("Failed to update some candidates");
      setData(initialData);
    }
  };

  const handleBulkReject = async () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const selectedIds = selectedRows.map((r) => r.original.id);

    try {
      // Optimistic update
      setData((prevData) =>
        prevData.map((item) =>
          selectedIds.includes(item.id) ? { ...item, status: "Rejected" } : item
        )
      );

      // Update all in Firestore
      const updatePromises = selectedRows
        .filter((r) => r.original.candidateId)
        .map((r) =>
          updateCandidate(r.original.candidateId!, { status: "rejected" })
        );

      await Promise.all(updatePromises);
      toast.success(`${selectedRows.length} candidates rejected`);
      table.resetRowSelection();
    } catch {
      toast.error("Failed to update some candidates");
      setData(initialData);
    }
  };

  const handleBulkAssignTeam = () => {
    setBulkAssignSelectedMember("");
    setBulkAssignTeamDialogOpen(true);
  };

  const handleBulkAssignTeamConfirm = async () => {
    if (!bulkAssignSelectedMember) {
      toast.error("Please select a team member");
      return;
    }

    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const selectedIds = selectedRows.map((r) => r.original.id);

    try {
      // Find team member by ID
      const member = teamMembers.find((m) => m.id === bulkAssignSelectedMember);

      if (!member) {
        toast.error("Team member not found");
        return;
      }

      const teamMemberName = `${member.firstName} ${member.lastName}`.trim();

      // Optimistic update
      setData((prevData) =>
        prevData.map((item) =>
          selectedIds.includes(item.id)
            ? { ...item, reviewer: teamMemberName }
            : item
        )
      );

      // Update all in Firestore
      const updatePromises = selectedRows
        .filter((r) => r.original.candidateId)
        .map((r) =>
          updateCandidate(r.original.candidateId!, {
            assignedTo: member.userId || member.id,
          })
        );

      await Promise.all(updatePromises);
      toast.success(
        `${selectedRows.length} candidates assigned to ${teamMemberName}`
      );
      table.resetRowSelection();
      setBulkAssignTeamDialogOpen(false);
      setBulkAssignSelectedMember("");
    } catch {
      toast.error("Failed to assign some candidates");
      setData(initialData);
    }
  };

  const handleBulkExport = () => {
    const selectedData = table
      .getFilteredSelectedRowModel()
      .rows.map((r) => r.original);
    toast.success(`Exporting ${selectedData.length} candidates`);
  };

  // Individual action handlers
  const handleHire = async (id: string | number) => {
    const candidate = data.find((item) => item.id === id);
    if (!candidate?.candidateId) {
      toast.error("Candidate ID not found");
      return;
    }

    // Check if candidate was previously rejected
    const wasRejected = candidate.status.toLowerCase() === "rejected";

    if (wasRejected) {
      // Show confirmation dialog for previously rejected candidates
      setCandidateToHire({
        id,
        candidateId: candidate.candidateId,
        wasRejected: true,
      });
      setHireConfirmDialogOpen(true);
      return;
    }

    // If not rejected, proceed directly
    await performHire(id, candidate.candidateId);
  };

  const performHire = async (id: string | number, candidateId: string) => {
    try {
      // Optimistic update
      setData((prevData) =>
        prevData.map((item) =>
          item.id === id ? { ...item, status: "hired" } : item
        )
      );

      // Update in Firestore
      await updateCandidate(candidateId, { status: "hired" });
      toast.success("Candidate marked as hired");
    } catch {
      toast.error("Failed to update candidate status");
      // Revert optimistic update on error
      setData(initialData);
    }
  };

  const handleHireConfirm = async () => {
    if (!candidateToHire) return;

    await performHire(candidateToHire.id, candidateToHire.candidateId!);
    setHireConfirmDialogOpen(false);
    setCandidateToHire(null);
  };

  const handleReject = async (id: string | number) => {
    try {
      const candidate = data.find((item) => item.id === id);
      if (!candidate?.candidateId) {
        toast.error("Candidate ID not found");
        return;
      }

      const jobId = candidate.jobIdDisplay;
      if (!jobId || jobId === "N/A") {
        toast.error("Job ID not found for this candidate");
        return;
      }

      // Optimistic update - mark as rejected in UI
      setData((prevData) =>
        prevData.map((item) =>
          item.id === id ? { ...item, status: "rejected" } : item
        )
      );

      // Update candidate status to rejected in Firestore
      // Note: The backend will handle updating the jobApplications array status for this specific job
      await updateCandidate(candidate.candidateId, {
        status: "rejected",
        lastStatusChange: new Date().toISOString(),
        // Pass the jobId so backend can update the specific job application
        rejectedJobId: jobId,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      toast.success("Candidate marked as rejected");
    } catch {
      toast.error("Failed to reject candidate");
      // Revert optimistic update on error
      setData(initialData);
    }
  };

  const handleAssignTeam = (id: string | number) => {
    setCandidateIdForAssign(id);
    setAssignTeamDialogOpen(true);
  };

  const handleAssignTeamConfirm = async (teamMember: string) => {
    if (!candidateIdForAssign) return;

    try {
      const candidate = data.find((item) => item.id === candidateIdForAssign);
      if (!candidate?.candidateId) {
        toast.error("Candidate ID not found");
        return;
      }

      // Find team member ID from name
      const member = teamMembers.find(
        (m) => `${m.firstName} ${m.lastName}`.trim() === teamMember
      );

      if (!member) {
        toast.error("Team member not found");
        return;
      }

      // Optimistic update
      setData((prevData) =>
        prevData.map((item) =>
          item.id === candidateIdForAssign
            ? { ...item, reviewer: teamMember }
            : item
        )
      );

      // Update in Firestore - assignedTo should store the user ID
      await updateCandidate(candidate.candidateId, {
        assignedTo: member.userId || member.id,
      });
      toast.success(`Assigned to ${teamMember}`);
    } catch {
      toast.error("Failed to assign team member");
      // Revert optimistic update on error
      setData(initialData);
    }
  };

  const handleDownloadResume = (id: string | number) => {
    const candidate = data.find((item) => item.id === id);

    // Check for resume URL first (Firestore field)
    if (candidate?.resumeUrl) {
      window.open(candidate.resumeUrl, "_blank");
      toast.success("Opening resume...");
      return;
    }

    // Fallback to filename
    if (candidate?.resumeFilename) {
      const link = document.createElement("a");
      link.href = `/uploads/resumes/${candidate.resumeFilename}`;
      link.download = candidate.resumeFilename;
      link.click();
      toast.success("Downloading resume...");
    } else {
      toast.error("No resume file available");
    }
  };

  const handleDelete = (id: string | number) => {
    // Try to find by row id first
    let rowData = data.find((item) => item.id === id);
    
    // If not found, the id might be a candidateId directly, try finding by candidateId
    if (!rowData) {
      rowData = data.find((item) => item.candidateId === id);
    }
    
    setCandidateToDelete({
      id,
      candidateId: rowData?.candidateId || (typeof id === 'string' ? id : undefined), // Fallback to id if it's the candidateId
      jobId: rowData?.jobIdDisplay, // Store the job ID for this specific application
    });
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (candidateToDelete) {
      // Check if this is an application
      const rowData = data.find((item) => item.id === candidateToDelete.id);
      const isApplication = rowData && "isApplication" in rowData && rowData.isApplication;

      if (isApplication) {
        // Delete application using API
        try {
          const response = await fetch(`${API_BASE_URL}/applications/${candidateToDelete.id}`, {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${localStorage.getItem("ats_access_token")}`,
            },
          });

          if (!response.ok) {
            throw new Error("Failed to delete application");
          }

          toast.success("Application deleted");
          setDeleteDialogOpen(false);
          setCandidateToDelete(null);
          
          // Remove from local state
          setData((prevData) =>
            prevData.filter((item) => item.id !== candidateToDelete.id)
          );
        } catch (error) {
          toast.error("Failed to delete application");
          console.error("Delete error:", error);
        }
      } else if (candidateToDelete.candidateId) {
        try {
          // Find the full candidate data
          const candidate = candidates.find(
            (c) => c.id === candidateToDelete.candidateId
          );

          if (!candidate) {
            toast.error("Candidate not found");
            return;
          }

          const jobId = candidateToDelete.jobId;

          // If jobId exists, remove only this job application
          if (jobId && jobId !== "N/A") {
            const updatedJobIds = (candidate.jobIds || []).filter(
              (jid: string | { id: string }) => {
                const id = typeof jid === "string" ? jid : jid?.id;
                return id !== jobId;
              }
            );

            const updatedJobApplications = (
              candidate.jobApplications || []
            ).filter((app) => app.jobId !== jobId);

            // If this was the last job, delete the entire candidate
            if (updatedJobIds.length === 0) {
              if (onDeleteCandidate) {
                onDeleteCandidate(candidateToDelete.candidateId);
              }
              toast.success("Candidate removed (no more active jobs)");
            } else {
              // Update candidate with remaining jobs
              await updateCandidate(candidateToDelete.candidateId, {
                jobIds: updatedJobIds,
                jobApplications: updatedJobApplications,
              });

              // Firestore will automatically update via real-time subscription
              // Force immediate local state update for better UX
              setData((prevData) =>
                prevData.filter((item) => item.id !== candidateToDelete.id)
              );

              toast.success("Removed candidate from this job");
            }
          } else {
            // No specific job, delete entire candidate
            if (onDeleteCandidate) {
              await onDeleteCandidate(candidateToDelete.candidateId);
            }
          }

          setDeleteDialogOpen(false);
          setCandidateToDelete(null);
        } catch (error) {
          toast.error("Failed to delete candidate");
          console.error("Delete error:", error);
        }
      } else {
        // Fallback to local state update if no callback provided
        setData((prevData) =>
          prevData.filter((item) => item.id !== candidateToDelete.id)
        );
      }
    }
  };

  const handleReassignJob = (id: string | number) => {
    const candidate = data.find((item) => item.id === id);
    setCandidateToReassign({ id, candidateId: candidate?.candidateId });
    setSelectedJobForReassign("");
    setReassignJobDialogOpen(true);
  };

  const handleEmail = (id: string | number) => {
    const rowData = data.find((item) => item.candidateId === id);
    
    if (!rowData) {
      toast.error("Row data not found");
      return;
    }

    // Find the actual candidate from candidates store
    const candidate = candidates.find((c) => c.id === id);
    
    if (!candidate) {
      toast.error("Candidate not found");
      return;
    }

    // Get the job - handle both string and object types
    let job = null;
    const rowDataTyped = rowData as { jobIdForRow?: string; jobId?: string };
    const jobIdToFind = rowDataTyped.jobIdForRow || rowDataTyped.jobId;
    
    if (jobIdToFind) {
      if (typeof jobIdToFind === "string") {
        job = jobs.find((j) => j.id === jobIdToFind);
      } else if (typeof jobIdToFind === "object" && jobIdToFind !== null) {
        const jobId = (jobIdToFind as { id?: string })?.id;
        if (jobId) {
          job = jobs.find((j) => j.id === jobId);
        }
      }
    }

    // If job still not found, try to get from candidate's jobs array
    const candidateJobs = (candidate as { jobs?: unknown[] }).jobs;
    if (!job && candidateJobs && Array.isArray(candidateJobs) && candidateJobs.length > 0) {
      const firstJobId = typeof candidateJobs[0] === "string" 
        ? candidateJobs[0] 
        : (candidateJobs[0] as { id?: string })?.id;
      if (firstJobId) {
        job = jobs.find((j) => j.id === firstJobId);
      }
    }

    if (!job) {
      toast.error("No job associated with this candidate");
      return;
    }

    setSelectedCandidateForEmail({ candidate, job });
    setEmailModalOpen(true);
  };

  const handleReassignJobConfirm = async () => {
    if (!candidateToReassign?.candidateId || !selectedJobForReassign) return;

    try {
      // Find the candidate and job
      const candidate = candidates.find(
        (c) => c.id === candidateToReassign.candidateId
      );
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

      if (existingJobApp) {
        // Candidate was previously assigned to this job (rejected/hired) - reactivate
        // Get the job's pipeline and first stage
        const jobPipeline = pipelines.find(
          (p) => p.jobId === selectedJobForReassign
        );
        const firstStageId = jobPipeline?.stages?.[0]?.id;

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
        // New assignment - get the job's pipeline and first stage
        const jobPipeline = pipelines.find(
          (p) => p.jobId === selectedJobForReassign
        );
        const firstStageId = jobPipeline?.stages?.[0]?.id;

        const newJobApplication = {
          jobId: selectedJobForReassign,
          status: "active" as const,
          appliedAt: new Date(),
          currentStage: firstStageId || undefined, // Use first stage of pipeline if exists
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
      await updateCandidate(candidateToReassign.candidateId, {
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
      setCandidateToReassign(null);
      setSelectedJobForReassign("");
    } catch {
      toast.error("Failed to reassign candidate");
    }
  };

  // Handle application approval
  const [approveModalOpen, setApproveModalOpen] = React.useState(false);
  const [applicationToApprove, setApplicationToApprove] = React.useState<string | null>(null);
  const [selectedJobForApproval, setSelectedJobForApproval] = React.useState<string>("");
  const [isApproving, setIsApproving] = React.useState(false);
  const [sendWelcomeEmail, setSendWelcomeEmail] = React.useState(true); // Default to true
  const [newlyCreatedCandidate, setNewlyCreatedCandidate] = React.useState<{ candidate: Candidate; job: Job } | null>(null);

  const handleApprove = (id: string | number) => {
    setApplicationToApprove(String(id));
    setApproveModalOpen(true);
    
    // Auto-select job if application has a jobId
    const application = data.find((item) => item.id === id);
    if (application?.jobIdDisplay && application.jobIdDisplay !== "N/A") {
      setSelectedJobForApproval(application.jobIdDisplay);
    } else {
      setSelectedJobForApproval("");
    }
  };

  const handleApproveConfirm = async (jobId: string) => {
    if (!applicationToApprove || isApproving) return;

    setIsApproving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/applications/${applicationToApprove}/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("ats_access_token")}`,
        },
        body: JSON.stringify({ jobId }),
      });

      if (!response.ok) {
        throw new Error("Failed to approve application");
      }

      const result = await response.json();
      const candidateId = result.data?.candidateId || result.data?.id;

      toast.success("Application approved and candidate created");
      
      // Update local state to mark as approved instead of removing
      // This prevents pagination reset
      updateDataManually((prevData) =>
        prevData.map((item) =>
          item.id === applicationToApprove
            ? { ...item, status: "In Process", applicationStatus: "approved", isApplication: false }
            : item
        ).filter((item) => !(item.id === applicationToApprove && item.isApplication))
      );

      // If user wants to send welcome email, open email modal with new candidate
      if (sendWelcomeEmail && candidateId) {
        // Fetch the newly created candidate
        try {
          const candidateResponse = await fetch(`${API_BASE_URL}/candidates/${candidateId}`, {
            headers: {
              "Authorization": `Bearer ${localStorage.getItem("ats_access_token")}`,
            },
          });

          if (candidateResponse.ok) {
            const candidateData = await candidateResponse.json();
            const job = jobs.find((j) => j.id === jobId);
            
            if (job) {
              // Close approval modal first
              setApproveModalOpen(false);
              setApplicationToApprove(null);
              setSelectedJobForApproval("");
              setSendWelcomeEmail(true); // Reset for next time
              
              // Store candidate data and open email modal
              setNewlyCreatedCandidate({ candidate: candidateData.data, job });
              
              // Small delay to ensure modal transition is smooth
              setTimeout(() => {
                setEmailModalOpen(true);
                toast.info("Welcome email composer opened");
              }, 300);
              
              return; // Exit early to avoid closing modal twice
            }
          }
        } catch (error) {
          console.error("Failed to fetch candidate for email:", error);
          toast.error("Candidate created but couldn't open email composer");
        }
      }
      
      // Close modal if not sending email or on error
      setApproveModalOpen(false);
      setApplicationToApprove(null);
      setSelectedJobForApproval("");
      setSendWelcomeEmail(true); // Reset for next time
    } catch (error) {
      toast.error("Failed to approve application");
      console.error(error);
    } finally {
      setIsApproving(false);
    }
  };

  // Handle application rejection
  const [rejectApplicationDialogOpen, setRejectApplicationDialogOpen] = React.useState(false);
  const [applicationToReject, setApplicationToReject] = React.useState<string | null>(null);

  const handleRejectApplication = (id: string | number) => {
    setApplicationToReject(String(id));
    setRejectApplicationDialogOpen(true);
  };

  const handleRejectApplicationConfirm = async () => {
    if (!applicationToReject) return;

    try {
      const response = await fetch(`${API_BASE_URL}/applications/${applicationToReject}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("ats_access_token")}`,
        },
        body: JSON.stringify({ status: "rejected" }),
      });

      if (!response.ok) {
        throw new Error("Failed to reject application");
      }

      toast.success("Application rejected");
      setRejectApplicationDialogOpen(false);
      setApplicationToReject(null);
      
      // Update local state - filter out rejected application
      updateDataManually((prevData) =>
        prevData.filter((item) => item.id !== applicationToReject)
      );
    } catch (error) {
      toast.error("Failed to reject application");
      console.error(error);
    }
  };

  const columnsWithActions = React.useMemo(() => {
    // Clone columns and update columns that need dynamic data
    const baseColumns = columns.slice(0, -1).map((col) => {
      // Update candidateName column to pass searchParams
      if ("accessorKey" in col && col.accessorKey === "candidateName") {
        return {
          ...col,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          cell: ({ row }: { row: any }) => (
            <div className="min-w-[220px] max-w-[220px] overflow-hidden">
              <TableCellViewer item={row.original} searchParams={searchParams} />
            </div>
          ),
        };
      }
      
      // Update "Assigned" column to use team members for name lookup
      if ("accessorKey" in col && col.accessorKey === "reviewer") {
        return {
          ...col,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          cell: ({ row }: { row: any }) => {
            const assignedTo = row.original.assignedTo as
              | string
              | {
                  id?: string;
                  _id?: string;
                  firstName?: string;
                  lastName?: string;
                  email?: string;
                }
              | null
              | undefined;
            let assignedName: string | null = null;

            if (assignedTo) {
              if (typeof assignedTo === "object") {
                // Populated user object from backend
                assignedName =
                  `${assignedTo.firstName || ""} ${
                    assignedTo.lastName || ""
                  }`.trim() ||
                  assignedTo.email ||
                  null;
              } else if (typeof assignedTo === "string") {
                // User ID - look up in team members
                const member = teamMembers.find(
                  (m) => m.userId === assignedTo || m.id === assignedTo
                );
                if (member) {
                  assignedName =
                    `${member.firstName} ${member.lastName}`.trim() ||
                    member.email ||
                    null;
                }
              }
            }

            return (
              <div className="min-w-40 max-w-40 overflow-hidden">
                <AssignedSelector
                  candidateId={row.original.candidateId}
                  initialAssignee={assignedName}
                  onUpdate={() => {
                    window.dispatchEvent(new CustomEvent("refetchCandidates"));
                  }}
                />
              </div>
            );
          },
        };
      }
      return col;
    });

    const actionsColumn = createActionsColumn({
      onHire: handleHire,
      onReject: handleReject,
      onAssignTeam: handleAssignTeam,
      onDownloadResume: handleDownloadResume,
      onReassignJob: handleReassignJob,
      onDelete: handleDelete,
      onApprove: handleApprove,
      onRejectApplication: handleRejectApplication,
      onEmail: handleEmail,
    });
    return [...baseColumns, actionsColumn];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, teamMembers, searchParams]);

  const table = useReactTable({
    data,
    columns: columnsWithActions,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
      globalFilter,
    },
    getRowId: (row) => row.id.toString(),
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    globalFilterFn: (row, _columnId, filterValue) => {
      if (!filterValue) return true;

      const searchValue = String(filterValue).toLowerCase().trim();
      if (!searchValue) return true;

      const searchFields = [
        row.original.header,      // Candidate name
        row.original.email,       // Email
        row.original.jobTitle,    // Job title
        row.original.clientName,  // Client name
      ];

      return searchFields.some((field) => {
        if (field == null) return false;
        return String(field).toLowerCase().includes(searchValue);
      });
    },
  });

  // Calculate statistics
  const filteredData = table
    .getFilteredRowModel()
    .rows.map((row) => row.original);
  const totalCandidates = filteredData.length;
  const hiredCount = filteredData.filter(
    (item) => item.status === "Hired"
  ).length;
  const rejectedCount = filteredData.filter(
    (item) => item.status === "Rejected"
  ).length;
  const inProcessCount = filteredData.filter(
    (item) => item.status === "In Process"
  ).length;

  return (
    <>
      <Tabs
        defaultValue="outline"
        className="w-full flex-col justify-start gap-6"
      >
        <div className="flex flex-col gap-4">
          {/* Statistics Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="rounded-lg border bg-linear-to-br from-card to-muted/20 p-3 shadow-sm">
              <div className="flex items-center justify-between mb-1.5">
                <div className="rounded-md bg-primary/10 p-1.5">
                  <IconUsers className="h-4 w-4 text-primary" />
                </div>
                <span className="text-xs font-medium text-muted-foreground">
                  Total
                </span>
              </div>
              <p className="text-xl font-bold">{totalCandidates}</p>
              <p className="text-xs text-muted-foreground">Candidates</p>
            </div>
            <div className="rounded-lg border bg-linear-to-br from-green-50 to-green-100/20 dark:from-green-950/20 dark:to-green-900/10 p-3 shadow-sm">
              <div className="flex items-center justify-between mb-1.5">
                <div className="rounded-md bg-green-500/10 p-1.5">
                  <IconUserCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <span className="text-xs font-medium text-green-700 dark:text-green-400">
                  Hired
                </span>
              </div>
              <p className="text-xl font-bold text-green-600 dark:text-green-400">
                {hiredCount}
              </p>
              <p className="text-xs text-green-600/70 dark:text-green-400/70">
                {totalCandidates > 0
                  ? Math.round((hiredCount / totalCandidates) * 100)
                  : 0}
                % of total
              </p>
            </div>
            <div className="rounded-lg border bg-linear-to-br from-red-50 to-red-100/20 dark:from-red-950/20 dark:to-red-900/10 p-3 shadow-sm">
              <div className="flex items-center justify-between mb-1.5">
                <div className="rounded-md bg-red-500/10 p-1.5">
                  <IconUserX className="h-4 w-4 text-red-600 dark:text-red-400" />
                </div>
                <span className="text-xs font-medium text-red-700 dark:text-red-400">
                  Rejected
                </span>
              </div>
              <p className="text-xl font-bold text-red-600 dark:text-red-400">
                {rejectedCount}
              </p>
              <p className="text-xs text-red-600/70 dark:text-red-400/70">
                {totalCandidates > 0
                  ? Math.round((rejectedCount / totalCandidates) * 100)
                  : 0}
                % of total
              </p>
            </div>
            <div className="rounded-lg border bg-linear-to-br from-amber-50 to-amber-100/20 dark:from-amber-950/20 dark:to-amber-900/10 p-3 shadow-sm">
              <div className="flex items-center justify-between mb-1.5">
                <div className="rounded-md bg-amber-500/10 p-1.5">
                  <IconClockHour4 className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
                  Active
                </span>
              </div>
              <p className="text-xl font-bold text-amber-600 dark:text-amber-400">
                {inProcessCount}
              </p>
              <p className="text-xs text-amber-600/70 dark:text-amber-400/70">
                {totalCandidates > 0
                  ? Math.round((inProcessCount / totalCandidates) * 100)
                  : 0}
                % of total
              </p>
            </div>
          </div>

          {/* Search, Filter, Sort Bar */}
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-1 items-center gap-2">
              <div className="relative flex-1 max-w-md">
                <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by name, email, job, or client..."
                  value={globalFilter ?? ""}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  className="w-full h-9 pl-9 pr-4 text-sm rounded-md border bg-background shadow-xs focus:outline-none focus:ring-2 focus:ring-ring/50"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Bulk Actions - Show when rows are selected */}
              {table.getFilteredSelectedRowModel().rows.length > 0 && (
                <div className="flex items-center gap-2 mr-2 px-3 py-1.5 rounded-md bg-primary/10 border border-primary/20">
                  <span className="text-sm font-medium">
                    {table.getFilteredSelectedRowModel().rows.length} selected
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-7 px-2">
                        Actions
                        <IconChevronDown className="h-3 w-3 ml-1" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={handleBulkHire}>
                        <IconCheck className="h-4 w-4 mr-2 text-green-600" />
                        Mark as Hired
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleBulkReject}>
                        <IconX className="h-4 w-4 mr-2 text-red-600" />
                        Reject Selected
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleBulkAssignTeam}>
                        <IconUserCheck className="h-4 w-4 mr-2" />
                        Assign Team
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleBulkExport}>
                        <IconDownload className="h-4 w-4 mr-2" />
                        Export Selected
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => table.resetRowSelection()}
                        className="text-muted-foreground"
                      >
                        Clear Selection
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <IconFilter className="h-4 w-4" />
                    <span className="hidden sm:inline">Filter</span>
                    {columnFilters.length > 0 && (
                      <Badge
                        variant="secondary"
                        className="ml-1 h-5 w-5 rounded-full p-0 text-xs"
                      >
                        {columnFilters.length}
                      </Badge>
                    )}
                    <IconChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  {columnFilters.length > 0 && (
                    <>
                      <DropdownMenuItem
                        onClick={() => setColumnFilters([])}
                        className="text-destructive"
                      >
                        Clear All Filters
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <IconArrowsSort className="h-4 w-4" />
                    <span className="hidden sm:inline">Sort</span>
                    <IconChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem
                    onClick={() =>
                      setSorting([{ id: "candidateName", desc: false }])
                    }
                  >
                    Name (A → Z)
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      setSorting([{ id: "candidateName", desc: true }])
                    }
                  >
                    Name (Z → A)
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setSorting([{ id: "target", desc: true }])}
                  >
                    Date Applied (Newest)
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setSorting([{ id: "target", desc: false }])}
                  >
                    Date Applied (Oldest)
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setSorting([{ id: "status", desc: false }])}
                  >
                    Status (A → Z)
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      setSorting([{ id: "jobAndClient", desc: false }])
                    }
                  >
                    Job & Client (A → Z)
                  </DropdownMenuItem>
                  {sorting.length > 0 && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setSorting([])}
                        className="text-destructive"
                      >
                        Clear Sorting
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <IconLayoutColumns />
                    <span className="hidden lg:inline">Columns</span>
                    <IconChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <div className="px-2 py-1.5 text-xs font-semibold">
                    Toggle Columns
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem
                    checked={table.getColumn("candidateName")?.getIsVisible()}
                    onCheckedChange={(value) =>
                      table
                        .getColumn("candidateName")
                        ?.toggleVisibility(!!value)
                    }
                  >
                    Name
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={table.getColumn("jobAndClient")?.getIsVisible()}
                    onCheckedChange={(value) =>
                      table.getColumn("jobAndClient")?.toggleVisibility(!!value)
                    }
                  >
                    Job & Client
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={table.getColumn("currentStage")?.getIsVisible()}
                    onCheckedChange={(value) =>
                      table.getColumn("currentStage")?.toggleVisibility(!!value)
                    }
                  >
                    Stage
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={table.getColumn("dateApplied")?.getIsVisible()}
                    onCheckedChange={(value) =>
                      table.getColumn("dateApplied")?.toggleVisibility(!!value)
                    }
                  >
                    Applied Date
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        <TabsContent value="outline" className="m-0 border-0">
          <div className="rounded-lg border overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted sticky top-0 z-10">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead
                          key={header.id}
                          style={{ width: header.getSize() }}
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      );
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => {
                    const isRejected =
                      row.original.status?.toLowerCase() === "rejected";
                    const isHired =
                      row.original.status?.toLowerCase() === "hired";

                    // Determine row styling based on status
                    let rowClassName = "";
                    if (isRejected) {
                      rowClassName =
                        "bg-red-50/50 hover:bg-red-50/70 dark:bg-red-950/20 dark:hover:bg-red-950/30 opacity-70";
                    } else if (isHired) {
                      rowClassName =
                        "bg-green-50/50 hover:bg-green-50/70 dark:bg-green-950/20 dark:hover:bg-green-950/30";
                    }

                    return (
                      <TableRow
                        key={row.id}
                        data-state={row.getIsSelected() && "selected"}
                        className={rowClassName}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell
                            key={cell.id}
                            style={{ width: cell.column.getSize() }}
                          >
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      No candidates found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col gap-3 px-3 md:px-4 lg:px-6 py-3 md:py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs md:text-sm text-muted-foreground order-3 sm:order-1 text-center sm:text-left">
              {table.getFilteredSelectedRowModel().rows.length} of{" "}
              {table.getFilteredRowModel().rows.length} row(s) selected.
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 md:gap-6 order-1 sm:order-2">
              <div className="flex items-center justify-between sm:justify-start gap-2">
                <p className="text-xs md:text-sm font-medium">Rows per page</p>
                <Select
                  value={`${table.getState().pagination.pageSize}`}
                  onValueChange={(value) => {
                    table.setPageSize(Number(value));
                  }}
                >
                  <SelectTrigger className="h-7 md:h-8 w-[70px]">
                    <SelectValue
                      placeholder={table.getState().pagination.pageSize}
                    />
                  </SelectTrigger>
                  <SelectContent side="top">
                    {[10, 20, 30, 40, 50].map((pageSize) => (
                      <SelectItem key={pageSize} value={`${pageSize}`}>
                        {pageSize}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between sm:justify-center gap-2 order-2">
                <div className="flex items-center justify-center text-xs md:text-sm font-medium min-w-[100px]">
                  Page {table.getState().pagination.pageIndex + 1} of{" "}
                  {table.getPageCount()}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    className="hidden size-7 md:size-8 p-0 lg:flex"
                    onClick={() => table.setPageIndex(0)}
                    disabled={!table.getCanPreviousPage()}
                  >
                    <span className="sr-only">Go to first page</span>
                    <IconChevronsLeft className="size-3.5 md:size-4" />
                  </Button>
                  <Button
                    variant="outline"
                    className="size-7 md:size-8 p-0"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                  >
                    <span className="sr-only">Go to previous page</span>
                    <IconChevronLeft className="size-3.5 md:size-4" />
                  </Button>
                  <Button
                    variant="outline"
                    className="size-7 md:size-8 p-0"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                  >
                    <span className="sr-only">Go to next page</span>
                    <IconChevronRight className="size-3.5 md:size-4" />
                  </Button>
                  <Button
                    variant="outline"
                    className="hidden size-7 md:size-8 p-0 lg:flex"
                    onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                    disabled={!table.getCanNextPage()}
                  >
                    <span className="sr-only">Go to last page</span>
                    <IconChevronsRight className="size-3.5 md:size-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <ConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={
          candidateToDelete?.jobId && candidateToDelete.jobId !== "N/A"
            ? "Remove from Job"
            : "Delete Candidate"
        }
        description={
          candidateToDelete?.jobId && candidateToDelete.jobId !== "N/A"
            ? "Are you sure you want to remove this candidate from this job? The candidate will still be available for other jobs they applied to."
            : "Are you sure you want to delete this candidate completely? This will remove them from all jobs and cannot be undone."
        }
        confirmText={
          candidateToDelete?.jobId && candidateToDelete.jobId !== "N/A"
            ? "Remove from Job"
            : "Delete"
        }
        cancelText="Cancel"
        onConfirm={confirmDelete}
        variant="destructive"
      />

      <InputDialog
        open={assignTeamDialogOpen}
        onOpenChange={setAssignTeamDialogOpen}
        title="Assign Team Member"
        description="Enter the name of the team member to assign to this candidate."
        label="Team Member Name"
        placeholder="Enter team member name"
        onConfirm={handleAssignTeamConfirm}
        confirmText="Assign"
        cancelText="Cancel"
      />

      <Dialog
        open={bulkAssignTeamDialogOpen}
        onOpenChange={setBulkAssignTeamDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Team Member</DialogTitle>
            <DialogDescription>
              Select a team member to assign to{" "}
              {table.getFilteredSelectedRowModel().rows.length} selected
              candidates.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="team-member-select">Team Member</Label>
              <Select
                value={bulkAssignSelectedMember}
                onValueChange={setBulkAssignSelectedMember}
              >
                <SelectTrigger id="team-member-select">
                  <SelectValue placeholder="Select a team member" />
                </SelectTrigger>
                <SelectContent>
                  {teamMembers.length === 0 ? (
                    <SelectItem value="no-members" disabled>
                      No team members available
                    </SelectItem>
                  ) : (
                    teamMembers.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {`${member.firstName} ${member.lastName}`.trim() ||
                          member.email}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setBulkAssignTeamDialogOpen(false);
                setBulkAssignSelectedMember("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleBulkAssignTeamConfirm}
              disabled={!bulkAssignSelectedMember}
            >
              Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        open={hireConfirmDialogOpen}
        onOpenChange={setHireConfirmDialogOpen}
        title="Hire Previously Rejected Candidate"
        description="This candidate was previously rejected. Are you sure you want to mark them as hired? This will change their status from rejected to hired."
        confirmText="Yes, Hire Candidate"
        cancelText="Cancel"
        onConfirm={handleHireConfirm}
        variant="default"
      />

      {/* Reassign to Job Dialog */}
      {reassignJobDialogOpen &&
        candidateToReassign &&
        (() => {
          const candidate = candidates.find(
            (c) => c.id === candidateToReassign.candidateId
          );
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
                  Reassign to Another Job
                </h2>

                {availableJobs.length === 0 ? (
                  <p className="text-sm text-muted-foreground mb-4">
                    No available jobs to reassign this candidate to. The
                    candidate may already be assigned to all open jobs.
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
                                <span className="font-medium">{job.title}</span>
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
                      setCandidateToReassign(null);
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
                      Reassign
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

      {/* Approve Application Dialog */}
      {approveModalOpen && applicationToApprove && (() => {
        const application = data.find((item) => item.id === applicationToApprove);
        const applicableJobs = jobs.filter((job) => job.status === "open");
        const hasPreselectedJob = selectedJobForApproval && selectedJobForApproval !== "N/A";

        return (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg max-w-md w-full p-6">
              <h2 className="text-lg font-semibold mb-4">
                Approve Application
              </h2>

              <p className="text-sm text-muted-foreground mb-4">
                Convert <strong>{application?.header}</strong>'s application to candidate and assign to a job:
              </p>

              {hasPreselectedJob && (
                <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md">
                  <p className="text-xs text-blue-700 dark:text-blue-300 mb-1">
                    Applied job auto-selected
                  </p>
                </div>
              )}

              <Select
                value={selectedJobForApproval}
                onValueChange={(value) => {
                  setSelectedJobForApproval(value);
                }}
              >
                <SelectTrigger className="w-full mb-4">
                  <SelectValue placeholder="Select a job" />
                </SelectTrigger>
                <SelectContent>
                  {applicableJobs.map((job) => {
                    const clientName =
                      typeof job.clientId === "object" && job.clientId !== null
                        ? job.clientId.companyName
                        : clients.find((client) => client.id === job.clientId)?.companyName || "Unknown Client";

                    return (
                      <SelectItem key={job.id} value={job.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{job.title}</span>
                          <span className="text-xs text-muted-foreground">
                            {clientName}
                          </span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>

              {/* Welcome Email Checkbox */}
              <div className="mb-4 p-3 bg-primary/5 dark:bg-primary/10 rounded-md border border-primary/20">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sendWelcomeEmail}
                    onChange={(e) => setSendWelcomeEmail(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-foreground mb-1">
                      Send welcome email after approval
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Email composer will open immediately after creating the candidate, allowing you to send a personalized welcome message.
                    </div>
                  </div>
                </label>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setApproveModalOpen(false);
                    setApplicationToApprove(null);
                    setSelectedJobForApproval("");
                  }}
                  disabled={isApproving}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (selectedJobForApproval) {
                      handleApproveConfirm(selectedJobForApproval);
                    } else {
                      toast.error("Please select a job");
                    }
                  }}
                  disabled={!selectedJobForApproval || isApproving}
                >
                  {isApproving ? (
                    <>
                      <Loader className="mr-2 h-4 w-4 animate-spin" />
                      Approving...
                    </>
                  ) : (
                    "Approve & Create Candidate"
                  )}
                </Button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Reject Application Dialog */}
      <ConfirmationDialog
        open={rejectApplicationDialogOpen}
        onOpenChange={setRejectApplicationDialogOpen}
        title="Reject Application"
        description="Are you sure you want to reject this application? This action can be undone later if needed."
        confirmText="Reject Application"
        cancelText="Cancel"
        onConfirm={handleRejectApplicationConfirm}
        variant="destructive"
      />

      {/* Email Modal */}
      <CandidateEmailModal
        open={emailModalOpen}
        onOpenChange={(open) => {
          setEmailModalOpen(open);
          // Clear newly created candidate data when closing modal
          if (!open && newlyCreatedCandidate) {
            setNewlyCreatedCandidate(null);
          }
        }}
        candidate={(newlyCreatedCandidate?.candidate || selectedCandidateForEmail?.candidate) || null}
        job={(newlyCreatedCandidate?.job || selectedCandidateForEmail?.job) || null}
      />
    </>
  );
}
