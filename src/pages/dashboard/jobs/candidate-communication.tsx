import { CandidateEmailCommunication } from "@/components/candidate-email-communication";
import { Button } from "@/components/ui/button";
import { useCandidates } from "@/store/hooks/useCandidates";
import { useJobs } from "@/store/hooks/useJobs";
import { ArrowLeft } from "lucide-react";
import { useEffect, useMemo } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

export default function JobCandidateCommunicationPage() {
  const navigate = useNavigate();
  const { jobId: jobIdParam, candidateId, clientId: clientIdParam } = useParams<{
    jobId?: string;
    candidateId?: string;
    clientId?: string;
  }>();
  const [searchParams] = useSearchParams();
  
  // Support both route params (old) and query params (new)
  const jobId = jobIdParam || searchParams.get('jobId') || undefined;
  const clientId = clientIdParam || searchParams.get('clientId') || undefined;
  
  // Get data from Firestore realtime subscriptions
  const { candidates, isLoading: candidatesLoading, setCurrentCandidate } = useCandidates();
  const { jobs, isLoading: jobsLoading, setCurrentJob } = useJobs();

  // Find candidate and job from Firestore data
  const currentCandidate = useMemo(() => 
    candidates.find((c) => c.id === candidateId),
    [candidates, candidateId]
  );

  const currentJob = useMemo(() => 
    jobs.find((j) => j.id === jobId),
    [jobs, jobId]
  );

  // Set current items in Redux when found
  useEffect(() => {
    if (currentCandidate) {
      setCurrentCandidate(currentCandidate);
    }
  }, [currentCandidate, setCurrentCandidate]);

  useEffect(() => {
    if (currentJob) {
      setCurrentJob(currentJob);
    }
  }, [currentJob, setCurrentJob]);

  // Show loading state
  if (candidatesLoading || jobsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (!currentJob || !currentCandidate) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">
            {!currentJob ? "Job not found" : "Candidate not found"}
          </h2>
          <Button onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-2 py-2 md:gap-3 md:py-3">
          <div className="px-2 lg:px-3">
            <CandidateEmailCommunication
              candidate={currentCandidate}
              job={currentJob}
              onBack={() => {
                const params = new URLSearchParams();
                if (jobId) params.append('jobId', jobId);
                if (clientId) params.append('clientId', clientId);
                navigate(`/dashboard/candidates/${candidateId}${params.toString() ? `?${params.toString()}` : ''}`);
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
