import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Briefcase, Building2 } from "lucide-react";
import { useEffect, useState } from "react";

interface Job {
  _id?: string;
  id?: string; // Some APIs use id instead of _id
  title: string;
  clientId:
    | string
    | {
        _id?: string;
        id?: string;
        companyName: string;
      };
}

interface JobSelectionModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (jobId: string, clientId: string) => void;
  jobs: Job[];
  currentJobId?: string;
  applicationName?: string;
  isDirectApplication?: boolean; // Whether this is a direct application with pre-selected job
}

export function JobSelectionModal({
  open,
  onClose,
  onConfirm,
  jobs,
  currentJobId,
  applicationName = "this application",
  isDirectApplication = false,
}: JobSelectionModalProps) {
  const [selectedJobId, setSelectedJobId] = useState<string>("");

  // Helper function to get job ID (handles both _id and id)
  const getJobId = (job: Job) => job._id || job.id || "";

  // Reset selection when modal opens, auto-select for direct applications
  useEffect(() => {
    if (open) {
      setSelectedJobId(currentJobId || "");
    }
  }, [open, currentJobId, jobs]);

  // Filter jobs based on whether it's a direct application
  const availableJobs = isDirectApplication && currentJobId
    ? jobs.filter((job) => getJobId(job) === currentJobId)
    : jobs;

  const selectedJob = jobs.find((job) => getJobId(job) === selectedJobId);

  const clientId = selectedJob?.clientId
    ? typeof selectedJob.clientId === "string"
      ? selectedJob.clientId
      : selectedJob.clientId._id || selectedJob.clientId.id || ""
    : "";

  const handleConfirm = () => {
    if (selectedJobId && clientId) {
      onConfirm(selectedJobId, clientId);
      setSelectedJobId(""); // Reset after confirm
      onClose();
    }
  };

  const handleClose = () => {
    setSelectedJobId(""); // Reset on close
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Select Job for Application</DialogTitle>
          <DialogDescription>
            {isDirectApplication ? (
              <>
                <strong>{applicationName}</strong> applied directly for this job. The job is pre-selected and the client will be automatically assigned.
              </>
            ) : (
              <>
                Choose which job {applicationName} is applying for. The client will be automatically assigned based on the job selection.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="job-select">Job Position *</Label>
            <Select
              value={selectedJobId}
              onValueChange={(value) => {
                setSelectedJobId(value);
              }}
              disabled={isDirectApplication}
            >
              <SelectTrigger id="job-select" className="w-full">
                {selectedJobId && selectedJob ? (
                  <div className="flex items-center justify-between gap-4 w-full">
                    <span className="font-medium truncate">
                      {selectedJob.title}
                    </span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {typeof selectedJob.clientId === "object"
                        ? selectedJob.clientId.companyName
                        : "Unknown Client"}
                    </span>
                  </div>
                ) : (
                  <span className="text-muted-foreground">
                    Select a job position
                  </span>
                )}
              </SelectTrigger>
              <SelectContent position="popper" className="max-h-[300px]">
                {availableJobs.length === 0 ? (
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    No jobs available
                  </div>
                ) : (
                  availableJobs.map((job) => {
                    const jobId = getJobId(job);
                    const clientName =
                      typeof job.clientId === "object"
                        ? job.clientId.companyName
                        : "Unknown Client";
                    return (
                      <SelectItem
                        key={jobId}
                        value={jobId}
                        className="cursor-pointer"
                      >
                        <div className="flex items-center justify-between gap-4 w-full">
                          <span className="font-medium truncate">
                            {job.title}
                          </span>
                          <span className="text-xs text-muted-foreground shrink-0">
                            {clientName}
                          </span>
                        </div>
                      </SelectItem>
                    );
                  })
                )}
              </SelectContent>
            </Select>
          </div>

          {selectedJob && (
            <div className="rounded-lg border bg-muted/50 p-3 space-y-3">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Building2 className="h-3.5 w-3.5" />
                  <span className="font-medium">Client</span>
                </div>
                <p className="text-sm pl-5 break-word">
                  {typeof selectedJob.clientId === "object"
                    ? selectedJob.clientId.companyName
                    : "Unknown Client"}
                </p>
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Briefcase className="h-3.5 w-3.5" />
                  <span className="font-medium">Position</span>
                </div>
                <p className="text-sm pl-5 break-word">{selectedJob.title}</p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedJobId || !clientId}
          >
            Confirm & Approve
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
