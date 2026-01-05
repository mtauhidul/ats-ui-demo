import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { CandidateEmailCommunication } from "./candidate-email-communication";
import type { Candidate } from "@/types/candidate";
import type { Job } from "@/types/job";

interface CandidateEmailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidate: Candidate | null;
  job: Job | null;
}

export function CandidateEmailModal({
  open,
  onOpenChange,
  candidate,
  job,
}: CandidateEmailModalProps) {
  if (!candidate || !job) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-[98vw] sm:max-w-[95vw] lg:max-w-[90vw] xl:max-w-[85vw] w-full h-[95vh] sm:h-[92vh] lg:h-[88vh] p-0 gap-0 overflow-hidden flex flex-col border-2"
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">
          Email Communication - {candidate.firstName} {candidate.lastName}
        </DialogTitle>
        <div className="flex-1 overflow-y-auto">
          <CandidateEmailCommunication
            candidate={candidate}
            job={job}
            onBack={() => onOpenChange(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
