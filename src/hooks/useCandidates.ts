import { useMemo } from 'react';
import type { Candidate } from '@/types';
import {
  useFirestoreCollection,
  where,
  type UseFirestoreCollectionResult,
} from './useFirestore';
import type { DocumentData } from 'firebase/firestore';
import { useAuth } from './useAuth';

/**
 * Transform Firestore document to Candidate type
 * Converts Firestore Timestamps to JavaScript Date objects
 */
function transformCandidateDocument(doc: DocumentData): Candidate {
  // Helper to convert Firestore Timestamp to Date
  const toDate = (value: unknown): Date | undefined => {
    if (!value) return undefined;
    // Firestore Timestamp has toDate() method
    if (typeof value === 'object' && value !== null && 'toDate' in value && typeof (value as { toDate: unknown }).toDate === 'function') {
      return ((value as { toDate: () => Date }).toDate());
    }
    // Already a Date
    if (value instanceof Date) {
      return value;
    }
    // Try to parse as date
    if (typeof value === 'string' || typeof value === 'number') {
      const parsed = new Date(value);
      return isNaN(parsed.getTime()) ? undefined : parsed;
    }
    return undefined;
  };

  // Get current stage from first job application if not set at root level
  const currentStage = doc.currentStage || 
    (Array.isArray(doc.jobApplications) && doc.jobApplications.length > 0 
      ? doc.jobApplications[0].currentStage 
      : undefined);

  return {
    ...doc,
    id: doc.id,
    // Convert date fields from Firestore Timestamps
    createdAt: toDate(doc.createdAt),
    updatedAt: toDate(doc.updatedAt),
    hiredAt: toDate(doc.hiredAt),
    rejectedAt: toDate(doc.rejectedAt),
    // Set current stage from jobApplications if not at root
    currentStage,
    // Ensure arrays
    jobIds: Array.isArray(doc.jobIds) ? doc.jobIds : [],
    applicationIds: Array.isArray(doc.applicationIds) ? doc.applicationIds : [],
    jobApplications: Array.isArray(doc.jobApplications) ? doc.jobApplications : [],
    skills: Array.isArray(doc.skills) ? doc.skills : [],
    experience: Array.isArray(doc.experience) ? doc.experience : [],
    education: Array.isArray(doc.education) ? doc.education : [],
  } as unknown as Candidate;
}

/**
 * Hook to subscribe to all candidates with realtime updates
 */
export function useCandidates(options?: {
  enabled?: boolean;
  status?: string;
  jobId?: string;
}): UseFirestoreCollectionResult<Candidate> {
  const { enabled = true, status, jobId } = options || {};
  const { user } = useAuth();

  // Build query constraints
  const queryConstraints = useMemo(() => {
    const constraints = [];

    if (status) {
      constraints.push(where('status', '==', status));
    }

    if (jobId) {
      constraints.push(where('jobIds', 'array-contains', jobId));
    }

    // 🔒 RBAC: Users without canManageCandidates permission can only see candidates assigned to them
    const canManageAllCandidates = user?.role === 'admin' || user?.permissions?.canManageCandidates === true;
    if (user && !canManageAllCandidates && user.id) {
      constraints.push(where('assignedTo', '==', user.id));
    }

    // Note: orderBy removed to avoid Firestore index requirement
    // Candidates will be sorted client-side if needed

    return constraints;
  }, [status, jobId, user]);

  return useFirestoreCollection<Candidate>({
    collectionPath: 'candidates', // Root level collection
    queryConstraints,
    enabled,
    transform: transformCandidateDocument,
  });
}

/**
 * Hook to subscribe to a single candidate with realtime updates
 */
export function useCandidate(candidateId: string | null | undefined): {
  candidate: Candidate | null;
  loading: boolean;
  error: Error | null;
  exists: boolean;
} {
  const enabled = !!candidateId;

  const { data: candidates, loading, error } = useCandidates({ enabled });

  const candidate = useMemo(() => {
    if (!candidateId || !candidates.length) return null;
    return candidates.find(c => c.id === candidateId) || null;
  }, [candidateId, candidates]);

  return {
    candidate,
    loading,
    error: error as Error | null,
    exists: !!candidate,
  };
}

/**
 * Hook to get candidates by job with realtime updates
 */
export function useCandidatesByJob(jobId: string | null, enabled = true): UseFirestoreCollectionResult<Candidate> {
  const shouldEnable = enabled && !!jobId;
  return useCandidates({ enabled: shouldEnable, jobId: jobId || undefined });
}

/**
 * Hook to get candidates by status with realtime updates
 */
export function useCandidatesByStatus(status: string, enabled = true): UseFirestoreCollectionResult<Candidate> {
  return useCandidates({ enabled, status });
}
