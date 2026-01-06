import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

/**
 * Redirect component that converts old candidate route patterns to the new standardized format.
 * Old: /dashboard/jobs/:jobId/candidates/:candidateId
 * Old: /dashboard/clients/:clientId/jobs/:jobId/candidates/:candidateId  
 * New: /dashboard/candidates/:candidateId?jobId=X&clientId=Y
 */
export function CandidateRouteRedirect() {
  const { jobId, candidateId, clientId } = useParams<{
    jobId?: string;
    candidateId?: string;
    clientId?: string;
  }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (candidateId) {
      const params = new URLSearchParams();
      if (jobId) params.append('jobId', jobId);
      if (clientId) params.append('clientId', clientId);
      
      const queryString = params.toString();
      const newPath = `/dashboard/candidates/${candidateId}${queryString ? `?${queryString}` : ''}`;
      
      navigate(newPath, { replace: true });
    }
  }, [candidateId, jobId, clientId, navigate]);

  return null; // Component just redirects, no UI
}
