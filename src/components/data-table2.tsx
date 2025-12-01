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
  IconCheck,
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconCircleCheckFilled,
  IconClockHour4,
  IconDotsVertical,
  IconDownload,
  IconFileText,
  IconFilter,
  IconGripVertical,
  IconLayoutColumns,
  IconLoader,
  IconSearch,
  IconUserCheck,
  IconUsers,
  IconUserX,
  IconX,
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
import { toast } from "sonner";

import { z } from "zod";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { InputDialog } from "@/components/ui/input-dialog";
import {
  Drawer,
  DrawerClose,
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
import { useIsMobile } from "@/hooks/use-mobile";
import { analyzeVideoUrl, getVideoSourceName } from "@/lib/videoUtils";
import type { schema } from "./data-table-schema";

// Create a separate component for the drag handle
// Create a separate component for the drag handle
function DragHandle({ id }: { id: UniqueIdentifier }) {
  const { attributes, listeners } = useSortable({
    id,
  });

  return (
    <Button
      {...attributes}
      {...listeners}
      variant="ghost"
      size="icon"
      className="text-muted-foreground size-7 hover:bg-transparent"
    >
      <IconGripVertical className="text-muted-foreground size-3" />
      <span className="sr-only">Drag to reorder</span>
    </Button>
  );
}

const columns: ColumnDef<z.infer<typeof schema>>[] = [
  {
    id: "drag",
    header: () => null,
    cell: ({ row }) => <DragHandle id={row.original.id} />,
  },
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
        <div className="w-48">
          <TableCellViewer item={row.original} />
        </div>
      );
    },
    enableHiding: false,
  },
  {
    accessorKey: "type",
    header: "AI Recommendation",
    cell: ({ row }) => (
      <div className="w-28">
        <Badge
          variant="outline"
          className="text-muted-foreground px-2 py-1 flex items-center gap-1 text-xs"
        >
          {row.original.type === "valid" ? (
            <>
              <IconCircleCheckFilled className="size-3 fill-green-500 dark:fill-green-400" />
              Valid
            </>
          ) : (
            <>
              <span className="size-3 text-red-500">✕</span>
              Invalid
            </>
          )}
        </Badge>
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <div className="w-32">
        <Badge
          variant="outline"
          className="text-muted-foreground px-2 py-1 flex items-center gap-1"
        >
          {row.original.status === "Approved" ? (
            <>
              <IconCircleCheckFilled className="size-3 fill-green-500 dark:fill-green-400" />
              Approved
            </>
          ) : row.original.status === "Rejected" ? (
            <>
              <span className="size-3 text-red-500">✕</span>
              Rejected
            </>
          ) : (
            <>
              <IconLoader className="size-3" />
              In Process
            </>
          )}
        </Badge>
      </div>
    ),
  },
  {
    accessorKey: "target",
    header: () => <div className="w-full text-left">Date Applied</div>,
    cell: ({ row }) => {
      return (
        <div className="text-left text-sm w-32">
          {row.original.dateApplied || new Date().toLocaleDateString()}
        </div>
      );
    },
  },
  {
    accessorKey: "limit",
    header: () => <div className="w-full text-left">Job ID</div>,
    cell: ({ row }) => {
      return (
        <div className="text-left text-sm w-24">
          {row.original.jobIdDisplay || "-"}
        </div>
      );
    },
  },
  {
    accessorKey: "reviewer",
    header: "Reviewer",
    cell: ({ row }) => {
      const isAssigned =
        row.original.reviewer !== "Unassigned" &&
        row.original.reviewer !== "Assign reviewer";

      return (
        <div className="w-40">
          <Label htmlFor={`${row.original.id}-reviewer`} className="sr-only">
            Reviewer
          </Label>
          <Select
            defaultValue={isAssigned ? row.original.reviewer : undefined}
            onValueChange={(value) => {
              // Update the reviewer in the data
              // In a real app, this would update the backend/state
            }}
          >
            <SelectTrigger
              className="w-full **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate"
              size="sm"
              id={`${row.original.id}-reviewer`}
            >
              <SelectValue placeholder="Assign Reviewer" />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="Assign Reviewer" disabled>
                Assign Reviewer
              </SelectItem>
              <SelectItem value="John Smith">John Smith</SelectItem>
              <SelectItem value="Sarah Wilson">Sarah Wilson</SelectItem>
              <SelectItem value="Mike Johnson">Mike Johnson</SelectItem>
              <SelectItem value="Lisa Brown">Lisa Brown</SelectItem>
              <SelectItem value="Tom Davis">Tom Davis</SelectItem>
            </SelectContent>
          </Select>
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: () => null, // Will be populated with handlers in the component
  },
];

// Row actions column that needs access to handlers
const createActionsColumn = (handlers: {
  onApprove: (id: UniqueIdentifier) => void;
  onReject: (id: UniqueIdentifier) => void;
  onAssignReviewer: (id: UniqueIdentifier) => void;
  onDownloadResume: (id: UniqueIdentifier) => void;
  onDelete: (id: UniqueIdentifier) => void;
}): ColumnDef<z.infer<typeof schema>> => ({
  id: "actions",
  cell: ({ row }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
          size="icon"
        >
          <IconDotsVertical />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <div className="px-2 py-1.5 text-xs font-semibold text-primary-foreground bg-primary">
          ID #{row.original.id}
        </div>
        <DropdownMenuItem
          onClick={() => handlers.onApprove(row.original.id)}
          disabled={row.original.status === "Approved"}
        >
          <IconCheck className="h-3 w-3 mr-2 text-green-600" />
          Approve
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handlers.onReject(row.original.id)}
          disabled={row.original.status === "Rejected"}
        >
          <IconX className="h-3 w-3 mr-2 text-red-600" />
          Reject
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => handlers.onAssignReviewer(row.original.id)}
        >
          <IconUserCheck className="h-3 w-3 mr-2" />
          Assign Reviewer
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handlers.onDownloadResume(row.original.id)}
        >
          <IconDownload className="h-3 w-3 mr-2" />
          Download Resume
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onClick={() => handlers.onDelete(row.original.id)}
        >
          Delete Application
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
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
}: {
  data: z.infer<typeof schema>[];
}) {
  const [data, setData] = React.useState(() => initialData);
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [applicationToDelete, setApplicationToDelete] = React.useState<UniqueIdentifier | null>(null);
  const [assignReviewerDialogOpen, setAssignReviewerDialogOpen] = React.useState(false);
  const [bulkAssignReviewerDialogOpen, setBulkAssignReviewerDialogOpen] = React.useState(false);
  const [applicationIdForReviewer, setApplicationIdForReviewer] = React.useState<UniqueIdentifier | null>(null);
  const sortableId = React.useId();
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  );

  // Bulk action handlers
  const handleBulkApprove = () => {
    const selectedIds = table
      .getFilteredSelectedRowModel()
      .rows.map((r) => String(r.original.id));
    setData((prevData) =>
      prevData.map((item) =>
        selectedIds.includes(String(item.id))
          ? { ...item, status: "Approved" }
          : item
      )
    );
    table.resetRowSelection();
  };

  const handleBulkReject = () => {
    const selectedIds = table
      .getFilteredSelectedRowModel()
      .rows.map((r) => String(r.original.id));
    setData((prevData) =>
      prevData.map((item) =>
        selectedIds.includes(String(item.id))
          ? { ...item, status: "Rejected" }
          : item
      )
    );
    table.resetRowSelection();
  };

  const handleBulkAssignReviewer = () => {
    const selectedIds = table
      .getFilteredSelectedRowModel()
      .rows.map((r) => String(r.original.id));
    
    if (selectedIds.length === 0) {
      toast.error("No applications selected");
      return;
    }
    
    setBulkAssignReviewerDialogOpen(true);
  };

  const confirmBulkAssignReviewer = (reviewer: string) => {
    const selectedIds = table
      .getFilteredSelectedRowModel()
      .rows.map((r) => String(r.original.id));
    
    setData((prevData) =>
      prevData.map((item) =>
        selectedIds.includes(String(item.id)) ? { ...item, reviewer } : item
      )
    );
    table.resetRowSelection();
    toast.success(`Assigned ${reviewer} to ${selectedIds.length} application(s)`);
  };

  const handleBulkExport = () => {
    const selectedData = table
      .getFilteredSelectedRowModel()
      .rows.map((r) => r.original);
    // In real app, this would trigger file download
    toast.success(`Exporting ${selectedData.length} applications`);
  };

  // Individual action handlers
  const handleApprove = (id: UniqueIdentifier) => {
    setData((prevData) =>
      prevData.map((item) =>
        String(item.id) === String(id) ? { ...item, status: "Approved" } : item
      )
    );
  };

  const handleReject = (id: UniqueIdentifier) => {
    setData((prevData) =>
      prevData.map((item) =>
        String(item.id) === String(id) ? { ...item, status: "Rejected" } : item
      )
    );
  };

  const handleAssignReviewer = (id: UniqueIdentifier) => {
    setApplicationIdForReviewer(id);
    setAssignReviewerDialogOpen(true);
  };

  const confirmAssignReviewer = (reviewer: string) => {
    if (applicationIdForReviewer) {
      setData((prevData) =>
        prevData.map((item) =>
          String(item.id) === String(applicationIdForReviewer) ? { ...item, reviewer } : item
        )
      );
      toast.success(`Assigned ${reviewer} to application`);
    }
  };

  const handleDownloadResume = (id: UniqueIdentifier) => {
    const application = data.find((item) => String(item.id) === String(id));
    if (application?.resumeFilename) {
      const link = document.createElement("a");
      link.href = `/uploads/resumes/${application.resumeFilename}`;
      link.download = application.resumeFilename;
      link.click();
    } else {
      toast.error("No resume file available");
    }
  };

  const handleDelete = (id: UniqueIdentifier) => {
    setApplicationToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (applicationToDelete) {
      setData((prevData) =>
        prevData.filter((item) => String(item.id) !== String(applicationToDelete))
      );
      toast.success("Application deleted successfully");
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
      onAssignReviewer: handleAssignReviewer,
      onDownloadResume: handleDownloadResume,
      onDelete: handleDelete,
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
        row.original.header,
        row.original.email,
        row.original.phone,
        row.original.status,
        row.original.reviewer,
        row.original.jobIdDisplay,
        row.original.currentTitle,
        row.original.currentCompany,
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
    (item) => item.status === "Approved"
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
                placeholder="Search by name, email, job, company..."
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
                    <DropdownMenuItem onClick={handleBulkAssignReviewer}>
                      <IconUserCheck className="h-4 w-4 mr-2" />
                      Assign Reviewer
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
                    "Approved"
                  }
                  onCheckedChange={(checked) => {
                    setColumnFilters((prev) =>
                      checked
                        ? [
                            ...prev.filter((f) => f.id !== "status"),
                            { id: "status", value: "Approved" },
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
                    "In Process"
                  }
                  onCheckedChange={(checked) => {
                    setColumnFilters((prev) =>
                      checked
                        ? [
                            ...prev.filter((f) => f.id !== "status"),
                            { id: "status", value: "In Process" },
                          ]
                        : prev.filter((f) => f.id !== "status")
                    );
                  }}
                >
                  <IconClockHour4 className="h-3 w-3 mr-2 text-amber-600" />
                  In Process
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={
                    columnFilters.find((f) => f.id === "status")?.value ===
                    "Rejected"
                  }
                  onCheckedChange={(checked) => {
                    setColumnFilters((prev) =>
                      checked
                        ? [
                            ...prev.filter((f) => f.id !== "status"),
                            { id: "status", value: "Rejected" },
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
                    setSorting([{ id: "dateApplied", desc: true }])
                  }
                >
                  Date (Newest)
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    setSorting([{ id: "dateApplied", desc: false }])
                  }
                >
                  Date (Oldest)
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
                  checked={table.getColumn("target")?.getIsVisible()}
                  onCheckedChange={(value) =>
                    table.getColumn("target")?.toggleVisibility(!!value)
                  }
                >
                  Date Applied
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
      <TabsContent value="key-personnel" className="flex flex-col px-4 lg:px-6">
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
      </TabsContent>
      <TabsContent
        value="focus-documents"
        className="flex flex-col px-4 lg:px-6"
      >
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
      </TabsContent>
    </Tabs>

    {/* Dialogs */}
    <ConfirmationDialog
      open={deleteDialogOpen}
      onOpenChange={setDeleteDialogOpen}
      title="Delete Application"
      description="Are you sure you want to delete this application? This action cannot be undone."
      confirmText="Delete"
      cancelText="Cancel"
      onConfirm={confirmDelete}
      variant="destructive"
    />

    <InputDialog
      open={assignReviewerDialogOpen}
      onOpenChange={setAssignReviewerDialogOpen}
      title="Assign Reviewer"
      description="Enter the name of the reviewer to assign to this application."
      label="Reviewer Name"
      placeholder="Enter reviewer name"
      onConfirm={confirmAssignReviewer}
      confirmText="Assign"
      cancelText="Cancel"
    />

    <InputDialog
      open={bulkAssignReviewerDialogOpen}
      onOpenChange={setBulkAssignReviewerDialogOpen}
      title="Assign Reviewer"
      description="Enter the name of the reviewer to assign to selected applications."
      label="Reviewer Name"
      placeholder="Enter reviewer name"
      onConfirm={confirmBulkAssignReviewer}
      confirmText="Assign"
      cancelText="Cancel"
    />
    </>
  );
}

function TableCellViewer({ item }: { item: z.infer<typeof schema> }) {
  const isMobile = useIsMobile();
  const [showResumePreview, setShowResumePreview] = React.useState(false);
  const [showJobAssignDialog, setShowJobAssignDialog] = React.useState(false);
  const [selectedJobId, setSelectedJobId] = React.useState<string>(
    item.jobIdDisplay || ""
  );
  const [searchQuery, setSearchQuery] = React.useState("");

  // Load jobs data
  const [jobs, setJobs] = React.useState<
    Array<{ id: string; title: string; clientId: string }>
  >([]);

  React.useEffect(() => {
    // Load jobs from mock data
    import("@/lib/mock-data/jobs.json").then((data) => {
      setJobs(
        data.default.map(
          (job: { id: string; title: string; clientId: string }) => ({
            id: job.id,
            title: job.title,
            clientId: job.clientId,
          })
        )
      );
    });
  }, []);

  // Filter jobs based on search query
  const filteredJobs = React.useMemo(() => {
    if (!searchQuery) return jobs;
    const query = searchQuery.toLowerCase();
    return jobs.filter(
      (job) =>
        job.title.toLowerCase().includes(query) ||
        job.id.toLowerCase().includes(query)
    );
  }, [jobs, searchQuery]);

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
          <IconLoader className="h-3 w-3 mr-1 animate-spin" />
          In Process
        </Badge>
      );
    }
  };

  // Helper function to get AI status badge
  const getAIStatusBadge = (type: string) => {
    const isValid = type === "valid";
    return isValid ? (
      <Badge className="bg-green-500/10 text-green-700 dark:bg-green-500/20 dark:text-green-400 border-green-500/20 hover:bg-green-500/20">
        <IconCircleCheckFilled className="h-3 w-3 mr-1" />
        AI Approved
      </Badge>
    ) : (
      <Badge className="bg-red-500/10 text-red-700 dark:bg-red-500/20 dark:text-red-400 border-red-500/20 hover:bg-red-500/20">
        <IconX className="h-3 w-3 mr-1" />
        AI Rejected
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
          className="text-foreground w-fit px-0 text-left"
        >
          {item.header}
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
            <Avatar className="h-14 w-14 border-2 rounded-lg">
              <AvatarImage src={item.photo || ""} className="object-cover" />
              <AvatarFallback className="text-base font-semibold">
                {item.header
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
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
                {getStatusBadge(item.status)}
                {getAIStatusBadge(item.type)}
                {item.isValidResume !== undefined &&
                  item.isValidResume !== null &&
                  (item.isValidResume ? (
                    <Badge className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20 text-xs px-2 py-0.5">
                      <svg
                        className="w-3 h-3 mr-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Valid
                    </Badge>
                  ) : (
                    <Badge className="bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20 text-xs px-2 py-0.5">
                      <svg
                        className="w-3 h-3 mr-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                      </svg>
                      Invalid
                    </Badge>
                  ))}
              </div>
            </div>
          </div>

          {/* Quick Info Grid */}
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
              <Label className="text-xs text-muted-foreground">Job ID</Label>
              <p className="text-sm font-medium font-mono mt-1">
                {item.jobIdDisplay || "N/A"}
              </p>
            </div>
            <div className="rounded-lg border bg-lime-500/10 dark:bg-lime-500/10 border-lime-500/20 p-3">
              <Label className="text-xs text-lime-700 dark:text-lime-400 font-medium">
                Reviewer
              </Label>
              <p className="text-sm font-semibold text-lime-800 dark:text-lime-300 mt-1 truncate">
                {item.reviewer}
              </p>
            </div>
            {item.yearsOfExperience ? (
              <div className="rounded-lg border bg-card p-3">
                <Label className="text-xs text-muted-foreground">
                  Experience
                </Label>
                <p className="text-sm font-medium mt-1">
                  {item.yearsOfExperience} years
                </p>
              </div>
            ) : item.parsedData?.experience &&
              item.parsedData.experience.length > 0 ? (
              <div className="rounded-lg border bg-card p-3">
                <Label className="text-xs text-muted-foreground">
                  Experience
                </Label>
                <p className="text-sm font-medium mt-1">
                  {item.parsedData.experience.length}{" "}
                  {item.parsedData.experience.length === 1
                    ? "position"
                    : "positions"}
                </p>
              </div>
            ) : null}
          </div>

          {/* AI Resume Validation Status */}
          {item.isValidResume !== undefined && item.isValidResume !== null && (
            <div
              className="rounded-lg border p-4 space-y-2"
              style={{
                borderColor: item.isValidResume
                  ? "rgb(34 197 94 / 0.2)"
                  : "rgb(239 68 68 / 0.2)",
                backgroundColor: item.isValidResume
                  ? "rgb(34 197 94 / 0.05)"
                  : "rgb(239 68 68 / 0.05)",
              }}
            >
              <div className="flex items-center gap-2">
                {item.isValidResume ? (
                  <>
                    <div className="flex items-center justify-center w-5 h-5 rounded-full bg-green-500">
                      <svg
                        className="w-3 h-3 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <span className="text-sm font-semibold text-green-700 dark:text-green-400">
                      Valid Resume
                    </span>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-center w-5 h-5 rounded-full bg-red-500">
                      <svg
                        className="w-3 h-3 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </div>
                    <span className="text-sm font-semibold text-red-700 dark:text-red-400">
                      Invalid Resume
                    </span>
                  </>
                )}
                {item.validationScore !== undefined &&
                  item.validationScore !== null && (
                    <span
                      className="ml-auto text-xs font-mono font-medium px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: item.isValidResume
                          ? "rgb(34 197 94 / 0.2)"
                          : "rgb(239 68 68 / 0.2)",
                        color: item.isValidResume
                          ? "rgb(22 101 52)"
                          : "rgb(153 27 27)",
                      }}
                    >
                      {item.validationScore}/100
                    </span>
                  )}
              </div>
              {item.validationReason && (
                <p
                  className="text-xs leading-relaxed"
                  style={{
                    color: item.isValidResume
                      ? "rgb(22 101 52)"
                      : "rgb(153 27 27)",
                  }}
                >
                  {item.validationReason}
                </p>
              )}
            </div>
          )}

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
                    {showResumePreview && item.resumeUrl && (
                      <div className="border-t">
                        {item.resumeFilename?.toLowerCase().endsWith(".pdf") ||
                        item.resumeUrl.includes(".pdf") ? (
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
                        ) : item.resumeText || item.resumeRawText ? (
                          <div className="max-h-[500px] overflow-y-auto p-4 bg-muted/30">
                            <pre className="text-xs whitespace-pre-wrap leading-relaxed">
                              {item.resumeText || item.resumeRawText}
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
                {item.videoIntroUrl && (() => {
                  const videoInfo = analyzeVideoUrl(item.videoIntroUrl);
                  const sourceName = getVideoSourceName(videoInfo);
                  
                  return (
                    <div className="rounded-lg border overflow-hidden">
                      <div className="px-4 py-2.5 bg-muted/50 border-b flex items-center justify-between">
                        <Label className="text-xs font-medium">
                          {sourceName}
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
                      
                      {videoInfo.canEmbed ? (
                        videoInfo.type === 'google-drive' ? (
                          // Google Drive embedded video
                          <div className="bg-black aspect-video">
                            <iframe
                              src={videoInfo.embedUrl}
                              className="w-full h-full"
                              allow="autoplay; fullscreen"
                              sandbox="allow-same-origin allow-scripts"
                              title="Google Drive Video"
                            />
                          </div>
                        ) : (
                          // Direct video file player
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
                        )
                      ) : (
                        // External link (Loom, Dropbox, OneDrive, etc.)
                        <div className="bg-muted/30 p-6 text-center space-y-3">
                          <div className="flex justify-center">
                            <div className="rounded-full bg-blue-500/10 p-3">
                              <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-medium mb-1">{sourceName}</p>
                            <p className="text-xs text-muted-foreground mb-3">
                              Click the link below to watch the video.
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
                              Watch Video
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
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
          {item.resumeText && !showResumePreview && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold">Resume Full Text</h4>
              <div className="rounded-lg border bg-muted/30 p-4 max-h-96 overflow-y-auto">
                <pre className="text-xs whitespace-pre-wrap font-mono leading-relaxed text-muted-foreground">
                  {item.resumeText}
                </pre>
              </div>
            </div>
          )}
        </div>

        <DrawerFooter className="border-t p-4">
          {showJobAssignDialog ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="job-select" className="text-sm font-semibold">
                  Assign to Job <span className="text-destructive">*</span>
                </Label>
                <p className="text-xs text-muted-foreground">
                  {item.jobIdDisplay && item.jobIdDisplay !== "-"
                    ? `Current assignment: ${item.jobIdDisplay}. You can change it below.`
                    : "Select a job to assign this application to"}
                </p>

                {/* Search Input */}
                <div className="relative">
                  <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search jobs by title or ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                {/* Jobs List */}
                <div className="border rounded-md max-h-[200px] overflow-y-auto">
                  {filteredJobs.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      {searchQuery
                        ? "No jobs found matching your search"
                        : "No jobs available"}
                    </div>
                  ) : (
                    <div className="divide-y">
                      {filteredJobs.map((job) => (
                        <button
                          key={job.id}
                          type="button"
                          onClick={() => setSelectedJobId(job.id)}
                          className={`w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors ${
                            selectedJobId === job.id
                              ? "bg-primary/10 border-l-2 border-l-primary"
                              : ""
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm truncate">
                                {job.title}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                ID: {job.id}
                              </div>
                            </div>
                            {selectedJobId === job.id && (
                              <IconCircleCheckFilled className="h-5 w-5 text-primary shrink-0" />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {selectedJobId && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded-md">
                    <IconCircleCheckFilled className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">
                      Selected:{" "}
                      {jobs.find((j) => j.id === selectedJobId)?.title ||
                        selectedJobId}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex gap-3 w-full">
                <Button
                  onClick={() => {
                    if (!selectedJobId) {
                      toast.error("Please select a job before approving");
                      return;
                    }
                    const selectedJob = jobs.find(
                      (j) => j.id === selectedJobId
                    );
                    setShowJobAssignDialog(false);
                    // In real app, this would update the backend
                    toast.success(
                      `Application approved and assigned to:\n${selectedJob?.title} (${selectedJobId})`
                    );
                  }}
                  className="flex-1 h-11"
                  disabled={!selectedJobId}
                >
                  <IconCheck className="h-4 w-4 mr-2" />
                  Confirm Approval
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowJobAssignDialog(false);
                    setSearchQuery("");
                  }}
                  className="flex-1 h-11"
                >
                  <IconX className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex gap-3 w-full">
              <Button
                onClick={() => {
                  // Pre-select the current job if it exists
                  if (item.jobIdDisplay && item.jobIdDisplay !== "-") {
                    setSelectedJobId(item.jobIdDisplay);
                  } else {
                    setSelectedJobId("");
                  }
                  setShowJobAssignDialog(true);
                }}
                className="flex-1 h-11"
                disabled={item.status === "Done"}
              >
                <IconCheck className="h-4 w-4 mr-2" />
                Approve
              </Button>
              <DrawerClose asChild>
                <Button
                  variant="outline"
                  onClick={() => {
                    }}
                  className="flex-1 h-11"
                  disabled={item.status === "Rejected"}
                >
                  <IconX className="h-4 w-4 mr-2" />
                  Reject
                </Button>
              </DrawerClose>
            </div>
          )}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
