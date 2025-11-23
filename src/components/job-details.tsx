import { CandidateCard } from "@/components/candidate-card";
import { JobCandidateDetails } from "@/components/job-candidate-details";
import { EditJobModal } from "@/components/modals/edit-job-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
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
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { authenticatedFetch } from "@/lib/authenticated-fetch";
import { cn } from "@/lib/utils";
import type { Candidate } from "@/types/candidate";
import type { Client } from "@/types/client";
import type { Job, UpdateJobRequest } from "@/types/job";
import { useCategories } from "@/hooks/firestore";
import { useJobs } from "@/store/hooks/useJobs";
import {
  ArrowLeft,
  BarChart3,
  Briefcase,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  Edit,
  FileText,
  Check as IconCheck,
  Tag as IconTag,
  Trash2,
  X as IconX,
  MapPin,
  Target,
  UserCheck,
  Users,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface JobDetailsProps {
  job: Job;
  candidates: Candidate[];
  clients: Client[];
  clientName: string;
  onBack: () => void;
  onCandidateClick: (candidate: Candidate) => void;
  onEditJob?: (id: string, data: UpdateJobRequest) => void;
}

const statusColors = {
  draft: "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20",
  open: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
  on_hold:
    "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20",
  closed: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  cancelled: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
} as const;

import { API_BASE_URL } from "@/config/api";

export function JobDetails({
  job,
  candidates,
  clients,
  clientName,
  onBack,
  onCandidateClick,
  onEditJob,
}: JobDetailsProps) {
  const navigate = useNavigate();
  const { deleteJob } = useJobs();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(
    null
  );
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Helper function to safely convert date values (Firestore Timestamps, Date objects, or strings)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const toSafeDate = (dateValue: any): Date | null => {
    if (!dateValue) return null;

    try {
      // Firestore Timestamp object with toDate() method
      if (typeof dateValue === 'object' && dateValue !== null && 'toDate' in dateValue && typeof dateValue.toDate === 'function') {
        return dateValue.toDate();
      }

      // Already a Date object
      if (dateValue instanceof Date) {
        return isNaN(dateValue.getTime()) ? null : dateValue;
      }

      // String or number - try to parse
      if (typeof dateValue === 'string' || typeof dateValue === 'number') {
        const parsed = new Date(dateValue);
        return isNaN(parsed.getTime()) ? null : parsed;
      }

      return null;
    } catch (error) {
      return null;
    }
  };

  // Get categories from Firestore realtime
  const { data: allCategories } = useCategories();
  
  // Category management state
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [openCategoryPopover, setOpenCategoryPopover] = useState(false);

  // Filter candidates for this job
  const jobCandidates = candidates.filter((candidate) => {
    // Backend uses jobIds array, not jobApplications
    if (!candidate.jobIds || !Array.isArray(candidate.jobIds)) return false;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return candidate.jobIds.some((jobId: any) => {
      // Handle both populated objects and string IDs
      const id = typeof jobId === "object" ? jobId._id || jobId.id : jobId;
      return id === job.id;
    });
  });

  const handleEditJob = (id: string, data: UpdateJobRequest) => {
    if (onEditJob) {
      onEditJob(id, data);
    }
    setIsEditModalOpen(false);
  };

  const handleDeleteJob = async () => {
    if (!job.id) return;
    
    // Check if there are any candidates assigned to this job
    if (candidates && candidates.length > 0) {
      return; // Don't proceed with deletion
    }
    
    setIsDeleting(true);
    try {
      await deleteJob(job.id);
      setIsDeleteDialogOpen(false);
      // Navigate back after successful deletion
      onBack();
    } catch {
      setIsDeleting(false);
    }
  };
  
  const hasCandidates = candidates && candidates.length > 0;

  // Categories are now loaded from Firestore in realtime via useCategories hook
  // Filter for active categories only
  const activeCategories = allCategories?.filter((c) => c.isActive !== false) || [];
  
  // Initialize selectedCategories from job.categoryIds when job loads
  useEffect(() => {
    if (job?.categoryIds && Array.isArray(job.categoryIds)) {
      setSelectedCategories(job.categoryIds);
    }
  }, [job]);

  // Load job's categories when job data is available
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (job && (job as any).categoryIds) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const categoryIdsRaw = (job as any).categoryIds;
      
      // Convert to array if it's an object (Firestore serialization issue)
      const categoryIdsArray = Array.isArray(categoryIdsRaw)
        ? categoryIdsRaw
        : categoryIdsRaw && typeof categoryIdsRaw === 'object'
        ? Object.values(categoryIdsRaw)
        : [];
      
      // Extract IDs from populated category objects or use string IDs directly
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const categoryIds = categoryIdsArray.map((id: any) =>
        typeof id === "object" ? id._id || id.id || "" : id
      ).filter(Boolean);
      
      setSelectedCategories(categoryIds);
    } else {
      setSelectedCategories([]);
    }
  }, [job]);

  // Update job categories
  const updateJobCategories = useCallback(
    async (categoryIds: string[]) => {
      if (!job?.id) return;

      try {
        const response = await authenticatedFetch(
          `${API_BASE_URL}/jobs/${job.id}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ categoryIds }),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to update categories");
        }

        // Call onEditJob to trigger refetch if available
        if (onEditJob) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onEditJob(job.id, { categoryIds } as any);
        }
      } catch (error) {
        }
    },
    [job?.id, onEditJob]
  );

  const toggleCategory = (categoryId: string) => {
    const newCategories = selectedCategories.includes(categoryId)
      ? selectedCategories.filter((id) => id !== categoryId)
      : [...selectedCategories, categoryId];

    setSelectedCategories(newCategories);
    updateJobCategories(newCategories);
  };

  // If viewing candidate details
  if (selectedCandidate) {
    return (
      <JobCandidateDetails
        candidate={selectedCandidate}
        job={job}
        onBack={() => setSelectedCandidate(null)}
      />
    );
  }

  // Apply filters
  const filteredCandidates = jobCandidates.filter((candidate) => {
    // Backend has status at candidate level, not per-job
    if (statusFilter === "all") return true;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (candidate as any).status === statusFilter;
  });

  // Apply sorting
  const sortedCandidates = [...filteredCandidates].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      case "oldest":
        return (
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      case "rating":
        // Backend doesn't have per-job rating, skip for now
        return 0;
      case "name":
        return `${a.firstName} ${a.lastName}`.localeCompare(
          `${b.firstName} ${b.lastName}`
        );
      default:
        return 0;
    }
  });

  // Calculate statistics by status (use candidate-level status)
  const stats = {
    total: jobCandidates.length,

    active: jobCandidates.filter(
      (c: Candidate) =>
        c.status && !["hired", "rejected", "withdrawn"].includes(c.status)
    ).length,
    interviewing: jobCandidates.filter(
      (c: Candidate) => c.status === "interviewing"
    ).length,
    hired: jobCandidates.filter((c: Candidate) => c.status === "hired").length,
    rejected: jobCandidates.filter((c: Candidate) => c.status === "rejected")
      .length,
    withdrawn: jobCandidates.filter((c: Candidate) => c.status === "withdrawn")
      .length,
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="h-9 px-3"
          >
            <ArrowLeft className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Back</span>
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground truncate">
              {job.title}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              className={cn(
                "border text-sm px-3 py-1 whitespace-nowrap",
                statusColors[job.status]
              )}
            >
              {job.status?.replace(/_/g, " ") || job.status}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditModalOpen(true)}
            >
              <Edit className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Edit</span>
            </Button>
            {job.status === 'closed' && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setIsDeleteDialogOpen(true)}
                disabled={hasCandidates}
                title={hasCandidates ? "Cannot delete job with candidates" : "Delete job"}
              >
                <Trash2 className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Delete</span>
              </Button>
            )}
          </div>
        </div>

        {/* Client Info */}
        <div className="flex items-center gap-2 text-muted-foreground">
          <Building2 className="h-4 w-4" />
          <span className="text-sm md:text-base">{clientName}</span>
          <span className="text-xs">•</span>
          <Calendar className="h-4 w-4" />
          <span className="text-sm">
            Posted {(() => {
              const date = toSafeDate(job.createdAt);
              return date ? date.toLocaleDateString() : 'N/A';
            })()}
          </span>
        </div>

        {/* Categories Section */}
        <div className="flex flex-wrap items-center gap-2">
          <IconTag className="h-4 w-4 text-muted-foreground shrink-0" />
          {selectedCategories.length === 0 ? (
            <span className="text-sm text-muted-foreground">No categories</span>
          ) : (
            selectedCategories.map((categoryId) => {
              const category = allCategories.find(
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (c) => c.id === categoryId || (c as any)._id === categoryId
              );
              if (!category) return null;
              return (
                <Badge
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  key={category.id || (category as any)._id}
                  variant="secondary"
                  style={{
                    backgroundColor: `${category.color || "#3B82F6"}15`,
                    color: category.color || "#3B82F6",
                    borderColor: `${category.color || "#3B82F6"}40`,
                  }}
                  className="px-2 py-1 text-xs border"
                >
                  {category.name}
                  <button
                    onClick={() =>
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      toggleCategory(category.id || (category as any)._id)
                    }
                    className="ml-1.5 hover:opacity-70"
                  >
                    <IconX className="h-3 w-3" />
                  </button>
                </Badge>
              );
            })
          )}
          <Popover
            open={openCategoryPopover}
            onOpenChange={setOpenCategoryPopover}
          >
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 text-xs">
                <IconTag className="h-3 w-3 mr-1" />
                Add Category
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start">
              <Command>
                <CommandInput placeholder="Search categories..." />
                <CommandEmpty>No categories found.</CommandEmpty>
                <CommandGroup className="max-h-[200px] overflow-auto">
                  {activeCategories
                    .map((category) => (
                      <CommandItem
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        key={category.id || (category as any)._id}
                        value={category.name}
                        onSelect={() => {
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          toggleCategory(category.id || (category as any)._id);
                        }}
                      >
                        <div className="flex items-center gap-2 flex-1">
                          <div
                            className="h-3 w-3 rounded-full"
                            style={{
                              backgroundColor: category.color || "#3B82F6",
                            }}
                          />
                          <span>{category.name}</span>
                        </div>
                        {selectedCategories.includes(
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          category.id || (category as any)._id
                        ) && <IconCheck className="h-4 w-4 text-primary" />}
                      </CommandItem>
                    ))}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Job Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-lg border bg-card p-3 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="rounded-md bg-primary/10 p-1.5">
              <Briefcase className="h-4 w-4 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground">Type</p>
          </div>
          <p className="text-sm md:text-base font-semibold capitalize">
            {job.type?.replace(/_/g, " ") || "Not specified"}
          </p>
        </div>

        <div className="rounded-lg border bg-card p-3 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="rounded-md bg-blue-500/10 p-1.5">
              <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-xs text-muted-foreground">Mode</p>
          </div>
          <p className="text-sm md:text-base font-semibold capitalize">
            {job.workMode}
          </p>
        </div>

        <div className="rounded-lg border bg-card p-3 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="rounded-md bg-green-500/10 p-1.5">
              <Clock className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-xs text-muted-foreground">Level</p>
          </div>
          <p className="text-sm md:text-base font-semibold capitalize">
            {job.experienceLevel}
          </p>
        </div>

        <div className="rounded-lg border bg-card p-3 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="rounded-md bg-amber-500/10 p-1.5">
              <Target className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <p className="text-xs text-muted-foreground">Openings</p>
          </div>
          <p className="text-sm md:text-base font-semibold">
            {job.openings} {job.openings === 1 ? "position" : "positions"}
          </p>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="rounded-lg border bg-linear-to-br from-card to-muted/20 p-3 shadow-sm">
          <div className="flex items-center justify-between mb-1.5">
            <div className="rounded-md bg-primary/10 p-1.5">
              <Users className="h-4 w-4 text-primary" />
            </div>
            <span className="text-xs font-medium text-muted-foreground">
              Total
            </span>
          </div>
          <p className="text-xl font-bold">{stats.total}</p>
          <p className="text-xs text-muted-foreground">Candidates</p>
        </div>

        <div className="rounded-lg border bg-linear-to-br from-blue-50 to-blue-100/20 dark:from-blue-950/20 dark:to-blue-900/10 p-3 shadow-sm">
          <div className="flex items-center justify-between mb-1.5">
            <div className="rounded-md bg-blue-500/10 p-1.5">
              <UserCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-xs font-medium text-blue-700 dark:text-blue-400">
              Active
            </span>
          </div>
          <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
            {stats.active}
          </p>
          <p className="text-xs text-blue-600/70 dark:text-blue-400/70">
            In Pipeline
          </p>
        </div>

        <div className="rounded-lg border bg-linear-to-br from-amber-50 to-amber-100/20 dark:from-amber-950/20 dark:to-amber-900/10 p-3 shadow-sm">
          <div className="flex items-center justify-between mb-1.5">
            <div className="rounded-md bg-amber-500/10 p-1.5">
              <Users className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
              Interview
            </span>
          </div>
          <p className="text-xl font-bold text-amber-600 dark:text-amber-400">
            {stats.interviewing}
          </p>
          <p className="text-xs text-amber-600/70 dark:text-amber-400/70">
            Stage
          </p>
        </div>

        <div className="rounded-lg border bg-linear-to-br from-green-50 to-green-100/20 dark:from-green-950/20 dark:to-green-900/10 p-3 shadow-sm">
          <div className="flex items-center justify-between mb-1.5">
            <div className="rounded-md bg-green-500/10 p-1.5">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
            <span className="text-xs font-medium text-green-700 dark:text-green-400">
              Hired
            </span>
          </div>
          <p className="text-xl font-bold text-green-600 dark:text-green-400">
            {stats.hired}
          </p>
          <p className="text-xs text-green-600/70 dark:text-green-400/70">
            Success
          </p>
        </div>

        <div className="rounded-lg border bg-linear-to-br from-red-50 to-red-100/20 dark:from-red-950/20 dark:to-red-900/10 p-3 shadow-sm">
          <div className="flex items-center justify-between mb-1.5">
            <div className="rounded-md bg-red-500/10 p-1.5">
              <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
            </div>
            <span className="text-xs font-medium text-red-700 dark:text-red-400">
              Rejected
            </span>
          </div>
          <p className="text-xl font-bold text-red-600 dark:text-red-400">
            {stats.rejected}
          </p>
          <p className="text-xs text-red-600/70 dark:text-red-400/70">
            Declined
          </p>
        </div>
      </div>

      {/* Main Content with Tabs */}
      <Tabs defaultValue="pipeline" className="space-y-6">
        <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
          <TabsList className="h-11 p-1 bg-card border border-border w-full md:w-fit inline-flex">
            <TabsTrigger
              value="pipeline"
              className="flex-1 md:flex-initial px-3 md:px-6 data-[state=active]:bg-primary data-[state=active]:text-white! data-[state=inactive]:text-muted-foreground text-xs md:text-sm"
            >
              <BarChart3 className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Pipeline</span>
            </TabsTrigger>
            <TabsTrigger
              value="candidates"
              className="flex-1 md:flex-initial px-3 md:px-6 data-[state=active]:bg-primary data-[state=active]:text-white! data-[state=inactive]:text-muted-foreground text-xs md:text-sm"
            >
              <Users className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Candidates</span>
              <span className="ml-1.5 text-xs">
                ({sortedCandidates.length})
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="details"
              className="flex-1 md:flex-initial px-3 md:px-6 data-[state=active]:bg-primary data-[state=active]:text-white! data-[state=inactive]:text-muted-foreground text-xs md:text-sm"
            >
              <FileText className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Job Details</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="pipeline" className="mt-6">
          <Card>
            <CardContent className="py-12">
              <div className="text-center space-y-3">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold">Pipeline Management</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Use the dedicated Pipeline page to manage candidates through
                  your hiring stages with drag & drop functionality.
                </p>
                <Button
                  onClick={() => navigate(`/dashboard/jobs/pipeline/${job.id}`)}
                >
                  Go to Pipeline
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="candidates" className="space-y-4 mt-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle className="text-lg">All Candidates</CardTitle>
                  <CardDescription className="text-sm">
                    Showing {sortedCandidates.length} of {jobCandidates.length}{" "}
                    candidates
                  </CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-40">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="screening">Screening</SelectItem>
                      <SelectItem value="interviewing">Interviewing</SelectItem>
                      <SelectItem value="testing">Testing</SelectItem>
                      <SelectItem value="reference_check">
                        Reference Check
                      </SelectItem>
                      <SelectItem value="offer_extended">
                        Offer Extended
                      </SelectItem>
                      <SelectItem value="hired">Hired</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="withdrawn">Withdrawn</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-full sm:w-[140px]">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest First</SelectItem>
                      <SelectItem value="oldest">Oldest First</SelectItem>
                      <SelectItem value="rating">Highest Rated</SelectItem>
                      <SelectItem value="name">Name (A-Z)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {sortedCandidates.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground">
                    {statusFilter !== "all"
                      ? "No candidates found with this status"
                      : "No candidates have applied yet"}
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {sortedCandidates.map((candidate) => {
                    const key =
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      (candidate as any)._id || candidate.id || candidate.email;
                    return (
                      <CandidateCard
                        key={key}
                        candidate={candidate}
                        jobId={job.id}
                        onClick={() => {
                          setSelectedCandidate(candidate);
                          onCandidateClick(candidate);
                        }}
                      />
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details" className="space-y-4 mt-6">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Job Description */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Job Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {job.description}
                </p>
              </CardContent>
            </Card>

            {/* Requirements */}
            <Card>
              <CardHeader>
                <CardTitle>Requirements</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">
                    Experience Required
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {job.requirements?.experience ? `${job.requirements.experience} years` : "Not specified"}
                  </p>
                </div>
                <Separator />
                <div>
                  <h4 className="text-sm font-medium mb-2">Required Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {job.requirements.skills.required && 
                     Array.isArray(job.requirements.skills.required) &&
                     job.requirements.skills.required.map((skill, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="text-xs"
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
                {job.requirements.skills.preferred && 
                 Array.isArray(job.requirements.skills.preferred) &&
                 job.requirements.skills.preferred.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="text-sm font-medium mb-2">
                        Preferred Skills
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {job.requirements.skills.preferred.map(
                          (skill, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="text-xs"
                            >
                              {skill}
                            </Badge>
                          )
                        )}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Additional Details */}
            <Card>
              <CardHeader>
                <CardTitle>Additional Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {job.salaryRange &&
                  job.salaryRange.min &&
                  job.salaryRange.max && (
                    <div className="flex items-start gap-3">
                      <div className="rounded-md bg-purple-500/10 p-2">
                        <DollarSign className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Salary Range</p>
                        <p className="text-sm text-muted-foreground">
                          {job.salaryRange.currency || "USD"}{" "}
                          {job.salaryRange.min.toLocaleString()} -{" "}
                          {job.salaryRange.max.toLocaleString()}
                          {job.salaryRange.period &&
                            ` / ${job.salaryRange.period}`}
                        </p>
                      </div>
                    </div>
                  )}
                {job.location && (
                  <div className="flex items-start gap-3">
                    <div className="rounded-md bg-blue-500/10 p-2">
                      <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Location</p>
                      <p className="text-sm text-muted-foreground">
                        {typeof job.location === "string"
                          ? job.location
                          : `${job.location.city || ""}, ${
                              job.location.country || ""
                            }`}
                      </p>
                    </div>
                  </div>
                )}
                {job.department && (
                  <div className="flex items-start gap-3">
                    <div className="rounded-md bg-green-500/10 p-2">
                      <Briefcase className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Department</p>
                      <p className="text-sm text-muted-foreground">
                        {job.department}
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <div className="rounded-md bg-amber-500/10 p-2">
                    <Target className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Priority</p>
                    <Badge
                      variant="outline"
                      className="text-xs capitalize mt-1"
                    >
                      {job.priority}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Responsibilities */}
            {job.responsibilities && 
             Array.isArray(job.responsibilities) &&
             job.responsibilities.length > 0 && (
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Responsibilities</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 list-disc list-inside">
                    {job.responsibilities.map((responsibility, index) => (
                      <li key={index} className="text-sm text-muted-foreground">
                        {responsibility}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Job Modal */}
      <EditJobModal
        open={isEditModalOpen}
        job={job}
        clients={clients}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleEditJob}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title={hasCandidates ? "Cannot Delete Job" : "Delete Closed Job"}
        description={
          hasCandidates 
            ? `Cannot delete "${job.title}" because it has ${candidates.length} candidate(s) assigned. Please remove all candidates from this job before deleting it.`
            : `Are you sure you want to delete "${job.title}"? This action cannot be undone.`
        }
        confirmText={hasCandidates ? undefined : "Delete Job"}
        cancelText={hasCandidates ? "Close" : "Cancel"}
        onConfirm={hasCandidates ? undefined : handleDeleteJob}
        variant="destructive"
        isLoading={isDeleting}
      />
    </div>
  );
}
