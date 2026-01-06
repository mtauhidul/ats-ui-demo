import { JobCandidateDetails } from "@/components/job-candidate-details";
import { useCandidates } from "@/store/hooks/useCandidates";
import { useJobs } from "@/store/hooks/useJobs";
import { useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";

export default function JobCandidateDetailPage() {
  const { jobId, candidateId, clientId } = useParams<{
    jobId: string;
    candidateId: string;
    clientId?: string;
  }>();
  const navigate = useNavigate();
  
  // Get data from Firestore realtime subscriptions
  const { candidates, isLoading: candidatesLoading, setCurrentCandidate } = useCandidates();
  const { jobs, isLoading: jobsLoading, setCurrentJob } = useJobs();

  // Find candidate and job from Firestore data
  const currentCandidate = useMemo(() => {
    const found = candidates.find((c) => c.id === candidateId);
    return found;
  }, [candidates, candidateId]);

  const currentJob = useMemo(() => {
    const found = jobs.find((j) => j.id === jobId);
    return found;
  }, [jobs, jobId]);

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

  const handleBack = () => {
    // Navigate to standardized candidate route with job context
    const params = new URLSearchParams();
    if (jobId) params.append('jobId', jobId);
    if (clientId) params.append('clientId', clientId);
    
    navigate(`/dashboard/candidates/${candidateId}?${params.toString()}`);
  };

  const handleInterviewClick = () => {
    if (clientId) {
      navigate(
        `/dashboard/clients/${clientId}/jobs/${jobId}/candidates/${candidateId}/interviews`
      );
    } else {
      navigate(`/dashboard/jobs/${jobId}/candidates/${candidateId}/interviews`);
    }
  };

  const handleEmailClick = () => {
    if (clientId) {
      navigate(
        `/dashboard/clients/${clientId}/jobs/${jobId}/candidates/${candidateId}/communication`
      );
    } else {
      navigate(
        `/dashboard/jobs/${jobId}/candidates/${candidateId}/communication`
      );
    }
  };

  // Show loading state
  if (candidatesLoading || jobsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  // Show error state
  if (!currentCandidate || !currentJob) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">
          {!currentCandidate ? "Candidate not found" : "Job not found"}
        </p>
      </div>
    );
  }

  return (
    <JobCandidateDetails
      candidate={currentCandidate}
      job={currentJob}
      onBack={handleBack}
      onInterviewClick={handleInterviewClick}
      onEmailClick={handleEmailClick}
    />
  );
}
