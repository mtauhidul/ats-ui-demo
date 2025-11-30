import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  IconArrowsSort,
  IconBriefcase,
  IconCheck,
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconCircleCheckFilled,
  IconClockHour4,
  IconDownload,
  IconFileText,
  IconFilter,
  IconLayoutColumns,
  IconLoader,
  IconMail,
  IconSearch,
  IconTrash,
  IconUpload,
  IconUserCheck,
  IconUsers,
  IconUserX,
  IconWorld,
  IconX,
  IconClick,
  IconInbox,
} from "@tabler/icons-react";
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
  type Row,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";
import * as React from "react";
import { useNavigate } from "react-router-dom";

import { z } from "zod";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { JobSelectionModal } from "@/components/modals/job-selection-modal";
import { Label } from "@/components/ui/label";
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
import { Tabs, TabsContent } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";
import { authenticatedFetch } from "@/lib/authenticated-fetch";
import { API_BASE_URL } from "@/config/api";
import { toast } from "sonner";
import type { schema } from "./data-table-schema";

// Create columns function
const createColumns = (
  jobs: Array<{
    _id?: string;
    id?: string;
    title: string;
    clientId: string | { _id?: string; id?: string; companyName: string };
  }> = []
): ColumnDef<z.infer<typeof schema>>[] => [
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
  },
  {
    accessorKey: "header",
    header: "Applicant Name",
    cell: ({ row }) => {
      return (
        <div className="w-48 min-w-0 overflow-hidden">
          <TableCellViewer item={row.original} jobs={jobs} />
        </div>
      );
    },
    enableHiding: false,
  },
  {
    accessorKey: "limit",
    header: () => <div className="w-full text-left">Application ID</div>,
    cell: ({ row }) => {
      const appId = row.original.jobIdDisplay || "-";
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const source = (row.original as any).source || "";

      const handleCopyId = () => {
        navigator.clipboard.writeText(appId);
        toast.success("Application ID copied to clipboard!");
      };

      // Determine icon and tooltip based on source
      const getSourceIcon = () => {
        if (source === "direct_apply") {
          return {
            icon: <IconClick className="h-3.5 w-3.5 shrink-0" />,
            tooltip: "Direct Application",
          };
        } else if (source === "email" || source === "email_import" || source === "email_automation") {
          return {
            icon: <IconMail className="h-3.5 w-3.5 shrink-0" />,
            tooltip: "Email Imported Application",
          };
        } else {
          return {
            icon: <IconUpload className="h-3.5 w-3.5 shrink-0" />,
            tooltip: "Manual Import",
          };
        }
      };

      const sourceInfo = getSourceIcon();

      return (
        <TooltipProvider>
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <button
                onClick={handleCopyId}
                className="text-left text-xs font-mono min-w-[200px] max-w-[200px] bg-green-50 dark:bg-green-950/30 px-2 py-1 rounded hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors cursor-pointer border border-green-200 dark:border-green-800 flex items-center gap-1.5"
              >
                <TooltipProvider>
                  <Tooltip delayDuration={200}>
                    <TooltipTrigger asChild>
                      <span className="shrink-0 text-green-700 dark:text-green-400">{sourceInfo.icon}</span>
                    </TooltipTrigger>
                    <TooltipContent
                      side="top"
                      className="bg-slate-900! text-white! border-slate-700! px-3 py-2 font-medium text-xs"
                      sideOffset={5}
                    >
                      {sourceInfo.tooltip}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <span className="truncate text-green-700 dark:text-green-400">{appId}</span>
              </button>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              className="bg-slate-900! text-white! border-slate-700! px-3 py-2 font-medium"
              sideOffset={5}
            >
              Click to copy ID
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    },
  },
  {
    accessorKey: "type",
    header: "AI Check",
    cell: ({ row }) => {
      const isValid = row.original.isValidResume;
      return (
        <div className="w-28">
          <Badge
            variant="outline"
            className="text-muted-foreground px-2 py-1.5 flex items-center gap-1 text-xs h-auto"
          >
            {isValid === true ? (
              <>
                <IconCircleCheckFilled className="size-3 fill-green-500 dark:fill-green-400" />
                Valid
              </>
            ) : isValid === false ? (
              <>
                <span className="size-3 text-red-500">✕</span>
                Invalid
              </>
            ) : (
              <>
                <IconLoader className="size-3 animate-spin" />
                Pending
              </>
            )}
          </Badge>
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status?.toLowerCase();
      return (
        <div className="w-32">
          <Badge
            variant="outline"
            className="text-muted-foreground px-2 py-1.5 flex items-center gap-1 h-auto"
          >
            {status === "approved" ? (
              <>
                <IconCircleCheckFilled className="size-3 fill-green-500 dark:fill-green-400" />
                Approved
              </>
            ) : status === "rejected" ? (
              <>
                <span className="size-3 text-red-500">✕</span>
                Rejected
              </>
            ) : (
              <>
                <IconLoader className="size-3" />
                Pending
              </>
            )}
          </Badge>
        </div>
      );
    },
  },
  {
    accessorKey: "reviewer",
    header: "Reviewed By",
    cell: ({ row }) => {
      const reviewerName = row.original.reviewer;

      return (
        <div className="flex items-center gap-2 min-w-[120px] max-w-[180px] overflow-hidden">
          {reviewerName && reviewerName !== "Not Reviewed" ? (
            <Badge
              variant="outline"
              className="text-xs px-2 py-0.5 truncate max-w-full"
            >
              {reviewerName}
            </Badge>
          ) : (
            <span className="text-xs text-muted-foreground">Not Reviewed</span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "submittedAtTimestamp",
    header: "Submitted Date",
    cell: () => null, // Hidden column, used only for sorting
    enableHiding: true,
  },
  {
    id: "actions",
    cell: () => null, // Will be populated with handlers in the component
  },
];

// Row actions column that needs access to handlers
const createActionsColumn = (handlers: {
  onApprove: (id: number | string) => void;
  onReject: (id: number | string) => void;
}): ColumnDef<z.infer<typeof schema>> => ({
  id: "actions",
  header: "Actions",
  cell: ({ row }) => {
    const status = row.original.status?.toLowerCase();
    const isProcessed = status === "approved" || status === "rejected";

    return (
      <TooltipProvider>
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950"
                onClick={() => handlers.onApprove(row.original.id)}
                disabled={isProcessed}
              >
                <IconCheck className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isProcessed
                ? "Application already processed"
                : "Approve Application"}
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                onClick={() => handlers.onReject(row.original.id)}
                disabled={isProcessed}
              >
                <IconX className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isProcessed
                ? "Application already processed"
                : "Reject Application"}
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    );
  },
});

function DraggableRow({ row }: { row: Row<z.infer<typeof schema>> }) {
  const { transform, transition, setNodeRef, isDragging } = useSortable({
    id: row.original.id,
  });

  return (
    <TableRow
      data-state={row.getIsSelected() && "selected"}
      data-dragging={isDragging}
      ref={setNodeRef}
      className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80"
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition,
      }}
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  );
}

export function DataTable({
  data: initialData,
  jobs = [],
}: {
  data: z.infer<typeof schema>[];
  jobs?: Array<{
    _id?: string;
    id?: string;
    title: string;
    clientId: string | { _id?: string; id?: string; companyName: string };
  }>;
}) {
  const navigate = useNavigate();
  const [data, setData] = React.useState(() => initialData);
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({
      submittedAtTimestamp: false, // Hide timestamp column (used only for sorting)
    });
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "submittedAtTimestamp", desc: true } // Default: sort by newest first
  ]);
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [showJobSelectionModal, setShowJobSelectionModal] =
    React.useState(false);
  const [currentApprovingId, setCurrentApprovingId] = React.useState<
    number | string | null
  >(null);

  // 🔥 REALTIME: Sync data when Firestore updates come through props
  React.useEffect(() => {
    setData(initialData);
  }, [initialData]);
  const [currentApprovingName, setCurrentApprovingName] =
    React.useState<string>("");
  const [currentJobId, setCurrentJobId] = React.useState<string | undefined>(undefined);
  const [isDirectApplication, setIsDirectApplication] = React.useState<boolean>(false);
  const sortableId = React.useId();
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  );

  // Generate columns with jobs data
  const columns = React.useMemo(() => createColumns(jobs), [jobs]);

  // Bulk action handlers
  const handleBulkApprove = async () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const selectedIds = selectedRows.map((r) => r.original.id);

    if (selectedIds.length === 0) {
      toast.error("No applications selected");
      return;
    }

    // For now, show that bulk approve needs job selection for each
    toast.info("Please approve applications individually to select jobs");
    table.resetRowSelection();
  };

  const handleBulkReject = async () => {
    const selectedIds = table
      .getFilteredSelectedRowModel()
      .rows.map((r) => r.original.id);

    if (selectedIds.length === 0) {
      toast.error("No applications selected");
      return;
    }

    const loadingToast = toast.loading(
      `Rejecting ${selectedIds.length} application(s)...`
    );

    try {
      const response = await authenticatedFetch(
        `${API_BASE_URL}/applications/bulk/status`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            applicationIds: selectedIds,
            status: "rejected",
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to reject applications");
      }

      // Update local state
      setData((prevData) =>
        prevData.map((item) =>
          selectedIds.includes(item.id) ? { ...item, status: "Rejected" } : item
        )
      );

      table.resetRowSelection();
      toast.dismiss(loadingToast);
      toast.success(
        `Successfully rejected ${selectedIds.length} application(s)`
      );
    } catch (error) {
      toast.dismiss(loadingToast);
      const message =
        error instanceof Error
          ? error.message
          : "Failed to reject applications";
      toast.error(message);
    }
  };

  const handleBulkDelete = async () => {
    const selectedIds = table
      .getFilteredSelectedRowModel()
      .rows.map((r) => r.original.id);

    if (selectedIds.length === 0) {
      toast.error("No applications selected");
      return;
    }

    // Show loading toast
    const loadingToast = toast.loading(
      `Deleting ${selectedIds.length} application(s)...`
    );

    try {
      const response = await authenticatedFetch(
        `${API_BASE_URL}/applications/bulk/delete`,
        {
          method: "POST",
          body: JSON.stringify({ applicationIds: selectedIds }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete applications");
      }

      const result = await response.json();

      // Remove deleted applications from local state
      setData((prevData) =>
        prevData.filter((item) => !selectedIds.includes(item.id))
      );

      // Clear selection
      table.resetRowSelection();

      // Dismiss loading and show success
      toast.dismiss(loadingToast);
      toast.success(
        result.message ||
          `Successfully deleted ${selectedIds.length} application(s)`
      );
    } catch (error) {
      // Dismiss loading and show error
      toast.dismiss(loadingToast);
      const message =
        error instanceof Error
          ? error.message
          : "Failed to delete applications";
      toast.error(message);
    }
  };

  // Individual action handlers
  const handleApprove = async (id: number | string) => {
    const application = data.find((item) => item.id === id);
    if (!application) return;

    setCurrentApprovingId(id);
    setCurrentApprovingName(application.header || "this candidate");
    
    // Get the target job ID if application has one
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const targetJobId = (application as any).targetJobId || (application as any).jobId;
    setCurrentJobId(targetJobId);

    // Check if this is a direct application
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const source = (application as any).source || '';
    const isDirect = source === 'direct_apply' && !!targetJobId;
    setIsDirectApplication(isDirect);

    // Debug logging
    console.log('Application approval debug:', {
      applicationId: id,
      source,
      targetJobId,
      isDirect,
      application
    });

    // Show immediate feedback to user
    if (isDirect) {
      toast.info("Review job assignment for direct application", {
        description: "The job is pre-selected based on where they applied",
      });
    } else {
      toast.info("Please select a job to approve this candidate", {
        description: "Choose the position this candidate will be assigned to",
      });
    }

    setShowJobSelectionModal(true);
  };

  const handleJobConfirmation = async (jobId: string, clientId: string) => {
    if (!currentApprovingId) return;

    const loadingToast = toast.loading("Processing approval...", {
      description: "Creating candidate profile and updating application status",
    });

    try {
      const response = await authenticatedFetch(
        `${API_BASE_URL}/applications/${currentApprovingId}/approve`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobId, clientId }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to approve application");
      }

      await response.json();

      toast.dismiss(loadingToast);
      toast.success("Application approved successfully!", {
        description: "Redirecting to candidates page...",
      });

      // Close the modal
      setShowJobSelectionModal(false);
      
      // Navigate to candidates page to see the newly approved candidate
      setTimeout(() => {
        navigate("/dashboard/candidates");
      }, 800); // Small delay to let user see the success message
    } catch (error) {
      toast.dismiss(loadingToast);
      const message =
        error instanceof Error
          ? error.message
          : "Failed to approve application";
      toast.error(message, {
        description: "Please try again or contact support if the issue persists",
      });
    } finally {
      setCurrentApprovingId(null);
      setCurrentApprovingName("");
    }
  };

  const handleReject = async (id: number | string) => {
    const loadingToast = toast.loading("Processing rejection...", {
      description: "Updating application status",
    });

    try {
      const response = await authenticatedFetch(
        `${API_BASE_URL}/applications/${id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "rejected" }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to reject application");
      }

      toast.dismiss(loadingToast);
      toast.success("Application rejected successfully", {
        description: "Table will update automatically",
      });
      
      // No need to update local state - Firestore real-time subscription will update the table automatically
    } catch (error) {
      toast.dismiss(loadingToast);
      const message =
        error instanceof Error ? error.message : "Failed to reject application";
      toast.error(message, {
        description: "Please try again or contact support if the issue persists",
      });
    }
  };

  const dataIds = React.useMemo<UniqueIdentifier[]>(
    () => data?.map(({ id }) => id) || [],
    [data]
  );

  // Create columns with handlers
  const columnsWithActions = React.useMemo(() => {
    const baseColumns = columns.slice(0, -1); // Remove the placeholder actions column
    const actionsColumn = createActionsColumn({
      onApprove: handleApprove,
      onReject: handleReject,
    });
    return [...baseColumns, actionsColumn];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

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
      const searchValue = filterValue.toLowerCase();
      const searchFields = [
        row.original.header,        // Name
        row.original.email,         // Email
        row.original.jobTitle,      // Applied Job
      ];

      return searchFields.some((field) =>
        field?.toString().toLowerCase().includes(searchValue)
      );
    },
  });

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      setData((data) => {
        const oldIndex = dataIds.indexOf(active.id);
        const newIndex = dataIds.indexOf(over.id);
        return arrayMove(data, oldIndex, newIndex);
      });
    }
  }

  // Calculate statistics from filtered data
  const filteredData = table
    .getFilteredRowModel()
    .rows.map((row) => row.original);
  const totalApplications = filteredData.length;
  const approvedCount = filteredData.filter(
    (item) => item.status === "approved"
  ).length;
  const rejectedCount = filteredData.filter(
    (item) => item.status === "rejected"
  ).length;
  const inProcessCount = filteredData.filter(
    (item) => item.status === "pending" || item.status === "reviewing" || item.status === "shortlisted"
  ).length;

  return (
    <>
      <Tabs
        defaultValue="outline"
        className="w-full flex-col justify-start gap-6"
      >
        <div className="flex flex-col gap-4 px-4 lg:px-6">
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
              <p className="text-xl font-bold">{totalApplications}</p>
              <p className="text-xs text-muted-foreground">Applications</p>
            </div>
            <div className="rounded-lg border bg-linear-to-br from-green-50 to-green-100/20 dark:from-green-950/20 dark:to-green-900/10 p-3 shadow-sm">
              <div className="flex items-center justify-between mb-1.5">
                <div className="rounded-md bg-green-500/10 p-1.5">
                  <IconUserCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <span className="text-xs font-medium text-green-700 dark:text-green-400">
                  Approved
                </span>
              </div>
              <p className="text-xl font-bold text-green-600 dark:text-green-400">
                {approvedCount}
              </p>
              <p className="text-xs text-green-600/70 dark:text-green-400/70">
                {totalApplications > 0
                  ? Math.round((approvedCount / totalApplications) * 100)
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
                {totalApplications > 0
                  ? Math.round((rejectedCount / totalApplications) * 100)
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
                  Pending
                </span>
              </div>
              <p className="text-xl font-bold text-amber-600 dark:text-amber-400">
                {inProcessCount}
              </p>
              <p className="text-xs text-amber-600/70 dark:text-amber-400/70">
                {totalApplications > 0
                  ? Math.round((inProcessCount / totalApplications) * 100)
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
                  placeholder="Search by name, email, or job title..."
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
                      <DropdownMenuItem onClick={handleBulkApprove}>
                        <IconCheck className="h-4 w-4 mr-2 text-green-600" />
                        Approve Selected
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleBulkReject}>
                        <IconX className="h-4 w-4 mr-2 text-red-600" />
                        Reject Selected
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={handleBulkDelete}
                        className="text-destructive focus:text-destructive"
                      >
                        <IconTrash className="h-4 w-4 mr-2" />
                        Delete Selected
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
                  <div className="px-2 py-1.5 text-xs font-semibold">
                    Filter by Status
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem
                    checked={!columnFilters.find((f) => f.id === "status")}
                    onCheckedChange={() => {
                      setColumnFilters((prev) =>
                        prev.filter((f) => f.id !== "status")
                      );
                    }}
                  >
                    All Statuses
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={
                      columnFilters.find((f) => f.id === "status")?.value ===
                      "approved"
                    }
                    onCheckedChange={(checked) => {
                      setColumnFilters((prev) =>
                        checked
                          ? [
                              ...prev.filter((f) => f.id !== "status"),
                              { id: "status", value: "approved" },
                            ]
                          : prev.filter((f) => f.id !== "status")
                      );
                    }}
                  >
                    <IconUserCheck className="h-3 w-3 mr-2 text-green-600" />
                    Approved
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={
                      columnFilters.find((f) => f.id === "status")?.value ===
                      "pending"
                    }
                    onCheckedChange={(checked) => {
                      setColumnFilters((prev) =>
                        checked
                          ? [
                              ...prev.filter((f) => f.id !== "status"),
                              { id: "status", value: "pending" },
                            ]
                          : prev.filter((f) => f.id !== "status")
                      );
                    }}
                  >
                    <IconClockHour4 className="h-3 w-3 mr-2 text-amber-600" />
                    Pending
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={
                      columnFilters.find((f) => f.id === "status")?.value ===
                      "rejected"
                    }
                    onCheckedChange={(checked) => {
                      setColumnFilters((prev) =>
                        checked
                          ? [
                              ...prev.filter((f) => f.id !== "status"),
                              { id: "status", value: "rejected" },
                            ]
                          : prev.filter((f) => f.id !== "status")
                      );
                    }}
                  >
                    <IconUserX className="h-3 w-3 mr-2 text-red-600" />
                    Rejected
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuSeparator />
                  <div className="px-2 py-1.5 text-xs font-semibold">
                    Filter by AI
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem
                    checked={!columnFilters.find((f) => f.id === "type")}
                    onCheckedChange={() => {
                      setColumnFilters((prev) =>
                        prev.filter((f) => f.id !== "type")
                      );
                    }}
                  >
                    All AI Results
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={
                      columnFilters.find((f) => f.id === "type")?.value ===
                      "valid"
                    }
                    onCheckedChange={(checked) => {
                      setColumnFilters((prev) =>
                        checked
                          ? [
                              ...prev.filter((f) => f.id !== "type"),
                              { id: "type", value: "valid" },
                            ]
                          : prev.filter((f) => f.id !== "type")
                      );
                    }}
                  >
                    <IconCheck className="h-3 w-3 mr-2 text-green-600" />
                    AI Approved
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={
                      columnFilters.find((f) => f.id === "type")?.value ===
                      "invalid"
                    }
                    onCheckedChange={(checked) => {
                      setColumnFilters((prev) =>
                        checked
                          ? [
                              ...prev.filter((f) => f.id !== "type"),
                              { id: "type", value: "invalid" },
                            ]
                          : prev.filter((f) => f.id !== "type")
                      );
                    }}
                  >
                    <IconX className="h-3 w-3 mr-2 text-red-600" />
                    AI Rejected
                  </DropdownMenuCheckboxItem>
                  {columnFilters.length > 0 && (
                    <>
                      <DropdownMenuSeparator />
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
                    onClick={() => setSorting([{ id: "header", desc: false }])}
                  >
                    Name (A → Z)
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setSorting([{ id: "header", desc: true }])}
                  >
                    Name (Z → A)
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      setSorting([{ id: "submittedAtTimestamp", desc: true }])
                    }
                  >
                    Date (Newest First)
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      setSorting([{ id: "submittedAtTimestamp", desc: false }])
                    }
                  >
                    Date (Oldest First)
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setSorting([{ id: "status", desc: false }])}
                  >
                    Status (A → Z)
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      setSorting([{ id: "jobIdDisplay", desc: false }])
                    }
                  >
                    Job ID (Low → High)
                  </DropdownMenuItem>
                  {sorting.length > 0 && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setSorting([{ id: "submittedAtTimestamp", desc: true }])}
                        className="text-muted-foreground"
                      >
                        Reset to Default (Newest First)
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
                    checked={table.getColumn("header")?.getIsVisible()}
                    onCheckedChange={(value) =>
                      table.getColumn("header")?.toggleVisibility(!!value)
                    }
                  >
                    Applicant Name
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={table.getColumn("type")?.getIsVisible()}
                    onCheckedChange={(value) =>
                      table.getColumn("type")?.toggleVisibility(!!value)
                    }
                  >
                    AI Recommendation
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={table.getColumn("status")?.getIsVisible()}
                    onCheckedChange={(value) =>
                      table.getColumn("status")?.toggleVisibility(!!value)
                    }
                  >
                    Status
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={table.getColumn("limit")?.getIsVisible()}
                    onCheckedChange={(value) =>
                      table.getColumn("limit")?.toggleVisibility(!!value)
                    }
                  >
                    Job ID
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={table.getColumn("reviewer")?.getIsVisible()}
                    onCheckedChange={(value) =>
                      table.getColumn("reviewer")?.toggleVisibility(!!value)
                    }
                  >
                    Reviewer
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        <TabsContent
          value="outline"
          className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
        >
          <div className="overflow-hidden rounded-lg border">
            <DndContext
              collisionDetection={closestCenter}
              modifiers={[restrictToVerticalAxis]}
              onDragEnd={handleDragEnd}
              sensors={sensors}
              id={sortableId}
            >
              <Table>
                <TableHeader className="bg-muted sticky top-0 z-10">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => {
                        return (
                          <TableHead key={header.id} colSpan={header.colSpan}>
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
                <TableBody className="**:data-[slot=table-cell]:first:w-8">
                  {table.getRowModel().rows?.length ? (
                    <SortableContext
                      items={dataIds}
                      strategy={verticalListSortingStrategy}
                    >
                      {table.getRowModel().rows.map((row) => (
                        <DraggableRow key={row.id} row={row} />
                      ))}
                    </SortableContext>
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length}
                        className="h-24 text-center"
                      >
                        No results.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </DndContext>
          </div>
          <div className="flex items-center justify-between px-4">
            <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
              {table.getFilteredSelectedRowModel().rows.length} of{" "}
              {table.getFilteredRowModel().rows.length} row(s) selected.
            </div>
            <div className="flex w-full items-center gap-8 lg:w-fit">
              <div className="hidden items-center gap-2 lg:flex">
                <Label htmlFor="rows-per-page" className="text-sm font-medium">
                  Rows per page
                </Label>
                <Select
                  value={`${table.getState().pagination.pageSize}`}
                  onValueChange={(value) => {
                    table.setPageSize(Number(value));
                  }}
                >
                  <SelectTrigger size="sm" className="w-20" id="rows-per-page">
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
              <div className="flex w-fit items-center justify-center text-sm font-medium">
                Page {table.getState().pagination.pageIndex + 1} of{" "}
                {table.getPageCount()}
              </div>
              <div className="ml-auto flex items-center gap-2 lg:ml-0">
                <Button
                  variant="outline"
                  className="hidden h-8 w-8 p-0 lg:flex"
                  onClick={() => table.setPageIndex(0)}
                  disabled={!table.getCanPreviousPage()}
                >
                  <span className="sr-only">Go to first page</span>
                  <IconChevronsLeft />
                </Button>
                <Button
                  variant="outline"
                  className="size-8"
                  size="icon"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  <span className="sr-only">Go to previous page</span>
                  <IconChevronLeft />
                </Button>
                <Button
                  variant="outline"
                  className="size-8"
                  size="icon"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  <span className="sr-only">Go to next page</span>
                  <IconChevronRight />
                </Button>
                <Button
                  variant="outline"
                  className="hidden size-8 lg:flex"
                  size="icon"
                  onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                  disabled={!table.getCanNextPage()}
                >
                  <span className="sr-only">Go to last page</span>
                  <IconChevronsRight />
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
        <TabsContent
          value="past-performance"
          className="flex flex-col px-4 lg:px-6"
        >
          <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
        </TabsContent>
        <TabsContent
          value="key-personnel"
          className="flex flex-col px-4 lg:px-6"
        >
          <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
        </TabsContent>
        <TabsContent
          value="focus-documents"
          className="flex flex-col px-4 lg:px-6"
        >
          <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
        </TabsContent>
      </Tabs>

      {/* Job Selection Modal for Approval */}
      <JobSelectionWrapper
        open={showJobSelectionModal}
        onClose={() => {
          setShowJobSelectionModal(false);
          setCurrentApprovingId(null);
          setCurrentApprovingName("");
          setCurrentJobId(undefined);
          setIsDirectApplication(false);
        }}
        onConfirm={handleJobConfirmation}
        jobs={jobs}
        currentJobId={currentJobId}
        applicationName={currentApprovingName}
        isDirectApplication={isDirectApplication}
      />
    </>
  );
}

// Job Selection Modal wrapper for approval
function JobSelectionWrapper({
  open,
  onClose,
  onConfirm,
  jobs,
  currentJobId,
  applicationName,
  isDirectApplication,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (jobId: string, clientId: string) => void;
  jobs: Array<{
    _id?: string;
    id?: string;
    title: string;
    clientId: string | { _id?: string; id?: string; companyName: string };
  }>;
  currentJobId?: string;
  applicationName: string;
  isDirectApplication?: boolean;
}) {
  // Jobs are already in the correct format, no transformation needed
  return (
    <JobSelectionModal
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      jobs={jobs}
      currentJobId={currentJobId}
      applicationName={applicationName}
      isDirectApplication={isDirectApplication}
    />
  );
}

function TableCellViewer({
  item,
  jobs = [],
}: {
  item: z.infer<typeof schema>;
  jobs?: Array<{
    _id?: string;
    id?: string;
    title: string;
    clientId: string | { _id?: string; id?: string; companyName: string };
  }>;
}) {
  const isMobile = useIsMobile();
  const [showResumePreview, setShowResumePreview] = React.useState(false);
  const [showJobSelectionModal, setShowJobSelectionModal] =
    React.useState(false);
  const [approvalAction, setApprovalAction] = React.useState<
    "approve" | "reject" | null
  >(null);

  // Jobs data is now passed as prop, no need to fetch

  // Handler for job selection and approval
  const handleJobConfirmation = async (jobId: string, clientId: string) => {
    try {
      if (approvalAction === "approve") {
        const response = await authenticatedFetch(
          `${API_BASE_URL}/applications/${item.id}/approve`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ jobId, clientId }),
          }
        );

        if (response.ok) {
          toast.success("Application approved successfully");
          window.location.reload();
        } else {
          const error = await response.json();
          toast.error(error.message || "Failed to approve application");
        }
      } else if (approvalAction === "reject") {
        const response = await authenticatedFetch(
          `${API_BASE_URL}/applications/${item.id}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "rejected", jobId, clientId }),
          }
        );

        if (response.ok) {
          toast.success("Application rejected successfully");
          window.location.reload();
        } else {
          const error = await response.json();
          toast.error(error.message || "Failed to reject application");
        }
      }
    } catch (error) {
      toast.error(`Failed to ${approvalAction} application`);
    } finally {
      setShowJobSelectionModal(false);
      setApprovalAction(null);
    }
  };

  // Auto-hide resume preview when drawer closes
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);

  React.useEffect(() => {
    if (!isDrawerOpen && showResumePreview) {
      setShowResumePreview(false);
    }
  }, [isDrawerOpen, showResumePreview]);

  // Helper function to get status badge
  const getStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase();

    if (statusLower === "approved") {
      return (
        <Badge className="bg-green-500/10 text-green-700 dark:bg-green-500/20 dark:text-green-400 border-green-500/20 hover:bg-green-500/20">
          <IconCircleCheckFilled className="h-3 w-3 mr-1" />
          Approved
        </Badge>
      );
    } else if (statusLower === "rejected") {
      return (
        <Badge className="bg-red-500/10 text-red-700 dark:bg-red-500/20 dark:text-red-400 border-red-500/20 hover:bg-red-500/20">
          <IconX className="h-3 w-3 mr-1" />
          Rejected
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-amber-500/10 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border-amber-500/20 hover:bg-amber-500/20">
          <IconLoader className="h-3 w-3 mr-1" />
          Pending
        </Badge>
      );
    }
  };

  // Helper function to get AI status badge
  const getAIStatusBadge = (isValid?: boolean | null) => {
    if (isValid === true) {
      return (
        <Badge className="bg-green-500/10 text-green-700 dark:bg-green-500/20 dark:text-green-400 border-green-500/20 hover:bg-green-500/20">
          <IconCircleCheckFilled className="h-3 w-3 mr-1" />
          AI Approved
        </Badge>
      );
    } else if (isValid === false) {
      return (
        <Badge className="bg-red-500/10 text-red-700 dark:bg-red-500/20 dark:text-red-400 border-red-500/20 hover:bg-red-500/20">
          <IconX className="h-3 w-3 mr-1" />
          AI Rejected
        </Badge>
      );
    }
    return null;
  };

  // Helper function to get source badge with icon
  const getSourceBadge = (source?: string) => {
    if (!source) return null;

    const sourceConfig: Record<
      string,
      { icon: React.ReactNode; label: string; color: string }
    > = {
      direct_application: {
        icon: <IconWorld className="h-3 w-3 mr-1" />,
        label: "Direct Apply",
        color:
          "bg-blue-500/10 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 border-blue-500/20",
      },
      recruiter: {
        icon: <IconUpload className="h-3 w-3 mr-1" />,
        label: "Manual Import",
        color:
          "bg-purple-500/10 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400 border-purple-500/20",
      },
      website: {
        icon: <IconWorld className="h-3 w-3 mr-1" />,
        label: "Website",
        color:
          "bg-blue-500/10 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 border-blue-500/20",
      },
      linkedin: {
        icon: <IconBriefcase className="h-3 w-3 mr-1" />,
        label: "LinkedIn",
        color:
          "bg-sky-500/10 text-sky-700 dark:bg-sky-500/20 dark:text-sky-400 border-sky-500/20",
      },
      referral: {
        icon: <IconUsers className="h-3 w-3 mr-1" />,
        label: "Referral",
        color:
          "bg-indigo-500/10 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400 border-indigo-500/20",
      },
      job_board: {
        icon: <IconBriefcase className="h-3 w-3 mr-1" />,
        label: "Job Board",
        color:
          "bg-teal-500/10 text-teal-700 dark:bg-teal-500/20 dark:text-teal-400 border-teal-500/20",
      },
      email: {
        icon: <IconMail className="h-3 w-3 mr-1" />,
        label: "Email",
        color:
          "bg-orange-500/10 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400 border-orange-500/20",
      },
    };

    const config = sourceConfig[source.toLowerCase()] || {
      icon: <IconUpload className="h-3 w-3 mr-1" />,
      label: source.replace(/_/g, " "),
      color:
        "bg-gray-500/10 text-gray-700 dark:bg-gray-500/20 dark:text-gray-400 border-gray-500/20",
    };

    return (
      <Badge className={`${config.color} hover:opacity-80`}>
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  return (
    <Drawer
      direction={isMobile ? "bottom" : "right"}
      onOpenChange={setIsDrawerOpen}
    >
      <DrawerTrigger asChild>
        <Button
          variant="ghost"
          className="w-fit max-w-full px-0 text-left group hover:bg-transparent hover:no-underline focus:bg-transparent active:bg-transparent data-[state=open]:bg-transparent"
        >
          <span className="flex items-center gap-1.5 text-foreground group-hover:text-primary transition-colors max-w-full">
            <span className="group-hover:underline underline-offset-4 truncate">
              {item.header}
            </span>
            <IconChevronRight className="h-3.5 w-3.5 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0" />
          </span>
        </Button>
      </DrawerTrigger>
      <DrawerContent className="max-h-[96vh]">
        <DrawerHeader className="border-b">
          <DrawerTitle>Application Details</DrawerTitle>
          <DrawerDescription>
            Review and manage applicant information
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex flex-col gap-5 overflow-y-auto px-6 py-5">
          {/* Applicant Header Card */}
          <div className="flex items-start gap-4 rounded-lg border bg-muted/30 p-4">
            <Avatar className="h-14 w-14 rounded-lg">
              <AvatarFallback className="text-base font-semibold">
                {(() => {
                  const nameParts = item.header.split(" ");
                  const firstName = nameParts[0] || "";
                  const lastName = nameParts[nameParts.length - 1] || "";
                  return (firstName[0] || "") + (lastName[0] || "");
                })()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold mb-1">{item.header}</h3>
              {item.email && (
                <p className="text-sm text-muted-foreground truncate mb-0.5">
                  {item.email}
                </p>
              )}
              {item.phone && (
                <p className="text-xs text-muted-foreground">{item.phone}</p>
              )}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {getSourceBadge(item.source)}
                {getStatusBadge(item.status)}
                {getAIStatusBadge(item.isValidResume)}
              </div>
              {/* Application ID with highlighting */}
              {item.jobIdDisplay && (
                <div className="mt-2 inline-block">
                  <div className="text-[10px] text-muted-foreground mb-0.5">
                    APPLICATION ID
                  </div>
                  <div className="text-xs font-mono font-medium bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 px-2 py-1 rounded border border-green-200 dark:border-green-800 break-all">
                    {item.jobIdDisplay}
                  </div>
                </div>
              )}
              {/* Job Title and Client for direct applications */}
              {item.jobTitle && item.jobTitle !== "No Job Specified" && (
                <div className="mt-2">
                  <div className="text-[10px] text-muted-foreground mb-0.5">
                    APPLIED FOR
                  </div>
                  <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-950/30 px-2 py-1.5 rounded border border-blue-200 dark:border-blue-800">
                    {item.clientLogo && (
                      <Avatar className="h-6 w-6 rounded">
                        <AvatarImage src={item.clientLogo} alt={item.clientName} />
                        <AvatarFallback className="text-[10px]">
                          {item.clientName?.charAt(0) || "C"}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div className="flex flex-col min-w-0">
                      <div className="text-sm font-medium text-blue-700 dark:text-blue-400 truncate">
                        {item.jobTitle}
                      </div>
                      {item.clientName && item.clientName !== "Unknown Client" && (
                        <div className="text-xs text-blue-600/70 dark:text-blue-400/70 truncate">
                          {item.clientName}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Info Grid */}
          <div className="space-y-3">
            {/* Reviewed By - Read Only */}
            <div className="rounded-lg border bg-blue-500/10 dark:bg-blue-500/10 border-blue-500/20 p-3">
              <Label className="text-xs text-blue-700 dark:text-blue-400 font-medium mb-2 block">
                Reviewed By
              </Label>
              {item.reviewer && item.reviewer !== "Not Reviewed" ? (
                <Badge variant="outline" className="text-sm px-3 py-1.5">
                  {item.reviewer}
                </Badge>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Not reviewed yet
                </p>
              )}
            </div>

            {/* Date Applied and Experience in 2 columns */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border bg-card p-3">
                <Label className="text-xs text-muted-foreground">
                  Date Applied
                </Label>
                <p className="text-sm font-medium mt-1">
                  {item.dateApplied || "N/A"}
                </p>
              </div>
              <div className="rounded-lg border bg-card p-3">
                <Label className="text-xs text-muted-foreground">
                  Experience
                </Label>
                <p className="text-sm font-medium mt-1">
                  {typeof item.yearsOfExperience === "number" &&
                  item.yearsOfExperience > 0
                    ? `${item.yearsOfExperience} years`
                    : "Not specified"}
                </p>
              </div>
            </div>
          </div>

          {/* Professional Information */}
          {(item.currentTitle ||
            item.currentCompany ||
            item.educationLevel ||
            item.expectedSalary) && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                Professional Information
              </h4>
              <div className="rounded-lg border divide-y">
                {item.currentTitle && (
                  <div className="flex items-center justify-between p-3 text-sm">
                    <span className="text-muted-foreground">Position</span>
                    <span className="font-medium text-right">
                      {item.currentTitle}
                    </span>
                  </div>
                )}
                {item.currentCompany && (
                  <div className="flex items-center justify-between p-3 text-sm">
                    <span className="text-muted-foreground">Company</span>
                    <span className="font-medium text-right">
                      {item.currentCompany}
                    </span>
                  </div>
                )}
                {item.educationLevel && (
                  <div className="flex items-center justify-between p-3 text-sm">
                    <span className="text-muted-foreground">Education</span>
                    <span className="font-medium text-right">
                      {item.educationLevel}
                    </span>
                  </div>
                )}
                {item.expectedSalary && (
                  <div className="flex items-center justify-between p-3 text-sm">
                    <span className="text-muted-foreground">
                      Salary Expectation
                    </span>
                    <span className="font-medium text-right">
                      {item.expectedSalary}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Contact Information */}
          {(item.location || item.linkedinUrl || item.portfolioUrl) && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold">Contact Information</h4>
              <div className="rounded-lg border divide-y">
                {item.location && (
                  <div className="flex items-center justify-between p-3 text-sm">
                    <span className="text-muted-foreground">Location</span>
                    <span className="font-medium text-right">
                      {item.location}
                    </span>
                  </div>
                )}
                {item.linkedinUrl && (
                  <div className="flex items-center justify-between p-3 text-sm">
                    <span className="text-muted-foreground">LinkedIn</span>
                    <a
                      href={item.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline font-medium"
                    >
                      View Profile
                    </a>
                  </div>
                )}
                {item.portfolioUrl && (
                  <div className="flex items-center justify-between p-3 text-sm">
                    <span className="text-muted-foreground">Portfolio</span>
                    <a
                      href={item.portfolioUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline font-medium"
                    >
                      View Website
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Skills & Languages */}
          {((item.skills && item.skills.length > 0) ||
            (item.languages && item.languages.length > 0)) && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold">Skills & Languages</h4>
              <div className="rounded-lg border bg-card p-4 space-y-3">
                {item.skills && item.skills.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">
                      Technical Skills
                    </Label>
                    <div className="flex flex-wrap gap-1.5">
                      {item.skills.map((skill, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="text-xs font-normal wrap-break-word max-w-full"
                        >
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {item.languages && item.languages.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">
                      Languages
                    </Label>
                    <div className="flex flex-wrap gap-1.5">
                      {item.languages.map((language, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="text-xs font-normal wrap-break-word max-w-full"
                        >
                          {language}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Documents Section */}
          {(item.resumeFilename || item.coverLetter) && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold">Documents</h4>
              <div className="space-y-3">
                {/* Resume */}
                {item.resumeFilename && (
                  <div className="rounded-lg border overflow-hidden">
                    <div className="flex items-center justify-between gap-3 p-3 bg-muted/50">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="rounded-md bg-background p-2 border">
                          <IconFileText className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">
                            {item.resumeFilename}
                          </p>
                          {item.resumeFileSize && (
                            <p className="text-xs text-muted-foreground">
                              {item.resumeFileSize}
                            </p>
                          )}
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
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (item.resumeUrl) {
                              window.open(item.resumeUrl, "_blank");
                            }
                          }}
                          className="h-8 px-3"
                          title="Open resume in full view"
                        >
                          <span className="text-xs">Full View</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (item.resumeUrl) {
                              const link = document.createElement("a");
                              link.href = item.resumeUrl;
                              link.download =
                                item.resumeFilename || "resume.pdf";
                              link.target = "_blank";
                              link.click();
                            }
                          }}
                          title="Download Resume"
                        >
                          <IconDownload className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {showResumePreview && (
                      <div className="border-t">
                        {item.resumeUrl ? (
                          <div className="relative bg-muted/30">
                            <iframe
                              src={`${item.resumeUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                              className="w-full h-[500px]"
                              title="Resume Preview"
                              onError={(e) => {
                                (e.target as HTMLIFrameElement).style.display =
                                  "none";
                              }}
                            />
                          </div>
                        ) : item.resumeRawText ? (
                          <div className="max-h-[500px] overflow-y-auto p-4 bg-muted/30">
                            <pre className="text-xs whitespace-pre-wrap leading-relaxed">
                              {item.resumeRawText}
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

                {/* Cover Letter */}
                {item.coverLetter && (
                  <div className="rounded-lg border overflow-hidden">
                    <div className="px-4 py-2.5 bg-muted/50 border-b">
                      <Label className="text-xs font-medium">
                        Cover Letter
                      </Label>
                    </div>
                    <div className="p-4 max-h-64 overflow-y-auto bg-card">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {item.coverLetter}
                      </p>
                    </div>
                  </div>
                )}

                {/* Video Introduction */}
                {item.videoIntroUrl && (
                  <div className="rounded-lg border overflow-hidden">
                    <div className="px-4 py-2.5 bg-muted/50 border-b flex items-center justify-between">
                      <Label className="text-xs font-medium">
                        Video Introduction
                      </Label>
                      {(item.videoIntroDuration || item.videoIntroFileSize) && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {item.videoIntroDuration && (
                            <span>{item.videoIntroDuration}</span>
                          )}
                          {item.videoIntroFileSize && (
                            <span>• {item.videoIntroFileSize}</span>
                          )}
                        </div>
                      )}
                    </div>
                    {item.videoIntroUrl.includes('loom.com') ? (
                      // Loom videos - show link with message
                      <div className="bg-muted/30 p-6 text-center space-y-3">
                        <div className="flex justify-center">
                          <div className="rounded-full bg-blue-500/10 p-3">
                            <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium mb-1">Loom Video Attached</p>
                          <p className="text-xs text-muted-foreground mb-3">
                            Loom videos cannot be embedded directly. Please click the link below to watch.
                          </p>
                          <a
                            href={item.videoIntroUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Watch on Loom
                          </a>
                        </div>
                      </div>
                    ) : (
                      // Regular video player for non-Loom videos
                      <div className="bg-black">
                        <video
                          controls
                          className="w-full max-h-80"
                          preload="metadata"
                          poster={item.photo || undefined}
                        >
                          <source src={item.videoIntroUrl} type="video/mp4" />
                          <source src={item.videoIntroUrl} type="video/webm" />
                          <source src={item.videoIntroUrl} type="video/ogg" />
                        </video>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Application Notes */}
          {item.notes && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold">Notes</h4>
              <div className="rounded-lg border bg-muted/30 p-4">
                <p className="text-sm leading-relaxed">{item.notes}</p>
              </div>
            </div>
          )}

          {/* Resume Full Text */}
          {item.resumeRawText && !showResumePreview && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold">Resume Full Text</h4>
              <div className="rounded-lg border bg-muted/30 p-4 max-h-96 overflow-y-auto">
                <pre className="text-xs whitespace-pre-wrap font-mono leading-relaxed text-muted-foreground">
                  {item.resumeRawText}
                </pre>
              </div>
            </div>
          )}
        </div>

        <DrawerFooter className="border-t p-4">
          <div className="flex gap-3 w-full">
            <Button
              onClick={async () => {
                setApprovalAction("approve");
                // Jobs are passed as prop, no need to refetch
                setShowJobSelectionModal(true);
              }}
              className="flex-1 h-11"
              disabled={
                item.status?.toLowerCase() === "approved" ||
                item.status?.toLowerCase() === "rejected"
              }
            >
              <IconCheck className="h-4 w-4 mr-2" />
              Approve
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                setApprovalAction("reject");
                // Jobs are passed as prop, no need to refetch
                setShowJobSelectionModal(true);
              }}
              className="flex-1 h-11"
              disabled={
                item.status?.toLowerCase() === "approved" ||
                item.status?.toLowerCase() === "rejected"
              }
            >
              <IconX className="h-4 w-4 mr-2" />
              Reject
            </Button>
          </div>
        </DrawerFooter>

        {/* Job Selection Modal */}
        {showJobSelectionModal && (
          <JobSelectionModal
            open={showJobSelectionModal}
            onClose={() => {
              setShowJobSelectionModal(false);
              setApprovalAction(null);
            }}
            onConfirm={handleJobConfirmation}
            jobs={jobs}
            applicationName={item.header}
          />
        )}
      </DrawerContent>
    </Drawer>
  );
}
