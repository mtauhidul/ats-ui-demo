import { useParams, useNavigate } from "react-router-dom";
import { JobDetails } from "@/components/job-details";
import type { Candidate } from "@/types/candidate";
import type { UpdateJobRequest } from "@/types/job";
import { useJob } from "@/hooks/firestore";
import { useJobs, useClients, useCandidates } from "@/store/hooks/index";

export default function JobDetailPage() {
  const { jobId, clientId } = useParams<{ jobId: string; clientId?: string }>();
  const navigate = useNavigate();
  
  // Get realtime data from Firestore
  const { job, loading: jobLoading } = useJob(jobId);
  const { clients } = useClients();
  const { candidates } = useCandidates();
  
  // Get write operations from Redux hooks
  const { updateJob } = useJobs();

  // No useEffect needed - all data comes from Firestore realtime subscriptions!

  const handleBack = () => {
    if (clientId) {
      navigate(`/dashboard/clients/${clientId}`);
    } else {
      navigate("/dashboard/jobs");
    }
  };

  const handleCandidateClick = (candidate: Candidate) => {
    // Backend returns _id, frontend types expect id
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const candidateId = (candidate as any)._id || candidate.id;
    
    // Use standardized route with jobId and clientId as query params
    const params = new URLSearchParams();
    params.append('jobId', jobId!);
    if (clientId) {
      params.append('clientId', clientId);
    }
    
    navigate(`/dashboard/candidates/${candidateId}?${params.toString()}`);
  };

  const handleEditJob = async (jobIdParam: string, data: UpdateJobRequest) => {
    try {
      await updateJob(jobIdParam, data);
      // Firestore will automatically update the job data in realtime
    } catch (error) {
      }
  };

  // Get client name
  const client = clients.find(c => {
    // Handle both id and _id
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const clientId = c.id || (c as any)._id;
    const jobClientId = typeof job?.clientId === 'string' ? job.clientId : job?.clientId?.id || job?.clientId?._id;
    return clientId === jobClientId;
  });
  
  let clientName = "Unknown Client";
  if (client?.companyName) {
    clientName = client.companyName;
  } else if (typeof job?.clientId === 'object' && job.clientId.companyName) {
    clientName = job.clientId.companyName;
  }

  // Show loading state while fetching from Firestore
  if (jobLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading job...</p>
      </div>
    );
  }

  // Check if job exists in Firestore
  if (!job) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Job not found</p>
      </div>
    );
  }

  return (
    <JobDetails
      job={job}
      clients={clients}
      candidates={candidates}
      clientName={clientName}
      onBack={handleBack}
      onCandidateClick={handleCandidateClick}
      onEditJob={handleEditJob}
    />
  );
}
