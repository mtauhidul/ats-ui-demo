import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { InterviewManagement } from "@/components/interview-management";
import { useCandidate, useJob, useClient } from "@/hooks/firestore";
import { Loader2 } from "lucide-react";

export default function InterviewPage() {
  const { jobId: jobIdParam, candidateId, clientId: clientIdParam } = useParams<{ jobId?: string; candidateId?: string; clientId?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Support both route params (old) and query params (new)
  const jobId = jobIdParam || searchParams.get('jobId') || undefined;
  const clientId = clientIdParam || searchParams.get('clientId') || undefined;
  
  // Get realtime data from Firestore hooks
  const { candidate, loading: candidateLoading } = useCandidate(candidateId);
  const { job, loading: jobLoading } = useJob(jobId);
  
  // Get client ID from job
  const resolvedClientId = typeof job?.clientId === 'string' 
    ? job.clientId 
    : job?.clientId?.id || job?.clientId?._id || clientId;
  
  const { client } = useClient(resolvedClientId);
  const clientName = client?.companyName || "Client";

  const handleBack = () => {
    // Support both old route params and new query params
    const jobIdParam = jobId || new URLSearchParams(window.location.search).get('jobId');
    const clientIdParam = clientId || new URLSearchParams(window.location.search).get('clientId');
    
    if (jobIdParam) {
      // If we have jobId, use standardized route with query params
      const params = new URLSearchParams();
      params.append('jobId', jobIdParam);
      if (clientIdParam) params.append('clientId', clientIdParam);
      navigate(`/dashboard/candidates/${candidateId}?${params.toString()}`);
    } else {
      // Fallback to candidates list
      navigate('/dashboard/candidates');
    }
  };

  // Show loading state
  if (candidateLoading || jobLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Show error state
  if (!candidate || !job) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">
          {!candidate ? "Candidate not found" : "Job not found"}
        </p>
      </div>
    );
  }

  return (
    <InterviewManagement
      candidate={candidate}
      job={job}
      clientName={clientName}
      onBack={handleBack}
    />
  );
}
